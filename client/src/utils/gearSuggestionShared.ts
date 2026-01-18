import { calculateAttackDamage, calculateBeastDamage } from '@/utils/game';
import { ItemUtils } from '@/utils/loot';
import type { Adventurer, Beast, Equipment, Item } from '@/types/game';
import { calculateCombatResult } from '@/utils/combatSimulationCore';

export type EquipmentSlot = keyof Equipment;

export interface GearSuggestionScore {
  winRate: number;
  modeDamageTaken: number;
  modeDamageDealt: number;
  maxDamageTaken: number;
  maxDamageDealt: number;
}

export interface GearSuggestionResult {
  adventurer: Adventurer;
  bag: Item[];
  score: GearSuggestionScore;
  changes: EquipmentSlot[];
}

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'head', 'chest', 'waist', 'hand', 'foot', 'neck', 'ring'];
export const ARMOR_SLOTS: EquipmentSlot[] = ['head', 'chest', 'waist', 'hand', 'foot'];

export const cloneItem = (item: Item): Item => ({ id: item.id, xp: item.xp });

export const cloneAdventurer = (adventurer: Adventurer): Adventurer => ({
  ...adventurer,
  stats: { ...adventurer.stats },
  equipment: Object.entries(adventurer.equipment).reduce<Equipment>((acc, [slot, item]) => {
    acc[slot as EquipmentSlot] = cloneItem(item as Item);
    return acc;
  }, {} as Equipment),
});

export const cloneBag = (bag: Item[]): Item[] => bag.map(cloneItem);

export const itemsEqual = (a: Item, b: Item) => a.id === b.id && a.xp === b.xp;

export const toScore = (result: ReturnType<typeof calculateCombatResult>): GearSuggestionScore => ({
  winRate: result.winRate,
  modeDamageTaken: result.modeDamageTaken,
  modeDamageDealt: result.modeDamageDealt,
  maxDamageTaken: result.maxDamageTaken,
  maxDamageDealt: result.maxDamageDealt,
});

export const isBetterScore = (candidate: GearSuggestionScore, current: GearSuggestionScore) => {
  if (candidate.winRate !== current.winRate) {
    return candidate.winRate > current.winRate;
  }

  if (candidate.modeDamageTaken !== current.modeDamageTaken) {
    return candidate.modeDamageTaken < current.modeDamageTaken;
  }

  if (candidate.modeDamageDealt !== current.modeDamageDealt) {
    return candidate.modeDamageDealt > current.modeDamageDealt;
  }

  if (candidate.maxDamageTaken !== current.maxDamageTaken) {
    return candidate.maxDamageTaken < current.maxDamageTaken;
  }

  if (candidate.maxDamageDealt !== current.maxDamageDealt) {
    return candidate.maxDamageDealt > current.maxDamageDealt;
  }

  return false;
};

export const applyGearSet = (
  adventurer: Adventurer,
  selection: Partial<Record<EquipmentSlot, Item>>,
): Adventurer => {
  const updated = cloneAdventurer(adventurer);
  let updatedStats = { ...adventurer.stats };

  EQUIPMENT_SLOTS.forEach((slot) => {
    const desiredItem = selection[slot] ?? adventurer.equipment[slot];
    const currentItem = adventurer.equipment[slot];

    if (itemsEqual(desiredItem, currentItem)) {
      return;
    }

    const equippedItem = updated.equipment[slot];

    if (equippedItem.id !== 0) {
      updatedStats = ItemUtils.removeItemBoosts(equippedItem, adventurer.item_specials_seed, updatedStats);
    }

    if (desiredItem.id !== 0) {
      updatedStats = ItemUtils.addItemBoosts(desiredItem, adventurer.item_specials_seed, updatedStats);
    }

    updated.equipment[slot] = cloneItem(desiredItem);
  });

  updated.stats = updatedStats;
  return updated;
};

export const removeItemOnce = (items: Item[], target: Item) => {
  const index = items.findIndex((item) => itemsEqual(item, target));
  if (index === -1) {
    return items;
  }

  return [...items.slice(0, index), ...items.slice(index + 1)];
};

export const buildUpdatedBag = (
  adventurer: Adventurer,
  bag: Item[],
  selection: Partial<Record<EquipmentSlot, Item>>,
): Item[] => {
  let updatedBag = cloneBag(bag);

  EQUIPMENT_SLOTS.forEach((slot) => {
    const desiredItem = selection[slot];
    const currentItem = adventurer.equipment[slot];

    if (!desiredItem || itemsEqual(desiredItem, currentItem)) {
      return;
    }

    if (desiredItem.id !== 0) {
      updatedBag = removeItemOnce(updatedBag, desiredItem);
    }

    if (currentItem.id !== 0) {
      updatedBag = [...updatedBag, cloneItem(currentItem)];
    }
  });

  return updatedBag;
};

export const getSlotKey = (item: Item): EquipmentSlot => {
  const slot = ItemUtils.getItemSlot(item.id).toLowerCase();
  switch (slot) {
    case 'weapon':
    case 'head':
    case 'chest':
    case 'waist':
    case 'hand':
    case 'foot':
    case 'neck':
    case 'ring':
      return slot;
    default:
      return 'weapon';
  }
};

export const candidateSorter = (
  slot: EquipmentSlot,
  adventurer: Adventurer,
  beast: Beast,
) => (a: Item, b: Item) => {
  if (itemsEqual(a, adventurer.equipment[slot]) && !itemsEqual(b, adventurer.equipment[slot])) {
    return -1;
  }

  if (!itemsEqual(a, adventurer.equipment[slot]) && itemsEqual(b, adventurer.equipment[slot])) {
    return 1;
  }

  if (slot === 'weapon') {
    const aDamage = calculateAttackDamage(a, adventurer, beast).baseDamage;
    const bDamage = calculateAttackDamage(b, adventurer, beast).baseDamage;
    return bDamage - aDamage;
  }

  if (ARMOR_SLOTS.includes(slot)) {
    const aDamageTaken = calculateBeastDamage(beast, adventurer, a).baseDamage;
    const bDamageTaken = calculateBeastDamage(beast, adventurer, b).baseDamage;
    return aDamageTaken - bDamageTaken;
  }

  const aLevel = ItemUtils.getItemTier(a.id);
  const bLevel = ItemUtils.getItemTier(b.id);

  if (bLevel !== aLevel) {
    return bLevel - aLevel;
  }

  return b.xp - a.xp;
};

export const buildCandidates = (
  adventurer: Adventurer,
  bag: Item[],
  beast: Beast,
) => {
  const candidates: Record<EquipmentSlot, Item[]> = {
    weapon: [],
    head: [],
    chest: [],
    waist: [],
    hand: [],
    foot: [],
    neck: [],
    ring: [],
  };

  EQUIPMENT_SLOTS.forEach((slot) => {
    candidates[slot].push(cloneItem(adventurer.equipment[slot]));
  });

  bag.forEach((item) => {
    const slot = getSlotKey(item);
    candidates[slot].push(cloneItem(item));
  });

  EQUIPMENT_SLOTS.forEach((slot) => {
    const unique = candidates[slot].filter((candidate, index, array) => (
      array.findIndex((other) => itemsEqual(candidate, other)) === index
    ));

    const comparator = candidateSorter(slot, adventurer, beast);
    const sorted = unique.sort(comparator);

    if (slot === 'weapon') {
      let bestDamage = Number.NEGATIVE_INFINITY;
      const best: Item[] = [];

      sorted.forEach((candidate) => {
        const damage = calculateAttackDamage(candidate, adventurer, beast).baseDamage;

        if (damage > bestDamage) {
          bestDamage = damage;
          best.length = 0;
          best.push(candidate);
          return;
        }

        if (damage === bestDamage) {
          best.push(candidate);
        }
      });

      candidates[slot] = best;
      return;
    }

    if (ARMOR_SLOTS.includes(slot)) {
      const bestByType = new Map<string, { item: Item; damage: number; tier: number; xp: number }>();

      sorted.forEach((candidate) => {
        const typeKey = ItemUtils.getItemType(candidate.id);
        const damage = calculateBeastDamage(beast, adventurer, candidate).baseDamage;
        const tier = ItemUtils.getItemTier(candidate.id);
        const currentBest = bestByType.get(typeKey);

        if (!currentBest) {
          bestByType.set(typeKey, { item: candidate, damage, tier, xp: candidate.xp });
          return;
        }

        if (damage < currentBest.damage) {
          bestByType.set(typeKey, { item: candidate, damage, tier, xp: candidate.xp });
          return;
        }

        if (damage === currentBest.damage) {
          if (tier > currentBest.tier || (tier === currentBest.tier && candidate.xp > currentBest.xp)) {
            bestByType.set(typeKey, { item: candidate, damage, tier, xp: candidate.xp });
          }
        }
      });

      const filtered = Array.from(bestByType.values()).map(({ item }) => item);
      candidates[slot] = filtered.sort(comparator);
      return;
    }

    candidates[slot] = sorted;
  });

  return candidates;
};

export const getItemLabel = (item: Item | undefined | null) => {
  if (!item) {
    return 'none';
  }

  const name = ItemUtils.getItemName(item.id);
  return `${name}#${item.id}`;
};

export const describeSelection = (selection: Partial<Record<EquipmentSlot, Item>>) => (
  Object.entries(selection).map(([slot, item]) => `${slot}:${getItemLabel(item)}`)
);

export interface GearSuggestionWorkerRequest {
  adventurer: Adventurer;
  beast: Beast;
  selections: Array<Partial<Record<EquipmentSlot, Item>>>;
}

export interface GearSuggestionWorkerResponse {
  score: GearSuggestionScore;
  selection: Partial<Record<EquipmentSlot, Item>> | null;
  changeCount: number;
}

/** Check if a score is "perfect" - 100% win rate */
export const isPerfectScore = (score: GearSuggestionScore): boolean => score.winRate >= 100;

export const evaluateSelections = (
  adventurer: Adventurer,
  beast: Beast,
  selections: Array<Partial<Record<EquipmentSlot, Item>>>,
  earlyTerminate = true,
) => {
  let bestScore: GearSuggestionScore | null = null;
  let bestSelection: Partial<Record<EquipmentSlot, Item>> | null = null;
  let bestChangeCount = Number.POSITIVE_INFINITY;

  for (const selection of selections) {
    const changeCount = Object.keys(selection).length;
    const candidateAdventurer = applyGearSet(adventurer, selection);
    const result = calculateCombatResult(candidateAdventurer, beast, { initialBeastStrike: true });
    const score = toScore(result);

    if (!bestScore || isBetterScore(score, bestScore) || (changeCount < bestChangeCount && !isBetterScore(bestScore, score))) {
      bestScore = score;
      bestSelection = selection;
      bestChangeCount = changeCount;

      // Early termination: if we found a perfect score with minimal changes, stop searching
      if (earlyTerminate && isPerfectScore(score) && changeCount === 1) {
        break;
      }
    }
  }

  if (!bestScore || !bestSelection) {
    return null;
  }

  return {
    score: bestScore,
    selection: bestSelection,
    changeCount: bestChangeCount,
  } satisfies GearSuggestionWorkerResponse;
};
