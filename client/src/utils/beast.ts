import {
  BEAST_NAME_PREFIXES,
  BEAST_NAME_SUFFIXES,
  BEAST_NAMES,
  BEAST_SPECIAL_NAME_LEVEL_UNLOCK
} from "@/constants/beast";

export const beastTypeIcons = {
  Brute: '/images/types/brute.svg',
  Hunter: '/images/types/hunter.svg',
  Magic: '/images/types/magic.svg',
};

/**
 * Determines the beast type based on its ID
 * @param id Beast ID
 * @returns The type of the beast (Magic_or_Cloth, Blade_or_Hide, or Bludgeon_or_Metal)
 */
export function getBeastType(id: number): string {
  if (id >= 0 && id < 26) {
    return 'Magic';
  } else if (id < 51) {
    return 'Hunter';
  } else if (id < 76) {
    return 'Brute';
  } else {
    return 'None';
  }
}

/**
 * Determines the attack type based on its ID
 * @param id Attack ID
 * @returns The type of the attack (Magic, Hunter, or Brute)
 */
export function getAttackType(id: number): string {
  if (id >= 0 && id < 26) {
    return 'Magic';
  } else if (id < 51) {
    return 'Blade';
  } else if (id < 76) {
    return 'Bludgeon';
  } else {
    return 'None';
  }
}

/**
 * Determines the armor type based on its ID
 * @param id Armor ID
 * @returns The type of the armor (Cloth, Hide, or Metal)
 */
export function getArmorType(id: number): string {
  if (id >= 0 && id < 26) {
    return 'Cloth';
  } else if (id < 51) {
    return 'Hide';
  } else if (id < 76) {
    return 'Metal';
  } else {
    return 'None';
  }
}

/**
 * Determines the beast tier based on its ID
 * @param id Beast ID
 * @returns The tier of the beast (T1-T5)
 */
export function getBeastTier(id: number): number {
  if (isT1(id)) return 1;
  if (isT2(id)) return 2;
  if (isT3(id)) return 3;
  if (isT4(id)) return 4;
  return 5;
}

// Helper functions from beast.cairo
function isT1(id: number): boolean {
  return (id >= 1 && id <= 5) || (id >= 26 && id < 31) || (id >= 51 && id < 56);
}

function isT2(id: number): boolean {
  return (id >= 6 && id < 11) || (id >= 31 && id < 36) || (id >= 56 && id < 61);
}

function isT3(id: number): boolean {
  return (id >= 11 && id < 16) || (id >= 36 && id < 41) || (id >= 61 && id < 66);
}

function isT4(id: number): boolean {
  return (id >= 16 && id < 21) || (id >= 41 && id < 46) || (id >= 66 && id < 71);
}

/**
 * Gets the name of a beast based on its ID and special attributes
 * @param id Beast ID (1-75)
 * @param level Beast level
 * @param special2 Special prefix index
 * @param special3 Special suffix index
 * @returns The name of the beast, including special prefix/suffix if applicable
 */
export function getBeastName(id: number, level: number, special2: number, special3: number): string {
  const baseName = BEAST_NAMES[id];
  // Get special name components if level requirement is met
  const specialPrefix = level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? BEAST_NAME_PREFIXES[special2] : undefined;
  const specialSuffix = level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? BEAST_NAME_SUFFIXES[special3] : undefined;

  if (specialPrefix && specialSuffix) {
    return `"${specialPrefix} ${specialSuffix}" ${baseName}`;
  } else if (specialPrefix) {
    return `"${specialPrefix}" ${baseName}`;
  } else if (specialSuffix) {
    return `"${specialSuffix}" ${baseName}`;
  }

  return baseName;
}

export const getBeastImage = (name: string) => {
  return `/images/beasts/${name.replace(" ", "_").toLowerCase()}.png`
}

export const getBeastImageById = (id: number) => {
  const name = BEAST_NAMES[id]
  return `/images/beasts/${name.replace(" ", "_").toLowerCase()}.png`
}

export const getTierGlowColor = (tier: string): string => {
  switch (tier) {
    case '1':
      return 'rgba(255, 0, 0, 0.5)'; // Red glow for T1
    case '2':
      return 'rgba(255, 165, 0, 0.5)'; // Orange glow for T2
    case '3':
      return 'rgba(255, 255, 0, 0.5)'; // Yellow glow for T3
    case '4':
      return 'rgba(0, 255, 0, 0.5)'; // Green glow for T4
    case '5':
      return 'rgba(0, 0, 255, 0.5)'; // Blue glow for T5
    default:
      return 'rgba(128, 128, 128, 0.5)'; // Default gray glow
  }
}


// Helper functions for type strengths/weaknesses
export const getItemTypeStrength = (type: string): string => {
  switch (type) {
    case 'Magic':
    case 'Cloth':
      return 'Brute';
    case 'Bludgeon':
    case 'Metal':
      return 'Hunter';
    case 'Blade':
    case 'Hide':
      return 'Magic';
    default:
      return '';
  }
};

export const getItemTypeWeakness = (type: string): string => {
  switch (type) {
    case 'Magic':
    case 'Cloth':
      return 'Hunter';
    case 'Bludgeon':
    case 'Metal':
      return 'Magic';
    case 'Blade':
    case 'Hide':
      return 'Brute';
    default:
      return '';
  }
};


export const getWeaponTypeStrength = (type: string): string => {
  switch (type) {
    case 'Bludgeon':
      return 'Hide';
    case 'Magic':
      return 'Metal';
    case 'Blade':
      return 'Cloth';
    default:
      return '';
  }
}

export const getWeaponTypeWeakness = (type: string): string => {
  switch (type) {
    case 'Bludgeon':
      return 'Cloth';
    case 'Magic':
      return 'Hide';
    case 'Blade':
      return 'Metal';
    default:
      return '';
  }
}

export const getArmorTypeStrength = (type: string): string => {
  switch (type) {
    case 'Cloth':
      return 'Bludgeon';
    case 'Hide':
      return 'Magic';
    case 'Metal':
      return 'Blade';
    default:
      return '';
  }
}

export const getArmorTypeWeakness = (type: string): string => {
  switch (type) {
    case 'Cloth':
      return 'Blade';
    case 'Hide':
      return 'Bludgeon';
    case 'Metal':
      return 'Magic';
    default:
      return '';
  }
}

export const beastPowerPercent = (adventurerLevel: number, power: number) => {
  let max_beast_level = adventurerLevel * 3
  let base_level = 1

  if (adventurerLevel >= 50) {
    base_level += 80
  } else if (adventurerLevel >= 40) {
    base_level += 40
  } else if (adventurerLevel >= 30) {
    base_level += 20
  } else if (adventurerLevel >= 20) {
    base_level += 10
  }

  let adjusted_max_power = ((base_level + max_beast_level) * 5) - base_level
  let adjusted_power = Math.max(power - base_level, 1)

  return (adjusted_power / adjusted_max_power) * 100
}

export const getCollectableTraits = (seed: bigint) => {
  if (seed === BigInt(0)) {
    return {
      shiny: false,
      animated: false,
    };
  }

  const shiny_seed = Number(seed & BigInt(0xFFFFFFFF)) % 10000;
  const shiny = shiny_seed < 500;

  // Use the upper 32 bits for animated trait
  const animated_seed = Number((seed / BigInt(0x100000000)) & BigInt(0xFFFFFFFF)) % 10000;
  const animated = animated_seed < 500;

  return {
    shiny,
    animated,
  };
};

export const collectableImage = (name: string, traits: { shiny: boolean, animated: boolean }) => {
  if (traits.shiny && traits.animated) {
    return `/images/nfts/animated/shiny/${name.toLowerCase()}.gif`;
  } else if (traits.animated) {
    return `/images/nfts/animated/regular/${name.toLowerCase()}.gif`;
  } else if (traits.shiny) {
    return `/images/nfts/shiny/${name.toLowerCase()}.png`;
  } else {
    return `/images/nfts/regular/${name.toLowerCase()}.png`;
  }
};