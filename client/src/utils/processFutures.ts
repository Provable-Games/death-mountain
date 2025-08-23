import {
  BEAST_NAME_PREFIXES,
  BEAST_NAME_SUFFIXES,
  BEAST_NAMES,
  BEAST_SPECIAL_NAME_LEVEL_UNLOCK
} from "@/constants/beast";

import * as starknet from "@scure/starknet";
import { Beast } from "@/types/game";

const MAX_ID = BigInt(75);
const TWO_POW_64_NZ = BigInt("18446744073709551616");
const TWO_POW_32_NZ = BigInt("4294967296");
const TWO_POW_16_NZ = BigInt("65536");
const TWO_POW_8_NZ = BigInt("256");

export interface Encounter {
  encounter: string;
  id?: bigint;
  type: string;
  tier: string | number;
  level?: number;
  power?: number;
  gold?: number;
  health?: number;
  location?: string;
  dodgeRoll?: number;
  nextXp: number;
  specialName?: string;
  isCritical?: boolean;
  damage?: number;
  xp: number;
  adventurerLevel?: number;
}

function getLower128Bits(bigInt: bigint): bigint {
  // Create a mask with 128 1's
  const mask = (1n << 128n) - 1n;
  // Use bitwise AND to keep only the lower 128 bits
  return bigInt & mask;
}

function split_poseidon(poseidon: bigint) {
  let u128_low = getLower128Bits(poseidon);

  let rnd1_u64 = u128_low / TWO_POW_64_NZ;
  let rnd2_u64 = u128_low % TWO_POW_64_NZ;

  let rnd1_u32 = rnd1_u64 / TWO_POW_32_NZ;
  let rnd2_u32 = rnd1_u64 % TWO_POW_32_NZ;
  let rnd3_u32 = rnd2_u64 / TWO_POW_32_NZ;
  let rnd4_u32 = rnd2_u64 % TWO_POW_32_NZ;

  let rnd1_u16 = rnd3_u32 / TWO_POW_16_NZ;
  let rnd2_u16 = rnd3_u32 % TWO_POW_16_NZ;
  let rnd3_u16 = rnd4_u32 / TWO_POW_16_NZ;
  let rnd4_u16 = rnd4_u32 % TWO_POW_16_NZ;

  let rnd1_u8 = rnd3_u16 / TWO_POW_8_NZ;
  let rnd2_u8 = rnd3_u16 % TWO_POW_8_NZ;
  let rnd3_u8 = rnd4_u16 / TWO_POW_8_NZ;
  let rnd4_u8 = rnd4_u16 % TWO_POW_8_NZ;

  return {
    rnd1_u32,
    rnd2_u32,
    rnd1_u16,
    rnd2_u16,
    rnd1_u8,
    rnd2_u8,
    rnd3_u8,
    rnd4_u8,
  };
}

function getRandomness(xp: number, adventurerEntropy: bigint) {
  let params = [BigInt(xp), adventurerEntropy];
  let poseidon = starknet.poseidonHashMany(params);
  let {
    rnd1_u32,
    rnd2_u32,
    rnd1_u16,
    rnd2_u16,
    rnd1_u8,
    rnd2_u8,
    rnd3_u8,
    rnd4_u8,
  } = split_poseidon(poseidon);

  return {
    rnd1: rnd1_u32,
    rnd2: rnd2_u32,
    rnd3: rnd1_u16,
    rnd4: rnd2_u16,
    rnd5: rnd1_u8,
    rnd6: rnd2_u8,
    rnd7: rnd3_u8,
    rnd8: rnd4_u8,
  };
}

function get_simple_entropy(adventurer_xp: number, input_seed: number): bigint {
  const params = [BigInt(adventurer_xp), BigInt(input_seed)];
  return starknet.poseidonHashMany(params);
}

function felt_to_two_u64(felt: bigint): { u64_1: bigint, u64_2: bigint } {
  // Create a mask with 128 1's
  const mask = (1n << 128n) - 1n;
  // Get lower 128 bits
  const u128 = felt & mask;
  // Split into two u64s
  return {
    u64_1: u128 / TWO_POW_64_NZ,
    u64_2: u128 % TWO_POW_64_NZ
  };
}

export const getBeastFromSeed = (adventurer_xp: number, entropy: number): Beast => {
  const level = Math.floor(Math.sqrt(adventurer_xp));
  const felt = get_simple_entropy(adventurer_xp, entropy);
  const { u64_1 } = felt_to_two_u64(felt);
  const { rnd1, rnd3, rnd4, rnd5, rnd6, rnd7 } = getRandomness(adventurer_xp, u64_1);

  const encounter = beastEncounter(
    BigInt(level),
    adventurer_xp,
    rnd1,
    rnd3,
    rnd4,
    rnd5,
    rnd6,
    rnd7,
    rnd5,
    rnd6
  );


  return {
    id: Number(encounter.id!),
    seed: u64_1,
    baseName: BEAST_NAMES[Number(encounter.id!)],
    name: encounter.level! >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? `"${encounter.specialName!}" ${BEAST_NAMES[Number(encounter.id!)]}` : BEAST_NAMES[Number(encounter.id!)],
    health: encounter.health!,
    level: encounter.level!,
    type: encounter.type,
    tier: Number(encounter.tier),
    specialPrefix: encounter.level! >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? BEAST_NAME_PREFIXES[1 + Number(rnd5 % BigInt(69))] : null,
    specialSuffix: encounter.level! >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? BEAST_NAME_SUFFIXES[1 + Number(rnd6 % BigInt(18))] : null,
    isCollectable: false,
  };
};

// Helper functions
function getTier(id: bigint): bigint {
  if ((id >= 1 && id <= 5) || (id >= 26 && id < 31) || (id >= 51 && id < 56)) {
    return BigInt(1);
  } else if (
    (id >= 6 && id < 11) ||
    (id >= 31 && id < 36) ||
    (id >= 56 && id < 61)
  ) {
    return BigInt(2);
  } else if (
    (id >= 11 && id < 16) ||
    (id >= 36 && id < 41) ||
    (id >= 61 && id < 66)
  ) {
    return BigInt(3);
  } else if (
    (id >= 16 && id < 21) ||
    (id >= 41 && id < 46) ||
    (id >= 66 && id < 71)
  ) {
    return BigInt(4);
  } else {
    return BigInt(5);
  }
}

function getType(id: bigint): string {
  if (id >= 0 && id < 26) {
    return "Magic";
  } else if (id < 51) {
    return "Blade";
  } else if (id < 76) {
    return "Bludgeon";
  } else {
    return "None";
  }
}

function getBeastHealth(level: bigint, seed: bigint): bigint {
  let health = BigInt(1) + (seed % (level * BigInt(20)));

  if (level >= BigInt(50)) {
    health += BigInt(500);
  } else if (level >= BigInt(40)) {
    health += BigInt(400);
  } else if (level >= BigInt(30)) {
    health += BigInt(200);
  } else if (level >= BigInt(20)) {
    health += BigInt(100);
  } else {
    health += BigInt(10);
  }

  if (health > BigInt(1023)) {
    return BigInt(1023);
  } else {
    return health;
  }
}

function getObstacleLevel(level: bigint, entropy: bigint): bigint {
  let obstacleLevel = BigInt(1) + (entropy % (level * BigInt(3)));

  if (level >= BigInt(50)) {
    obstacleLevel += BigInt(80);
  } else if (level >= BigInt(40)) {
    obstacleLevel += BigInt(40);
  } else if (level >= BigInt(30)) {
    obstacleLevel += BigInt(20);
  } else if (level >= BigInt(20)) {
    obstacleLevel += BigInt(10);
  }

  return obstacleLevel;
}

function getDiscoveryItem(tier_rnd: bigint, item_rnd: bigint): string {
  let roll = (tier_rnd * BigInt(100) + BigInt(127)) / BigInt(255);
  let itemIndex = 0;

  // 50% chance of T5
  if (roll < BigInt(50)) {
    itemIndex = Number(item_rnd % BigInt(69));
    return BEAST_NAME_PREFIXES[itemIndex];
    // 30% chance of T4
  } else if (roll < BigInt(80)) {
    itemIndex = Number(item_rnd % BigInt(69));
    return BEAST_NAME_PREFIXES[itemIndex];
    // 12% chance of T3
  } else if (roll < BigInt(92)) {
    itemIndex = Number(item_rnd % BigInt(69));
    return BEAST_NAME_PREFIXES[itemIndex];
    // 6% chance of T2
  } else if (roll < BigInt(98)) {
    itemIndex = Number(item_rnd % BigInt(69));
    return BEAST_NAME_PREFIXES[itemIndex];
    // 2% chance of T1
  } else {
    itemIndex = Number(item_rnd % BigInt(69));
    return BEAST_NAME_PREFIXES[itemIndex];
  }
}

export function listAllEncounters(
  xp: number,
  entropy: number,
  adventurerLevel: number,
  hasBeast: boolean
): Encounter[] {
  let encounters: Encounter[] = [];
  if (xp === 0) {
    xp = 4;
  }

  encounters = recurseEncounters(
    encounters,
    [xp],
    entropy,
    adventurerLevel,
    hasBeast
  );

  return encounters;
}

function recurseEncounters(
  encounters: Encounter[],
  xpList: number[],
  entropy: number,
  adventurerLevel: number,
  hasBeast: boolean
): Encounter[] {
  if (encounters.length > 49) {
    return encounters;
  }

  let xp = xpList.sort((a, b) => a - b).shift()!;

  const felt = get_simple_entropy(xp, entropy);
  const { u64_1 } = felt_to_two_u64(felt);

  let nextEncounter = {
    ...getNextEncounter(xp, u64_1, hasBeast),
    adventurerLevel: Math.floor(Math.sqrt(xp)),
    xp: xp,
  };
  encounters.push(nextEncounter);

  if (nextEncounter.encounter === "Beast") {
    if (!xpList.includes(xp + 1)) {
      xpList.push(xp + 1);
    }
  }

  if (!xpList.includes(nextEncounter.nextXp)) {
    xpList.push(nextEncounter.nextXp);
  }

  return recurseEncounters(
    encounters,
    xpList,
    entropy,
    adventurerLevel,
    false
  );
}

function getNextEncounter(
  xp: number,
  adventurerEntropy: bigint,
  hasBeast: boolean
): Encounter {
  let { rnd1, rnd3, rnd4, rnd5, rnd6, rnd7, rnd8 } = getRandomness(
    xp,
    adventurerEntropy
  );
  const level = BigInt(Math.floor(Math.sqrt(xp)));

  let encounter = Number(rnd8 % BigInt(3));

  if (hasBeast || encounter === 0) {
    return beastEncounter(
      level,
      xp,
      rnd1,
      rnd3,
      rnd4,
      rnd5,
      rnd6,
      rnd7,
      rnd5,
      rnd6
    ) as any;
  } else if (encounter === 1) {
    return obstacleEncounter(level, rnd1, rnd4, rnd5, rnd6, rnd7, xp);
  } else {
    return discoveryEncounter(level, rnd5, rnd6, rnd7, xp);
  }
}

function beastEncounter(
  level: bigint,
  xp: number,
  seed: bigint,
  health_rnd: bigint,
  level_rnd: bigint,
  dmg_location_rnd: bigint,
  crit_hit_rnd: bigint,
  ambush_rnd: bigint,
  specials1_rnd: bigint,
  specials2_rnd: bigint
): Encounter {
  let beast_id = (seed % MAX_ID) + BigInt(1);
  let beast_health = getBeastHealth(level, health_rnd);
  let beast_tier = getTier(beast_id);
  let beast_type = getType(beast_id);
  let beast_level = getObstacleLevel(level, level_rnd);
  let power = (BigInt(6) - beast_tier) * beast_level;

  let ambush_location = getAttackLocation(dmg_location_rnd);
  let roll = abilityBasedAvoidThreat(level, ambush_rnd);
  let xp_reward = getXpReward(beast_level, beast_tier, Number(level));
  let specialName = getSpecialName(specials1_rnd, specials2_rnd);
  let isCritical = getCritical(Number(level * BigInt(3)), crit_hit_rnd);

  return {
    encounter: "Beast",
    id: beast_id,
    type: beast_type,
    tier: Number(beast_tier),
    level: Number(beast_level),
    power: Number(power),
    health: Number(beast_health),
    location: ambush_location,
    dodgeRoll: Number(roll) + 1,
    nextXp: xp + Number(xp_reward),
    xp,
    specialName,
    isCritical,
  };
}

function obstacleEncounter(
  level: bigint,
  seed: bigint,
  level_rnd: bigint,
  dmg_location_rnd: bigint,
  crit_hit_rnd: bigint,
  dodge_rnd: bigint,
  xp: number
): Encounter {
  let obstacle_id = (seed % MAX_ID) + BigInt(1);
  let obstacle_level = getObstacleLevel(level, level_rnd);
  let obstacle_tier = getTier(obstacle_id);
  let obstacle_type = getType(obstacle_id);
  let power = (BigInt(6) - obstacle_tier) * obstacle_level;

  let location = getAttackLocation(dmg_location_rnd);
  let roll = abilityBasedAvoidThreat(level, dodge_rnd);
  let xp_reward = getXpReward(obstacle_level, obstacle_tier, Number(level));
  let isCritical = getCritical(Number(level * BigInt(3)), crit_hit_rnd);

  return {
    encounter: "Obstacle",
    id: obstacle_id,
    type: obstacle_type,
    tier: Number(obstacle_tier),
    level: Number(obstacle_level),
    power: Number(power),
    location: location,
    dodgeRoll: Number(roll) + 1,
    nextXp: xp + Number(xp_reward),
    isCritical,
    xp,
  };
}

function discoveryEncounter(
  level: bigint,
  discovery_type_rnd: bigint,
  amount_rnd1: bigint,
  amount_rnd2: bigint,
  xp: number
): Encounter {
  let type = (discovery_type_rnd * BigInt(100) + BigInt(127)) / BigInt(255);

  let discovery_amount = BigInt(0);
  let discovery_type = "";

  if (type < BigInt(45)) {
    discovery_type = "Gold";
    discovery_amount = (amount_rnd1 % level) + BigInt(1);
  } else if (type < BigInt(90)) {
    discovery_type = "Health";
    discovery_amount = ((amount_rnd1 % level) + BigInt(1)) * BigInt(2);
  } else {
    discovery_type = "Loot";
  }

  let discovery_item = getDiscoveryItem(amount_rnd1, amount_rnd2);

  return {
    encounter: "Discovery",
    type: discovery_type,
    tier: type < BigInt(90) ? `${Number(discovery_amount)}` : discovery_item,
    nextXp: xp + 1,
    xp,
  };
}

function getAttackLocation(entropy: bigint): string {
  let slots = BigInt(5);
  let rnd_slot = Number(entropy % slots);

  if (rnd_slot == 0) {
    return "Chest";
  } else if (rnd_slot == 1) {
    return "Head";
  } else if (rnd_slot == 2) {
    return "Waist";
  } else if (rnd_slot == 3) {
    return "Foot";
  } else if (rnd_slot == 4) {
    return "Hand";
  }
  return "Unknown";
}

function getXpReward(
  level: bigint,
  tier: bigint,
  adventurerLevel: number
): bigint {
  let xp = ((BigInt(6) - tier) * level) / BigInt(2);
  let adusted_xp = (xp * BigInt(100 - Math.min(adventurerLevel * 2, 95))) / BigInt(100);

  if (adusted_xp < BigInt(4)) {
    return BigInt(4);
  }

  return adusted_xp;
}

function abilityBasedAvoidThreat(level: bigint, entropy: bigint): bigint {
  return (level * entropy) / BigInt(255);
}

function getCritical(luck: number, entropy: bigint): boolean {
  return (BigInt(luck) * BigInt(255)) / BigInt(100) > entropy;
}

function getSpecialName(
  special_2_seed: bigint,
  special_3_seed: bigint
): string {
  let special2 = 1 + Number(special_2_seed % BigInt(69));
  let special3 = 1 + Number(special_3_seed % BigInt(18));
  return `${BEAST_NAME_PREFIXES[special2]} ${BEAST_NAME_SUFFIXES[special3]}`;
}