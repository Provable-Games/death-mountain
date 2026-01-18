import {
  EQUIPMENT_SLOTS,
  applyGearSet,
  buildCandidates,
  buildUpdatedBag,
  cloneItem,
  EquipmentSlot,
  GearSuggestionResult,
  GearSuggestionScore,
  GearSuggestionWorkerResponse,
  describeSelection,
  evaluateSelections,
  getItemLabel,
  isBetterScore,
  isPerfectScore,
  itemsEqual,
  toScore,
} from '@/utils/gearSuggestionShared';
import type { Adventurer, Beast, Item } from '@/types/game';
import { calculateCombatResult } from '@/utils/combatSimulationCore';

const shouldLogSuggestions =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_GEAR_LOGS === 'true';

const logSuggestion = (...args: unknown[]) => {
  if (shouldLogSuggestions) {
    console.info('[GearSuggestion]', ...args);
  }
};

const supportsWorkers = () => typeof window !== 'undefined' && typeof Worker !== 'undefined';

const spawnWorker = (
  adventurer: Adventurer,
  beast: Beast,
  selections: Array<Partial<Record<EquipmentSlot, Item>>>,
) => new Promise<GearSuggestionWorkerResponse | null>((resolve, reject) => {
  const worker = new Worker(
    new URL('../workers/gearSuggestionWorker.ts', import.meta.url),
    { type: 'module' },
  );

  worker.onmessage = (event: MessageEvent<GearSuggestionWorkerResponse | null>) => {
    worker.terminate();
    resolve(event.data);
  };

  worker.onerror = (event) => {
    worker.terminate();
    reject(event);
  };

  worker.postMessage({ adventurer, beast, selections });
});

const chunkSelections = <T,>(array: T[], chunkSize: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Generate single-slot change selections for greedy pre-screening.
 * These are the simplest possible improvements.
 */
const gatherSingleSlotSelections = (
  adventurer: Adventurer,
  candidates: Record<EquipmentSlot, Item[]>,
): Array<Partial<Record<EquipmentSlot, Item>>> => {
  const selections: Array<Partial<Record<EquipmentSlot, Item>>> = [];

  EQUIPMENT_SLOTS.forEach((slot) => {
    candidates[slot].forEach((candidate) => {
      if (!itemsEqual(candidate, adventurer.equipment[slot])) {
        selections.push({ [slot]: cloneItem(candidate) });
      }
    });
  });

  return selections;
};

const gatherLoadouts = (
  adventurer: Adventurer,
  candidates: Record<EquipmentSlot, Item[]>,
) => {
  const slots = EQUIPMENT_SLOTS;
  const loadoutSelections: Array<Partial<Record<EquipmentSlot, Item>>> = [];
  const seenSelections = new Set<string>();
  const currentSelection: Partial<Record<EquipmentSlot, Item>> = {};

  const explore = (index: number) => {
    if (index >= slots.length) {
      const changeCount = slots.reduce((acc, slot) => (
        currentSelection[slot] && !itemsEqual(currentSelection[slot]!, adventurer.equipment[slot])
          ? acc + 1
          : acc
      ), 0);

      if (changeCount > 0) {
        const selectionSnapshot = slots.reduce<Partial<Record<EquipmentSlot, Item>>>((acc, slot) => {
          if (currentSelection[slot] && !itemsEqual(currentSelection[slot]!, adventurer.equipment[slot])) {
            acc[slot] = cloneItem(currentSelection[slot]!);
          }
          return acc;
        }, {});

        const selectionKey = describeSelection(selectionSnapshot).sort().join('|');
        if (!seenSelections.has(selectionKey)) {
          seenSelections.add(selectionKey);
          loadoutSelections.push(selectionSnapshot);
        }
      }

      return;
    }

    const slot = slots[index];
    const slotCandidates = candidates[slot];

    delete currentSelection[slot];
    explore(index + 1);

    slotCandidates.forEach((candidate) => {
      if (itemsEqual(candidate, adventurer.equipment[slot])) {
        return;
      }

      currentSelection[slot] = candidate;
      explore(index + 1);
      delete currentSelection[slot];
    });
  };

  explore(0);
  return loadoutSelections;
};

const mergeEvaluationResults = (
  baseScore: GearSuggestionScore,
  baseChangeCount: number,
  bestScore: GearSuggestionScore | null,
  bestSelection: Partial<Record<EquipmentSlot, Item>> | null,
  bestChangeCount: number,
) => {
  if (!bestScore || !bestSelection) {
    return { score: baseScore, selection: null, changeCount: baseChangeCount };
  }

  if (isBetterScore(bestScore, baseScore) || (bestChangeCount < baseChangeCount && !isBetterScore(baseScore, bestScore))) {
    return { score: bestScore, selection: bestSelection, changeCount: bestChangeCount };
  }

  return { score: baseScore, selection: null, changeCount: baseChangeCount };
};

const evaluateWithWorkers = async (
  adventurer: Adventurer,
  beast: Beast,
  selections: Array<Partial<Record<EquipmentSlot, Item>>>,
) => {
  if (!supportsWorkers() || selections.length === 0) {
    return null;
  }

  const hardwareThreads = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4;
  const workerCount = Math.min(Math.max(1, Math.floor(hardwareThreads / 2)), selections.length);
  const chunkSize = Math.ceil(selections.length / workerCount);
  const chunks = chunkSelections(selections, chunkSize);

  const responses = await Promise.allSettled(chunks.map((chunk) => spawnWorker(adventurer, beast, chunk)));

  let bestScore: GearSuggestionScore | null = null;
  let bestSelection: Partial<Record<EquipmentSlot, Item>> | null = null;
  let bestChangeCount = Number.POSITIVE_INFINITY;

  responses.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      const { score, selection, changeCount } = result.value;
      if (!bestScore || isBetterScore(score, bestScore) || (changeCount < bestChangeCount && !isBetterScore(bestScore, score))) {
        bestScore = score;
        bestSelection = selection;
        bestChangeCount = changeCount;
      }
    } else if (result.status === 'rejected') {
      console.error('Gear suggestion worker failed', result.reason);
    }
  });

  if (!bestScore || !bestSelection) {
    return null;
  }

  return {
    score: bestScore,
    selection: bestSelection,
    changeCount: bestChangeCount,
  };
};

export const suggestBestCombatGear = async (
  adventurer: Adventurer | null,
  bag: Item[] | null,
  beast: Beast | null,
): Promise<GearSuggestionResult | null> => {
  if (!adventurer || !bag || !beast) {
    logSuggestion('Missing data', { hasAdventurer: !!adventurer, hasBag: !!bag, hasBeast: !!beast });
    return null;
  }

  const candidates = buildCandidates(adventurer, bag, beast);

  logSuggestion('Candidate pool sizes', EQUIPMENT_SLOTS.reduce<Record<string, number>>((acc, slot) => {
    acc[slot] = candidates[slot].length;
    return acc;
  }, {}));

  EQUIPMENT_SLOTS.forEach((slot) => {
    logSuggestion(`Candidates for ${slot}`, candidates[slot].map((item) => getItemLabel(item)));
  });

  const baseResult = calculateCombatResult(adventurer, beast, { initialBeastStrike: false });
  let bestScore = toScore(baseResult);
  let bestSelection: Partial<Record<EquipmentSlot, Item>> | null = null;
  let bestChangeCount = 0;

  logSuggestion('Baseline score', {
    score: bestScore,
  });

  // Phase 1: Greedy pre-screening with single-slot changes
  // This is fast and can find optimal solutions quickly for easy fights
  const singleSlotSelections = gatherSingleSlotSelections(adventurer, candidates);

  logSuggestion('Single-slot selections for greedy pre-screening', {
    count: singleSlotSelections.length,
  });

  if (singleSlotSelections.length > 0) {
    const greedyResult = evaluateSelections(adventurer, beast, singleSlotSelections, true);

    if (greedyResult) {
      const merged = mergeEvaluationResults(bestScore, bestChangeCount, greedyResult.score, greedyResult.selection, greedyResult.changeCount);
      if (merged.selection) {
        bestScore = merged.score;
        bestSelection = merged.selection;
        bestChangeCount = merged.changeCount;

        // Early termination: if we found a perfect single-slot solution, return immediately
        if (isPerfectScore(bestScore)) {
          logSuggestion('Found perfect single-slot solution, skipping combinatorial search', {
            score: bestScore,
            changes: describeSelection(bestSelection),
          });

          const updatedAdventurer = applyGearSet(adventurer, bestSelection);
          const updatedBag = buildUpdatedBag(adventurer, bag, bestSelection);
          const changedSlots = Object.keys(bestSelection) as EquipmentSlot[];

          return {
            adventurer: updatedAdventurer,
            bag: updatedBag,
            score: bestScore,
            changes: changedSlots,
          } satisfies GearSuggestionResult;
        }
      }
    }
  }

  // Phase 2: Full combinatorial search (only if greedy didn't find perfect solution)
  const loadoutSelections = gatherLoadouts(adventurer, candidates);

  logSuggestion('Generated loadout combinations', {
    count: loadoutSelections.length,
  });

  if (loadoutSelections.length === 0) {
    if (bestSelection) {
      // Return the greedy result if we found one
      const updatedAdventurer = applyGearSet(adventurer, bestSelection);
      const updatedBag = buildUpdatedBag(adventurer, bag, bestSelection);
      const changedSlots = Object.keys(bestSelection) as EquipmentSlot[];

      return {
        adventurer: updatedAdventurer,
        bag: updatedBag,
        score: bestScore,
        changes: changedSlots,
      } satisfies GearSuggestionResult;
    }

    logSuggestion('No alternative loadouts available');
    return null;
  }

  let evaluation: GearSuggestionWorkerResponse | null = await evaluateWithWorkers(adventurer, beast, loadoutSelections);

  if (!evaluation) {
    logSuggestion('Falling back to synchronous evaluation');
    evaluation = evaluateSelections(adventurer, beast, loadoutSelections) ?? null;
  }

  if (evaluation) {
    const merged = mergeEvaluationResults(bestScore, bestChangeCount, evaluation.score, evaluation.selection, evaluation.changeCount);
    if (merged.selection) {
      bestScore = merged.score;
      bestSelection = merged.selection;
      bestChangeCount = merged.changeCount;
    }
  }

  if (!bestSelection) {
    logSuggestion('No improvement found', { baseScore: bestScore });
    return null;
  }

  const updatedAdventurer = applyGearSet(adventurer, bestSelection);
  const updatedBag = buildUpdatedBag(adventurer, bag, bestSelection);

  logSuggestion('Final suggestion', {
    score: bestScore,
    changes: describeSelection(bestSelection),
  });

  const changedSlots = Object.keys(bestSelection) as EquipmentSlot[];

  return {
    adventurer: updatedAdventurer,
    bag: updatedBag,
    score: bestScore,
    changes: changedSlots,
  } satisfies GearSuggestionResult;
};

export const suggestBestCombatGearSync = (
  adventurer: Adventurer | null,
  bag: Item[] | null,
  beast: Beast | null,
): GearSuggestionResult | null => {
  if (!adventurer || !bag || !beast) {
    return null;
  }

  const candidates = buildCandidates(adventurer, bag, beast);
  const baseResult = calculateCombatResult(adventurer, beast, { initialBeastStrike: false });
  let bestScore = toScore(baseResult);
  let bestSelection: Partial<Record<EquipmentSlot, Item>> | null = null;
  let bestChangeCount = 0;

  const loadoutSelections = gatherLoadouts(adventurer, candidates);
  const evaluation = evaluateSelections(adventurer, beast, loadoutSelections);

  if (evaluation) {
    const merged = mergeEvaluationResults(bestScore, bestChangeCount, evaluation.score, evaluation.selection, evaluation.changeCount);
    if (merged.selection) {
      bestScore = merged.score;
      bestSelection = merged.selection;
    }
  }

  if (!bestSelection) {
    return null;
  }

  const updatedAdventurer = applyGearSet(adventurer, bestSelection);
  const updatedBag = buildUpdatedBag(adventurer, bag, bestSelection);

  return {
    adventurer: updatedAdventurer,
    bag: updatedBag,
    score: bestScore,
    changes: Object.keys(bestSelection) as EquipmentSlot[],
  };
};
