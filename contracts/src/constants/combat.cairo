// SPDX-License-Identifier: MIT

pub mod CombatEnums {
    #[derive(Drop, Copy, PartialEq, Serde)]
    pub enum WeaponEffectiveness {
        Weak,
        Fair,
        Strong,
    }

    #[derive(Introspect, Copy, Drop, PartialEq, Serde)]
    pub enum Type {
        None,
        Magic_or_Cloth,
        Blade_or_Hide,
        Bludgeon_or_Metal,
        Necklace,
        Ring,
    }

    #[derive(Introspect, Copy, Drop, PartialEq, Serde)]
    pub enum Tier {
        None,
        T1,
        T2,
        T3,
        T4,
        T5,
    }

    #[derive(Introspect, Copy, Drop, PartialEq, Serde)]
    pub enum Slot {
        None,
        Weapon,
        Chest,
        Head,
        Waist,
        Foot,
        Hand,
        Neck,
        Ring,
    }
}

pub mod CombatSettings {
    // ELEMENTAL_DAMAGE_BONUS controls the impact of elemental damage
    // 0 = disables elemental
    // 1 = max effect (0x, 1x, 2x)
    // 2 = half of base damage (-0.5x, 1x, 1.5x)
    // 3 = 1/3 of base damage (-0.66x, 1x, 1.66x)
    pub const ELEMENTAL_DAMAGE_BONUS: u8 = 2;

    // controls impact of strength on damage
    pub const STRENGTH_DAMAGE_BONUS: u8 = 10;

    // Determines xp multiplier for each tier
    pub mod XP_MULTIPLIER {
        pub const T1: u8 = 5; // 5 * level
        pub const T2: u8 = 4; // 4 * level
        pub const T3: u8 = 3; // 3 * level
        pub const T4: u8 = 2; // 2 * level
        pub const T5: u8 = 1; // 1 * level
    }

    // The combat get_earned_xp will divide the xp reward by this number
    // the higher the number, the less xp earned, which makes the game slower
    pub const XP_REWARD_DIVISOR: u8 = 2;

    // Determines damage multiplier for each tier
    pub mod TIER_DAMAGE_MULTIPLIER {
        pub const T1: u8 = 5; // 5 * level
        pub const T2: u8 = 4; // 4 * level
        pub const T3: u8 = 3; // 3 * level
        pub const T4: u8 = 2; // 2 * level
        pub const T5: u8 = 1; // 1 * level
    }

    pub const MAX_XP_DECAY: u8 = 95;
    pub const SPECIAL2_DAMAGE_MULTIPLIER: u8 = 8;
    pub const SPECIAL3_DAMAGE_MULTIPLIER: u8 = 2;
}
