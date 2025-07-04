// ---------------------------
// ---------- Tests ----------
// ---------------------------
#[cfg(test)]
mod tests {
    use death_mountain::models::adventurer::stats::{IStat, ImplStats, MAX_STAT_VALUE, Stats};

    #[test]
    #[available_gas(1039260)]
    fn stats_packing() {
        // zero case
        let stats = Stats { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0 };

        let packed = stats.pack();
        let unpacked = ImplStats::unpack(packed);
        assert(stats.strength == unpacked.strength, 'strength zero case');
        assert(stats.dexterity == unpacked.dexterity, 'dexterity zero case');
        assert(stats.vitality == unpacked.vitality, 'vitality zero case');
        assert(stats.intelligence == unpacked.intelligence, 'intelligence zero case');
        assert(stats.wisdom == unpacked.wisdom, 'wisdom zero case');
        assert(stats.charisma == unpacked.charisma, 'charisma zero case');
        assert(unpacked.luck == 0, 'luck is zero from storage');

        // storage limit test
        let stats = Stats {
            strength: 31, dexterity: 31, vitality: 31, intelligence: 31, wisdom: 31, charisma: 31, luck: 31,
        };

        let packed = stats.pack();
        let unpacked = ImplStats::unpack(packed);
        assert(stats.strength == unpacked.strength, 'strength storage limit');
        assert(stats.dexterity == unpacked.dexterity, 'dexterity storage limit');
        assert(stats.vitality == unpacked.vitality, 'vitality storage limit');
        assert(stats.intelligence == unpacked.intelligence, 'intelligence storage limit');
        assert(stats.wisdom == unpacked.wisdom, 'wisdom storage limit');
        assert(stats.charisma == unpacked.charisma, 'charisma storage limit');
        assert(unpacked.luck == 0, 'luck is zero from storage');
    }

    #[test]
    #[should_panic(expected: ('strength pack overflow',))]
    #[available_gas(142010)]
    fn pack_protection_overflow_strength() {
        let stats = Stats {
            strength: MAX_STAT_VALUE + 1, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };

        stats.pack();
    }

    #[test]
    #[should_panic(expected: ('dexterity pack overflow',))]
    #[available_gas(142010)]
    fn pack_protection_overflow_dexterity() {
        let stats = Stats {
            strength: 0, dexterity: MAX_STAT_VALUE + 1, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };

        stats.pack();
    }

    #[test]
    #[should_panic(expected: ('vitality pack overflow',))]
    #[available_gas(142010)]
    fn pack_protection_overflow_vitality() {
        let stats = Stats {
            strength: 0, dexterity: 0, vitality: MAX_STAT_VALUE + 1, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };

        stats.pack();
    }

    #[test]
    #[should_panic(expected: ('intelligence pack overflow',))]
    #[available_gas(142010)]
    fn pack_protection_overflow_intelligence() {
        let stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: MAX_STAT_VALUE + 1, wisdom: 0, charisma: 0, luck: 0,
        };

        stats.pack();
    }

    #[test]
    #[should_panic(expected: ('wisdom pack overflow',))]
    #[available_gas(142010)]
    fn pack_protection_overflow_wisdom() {
        let stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: MAX_STAT_VALUE + 1, charisma: 0, luck: 0,
        };

        stats.pack();
    }

    #[test]
    fn apply_stats_all_positive() {
        let mut base_stats = Stats {
            strength: 5, dexterity: 5, vitality: 5, intelligence: 5, wisdom: 5, charisma: 5, luck: 0,
        };
        let apply_stats = Stats {
            strength: 2, dexterity: 3, vitality: 1, intelligence: 4, wisdom: 2, charisma: 3, luck: 0,
        };

        base_stats.apply_stats(apply_stats);

        assert(base_stats.strength == 7, 'strength should be 7');
        assert(base_stats.dexterity == 8, 'dexterity should be 8');
        assert(base_stats.vitality == 6, 'vitality should be 6');
        assert(base_stats.intelligence == 9, 'intelligence should be 9');
        assert(base_stats.wisdom == 7, 'wisdom should be 7');
        assert(base_stats.charisma == 8, 'charisma should be 8');
        assert(base_stats.luck == 0, 'luck should remain 0');
    }

    #[test]
    fn apply_stats_some_zero() {
        let mut base_stats = Stats {
            strength: 5, dexterity: 5, vitality: 5, intelligence: 5, wisdom: 5, charisma: 5, luck: 0,
        };
        let apply_stats = Stats {
            strength: 0, dexterity: 3, vitality: 0, intelligence: 4, wisdom: 0, charisma: 2, luck: 0,
        };

        base_stats.apply_stats(apply_stats);

        assert(base_stats.strength == 5, 'strength should remain 5');
        assert(base_stats.dexterity == 8, 'dexterity should be 8');
        assert(base_stats.vitality == 5, 'vitality should remain 5');
        assert(base_stats.intelligence == 9, 'intelligence should be 9');
        assert(base_stats.wisdom == 5, 'wisdom should remain 5');
        assert(base_stats.charisma == 7, 'charisma should be 7');
        assert(base_stats.luck == 0, 'luck should remain 0');
    }

    #[test]
    fn apply_stats_all_zero() {
        let mut base_stats = Stats {
            strength: 5, dexterity: 5, vitality: 5, intelligence: 5, wisdom: 5, charisma: 5, luck: 0,
        };
        let apply_stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };

        base_stats.apply_stats(apply_stats);

        assert(base_stats.strength == 5, 'strength should remain 5');
        assert(base_stats.dexterity == 5, 'dexterity should remain 5');
        assert(base_stats.vitality == 5, 'vitality should remain 5');
        assert(base_stats.intelligence == 5, 'intelligence should remain 5');
        assert(base_stats.wisdom == 5, 'wisdom should remain 5');
        assert(base_stats.charisma == 5, 'charisma should remain 5');
        assert(base_stats.luck == 0, 'luck should remain 0');
    }

    #[test]
    fn increase_strength() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        // basic case
        stats.increase_strength(1);
        assert(stats.strength == 1, 'strength should be 1');
        // exceed max stat case
        stats.increase_strength(50);
        assert(stats.strength == 51, 'strength should be 51');
    }

    #[test]
    fn increase_dexterity() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        // basic case
        stats.increase_dexterity(1);
        assert(stats.dexterity == 1, 'dexterity should be 1');
        // overflow case
        stats.increase_dexterity(50);
        assert(stats.dexterity == 51, 'dexterity should be 51');
    }

    #[test]
    fn increase_vitality() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        // basic case
        stats.increase_vitality(1);
        assert(stats.vitality == 1, 'vitality should be 1');
        // overflow case
        stats.increase_vitality(50);
        assert(stats.vitality == 51, 'vitality should be 51');
    }

    #[test]
    fn increase_intelligence() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        // basic case
        stats.increase_intelligence(1);
        assert(stats.intelligence == 1, 'intelligence should be 1');
        // overflow case
        stats.increase_intelligence(50);
        assert(stats.intelligence == 51, 'intelligence should be 51');
    }

    #[test]
    fn increase_wisdom() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        // basic case
        stats.increase_wisdom(1);
        assert(stats.wisdom == 1, 'wisdom should be 1');
        // overflow case
        stats.increase_wisdom(50);
        assert(stats.wisdom == 51, 'wisdom should be 51');
    }

    #[test]
    fn increase_charisma() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        // basic case
        stats.increase_charisma(1);
        assert(stats.charisma == 1, 'charisma should be 1');
        // overflow case
        stats.increase_charisma(50);
        assert(stats.charisma == 51, 'charisma should be 51');
    }

    #[test]
    fn decrease_strength() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_strength(2);
        assert(stats.strength == 2, 'strength should be 2');
        stats.decrease_strength(1);
        assert(stats.strength == 1, 'strength should be 1');
    }

    #[test]
    #[should_panic(expected: ('strength underflow',))]
    fn decrease_strength_underflow() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_strength(5);
        stats.decrease_strength(6);
    }

    #[test]
    fn decrease_dexterity() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_dexterity(2);
        assert(stats.dexterity == 2, 'dexterity should be 2');
        stats.decrease_dexterity(1);
        assert(stats.dexterity == 1, 'dexterity should be 1');
    }

    #[test]
    #[should_panic(expected: ('dexterity underflow',))]
    fn decrease_dexterity_underflow() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_dexterity(5);
        stats.decrease_dexterity(6);
    }

    #[test]
    fn decrease_vitality() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_vitality(2);
        assert(stats.vitality == 2, 'vitality should be 2');
        stats.decrease_vitality(1);
        assert(stats.vitality == 1, 'vitality should be 1');
    }

    #[test]
    #[should_panic(expected: ('vitality underflow',))]
    fn decrease_vitality_underflow() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_vitality(5);
        stats.decrease_vitality(6);
    }

    #[test]
    fn decrease_intelligence() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_intelligence(2);
        assert(stats.intelligence == 2, 'intelligence should be 2');
        stats.decrease_intelligence(1);
        assert(stats.intelligence == 1, 'intelligence should be 1');
    }

    #[test]
    #[should_panic(expected: ('intelligence underflow',))]
    fn decrease_intelligence_underflow() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_intelligence(5);
        stats.decrease_intelligence(6);
    }


    #[test]
    fn decrease_wisdom() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_wisdom(2);
        assert(stats.wisdom == 2, 'wisdom should be 2');
        stats.decrease_wisdom(1);
        assert(stats.wisdom == 1, 'wisdom should be 1');
    }

    #[test]
    #[should_panic(expected: ('wisdom underflow',))]
    fn decrease_wisdom_underflow() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_wisdom(5);
        stats.decrease_wisdom(6);
    }


    #[test]
    fn decrease_charisma() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_charisma(2);
        assert(stats.charisma == 2, 'charisma should be 2');
        stats.decrease_charisma(1);
        assert(stats.charisma == 1, 'charisma should be 1');
    }

    #[test]
    #[should_panic(expected: ('charisma underflow',))]
    fn decrease_charisma_underflow() {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        stats.increase_charisma(5);
        stats.decrease_charisma(6);
    }
}
