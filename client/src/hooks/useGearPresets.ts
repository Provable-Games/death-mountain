import { useMemo } from 'react';
import type { Adventurer, Item } from '@/types/game';
import type { GearPreset } from '@/utils/gearPresets';
import { applyGearPreset } from '@/utils/gearPresets';

interface PresetResult {
  /** Whether this preset would make any changes */
  hasChanges: boolean;
  /** Number of items that would change */
  changeCount: number;
}

interface UseGearPresetsResult {
  presets: Record<GearPreset, PresetResult>;
}

/**
 * Compute a hash of equipment and bag to detect meaningful changes.
 * Only recomputes presets when inventory actually changes.
 */
const computeInventoryHash = (adventurer: Adventurer | null, bag: Item[]): string => {
  if (!adventurer) return '';

  const equipmentIds = [
    adventurer.equipment.head.id,
    adventurer.equipment.chest.id,
    adventurer.equipment.hand.id,
    adventurer.equipment.waist.id,
    adventurer.equipment.foot.id,
    adventurer.equipment.neck.id,
  ].join(',');

  const bagIds = bag.map(item => item.id).sort((a, b) => a - b).join(',');

  return `${equipmentIds}|${bagIds}`;
};

/** Default empty result - no changes for any preset */
const EMPTY_PRESETS: Record<GearPreset, PresetResult> = {
  cloth: { hasChanges: false, changeCount: 0 },
  hide: { hasChanges: false, changeCount: 0 },
  metal: { hasChanges: false, changeCount: 0 },
};

/**
 * Hook to pre-compute gear preset results.
 * Memoizes results based on inventory state to avoid recalculation.
 * 
 * @param adventurer - The current adventurer
 * @param bag - Items in the bag
 * @param enabled - Whether to compute presets (default: true). When false, skips all computation.
 */
export const useGearPresets = (
  adventurer: Adventurer | null,
  bag: Item[],
  enabled: boolean = true,
): UseGearPresetsResult => {
  const inventoryHash = useMemo(
    () => enabled ? computeInventoryHash(adventurer, bag) : '',
    [adventurer, bag, enabled]
  );

  const presets = useMemo(() => {
    // Skip computation entirely when disabled
    if (!enabled) {
      return EMPTY_PRESETS;
    }

    const result: Record<GearPreset, PresetResult> = {
      cloth: { hasChanges: false, changeCount: 0 },
      hide: { hasChanges: false, changeCount: 0 },
      metal: { hasChanges: false, changeCount: 0 },
    };

    if (!adventurer || !inventoryHash) {
      return result;
    }

    // Pre-compute all preset results
    const presetTypes: GearPreset[] = ['cloth', 'hide', 'metal'];

    presetTypes.forEach((preset) => {
      const presetResult = applyGearPreset(adventurer, bag, preset);
      if (presetResult) {
        // Count how many slots changed
        const changedSlots = ['head', 'chest', 'hand', 'waist', 'foot', 'neck'].filter(
          (slot) => {
            const key = slot as keyof typeof adventurer.equipment;
            return adventurer.equipment[key].id !== presetResult.adventurer.equipment[key].id;
          }
        );
        result[preset] = {
          hasChanges: changedSlots.length > 0,
          changeCount: changedSlots.length,
        };
      }
    });

    return result;
  }, [adventurer, bag, inventoryHash, enabled]);

  return { presets };
};

export default useGearPresets;
