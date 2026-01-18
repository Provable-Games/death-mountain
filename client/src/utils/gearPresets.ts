import { ItemId } from '@/constants/loot';
import type { Adventurer, Item } from '@/types/game';
import { calculateLevel } from '@/utils/game';
import { ItemType, ItemUtils } from '@/utils/loot';
import {
  EquipmentSlot,
  applyGearSet,
  buildUpdatedBag,
  cloneItem,
  itemsEqual,
} from '@/utils/gearSuggestionShared';

const ARMOR_SLOTS = ['head', 'chest', 'hand', 'waist', 'foot'] as const;

const RELEVANT_SLOTS = [...ARMOR_SLOTS, 'neck'] as const;
type RelevantSlot = typeof RELEVANT_SLOTS[number];

export type GearPreset = 'cloth' | 'hide' | 'metal';

interface GearPresetResult {
  adventurer: Adventurer;
  bag: Item[];
}

const PRESET_TYPE_MAP: Record<GearPreset, ItemType> = {
  cloth: ItemType.Cloth,
  hide: ItemType.Hide,
  metal: ItemType.Metal,
};

const PRESET_JEWELRY_MAP: Record<GearPreset, number> = {
  cloth: ItemId.Amulet,
  hide: ItemId.Pendant,
  metal: ItemId.Necklace,
};

const getItemPower = (item: Item): number => {
  const level = calculateLevel(item.xp);
  const tier = Number(ItemUtils.getItemTier(item.id));
  return level * (6 - tier);
};

const getBestBy =
  (selector: (item: Item) => number, tiebreaker?: (item: Item) => number) =>
  (items: Item[]): Item | null => {
    if (items.length === 0) {
      return null;
    }

    return items.reduce<Item | null>((best, item) => {
      if (!best) {
        return cloneItem(item);
      }

      const scoreDiff = selector(item) - selector(best);
      if (scoreDiff > 0) {
        return cloneItem(item);
      }

      if (scoreDiff < 0) {
        return best;
      }

      if (tiebreaker) {
        const tieDiff = tiebreaker(item) - tiebreaker(best);
        if (tieDiff > 0) {
          return cloneItem(item);
        }
      }

      if (item.xp > best.xp) {
        return cloneItem(item);
      }

      if (item.id > best.id) {
        return cloneItem(item);
      }

      return best;
    }, null);
  };

const pickBestByPower = getBestBy(getItemPower, (item) => calculateLevel(item.xp));
const pickBestByLevel = getBestBy((item) => calculateLevel(item.xp), getItemPower);

const toRelevantSlot = (value: string): RelevantSlot | null => {
  const lowered = value.toLowerCase();
  return RELEVANT_SLOTS.includes(lowered as RelevantSlot) ? (lowered as RelevantSlot) : null;
};

export const applyGearPreset = (
  adventurer: Adventurer,
  bag: Item[],
  preset: GearPreset,
): GearPresetResult | null => {
  const availableBySlot = RELEVANT_SLOTS.reduce<Record<RelevantSlot, Item[]>>((acc, slot) => {
    acc[slot] = [];
    return acc;
  }, {} as Record<RelevantSlot, Item[]>);

  bag.forEach((item) => {
    const slot = toRelevantSlot(ItemUtils.getItemSlot(item.id));
    if (slot) {
      availableBySlot[slot].push(cloneItem(item));
    }
  });

  RELEVANT_SLOTS.forEach((slot) => {
    const equipped = adventurer.equipment[slot as EquipmentSlot];
    if (equipped && equipped.id !== 0) {
      availableBySlot[slot].push(cloneItem(equipped));
    }
  });

  const selection: Partial<Record<EquipmentSlot, Item>> = {};
  const targetType = PRESET_TYPE_MAP[preset];

  ARMOR_SLOTS.forEach((slot) => {
    const candidates = availableBySlot[slot];
    if (candidates.length === 0) {
      return;
    }

    const typeCandidates = candidates.filter(
      (item) => ItemUtils.getItemType(item.id) === targetType,
    );

    const desired = pickBestByPower(typeCandidates) ?? pickBestByLevel(candidates);
    if (!desired) {
      return;
    }

    const current = adventurer.equipment[slot];
    if (!itemsEqual(desired, current)) {
      selection[slot] = desired;
    }
  });

  const neckCandidates = availableBySlot.neck;
  if (neckCandidates.length > 0) {
    const desiredNeckId = PRESET_JEWELRY_MAP[preset];
    const preferred = neckCandidates.find((item) => item.id === desiredNeckId);
    const desiredNeck = preferred ? cloneItem(preferred) : pickBestByLevel(neckCandidates);

    if (desiredNeck && !itemsEqual(desiredNeck, adventurer.equipment.neck)) {
      selection.neck = desiredNeck;
    }
  }

  if (Object.keys(selection).length === 0) {
    return null;
  }

  const updatedAdventurer = applyGearSet(adventurer, selection);
  const updatedBag = buildUpdatedBag(adventurer, bag, selection);

  return {
    adventurer: updatedAdventurer,
    bag: updatedBag,
  };
};
