// SPDX-License-Identifier: MIT

use core::num::traits::Sqrt;
use core::panic_with_felt252;
use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type, WeaponEffectiveness};
use death_mountain::constants::combat::CombatSettings::{
    ELEMENTAL_DAMAGE_BONUS, MAX_XP_DECAY, SPECIAL2_DAMAGE_MULTIPLIER, SPECIAL3_DAMAGE_MULTIPLIER, STRENGTH_DAMAGE_BONUS,
    TIER_DAMAGE_MULTIPLIER, XP_MULTIPLIER, XP_REWARD_DIVISOR,
};

/// @dev this is a struct for providing special item abilities
#[derive(Introspect, Drop, Copy, Serde)]
pub struct SpecialPowers {
    pub special1: u8,
    pub special2: u8,
    pub special3: u8,
}

/// @dev this is a struct for providing combat specifications
#[derive(Drop, Copy, Serde)]
pub struct CombatSpec {
    pub tier: Tier,
    pub item_type: Type,
    pub level: u16,
    pub specials: SpecialPowers,
}

/// Used for providing combat results
/// @dev this is a struct for returning the results of a combat calculation
#[derive(Drop, Serde)]
pub struct CombatResult {
    pub base_attack: u16,
    pub base_armor: u16,
    pub elemental_adjusted_damage: u16,
    pub strength_bonus: u16,
    pub critical_hit_bonus: u16,
    pub weapon_special_bonus: u16,
    pub total_damage: u16,
}

#[generate_trait]
pub impl ImplCombat of ICombat {
    /// @notice Calculates the damage dealt to a defender based on various combat specifications and
    /// statistics @dev This function computes elemental adjusted damage, strength bonus, critical
    /// hit bonus, and weapon special bonus to find out the total damage.
    /// @param weapon The weapon CombatSpec of the attacker
    /// @param armor The armor CombatSpec of the defender
    /// @param minimum_damage The minimum damage the attacker can inflict
    /// @param attacker_strength The strength statistic of the attacker
    /// @param defender_strength The strength statistic of the defender (Note: unused in this
    /// function, can potentially be removed if not needed elsewhere)
    /// @param critical_hit_chance The probability for a critical hit expressed as an integer
    /// between 0 and 100 @param entropy A random value to determine certain random aspects of the
    /// combat, like critical hits @return Returns a CombatResult object containing detailed damage
    /// calculations, including base attack, base armor, elemental adjusted damage, strength bonus,
    /// critical hit bonus, weapon special bonus, and total damage inflicted.
    fn calculate_damage(
        weapon: CombatSpec,
        armor: CombatSpec,
        minimum_damage: u8,
        attacker_strength: u8,
        defender_strength: u8,
        critical_hit_chance: u8,
        critical_hit_rnd: u8,
    ) -> CombatResult {
        // get base attack and armor
        let base_attack = Self::get_attack_hp(weapon);
        let base_armor = Self::get_armor_hp(armor);

        // adjust base damage for elemental effectiveness
        let elemental_adjusted_damage = Self::elemental_adjusted_damage(base_attack, weapon.item_type, armor.item_type);

        // get strength bonus using elemental adjusted damage
        let strength_bonus = Self::strength_bonus(elemental_adjusted_damage, attacker_strength);

        // get critical hit bonus using elemental adjusted damage
        let critical_hit_bonus = Self::critical_hit_bonus(
            elemental_adjusted_damage, critical_hit_chance, critical_hit_rnd,
        );

        // get weapon special bonus using elemental adjusted damage
        let weapon_special_bonus = Self::weapon_special_bonus(
            elemental_adjusted_damage, weapon.specials, armor.specials,
        );

        // total the damage
        let total_attack = elemental_adjusted_damage + strength_bonus + critical_hit_bonus + weapon_special_bonus;

        let mut total_damage: u16 = minimum_damage.into();
        if total_attack > base_armor + minimum_damage.into() {
            total_damage = total_attack - base_armor;
        }

        // return the resulting damages
        CombatResult {
            base_attack,
            base_armor,
            elemental_adjusted_damage,
            strength_bonus,
            critical_hit_bonus,
            weapon_special_bonus,
            total_damage,
        }
    }

    /// @notice gets the attack HP of a weapon
    /// @param weapon: the weapon used to attack
    /// @return u16: the attack HP of the weapon
    fn get_attack_hp(weapon: CombatSpec) -> u16 {
        match weapon.tier {
            Tier::None => 0,
            Tier::T1 => { weapon.level * TIER_DAMAGE_MULTIPLIER::T1.into() },
            Tier::T2 => { weapon.level * TIER_DAMAGE_MULTIPLIER::T2.into() },
            Tier::T3 => { weapon.level * TIER_DAMAGE_MULTIPLIER::T3.into() },
            Tier::T4 => { weapon.level * TIER_DAMAGE_MULTIPLIER::T4.into() },
            Tier::T5 => { weapon.level * TIER_DAMAGE_MULTIPLIER::T5.into() },
        }
    }

    /// @notice gets the armor HP of a piece of armor
    /// @param armor: the armor worn by the defender
    /// @return u16: the armor HP of the armor
    fn get_armor_hp(armor: CombatSpec) -> u16 {
        match armor.tier {
            Tier::None => 0,
            Tier::T1 => { armor.level * TIER_DAMAGE_MULTIPLIER::T1.into() },
            Tier::T2 => { armor.level * TIER_DAMAGE_MULTIPLIER::T2.into() },
            Tier::T3 => { armor.level * TIER_DAMAGE_MULTIPLIER::T3.into() },
            Tier::T4 => { armor.level * TIER_DAMAGE_MULTIPLIER::T4.into() },
            Tier::T5 => { armor.level * TIER_DAMAGE_MULTIPLIER::T5.into() },
        }
    }

    /// @notice Adjusts the damage dealt based on the elemental compatibility of the weapon and
    /// armor types @param damage: the initial damage value
    /// @param weapon_type: the elemental type of the weapon
    /// @param armor_type: the elemental type of the armor
    /// @return u16: the adjusted damage value after considering the elemental effectiveness
    fn elemental_adjusted_damage(damage: u16, weapon_type: Type, armor_type: Type) -> u16 {
        let elemental_effect = damage / ELEMENTAL_DAMAGE_BONUS.into();
        let weapon_effectiveness = Self::get_elemental_effectiveness(weapon_type, armor_type);
        match weapon_effectiveness {
            WeaponEffectiveness::Weak => { damage - elemental_effect },
            WeaponEffectiveness::Fair => { damage },
            WeaponEffectiveness::Strong => { damage + elemental_effect },
        }
    }

    /// @notice gets the effectiveness of a weapon against armor
    /// @param weapon_type: the type of weapon used to attack
    /// @param armor_type: the type of armor worn by the defender
    /// @return WeaponEffectiveness: the effectiveness of the weapon against the armor
    fn get_elemental_effectiveness(weapon_type: Type, armor_type: Type) -> WeaponEffectiveness {
        match weapon_type {
            Type::None => { WeaponEffectiveness::Fair },
            // Magic is strong against metal, fair against cloth, and weak against hide
            Type::Magic_or_Cloth => {
                match armor_type {
                    // weapon is strong against no armor
                    Type::None => { WeaponEffectiveness::Strong },
                    Type::Magic_or_Cloth => { WeaponEffectiveness::Fair },
                    Type::Blade_or_Hide => { WeaponEffectiveness::Weak },
                    Type::Bludgeon_or_Metal => { WeaponEffectiveness::Strong },
                    // should not happen but compiler requires exhaustive match
                    Type::Necklace => { WeaponEffectiveness::Fair },
                    // should not happen but compiler requires exhaustive match
                    Type::Ring => { WeaponEffectiveness::Fair },
                }
            },
            // Blade is strong against cloth, fair against hide, and weak against metal
            Type::Blade_or_Hide => {
                match armor_type {
                    // weapon is strong against no armor
                    Type::None => { WeaponEffectiveness::Strong },
                    Type::Magic_or_Cloth => { WeaponEffectiveness::Strong },
                    Type::Blade_or_Hide => { WeaponEffectiveness::Fair },
                    Type::Bludgeon_or_Metal => { WeaponEffectiveness::Weak },
                    // should not happen but compiler requires exhaustive match
                    Type::Necklace => { WeaponEffectiveness::Fair },
                    // should not happen but compiler requires exhaustive match
                    Type::Ring => { WeaponEffectiveness::Fair },
                }
            },
            // Bludgeon is strong against hide, fair against metal, and weak against cloth
            Type::Bludgeon_or_Metal => {
                match armor_type {
                    // weapon is strong against no armor
                    Type::None => { WeaponEffectiveness::Strong },
                    Type::Magic_or_Cloth => { WeaponEffectiveness::Weak },
                    Type::Blade_or_Hide => { WeaponEffectiveness::Strong },
                    Type::Bludgeon_or_Metal => { WeaponEffectiveness::Fair },
                    // should not happen but compiler requires exhaustive match
                    Type::Necklace => { WeaponEffectiveness::Fair },
                    // should not happen but compiler requires exhaustive match
                    Type::Ring => { WeaponEffectiveness::Fair },
                }
            },
            Type::Necklace => { WeaponEffectiveness::Fair },
            Type::Ring => { WeaponEffectiveness::Fair },
        }
    }


    /// @notice determines if the attack is a critical hit
    /// @param chance: the chance of a critical hit
    /// @param rnd: the random value used to determine if the attack is a critical hit
    /// @return bool: true if the attack is a critical hit, false otherwise
    /// @dev this function scales the chance around a u8 (1-255) for uniform distribution
    fn is_critical_hit(chance: u8, rnd: u8) -> bool {
        let scaled_chance: u16 = (chance.into() * 255) / 100;
        scaled_chance > rnd.into()
    }

    /// @notice calculates the bonus damage done by a critical hit
    /// @param base_damage: the base damage done by the attacker
    /// @param critical_hit_chance: the chance of a critical hit
    /// @param rnd: the random value used to determine if the attack is a critical hit
    /// @return u16: the bonus damage done by a critical hit
    fn critical_hit_bonus(base_damage: u16, critical_hit_chance: u8, rnd: u8) -> u16 {
        let is_critical_hit = Self::is_critical_hit(critical_hit_chance, rnd);
        if (is_critical_hit) {
            base_damage
        } else {
            0
        }
    }

    /// @notice calculates the bonus damage done by a weapon as a result of the weapon special2
    /// @param base_damage: the base damage done by the attacker
    /// @param weapon_prefix1: the prefix of the weapon used to attack
    /// @param armor_prefix1: the prefix of the armor worn by the defender
    /// @return u16: the bonus damage done by a special item
    fn get_special2_bonus(base_damage: u16, weapon_prefix1: u8, armor_prefix1: u8) -> u16 {
        if (weapon_prefix1 != 0 && weapon_prefix1 == armor_prefix1) {
            base_damage * SPECIAL2_DAMAGE_MULTIPLIER.into()
        } else {
            0
        }
    }

    /// @notice calculates the bonus damage done by a weapon as a result of the weapon special3
    /// @param base_damage: the base damage done by the attacker
    /// @param weapon_prefix2: the prefix of the weapon used to attack
    /// @param armor_prefix2: the prefix of the armor worn by the defender
    /// @return u16: the bonus damage done by a special item
    fn get_special3_bonus(base_damage: u16, weapon_prefix2: u8, armor_prefix2: u8) -> u16 {
        if (weapon_prefix2 != 0 && weapon_prefix2 == armor_prefix2) {
            base_damage * SPECIAL3_DAMAGE_MULTIPLIER.into()
        } else {
            0
        }
    }

    /// @notice calculates the bonus damage done by a weapon as a result of the weapon special2 and
    /// special3 @param base_damage: the base damage done by the attacker
    /// @param weapon_special2: the special2 of the weapon used to attack
    /// @param armor_special2: the special2 of the armor worn by the defender
    /// @return u16: the bonus damage done by a special item
    fn weapon_special_bonus(base_damage: u16, weapon_name: SpecialPowers, armor_name: SpecialPowers) -> u16 {
        let special2_bonus = Self::get_special2_bonus(base_damage, weapon_name.special2, armor_name.special2);

        let special3_bonus = Self::get_special3_bonus(base_damage, weapon_name.special3, armor_name.special3);

        special2_bonus + special3_bonus
    }

    /// @notice calculates the bonus damage done by adventurer strength
    /// @param damage: the base damage done by the attacker
    /// @param strength: the strength stat of the adventurer
    /// @return u16: the bonus damage done by adventurer strength
    fn strength_bonus(damage: u16, strength: u8) -> u16 {
        if strength == 0 {
            0
        } else {
            damage * strength.into() * STRENGTH_DAMAGE_BONUS.into() / 100
        }
    }


    /// @notice: gets random level for enemy
    /// @param adventurer_level: the level of the adventurer
    /// @param seed: a random value used to determine the level
    /// @return u16: the random level
    fn get_random_level(adventurer_level: u8, seed: u16) -> u16 {
        let base_level = 1 + (seed % (adventurer_level.into() * 3)).try_into().unwrap();

        // add discrete difficulty increases based on adventurer level
        if (adventurer_level >= 50) {
            base_level + 80
        } else if (adventurer_level >= 40) {
            base_level + 40
        } else if (adventurer_level >= 30) {
            base_level + 20
        } else if (adventurer_level >= 20) {
            base_level + 10
        } else {
            base_level
        }
    }

    /// @notice: gets enemy starting health
    /// @param adventurer_level: the level of the adventurer
    /// @param seed: a random value used to determine the enemy's starting health
    /// @return u16: the enemy's starting health
    fn get_random_starting_health(adventurer_level: u8, seed: u16) -> u16 {
        let health = 1 + (seed % (adventurer_level.into() * 20)).try_into().unwrap();

        // add discrete difficulty increases based on adventurer level
        if (adventurer_level >= 50) {
            health + 500
        } else if (adventurer_level >= 40) {
            health + 400
        } else if (adventurer_level >= 30) {
            health + 200
        } else if (adventurer_level >= 20) {
            health + 100
        } else {
            health + 10
        }
    }

    /// @notice: gets level from xp
    /// @param xp: the xp to get the level for
    /// @return u8: the level for the given xp

    fn get_level_from_xp(xp: u16) -> u8 {
        if (xp == 0) {
            1
        } else {
            xp.sqrt()
        }
    }

    /// @notice gets the base reward for defeating an entity.
    /// @param self: the combat spec for the defeated entity
    /// @param adventurer_level: the level of the adventurer
    /// @return u16: the base reward
    fn get_base_reward(self: CombatSpec, adventurer_level: u8) -> u16 {
        let mut level_decay_percentage: u16 = adventurer_level.into() * 2;
        if (level_decay_percentage >= MAX_XP_DECAY.into()) {
            level_decay_percentage = MAX_XP_DECAY.into();
        }

        let mut tier_multiplier = 0;

        match self.tier {
            Tier::None => { panic_with_felt252('get_base_reward: tier is none'); },
            Tier::T1 => { tier_multiplier = XP_MULTIPLIER::T1.into(); },
            Tier::T2 => { tier_multiplier = XP_MULTIPLIER::T2.into(); },
            Tier::T3 => { tier_multiplier = XP_MULTIPLIER::T3.into(); },
            Tier::T4 => { tier_multiplier = XP_MULTIPLIER::T4.into(); },
            Tier::T5 => { tier_multiplier = XP_MULTIPLIER::T5.into(); },
        }

        let reward_amount: u16 = (tier_multiplier * self.level) / XP_REWARD_DIVISOR.into();

        // apply level decay percentage on reward_amount and return
        reward_amount * (100 - level_decay_percentage) / 100
    }

    /// @notice: converts a tier to a u8
    /// @param tier: the tier to convert
    /// @return u8: the u8 value of the tier
    fn tier_to_u8(tier: Tier) -> u8 {
        match tier {
            Tier::None => 0,
            Tier::T1 => 1,
            Tier::T2 => 2,
            Tier::T3 => 3,
            Tier::T4 => 4,
            Tier::T5 => 5,
        }
    }

    /// @notice: converts an item type to a u8
    /// @param item_type: the item type to convert
    /// @return u8: the u8 value of the item type
    fn type_to_u8(item_type: Type) -> u8 {
        match item_type {
            Type::None => 0,
            Type::Magic_or_Cloth => 1,
            Type::Blade_or_Hide => 2,
            Type::Bludgeon_or_Metal => 3,
            Type::Necklace => 4,
            Type::Ring => 5,
        }
    }

    /// @notice: converts a u8 to an item type
    /// @param item_type: the u8 value to convert
    /// @return Type: the item type of the u8 value
    fn u8_to_type(item_type: u8) -> Type {
        if (item_type == 1) {
            Type::Magic_or_Cloth
        } else if (item_type == 2) {
            Type::Blade_or_Hide
        } else if (item_type == 3) {
            Type::Bludgeon_or_Metal
        } else if (item_type == 4) {
            Type::Necklace
        } else if (item_type == 5) {
            Type::Ring
        } else {
            Type::None
        }
    }

    /// @notice: converts a u8 to a tier
    /// @param item_type: the u8 value to convert
    /// @return Tier: the tier of the u8 value
    fn u8_to_tier(item_type: u8) -> Tier {
        if (item_type == 1) {
            Tier::T1
        } else if (item_type == 2) {
            Tier::T2
        } else if (item_type == 3) {
            Tier::T3
        } else if (item_type == 4) {
            Tier::T4
        } else if (item_type == 5) {
            Tier::T5
        } else {
            Tier::None
        }
    }

    /// @notice: converts a slot to a u8
    /// @param slot: the slot to convert
    /// @return u8: the u8 value of the slot
    fn slot_to_u8(slot: Slot) -> u8 {
        match slot {
            Slot::None => 0,
            Slot::Weapon => 1,
            Slot::Chest => 2,
            Slot::Head => 3,
            Slot::Waist => 4,
            Slot::Foot => 5,
            Slot::Hand => 6,
            Slot::Neck => 7,
            Slot::Ring => 8,
        }
    }

    /// @notice: converts a u8 to a slot
    /// @param item_type: the u8 value to convert
    /// @return Slot: the slot of the u8 value
    fn u8_to_slot(item_type: u8) -> Slot {
        if (item_type == 1) {
            Slot::Weapon
        } else if (item_type == 2) {
            Slot::Chest
        } else if (item_type == 3) {
            Slot::Head
        } else if (item_type == 4) {
            Slot::Waist
        } else if (item_type == 5) {
            Slot::Foot
        } else if (item_type == 6) {
            Slot::Hand
        } else if (item_type == 7) {
            Slot::Neck
        } else if (item_type == 8) {
            Slot::Ring
        } else {
            Slot::None
        }
    }

    /// @notice: determines if the adventurer can avoid the threat based on their level and relevant
    /// stat @param adventurer_level: the level of the adventurer
    /// @param relevant_stat: the stat that is relevant to the threat
    /// @param rnd: a u8 random value used to determine if the adventurer can avoid the threat
    /// @return bool: whether or not the adventurer can avoid the threat
    fn ability_based_avoid_threat(adventurer_level: u8, relevant_stat: u8, rnd: u8) -> bool {
        if relevant_stat >= adventurer_level {
            true
        } else {
            let scaled_chance: u16 = (adventurer_level.into() * rnd.into()) / 255;
            relevant_stat.into() > scaled_chance
        }
    }

    fn ability_based_damage_reduction(adventurer_level: u8, relevant_stat: u8) -> u8 {
        const SCALE: u128 = 1_000_000;

        let mut ratio = SCALE * relevant_stat.into() / adventurer_level.into();
        if ratio > SCALE {
            ratio = SCALE;
        }

        let r2 = ratio * ratio / SCALE;
        let r3 = r2 * ratio / SCALE;
        let smooth = 3 * r2 - 2 * r3;

        (100 * smooth / SCALE).try_into().unwrap()
    }
}
// ---------------------------
// ---------- Tests ----------
// ---------------------------

