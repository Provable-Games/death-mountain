// SPDX-License-Identifier: BUSL-1.1

use core::integer::u64_safe_divmod;
use core::panic_with_felt252;
use core::traits::DivRem;
use death_mountain::constants::loot::ItemSuffix;

pub const MAX_STAT_VALUE: u8 = 31;

#[derive(Introspect, Drop, Copy, Serde, PartialEq)]
pub struct Stats { // 30 bits total
    pub strength: u8,
    pub dexterity: u8,
    pub vitality: u8, // 5 bits per stat
    pub intelligence: u8,
    pub wisdom: u8,
    pub charisma: u8,
    pub luck: u8,
}

#[generate_trait]
pub impl ImplStats of IStat {
    /// @notice Creates a new Stats instance with all stats set to 0.
    /// @return A new Stats instance with all stats set to 0.
    fn new() -> Stats {
        Stats { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0 }
    }

    /// @notice packs the stats into a felt252
    /// @param self the Stats to pack
    /// @return the packed Stats
    fn pack(self: Stats) -> felt252 {
        assert(self.strength <= MAX_STAT_VALUE, 'strength pack overflow');
        assert(self.dexterity <= MAX_STAT_VALUE, 'dexterity pack overflow');
        assert(self.vitality <= MAX_STAT_VALUE, 'vitality pack overflow');
        assert(self.intelligence <= MAX_STAT_VALUE, 'intelligence pack overflow');
        assert(self.wisdom <= MAX_STAT_VALUE, 'wisdom pack overflow');
        assert(self.charisma <= MAX_STAT_VALUE, 'charisma pack overflow');

        (self.strength.into()
            + self.dexterity.into() * TWO_POW_5
            + self.vitality.into() * TWO_POW_10
            + self.intelligence.into() * TWO_POW_15
            + self.wisdom.into() * TWO_POW_20
            + self.charisma.into() * TWO_POW_25)
            .try_into()
            .unwrap()
    }

    /// @notice unpacks the stats from a felt252
    /// @param value the felt252 to unpack
    /// @return the unpacked Stats
    fn unpack(value: felt252) -> Stats {
        let packed = value.into();
        let (packed, strength) = DivRem::div_rem(packed, TWO_POW_5_NZ);
        let (packed, dexterity) = DivRem::div_rem(packed, TWO_POW_5_NZ);
        let (packed, vitality) = DivRem::div_rem(packed, TWO_POW_5_NZ);
        let (packed, intelligence) = DivRem::div_rem(packed, TWO_POW_5_NZ);
        let (packed, wisdom) = DivRem::div_rem(packed, TWO_POW_5_NZ);
        let (_, charisma) = DivRem::div_rem(packed, TWO_POW_5_NZ);

        Stats {
            strength: strength.try_into().unwrap(),
            dexterity: dexterity.try_into().unwrap(),
            vitality: vitality.try_into().unwrap(),
            intelligence: intelligence.try_into().unwrap(),
            wisdom: wisdom.try_into().unwrap(),
            charisma: charisma.try_into().unwrap(),
            luck: 0,
        }
    }

    /// @notice applies stat boosts to adventurer
    /// @param self The Adventurer to apply stat boosts to.
    /// @param stats The stat boosts to apply to the adventurer.

    fn apply_stats(ref self: Stats, stats: Stats) {
        self.increase_strength(stats.strength);
        self.increase_dexterity(stats.dexterity);
        self.increase_vitality(stats.vitality);
        self.increase_charisma(stats.charisma);
        self.increase_intelligence(stats.intelligence);
        self.increase_wisdom(stats.wisdom);
    }

    /// @notice removes stat boosts from adventurer
    /// @param self The Stats to remove stat boosts from.
    /// @param stats The stat boosts to remove from the adventurer.

    fn remove_stats(ref self: Stats, stats: Stats) {
        self.decrease_strength(stats.strength);
        self.decrease_dexterity(stats.dexterity);
        self.decrease_vitality(stats.vitality);
        self.decrease_charisma(stats.charisma);
        self.decrease_intelligence(stats.intelligence);
        self.decrease_wisdom(stats.wisdom);
    }

    // @notice This function adds a boost to an adventurer's attributes based on a provided suffix.
    // Each suffix corresponds to a unique combination of attribute enhancements.
    //
    // The following enhancements are available:
    // - of_Power: Increases the adventurer's Strength by 3 points.
    // - of_Giant: Increases the adventurer's Vitality by 3 points.
    // - of_Titans: Increases the adventurer's Strength by 2 points and Charisma by 1 point.
    // - of_Skill: Increases the adventurer's Dexterity by 3 points.
    // - of_Perfection: Increases the adventurer's Strength, Dexterity, and Vitality by 1 point
    // each.
    // - of_Brilliance: Increases the adventurer's Intelligence by 3 points.
    // - of_Enlightenment: Increases the adventurer's Wisdom by 3 points.
    // - of_Protection: Increases the adventurer's Vitality by 2 points and Dexterity by 1 point.
    // - of_Anger: Increases the adventurer's Strength by 2 points and Dexterity by 1 point.
    // - of_Rage: Increases the adventurer's Strength, Charisma, and Wisdom by 1 point each.
    // - of_Fury: Increases the adventurer's Vitality, Charisma, and Intelligence by 1 point each.
    // - of_Vitriol: Increases the adventurer's Intelligence by 2 points and Wisdom by 1 point.
    // - of_the_Fox: Increases the adventurer's Dexterity by 2 points and Charisma by 1 point.
    // - of_Detection: Increases the adventurer's Wisdom by 2 points and Dexterity by 1 point.
    // - of_Reflection: Increases the adventurer's Intelligence by 1 point and Wisdom by 2 points.
    // - of_the_Twins: Increases the adventurer's Charisma by 3 points.
    //
    // @param self A mutable reference to the Adventurer Stats on which the function operates.
    // @param suffix A u8 value representing the suffix tied to the attribute enhancement.
    fn apply_suffix_boost(ref self: Stats, suffix: u8) {
        if (suffix == ItemSuffix::of_Power) {
            self.increase_strength(3);
        } else if (suffix == ItemSuffix::of_Titans) {
            self.increase_strength(2);
        } else if (suffix == ItemSuffix::of_Skill) {
            self.increase_dexterity(3);
        } else if (suffix == ItemSuffix::of_Perfection) {
            self.increase_strength(1);
            self.increase_dexterity(1);
        } else if (suffix == ItemSuffix::of_Brilliance) {
            self.increase_intelligence(3);
        } else if (suffix == ItemSuffix::of_Enlightenment) {
            self.increase_wisdom(3);
        } else if (suffix == ItemSuffix::of_Protection) {
            self.increase_dexterity(1);
        } else if (suffix == ItemSuffix::of_Anger) {
            self.increase_strength(2);
            self.increase_dexterity(1);
        } else if (suffix == ItemSuffix::of_Rage) {
            self.increase_strength(1);
            self.increase_wisdom(1);
        } else if (suffix == ItemSuffix::of_Fury) {
            self.increase_intelligence(1);
        } else if (suffix == ItemSuffix::of_Vitriol) {
            self.increase_intelligence(2);
            self.increase_wisdom(1);
        } else if (suffix == ItemSuffix::of_the_Fox) {
            self.increase_dexterity(2);
        } else if (suffix == ItemSuffix::of_Detection) {
            self.increase_wisdom(2);
            self.increase_dexterity(1);
        } else if (suffix == ItemSuffix::of_Reflection) {
            self.increase_intelligence(1);
            self.increase_wisdom(2);
        }
    }

    /// @notice removes stat boosts from adventurer
    /// @param self The Stats to remove stat boosts from.
    /// @param suffix The suffix to remove from the adventurer's stats.
    fn remove_suffix_boost(ref self: Stats, suffix: u8) {
        if (suffix == ItemSuffix::of_Power) {
            self.decrease_strength(3);
        } else if (suffix == ItemSuffix::of_Titans) {
            self.decrease_strength(2);
        } else if (suffix == ItemSuffix::of_Skill) {
            self.decrease_dexterity(3);
        } else if (suffix == ItemSuffix::of_Perfection) {
            self.decrease_strength(1);
            self.decrease_dexterity(1);
        } else if (suffix == ItemSuffix::of_Brilliance) {
            self.decrease_intelligence(3);
        } else if (suffix == ItemSuffix::of_Enlightenment) {
            self.decrease_wisdom(3);
        } else if (suffix == ItemSuffix::of_Protection) {
            self.decrease_dexterity(1);
        } else if (suffix == ItemSuffix::of_Anger) {
            self.decrease_strength(2);
            self.decrease_dexterity(1);
        } else if (suffix == ItemSuffix::of_Rage) {
            self.decrease_strength(1);
            self.decrease_wisdom(1);
        } else if (suffix == ItemSuffix::of_Fury) {
            self.decrease_intelligence(1);
        } else if (suffix == ItemSuffix::of_Vitriol) {
            self.decrease_intelligence(2);
            self.decrease_wisdom(1);
        } else if (suffix == ItemSuffix::of_the_Fox) {
            self.decrease_dexterity(2);
        } else if (suffix == ItemSuffix::of_Detection) {
            self.decrease_wisdom(2);
            self.decrease_dexterity(1);
        } else if (suffix == ItemSuffix::of_Reflection) {
            self.decrease_intelligence(1);
            self.decrease_wisdom(2);
        }
    }

    fn apply_bag_boost(ref self: Stats, suffix: u8) {
        if (suffix == ItemSuffix::of_Giant) {
            self.increase_vitality(3);
        } else if (suffix == ItemSuffix::of_Titans) {
            self.increase_charisma(1);
        } else if (suffix == ItemSuffix::of_Perfection) {
            self.increase_vitality(1);
        } else if (suffix == ItemSuffix::of_Protection) {
            self.increase_vitality(2);
        } else if (suffix == ItemSuffix::of_Rage) {
            self.increase_charisma(1);
        } else if (suffix == ItemSuffix::of_Fury) {
            self.increase_vitality(1);
            self.increase_charisma(1);
        } else if (suffix == ItemSuffix::of_the_Fox) {
            self.increase_charisma(1);
        } else if (suffix == ItemSuffix::of_the_Twins) {
            self.increase_charisma(3);
        }
    }

    fn remove_bag_boost(ref self: Stats, suffix: u8) {
        if (suffix == ItemSuffix::of_Giant) {
            self.decrease_vitality(3);
        } else if (suffix == ItemSuffix::of_Titans) {
            self.decrease_charisma(1);
        } else if (suffix == ItemSuffix::of_Perfection) {
            self.decrease_vitality(1);
        } else if (suffix == ItemSuffix::of_Protection) {
            self.decrease_vitality(2);
        } else if (suffix == ItemSuffix::of_Rage) {
            self.decrease_charisma(1);
        } else if (suffix == ItemSuffix::of_Fury) {
            self.decrease_vitality(1);
            self.decrease_charisma(1);
        } else if (suffix == ItemSuffix::of_the_Fox) {
            self.decrease_charisma(1);
        } else if (suffix == ItemSuffix::of_the_Twins) {
            self.decrease_charisma(3);
        }
    }

    /// @notice increases the strength stat
    /// @param self The Stats to increase the strength stat of.
    /// @param amount The amount to increase the strength stat by.

    fn increase_strength(ref self: Stats, amount: u8) {
        self.strength += amount;
    }

    /// @notice increases the dexterity stat
    /// @param self The Stats to increase the dexterity stat of.
    /// @param amount The amount to increase the dexterity stat by.

    fn increase_dexterity(ref self: Stats, amount: u8) {
        self.dexterity += amount;
    }

    /// @notice increases the vitality stat
    /// @param self The Stats to increase the vitality stat of.
    /// @param amount The amount to increase the vitality stat by.

    fn increase_vitality(ref self: Stats, amount: u8) {
        self.vitality += amount;
    }

    /// @notice increases the intelligence stat
    /// @param self The Stats to increase the intelligence stat of.
    /// @param amount The amount to increase the intelligence stat by.

    fn increase_intelligence(ref self: Stats, amount: u8) {
        self.intelligence += amount;
    }

    /// @notice increases the wisdom stat
    /// @param self The Stats to increase the wisdom stat of.
    /// @param amount The amount to increase the wisdom stat by.

    fn increase_wisdom(ref self: Stats, amount: u8) {
        self.wisdom += amount;
    }

    /// @notice increases the charisma stat
    /// @param self The Stats to increase the charisma stat of.
    /// @param amount The amount to increase the charisma stat by.

    fn increase_charisma(ref self: Stats, amount: u8) {
        self.charisma += amount;
    }

    /// @notice decreases the strength stat
    /// @param self The Stats to decrease the strength stat of.
    /// @param amount The amount to decrease the strength stat by.

    fn decrease_strength(ref self: Stats, amount: u8) {
        assert(amount <= self.strength, 'strength underflow');
        self.strength -= amount;
    }

    /// @notice decreases the dexterity stat
    /// @param self The Stats to decrease the dexterity stat of.
    /// @param amount The amount to decrease the dexterity stat by.

    fn decrease_dexterity(ref self: Stats, amount: u8) {
        assert(amount <= self.dexterity, 'dexterity underflow');
        self.dexterity -= amount;
    }

    /// @notice decreases the vitality stat
    /// @param self The Stats to decrease the vitality stat of.
    /// @param amount The amount to decrease the vitality stat by.

    fn decrease_vitality(ref self: Stats, amount: u8) {
        assert(amount <= self.vitality, 'vitality underflow');
        self.vitality -= amount;
    }

    /// @notice decreases the intelligence stat
    /// @param self The Stats to decrease the intelligence stat of.
    /// @param amount The amount to decrease the intelligence stat by.

    fn decrease_intelligence(ref self: Stats, amount: u8) {
        assert(amount <= self.intelligence, 'intelligence underflow');
        self.intelligence -= amount;
    }

    /// @notice decreases the wisdom stat
    /// @param self The Stats to decrease the wisdom stat of.
    /// @param amount The amount to decrease the wisdom stat by.

    fn decrease_wisdom(ref self: Stats, amount: u8) {
        assert(amount <= self.wisdom, 'wisdom underflow');
        self.wisdom -= amount;
    }

    /// @notice decreases the charisma stat
    /// @param self The Stats to decrease the charisma stat of.
    /// @param amount The amount to decrease the charisma stat by.

    fn decrease_charisma(ref self: Stats, amount: u8) {
        assert(amount <= self.charisma, 'charisma underflow');
        self.charisma -= amount;
    }

    /// @notice Generates starting stats for the Adventurer.
    /// @param seed The seed to generate the stats from.
    /// @return The starting stats.
    fn generate_starting_stats(seed: u64) -> Stats {
        let (entropy, stat1) = u64_safe_divmod(seed, SIX_NZ);
        let (entropy, stat2) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat3) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat4) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat5) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat6) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat7) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat8) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat9) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat10) = u64_safe_divmod(entropy, SIX_NZ);
        let (entropy, stat11) = u64_safe_divmod(entropy, SIX_NZ);
        let (_, stat12) = u64_safe_divmod(entropy, SIX_NZ);
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.apply_stat(stat1.try_into().unwrap());
        stats.apply_stat(stat2.try_into().unwrap());
        stats.apply_stat(stat3.try_into().unwrap());
        stats.apply_stat(stat4.try_into().unwrap());
        stats.apply_stat(stat5.try_into().unwrap());
        stats.apply_stat(stat6.try_into().unwrap());
        stats.apply_stat(stat7.try_into().unwrap());
        stats.apply_stat(stat8.try_into().unwrap());
        stats.apply_stat(stat9.try_into().unwrap());
        stats.apply_stat(stat10.try_into().unwrap());
        stats.apply_stat(stat11.try_into().unwrap());
        stats.apply_stat(stat12.try_into().unwrap());
        stats
    }

    /// @notice applies a stat to the adventurer
    /// @param self The Stats to apply the stat to.
    /// @param stat The stat to apply.

    fn apply_stat(ref self: Stats, stat: u8) {
        if (stat == 0) {
            self.strength += 1
        } else if (stat == 1) {
            self.dexterity += 1
        } else if (stat == 2) {
            self.vitality += 1
        } else if (stat == 3) {
            self.intelligence += 1
        } else if (stat == 4) {
            self.wisdom += 1
        } else if (stat == 5) {
            self.charisma += 1
        } else {
            panic_with_felt252('stat out of range');
        }
    }


    fn count_total_stats(self: Stats) -> u16 {
        self.strength.into()
            + self.dexterity.into()
            + self.vitality.into()
            + self.intelligence.into()
            + self.wisdom.into()
            + self.charisma.into()
    }
}

const SIX_NZ: NonZero<u64> = 6;
const TWO_POW_5: u256 = 0x20;
const TWO_POW_5_NZ: NonZero<u256> = 0x20;
const TWO_POW_10: u256 = 0x400;
const TWO_POW_15: u256 = 0x8000;
const TWO_POW_20: u256 = 0x100000;
const TWO_POW_25: u256 = 0x2000000;
