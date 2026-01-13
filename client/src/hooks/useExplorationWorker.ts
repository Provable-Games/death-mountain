import { useEffect, useRef, useState, useCallback } from 'react';
import type { Adventurer } from '@/types/game';
import type { Settings } from '@/dojo/useGameSettings';

interface ExplorationResult {
  ambushLethalChance: number | null;
  trapLethalChance: number | null;
}

interface UseExplorationWorkerResult extends ExplorationResult {
  isCalculating: boolean;
}

/**
 * Hook to compute exploration lethal chances in a Web Worker
 * Uses Monte Carlo sampling (100k samples) for fast, non-blocking calculations
 */
export const useExplorationWorker = (
  adventurer: Adventurer | null,
  gameSettings: Settings | null,
): UseExplorationWorkerResult => {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<ExplorationResult>({
    ambushLethalChance: null,
    trapLethalChance: null,
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const pendingRef = useRef<boolean>(false);
  const lastInputRef = useRef<string>('');

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/explorationWorker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event: MessageEvent<ExplorationResult & { error?: string }>) => {
      const { ambushLethalChance, trapLethalChance, error } = event.data;

      if (error) {
        console.warn('[ExplorationWorker] Calculation error:', error);
      }

      setResult({
        ambushLethalChance: ambushLethalChance ?? null,
        trapLethalChance: trapLethalChance ?? null,
      });
      setIsCalculating(false);
      pendingRef.current = false;
    };

    workerRef.current.onerror = (error) => {
      console.error('[ExplorationWorker] Worker error:', error);
      setIsCalculating(false);
      pendingRef.current = false;
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Compute a hash of the relevant input values to detect changes
  const computeInputHash = useCallback((adv: Adventurer | null, settings: Settings | null): string => {
    if (!adv || !settings) return '';

    // Only include fields that affect the calculation
    return JSON.stringify({
      health: adv.health,
      xp: adv.xp,
      stats: adv.stats,
      item_specials_seed: adv.item_specials_seed,
      equipment: {
        hand: adv.equipment.hand,
        head: adv.equipment.head,
        chest: adv.equipment.chest,
        waist: adv.equipment.waist,
        foot: adv.equipment.foot,
        neck: adv.equipment.neck,
      },
      base_damage_reduction: settings.base_damage_reduction,
      stats_mode: settings.stats_mode,
    });
  }, []);

  // Trigger calculation when inputs change
  useEffect(() => {
    if (!adventurer || !gameSettings || !workerRef.current) {
      setResult({ ambushLethalChance: null, trapLethalChance: null });
      return;
    }

    const inputHash = computeInputHash(adventurer, gameSettings);

    // Skip if inputs haven't changed
    if (inputHash === lastInputRef.current) {
      return;
    }

    lastInputRef.current = inputHash;

    // If already calculating, don't queue another
    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setIsCalculating(true);

    // Small debounce to batch rapid changes
    const timeoutId = setTimeout(() => {
      workerRef.current?.postMessage({ adventurer, gameSettings });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [adventurer, gameSettings, computeInputHash]);

  return {
    ...result,
    isCalculating,
  };
};
