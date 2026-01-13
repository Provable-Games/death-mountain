/**
 * Web Worker for exploration lethal chance calculations
 * Uses Monte Carlo sampling for performance (100k samples total)
 */

import type { Adventurer, Beast, Equipment, Item } from '@/types/game';
import type { Settings } from '@/dojo/useGameSettings';

// Constants
const BEAST_IDS = Array.from({ length: 75 }, (_, index) => index + 1);
const OBSTACLE_IDS = Array.from({ length: 75 }, (_, index) => index + 1);
const SLOT_ORDER: Array<keyof Equipment> = ['hand', 'head', 'chest', 'waist', 'foot'];
const MIN_DAMAGE_FROM_BEASTS = 2;
const MIN_DAMAGE_FROM_OBSTACLES = 4;
const NECKLACE_ARMOR_BONUS = 3;
const BEAST_SPECIAL_NAME_LEVEL_UNLOCK = 15;
const MAX_SPECIAL2 = 69;
const MAX_SPECIAL3 = 18;
const BEAST_SPECIAL_PREFIX_POOL = MAX_SPECIAL2;
const BEAST_SPECIAL_SUFFIX_POOL = MAX_SPECIAL3;
const CRITICAL_HIT_LEVEL_MULTIPLIER = 1;
const CRITICAL_HIT_AMBUSH_MULTIPLIER = 1;
const MONTE_CARLO_SAMPLES_PER_SLOT = 20000; // 20k per slot × 5 slots = 100k total

// Lookup maps (initialized once)
const OBSTACLE_TYPE_MAP: Record<number, 'Magic' | 'Blade' | 'Bludgeon'> = {};
const OBSTACLE_TIER_MAP: Record<number, number> = {};
const BEAST_TYPE_MAP: Record<number, 'Magic' | 'Blade' | 'Bludgeon'> = {};
const BEAST_TIER_MAP: Record<number, number> = {};

// Beast names mapping (simplified - just need IDs for damage calc)
const BEAST_NAMES: Record<number, string> = {};
for (let i = 1; i <= 75; i++) {
  BEAST_NAMES[i] = `Beast${i}`;
}

// Item tier enum values
const ItemTier = { T1: 1, T2: 2, T3: 3, T4: 4, T5: 5 };

// Item type enum
const ItemType = {
  Cloth: 'Cloth',
  Hide: 'Hide',
  Metal: 'Metal',
  Magic: 'Magic',
  Blade: 'Blade',
  Bludgeon: 'Bludgeon',
  Necklace: 'Necklace',
  Ring: 'Ring',
};

// Initialize lookup tables
const initialiseLookups = () => {
  if (Object.keys(OBSTACLE_TYPE_MAP).length > 0) return;

  for (const id of OBSTACLE_IDS) {
    if (id >= 1 && id < 26) {
      OBSTACLE_TYPE_MAP[id] = 'Magic';
    } else if (id < 51) {
      OBSTACLE_TYPE_MAP[id] = 'Blade';
    } else {
      OBSTACLE_TYPE_MAP[id] = 'Bludgeon';
    }

    if ((id >= 1 && id < 6) || (id >= 26 && id < 31) || (id >= 51 && id < 56)) {
      OBSTACLE_TIER_MAP[id] = 1;
    } else if ((id >= 6 && id < 11) || (id >= 31 && id < 36) || (id >= 56 && id < 61)) {
      OBSTACLE_TIER_MAP[id] = 2;
    } else if ((id >= 11 && id < 16) || (id >= 36 && id < 41) || (id >= 61 && id < 66)) {
      OBSTACLE_TIER_MAP[id] = 3;
    } else if ((id >= 16 && id < 21) || (id >= 41 && id < 46) || (id >= 66 && id < 71)) {
      OBSTACLE_TIER_MAP[id] = 4;
    } else {
      OBSTACLE_TIER_MAP[id] = 5;
    }
  }

  for (const id of BEAST_IDS) {
    BEAST_TYPE_MAP[id] = getBeastAttackType(id);
    BEAST_TIER_MAP[id] = getBeastTier(id);
  }
};

// Utility functions
const getBeastAttackType = (id: number): 'Magic' | 'Blade' | 'Bludgeon' => {
  if (id >= 1 && id <= 25) return 'Magic';
  if (id >= 26 && id <= 50) return 'Blade';
  return 'Bludgeon';
};

const getBeastTier = (id: number): number => {
  const offset = ((id - 1) % 25);
  if (offset < 5) return 1;
  if (offset < 10) return 2;
  if (offset < 15) return 3;
  if (offset < 20) return 4;
  return 5;
};

const getItemSlot = (itemId: number): string => {
  if (itemId === 0) return 'None';
  if (itemId <= 18) return 'Weapon';
  if (itemId <= 33) return 'Chest';
  if (itemId <= 48) return 'Head';
  if (itemId <= 63) return 'Waist';
  if (itemId <= 78) return 'Foot';
  if (itemId <= 93) return 'Hand';
  if (itemId <= 96) return 'Neck';
  if (itemId <= 99) return 'Ring';
  return 'None';
};

const getItemType = (itemId: number): string => {
  if (itemId === 0) return 'None';
  const slot = getItemSlot(itemId);

  if (slot === 'Weapon') {
    if (itemId <= 6) return 'Magic';
    if (itemId <= 12) return 'Blade';
    return 'Bludgeon';
  }

  if (['Chest', 'Head', 'Waist', 'Foot', 'Hand'].includes(slot)) {
    const baseOffset = slot === 'Chest' ? 19 : slot === 'Head' ? 34 : slot === 'Waist' ? 49 : slot === 'Foot' ? 64 : 79;
    const relativeId = itemId - baseOffset;
    if (relativeId < 5) return 'Cloth';
    if (relativeId < 10) return 'Hide';
    return 'Metal';
  }

  if (slot === 'Neck') {
    if (itemId === 94) return 'Necklace'; // Metal
    if (itemId === 95) return 'Amulet'; // Cloth
    return 'Pendant'; // Hide
  }

  return 'Ring';
};

const getItemTier = (itemId: number): number => {
  if (itemId === 0) return 5;
  const slot = getItemSlot(itemId);

  if (slot === 'Weapon') {
    const typeOffset = ((itemId - 1) % 6);
    if (typeOffset === 0) return 1;
    if (typeOffset === 1) return 2;
    if (typeOffset === 2) return 3;
    if (typeOffset === 3) return 4;
    return 5;
  }

  if (['Chest', 'Head', 'Waist', 'Foot', 'Hand'].includes(slot)) {
    const baseOffset = slot === 'Chest' ? 19 : slot === 'Head' ? 34 : slot === 'Waist' ? 49 : slot === 'Foot' ? 64 : 79;
    const relativeId = itemId - baseOffset;
    const tierOffset = relativeId % 5;
    return tierOffset + 1;
  }

  return 1; // Jewelry is T1
};

const getItemName = (itemId: number): string => {
  if (itemId === 0) return 'None';
  return `Item${itemId}`;
};

const calculateLevel = (xp: number): number => {
  if (xp === 0) return 1;
  return Math.floor(Math.sqrt(xp));
};

const ability_based_percentage = (xp: number, stat: number): number => {
  const level = calculateLevel(xp);
  return Math.min(100, Math.floor((stat * level) / 10));
};

const ability_based_damage_reduction = (xp: number, stat: number): number => {
  const level = calculateLevel(xp);
  return Math.min(100, Math.floor((stat * level) / 20));
};

const elementalAdjustedDamage = (baseDamage: number, attackType: string, armorType: string): number => {
  // Strong against: Magic > Cloth, Blade > Hide, Bludgeon > Metal
  // Weak against: Magic > Metal, Blade > Cloth, Bludgeon > Hide
  const isStrong = (
    (attackType === 'Magic' && armorType === 'Cloth') ||
    (attackType === 'Blade' && armorType === 'Hide') ||
    (attackType === 'Bludgeon' && armorType === 'Metal')
  );
  const isWeak = (
    (attackType === 'Magic' && armorType === 'Metal') ||
    (attackType === 'Blade' && armorType === 'Cloth') ||
    (attackType === 'Bludgeon' && armorType === 'Hide')
  );

  if (isStrong) return Math.floor(baseDamage * 1.5);
  if (isWeak) return Math.floor(baseDamage * 0.5);
  return baseDamage;
};

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

const applyDamageReduction = (damage: number, reductionPercent: number) => {
  if (damage <= 0) return 0;
  const clamped = clampPercentage(reductionPercent);
  if (clamped <= 0) return Math.max(0, Math.round(damage));
  return Math.max(0, Math.floor((Math.round(damage) * (100 - clamped)) / 100));
};

const getBeastCriticalChance = (adventurerLevel: number, isAmbush: boolean): number => {
  const multiplier = isAmbush ? CRITICAL_HIT_AMBUSH_MULTIPLIER : CRITICAL_HIT_LEVEL_MULTIPLIER;
  return Math.min(1, (adventurerLevel * multiplier) / 100);
};

const getObstacleCriticalChance = (adventurerLevel: number): number => (
  Math.min(1, (adventurerLevel * CRITICAL_HIT_LEVEL_MULTIPLIER) / 100)
);

const getEncounterLevelRange = (adventurerLevel: number) => {
  const baseMin = 1;
  const baseMax = Math.max(1, adventurerLevel * 3);

  let offset = 0;
  if (adventurerLevel >= 50) offset = 80;
  else if (adventurerLevel >= 40) offset = 40;
  else if (adventurerLevel >= 30) offset = 20;
  else if (adventurerLevel >= 20) offset = 10;

  return {
    min: baseMin + offset,
    max: baseMax + offset,
  };
};

const ensureItem = (item?: Item): Item => {
  if (!item) return { id: 0, xp: 0 };
  return item;
};

// Deterministic RNG for reproducible results
const createDeterministicRng = (seedValue: number) => {
  let state = (Math.floor(seedValue) >>> 0) || 0x6d2b79f5;
  return () => {
    state = Math.imul(state ^ 0x6d2b79f5, 0x85ebca6b) + 0x6d2b79f5;
    state ^= state >>> 15;
    state = Math.imul(state | 1, state);
    state ^= state + Math.imul(state ^ (state >>> 7), (state | 61));
    const result = (state ^ (state >>> 14)) >>> 0;
    return result / 0x100000000;
  };
};

// Beast damage calculation (simplified version for worker)
const calculateBeastDamage = (
  beastId: number,
  beastLevel: number,
  beastTier: number,
  armor: Item,
  adventurer: Adventurer,
  hasSpecialPrefix: boolean,
  hasSpecialSuffix: boolean,
): { baseDamage: number; criticalDamage: number } => {
  const beastPower = beastLevel * (6 - beastTier);
  const beastType = BEAST_TYPE_MAP[beastId];

  const armorId = armor.id || 0;
  const armorLevel = calculateLevel(armor.xp);
  const armorTier = armorId ? getItemTier(armorId) : 5;
  const armorType = armorId ? getItemType(armorId) : 'None';
  const armorPower = armorId ? armorLevel * (6 - armorTier) : 0;

  // Elemental adjustment
  let adjustedBeastPower = beastPower;
  if (armorType === 'Cloth' || armorType === 'Hide' || armorType === 'Metal') {
    adjustedBeastPower = elementalAdjustedDamage(beastPower, beastType, armorType);
  }

  // Special name damage bonus
  let specialBonus = 0;
  if (hasSpecialPrefix) specialBonus += Math.floor(beastPower * 0.25);
  if (hasSpecialSuffix) specialBonus += Math.floor(beastPower * 0.5);

  const totalAttack = adjustedBeastPower + specialBonus;
  const baseDamage = Math.max(MIN_DAMAGE_FROM_BEASTS, totalAttack - armorPower);
  const criticalDamage = Math.max(MIN_DAMAGE_FROM_BEASTS, (totalAttack * 2) - armorPower);

  return { baseDamage, criticalDamage };
};

// Monte Carlo beast slot calculation
const computeBeastSlotMonteCarlo = (
  slot: keyof Equipment,
  adventurer: Adventurer,
  levelRange: { min: number; max: number },
  isAmbush: boolean,
  gameSettings: Settings,
  sampleCount: number,
  rng: () => number,
): { lethalCount: number; totalWeight: number } => {
  const armor = ensureItem(adventurer.equipment[slot]);
  const armorLevel = calculateLevel(armor.xp);
  const hasArmorSpecials = Boolean(armor.id && adventurer.item_specials_seed && armorLevel >= 15);

  const levelCount = Math.max(1, levelRange.max - levelRange.min + 1);
  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const critChance = getBeastCriticalChance(adventurerLevel, isAmbush);
  const statsMode = gameSettings?.stats_mode ?? 'Dodge';
  const baseDamageReduction = isAmbush ? clampPercentage(gameSettings?.base_damage_reduction ?? 0) : 0;
  const wisdomStat = adventurer.stats.wisdom ?? 0;
  const statDamageReduction = isAmbush && statsMode === 'Reduction'
    ? clampPercentage(ability_based_damage_reduction(adventurer.xp, wisdomStat))
    : 0;
  const avoidChance = isAmbush && statsMode === 'Dodge'
    ? clampPercentage(ability_based_percentage(adventurer.xp, wisdomStat)) / 100
    : 0;

  const applyMitigation = (damage: number) => {
    let mitigated = damage;
    if (isAmbush && baseDamageReduction > 0) {
      mitigated = applyDamageReduction(mitigated, baseDamageReduction);
    }
    if (statDamageReduction > 0) {
      mitigated = applyDamageReduction(mitigated, statDamageReduction);
    }
    return Math.max(MIN_DAMAGE_FROM_BEASTS, Math.round(mitigated));
  };

  const prefixMatchChance = hasArmorSpecials ? 1 / BEAST_SPECIAL_PREFIX_POOL : 0;
  const suffixMatchChance = hasArmorSpecials ? 1 / BEAST_SPECIAL_SUFFIX_POOL : 0;
  const playerHealth = Math.max(0, adventurer.health ?? 0);

  let lethalCount = 0;
  let totalWeight = 0;
  const sampleWeight = 1 / sampleCount;

  for (let i = 0; i < sampleCount; i++) {
    // Random beast selection
    const beastIndex = Math.floor(rng() * BEAST_IDS.length);
    const beastId = BEAST_IDS[beastIndex];
    const beastTier = BEAST_TIER_MAP[beastId];

    // Random level selection
    const level = levelRange.min + Math.floor(rng() * levelCount);
    const hasSpecials = level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK;

    // Random special matching
    const hasPrefix = hasSpecials && hasArmorSpecials && rng() < prefixMatchChance;
    const hasSuffix = hasSpecials && hasArmorSpecials && rng() < suffixMatchChance;

    // Check if avoided
    if (avoidChance > 0 && rng() < avoidChance) {
      totalWeight += sampleWeight;
      continue; // 0 damage, not lethal
    }

    // Calculate damage
    const { baseDamage, criticalDamage } = calculateBeastDamage(
      beastId, level, beastTier, armor, adventurer, hasPrefix, hasSuffix
    );

    const isCrit = rng() < critChance;
    const rawDamage = isCrit ? criticalDamage : baseDamage;
    const finalDamage = applyMitigation(rawDamage);

    totalWeight += sampleWeight;
    if (finalDamage >= playerHealth) {
      lethalCount += sampleWeight;
    }
  }

  return { lethalCount, totalWeight };
};

// Monte Carlo obstacle slot calculation
const computeObstacleSlotMonteCarlo = (
  slot: keyof Equipment,
  adventurer: Adventurer,
  levelRange: { min: number; max: number },
  dodgeProbability: number,
  gameSettings: Settings,
  sampleCount: number,
  rng: () => number,
): { lethalCount: number; totalWeight: number } => {
  const armor = ensureItem(adventurer.equipment[slot]);
  const armorId = armor.id || 0;
  const armorLevel = calculateLevel(armor.xp);
  const armorTier = armorId ? getItemTier(armorId) : 5;
  const armorType = armorId ? getItemType(armorId) : 'None';
  const armorBase = armorId ? armorLevel * (6 - armorTier) : 0;
  const neckItem = ensureItem(adventurer.equipment.neck);

  const levelCount = Math.max(1, levelRange.max - levelRange.min + 1);
  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const critChance = getObstacleCriticalChance(adventurerLevel);
  const statsMode = gameSettings?.stats_mode ?? 'Dodge';
  const baseDamageReduction = clampPercentage(gameSettings?.base_damage_reduction ?? 0);
  const intelligenceStat = adventurer.stats.intelligence ?? 0;
  const statDamageReduction = statsMode === 'Reduction'
    ? clampPercentage(ability_based_damage_reduction(adventurer.xp, intelligenceStat))
    : 0;

  const applyMitigation = (damage: number) => {
    let mitigated = applyDamageReduction(damage, baseDamageReduction);
    if (statDamageReduction > 0) {
      mitigated = applyDamageReduction(mitigated, statDamageReduction);
    }
    return Math.max(MIN_DAMAGE_FROM_OBSTACLES, Math.round(mitigated));
  };

  // Necklace mitigation
  const applyNecklace = (damage: number): number => {
    if (!neckItem || !neckItem.id || !armorBase) return Math.max(0, Math.floor(damage));

    const neckType = getItemType(neckItem.id);
    const neckLevel = calculateLevel(neckItem.xp);
    if (neckLevel === 0) return Math.max(0, Math.floor(damage));

    const matches = (
      (armorType === 'Cloth' && neckType === 'Amulet') ||
      (armorType === 'Hide' && neckType === 'Pendant') ||
      (armorType === 'Metal' && neckType === 'Necklace')
    );

    if (!matches) return Math.max(0, Math.floor(damage));

    const bonus = Math.floor(armorBase * neckLevel * NECKLACE_ARMOR_BONUS / 100);
    if (damage > bonus + MIN_DAMAGE_FROM_OBSTACLES) {
      return Math.max(MIN_DAMAGE_FROM_OBSTACLES, Math.floor(damage - bonus));
    }
    return MIN_DAMAGE_FROM_OBSTACLES;
  };

  const playerHealth = Math.max(0, adventurer.health ?? 0);

  let lethalCount = 0;
  let totalWeight = 0;
  const sampleWeight = 1 / sampleCount;

  for (let i = 0; i < sampleCount; i++) {
    // Random obstacle selection
    const obstacleIndex = Math.floor(rng() * OBSTACLE_IDS.length);
    const obstacleId = OBSTACLE_IDS[obstacleIndex];
    const obstacleTier = OBSTACLE_TIER_MAP[obstacleId];
    const obstacleType = OBSTACLE_TYPE_MAP[obstacleId];

    // Random level selection
    const level = levelRange.min + Math.floor(rng() * levelCount);

    // Check if dodged
    if (dodgeProbability > 0 && rng() < dodgeProbability) {
      totalWeight += sampleWeight;
      continue; // 0 damage, not lethal
    }

    // Calculate damage
    const attackScale = 6 - obstacleTier;
    const attackValue = level * attackScale;
    const elementalBase = elementalAdjustedDamage(attackValue, obstacleType, armorType);

    const isCrit = rng() < critChance;
    const rawDamage = isCrit
      ? Math.max(MIN_DAMAGE_FROM_OBSTACLES, (elementalBase * 2) - armorBase)
      : Math.max(MIN_DAMAGE_FROM_OBSTACLES, elementalBase - armorBase);

    const afterNecklace = applyNecklace(rawDamage);
    const finalDamage = applyMitigation(afterNecklace);

    totalWeight += sampleWeight;
    if (finalDamage >= playerHealth) {
      lethalCount += sampleWeight;
    }
  }

  return { lethalCount, totalWeight };
};

// Main computation function
const computeExplorationInsights = (
  adventurer: Adventurer,
  gameSettings: Settings,
): { ambushLethalChance: number; trapLethalChance: number } => {
  initialiseLookups();

  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const levelRange = getEncounterLevelRange(adventurerLevel);

  // Create deterministic RNG based on adventurer state
  const rngSeed = (adventurer.xp ?? 0) + (adventurer.health ?? 0) +
    (adventurer.item_specials_seed ?? 0) + levelRange.min + levelRange.max +
    (gameSettings?.base_damage_reduction ?? 0);
  const rng = createDeterministicRng(rngSeed);

  // Beast (ambush) lethal chance - Monte Carlo across all slots
  let totalBeastLethal = 0;
  let totalBeastWeight = 0;

  for (const slot of SLOT_ORDER) {
    const { lethalCount, totalWeight } = computeBeastSlotMonteCarlo(
      slot, adventurer, levelRange, true, gameSettings,
      MONTE_CARLO_SAMPLES_PER_SLOT, rng
    );
    totalBeastLethal += lethalCount;
    totalBeastWeight += totalWeight;
  }

  const ambushLethalChance = totalBeastWeight > 0
    ? Number(((totalBeastLethal / totalBeastWeight) * 100).toFixed(2))
    : 0;

  // Obstacle (trap) lethal chance - Monte Carlo across all slots
  const statsMode = gameSettings?.stats_mode ?? 'Dodge';
  const intelligenceStat = adventurer.stats.intelligence ?? 0;
  const dodgePercent = statsMode === 'Dodge'
    ? clampPercentage(ability_based_percentage(adventurer.xp, intelligenceStat))
    : 0;
  const dodgeProbability = dodgePercent / 100;

  let totalObstacleLethal = 0;
  let totalObstacleWeight = 0;

  for (const slot of SLOT_ORDER) {
    const { lethalCount, totalWeight } = computeObstacleSlotMonteCarlo(
      slot, adventurer, levelRange, dodgeProbability, gameSettings,
      MONTE_CARLO_SAMPLES_PER_SLOT, rng
    );
    totalObstacleLethal += lethalCount;
    totalObstacleWeight += totalWeight;
  }

  const trapLethalChance = totalObstacleWeight > 0
    ? Number(((totalObstacleLethal / totalObstacleWeight) * 100).toFixed(2))
    : 0;

  return { ambushLethalChance, trapLethalChance };
};

// Worker message handler
self.onmessage = (event: MessageEvent<{ adventurer: Adventurer; gameSettings: Settings }>) => {
  const { adventurer, gameSettings } = event.data;

  if (!adventurer || !gameSettings) {
    self.postMessage({ ambushLethalChance: 0, trapLethalChance: 0 });
    return;
  }

  try {
    const result = computeExplorationInsights(adventurer, gameSettings);
    self.postMessage(result);
  } catch (error) {
    console.error('[ExplorationWorker] Error:', error);
    self.postMessage({ ambushLethalChance: 0, trapLethalChance: 0, error: String(error) });
  }
};
