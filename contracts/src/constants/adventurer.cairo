// SPDX-License-Identifier: MIT

// Starting Setting
pub const STARTING_GOLD: u8 = 40;
pub const STARTING_HEALTH: u8 = 100;

// Adventurer Max Values
pub const MAX_ADVENTURER_HEALTH: u16 = 1023; // 10 bits
pub const MAX_PACKABLE_BEAST_HEALTH: u16 = 1023; // 10 bits
pub const MAX_ADVENTURER_XP: u16 = 32767; // 15 bits
pub const MAX_GOLD: u16 = 511; // 9 bits
pub const MAX_STAT_UPGRADES_AVAILABLE: u8 = 15; // 4 bits
pub const MAX_PACKABLE_ITEM_SPECIALS_SEED: u16 = 65535; // 16 bits
pub const MAX_PACKABLE_ACTION_COUNT: u16 = 65535; // 16 bits


pub const ITEM_MAX_XP: u16 = 400;

// Potion Settings
pub const BASE_POTION_PRICE: u8 = 1;
pub const POTION_HEALTH_AMOUNT: u8 = 10;
pub const MINIMUM_POTION_PRICE: u8 = 1;
pub const CHARISMA_POTION_DISCOUNT: u8 = 2;

// Item Settings
pub const CHARISMA_ITEM_DISCOUNT: u8 = 1;
pub const MINIMUM_ITEM_PRICE: u8 = 1;
pub const ITEM_MAX_GREATNESS: u8 = 20;
pub const MAX_GREATNESS_STAT_BONUS: u8 = 1;
pub const NECKLACE_G20_BONUS_STATS: u8 = 1;
pub const SILVER_RING_G20_LUCK_BONUS: u8 = 20;

pub const SILVER_RING_LUCK_BONUS_PER_GREATNESS: u8 = 1;
pub const JEWELRY_BONUS_BEAST_GOLD_PERCENT: u8 = 3;
pub const JEWELRY_BONUS_CRITICAL_HIT_PERCENT_PER_GREATNESS: u8 = 3;
pub const JEWELRY_BONUS_NAME_MATCH_PERCENT_PER_GREATNESS: u8 = 3;
pub const NECKLACE_ARMOR_BONUS: u8 = 3;

// Stat Settings
pub const HEALTH_INCREASE_PER_VITALITY: u8 = 15;
pub const VITALITY_INSTANT_HEALTH_BONUS: u8 = 15;

// Combat Settings
pub const MINIMUM_DAMAGE_TO_BEASTS: u8 = 4;
pub const MINIMUM_DAMAGE_FROM_BEASTS: u8 = 2;
pub const MINIMUM_DAMAGE_FROM_OBSTACLES: u8 = 4;
pub const CRITICAL_HIT_LEVEL_MULTIPLIER: u8 = 1;

// Misc Settings
pub const MAX_ADVENTURER_BLOCKS: u16 = 512; // 2^9
pub const XP_FOR_DISCOVERIES: u8 = 1;

// controls how much faster items level up compared to the player
pub const ITEM_XP_MULTIPLIER_BEASTS: u8 = 2;
pub const ITEM_XP_MULTIPLIER_OBSTACLES: u8 = 1;

pub const TWO_POW_64_NZ: NonZero<u128> = 0x10000000000000000;
pub const TWO_POW_32_NZ: NonZero<u64> = 0x100000000;
pub const TWO_POW_32: u64 = 0x100000000;
pub const TWO_POW_16_NZ: NonZero<u32> = 0x10000;
pub const TWO_POW_16: u256 = 0x10000;
pub const TWO_POW_8_NZ_U16: NonZero<u16> = 0x100;
