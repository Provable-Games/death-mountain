import { TIER_PRICE } from '@/constants/game';
import {
  ITEM_NAME_PREFIXES,
  ITEM_NAME_SUFFIXES,
  ITEM_SUFFIXES,
  ItemId,
  ItemIndex,
  ItemSlotLength,
  NUM_ITEMS,
  PREFIXES_UNLOCK_GREATNESS,
  SUFFIX_UNLOCK_GREATNESS
} from '@/constants/loot';

// Import icons
import { BEAST_SPECIAL_NAME_LEVEL_UNLOCK } from '@/constants/beast';
import { Beast, Item, Stats } from '@/types/game';
import { calculateLevel } from './game';

export const slotIcons = {
  Weapon: '/images/types/weapon.svg',
  Head: '/images/types/head.svg',
  Chest: '/images/types/chest.svg',
  Waist: '/images/types/waist.svg',
  Hand: '/images/types/hand.svg',
  Foot: '/images/types/foot.svg',
  Ring: '/images/types/ring.svg',
  Neck: '/images/types/neck.svg',
};

export const typeIcons = {
  Cloth: '/images/types/cloth.svg',
  Hide: '/images/types/hide.svg',
  Metal: '/images/types/metal.svg',
  Magic: '/images/types/magic.svg',
  Bludgeon: '/images/types/bludgeon.svg',
  Blade: '/images/types/blade.svg',
  Ring: '/images/types/ring.svg',
  Necklace: '/images/types/neck.svg',
};

// Create a mapping from ID to name
const ItemString: { [key: number]: string } = Object.entries(ItemId).reduce((acc, [name, id]) => {
  acc[id] = name.replace(/([A-Z])/g, ' $1').trim();
  return acc;
}, {} as { [key: number]: string });

// Item types from Cairo contract
export enum ItemType {
  Magic = "Magic",
  Bludgeon = "Bludgeon",
  Blade = "Blade",
  Cloth = "Cloth",
  Hide = "Hide",
  Metal = "Metal",
  Ring = "Ring",
  Necklace = "Necklace",
  None = "None"
}

// Tier mapping from Cairo contract
export enum Tier {
  T1 = 1,
  T2 = 2,
  T3 = 3,
  T4 = 4,
  T5 = 5,
  None = 0
}

export interface Loot {
  id: number;
  tier: number;
  itemType: string;
  slot: string;
}

// Port of ItemUtils from loot.cairo
export const ItemUtils = {
  isNecklace: (id: number): boolean => id <= 3,
  isRing: (id: number): boolean => id >= 4 && id <= 8,
  isWeapon: (id: number): boolean =>
    (id >= 9 && id <= 16) ||
    (id >= 42 && id <= 46) ||
    (id >= 72 && id <= 76),
  isChest: (id: number): boolean => (id >= 17 && id <= 21) || (id >= 47 && id <= 51) || (id >= 77 && id <= 81),
  isHead: (id: number): boolean => (id >= 22 && id <= 26) || (id >= 52 && id <= 56) || (id >= 82 && id <= 86),
  isWaist: (id: number): boolean => (id >= 27 && id <= 31) || (id >= 57 && id <= 61) || (id >= 87 && id <= 91),
  isFoot: (id: number): boolean => (id >= 32 && id <= 36) || (id >= 62 && id <= 66) || (id >= 92 && id <= 96),
  isHand: (id: number): boolean => (id >= 37 && id <= 41) || (id >= 67 && id <= 71) || (id >= 97 && id <= 101),

  isMagicOrCloth: (id: number): boolean => id >= 9 && id <= 41,
  isBladeOrHide: (id: number): boolean => id >= 42 && id <= 71,
  isBludgeonOrMetal: (id: number): boolean => id >= 72,

  getItemType: (id: number): ItemType => {
    if (ItemUtils.isNecklace(id)) return ItemType.Necklace;
    if (ItemUtils.isRing(id)) return ItemType.Ring;
    if (ItemUtils.isMagicOrCloth(id)) return ItemUtils.isWeapon(id) ? ItemType.Magic : ItemType.Cloth;
    if (ItemUtils.isBladeOrHide(id)) return ItemUtils.isWeapon(id) ? ItemType.Blade : ItemType.Hide;
    if (ItemUtils.isBludgeonOrMetal(id)) return ItemUtils.isWeapon(id) ? ItemType.Bludgeon : ItemType.Metal;
    return ItemType.None;
  },

  getItemSlot: (id: number): string => {
    if (ItemUtils.isNecklace(id)) return "Neck";
    if (ItemUtils.isRing(id)) return "Ring";
    if (ItemUtils.isWeapon(id)) return "Weapon";
    if (ItemUtils.isChest(id)) return "Chest";
    if (ItemUtils.isHead(id)) return "Head";
    if (ItemUtils.isWaist(id)) return "Waist";
    if (ItemUtils.isFoot(id)) return "Foot";
    if (ItemUtils.isHand(id)) return "Hand";
    return "None";
  },

  getItemTier: (id: number): Tier => {
    if (id <= 0) return Tier.None;

    // Necklace items (1-3) are all T1
    if (id <= 3) return Tier.T1;

    // silver ring (4) is T2
    if (id === 4) return Tier.T2;

    // bronze ring (5) is T3
    if (id === 5) return Tier.T3;

    // other rings are T1
    if (id <= 8) return Tier.T1;

    // Magic/Cloth items (9-41)
    if (id <= 41) {
      if ([9, 13, 17, 22, 27, 32, 37].includes(id)) return Tier.T1;
      if ([10, 14, 18, 23, 28, 33, 38].includes(id)) return Tier.T2;
      if ([11, 15, 19, 24, 29, 34, 39].includes(id)) return Tier.T3;
      if ([20, 25, 30, 35, 40].includes(id)) return Tier.T4;
      return Tier.T5;
    }

    // Blade/Hide items (42-71)
    if (id <= 71) {
      if ([42, 47, 52, 57, 62, 67].includes(id)) return Tier.T1;
      if ([43, 48, 53, 58, 63, 68].includes(id)) return Tier.T2;
      if ([44, 49, 54, 59, 64, 69].includes(id)) return Tier.T3;
      if ([45, 50, 55, 60, 65, 70].includes(id)) return Tier.T4;
      return Tier.T5;
    }

    // Bludgeon/Metal items (72-101)
    if ([72, 77, 82, 87, 92, 97].includes(id)) return Tier.T1;
    if ([73, 78, 83, 88, 93, 98].includes(id)) return Tier.T2;
    if ([74, 79, 84, 89, 94, 99].includes(id)) return Tier.T3;
    if ([75, 80, 85, 90, 95, 100].includes(id)) return Tier.T4;
    return Tier.T5;
  },

  getItemBasePrice: (tier: Tier): number => {
    switch (tier) {
      case Tier.T1: return 5 * TIER_PRICE;
      case Tier.T2: return 4 * TIER_PRICE;
      case Tier.T3: return 3 * TIER_PRICE;
      case Tier.T4: return 2 * TIER_PRICE;
      case Tier.T5: return TIER_PRICE;
      default: return 0;
    }
  },

  getCharismaAdjustedItemPrice: (basePrice: number, charisma: number): number => {
    const CHARISMA_ITEM_DISCOUNT = 1; // From adventurer.cairo constants
    const MINIMUM_ITEM_PRICE = 1; // From adventurer.cairo constants

    const charismaDiscount = CHARISMA_ITEM_DISCOUNT * charisma;
    if (charismaDiscount >= basePrice) {
      return MINIMUM_ITEM_PRICE;
    }
    return basePrice - charismaDiscount;
  },

  getItemPrice: (tier: Tier, charisma: number): number => {
    const basePrice = ItemUtils.getItemBasePrice(tier);
    return ItemUtils.getCharismaAdjustedItemPrice(basePrice, charisma);
  },

  getSpecialsSeed: (itemId: number, entropy: number): number => {
    let itemEntropy = entropy + itemId;
    if (itemEntropy > 65535) {
      itemEntropy = entropy - itemId;
    }

    // Scope rnd between 0 and NUM_ITEMS-1
    const rnd = itemEntropy % NUM_ITEMS;

    // Get item name and index
    const itemName = Object.entries(ItemId).find(([_, value]) => value === itemId)?.[0];
    const itemIndex = itemName ? (ItemIndex as any)[itemName] || 0 : 0;

    // Get slot length based on item slot
    const slot = ItemUtils.getItemSlot(itemId);
    let slotLength = 1;
    switch (slot) {
      case "Weapon": slotLength = ItemSlotLength.SlotItemsLengthWeapon; break;
      case "Chest": slotLength = ItemSlotLength.SlotItemsLengthChest; break;
      case "Head": slotLength = ItemSlotLength.SlotItemsLengthHead; break;
      case "Waist": slotLength = ItemSlotLength.SlotItemsLengthWaist; break;
      case "Foot": slotLength = ItemSlotLength.SlotItemsLengthFoot; break;
      case "Hand": slotLength = ItemSlotLength.SlotItemsLengthHand; break;
      case "Neck": slotLength = ItemSlotLength.SlotItemsLengthNeck; break;
      case "Ring": slotLength = ItemSlotLength.SlotItemsLengthRing; break;
    }

    // Return the item specific entropy
    return rnd * slotLength + itemIndex;
  },

  getSpecials: (id: number, greatness: number, seed: number) => {
    let specialSeed = ItemUtils.getSpecialsSeed(id, seed);

    const special1 = ItemUtils.getItemSuffix(specialSeed);
    const special2 = ItemUtils.getItemPrefix1(specialSeed); // Prefix1
    const special3 = ItemUtils.getItemPrefix2(specialSeed); // Prefix2

    if (greatness < SUFFIX_UNLOCK_GREATNESS) {
      return {
        special1: null,
        prefix: null,
        suffix: null
      };
    } else if (greatness < PREFIXES_UNLOCK_GREATNESS) {
      return {
        special1: ITEM_SUFFIXES[special1],
        prefix: null,
        suffix: null
      };
    } else {
      return {
        special1: ITEM_SUFFIXES[special1],
        prefix: ITEM_NAME_PREFIXES[special2],
        suffix: ITEM_NAME_SUFFIXES[special3]
      };
    }
  },

  getItemSuffix: (seed: number) => {
    return seed % 16 + 1;
  },

  getItemPrefix1: (seed: number) => {
    return seed % 69 + 1;
  },

  getItemPrefix2: (seed: number) => {
    return seed % 18 + 1;
  },

  getItemName: (id: number): string => {
    return ItemString[id] || "Unknown Item";
  },

  formatItemName: (name: string): string => {
    return name.replace(/([A-Z])/g, ' $1').trim();
  },

  getItemImage: (id: number) => {
    const name = ItemUtils.getItemName(id);

    try {
      const fileName = name.replace(/ /g, "_").toLowerCase();
      return `/images/loot/${fileName}.png`;
    } catch (ex) {
      return "";
    }
  },

  getMetadata: (id: number) => {
    const name = ItemUtils.getItemName(id);
    const formattedName = ItemUtils.formatItemName(name);
    const imageUrl = ItemUtils.getItemImage(id);

    return {
      name: formattedName,
      imageUrl
    };
  },

  getTierColor: (tier: Tier): string => {
    switch (tier) {
      case Tier.T1: return '#FFD700'; // Gold for T1 (Best)
      case Tier.T2: return '#9370DB'; // Purple for T2
      case Tier.T3: return '#4169E1'; // Royal Blue for T3
      case Tier.T4: return '#32CD32'; // Lime Green for T4
      case Tier.T5: return '#A9A9A9'; // Dark Gray for T5
      default: return '#808080'; // Default gray
    }
  },

  isNameMatch: (itemId: number, itemLevel: number, itemSeed: number, beast: Beast) => {
    if (itemLevel < PREFIXES_UNLOCK_GREATNESS || beast.level < BEAST_SPECIAL_NAME_LEVEL_UNLOCK) {
      return false;
    }

    let specials = ItemUtils.getSpecials(itemId, itemLevel, itemSeed)
    return specials.prefix === beast.specialPrefix || specials.suffix === beast.specialSuffix;
  },

  getStatBonus: (special1: string) => {
    if (special1 === "of Power") {
      return "+3 STR"
    } else if (special1 === "of Giant") {
      return "+3 VIT"
    } else if (special1 === "of Titans") {
      return "+2 STR +1 CHA"
    } else if (special1 === "of Skill") {
      return "+3 DEX"
    } else if (special1 === "of Perfection") {
      return "+1 STR +1 DEX +1 VIT"
    } else if (special1 === "of Brilliance") {
      return "+3 INT"
    } else if (special1 === "of Enlightenment") {
      return "+3 WIS"
    } else if (special1 === "of Protection") {
      return "+2 VIT +1 DEX"
    } else if (special1 === "of Anger") {
      return "+2 STR +1 DEX"
    } else if (special1 === "of Rage") {
      return "+1 STR +1 CHA +1 WIS"
    } else if (special1 === "of Fury") {
      return "+1 VIT +1 CHA +1 INT"
    } else if (special1 === "of Vitriol") {
      return "+2 INT +1 WIS"
    } else if (special1 === "of the Fox") {
      return "+2 DEX +1 CHA"
    } else if (special1 === "of Detection") {
      return "+2 WIS +1 DEX"
    } else if (special1 === "of Reflection") {
      return "+1 INT +2 WIS"
    } else if (special1 === "of the Twins") {
      return "+3 CHA"
    }
  },

  removeItemBoosts: (item: Item, item_specials_seed: number, stats: Stats): Stats => {
    const level = calculateLevel(item.xp);
    const specials = ItemUtils.getSpecials(item.id, level, item_specials_seed);

    // Silver ring
    if (item.id === 4) {
      stats.luck = Math.max(2, stats.luck - level);
    }

    if (!specials.special1) {
      return stats;
    }

    if (specials.special1 === "of Power") {
      stats.strength -= 3;
    } else if (specials.special1 === "of Titans") {
      stats.strength -= 2;
    } else if (specials.special1 === "of Skill") {
      stats.dexterity -= 3;
    } else if (specials.special1 === "of Perfection") {
      stats.strength -= 1;
      stats.dexterity -= 1;
    } else if (specials.special1 === "of Brilliance") {
      stats.intelligence -= 3;
    } else if (specials.special1 === "of Enlightenment") {
      stats.wisdom -= 3;
    } else if (specials.special1 === "of Protection") {
      stats.dexterity -= 1;
    } else if (specials.special1 === "of Anger") {
      stats.strength -= 2;
      stats.dexterity -= 1;
    } else if (specials.special1 === "of Rage") {
      stats.strength -= 1;
      stats.wisdom -= 1;
    } else if (specials.special1 === "of Fury") {
      stats.intelligence -= 1;
    } else if (specials.special1 === "of Vitriol") {
      stats.intelligence -= 2;
      stats.wisdom -= 1;
    } else if (specials.special1 === "of the Fox") {
      stats.dexterity -= 2;
    } else if (specials.special1 === "of Detection") {
      stats.wisdom -= 2;
      stats.dexterity -= 1;
    } else if (specials.special1 === "of Reflection") {
      stats.intelligence -= 1;
      stats.wisdom -= 2;
    }

    return stats;
  },

  addItemBoosts: (item: Item, item_specials_seed: number, stats: Stats): Stats => {
    const level = calculateLevel(item.xp);
    const specials = ItemUtils.getSpecials(item.id, level, item_specials_seed);

    // Silver ring
    if (item.id === 4) {
      stats.luck = Math.min(100, stats.luck + level);
    }

    if (!specials.special1) {
      return stats;
    }

    if (specials.special1 === "of Power") {
      stats.strength += 3;
    } else if (specials.special1 === "of Titans") {
      stats.strength += 2;
    } else if (specials.special1 === "of Skill") {
      stats.dexterity += 3;
    } else if (specials.special1 === "of Perfection") {
      stats.strength += 1;
      stats.dexterity += 1;
    } else if (specials.special1 === "of Brilliance") {
      stats.intelligence += 3;
    } else if (specials.special1 === "of Enlightenment") {
      stats.wisdom += 3;
    } else if (specials.special1 === "of Protection") {
      stats.dexterity += 1;
    } else if (specials.special1 === "of Anger") {
      stats.strength += 2;
      stats.dexterity += 1;
    } else if (specials.special1 === "of Rage") {
      stats.strength += 1;
      stats.wisdom += 1;
    } else if (specials.special1 === "of Fury") {
      stats.intelligence += 1;
    } else if (specials.special1 === "of Vitriol") {
      stats.intelligence += 2;
      stats.wisdom += 1;
    } else if (specials.special1 === "of the Fox") {
      stats.dexterity += 2;
    } else if (specials.special1 === "of Detection") {
      stats.wisdom += 2;
      stats.dexterity += 1;
    } else if (specials.special1 === "of Reflection") {
      stats.intelligence += 1;
      stats.wisdom += 2;
    }

    return stats;
  }
};
