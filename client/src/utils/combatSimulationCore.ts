import { calculateAttackDamage, calculateBeastDamage, calculateLevel } from '@/utils/game';
import type { Adventurer, Beast, Equipment } from '@/types/game';

export const ARMOR_TARGET_SLOTS: Array<keyof Equipment> = ['chest', 'head', 'waist', 'foot', 'hand'];
export const MAX_ROUNDS_PER_FIGHT = 500;
export const MAX_DETERMINISTIC_STATE_VISITS = 80_000;
export const DEFAULT_MONTE_CARLO_SAMPLES = 10_000;

export class DeterministicSimulationOverflowError extends Error {
  constructor(message = 'Combat simulation exceeded safe complexity threshold.') {
    super(message);
    this.name = 'DeterministicSimulationOverflowError';
  }
}

export interface CombatSimulationOptions {
  initialBeastStrike?: boolean;
}

export interface CombatSimulationResult {
  hasOutcome: boolean;
  winRate: number;
  otkRate: number;
  modeDamageDealt: number;
  modeDamageTaken: number;
  modeRounds: number;
  minDamageDealt: number;
  maxDamageDealt: number;
  minDamageTaken: number;
  maxDamageTaken: number;
  minRounds: number;
  maxRounds: number;
  computedVia?: 'deterministic' | 'monteCarlo';
}

export const defaultSimulationResult: CombatSimulationResult = {
  hasOutcome: false,
  winRate: 0,
  otkRate: 0,
  modeDamageDealt: 0,
  modeDamageTaken: 0,
  minDamageDealt: 0,
  maxDamageDealt: 0,
  minDamageTaken: 0,
  maxDamageTaken: 0,
  modeRounds: 0,
  minRounds: 0,
  maxRounds: 0,
};

interface DamageOption {
  damage: number;
  probability: number;
}

interface StateOutcome {
  winProbability: number;
  lethalProbability: number;
  damageDealtDistribution: Map<number, number>;
  damageTakenDistribution: Map<number, number>;
  roundsDistribution: Map<number, number>;
}

const PROBABILITY_EPSILON = 1e-12;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const addProbability = (distribution: Map<number, number>, value: number, probability: number) => {
  if (probability <= PROBABILITY_EPSILON) {
    return;
  }

  const existing = distribution.get(value) ?? 0;
  distribution.set(value, existing + probability);
};

const combineDistributions = (
  target: Map<number, number>,
  source: Map<number, number>,
  offset: number,
  weight: number,
) => {
  if (weight <= PROBABILITY_EPSILON) {
    return;
  }

  source.forEach((probability, value) => {
    addProbability(target, value + offset, probability * weight);
  });
};

const getBeastCriticalChance = (adventurer: Adventurer) => clamp(calculateLevel(adventurer.xp) * 2, 5, 35) / 100;

const buildHeroDamageOptions = (baseDamage: number, criticalDamage: number, critChancePercent: number): DamageOption[] => {
  const criticalChance = clamp(critChancePercent, 0, 100) / 100;
  const baseChance = 1 - criticalChance;

  const aggregated = new Map<number, number>();
  addProbability(aggregated, baseDamage, baseChance);
  addProbability(aggregated, criticalDamage, criticalChance);

  if (aggregated.size === 0) {
    aggregated.set(baseDamage, 1);
  }

  return Array.from(aggregated.entries()).map(([damage, probability]) => ({ damage, probability }));
};

const buildBeastDamageOptions = (
  adventurer: Adventurer,
  beast: Beast,
  beastDamageBySlot: Record<string, ReturnType<typeof calculateBeastDamage> | undefined>,
  beastCritChance: number,
): DamageOption[] => {
  const slotSummaries = ARMOR_TARGET_SLOTS.map((slot) => beastDamageBySlot[slot] ?? undefined).filter(
    (summary): summary is ReturnType<typeof calculateBeastDamage> => !!summary,
  );

  if (slotSummaries.length === 0) {
    const fallback = calculateBeastDamage(beast, adventurer, adventurer.equipment.chest);
    return [{ damage: fallback.baseDamage, probability: 1 }];
  }

  const slotProbability = 1 / slotSummaries.length;
  const aggregated = new Map<number, number>();
  const criticalChance = clamp(beastCritChance, 0, 1);
  const baseChance = 1 - criticalChance;

  slotSummaries.forEach((summary) => {
    addProbability(aggregated, summary.baseDamage, baseChance * slotProbability);
    addProbability(aggregated, summary.criticalDamage, criticalChance * slotProbability);
  });

  if (aggregated.size === 0) {
    aggregated.set(slotSummaries[0]!.baseDamage, 1);
  }

  return Array.from(aggregated.entries()).map(([damage, probability]) => ({ damage, probability }));
};

// Single-pass distribution statistics - combines min/max/mode calculation
interface DistributionStats {
  min: number;
  max: number;
  mode: number;
}

const getDistributionStats = (distribution: Map<number, number>): DistributionStats => {
  let minValue = Infinity;
  let maxValue = 0;
  let modeValue = 0;
  let highestProbability = 0;

  distribution.forEach((probability, value) => {
    if (probability > PROBABILITY_EPSILON) {
      // Min
      if (value < minValue) {
        minValue = value;
      }
      // Max
      if (value > maxValue) {
        maxValue = value;
      }
      // Mode
      if (
        probability > highestProbability + PROBABILITY_EPSILON
        || (Math.abs(probability - highestProbability) <= PROBABILITY_EPSILON && value < modeValue)
      ) {
        highestProbability = probability;
        modeValue = value;
      }
    }
  });

  return {
    min: Number.isFinite(minValue) ? minValue : 0,
    max: maxValue,
    mode: highestProbability > PROBABILITY_EPSILON ? modeValue : 0,
  };
};

interface SimulationContext {
  heroDamageOptions: DamageOption[];
  beastDamageOptions: DamageOption[];
  effectiveBeastHp: number;
  initialHeroHp: number;
  initialBeastStrike: boolean;
  minHeroDamage: number;
  minBeastDamage: number;
}

const createSimulationContext = (
  adventurer: Adventurer,
  beast: Beast,
  options: CombatSimulationOptions = {},
): SimulationContext | null => {
  if (!adventurer || !beast || adventurer.health <= 0 || beast.health <= 0) {
    return null;
  }

  const weaponDamage = calculateAttackDamage(adventurer.equipment.weapon, adventurer, beast);
  const heroDamageOptions = buildHeroDamageOptions(
    weaponDamage.baseDamage,
    weaponDamage.criticalDamage,
    adventurer.stats.luck ?? 0,
  );

  const beastDamageBySlot = ARMOR_TARGET_SLOTS.reduce<Record<string, ReturnType<typeof calculateBeastDamage>>>(
    (acc, slot) => {
      const armor = adventurer.equipment[slot];
      acc[slot] = calculateBeastDamage(beast, adventurer, armor);
      return acc;
    },
    {},
  );

  const beastDamageOptions = buildBeastDamageOptions(
    adventurer,
    beast,
    beastDamageBySlot,
    getBeastCriticalChance(adventurer),
  );

  if (heroDamageOptions.length === 0 || beastDamageOptions.length === 0) {
    return null;
  }

  const startingBeastHp = Math.max(0, adventurer.beast_health ?? 0);
  const effectiveBeastHp = startingBeastHp > 0 ? startingBeastHp : beast.health;

  if (effectiveBeastHp <= 0) {
    return null;
  }

  const minHeroDamage = heroDamageOptions.reduce((min, option) => {
    if (option.damage > 0 && option.damage < min) {
      return option.damage;
    }
    return min;
  }, Number.POSITIVE_INFINITY);

  const minBeastDamage = beastDamageOptions.reduce((min, option) => {
    if (option.damage > 0 && option.damage < min) {
      return option.damage;
    }
    return min;
  }, Number.POSITIVE_INFINITY);

  return {
    heroDamageOptions,
    beastDamageOptions,
    effectiveBeastHp,
    initialHeroHp: adventurer.health,
    initialBeastStrike: options.initialBeastStrike ?? false,
    minHeroDamage: Number.isFinite(minHeroDamage) ? minHeroDamage : 0,
    minBeastDamage: Number.isFinite(minBeastDamage) ? minBeastDamage : 0,
  };
};

interface DeterministicComplexityEstimate {
  heroStates: number;
  beastStates: number;
  branchingFactor: number;
  estimatedTransitions: number;
  weightedComplexity: number;
}

const estimateDeterministicComplexity = (context: SimulationContext): DeterministicComplexityEstimate => {
  const minBeastDamage = Math.max(1, Math.floor(context.minBeastDamage));
  const minHeroDamage = Math.max(1, Math.floor(context.minHeroDamage));

  const heroStates = Math.max(
    1,
    Math.min(MAX_ROUNDS_PER_FIGHT, Math.ceil(context.initialHeroHp / minBeastDamage)),
  );

  const beastStates = Math.max(
    1,
    Math.ceil(context.effectiveBeastHp / minHeroDamage),
  );

  const branchingFactor = Math.max(1, context.heroDamageOptions.length * context.beastDamageOptions.length);
  const estimatedTransitions = heroStates * beastStates * branchingFactor;
  const estimatedRounds = Math.max(1, Math.min(MAX_ROUNDS_PER_FIGHT, heroStates + beastStates));
  const weightedComplexity = Math.round(estimatedTransitions * Math.max(1, Math.log2(estimatedRounds + 1)));

  return {
    heroStates,
    beastStates,
    branchingFactor,
    estimatedTransitions,
    weightedComplexity,
  };
};

const shouldSkipDeterministicSimulation = (estimate: DeterministicComplexityEstimate): boolean => {
  if (estimate.weightedComplexity >= MAX_DETERMINISTIC_STATE_VISITS) {
    return true;
  }

  if (estimate.estimatedTransitions >= MAX_DETERMINISTIC_STATE_VISITS) {
    return true;
  }

  const extremeStateCount = MAX_DETERMINISTIC_STATE_VISITS / 4;
  if (estimate.heroStates >= extremeStateCount || estimate.beastStates >= extremeStateCount) {
    return true;
  }

  return false;
};

const sampleFromDistribution = (options: DamageOption[]) => {
  if (options.length === 1) {
    return options[0]!.damage;
  }

  const roll = Math.random();
  let cumulative = 0;

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index]!;
    cumulative += option.probability;

    if (roll <= cumulative + PROBABILITY_EPSILON || index === options.length - 1) {
      return option.damage;
    }
  }

  return options[options.length - 1]!.damage;
};

const incrementCount = (distribution: Map<number, number>, value: number) => {
  const existing = distribution.get(value) ?? 0;
  distribution.set(value, existing + 1);
};

const calculateDeterministicCombatResultForContext = (
  context: SimulationContext,
): CombatSimulationResult => {
  const {
    heroDamageOptions,
    beastDamageOptions,
    effectiveBeastHp,
    initialHeroHp,
    initialBeastStrike,
  } = context;

  const memo = new Map<string, StateOutcome>();
  let visitedStates = 0;

  const solve = (heroHp: number, beastHp: number, rounds: number): StateOutcome => {
    if (heroHp <= 0) {
      return {
        winProbability: 0,
        lethalProbability: 1,
        damageDealtDistribution: new Map([[0, 1]]),
        damageTakenDistribution: new Map([[0, 1]]),
        roundsDistribution: new Map([[0, 1]]),
      };
    }

    if (beastHp <= 0) {
      return {
        winProbability: 1,
        lethalProbability: 0,
        damageDealtDistribution: new Map([[0, 1]]),
        damageTakenDistribution: new Map([[0, 1]]),
        roundsDistribution: new Map([[0, 1]]),
      };
    }

    if (rounds >= MAX_ROUNDS_PER_FIGHT) {
      return {
        winProbability: 0,
        lethalProbability: 1,
        damageDealtDistribution: new Map([[0, 1]]),
        damageTakenDistribution: new Map([[0, 1]]),
        roundsDistribution: new Map([[0, 1]]),
      };
    }

    const memoKey = `${heroHp}|${beastHp}|${rounds}`;
    const cached = memo.get(memoKey);
    if (cached) {
      return cached;
    }

    if (memo.size >= MAX_DETERMINISTIC_STATE_VISITS) {
      throw new DeterministicSimulationOverflowError(`Combat simulation memo exceeded ${MAX_DETERMINISTIC_STATE_VISITS} states.`);
    }

    visitedStates += 1;
    if (visitedStates > MAX_DETERMINISTIC_STATE_VISITS) {
      throw new DeterministicSimulationOverflowError(`Combat simulation visited more than ${MAX_DETERMINISTIC_STATE_VISITS} states.`);
    }

    let winProbability = 0;
    let lethalProbability = 0;
    const damageDealtDistribution = new Map<number, number>();
    const damageTakenDistribution = new Map<number, number>();
    const roundsDistribution = new Map<number, number>();

    heroDamageOptions.forEach(({ damage: heroDamage, probability: heroProbability }) => {
      if (heroProbability <= PROBABILITY_EPSILON) {
        return;
      }

      const remainingBeastHp = beastHp - heroDamage;

      if (remainingBeastHp <= 0) {
        winProbability += heroProbability;
        addProbability(damageDealtDistribution, heroDamage, heroProbability);
        addProbability(damageTakenDistribution, 0, heroProbability);
        addProbability(roundsDistribution, rounds + 1, heroProbability);
        return;
      }

      beastDamageOptions.forEach(({ damage: beastDamage, probability: beastProbability }) => {
        const branchProbability = heroProbability * beastProbability;

        if (branchProbability <= PROBABILITY_EPSILON) {
          return;
        }

        const remainingHeroHp = heroHp - beastDamage;

        if (remainingHeroHp <= 0 || rounds + 1 >= MAX_ROUNDS_PER_FIGHT) {
          lethalProbability += branchProbability;
          addProbability(damageDealtDistribution, heroDamage, branchProbability);
          addProbability(damageTakenDistribution, beastDamage, branchProbability);
          addProbability(roundsDistribution, rounds + 1, branchProbability);
          return;
        }

        const nextState = solve(remainingHeroHp, remainingBeastHp, rounds + 1);

        winProbability += branchProbability * nextState.winProbability;
        lethalProbability += branchProbability * nextState.lethalProbability;

        combineDistributions(damageDealtDistribution, nextState.damageDealtDistribution, heroDamage, branchProbability);
        combineDistributions(damageTakenDistribution, nextState.damageTakenDistribution, beastDamage, branchProbability);
        combineDistributions(roundsDistribution, nextState.roundsDistribution, 0, branchProbability);
      });
    });

    const outcome: StateOutcome = {
      winProbability,
      lethalProbability,
      damageDealtDistribution,
      damageTakenDistribution,
      roundsDistribution,
    };

    memo.set(memoKey, outcome);
    return outcome;
  };

  const computeInitialStrikeOutcome = (): StateOutcome => {
    let winProbability = 0;
    let lethalProbability = 0;
    const damageDealtDistribution = new Map<number, number>();
    const damageTakenDistribution = new Map<number, number>();
    const roundsDistribution = new Map<number, number>();

    beastDamageOptions.forEach(({ damage: initialDamage, probability: initialProbability }) => {
      if (initialProbability <= PROBABILITY_EPSILON) {
        return;
      }

      const remainingHeroHp = initialHeroHp - initialDamage;

      if (remainingHeroHp <= 0) {
        lethalProbability += initialProbability;
        addProbability(damageDealtDistribution, 0, initialProbability);
        addProbability(damageTakenDistribution, initialDamage, initialProbability);
        addProbability(roundsDistribution, 0, initialProbability);
        return;
      }

      const nextOutcome = solve(remainingHeroHp, effectiveBeastHp, 0);

      winProbability += initialProbability * nextOutcome.winProbability;
      lethalProbability += initialProbability * nextOutcome.lethalProbability;

      combineDistributions(damageDealtDistribution, nextOutcome.damageDealtDistribution, 0, initialProbability);
      combineDistributions(damageTakenDistribution, nextOutcome.damageTakenDistribution, initialDamage, initialProbability);
      combineDistributions(roundsDistribution, nextOutcome.roundsDistribution, 0, initialProbability);
    });

    return {
      winProbability,
      lethalProbability,
      damageDealtDistribution,
      damageTakenDistribution,
      roundsDistribution,
    };
  };

  const rootOutcome = initialBeastStrike
    ? computeInitialStrikeOutcome()
    : solve(initialHeroHp, effectiveBeastHp, 0);
  const totalProbability = rootOutcome.winProbability + rootOutcome.lethalProbability;

  if (totalProbability <= PROBABILITY_EPSILON) {
    return defaultSimulationResult;
  }

  const getBeastLethalChance = (heroHp: number) => beastDamageOptions.reduce((chance, { damage, probability }) => {
    if (probability <= PROBABILITY_EPSILON) {
      return chance;
    }

    return damage >= heroHp ? chance + probability : chance;
  }, 0);

  const otkProbability = initialBeastStrike
    ? (() => {
      let probability = 0;

      beastDamageOptions.forEach(({ damage: initialDamage, probability: initialProbability }) => {
        if (initialProbability <= PROBABILITY_EPSILON) {
          return;
        }

        const remainingHeroHp = initialHeroHp - initialDamage;

        if (remainingHeroHp <= 0) {
          probability += initialProbability;
          return;
        }

        heroDamageOptions.forEach(({ damage: heroDamage, probability: heroProbability }) => {
          if (heroProbability <= PROBABILITY_EPSILON) {
            return;
          }

          const remainingBeastHp = effectiveBeastHp - heroDamage;

          if (remainingBeastHp <= 0) {
            return;
          }

          const lethalChance = getBeastLethalChance(remainingHeroHp);
          if (lethalChance <= PROBABILITY_EPSILON) {
            return;
          }

          probability += initialProbability * heroProbability * lethalChance;
        });
      });

      return probability;
    })()
    : (() => {
      let probability = 0;

      heroDamageOptions.forEach(({ damage: heroDamage, probability: heroProbability }) => {
        if (heroProbability <= PROBABILITY_EPSILON) {
          return;
        }

        const remainingBeastHp = effectiveBeastHp - heroDamage;
        if (remainingBeastHp <= 0) {
          return;
        }

        const lethalChance = getBeastLethalChance(initialHeroHp);
        if (lethalChance <= PROBABILITY_EPSILON) {
          return;
        }

        probability += heroProbability * lethalChance;
      });

      return probability;
    })();

  const winRate = Number(((rootOutcome.winProbability / totalProbability) * 100).toFixed(1));
  const otkRate = Number(((otkProbability / totalProbability) * 100).toFixed(1));

  // Single-pass statistics for each distribution
  const damageDealtStats = getDistributionStats(rootOutcome.damageDealtDistribution);
  const damageTakenStats = getDistributionStats(rootOutcome.damageTakenDistribution);
  const roundsStats = getDistributionStats(rootOutcome.roundsDistribution);

  return {
    hasOutcome: true,
    winRate,
    otkRate,
    modeDamageDealt: Math.round(damageDealtStats.mode),
    modeDamageTaken: Math.round(damageTakenStats.mode),
    modeRounds: Math.round(roundsStats.mode),
    minDamageDealt: Math.round(damageDealtStats.min),
    maxDamageDealt: Math.round(damageDealtStats.max),
    minDamageTaken: Math.round(damageTakenStats.min),
    maxDamageTaken: Math.round(damageTakenStats.max),
    minRounds: Math.round(roundsStats.min),
    maxRounds: Math.round(roundsStats.max),
    computedVia: 'deterministic',
  };
};

export const calculateDeterministicCombatResult = (
  adventurer: Adventurer,
  beast: Beast,
  options: CombatSimulationOptions = {},
): CombatSimulationResult => {
  const context = createSimulationContext(adventurer, beast, options);
  if (!context) {
    return defaultSimulationResult;
  }

  return calculateDeterministicCombatResultForContext(context);
};

export const calculateMonteCarloCombatResult = (
  adventurer: Adventurer,
  beast: Beast,
  options: CombatSimulationOptions = {},
  sampleCount = DEFAULT_MONTE_CARLO_SAMPLES,
): CombatSimulationResult => {
  const context = createSimulationContext(adventurer, beast, options);
  if (!context) {
    return defaultSimulationResult;
  }

  const iterations = Math.max(1, Math.floor(sampleCount));
  const {
    heroDamageOptions,
    beastDamageOptions,
    effectiveBeastHp,
    initialHeroHp,
    initialBeastStrike,
  } = context;

  let wins = 0;
  let otkCount = 0;

  const damageDealtDistribution = new Map<number, number>();
  const damageTakenDistribution = new Map<number, number>();
  const roundsDistribution = new Map<number, number>();

  for (let i = 0; i < iterations; i += 1) {
    let heroHp = initialHeroHp;
    let beastHp = effectiveBeastHp;
    let rounds = 0;
    let totalHeroDamage = 0;
    let totalBeastDamage = 0;
    let otk = false;

    if (initialBeastStrike) {
      const initialDamage = sampleFromDistribution(beastDamageOptions);
      totalBeastDamage += initialDamage;
      heroHp -= initialDamage;

      if (heroHp <= 0) {
        otk = true;
      }
    }

    while (heroHp > 0 && beastHp > 0 && rounds < MAX_ROUNDS_PER_FIGHT) {
      const heroDamage = sampleFromDistribution(heroDamageOptions);
      totalHeroDamage += heroDamage;
      rounds += 1;
      beastHp -= heroDamage;

      if (beastHp <= 0) {
        break;
      }

      const beastDamage = sampleFromDistribution(beastDamageOptions);
      totalBeastDamage += beastDamage;
      heroHp -= beastDamage;

      if (heroHp <= 0) {
        if (rounds === 1) {
          otk = true;
        }
        break;
      }
    }

    if (heroHp > 0 && beastHp > 0) {
      heroHp = 0;
    }

    const heroWon = heroHp > 0 && beastHp <= 0;

    if (heroWon) {
      wins += 1;
    } else if (otk) {
      otkCount += 1;
    }

    incrementCount(damageDealtDistribution, Math.round(totalHeroDamage));
    incrementCount(damageTakenDistribution, Math.round(totalBeastDamage));
    incrementCount(roundsDistribution, rounds);
  }

  const winRate = Number(((wins / iterations) * 100).toFixed(1));
  const otkRate = Number(((otkCount / iterations) * 100).toFixed(1));

  // Single-pass statistics for each distribution
  const damageDealtStats = getDistributionStats(damageDealtDistribution);
  const damageTakenStats = getDistributionStats(damageTakenDistribution);
  const roundsStats = getDistributionStats(roundsDistribution);

  return {
    hasOutcome: true,
    winRate,
    otkRate,
    modeDamageDealt: Math.round(damageDealtStats.mode),
    modeDamageTaken: Math.round(damageTakenStats.mode),
    modeRounds: Math.round(roundsStats.mode),
    minDamageDealt: Math.round(damageDealtStats.min),
    maxDamageDealt: Math.round(damageDealtStats.max),
    minDamageTaken: Math.round(damageTakenStats.min),
    maxDamageTaken: Math.round(damageTakenStats.max),
    minRounds: Math.round(roundsStats.min),
    maxRounds: Math.round(roundsStats.max),
    computedVia: 'monteCarlo',
  };
};

export const calculateCombatResult = (
  adventurer: Adventurer,
  beast: Beast,
  options: CombatSimulationOptions = {},
  sampleCount = DEFAULT_MONTE_CARLO_SAMPLES,
): CombatSimulationResult => {
  const context = createSimulationContext(adventurer, beast, options);
  if (!context) {
    return defaultSimulationResult;
  }

  const complexityEstimate = estimateDeterministicComplexity(context);
  if (shouldSkipDeterministicSimulation(complexityEstimate)) {
    console.info('Deterministic combat simulation skipped due to estimated complexity; using Monte Carlo fallback.', {
      heroStates: complexityEstimate.heroStates,
      beastStates: complexityEstimate.beastStates,
      branchingFactor: complexityEstimate.branchingFactor,
      estimatedTransitions: complexityEstimate.estimatedTransitions,
      weightedComplexity: complexityEstimate.weightedComplexity,
    });
    return calculateMonteCarloCombatResult(adventurer, beast, options, sampleCount);
  }

  try {
    return calculateDeterministicCombatResultForContext(context);
  } catch (error) {
    if (error instanceof DeterministicSimulationOverflowError) {
      console.warn('Deterministic combat simulation exceeded complexity threshold; using Monte Carlo fallback.', {
        heroStates: complexityEstimate.heroStates,
        beastStates: complexityEstimate.beastStates,
        branchingFactor: complexityEstimate.branchingFactor,
        estimatedTransitions: complexityEstimate.estimatedTransitions,
        weightedComplexity: complexityEstimate.weightedComplexity,
      });
      return calculateMonteCarloCombatResult(adventurer, beast, options, sampleCount);
    }

    throw error;
  }
};
