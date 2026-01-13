import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Adventurer, Beast, Item } from '@/types/game';
import { defaultSimulationResult, simulateCombatOutcomes } from '@/utils/combatSimulation';
import type { CombatSimulationResult } from '@/utils/combatSimulationCore';
import { calculateCombatStats, calculateLevel } from '@/utils/game';
import type { CombatStats } from '@/types/game';

interface UseCombatSimulationOptions {
  /** Debounce delay in ms (default: 150ms) */
  debounceMs?: number;
  /** Whether beast attacks first (new items equipped) */
  initialBeastStrike?: boolean;
}

interface UseCombatSimulationResult {
  simulationResult: CombatSimulationResult;
  combatStats: CombatStats;
  isSimulating: boolean;
  /** The adventurer action_count when the current simulation was computed */
  simulationActionCount: number | null;
}

/**
 * Compute a hash of combat-relevant state to detect meaningful changes.
 * Only values that actually affect simulation outcomes are included.
 */
const computeCombatStateHash = (
  adventurer: Adventurer | null,
  beast: Beast | null,
  bag: Item[],
): string => {
  if (!adventurer || !beast) return '';

  // Equipment IDs only - XP changes within same level don't affect combat
  const equipmentHash = [
    adventurer.equipment.weapon.id,
    adventurer.equipment.chest.id,
    adventurer.equipment.head.id,
    adventurer.equipment.waist.id,
    adventurer.equipment.hand.id,
    adventurer.equipment.foot.id,
    adventurer.equipment.neck.id,
    adventurer.equipment.ring.id,
  ].join(',');

  // Equipment levels (rounded to avoid recalc on minor XP changes)
  const equipmentLevels = [
    calculateLevel(adventurer.equipment.weapon.xp),
    calculateLevel(adventurer.equipment.chest.xp),
    calculateLevel(adventurer.equipment.head.xp),
    calculateLevel(adventurer.equipment.waist.xp),
    calculateLevel(adventurer.equipment.hand.xp),
    calculateLevel(adventurer.equipment.foot.xp),
    calculateLevel(adventurer.equipment.neck.xp),
    calculateLevel(adventurer.equipment.ring.xp),
  ].join(',');

  // Adventurer combat-relevant stats only
  const adventurerHash = [
    adventurer.health,
    calculateLevel(adventurer.xp),
    adventurer.stats.strength,
    adventurer.stats.luck,
    adventurer.item_specials_seed,
    adventurer.beast_health,
  ].join(',');

  // Beast state
  const beastHash = [
    beast.health,
    beast.level,
    beast.tier,
    beast.specialPrefix ?? '',
    beast.specialSuffix ?? '',
  ].join(',');

  // Bag item IDs (for best gear calculation)
  const bagHash = bag.map(item => `${item.id}:${calculateLevel(item.xp)}`).sort().join(',');

  return `${adventurerHash}|${equipmentHash}|${equipmentLevels}|${beastHash}|${bagHash}`;
};

/**
 * Hook to manage combat simulation with optimized triggering.
 * - Memoizes combat stats calculation
 * - Uses state hashing to detect meaningful changes
 * - Debounces simulation to prevent rapid recalculations
 */
export const useCombatSimulation = (
  adventurer: Adventurer | null,
  beast: Beast | null,
  bag: Item[],
  options: UseCombatSimulationOptions = {},
): UseCombatSimulationResult => {
  const { debounceMs = 150, initialBeastStrike = false } = options;

  const [simulationResult, setSimulationResult] = useState<CombatSimulationResult>(defaultSimulationResult);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationActionCount, setSimulationActionCount] = useState<number | null>(null);

  const lastHashRef = useRef<string>('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulationIdRef = useRef<number>(0);

  // Memoized combat stats - only recalculate when inputs actually change
  const combatStats = useMemo(() => {
    if (!adventurer || !beast) {
      return {
        baseDamage: 0,
        protection: 0,
        bestDamage: 0,
        bestProtection: 0,
        bestItems: [],
        critChance: 0,
        criticalDamage: 0,
        gearScore: 0,
      };
    }
    return calculateCombatStats(adventurer, bag, beast);
  }, [
    // Only include combat-relevant dependencies
    adventurer?.health,
    adventurer?.xp,
    adventurer?.stats.strength,
    adventurer?.stats.luck,
    adventurer?.item_specials_seed,
    adventurer?.equipment.weapon.id,
    adventurer?.equipment.weapon.xp,
    adventurer?.equipment.chest.id,
    adventurer?.equipment.chest.xp,
    adventurer?.equipment.head.id,
    adventurer?.equipment.head.xp,
    adventurer?.equipment.waist.id,
    adventurer?.equipment.waist.xp,
    adventurer?.equipment.hand.id,
    adventurer?.equipment.hand.xp,
    adventurer?.equipment.foot.id,
    adventurer?.equipment.foot.xp,
    beast?.id,
    beast?.level,
    beast?.tier,
    beast?.specialPrefix,
    beast?.specialSuffix,
    bag,
  ]);

  // Compute current state hash (includes initialBeastStrike to trigger recalc when it changes)
  const currentHash = useMemo(
    () => `${computeCombatStateHash(adventurer, beast, bag)}|${initialBeastStrike}`,
    [adventurer, beast, bag, initialBeastStrike]
  );

  // Run simulation with debouncing
  const runSimulation = useCallback(async (
    adv: Adventurer,
    b: Beast,
    initialBeastStrike: boolean,
    simId: number,
    actionCount: number,
  ) => {
    try {
      const result = await simulateCombatOutcomes(adv, b, { initialBeastStrike });

      // Check if this simulation is still current
      if (simId !== simulationIdRef.current) {
        return; // Stale result, discard
      }

      setSimulationResult(result);
      setSimulationActionCount(actionCount);
    } catch (error) {
      console.error('[CombatSimulation] Error:', error);
    } finally {
      if (simId === simulationIdRef.current) {
        setIsSimulating(false);
      }
    }
  }, []);

  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Skip if no valid data
    if (!adventurer || !beast || !currentHash) {
      setSimulationResult(defaultSimulationResult);
      setSimulationActionCount(null);
      return;
    }

    // Skip if hash hasn't changed (no meaningful state change)
    if (currentHash === lastHashRef.current) {
      return;
    }

    lastHashRef.current = currentHash;
    setIsSimulating(true);

    // Increment simulation ID to track current run
    simulationIdRef.current += 1;
    const simId = simulationIdRef.current;

    // Debounce the actual simulation
    debounceTimerRef.current = setTimeout(() => {
      runSimulation(adventurer, beast, initialBeastStrike, simId, adventurer.action_count);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentHash, adventurer, beast, initialBeastStrike, debounceMs, runSimulation]);

  return {
    simulationResult,
    combatStats,
    isSimulating,
    simulationActionCount,
  };
};
