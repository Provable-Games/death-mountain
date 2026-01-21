import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stats } from '@/types/game';

export type StatChangeType = 'increase' | 'decrease' | null;
export type StatChanges = Record<keyof Stats, StatChangeType>;

export interface UseStatChangesResult {
  changes: StatChanges;
  version: number; // Increments each time a change is detected, use as key for animation
}

const EMPTY_CHANGES: StatChanges = {
  strength: null,
  dexterity: null,
  vitality: null,
  intelligence: null,
  wisdom: null,
  charisma: null,
  luck: null,
};

/**
 * Hook to detect and track stat changes for animation purposes.
 * Returns which stats increased/decreased when equipment changes.
 * 
 * @param currentStats - The current stats object from adventurer
 * @param duration - How long the change state persists (default 1000ms)
 * @returns Object with changes and version counter for animation keys
 */
export function useStatChanges(
  currentStats: Stats | undefined,
  duration = 1500
): UseStatChangesResult {
  const prevStatsRef = useRef<Stats | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [changes, setChanges] = useState<StatChanges>(EMPTY_CHANGES);
  const [version, setVersion] = useState(0);

  const clearChanges = useCallback(() => {
    setChanges(EMPTY_CHANGES);
  }, []);

  // Create a stable string key from stat values for reliable dependency comparison
  const statsKey = useMemo(() => {
    if (!currentStats) return null;
    return `${currentStats.strength},${currentStats.dexterity},${currentStats.vitality},${currentStats.intelligence},${currentStats.wisdom},${currentStats.charisma},${currentStats.luck}`;
  }, [currentStats]);

  useEffect(() => {
    if (!currentStats) return;

    const prevStats = prevStatsRef.current;

    if (prevStats) {
      const newChanges: StatChanges = { ...EMPTY_CHANGES };
      let hasChanges = false;

      // Compare each stat and detect increase/decrease
      (Object.keys(currentStats) as (keyof Stats)[]).forEach((stat) => {
        const current = currentStats[stat];
        const previous = prevStats[stat];
        const delta = current - previous;

        if (delta > 0) {
          newChanges[stat] = 'increase';
          hasChanges = true;
        } else if (delta < 0) {
          newChanges[stat] = 'decrease';
          hasChanges = true;
        }
      });

      // Only update if there are actual changes
      if (hasChanges) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setChanges(newChanges);
        setVersion(v => v + 1); // Increment version to trigger animation key change

        // Clear changes after animation duration
        timeoutRef.current = setTimeout(clearChanges, duration);
      }
    }

    // Store current stats as previous for next comparison
    prevStatsRef.current = { ...currentStats };

    // Cleanup timeout on unmount or before re-running effect
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [statsKey, duration, clearChanges, currentStats]);

  return { changes, version };
}
