import { BEAST_MIN_DAMAGE } from "@/constants/beast";
import { MIN_DAMAGE } from "@/constants/game";
import { Adventurer, Beast, CombatStats, Equipment, Item } from "@/types/game";
import { getArmorType, getAttackType } from "./beast";
import { ItemType, ItemUtils } from "./loot";

export const calculateLevel = (xp: number) => {
  if (xp === 0) return 1;
  return Math.floor(Math.sqrt(xp));
};

export const calculateNextLevelXP = (currentLevel: number, item: boolean = false) => {
  if (item) {
    return Math.min(400, (currentLevel + 1) ** 2);
  }

  return (currentLevel + 1) ** 2;
};

export const calculateProgress = (xp: number, item: boolean = false) => {
  const currentLevel = calculateLevel(xp);
  const nextLevelXP = calculateNextLevelXP(currentLevel, item);
  const currentLevelXP = currentLevel ** 2;
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
};

export const getNewItemsEquipped = (newEquipment: Equipment, oldEquipment: Equipment) => {
  if (!newEquipment || !oldEquipment) return [];

  const newItems: Item[] = [];

  // Check each equipment slot in the current adventurer
  Object.entries(newEquipment).forEach(([slot, currentItem]) => {
    const initialItem = oldEquipment[slot as keyof Equipment];

    // Only add if there's a current item and it's different from the initial item
    if (currentItem.id !== 0 && currentItem.id !== initialItem.id) {
      newItems.push(currentItem);
    }
  });

  return newItems;
};

export const incrementBeastsCollected = (gameId: number) => {
  let currentCount = parseInt(localStorage.getItem(`beast_collected_${gameId}`) || "0");
  localStorage.setItem(`beast_collected_${gameId}`, (currentCount + 1).toString());
};

// Calculate critical hit bonus based on luck and ring
const critical_hit_bonus = (base_damage: number, ring: Item | null): number => {
  let total = 0;

  total = base_damage;

  // Titanium Ring gives 3% bonus per level on critical hits
  if (ring && ItemUtils.getItemName(ring.id) === "Titanium Ring" && total > 0) {
    const ringLevel = calculateLevel(ring.xp);
    total += Math.floor((total * 3 * ringLevel) / 100);
  }
  return total;
};

// Calculate weapon special bonus based on matching specials
const calculateWeaponSpecialBonus = (weaponId: number, weaponLevel: number, itemSpecialsSeed: number, beastPrefix: string | null, beastSuffix: string | null, baseDamage: number, ring: Item) => {
  if (!beastPrefix && !beastSuffix) return 0;

  const weaponSpecials = ItemUtils.getSpecials(weaponId, weaponLevel, itemSpecialsSeed);

  let bonus = 0;
  // Special2 (prefix) match gives 8x damage
  if (weaponSpecials.prefix && weaponSpecials.prefix === beastPrefix) {
    bonus += baseDamage * 8;
  }
  // Special3 (suffix) match gives 2x damage
  if (weaponSpecials.suffix && weaponSpecials.suffix === beastSuffix) {
    bonus += baseDamage * 2;
  }

  // Platinum Ring gives 3% bonus per level on special matches
  if (ItemUtils.getItemName(ring.id) === "Platinum Ring" && bonus > 0) {
    const ringLevel = calculateLevel(ring.xp);
    bonus += Math.floor((bonus * 3 * ringLevel) / 100);
  }

  return bonus;
};

export const calculateAttackDamage = (weapon: Item, adventurer: Adventurer, beast: Beast | null) => {
  if (!weapon) return { baseDamage: MIN_DAMAGE, criticalDamage: MIN_DAMAGE }; // Minimum damage

  const weaponLevel = calculateLevel(weapon.xp);
  const weaponTier = ItemUtils.getItemTier(weapon.id);
  const baseAttack = weaponLevel * (6 - Number(weaponTier));

  if (!beast) {
    let strBonus = Math.floor(baseAttack * (adventurer.stats.strength / 10));
    return {
      baseDamage: baseAttack + strBonus,
      criticalDamage: (baseAttack * 2) + strBonus,
    };
  }

  let baseArmor = 0;
  let elementalDamage = 0;

  const beastLevel = beast.level;
  const weaponType = ItemUtils.getItemType(weapon.id);
  const beastArmor = getArmorType(beast.id);

  baseArmor = beastLevel * (6 - Number(beast.tier));
  elementalDamage = elementalAdjustedDamage(baseAttack, weaponType, beastArmor);

  // Calculate strength bonus
  let strengthBonus = 0;
  if (adventurer.stats.strength > 0) {
    strengthBonus = Math.floor((elementalDamage * adventurer.stats.strength * 10) / 100);
  }

  // Calculate special name bonus damage with ring bonus
  const ring = adventurer.equipment.ring;
  const specialBonus = calculateWeaponSpecialBonus(weapon.id, weaponLevel, adventurer.item_specials_seed, beast.specialPrefix, beast.specialSuffix, elementalDamage, ring);

  // Calculate base damage (without critical)
  const baseDamage = Math.max(MIN_DAMAGE, (elementalDamage + strengthBonus + specialBonus) - baseArmor);

  // Calculate critical hit bonus with ring bonus using adventurer's luck stat
  const critBonus = critical_hit_bonus(elementalDamage, ring);
  let criticalDamage = Math.max(MIN_DAMAGE, (elementalDamage + strengthBonus + specialBonus + critBonus) - baseArmor);

  return {
    baseDamage,
    criticalDamage,
  }
};

export const ability_based_percentage = (adventurer_xp: number, relevant_stat: number) => {
  let adventurer_level = calculateLevel(adventurer_xp);

  if (relevant_stat >= adventurer_level) {
    return 100;
  } else {
    return Math.floor((relevant_stat / adventurer_level) * 100);
  }
}

export const ability_based_avoid_threat = (adventurer_level: number, relevant_stat: number, rnd: number) => {
  if (relevant_stat >= adventurer_level) {
    return true;
  } else {
    let scaled_chance = (adventurer_level * rnd) / 255;
    return relevant_stat > scaled_chance;
  }
}

export const ability_based_damage_reduction = (adventurer_xp: number, relevant_stat: number) => {
  let adventurer_level = calculateLevel(adventurer_xp);
  const SCALE = 1_000_000;

  let ratio = SCALE * relevant_stat / adventurer_level;
  if (ratio > SCALE) {
    ratio = SCALE;
  }

  let r2 = (ratio * ratio) / SCALE;
  let r3 = (r2 * ratio) / SCALE;
  let smooth = 3 * r2 - 2 * r3;

  return Math.floor((100 * smooth / SCALE));
}

export const calculateBeastDamage = (beast: Beast, adventurer: Adventurer, armor: Item) => {
  const baseAttack = beast.level * (6 - Number(beast.tier));
  let baseDamage = baseAttack;
  let critDamage = baseAttack;

  if (armor) {
    const armorLevel = calculateLevel(armor.xp);
    const armorValue = armorLevel * (6 - ItemUtils.getItemTier(armor.id));

    // Apply elemental adjustment
    const beastAttackType = getAttackType(beast.id);
    const armorType = ItemUtils.getItemType(armor.id);
    let elementalDamage = elementalAdjustedDamage(baseAttack, beastAttackType, armorType);
    let damage = elementalDamage;

    // Apply name match bonus
    if (beast.specialPrefix && beast.specialSuffix) {
      const itemSpecials = ItemUtils.getSpecials(armor.id, armorLevel, adventurer.item_specials_seed);
      if (itemSpecials.suffix === beast.specialSuffix) {
        damage *= 2; // Suffix match
      }
      if (itemSpecials.prefix === beast.specialPrefix) {
        damage *= 8; // Prefix match
      }
    }

    critDamage = Math.max(BEAST_MIN_DAMAGE, (damage + elementalDamage) - armorValue);
    baseDamage = Math.max(BEAST_MIN_DAMAGE, damage - armorValue);

    // Check for neck armor reduction
    const neck = adventurer.equipment.neck;
    if (neck_reduction(armor, neck)) {
      const neckLevel = calculateLevel(neck.xp);
      const neckReduction = Math.floor((armorLevel * (6 - ItemUtils.getItemTier(armor.id)) * neckLevel * 3) / 100);

      baseDamage -= neckReduction;
      critDamage -= neckReduction;
    }
  } else {
    baseDamage = Math.floor(baseAttack * 1.5);
    critDamage = Math.floor(baseAttack * 1.5) * 2;
  }

  return {
    baseDamage: Math.max(BEAST_MIN_DAMAGE, baseDamage),
    criticalDamage: Math.max(BEAST_MIN_DAMAGE, critDamage),
  }
};

// Check if neck item provides bonus armor reduction
const neck_reduction = (armor: Item, neck: Item): boolean => {
  if (!armor.id || !neck.id) return false;

  if (ItemUtils.getItemType(armor.id) === ItemType.Cloth && ItemUtils.getItemName(neck.id) === "Amulet") return true;
  if (ItemUtils.getItemType(armor.id) === ItemType.Hide && ItemUtils.getItemName(neck.id) === "Pendant") return true;
  if (ItemUtils.getItemType(armor.id) === ItemType.Metal && ItemUtils.getItemName(neck.id) === "Necklace") return true;

  return false;
};

export function elementalAdjustedDamage(base_attack: number, weapon_type: string, armor_type: string): number {
  let elemental_effect = Math.floor(base_attack / 2);

  if (
    (weapon_type === ItemType.Magic && armor_type === "Metal") ||
    (weapon_type === ItemType.Blade && armor_type === "Cloth") ||
    (weapon_type === ItemType.Bludgeon && armor_type === "Hide")
  ) {
    return base_attack + elemental_effect;
  }

  if (
    (weapon_type === ItemType.Magic && armor_type === "Hide") ||
    (weapon_type === ItemType.Blade && armor_type === "Metal") ||
    (weapon_type === ItemType.Bludgeon && armor_type === "Cloth")
  ) {
    return base_attack - elemental_effect;
  }

  return base_attack;
}

export function strength_dmg(damage: number, strength: number): number {
  if (strength == 0) return 0;
  return (damage * strength * 10) / 100;
}


// Calculate combat stats
export const calculateCombatStats = (adventurer: Adventurer, bagItems: Item[], beast: Beast | null): CombatStats => {
  let { baseDamage, criticalDamage } = calculateAttackDamage(adventurer.equipment.weapon, adventurer, beast);

  let protection = 0;
  let bestProtection = 0;
  let bestItems: Item[] = [];

  let bestWeapon = adventurer.equipment.weapon;
  let bestDamage = baseDamage;

  if (beast) {
    let totalDefense = 0;
    let totalBestDefense = 0;
    let maxDamage = beast.level * (6 - Number(beast.tier)) * 1.5;

    bagItems.filter((item) => ItemUtils.getItemSlot(item.id) === 'Weapon').forEach((item) => {
      let itemDamage = calculateAttackDamage(item, adventurer, beast).baseDamage;
      if (itemDamage > bestDamage) {
        bestDamage = itemDamage;
        bestWeapon = item;
      }
    });

    if (bestWeapon) {
      bestItems.push(bestWeapon)
    }

    ['head', 'chest', 'waist', 'hand', 'foot'].forEach((slot) => {
      const armor = adventurer.equipment[slot as keyof Equipment];
      let armorDefense = 0;

      if (armor.id !== 0) {
        armorDefense = Math.max(0, maxDamage - calculateBeastDamage(beast, adventurer, armor).baseDamage);
      }

      let bestDefense = armorDefense;
      let bestItem = null;
      bagItems.filter((item) => ItemUtils.getItemSlot(item.id).toLowerCase() === slot).forEach((item) => {
        let itemDefense = Math.max(0, maxDamage - calculateBeastDamage(beast, adventurer, item).baseDamage);
        if (itemDefense > bestDefense) {
          bestDefense = itemDefense;
          bestItem = item;
        }
      });

      totalDefense += armorDefense;
      totalBestDefense += bestDefense;

      if (bestItem) {
        bestItems.push(bestItem);
      }
    });

    if (maxDamage <= 2) {
      protection = 100;
      bestProtection = 100;
    } else {
      protection = Math.floor((totalDefense / ((maxDamage - BEAST_MIN_DAMAGE) * 5)) * 100);
      bestProtection = Math.floor((totalBestDefense / ((maxDamage - BEAST_MIN_DAMAGE) * 5)) * 100);
    }
  }

  let gearScore = 0;
  Object.values(adventurer.equipment).forEach((item) => {
    if (item.id !== 0) {
      gearScore += calculateLevel(item.xp) * (6 - ItemUtils.getItemTier(item.id));
    }
  });

  bagItems.forEach((item) => {
    if (item.id !== 0) {
      gearScore += calculateLevel(item.xp) * (6 - ItemUtils.getItemTier(item.id));
    }
  });

  return {
    baseDamage,
    protection,
    bestDamage,
    bestProtection,
    bestItems,
    critChance: adventurer.stats.luck,
    criticalDamage,
    gearScore,
  };
};

export const calculateGoldReward = (beast: Beast, ring: Item | null) => {
  let goldReward = Math.floor(beast.level * (6 - Number(beast.tier)) / 2);

  // Gold Ring gives 3% bonus per level on gold reward
  if (ring && ItemUtils.getItemName(ring.id) === "Gold Ring" && goldReward > 0) {
    const ringLevel = calculateLevel(ring.xp);
    goldReward += Math.floor((goldReward * 3 * ringLevel) / 100);
  }

  return goldReward;
};