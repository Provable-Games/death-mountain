import { BEAST_NAMES, BEAST_SPECIAL_NAME_LEVEL_UNLOCK, MAX_SPECIAL2, MAX_SPECIAL3 } from "@/constants/beast";
import type { Settings } from "@/dojo/useGameSettings";
import type { Adventurer, Beast, Equipment, Item } from "@/types/game";
import { getAttackType, getBeastTier } from "@/utils/beast";
import {
  ability_based_damage_reduction,
  ability_based_percentage,
  calculateBeastDamage,
  calculateLevel,
  elementalAdjustedDamage,
} from "@/utils/game";
import { Tier as ItemTier, ItemUtils } from "@/utils/loot";

const BEAST_IDS = Array.from({ length: 75 }, (_, index) => index + 1);
const OBSTACLE_IDS = Array.from({ length: 75 }, (_, index) => index + 1);
const SLOT_ORDER: Array<keyof Equipment> = ['hand', 'head', 'chest', 'waist', 'foot'];
const MIN_DAMAGE_FROM_BEASTS = 2;
const MIN_DAMAGE_FROM_OBSTACLES = 4;
const NECKLACE_ARMOR_BONUS = 3;
const BEAST_SPECIAL_PREFIX_POOL = Number(MAX_SPECIAL2);
const BEAST_SPECIAL_SUFFIX_POOL = Number(MAX_SPECIAL3);
const CRITICAL_HIT_LEVEL_MULTIPLIER = 1; // mirrors BeastSettings::CRITICAL_HIT_LEVEL_MULTIPLIER
const CRITICAL_HIT_AMBUSH_MULTIPLIER = 1; // mirrors BeastSettings::CRITICAL_HIT_AMBUSH_MULTIPLIER
const MONTE_CARLO_BEAST_SLOT_SAMPLES = 2000;

const getBeastCriticalChance = (adventurerLevel: number, isAmbush: boolean): number => {
  const multiplier = isAmbush ? CRITICAL_HIT_AMBUSH_MULTIPLIER : CRITICAL_HIT_LEVEL_MULTIPLIER;
  return Math.min(1, (adventurerLevel * multiplier) / 100);
};

const getObstacleCriticalChance = (adventurerLevel: number): number => (
  Math.min(1, (adventurerLevel * CRITICAL_HIT_LEVEL_MULTIPLIER) / 100)
);

const ENCOUNTER_BASE_MIX = {
  beast: 100 / 3,
  obstacle: 100 / 3,
  discovery: 100 - (2 * (100 / 3)),
};

const OBSTACLE_TYPE_MAP: Record<number, 'Magic' | 'Blade' | 'Bludgeon'> = {};
const OBSTACLE_TIER_MAP: Record<number, number> = {};

const BEAST_TYPE_MAP: Record<number, 'Magic' | 'Blade' | 'Bludgeon'> = {};
const BEAST_TIER_MAP: Record<number, number> = {};

const initialiseLookups = () => {
  if (Object.keys(OBSTACLE_TYPE_MAP).length > 0) return;

  for (const id of OBSTACLE_IDS) {
    if ((id >= 1 && id < 26)) {
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
    BEAST_TYPE_MAP[id] = getAttackType(id) as 'Magic' | 'Blade' | 'Bludgeon';
    BEAST_TIER_MAP[id] = getBeastTier(id);
  }
};

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

const getErrorMessage = (error: unknown): string => {
  if (!error) {
    return '';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  const withMessage = error as { message?: unknown };
  if (typeof withMessage?.message === 'string') {
    return String(withMessage.message);
  }

  const nested = (error as { error?: { message?: unknown } })?.error;
  if (nested && typeof nested.message === 'string') {
    return String(nested.message);
  }

  return '';
};

const isStackOverflowError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('maximum call stack') || message.includes('call stack size exceeded');
};

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

const applyNecklaceMitigation = (
  baseDamage: number,
  armorBase: number,
  armorType: string,
  neck: Item,
): number => {
  if (!neck || !neck.id || !armorBase) return Math.max(0, Math.floor(baseDamage));

  const neckName = ItemUtils.getItemName(neck.id);
  const neckLevel = calculateLevel(neck.xp);
  if (neckLevel === 0) return Math.max(0, Math.floor(baseDamage));

  const matches = (
    (armorType === 'Cloth' && neckName === 'Amulet') ||
    (armorType === 'Hide' && neckName === 'Pendant') ||
    (armorType === 'Metal' && neckName === 'Necklace')
  );

  if (!matches) {
    return Math.max(0, Math.floor(baseDamage));
  }

  const bonus = Math.floor(armorBase * neckLevel * NECKLACE_ARMOR_BONUS / 100);
  if (baseDamage > bonus + MIN_DAMAGE_FROM_OBSTACLES) {
    return Math.max(MIN_DAMAGE_FROM_OBSTACLES, Math.floor(baseDamage - bonus));
  }
  return MIN_DAMAGE_FROM_OBSTACLES;
};

const finaliseBeastDamage = (rawDamage: number) => Math.max(MIN_DAMAGE_FROM_BEASTS, Math.round(rawDamage));

const finaliseObstacleDamage = (rawDamage: number) => Math.max(MIN_DAMAGE_FROM_OBSTACLES, Math.round(rawDamage));

const getItemTierNumeric = (tier: ItemTier): number => {
  if (typeof tier === 'number') return tier;
  return Number(tier);
};

const ensureItem = (item?: Item): Item => {
  if (!item) {
    return { id: 0, xp: 0 };
  }
  return item;
};

interface WeightedSample {
  value: number;
  weight: number;
}

const computeMedianDamage = (samples: WeightedSample[]): number => {
  if (!samples.length) return 0;

  const sorted = samples
    .map(sample => ({ value: sample.value, weight: sample.weight }))
    .sort((a, b) => a.value - b.value);

  const total = sorted.reduce((sum, sample) => sum + sample.weight, 0);
  let cumulative = 0;
  const target = total / 2;

  for (const sample of sorted) {
    cumulative += sample.weight;
    if (cumulative >= target) {
      return sample.value;
    }
  }

  return sorted[sorted.length - 1].value;
};

export interface DamageBucket {
  start: number;
  end: number;
  percentage: number;
  label: string;
}

const buildDamageDistribution = (samples: WeightedSample[], maxBuckets = 6): DamageBucket[] => {
  if (!samples.length) return [];

  const totals = new Map<number, number>();
  let totalWeight = 0;

  for (const { value, weight } of samples) {
    if (weight <= 0) continue;
    const damage = Math.max(0, Math.round(value));
    const current = totals.get(damage) ?? 0;
    totals.set(damage, current + weight);
    totalWeight += weight;
  }

  if (totalWeight === 0 || totals.size === 0) {
    return [];
  }

  const damageValues = Array.from(totals.keys()).sort((a, b) => a - b);
  const overflowValues = damageValues.filter(value => value > 1024);
  const baseValues = damageValues.filter(value => value <= 1024);

  const buckets: DamageBucket[] = [];
  let remainingBuckets = 10;

  if (overflowValues.length > 0) {
    const overflowWeight = overflowValues.reduce((sum, damage) => sum + (totals.get(damage) ?? 0), 0);
    let minOverflow = overflowValues[0];
    let maxOverflow = overflowValues[0];

    for (let i = 1; i < overflowValues.length; i += 1) {
      const value = overflowValues[i];
      if (value < minOverflow) minOverflow = value;
      if (value > maxOverflow) maxOverflow = value;
    }

    buckets.push({
      start: minOverflow,
      end: maxOverflow,
      percentage: Number(((overflowWeight / totalWeight) * 100).toFixed(2)),
      label: '>1024',
    });
    remainingBuckets -= 1;
  }

  if (baseValues.length > 0 && remainingBuckets > 0) {
    const minDamage = baseValues[0];
    const maxDamage = baseValues[baseValues.length - 1];

    if (minDamage === maxDamage) {
      buckets.push({
        start: minDamage,
        end: maxDamage,
        percentage: Number(((totals.get(minDamage) ?? 0) / totalWeight * 100).toFixed(2)),
        label: `${minDamage}`,
      });
    } else {
      const span = maxDamage - minDamage + 1;
      const bucketSize = Math.max(1, Math.ceil(span / remainingBuckets));
      const bucketWeights = new Array<number>(remainingBuckets).fill(0);

      for (const [damage, weight] of totals.entries()) {
        if (damage > 1024) continue;
        const index = Math.min(remainingBuckets - 1, Math.floor((damage - minDamage) / bucketSize));
        bucketWeights[index] += weight;
      }

      for (let i = 0; i < remainingBuckets; i += 1) {
        const start = Math.min(maxDamage, minDamage + i * bucketSize);
        const end = Math.min(maxDamage, start + bucketSize - 1);
        const percentage = Number(((bucketWeights[i] / totalWeight) * 100).toFixed(2));

        buckets.push({
          start,
          end,
          percentage,
          label: start === end ? `${start}` : `${start}-${end}`,
        });
      }
    }
  }

  return buckets.sort((a, b) => a.start - b.start);
};

export interface SlotDamageSummary {
  slot: keyof Equipment;
  slotLabel: string;
  armorName: string;
  hasArmor: boolean;
  minBase: number;
  maxBase: number;
  minCrit: number;
  maxCrit: number;
  distribution: DamageBucket[];
  lethalChance: number;
}

export interface BeastRiskSummary {
  ambushChance: number;
  critChance: number;
  tierDistribution: Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  typeDistribution: Record<'Magic' | 'Blade' | 'Bludgeon', number>;
  slotDamages: SlotDamageSummary[];
  damageDistribution: DamageBucket[];
  medianDamage: number;
  overallLethalChance: number;
}

export interface ObstacleRiskSummary {
  dodgeChance: number;
  critChance: number;
  tierDistribution: Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  typeDistribution: Record<'Magic' | 'Blade' | 'Bludgeon', number>;
  slotDamages: SlotDamageSummary[];
  damageDistribution: DamageBucket[];
  medianDamage: number;
  overallLethalChance: number;
}

export interface DiscoverySummary {
  goldChance: number;
  healthChance: number;
  lootChance: number;
  goldRange: { min: number; max: number };
  healthRange: { min: number; max: number };
}

export interface EncounterDistribution {
  baseMix: typeof ENCOUNTER_BASE_MIX;
  beastByTier: Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  beastByType: Record<'Magic' | 'Blade' | 'Bludgeon', number>;
  obstacleByTier: Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  obstacleByType: Record<'Magic' | 'Blade' | 'Bludgeon', number>;
}

export interface ExplorationInsights {
  ready: boolean;
  encounterDistribution: EncounterDistribution;
  beasts: BeastRiskSummary;
  obstacles: ObstacleRiskSummary;
  discoveries: DiscoverySummary;
}

const makeEmptySlotSummary = (slot: keyof Equipment): SlotDamageSummary => ({
  slot,
  slotLabel: slot.charAt(0).toUpperCase() + slot.slice(1),
  armorName: 'None',
  hasArmor: false,
  minBase: 0,
  maxBase: 0,
  minCrit: 0,
  maxCrit: 0,
  distribution: [],
  lethalChance: 0,
});

const makeFallbackSlotSummary = (
  slot: keyof Equipment,
  adventurer: Adventurer,
): SlotDamageSummary => {
  const baseSummary = makeEmptySlotSummary(slot);
  const armor = ensureItem(adventurer.equipment[slot]);

  if (!armor.id) {
    return baseSummary;
  }

  return {
    ...baseSummary,
    armorName: ItemUtils.getItemName(armor.id),
    hasArmor: true,
  };
};

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

const applyDamageReduction = (damage: number, reductionPercent: number) => {
  if (damage <= 0) {
    return 0;
  }

  const clamped = clampPercentage(reductionPercent);
  if (clamped <= 0) {
    return Math.max(0, Math.round(damage));
  }

  return Math.max(0, Math.floor((Math.round(damage) * (100 - clamped)) / 100));
};

const computeBeastSlotSummary = (
  slot: keyof Equipment,
  adventurer: Adventurer,
  levelRange: { min: number; max: number },
  isAmbush: boolean,
  gameSettings: Settings,
): {
  summary: SlotDamageSummary;
  samples: WeightedSample[];
} => {
  const armor = ensureItem(adventurer.equipment[slot]);
  const armorName = armor.id ? ItemUtils.getItemName(armor.id) : 'None';
  const armorLevel = calculateLevel(armor.xp);
  const armorSpecials = armor.id && adventurer.item_specials_seed
    ? ItemUtils.getSpecials(armor.id, armorLevel, adventurer.item_specials_seed)
    : { prefix: null, suffix: null };

  const levelCount = Math.max(1, levelRange.max - levelRange.min + 1);
  const levelWeight = 1 / levelCount;
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
  const hitChance = 1 - avoidChance;

  const applyAmbushMitigation = (damage: number) => {
    let mitigated = damage;
    if (isAmbush && baseDamageReduction > 0) {
      mitigated = applyDamageReduction(mitigated, baseDamageReduction);
    }
    if (statDamageReduction > 0) {
      mitigated = applyDamageReduction(mitigated, statDamageReduction);
    }
    return mitigated;
  };

  const prefixMatchChance = armorSpecials.prefix ? 1 / BEAST_SPECIAL_PREFIX_POOL : 0;
  const suffixMatchChance = armorSpecials.suffix ? 1 / BEAST_SPECIAL_SUFFIX_POOL : 0;
  const bothMatchChance = prefixMatchChance * suffixMatchChance;
  const prefixOnlyChance = Math.max(0, prefixMatchChance - bothMatchChance);
  const suffixOnlyChance = Math.max(0, suffixMatchChance - bothMatchChance);
  const noneMatchChance = Math.max(0, 1 - prefixMatchChance - suffixMatchChance + bothMatchChance);

  let minBase = Number.POSITIVE_INFINITY;
  let maxBase = 0;
  let minCrit = Number.POSITIVE_INFINITY;
  let maxCrit = 0;
  const samples: WeightedSample[] = [];
  const candidates: Array<{ id: number; damage: number; weight: number }> = [];
  let totalWeight = 0;

  const pushSample = (id: number, value: number, weight: number) => {
    if (weight <= 0) return;
    const damage = Math.round(value);
    samples.push({ value: damage, weight });
    candidates.push({ id, damage, weight });
    totalWeight += weight;
  };

  for (const beastId of BEAST_IDS) {
    const tier = BEAST_TIER_MAP[beastId];

    for (let level = levelRange.min; level <= levelRange.max; level += 1) {
      const hasSpecials = level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK;
      const scenarios = hasSpecials
        ? [
            { prefix: false, suffix: false, probability: noneMatchChance },
            { prefix: true, suffix: false, probability: prefixOnlyChance },
            { prefix: false, suffix: true, probability: suffixOnlyChance },
            { prefix: true, suffix: true, probability: bothMatchChance },
          ]
        : [{ prefix: false, suffix: false, probability: 1 }];

      for (const scenario of scenarios) {
        if (scenario.probability <= 0) continue;
        if (scenario.prefix && !armorSpecials.prefix) continue;
        if (scenario.suffix && !armorSpecials.suffix) continue;

        const scenarioWeight = levelWeight * scenario.probability;
        if (scenarioWeight <= 0) continue;

        const beast: Beast = {
          id: beastId,
          seed: 0n,
          baseName: BEAST_NAMES[beastId] || 'Beast',
          name: BEAST_NAMES[beastId] || 'Beast',
          health: 0,
          level,
          type: '',
          tier,
          specialPrefix: scenario.prefix ? armorSpecials.prefix ?? null : null,
          specialSuffix: scenario.suffix ? armorSpecials.suffix ?? null : null,
          isCollectable: false,
        };

        const damageDetails = calculateBeastDamage(beast, adventurer, armor);
        const baseDamage = applyAmbushMitigation(finaliseBeastDamage(damageDetails.baseDamage));
        const critDamage = applyAmbushMitigation(finaliseBeastDamage(damageDetails.criticalDamage));

        const hitWeight = scenarioWeight * hitChance;
        const baseWeight = hitWeight * (1 - critChance);
        const critWeight = hitWeight * critChance;

        if (baseWeight > 0) {
          pushSample(beastId, baseDamage, baseWeight);
          minBase = Math.min(minBase, baseDamage);
          maxBase = Math.max(maxBase, baseDamage);
        }

        if (critWeight > 0) {
          pushSample(beastId, critDamage, critWeight);
          minCrit = Math.min(minCrit, critDamage);
          maxCrit = Math.max(maxCrit, critDamage);
        }

        const avoidWeight = scenarioWeight * avoidChance;
        if (avoidWeight > 0) {
          pushSample(beastId, 0, avoidWeight);
        }
      }
    }
  }

  if (!Number.isFinite(minBase)) {
    minBase = MIN_DAMAGE_FROM_BEASTS;
    maxBase = MIN_DAMAGE_FROM_BEASTS;
  }

  if (!Number.isFinite(minCrit)) {
    minCrit = MIN_DAMAGE_FROM_BEASTS;
    maxCrit = MIN_DAMAGE_FROM_BEASTS;
  }

  const distribution = buildDamageDistribution(samples);
  const healthThreshold = Math.max(0, adventurer.health ?? 0);
  let lethalChance = 0;

  if (healthThreshold > 0 && totalWeight > 0) {
    const lethalWeight = samples.reduce((sum, sample) => (
      sample.value >= healthThreshold ? sum + sample.weight : sum
    ), 0);

    lethalChance = Number(((lethalWeight / totalWeight) * 100).toFixed(2));
  }
  let threat:
    | {
        id: number;
        damage: number;
        slot: keyof Equipment;
        chance: number;
      }
    | undefined;

  return {
    summary: {
      slot,
      slotLabel: slot.charAt(0).toUpperCase() + slot.slice(1),
      armorName,
      hasArmor: Boolean(armor.id),
      minBase,
      maxBase,
      minCrit,
      maxCrit,
      distribution,
      lethalChance,
    },
    samples,
  };
};

const computeBeastSlotSummaryMonteCarlo = (
  slot: keyof Equipment,
  adventurer: Adventurer,
  levelRange: { min: number; max: number },
  isAmbush: boolean,
  gameSettings: Settings,
  sampleCount: number,
  rng: () => number,
): { summary: SlotDamageSummary; samples: WeightedSample[] } => {
  const armor = ensureItem(adventurer.equipment[slot]);
  const armorName = armor.id ? ItemUtils.getItemName(armor.id) : 'None';
  const armorLevel = calculateLevel(armor.xp);
  const armorSpecials = armor.id && adventurer.item_specials_seed
    ? ItemUtils.getSpecials(armor.id, armorLevel, adventurer.item_specials_seed)
    : { prefix: null, suffix: null };

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

  const applyAmbushMitigation = (damage: number) => {
    let mitigated = damage;
    if (isAmbush && baseDamageReduction > 0) {
      mitigated = applyDamageReduction(mitigated, baseDamageReduction);
    }
    if (statDamageReduction > 0) {
      mitigated = applyDamageReduction(mitigated, statDamageReduction);
    }
    return mitigated;
  };

  const prefixMatchChance = armorSpecials.prefix ? 1 / BEAST_SPECIAL_PREFIX_POOL : 0;
  const suffixMatchChance = armorSpecials.suffix ? 1 / BEAST_SPECIAL_SUFFIX_POOL : 0;
  const bothMatchChance = prefixMatchChance * suffixMatchChance;
  const prefixOnlyChance = Math.max(0, prefixMatchChance - bothMatchChance);
  const suffixOnlyChance = Math.max(0, suffixMatchChance - bothMatchChance);
  const noneMatchChance = Math.max(0, 1 - prefixMatchChance - suffixMatchChance + bothMatchChance);

  let minBase = Number.POSITIVE_INFINITY;
  let maxBase = 0;
  let minCrit = Number.POSITIVE_INFINITY;
  let maxCrit = 0;
  const samples: WeightedSample[] = [];
  let totalWeight = 0;
  const sampleWeight = sampleCount > 0 ? 1 / sampleCount : 0;

  const pushSample = (value: number, weight: number) => {
    if (weight <= 0) return;
    const damage = Math.round(value);
    samples.push({ value: damage, weight });
    totalWeight += weight;
  };

  if (sampleWeight <= 0) {
    return {
      summary: makeFallbackSlotSummary(slot, adventurer),
      samples,
    };
  }

  for (let index = 0; index < sampleCount; index += 1) {
    const beastIndex = Math.floor(rng() * BEAST_IDS.length) % BEAST_IDS.length;
    const beastId = BEAST_IDS[beastIndex];
    const tier = BEAST_TIER_MAP[beastId];
    const levelOffset = Math.floor(rng() * levelCount);
    const level = levelRange.min + levelOffset;
    const hasSpecials = level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK;
    const scenarios = hasSpecials
      ? [
          { prefix: false, suffix: false, probability: noneMatchChance },
          { prefix: true, suffix: false, probability: prefixOnlyChance },
          { prefix: false, suffix: true, probability: suffixOnlyChance },
          { prefix: true, suffix: true, probability: bothMatchChance },
        ]
      : [{ prefix: false, suffix: false, probability: 1 }];

    const validScenarios = scenarios.filter((scenario) => {
      if (scenario.probability <= 0) return false;
      if (scenario.prefix && !armorSpecials.prefix) return false;
      if (scenario.suffix && !armorSpecials.suffix) return false;
      return true;
    });

    let selectedScenario = validScenarios[validScenarios.length - 1] ?? { prefix: false, suffix: false, probability: 1 };

    if (validScenarios.length > 0) {
      const totalProbability = validScenarios.reduce((sum, scenario) => sum + scenario.probability, 0);
      if (totalProbability > 0) {
        let roll = rng() * totalProbability;
        for (const scenario of validScenarios) {
          if (roll <= scenario.probability) {
            selectedScenario = scenario;
            break;
          }
          roll -= scenario.probability;
        }
      }
    }

    const beast: Beast = {
      id: beastId,
      seed: 0n,
      baseName: BEAST_NAMES[beastId] || 'Beast',
      name: BEAST_NAMES[beastId] || 'Beast',
      health: 0,
      level,
      type: '',
      tier,
      specialPrefix: selectedScenario.prefix ? armorSpecials.prefix ?? null : null,
      specialSuffix: selectedScenario.suffix ? armorSpecials.suffix ?? null : null,
      isCollectable: false,
    };

    const damageDetails = calculateBeastDamage(beast, adventurer, armor);
    const baseDamage = applyAmbushMitigation(finaliseBeastDamage(damageDetails.baseDamage));
    const critDamage = applyAmbushMitigation(finaliseBeastDamage(damageDetails.criticalDamage));

    if (avoidChance > 0 && rng() < avoidChance) {
      pushSample(0, sampleWeight);
      continue;
    }

    if (rng() < critChance) {
      pushSample(critDamage, sampleWeight);
      minCrit = Math.min(minCrit, critDamage);
      maxCrit = Math.max(maxCrit, critDamage);
    } else {
      pushSample(baseDamage, sampleWeight);
      minBase = Math.min(minBase, baseDamage);
      maxBase = Math.max(maxBase, baseDamage);
    }
  }

  if (!Number.isFinite(minBase)) {
    minBase = MIN_DAMAGE_FROM_BEASTS;
    maxBase = MIN_DAMAGE_FROM_BEASTS;
  }

  if (!Number.isFinite(minCrit)) {
    minCrit = MIN_DAMAGE_FROM_BEASTS;
    maxCrit = MIN_DAMAGE_FROM_BEASTS;
  }

  const distribution = buildDamageDistribution(samples);
  const healthThreshold = Math.max(0, adventurer.health ?? 0);
  let lethalChance = 0;

  if (healthThreshold > 0 && totalWeight > 0) {
    const lethalWeight = samples.reduce((sum, sample) => (
      sample.value >= healthThreshold ? sum + sample.weight : sum
    ), 0);

    lethalChance = Number(((lethalWeight / totalWeight) * 100).toFixed(2));
  }

  return {
    summary: {
      slot,
      slotLabel: slot.charAt(0).toUpperCase() + slot.slice(1),
      armorName,
      hasArmor: Boolean(armor.id),
      minBase,
      maxBase,
      minCrit,
      maxCrit,
      distribution,
      lethalChance,
    },
    samples,
  };
};

const computeObstacleSlotSummary = (
  slot: keyof Equipment,
  adventurer: Adventurer,
  levelRange: { min: number; max: number },
  dodgeProbability: number,
  gameSettings: Settings,
): {
  summary: SlotDamageSummary;
  samples: WeightedSample[];
} => {
  const armor = ensureItem(adventurer.equipment[slot]);
  const armorName = armor.id ? ItemUtils.getItemName(armor.id) : 'None';
  const armorLevel = calculateLevel(armor.xp);
  const armorTier = armor.id ? getItemTierNumeric(ItemUtils.getItemTier(armor.id)) : 0;
  const armorType = armor.id ? ItemUtils.getItemType(armor.id) : 'None';
  const armorBase = armor.id ? armorLevel * Math.max(0, 6 - armorTier) : 0;
  const neckItem = ensureItem(adventurer.equipment.neck);

  let minBase = Number.POSITIVE_INFINITY;
  let maxBase = 0;
  let minCrit = Number.POSITIVE_INFINITY;
  let maxCrit = 0;
  const samples: WeightedSample[] = [];
  const candidates: Array<{ id: number; damage: number; weight: number }> = [];
  let totalWeight = 0;

  const levelCount = Math.max(1, levelRange.max - levelRange.min + 1);
  const levelWeight = 1 / levelCount;
  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const critChance = getObstacleCriticalChance(adventurerLevel);
  const statsMode = gameSettings?.stats_mode ?? 'Dodge';
  const baseDamageReduction = clampPercentage(gameSettings?.base_damage_reduction ?? 0);
  const intelligenceStat = adventurer.stats.intelligence ?? 0;
  const statDamageReduction = statsMode === 'Reduction'
    ? clampPercentage(ability_based_damage_reduction(adventurer.xp, intelligenceStat))
    : 0;

  const applyObstacleMitigation = (damage: number) => {
    let mitigated = applyDamageReduction(damage, baseDamageReduction);
    if (statDamageReduction > 0) {
      mitigated = applyDamageReduction(mitigated, statDamageReduction);
    }
    return mitigated;
  };

  const pushSample = (id: number, value: number, weight: number) => {
    if (weight <= 0) return;
    const damage = Math.round(value);
    samples.push({ value: damage, weight });
    candidates.push({ id, damage, weight });
    totalWeight += weight;
  };

  for (const obstacleId of OBSTACLE_IDS) {
    const tier = OBSTACLE_TIER_MAP[obstacleId];
    const type = OBSTACLE_TYPE_MAP[obstacleId];
    const attackScale = Math.max(0, 6 - tier);

    for (let level = levelRange.min; level <= levelRange.max; level += 1) {
      const attackValue = level * attackScale;
      const elementalBase = elementalAdjustedDamage(attackValue, type, armorType);
      const baseDamageRaw = Math.max(MIN_DAMAGE_FROM_OBSTACLES, elementalBase - armorBase);
      const critDamageRaw = Math.max(MIN_DAMAGE_FROM_OBSTACLES, (elementalBase * 2) - armorBase);

      const adjustedBase = applyNecklaceMitigation(baseDamageRaw, armorBase, armorType, neckItem);
      const adjustedCrit = applyNecklaceMitigation(critDamageRaw, armorBase, armorType, neckItem);

      const finalBase = applyObstacleMitigation(finaliseObstacleDamage(adjustedBase));
      const finalCrit = applyObstacleMitigation(finaliseObstacleDamage(adjustedCrit));

      if (dodgeProbability > 0) {
        pushSample(obstacleId, 0, levelWeight * dodgeProbability);
      }

      const hitWeight = levelWeight * (1 - dodgeProbability);
      if (hitWeight > 0) {
        pushSample(obstacleId, finalBase, hitWeight * (1 - critChance));
        pushSample(obstacleId, finalCrit, hitWeight * critChance);

        minBase = Math.min(minBase, finalBase);
        maxBase = Math.max(maxBase, finalBase);
        minCrit = Math.min(minCrit, finalCrit);
        maxCrit = Math.max(maxCrit, finalCrit);
      }
    }
  }

  if (!Number.isFinite(minBase)) {
    minBase = MIN_DAMAGE_FROM_OBSTACLES;
    maxBase = MIN_DAMAGE_FROM_OBSTACLES;
  }

  if (!Number.isFinite(minCrit)) {
    minCrit = MIN_DAMAGE_FROM_OBSTACLES;
    maxCrit = MIN_DAMAGE_FROM_OBSTACLES;
  }

  const distribution = buildDamageDistribution(samples);
  const healthThreshold = Math.max(0, adventurer.health ?? 0);
  let lethalChance = 0;

  if (healthThreshold > 0 && totalWeight > 0) {
    const lethalWeight = samples.reduce((sum, sample) => (
      sample.value >= healthThreshold ? sum + sample.weight : sum
    ), 0);

    lethalChance = Number(((lethalWeight / totalWeight) * 100).toFixed(2));
  }

  return {
    summary: {
      slot,
      slotLabel: slot.charAt(0).toUpperCase() + slot.slice(1),
      armorName,
      hasArmor: Boolean(armor.id),
      minBase,
      maxBase,
      minCrit,
      maxCrit,
      distribution,
      lethalChance,
    },
    samples,
  };
};

const computeBeastRisk = (
  adventurer: Adventurer,
  levelRange: { min: number; max: number },
  _gameSettings: Settings,
  isAmbush: boolean,
): BeastRiskSummary => {
  const tierCounts = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 } as Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  const typeCounts = { Magic: 0, Blade: 0, Bludgeon: 0 } as Record<'Magic' | 'Blade' | 'Bludgeon', number>;

  for (const beastId of BEAST_IDS) {
    const tier = BEAST_TIER_MAP[beastId];
    const type = BEAST_TYPE_MAP[beastId];
    tierCounts[`T${tier}` as keyof typeof tierCounts] += 1;
    typeCounts[type] += 1;
  }

  const slotSummaries: SlotDamageSummary[] = [];
  const aggregatedSamples: WeightedSample[] = [];
  const statsMode = _gameSettings?.stats_mode ?? 'Dodge';
  const wisdomStat = adventurer.stats.wisdom ?? 0;
  const avoidPercent = isAmbush && statsMode === 'Dodge'
    ? clampPercentage(ability_based_percentage(adventurer.xp, wisdomStat))
    : 0;
  const ambushChance = isAmbush
    ? Number((100 - avoidPercent).toFixed(2))
    : 0;

  for (const slot of SLOT_ORDER) {
    const { summary, samples } = computeBeastSlotSummary(
      slot,
      adventurer,
      levelRange,
      isAmbush,
      _gameSettings,
    );
    slotSummaries.push(summary);
    aggregatedSamples.push(...samples);
  }
  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const critChance = Number((getBeastCriticalChance(adventurerLevel, isAmbush) * 100).toFixed(2));
  const damageDistribution = buildDamageDistribution(aggregatedSamples);
  const medianDamage = computeMedianDamage(aggregatedSamples);
  const playerHealth = Math.max(0, adventurer.health ?? 0);
  let overallLethalChance = 0;

  if (playerHealth > 0) {
    const totalWeight = aggregatedSamples.reduce((sum, sample) => sum + sample.weight, 0);
    if (totalWeight > 0) {
      const lethalWeight = aggregatedSamples.reduce((sum, sample) => (
        sample.value >= playerHealth ? sum + sample.weight : sum
      ), 0);

      overallLethalChance = Number(((lethalWeight / totalWeight) * 100).toFixed(2));
    }
  }

  return {
    ambushChance,
    critChance,
    tierDistribution: Object.fromEntries(Object.entries(tierCounts).map(([key, value]) => [key, Number(((value / BEAST_IDS.length) * 100).toFixed(2))])) as BeastRiskSummary['tierDistribution'],
    typeDistribution: Object.fromEntries(Object.entries(typeCounts).map(([key, value]) => [key, Number(((value / BEAST_IDS.length) * 100).toFixed(2))])) as BeastRiskSummary['typeDistribution'],
    slotDamages: slotSummaries,
    damageDistribution,
    medianDamage,
    overallLethalChance,
  };
};

const computeBeastRiskMonteCarlo = (
  adventurer: Adventurer,
  levelRange: { min: number; max: number },
  gameSettings: Settings,
  isAmbush: boolean,
  sampleCount = MONTE_CARLO_BEAST_SLOT_SAMPLES,
): BeastRiskSummary => {
  const tierCounts = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 } as Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  const typeCounts = { Magic: 0, Blade: 0, Bludgeon: 0 } as Record<'Magic' | 'Blade' | 'Bludgeon', number>;

  for (const beastId of BEAST_IDS) {
    const tier = BEAST_TIER_MAP[beastId];
    const type = BEAST_TYPE_MAP[beastId];
    tierCounts[`T${tier}` as keyof typeof tierCounts] += 1;
    typeCounts[type] += 1;
  }

  const statsMode = gameSettings?.stats_mode ?? 'Dodge';
  const wisdomStat = adventurer.stats.wisdom ?? 0;
  const avoidPercent = isAmbush && statsMode === 'Dodge'
    ? clampPercentage(ability_based_percentage(adventurer.xp, wisdomStat))
    : 0;
  const ambushChance = isAmbush
    ? Number((100 - avoidPercent).toFixed(2))
    : 0;

  const rngSeedBase =
    (adventurer.xp ?? 0) +
    (adventurer.health ?? 0) +
    (adventurer.item_specials_seed ?? 0) +
    levelRange.min +
    levelRange.max +
    (gameSettings?.base_damage_reduction ?? 0);
  const rng = createDeterministicRng(rngSeedBase);

  const slotSummaries: SlotDamageSummary[] = [];
  const aggregatedSamples: WeightedSample[] = [];

  for (const slot of SLOT_ORDER) {
    const { summary, samples } = computeBeastSlotSummaryMonteCarlo(
      slot,
      adventurer,
      levelRange,
      isAmbush,
      gameSettings,
      sampleCount,
      rng,
    );
    slotSummaries.push(summary);
    aggregatedSamples.push(...samples);
  }

  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const critChance = Number((getBeastCriticalChance(adventurerLevel, isAmbush) * 100).toFixed(2));
  const damageDistribution = buildDamageDistribution(aggregatedSamples);
  const medianDamage = computeMedianDamage(aggregatedSamples);
  const playerHealth = Math.max(0, adventurer.health ?? 0);
  let overallLethalChance = 0;

  if (playerHealth > 0) {
    const totalWeight = aggregatedSamples.reduce((sum, sample) => sum + sample.weight, 0);
    if (totalWeight > 0) {
      const lethalWeight = aggregatedSamples.reduce((sum, sample) => (
        sample.value >= playerHealth ? sum + sample.weight : sum
      ), 0);

      overallLethalChance = Number(((lethalWeight / totalWeight) * 100).toFixed(2));
    }
  }

  return {
    ambushChance,
    critChance,
    tierDistribution: Object.fromEntries(Object.entries(tierCounts).map(([key, value]) => [key, Number(((value / BEAST_IDS.length) * 100).toFixed(2))])) as BeastRiskSummary['tierDistribution'],
    typeDistribution: Object.fromEntries(Object.entries(typeCounts).map(([key, value]) => [key, Number(((value / BEAST_IDS.length) * 100).toFixed(2))])) as BeastRiskSummary['typeDistribution'],
    slotDamages: slotSummaries,
    damageDistribution,
    medianDamage,
    overallLethalChance,
  };
};

const buildMinimalBeastRiskSummary = (
  adventurer: Adventurer,
  _levelRange: { min: number; max: number },
  gameSettings: Settings,
  isAmbush: boolean,
): BeastRiskSummary => {
  const tierCounts = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 } as Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  const typeCounts = { Magic: 0, Blade: 0, Bludgeon: 0 } as Record<'Magic' | 'Blade' | 'Bludgeon', number>;

  for (const beastId of BEAST_IDS) {
    const tier = BEAST_TIER_MAP[beastId];
    const type = BEAST_TYPE_MAP[beastId];
    tierCounts[`T${tier}` as keyof typeof tierCounts] += 1;
    typeCounts[type] += 1;
  }

  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const critChance = Number((getBeastCriticalChance(adventurerLevel, isAmbush) * 100).toFixed(2));
  const statsMode = gameSettings?.stats_mode ?? 'Dodge';
  const wisdomStat = adventurer.stats.wisdom ?? 0;
  const avoidPercent = isAmbush && statsMode === 'Dodge'
    ? clampPercentage(ability_based_percentage(adventurer.xp, wisdomStat))
    : 0;
  const ambushChance = isAmbush
    ? Number((100 - avoidPercent).toFixed(2))
    : 0;

  return {
    ambushChance,
    critChance,
    tierDistribution: Object.fromEntries(Object.entries(tierCounts).map(([key, value]) => [key, Number(((value / BEAST_IDS.length) * 100).toFixed(2))])) as BeastRiskSummary['tierDistribution'],
    typeDistribution: Object.fromEntries(Object.entries(typeCounts).map(([key, value]) => [key, Number(((value / BEAST_IDS.length) * 100).toFixed(2))])) as BeastRiskSummary['typeDistribution'],
    slotDamages: SLOT_ORDER.map(slot => makeFallbackSlotSummary(slot, adventurer)),
    damageDistribution: [],
    medianDamage: MIN_DAMAGE_FROM_BEASTS,
    overallLethalChance: Number.NaN,
  };
};

const computeObstacleRisk = (
  adventurer: Adventurer,
  levelRange: { min: number; max: number },
  _gameSettings: Settings,
): ObstacleRiskSummary => {
  const tierCounts = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 } as Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  const typeCounts = { Magic: 0, Blade: 0, Bludgeon: 0 } as Record<'Magic' | 'Blade' | 'Bludgeon', number>;

  for (const obstacleId of OBSTACLE_IDS) {
    const tier = OBSTACLE_TIER_MAP[obstacleId];
    const type = OBSTACLE_TYPE_MAP[obstacleId];
    tierCounts[`T${tier}` as keyof typeof tierCounts] += 1;
    typeCounts[type] += 1;
  }

  const slotSummaries: SlotDamageSummary[] = [];
  const aggregatedSamples: WeightedSample[] = [];
  const statsMode = _gameSettings?.stats_mode ?? 'Dodge';
  const intelligenceStat = adventurer.stats.intelligence ?? 0;
  const dodgePercent = statsMode === 'Dodge'
    ? clampPercentage(ability_based_percentage(adventurer.xp, intelligenceStat))
    : 0;
  const dodgeProbability = dodgePercent / 100;

  for (const slot of SLOT_ORDER) {
    const { summary, samples } = computeObstacleSlotSummary(
      slot,
      adventurer,
      levelRange,
      dodgeProbability,
      _gameSettings,
    );
    slotSummaries.push(summary);
    aggregatedSamples.push(...samples);
  }

  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const critChance = Number((getObstacleCriticalChance(adventurerLevel) * 100).toFixed(2));
  const damageDistribution = buildDamageDistribution(aggregatedSamples);
  const medianDamage = computeMedianDamage(aggregatedSamples);
  const playerHealth = Math.max(0, adventurer.health ?? 0);
  let overallLethalChance = 0;

  if (playerHealth > 0) {
    const totalWeight = aggregatedSamples.reduce((sum, sample) => sum + sample.weight, 0);
    if (totalWeight > 0) {
      const lethalWeight = aggregatedSamples.reduce((sum, sample) => (
        sample.value >= playerHealth ? sum + sample.weight : sum
      ), 0);

      overallLethalChance = Number(((lethalWeight / totalWeight) * 100).toFixed(2));
    }
  }

  return {
    dodgeChance: Number(dodgePercent.toFixed(2)),
    critChance,
    tierDistribution: Object.fromEntries(Object.entries(tierCounts).map(([key, value]) => [key, Number(((value / OBSTACLE_IDS.length) * 100).toFixed(2))])) as ObstacleRiskSummary['tierDistribution'],
    typeDistribution: Object.fromEntries(Object.entries(typeCounts).map(([key, value]) => [key, Number(((value / OBSTACLE_IDS.length) * 100).toFixed(2))])) as ObstacleRiskSummary['typeDistribution'],
    slotDamages: slotSummaries,
    damageDistribution,
    medianDamage,
    overallLethalChance,
  };
};

const computeDiscoveries = (adventurer: Adventurer): DiscoverySummary => {
  const level = Math.max(1, calculateLevel(adventurer.xp));
  return {
    goldChance: 45,
    healthChance: 45,
    lootChance: 10,
    goldRange: { min: 1, max: level },
    healthRange: { min: 2, max: level * 2 },
  };
};

const computeEncounterDistribution = (): EncounterDistribution => {
  const beastTierCounts = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 } as Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  const beastTypeCounts = { Magic: 0, Blade: 0, Bludgeon: 0 } as Record<'Magic' | 'Blade' | 'Bludgeon', number>;
  for (const id of BEAST_IDS) {
    beastTierCounts[`T${BEAST_TIER_MAP[id]}` as keyof typeof beastTierCounts] += 1;
    beastTypeCounts[BEAST_TYPE_MAP[id]] += 1;
  }

  const obstacleTierCounts = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 } as Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', number>;
  const obstacleTypeCounts = { Magic: 0, Blade: 0, Bludgeon: 0 } as Record<'Magic' | 'Blade' | 'Bludgeon', number>;
  for (const id of OBSTACLE_IDS) {
    obstacleTierCounts[`T${OBSTACLE_TIER_MAP[id]}` as keyof typeof obstacleTierCounts] += 1;
    obstacleTypeCounts[OBSTACLE_TYPE_MAP[id]] += 1;
  }

  const normalise = <T extends Record<string, number>>(counts: T, total: number): T => (
    Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(((value / total) * 100).toFixed(2))])) as T
  );

  return {
    baseMix: ENCOUNTER_BASE_MIX,
    beastByTier: normalise(beastTierCounts, BEAST_IDS.length),
    beastByType: normalise(beastTypeCounts, BEAST_IDS.length),
    obstacleByTier: normalise(obstacleTierCounts, OBSTACLE_IDS.length),
    obstacleByType: normalise(obstacleTypeCounts, OBSTACLE_IDS.length),
  };
};

export const getExplorationInsights = (
  adventurer: Adventurer | null,
  gameSettings: Settings | null,
): ExplorationInsights => {
  initialiseLookups();

  if (!adventurer || !gameSettings) {
    return {
      ready: false,
      encounterDistribution: computeEncounterDistribution(),
      beasts: {
        ambushChance: 0,
        critChance: 0,
        tierDistribution: { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 },
        typeDistribution: { Magic: 0, Blade: 0, Bludgeon: 0 },
        slotDamages: SLOT_ORDER.map(makeEmptySlotSummary),
        damageDistribution: [],
        medianDamage: 0,
        overallLethalChance: 0,
      },
      obstacles: {
        dodgeChance: 0,
        critChance: 0,
        tierDistribution: { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 },
        typeDistribution: { Magic: 0, Blade: 0, Bludgeon: 0 },
        slotDamages: SLOT_ORDER.map(makeEmptySlotSummary),
        damageDistribution: [],
        medianDamage: 0,
        overallLethalChance: 0,
      },
      discoveries: {
        goldChance: 0,
        healthChance: 0,
        lootChance: 0,
        goldRange: { min: 0, max: 0 },
        healthRange: { min: 0, max: 0 },
      },
    };
  }

  const adventurerLevel = Math.max(1, calculateLevel(adventurer.xp));
  const levelRange = getEncounterLevelRange(adventurerLevel);

  const encounterDistribution = computeEncounterDistribution();
  let beasts: BeastRiskSummary;

  try {
    beasts = computeBeastRisk(adventurer, levelRange, gameSettings, true);
  } catch (error) {
    if (isStackOverflowError(error)) {
      console.warn('Beast risk computation exceeded call stack; using Monte Carlo fallback summary.', error);
      try {
        beasts = computeBeastRiskMonteCarlo(adventurer, levelRange, gameSettings, true);
      } catch (monteCarloError) {
        console.error('Beast risk Monte Carlo fallback failed; using minimal deterministic summary.', monteCarloError);
        beasts = buildMinimalBeastRiskSummary(adventurer, levelRange, gameSettings, true);
      }
    } else {
      throw error;
    }
  }
  const obstacles = computeObstacleRisk(adventurer, levelRange, gameSettings);
  const discoveries = computeDiscoveries(adventurer);

  return {
    ready: true,
    encounterDistribution,
    beasts,
    obstacles,
    discoveries,
  };
};
