// ---------------------------
// ---------- Tests ----------
// ---------------------------
#[cfg(test)]
mod tests {
    use death_mountain::constants::beast::BeastId::{Bear, Goblin, Juggernaut, MAX_ID, Pegasus, Warlock};
    use death_mountain::constants::beast::BeastSettings::{
        CRITICAL_HIT_AMBUSH_MULTIPLIER, CRITICAL_HIT_LEVEL_MULTIPLIER, MAXIMUM_HEALTH,
    };
    use death_mountain::constants::combat::CombatEnums::{Tier, Type};
    use death_mountain::models::adventurer::adventurer::{ImplAdventurer};
    use death_mountain::models::beast::{Beast, IBeast, ImplBeast};
    use death_mountain::models::combat::{CombatSpec, ImplCombat, SpecialPowers};

    #[test]
    #[available_gas(70000)]
    fn get_tier_unknown_id() {
        assert(ImplBeast::get_tier(MAX_ID + 1) == Tier::T5(()), 'unknown id gets T5');
    }

    #[test]
    #[available_gas(70000)]
    fn get_tier_max_value() {
        assert(ImplBeast::get_tier(255) == Tier::T5(()), 'should be unknown / T5');
    }

    #[test]
    #[available_gas(400000)]
    fn get_tier() {
        let warlock = Warlock;
        let warlock_tier = ImplBeast::get_tier(warlock);
        assert(warlock_tier == Tier::T1(()), 'Warlock should be T1');

        let juggernaut = Juggernaut;
        let juggernaut_tier = ImplBeast::get_tier(juggernaut);
        assert(juggernaut_tier == Tier::T2(()), 'Juggernaut should be T2');

        let pegasus = Pegasus;
        let pegasus_tier = ImplBeast::get_tier(pegasus);
        assert(pegasus_tier == Tier::T3(()), 'Pegasus should be T3');

        let goblin = Goblin;
        let goblin_tier = ImplBeast::get_tier(goblin);
        assert(goblin_tier == Tier::T4(()), 'Goblin should be T4');

        let bear = Bear;
        let bear_tier = ImplBeast::get_tier(bear);
        assert(bear_tier == Tier::T5(()), 'Bear should be T5');
    }

    #[test]
    #[available_gas(7750)]
    fn get_type_invalid_id() {
        assert(ImplBeast::get_type(MAX_ID + 1) == Type::None(()), 'unknown id is Type None');
    }

    #[test]
    #[available_gas(7750)]
    fn get_type_zero() {
        assert(ImplBeast::get_type(MAX_ID + 1) == Type::None(()), 'zero is unknown / Type None');
    }

    #[test]
    #[available_gas(4880)]
    fn get_type_max_value() {
        assert(ImplBeast::get_type(255) == Type::None(()), 'max is unknown / Type None');
    }

    #[test]
    #[available_gas(21600)]
    fn get_type() {
        let warlock_type = ImplBeast::get_type(Warlock);
        assert(warlock_type == Type::Magic_or_Cloth(()), 'Warlock is magical');

        let juggernaut_type = ImplBeast::get_type(Juggernaut);
        assert(juggernaut_type == Type::Bludgeon_or_Metal(()), 'Juggernaut is a brute ');

        let pegasus_type = ImplBeast::get_type(Pegasus);
        assert(pegasus_type == Type::Blade_or_Hide(()), 'Pegasus is a hunter');

        let goblin_type = ImplBeast::get_type(Goblin);
        assert(goblin_type == Type::Magic_or_Cloth(()), 'Goblin is magical');

        let bear_type = ImplBeast::get_type(Bear);
        assert(bear_type == Type::Blade_or_Hide(()), 'Bear is a hunter');
    }

    #[test]
    #[available_gas(500000)]
    fn get_level() {
        let mut adventurer_level = 1;

        // at level 1, we'll get a beast with level 1 or 2
        assert(ImplBeast::get_level(adventurer_level, 0) == 1, 'lvl should eql advr lvl');
        assert(ImplBeast::get_level(adventurer_level, 1) == 2, 'lvl should eql advr lvl');
        assert(ImplBeast::get_level(adventurer_level, 2) == 3, 'lvl should eql advr lvl');
        assert(ImplBeast::get_level(adventurer_level, 3) == 1, 'lvl should eql advr lvl');

        // advance adventurer to level 4
        adventurer_level = 4;
        assert(ImplBeast::get_level(adventurer_level, 0) == 1, 'beast lvl should be 1');
        assert(ImplBeast::get_level(adventurer_level, 1) == 2, 'beast lvl should be 2');
        assert(ImplBeast::get_level(adventurer_level, 2) == 3, 'beast lvl should be 3');
        assert(ImplBeast::get_level(adventurer_level, 3) == 4, 'beast lvl should be 4');
        assert(ImplBeast::get_level(adventurer_level, 4) == 5, 'beast lvl should be 5');
        assert(ImplBeast::get_level(adventurer_level, 5) == 6, 'beast lvl should be 6');
        assert(ImplBeast::get_level(adventurer_level, 6) == 7, 'beast lvl should be 7');
        assert(ImplBeast::get_level(adventurer_level, 7) == 8, 'beast lvl should be 8');
        assert(ImplBeast::get_level(adventurer_level, 8) == 9, 'beast lvl should be 9');
        assert(ImplBeast::get_level(adventurer_level, 9) == 10, 'beast lvl should be 10');
        assert(ImplBeast::get_level(adventurer_level, 10) == 11, 'beast lvl should be 11');
        assert(ImplBeast::get_level(adventurer_level, 11) == 12, 'beast lvl should be 12');

        // verify we rollover back to 1 for our lvl4 adventurer
        assert(ImplBeast::get_level(adventurer_level, 12) == 1, 'beast lvl should be 1');
    }

    #[test]
    #[available_gas(200000)]
    fn get_starting_health() {
        let adventurer_level = 1;

        // test level 1 adventurer
        assert(ImplBeast::get_starting_health(adventurer_level, 0) == 11, 'minimum beast health is 11');

        // test with adventurer at 4x difficulty cliff
        // entropy 0 gives us minimum beast health
        let adventurer_level = 12;
        assert(ImplBeast::get_starting_health(adventurer_level, 0) == 11, 'beast health should be 11');

        // test upper end up beast health at 4x difficulty cliff
        assert(ImplBeast::get_starting_health(adventurer_level, 74) == 85, 'beast health should be 85');

        // test extremes
        let adventurer_level = 255; // max u8
        assert(ImplBeast::get_starting_health(adventurer_level, 1022) == MAXIMUM_HEALTH, 'beast health should be max');
    }

    #[test]
    #[available_gas(50000)]
    fn get_beast_id() {
        let zero_check = 0;
        let beast_id = ImplBeast::get_beast_id(zero_check);
        assert(beast_id != 0, 'beast should not be zero');
        assert(beast_id <= MAX_ID, 'beast higher than max beastid');

        let max_beast_id = MAX_ID.into();
        let beast_id = ImplBeast::get_beast_id(max_beast_id);
        assert(beast_id != 0, 'beast should not be zero');
        assert(beast_id <= MAX_ID, 'beast higher than max beastid');

        let _above_max_beast_id = MAX_ID + 1;
        let beast_id = ImplBeast::get_beast_id(max_beast_id);
        assert(beast_id != 0, 'beast should not be zero');
        assert(beast_id <= MAX_ID, 'beast higher than max beastid');
    }

    #[test]
    fn get_gold_reward() {
        let mut beast = Beast {
            id: 1,
            starting_health: 100,
            combat_spec: CombatSpec {
                tier: Tier::T1(()),
                item_type: Type::Magic_or_Cloth(()),
                level: 1,
                specials: SpecialPowers { special1: 3, special2: 1, special3: 2 },
            },
        };
        let gold_reward = beast.get_gold_reward();
        assert(gold_reward == 2, 'gold reward should be 2');

        // increase beast to level 10
        beast.combat_spec.level = 10;
        let gold_reward = beast.get_gold_reward();
        assert(gold_reward == 25, 'gold reward should be 25');

        // increase beast to level 15
        beast.combat_spec.level = 15;
        let gold_reward = beast.get_gold_reward();
        assert(gold_reward == 37, 'gold reward should be 37');

        // increase beast to level 20
        beast.combat_spec.level = 20;
        let gold_reward = beast.get_gold_reward();
        assert(gold_reward == 50, 'gold reward should be 50');
    }

    #[test]
    fn get_critical_hit_chance_no_ambush() {
        let adventurer_level = 10;
        let is_ambush = false;
        let chance = ImplBeast::get_critical_hit_chance(adventurer_level, is_ambush);
        assert(
            chance == (adventurer_level.into() * CRITICAL_HIT_LEVEL_MULTIPLIER).try_into().unwrap(),
            'crit hit chance no ambush',
        );
    }

    #[test]
    fn get_critical_hit_chance_with_ambush() {
        let adventurer_level = 10;
        let is_ambush = true;
        let chance = ImplBeast::get_critical_hit_chance(adventurer_level, is_ambush);
        assert(
            chance == (adventurer_level.into() * CRITICAL_HIT_AMBUSH_MULTIPLIER).try_into().unwrap(),
            'crit hit chance for ambush',
        );
    }

    #[test]
    fn get_critical_hit_chance_cap() {
        let adventurer_level = 105;
        let is_ambush = true;
        let chance = ImplBeast::get_critical_hit_chance(adventurer_level, is_ambush);
        assert(chance == 100, 'crit hit exceeded 100');
    }

    #[test]
    fn get_critical_hit_chance_no_ambush_cap() {
        let adventurer_level = 105;
        let is_ambush = false;
        let chance = ImplBeast::get_critical_hit_chance(adventurer_level, is_ambush);
        assert(chance == 100, 'crit hit ambush exceeded 100');
    }

    #[test]
    fn get_critical_hit_chance_mul_overflow() {
        let adventurer_level = 255;
        let is_ambush = false;
        let chance = ImplBeast::get_critical_hit_chance(adventurer_level, is_ambush);
        assert(chance == 100, 'crit hit ambush exceeded 100');
    }

    #[test]
    fn get_beast_from_seed() {
        let xp = 4;
        let seed = 9972942310244935680;
        let adventurer_level = 2;

        let (beast_seed, _, beast_health_rnd, beast_level_rnd, beast_specials1_rnd, beast_specials2_rnd, _, _) =
            ImplAdventurer::get_randomness(
            xp, seed,
        );

        // get beast based on entropy seeds
        let beast = ImplBeast::get_beast(
            adventurer_level,
            Type::Magic_or_Cloth(()),
            beast_seed,
            beast_health_rnd,
            beast_level_rnd,
            beast_specials1_rnd,
            beast_specials2_rnd,
        );

        println!("beast id: {:?}", beast.id);
        println!("beast starting health: {:?}", beast.starting_health);
    }
}
