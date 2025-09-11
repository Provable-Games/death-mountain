// Constants from beast.cairo and loot.cairo
export const BEAST_SPECIAL_NAME_LEVEL_UNLOCK = 19;
export const MAX_SPECIAL2 = BigInt(69);  // Max prefix index
export const MAX_SPECIAL3 = BigInt(18);  // Max suffix index
export const MAX_BEAST_ID = BigInt(75);

// Combat-related constants
export const STARTER_BEAST_HEALTH = BigInt(3);
export const MAXIMUM_HEALTH = BigInt(1023); // 2^10 - 1
export const BEAST_MIN_DAMAGE = 2;

// Constants for reward calculations
export const GOLD_MULTIPLIER = {
    T1: 5,
    T2: 4,
    T3: 3,
    T4: 2,
    T5: 1
} as const;
export const GOLD_REWARD_DIVISOR = 2;
export const MINIMUM_XP_REWARD = 4;

export const JACKPOT_BEASTS = [
    '"Demon Grasp" Dragon',
    '"Torment Bane" Balrog',
    '"Pain Whisper" Warlock'
];

// Special name mappings from loot.cairo
export const BEAST_NAME_PREFIXES: { [key: number]: string } = {
    1: "Agony",
    2: "Apocalypse",
    3: "Armageddon",
    4: "Beast",
    5: "Behemoth",
    6: "Blight",
    7: "Blood",
    8: "Bramble",
    9: "Brimstone",
    10: "Brood",
    11: "Carrion",
    12: "Cataclysm",
    13: "Chimeric",
    14: "Corpse",
    15: "Corruption",
    16: "Damnation",
    17: "Death",
    18: "Demon",
    19: "Dire",
    20: "Dragon",
    21: "Dread",
    22: "Doom",
    23: "Dusk",
    24: "Eagle",
    25: "Empyrean",
    26: "Fate",
    27: "Foe",
    28: "Gale",
    29: "Ghoul",
    30: "Gloom",
    31: "Glyph",
    32: "Golem",
    33: "Grim",
    34: "Hate",
    35: "Havoc",
    36: "Honour",
    37: "Horror",
    38: "Hypnotic",
    39: "Kraken",
    40: "Loath",
    41: "Maelstrom",
    42: "Mind",
    43: "Miracle",
    44: "Morbid",
    45: "Oblivion",
    46: "Onslaught",
    47: "Pain",
    48: "Pandemonium",
    49: "Phoenix",
    50: "Plague",
    51: "Rage",
    52: "Rapture",
    53: "Rune",
    54: "Skull",
    55: "Sol",
    56: "Soul",
    57: "Sorrow",
    58: "Spirit",
    59: "Storm",
    60: "Tempest",
    61: "Torment",
    62: "Vengeance",
    63: "Victory",
    64: "Viper",
    65: "Vortex",
    66: "Woe",
    67: "Wrath",
    68: "Lights",
    69: "Shimmering"
};

export const BEAST_NAME_SUFFIXES: { [key: number]: string } = {
    1: "Bane",
    2: "Root",
    3: "Bite",
    4: "Song",
    5: "Roar",
    6: "Grasp",
    7: "Instrument",
    8: "Glow",
    9: "Bender",
    10: "Shadow",
    11: "Whisper",
    12: "Shout",
    13: "Growl",
    14: "Tear",
    15: "Peak",
    16: "Form",
    17: "Sun",
    18: "Moon"
};

// Beast name mapping from beast.cairo
export const BEAST_NAMES: { [key: number]: string } = {
    // Magical Beasts
    // T1
    1: "Warlock",
    2: "Typhon",
    3: "Jiangshi",
    4: "Anansi",
    5: "Basilisk",
    // T2
    6: "Gorgon",
    7: "Kitsune",
    8: "Lich",
    9: "Chimera",
    10: "Wendigo",
    // T3
    11: "Rakshasa",
    12: "Werewolf",
    13: "Banshee",
    14: "Draugr",
    15: "Vampire",
    // T4
    16: "Goblin",
    17: "Ghoul",
    18: "Wraith",
    19: "Sprite",
    20: "Kappa",
    // T5
    21: "Fairy",
    22: "Leprechaun",
    23: "Kelpie",
    24: "Pixie",
    25: "Gnome",

    // Hunter Beasts
    // T1
    26: "Griffin",
    27: "Manticore",
    28: "Phoenix",
    29: "Dragon",
    30: "Minotaur",
    // T2
    31: "Qilin",
    32: "Ammit",
    33: "Nue",
    34: "Skinwalker",
    35: "Chupacabra",
    // T3
    36: "Weretiger",
    37: "Wyvern",
    38: "Roc",
    39: "Harpy",
    40: "Pegasus",
    // T4
    41: "Hippogriff",
    42: "Fenrir",
    43: "Jaguar",
    44: "Satori",
    45: "Direwolf",
    // T5
    46: "Bear",
    47: "Wolf",
    48: "Mantis",
    49: "Spider",
    50: "Rat",

    // Brute Beasts
    // T1
    51: "Kraken",
    52: "Colossus",
    53: "Balrog",
    54: "Leviathan",
    55: "Tarrasque",
    // T2
    56: "Titan",
    57: "Nephilim",
    58: "Behemoth",
    59: "Hydra",
    60: "Juggernaut",
    // T3
    61: "Oni",
    62: "Jotunn",
    63: "Ettin",
    64: "Cyclops",
    65: "Giant",
    // T4
    66: "Nemeanlion",
    67: "Berserker",
    68: "Yeti",
    69: "Golem",
    70: "Ent",
    // T5
    71: "Troll",
    72: "Bigfoot",
    73: "Ogre",
    74: "Orc",
    75: "Skeleton"
}; 