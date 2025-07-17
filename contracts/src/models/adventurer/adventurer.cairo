// SPDX-License-Identifier: BUSL-1.1

use core::num::traits::OverflowingAdd;
use core::panic_with_felt252;
use core::poseidon::poseidon_hash_span;
use core::traits::DivRem;
use death_mountain::constants::adventurer::{
    BASE_POTION_PRICE, CHARISMA_ITEM_DISCOUNT, CHARISMA_POTION_DISCOUNT, CRITICAL_HIT_LEVEL_MULTIPLIER,
    HEALTH_INCREASE_PER_VITALITY, JEWELRY_BONUS_BEAST_GOLD_PERCENT, JEWELRY_BONUS_CRITICAL_HIT_PERCENT_PER_GREATNESS,
    JEWELRY_BONUS_NAME_MATCH_PERCENT_PER_GREATNESS, MAX_ADVENTURER_HEALTH, MAX_ADVENTURER_XP, MAX_GOLD,
    MAX_PACKABLE_BEAST_HEALTH, MAX_STAT_UPGRADES_AVAILABLE, MINIMUM_DAMAGE_FROM_BEASTS, MINIMUM_DAMAGE_FROM_OBSTACLES,
    MINIMUM_DAMAGE_TO_BEASTS, MINIMUM_ITEM_PRICE, MINIMUM_POTION_PRICE, NECKLACE_ARMOR_BONUS,
    SILVER_RING_LUCK_BONUS_PER_GREATNESS, STARTING_GOLD, STARTING_HEALTH, TWO_POW_16_NZ, TWO_POW_32, TWO_POW_32_NZ,
    TWO_POW_64_NZ, TWO_POW_8_NZ_U16, VITALITY_INSTANT_HEALTH_BONUS,
};
use death_mountain::constants::beast::BeastSettings;
use death_mountain::constants::combat::CombatEnums::{Slot, Type};
use death_mountain::constants::discovery::DiscoveryEnums::{DiscoveryType, ExploreResult};
use death_mountain::constants::loot::ItemSuffix::{
    of_Anger, of_Brilliance, of_Detection, of_Enlightenment, of_Fury, of_Giant, of_Perfection, of_Power, of_Protection,
    of_Rage, of_Reflection, of_Skill, of_Titans, of_Vitriol, of_the_Fox, of_the_Twins,
};
use death_mountain::constants::loot::{ItemId, SUFFIX_UNLOCK_GREATNESS};
use death_mountain::models::adventurer::bag::{Bag, IBag};
use death_mountain::models::adventurer::equipment::{Equipment, IEquipment, ImplEquipment};
use death_mountain::models::adventurer::item::{IItemPrimitive, ImplItem, Item};
use death_mountain::models::adventurer::stats::{IStat, ImplStats, Stats};
use death_mountain::models::beast::{Beast};
use death_mountain::models::combat::{CombatResult, CombatSpec, ImplCombat, SpecialPowers};
use death_mountain::models::loot::{Loot};
use death_mountain::models::obstacle::{ImplObstacle, Obstacle};
use death_mountain::utils::loot::ItemUtils;


#[derive(Introspect, Drop, Copy, Serde)]
pub struct Adventurer {
    pub health: u16, // 10 bits
    pub xp: u16, // 15 bits
    pub gold: u16, // 9 bits
    pub beast_health: u16, // 10 bits
    pub stat_upgrades_available: u8, // 4 bits
    pub stats: Stats, // 30 bits
    pub equipment: Equipment, // 128 bits
    pub item_specials_seed: u16, // 16 bits
    pub action_count: u16,
}

#[derive(Drop, Serde)]
pub struct ItemSpecial {
    pub item_id: u8,
    pub special_power: SpecialPowers,
}

#[generate_trait]
/// @title Adventurer Implementation
/// @notice This module provides the implementation for the Adventurer struct.
pub impl ImplAdventurer of IAdventurer {
    /// @notice Creates a new Adventurer struct.
    /// @param starting_item The ID of the starting weapon item.
    /// @return The new Adventurer struct.
    fn new(starting_item: u8) -> Adventurer {
        Adventurer {
            health: STARTING_HEALTH.into(),
            xp: 0,
            stats: ImplStats::new(),
            gold: STARTING_GOLD.into(),
            equipment: Equipment {
                weapon: Item { id: starting_item, xp: 0 },
                chest: Item { id: 0, xp: 0 },
                head: Item { id: 0, xp: 0 },
                waist: Item { id: 0, xp: 0 },
                foot: Item { id: 0, xp: 0 },
                hand: Item { id: 0, xp: 0 },
                neck: Item { id: 0, xp: 0 },
                ring: Item { id: 0, xp: 0 },
            },
            beast_health: BeastSettings::STARTER_BEAST_HEALTH.into(),
            stat_upgrades_available: 0,
            item_specials_seed: 0,
            action_count: 0,
        }
    }

    /// @notice Packs the Adventurer struct into a felt252.
    /// @param self The Adventurer struct to pack.
    /// @return The packed Adventurer struct.
    fn pack(adventurer: Adventurer) -> felt252 {
        assert(adventurer.health <= MAX_ADVENTURER_HEALTH, 'health overflow');
        assert(adventurer.xp <= MAX_ADVENTURER_XP, 'xp overflow');
        assert(adventurer.gold <= MAX_GOLD, 'gold overflow');
        assert(adventurer.beast_health <= MAX_PACKABLE_BEAST_HEALTH, 'beast health overflow');
        assert(adventurer.stat_upgrades_available <= MAX_STAT_UPGRADES_AVAILABLE, 'stat upgrades avail overflow');

        (adventurer.health.into()
            + adventurer.xp.into() * TWO_POW_10
            + adventurer.gold.into() * TWO_POW_25
            + adventurer.beast_health.into() * TWO_POW_34
            + adventurer.stat_upgrades_available.into() * TWO_POW_44
            + adventurer.stats.pack().into() * TWO_POW_48
            + adventurer.equipment.pack().into() * TWO_POW_78
            + adventurer.item_specials_seed.into() * TWO_POW_206
            + adventurer.action_count.into() * TWO_POW_222)
            .try_into()
            .unwrap()
    }

    /// @notice Unpacks the Adventurer struct from a felt252.
    /// @param value The felt252 to unpack.
    /// @return The unpacked Adventurer struct.
    fn unpack(value: felt252) -> Adventurer {
        let packed = value.into();
        let (packed, health) = DivRem::div_rem(packed, TWO_POW_10_NZ);
        let (packed, xp) = DivRem::div_rem(packed, TWO_POW_15_NZ);
        let (packed, gold) = DivRem::div_rem(packed, TWO_POW_9_NZ);
        let (packed, beast_health) = DivRem::div_rem(packed, TWO_POW_10_NZ);
        let (packed, stat_upgrades_available) = DivRem::div_rem(packed, TWO_POW_4_NZ);
        let (packed, stats) = DivRem::div_rem(packed, TWO_POW_30_NZ);
        let (packed, equipment) = DivRem::div_rem(packed, TWO_POW_128_NZ);
        let (packed, item_specials_seed) = DivRem::div_rem(packed, TWO_POW_16_NZ_U256);
        let (_, action_count) = DivRem::div_rem(packed, TWO_POW_16_NZ_U256);

        Adventurer {
            health: health.try_into().unwrap(),
            xp: xp.try_into().unwrap(),
            gold: gold.try_into().unwrap(),
            beast_health: beast_health.try_into().unwrap(),
            stat_upgrades_available: stat_upgrades_available.try_into().unwrap(),
            stats: ImplStats::unpack(stats.try_into().unwrap()),
            equipment: ImplEquipment::unpack(equipment.try_into().unwrap()),
            item_specials_seed: item_specials_seed.try_into().unwrap(),
            action_count: action_count.try_into().unwrap(),
        }
    }

    /// @notice Calculates the charisma potion discount for the adventurer based on their charisma
    /// stat.
    /// @return The charisma potion discount.

    fn charisma_potion_discount(self: Stats) -> u16 {
        CHARISMA_POTION_DISCOUNT.into() * self.charisma.into()
    }

    /// @notice Calculates the charisma item discount for the adventurer based on their charisma
    /// stat.
    /// @return The charisma item discount.

    fn charisma_item_discount(self: Stats) -> u16 {
        CHARISMA_ITEM_DISCOUNT.into() * self.charisma.into()
    }

    /// @notice Gets the item cost for the adventurer after applying any charisma discounts.
    /// @param item_cost The original cost of the item.
    /// @return The final cost of the item after applying discounts.
    fn charisma_adjusted_item_price(self: Stats, item_cost: u16) -> u16 {
        let charisma_discount = self.charisma_item_discount();
        if charisma_discount >= item_cost {
            MINIMUM_ITEM_PRICE.into()
        } else {
            item_cost - charisma_discount
        }
    }

    /// @notice Gets the potion cost for the adventurer after applying any charisma discounts.
    /// @param self: Adventurer to get the potion cost for after charisma discounts
    /// @return The final cost of the potion after applying discounts.
    fn charisma_adjusted_potion_price(self: Adventurer) -> u16 {
        let charisma_discount = self.stats.charisma_potion_discount();
        let potion_price = BASE_POTION_PRICE.into() * self.get_level().into();

        if charisma_discount >= potion_price {
            MINIMUM_POTION_PRICE.into()
        } else {
            potion_price - charisma_discount
        }
    }

    /// @notice Deducts a specified amount of gold from the adventurer, preventing underflow.
    /// @param amount The amount of gold to be deducted.

    fn deduct_gold(ref self: Adventurer, amount: u16) {
        if amount > self.gold {
            self.gold = 0;
        } else {
            self.gold -= amount;
        }
    }

    /// @notice Gets the item at a given item slot
    /// @param self: Equipment to check
    /// @param slot: Slot to check
    /// @return Item: Item at slot

    fn get_item_at_slot(self: Equipment, slot: Slot) -> Item {
        match slot {
            Slot::None(()) => Item { id: 0, xp: 0 },
            Slot::Weapon(()) => self.weapon,
            Slot::Chest(()) => self.chest,
            Slot::Head(()) => self.head,
            Slot::Waist(()) => self.waist,
            Slot::Foot(()) => self.foot,
            Slot::Hand(()) => self.hand,
            Slot::Neck(()) => self.neck,
            Slot::Ring(()) => self.ring,
        }
    }

    /// @notice Gets the item at a given item slot
    /// @param self: Equipment to check
    /// @param item_id: ID of the item to get
    /// @return Item: Item at slot, returns an empty item if the item is not found

    fn get_item(self: Equipment, item_id: u8) -> Item {
        if item_id == self.weapon.id {
            self.weapon
        } else if item_id == self.chest.id {
            self.chest
        } else if item_id == self.head.id {
            self.head
        } else if item_id == self.waist.id {
            self.waist
        } else if item_id == self.foot.id {
            self.foot
        } else if item_id == self.hand.id {
            self.hand
        } else if item_id == self.neck.id {
            self.neck
        } else if item_id == self.ring.id {
            self.ring
        } else {
            Item { id: 0, xp: 0 }
        }
    }

    /// @notice Checks if an item slot is free for an adventurer
    /// @param self: Equipment to check
    /// @param item_id: ID of the item to check
    /// @return bool: True if slot is free, false if not

    fn is_slot_free_item_id(self: Equipment, item_id: u8, slot: Slot) -> bool {
        match slot {
            Slot::None(()) => false,
            Slot::Weapon(()) => self.weapon.id == 0,
            Slot::Chest(()) => self.chest.id == 0,
            Slot::Head(()) => self.head.id == 0,
            Slot::Waist(()) => self.waist.id == 0,
            Slot::Foot(()) => self.foot.id == 0,
            Slot::Hand(()) => self.hand.id == 0,
            Slot::Neck(()) => self.neck.id == 0,
            Slot::Ring(()) => self.ring.id == 0,
        }
    }

    /// @notice Gets the current level of the adventurer based on their XP.
    /// @param self: Adventurer to get level for
    /// @return The current level of the adventurer.

    fn get_level(self: Adventurer) -> u8 {
        ImplCombat::get_level_from_xp(self.xp)
    }

    /// @notice Checks if the adventurer was ambushed
    /// @param adventurer_level: Level of the adventurer
    /// @param adventurer_wisdom: Wisdom of the adventurer
    /// @param rnd: Random value used to determine if the adventurer was ambushed
    /// @return bool: True if the adventurer was ambushed, false if not

    fn is_ambushed(adventurer_level: u8, adventurer_wisdom: u8, rnd: u8) -> bool {
        !ImplCombat::ability_based_avoid_threat(adventurer_level, adventurer_wisdom, rnd)
    }

    /// @notice Handles encountering a discovery
    /// @param adventurer_level The level of the adventurer.
    /// @param discovery_type_rnd A random value used to determine the discovery type.
    /// @param amount_rnd1 A random value used to determine the value of the discovery.
    /// @param amount_rnd2 A random value used to determine the value of the discovery.
    /// @return The DiscoveryType with the amount packaged inside.
    fn get_discovery(adventurer_level: u8, discovery_type_rnd: u8, amount_rnd1: u8, amount_rnd2: u8) -> DiscoveryType {
        let discovery_type = Self::scale_u8_to_percent(discovery_type_rnd);
        if discovery_type < 45 {
            DiscoveryType::Gold(Self::get_gold_discovery(adventurer_level, amount_rnd1))
        } else if discovery_type < 90 {
            DiscoveryType::Health(Self::get_health_discovery(adventurer_level, amount_rnd1))
        } else {
            DiscoveryType::Loot(Self::get_loot_discovery(amount_rnd1, amount_rnd2))
        }
    }

    /// @notice Gets the gold discovery
    /// @param adventurer_level: Level of the adventurer
    /// @param rnd: Random value used to determine the amount of gold
    /// @return The amount of gold discovered
    fn get_gold_discovery(adventurer_level: u8, rnd: u8) -> u16 {
        (rnd % adventurer_level.into()).try_into().unwrap() + 1
    }

    /// @notice Gets the health discovery
    /// @param adventurer_level: Level of the adventurer
    /// @param rnd: Random value used to determine the amount of health
    /// @return The amount of health discovered
    fn get_health_discovery(adventurer_level: u8, rnd: u8) -> u16 {
        ((rnd % adventurer_level.into()).try_into().unwrap() + 1) * 2
    }

    /// @notice Scales a u8 to a percent
    /// @param rnd: Random value to scale
    /// @return The scaled value (0-100)
    fn scale_u8_to_percent(rnd: u8) -> u8 {
        let rnd: u16 = rnd.into();
        ((rnd * 100 + 127) / 255).try_into().unwrap()
    }

    /// @notice Gets the loot discovery
    /// @param tier_rnd: Random value used to determine the item tier
    /// @param item_rnd: Random value used to determine the item item
    /// @return The id of the item discovered
    fn get_loot_discovery(tier_rnd: u8, item_rnd: u8) -> u8 {
        let outcome = Self::scale_u8_to_percent(tier_rnd);
        // 50% chance of T5
        if outcome < 50 {
            let t5_items = ItemUtils::get_t5_items();
            let item_index = (item_rnd.into() % t5_items.len()).try_into().unwrap();
            *t5_items.at(item_index)
            // 30% chance of T4
        } else if outcome < 80 {
            let t4_items = ItemUtils::get_t4_items();
            let item_index = (item_rnd.into() % t4_items.len()).try_into().unwrap();
            *t4_items.at(item_index)
            // 12% chance of T3
        } else if outcome < 92 {
            let t3_items = ItemUtils::get_t3_items();
            let item_index = (item_rnd.into() % t3_items.len()).try_into().unwrap();
            *t3_items.at(item_index)
            // 6% chance of T2
        } else if outcome < 98 {
            let t2_items = ItemUtils::get_t2_items();
            let item_index = (item_rnd.into() % t2_items.len()).try_into().unwrap();
            *t2_items.at(item_index)
            // 2% chance of T1
        } else {
            let t1_items = ItemUtils::get_t1_items();
            let item_index = (item_rnd.into() % t1_items.len()).try_into().unwrap();
            *t1_items.at(item_index)
        }
    }

    /// @notice Calculates the adventurer's luck based on the greatness of their jewelry
    /// @param self: Equipment to calculate luck for
    /// @param bag: Bag to calculate luck for
    /// @return The adventurer's luck based on their equipment and bag
    fn calculate_luck(self: Equipment, bag: Bag) -> u8 {
        let equipped_necklace_luck = self.neck.get_greatness();
        let equipped_ring_luck = self.ring.get_greatness();
        let bonus_luck = self.ring.jewelry_bonus_luck();
        let bagged_jewelry_luck = bag.get_jewelry_greatness();
        equipped_necklace_luck + equipped_ring_luck + bonus_luck + bagged_jewelry_luck
    }

    /// @notice Sets the luck stat of the adventurer
    /// @param self: Adventurer to set luck for
    /// @param bag: Bag needed for calculating luck
    fn set_luck(ref self: Adventurer, bag: Bag) {
        self.stats.luck = self.equipment.calculate_luck(bag);
    }

    /// @notice Checks if the adventurer is in battle
    /// @param self: Adventurer to check if in battle
    /// @return bool: True if the adventurer is in battle, false if not
    fn in_battle(self: Adventurer) -> bool {
        if self.beast_health == 0 {
            false
        } else {
            true
        }
    }

    /// @notice Deducts a specified amount of health from the adventurer's beast
    /// @param self: Adventurer to deduct beast health from
    /// @param amount: Amount of health to deduct from the beast
    fn deduct_beast_health(ref self: Adventurer, amount: u16) {
        if amount > self.beast_health {
            self.beast_health = 0;
        } else {
            self.beast_health -= amount;
        }
    }

    /// @notice Sets the beast's health to a specified amount
    /// @param self: Adventurer to set beast health for
    /// @param amount: Amount of health to set the beast's health to

    fn set_beast_health(ref self: Adventurer, amount: u16) {
        if (amount > BeastSettings::MAXIMUM_HEALTH) {
            self.beast_health = BeastSettings::MAXIMUM_HEALTH;
        } else {
            self.beast_health = amount;
        }
    }

    /// @notice Adds health to the adventurer, preventing overflow and capping at max health
    /// @param self: Adventurer to add health to
    /// @param amount: Amount of health to add to the adventurer

    fn increase_health(ref self: Adventurer, amount: u16) {
        let new_hp = self.health + amount;
        let max_hp = self.stats.get_max_health();

        if (new_hp > max_hp) {
            self.health = max_hp
        } else {
            self.health = new_hp;
        }
    }

    /// @notice Decreases health of Adventurer with underflow protection
    /// @param self: Adventurer to deduct health from
    /// @param value: Amount of health to deduct from the adventurer

    fn decrease_health(ref self: Adventurer, value: u16) {
        if value > self.health {
            self.health = 0;
        } else {
            self.health -= value;
        }
    }

    /// @notice Increases the adventurer's gold by the given value
    /// @param self: Adventurer to add gold to
    /// @param amount: Amount of gold to add to the adventurer

    fn increase_gold(ref self: Adventurer, amount: u16) {
        let new_amount = self.gold + amount;
        if (new_amount > MAX_GOLD) {
            self.gold = MAX_GOLD;
        } else {
            self.gold = new_amount;
        }
    }

    /// @notice Increases the adventurer's experience points by the given value and returns the
    /// previous and new level @param self: Adventurer to add experience points to
    /// @param amount: Amount of experience points to add to the adventurer
    /// @return A tuple containing the adventurer's level before and after the XP addition
    fn increase_adventurer_xp(ref self: Adventurer, amount: u16) -> (u8, u8) {
        let previous_level = self.get_level();
        let new_amount = self.xp + amount;

        if (new_amount > MAX_ADVENTURER_XP) {
            self.xp = MAX_ADVENTURER_XP;
        } else {
            self.xp = new_amount;
        }

        let new_level = self.get_level();
        if (new_level > previous_level) {
            // adventurer gains stat upgrade points each level up
            let stat_upgrade_points = new_level - previous_level;
            self.increase_stat_upgrades_available(stat_upgrade_points);
        }

        (previous_level, new_level)
    }

    /// @notice Grants stat upgrades to the adventurer
    /// @param self: Adventurer to add stat upgrades to
    /// @param amount: Amount of stat upgrades to add to the adventurer

    fn increase_stat_upgrades_available(ref self: Adventurer, amount: u8) {
        let new_amount = self.stat_upgrades_available + amount;
        if (new_amount > MAX_STAT_UPGRADES_AVAILABLE) {
            self.stat_upgrades_available = MAX_STAT_UPGRADES_AVAILABLE;
        } else {
            self.stat_upgrades_available = new_amount;
        }
    }

    /// @notice Checks if the adventurer has a given item equipped
    /// @param self: Equipment to check if item is equipped
    /// @param item_id: Id of the item to check
    /// @return bool: True if the item is equipped, false if not
    fn is_equipped(self: Equipment, item_id: u8) -> bool {
        if (self.weapon.id == item_id) {
            true
        } else if (self.chest.id == item_id) {
            true
        } else if (self.head.id == item_id) {
            true
        } else if (self.waist.id == item_id) {
            true
        } else if (self.foot.id == item_id) {
            true
        } else if (self.hand.id == item_id) {
            true
        } else if (self.neck.id == item_id) {
            true
        } else if (self.ring.id == item_id) {
            true
        } else {
            false
        }
    }

    /// @notice Determines if a level up resulted in item specials being unlocked
    /// @param previous_level: the level of the item before the level up
    /// @param new_level: the level of the item after the level up
    /// @return (bool, bool): a tuple containing a boolean indicating which item specials were
    /// unlocked
    ///                            (suffix, prefixes)
    fn unlocked_specials(previous_level: u8, new_level: u8) -> (bool, bool) {
        if (previous_level < 15 && new_level >= 19) {
            (true, true)
        } else if (previous_level < SUFFIX_UNLOCK_GREATNESS && new_level >= SUFFIX_UNLOCK_GREATNESS) {
            (true, false)
        } else if (previous_level < 19 && new_level >= 19) {
            (false, true)
        } else {
            (false, false)
        }
    }

    /// @notice Calculates the bonus luck provided by the jewelry
    /// @param self: Item to calculate bonus luck for
    /// @return The amount of bonus luck, or 0 if the item does not provide a luck bonus

    fn jewelry_bonus_luck(self: Item) -> u8 {
        if (self.id == ItemId::SilverRing) {
            self.get_greatness() * SILVER_RING_LUCK_BONUS_PER_GREATNESS
        } else {
            0
        }
    }

    /// @notice Calculates the gold bonus provided by the jewelry
    /// @param self: Item to calculate gold bonus for
    /// @param base_gold_amount: Base gold amount before the jewelry bonus is applied
    /// @return The amount of bonus gold, or 0 if the item does not provide a gold bonus

    fn jewelry_gold_bonus(self: Item, base_gold_amount: u16) -> u16 {
        if self.id == ItemId::GoldRing {
            base_gold_amount * JEWELRY_BONUS_BEAST_GOLD_PERCENT.into() * self.get_greatness().into() / 100
        } else {
            0
        }
    }

    /// @notice Calculates the bonus damage provided by the jewelry when the attacker's
    /// weapon name matches the beast's name
    /// @param self: Item to calculate name match bonus damage for
    /// @param base_damage: Base damage amount before the jewelry bonus is applied
    /// @return The amount of bonus damage, or 0 if the item does not provide a name match damage
    /// bonus

    fn name_match_bonus_damage(self: Item, base_damage: u16) -> u16 {
        if (self.id == ItemId::PlatinumRing) {
            base_damage * JEWELRY_BONUS_NAME_MATCH_PERCENT_PER_GREATNESS.into() * self.get_greatness().into() / 100
        } else {
            0
        }
    }

    /// @notice Calculates the bonus damage provided by the jewelry for critical hits
    /// @param self: Item to calculate critical hit bonus damage for
    /// @param base_damage: Base damage amount before the jewelry bonus is applied
    /// @return The amount of bonus damage, or 0 if the item does not provide a critical hit damage
    /// bonus

    fn critical_hit_bonus_damage(self: Item, base_damage: u16) -> u16 {
        if (self.id == ItemId::TitaniumRing) {
            base_damage * JEWELRY_BONUS_CRITICAL_HIT_PERCENT_PER_GREATNESS.into() * self.get_greatness().into() / 100
        } else {
            0
        }
    }

    /// @notice Gets the adventurer's equipped items
    /// @param self: Adventurer to get equipped items for
    /// @return Array<Item>: the adventurer's equipped items
    fn get_equipped_items(self: Adventurer) -> Array<Item> {
        let mut equipped_items = ArrayTrait::<Item>::new();
        if self.equipment.weapon.id != 0 {
            equipped_items.append(self.equipment.weapon);
        }
        if self.equipment.chest.id != 0 {
            equipped_items.append(self.equipment.chest);
        }
        if self.equipment.head.id != 0 {
            equipped_items.append(self.equipment.head);
        }
        if self.equipment.waist.id != 0 {
            equipped_items.append(self.equipment.waist);
        }
        if self.equipment.foot.id != 0 {
            equipped_items.append(self.equipment.foot);
        }
        if self.equipment.hand.id != 0 {
            equipped_items.append(self.equipment.hand);
        }
        if self.equipment.neck.id != 0 {
            equipped_items.append(self.equipment.neck);
        }
        if self.equipment.ring.id != 0 {
            equipped_items.append(self.equipment.ring);
        }
        equipped_items
    }

    /// @notice Checks if the adventurer can explore
    /// @param self: Adventurer to check if they can explore
    /// @return bool: True if the adventurer can explore, false if not

    fn can_explore(self: Adventurer) -> bool {
        self.health != 0 && self.beast_health == 0 && self.stat_upgrades_available == 0
    }


    /// @notice Executes an attack from an Adventurer to a Beast.
    ///
    /// @dev The function calculates the damage dealt to the Beast using a combination
    /// of the adventurer's weapon, stats, jewelry bonuses, and entropy to influence
    /// critical hits. Note: Beasts do not have strength in this version.
    ///
    /// @param self The Adventurer executing the attack.
    /// @param weapon_combat_spec Combat specifications of the weapon being used.
    /// @param beast The Beast that is being attacked.
    /// @param crit_hit_rnd A u8 random value used to determine if attack is crit hit
    ///
    /// @return Returns a CombatResult object containing the details of the attack's
    /// outcome.
    fn attack(self: Adventurer, weapon_combat_spec: CombatSpec, beast: Beast, crit_hit_rnd: u8) -> CombatResult {
        // no strength for beasts in this version
        let beast_strength = 0;

        // calculate attack damage
        let mut combat_results = ImplCombat::calculate_damage(
            weapon_combat_spec,
            beast.combat_spec,
            MINIMUM_DAMAGE_TO_BEASTS,
            self.stats.strength,
            beast_strength,
            self.stats.luck,
            crit_hit_rnd,
        );

        // get jewelry bonus for name match damage
        let name_match_jewelry_bonus = self.equipment.ring.name_match_bonus_damage(combat_results.weapon_special_bonus);

        // get jewelry bonus for name match damage
        let critical_hit_jewelry_bonus = self
            .equipment
            .ring
            .critical_hit_bonus_damage(combat_results.critical_hit_bonus);

        // add jewelry bonus damage to combat results
        combat_results.total_damage += name_match_jewelry_bonus + critical_hit_jewelry_bonus;

        // return result
        combat_results
    }

    /// @notice Defend against a beast attack
    /// @param self: Adventurer to defend against a beast attack
    /// @param beast: Beast to defend against
    /// @param armor: Armor item the adventurer is using
    /// @param armor_specials: Special attributes associated with the armor
    /// @param crit_hit_rnd: A u32 random value used to determine if attack is crit hit
    /// @param is_ambush: Whether the attack is an ambush
    /// @return A tuple containing the combat result and jewelry armor bonus
    fn defend(
        self: Adventurer,
        beast: Beast,
        armor: Item,
        armor_specials: SpecialPowers,
        armor_details: Loot,
        crit_hit_rnd: u8,
        critical_hit_chance: u8,
    ) -> (CombatResult, u16) {
        // adventurer strength isn't used for defense
        let attacker_strength = 0;
        let beast_strength = 0;

        // get combat spec for armor
        let armor_combat_spec = CombatSpec {
            tier: armor_details.tier,
            item_type: armor_details.item_type,
            level: armor.get_greatness().into(),
            specials: armor_specials,
        };

        // calculate damage
        let mut combat_result = ImplCombat::calculate_damage(
            beast.combat_spec,
            armor_combat_spec,
            MINIMUM_DAMAGE_FROM_BEASTS,
            attacker_strength,
            beast_strength,
            critical_hit_chance,
            crit_hit_rnd,
        );

        // get jewelry armor bonus
        let jewelry_armor_bonus = self
            .equipment
            .neck
            .jewelry_armor_bonus(armor_details.item_type, combat_result.base_armor);

        // adjust combat result for jewelry armor bonus
        if combat_result.total_damage > (jewelry_armor_bonus + MINIMUM_DAMAGE_FROM_BEASTS.into()) {
            combat_result.total_damage -= jewelry_armor_bonus;
        } else {
            combat_result.total_damage = MINIMUM_DAMAGE_FROM_BEASTS.into();
        }

        // return combat_result and jewelry_armor_bonus
        (combat_result, jewelry_armor_bonus)
    }

    /// @notice Get a random obstacle based on adventurer's level and two seeds.
    /// @param adventurer_level The level of the adventurer.
    /// @param id_seed A random value used to determine the obstacle id.
    /// @param level_seed A random value used to determine the obstacle level.
    /// @return The generated obstacle.
    fn get_random_obstacle(adventurer_level: u8, id_seed: u32, level_seed: u16) -> Obstacle {
        let id = ImplObstacle::get_random_id(id_seed);
        let level = ImplCombat::get_random_level(adventurer_level, level_seed);

        // TODO: Add support for obstacle specials
        let specials = SpecialPowers { special1: 0, special2: 0, special3: 0 };
        let combat_spec = CombatSpec {
            tier: ImplObstacle::get_tier(id), item_type: ImplObstacle::get_type(id), level, specials,
        };

        Obstacle { id, combat_spec }
    }

    /// @notice Calculate damage from an obstacle on an adventurer
    /// @param self The adventurer.
    /// @param obstacle The obstacle the adventurer is encountering.
    /// @param armor The armor item the obstacle hits.
    /// @param critical_hit_rnd A u8 random value used to determine if attack is a critical hit
    /// @return A tuple containing the combat result and jewelry armor bonus.
    fn get_obstacle_damage(
        self: Adventurer, obstacle: Obstacle, armor: Item, armor_details: Loot, critical_hit_rnd: u8,
    ) -> (CombatResult, u16) {
        // adventurer strength isn't used for obstacle encounters
        let attacker_strength = 0;
        let beast_strength = 0;

        // get combat spec for armor, no need to fetch armor specials since they don't apply to
        // obstacles
        let armor_combat_spec = CombatSpec {
            tier: armor_details.tier,
            item_type: armor_details.item_type,
            level: armor.get_greatness().into(),
            specials: SpecialPowers { special1: 0, special2: 0, special3: 0 },
        };

        let critical_hit_chance = Self::get_dynamic_critical_hit_chance(self.get_level());

        // calculate damage
        let mut combat_result = ImplCombat::calculate_damage(
            obstacle.combat_spec,
            armor_combat_spec,
            MINIMUM_DAMAGE_FROM_OBSTACLES,
            attacker_strength,
            beast_strength,
            critical_hit_chance,
            critical_hit_rnd,
        );

        // get jewelry armor bonus
        let jewelry_armor_bonus = self
            .equipment
            .neck
            .jewelry_armor_bonus(armor_details.item_type, combat_result.base_armor);

        // jewelry armor bonus
        if combat_result.total_damage > (jewelry_armor_bonus + MINIMUM_DAMAGE_FROM_OBSTACLES.into()) {
            combat_result.total_damage -= jewelry_armor_bonus;
        } else {
            combat_result.total_damage = MINIMUM_DAMAGE_FROM_OBSTACLES.into();
        }

        // return combat_result and jewelry_armor_bonus
        (combat_result, jewelry_armor_bonus)
    }

    /// @notice Get the dynamic critical hit chance for an adventurer
    /// @param level: The level of the adventurer
    /// @return The dynamic critical hit chance
    fn get_dynamic_critical_hit_chance(level: u8) -> u8 {
        let chance = level * CRITICAL_HIT_LEVEL_MULTIPLIER;
        if (chance > 100) {
            100
        } else {
            chance
        }
    }

    /// @title Jewelry Armor Bonus Calculation
    /// @notice Calculate the bonus provided by a jewelry item to a particular armor type.
    ///
    /// @dev The function uses a matching system to determine if a particular jewelry item
    /// (like an amulet, pendant, or necklace) provides a bonus to a given armor type.
    /// The bonus is computed by multiplying the base armor value with the greatness of
    /// the jewelry and a constant bonus factor.
    ///
    /// @param self The jewelry item under consideration.
    /// @param armor_type The type of armor to which the jewelry may or may not provide a bonus.
    /// @param base_armor The base armor value to which the bonus would be applied if applicable.
    ///
    /// @return The bonus armor value provided by the jewelry to the armor. Returns 0 if no bonus.
    fn jewelry_armor_bonus(self: Item, armor_type: Type, base_armor: u16) -> u16 {
        // qualify no bonus outcomes and return 0
        match armor_type {
            Type::None(()) => { return 0; },
            Type::Magic_or_Cloth(()) => { if (self.id != ItemId::Amulet) {
                return 0;
            } },
            Type::Blade_or_Hide(()) => { if (self.id != ItemId::Pendant) {
                return 0;
            } },
            Type::Bludgeon_or_Metal(()) => { if (self.id != ItemId::Necklace) {
                return 0;
            } },
            Type::Necklace(()) => { return 0; },
            Type::Ring(()) => { return 0; },
        }

        // if execution reaches here, the necklace provides a bonus for the armor type
        base_armor * (self.get_greatness() * NECKLACE_ARMOR_BONUS).into() / 100
    }

    /// @notice Get the maximum health for an adventurer
    /// @param self: The stats of the adventurer
    /// @return The maximum health for the adventurer
    fn get_max_health(self: Stats) -> u16 {
        let vitality_health_boost = self.vitality.into() * HEALTH_INCREASE_PER_VITALITY.into();
        let new_max_health = STARTING_HEALTH.into() + vitality_health_boost;

        if (new_max_health > MAX_ADVENTURER_HEALTH) {
            MAX_ADVENTURER_HEALTH
        } else {
            new_max_health
        }
    }

    /// @notice Apply the vitality health boost to the adventurer
    /// @param self: The adventurer
    /// @param vitality: The vitality of the adventurer

    fn apply_vitality_health_boost(ref self: Adventurer, vitality: u8) {
        self.increase_health(VITALITY_INSTANT_HEALTH_BONUS.into() * vitality.into());
    }

    /// @notice Increment the battle action count
    /// @param count: The current count
    /// @return The incremented count

    fn increment_battle_action_count(count: u16) -> u16 {
        let (result, overflow) = count.overflowing_add(1);
        if (!overflow) {
            result
        } else {
            0
        }
    }

    /// @notice Increment the action count
    /// @param self: The adventurer

    fn increment_action_count(ref self: Adventurer) {
        let (result, overflow) = self.action_count.overflowing_add(1);
        if (!overflow) {
            self.action_count = result;
        } else {
            self.action_count = 0;
        }
    }

    /// @title get_random_explore
    /// @notice gets random explore based on provided entropy
    /// @param seed: the seed used to generate a random explore
    /// @return ExploreResult: a random explore enum with the result
    fn get_random_explore(seed: u8) -> ExploreResult {
        let result = seed % 3;
        if (result == 0) {
            ExploreResult::Beast
        } else if (result == 1) {
            ExploreResult::Obstacle
        } else {
            ExploreResult::Discovery
        }
    }

    /// @title get_attack_location
    /// @notice determines a random attack location based on the provided entropy
    /// @param seed: the seed used to generate a random attack location
    /// @return Slot: a Slot type which represents the randomly determined attack location
    fn get_attack_location(seed: u8) -> Slot {
        let slot = seed % 5;
        if (slot == 0) {
            Slot::Chest
        } else if (slot == 1) {
            Slot::Head
        } else if (slot == 2) {
            Slot::Waist
        } else if (slot == 3) {
            Slot::Foot
        } else if (slot == 4) {
            Slot::Hand
        } else {
            panic_with_felt252('slot out of range')
        }
    }

    /// @notice Gets the vitality boost from an item suffix
    /// @param suffix: suffix of item
    /// @return u8: vitality boost

    fn get_vitality_item_boost(suffix: u8) -> u8 {
        if (suffix == of_Power) {
            0
        } else if (suffix == of_Giant) {
            3
        } else if (suffix == of_Titans) {
            0
        } else if (suffix == of_Skill) {
            0
        } else if (suffix == of_Perfection) {
            1
        } else if (suffix == of_Brilliance) {
            0
        } else if (suffix == of_Enlightenment) {
            0
        } else if (suffix == of_Protection) {
            2
        } else if (suffix == of_Anger) {
            0
        } else if (suffix == of_Rage) {
            0
        } else if (suffix == of_Fury) {
            1
        } else if (suffix == of_Vitriol) {
            0
        } else if (suffix == of_the_Fox) {
            0
        } else if (suffix == of_Detection) {
            0
        } else if (suffix == of_Reflection) {
            0
        } else if (suffix == of_the_Twins) {
            0
        } else {
            0
        }
    }


    /// @title get_battle_randomness
    /// @notice gets randomness for adventurer for use during battles
    /// @param xp: adventurer xp
    /// @param action_count: adventurer action count
    /// @param seed: seed
    /// @return (u8, u8, u8, u8): tuple of randomness
    fn get_battle_randomness(xp: u16, action_count: u16, seed: u64) -> (u8, u8, u8, u8) {
        let mut hash_span = ArrayTrait::<felt252>::new();
        hash_span.append(xp.into());
        hash_span.append(seed.into());
        hash_span.append(action_count.into());
        let poseidon = poseidon_hash_span(hash_span.span());
        let rnd1_u64 = Self::felt_to_u32(poseidon);
        Self::u32_to_u8s(rnd1_u64)
    }

    /// @title get_randomness
    /// @notice gets randomness for adventurer for use in other places
    /// @param adventurer_xp: adventurer xp
    /// @param seed: seed
    /// @return (u32, u32, u16, u16, u8, u8, u8, u8): tuple of randomness
    fn get_randomness(adventurer_xp: u16, seed: u64) -> (u32, u32, u16, u16, u8, u8, u8, u8) {
        let mut hash_span = ArrayTrait::<felt252>::new();
        hash_span.append(adventurer_xp.into());
        hash_span.append(seed.into());
        let poseidon = poseidon_hash_span(hash_span.span());
        let (rnd1_u64, rnd2_u64) = Self::felt_to_two_u64(poseidon);
        let (rnd1_u32, rnd2_u32, rnd3_u32, rnd4_u32) = Self::split_two_u64(rnd1_u64, rnd2_u64);
        let (rnd1_u16, rnd2_u16, rnd3_u16, rnd4_u16) = Self::split_u32s(rnd3_u32, rnd4_u32);
        let (rnd1_u8, rnd2_u8, rnd3_u8, rnd4_u8) = Self::split_u16s(rnd3_u16, rnd4_u16);
        (rnd1_u32, rnd2_u32, rnd1_u16, rnd2_u16, rnd1_u8, rnd2_u8, rnd3_u8, rnd4_u8)
    }

    /// @notice Converts a felt252 to two u64s
    /// @param value: The felt252 value to convert
    /// @return (u64, u64): The two u64s
    fn felt_to_two_u64(value: felt252) -> (u64, u64) {
        let to_u256: u256 = value.try_into().unwrap();
        let (d, r) = DivRem::div_rem(to_u256.low, TWO_POW_64_NZ);
        (d.try_into().unwrap(), r.try_into().unwrap())
    }

    /// @notice Converts a felt252 to a u32
    /// @param value: The felt252 value to convert
    /// @return u32: The u32 value
    fn felt_to_u32(value: felt252) -> u32 {
        let value_u256: u256 = value.into();
        (value_u256 % TWO_POW_32.into()).try_into().unwrap()
    }

    /// @notice Splits a u64 into two u32s
    /// @param value1: The first u64 value
    /// @param value2: The second u64 value
    /// @return (u32, u32, u32, u32): The four u32 values
    fn split_two_u64(value1: u64, value2: u64) -> (u32, u32, u32, u32) {
        let (d1, r1) = DivRem::div_rem(value1, TWO_POW_32_NZ);
        let (d2, r2) = DivRem::div_rem(value2, TWO_POW_32_NZ);
        (d1.try_into().unwrap(), r1.try_into().unwrap(), d2.try_into().unwrap(), r2.try_into().unwrap())
    }

    /// @notice Converts a u32 to four u8s
    /// @param value: The u32 value to convert
    /// @return (u8, u8, u8, u8): The four u8 values
    fn u32_to_u8s(value: u32) -> (u8, u8, u8, u8) {
        let (rnd1_u16, rnd2_u16) = DivRem::div_rem(value, TWO_POW_16_NZ);
        let (rnd1_u8, rnd2_u8) = DivRem::div_rem(rnd1_u16.try_into().unwrap(), TWO_POW_8_NZ_U16);
        let (rnd3_u8, rnd4_u8) = DivRem::div_rem(rnd2_u16.try_into().unwrap(), TWO_POW_8_NZ_U16);
        (
            rnd1_u8.try_into().unwrap(),
            rnd2_u8.try_into().unwrap(),
            rnd3_u8.try_into().unwrap(),
            rnd4_u8.try_into().unwrap(),
        )
    }

    /// @notice Splits a u32 into four u16s
    /// @param value1: The first u32 value
    /// @param value2: The second u32 value
    /// @return (u16, u16, u16, u16): The four u16 values
    fn split_u32s(value1: u32, value2: u32) -> (u16, u16, u16, u16) {
        let (d1, r1) = DivRem::div_rem(value1, TWO_POW_16_NZ);
        let (d2, r2) = DivRem::div_rem(value2, TWO_POW_16_NZ);
        (d1.try_into().unwrap(), r1.try_into().unwrap(), d2.try_into().unwrap(), r2.try_into().unwrap())
    }

    /// @notice Splits a u16 into four u8s
    /// @param value1: The first u16 value
    /// @param value2: The second u16 value
    /// @return (u8, u8, u8, u8): The four u8 values
    fn split_u16s(value1: u16, value2: u16) -> (u8, u8, u8, u8) {
        let (d1, r1) = DivRem::div_rem(value1, TWO_POW_8_NZ_U16);
        let (d2, r2) = DivRem::div_rem(value2, TWO_POW_8_NZ_U16);
        (d1.try_into().unwrap(), r1.try_into().unwrap(), d2.try_into().unwrap(), r2.try_into().unwrap())
    }

    /// @notice Gets simple entropy for adventurer
    /// @param adventurer_xp: adventurer xp
    /// @param seed: seed
    /// @return felt252: poseidon hash based on xp and adventurer id
    fn get_simple_entropy(adventurer_xp: u16, seed: u64) -> felt252 {
        let mut hash_span = ArrayTrait::<felt252>::new();
        hash_span.append(adventurer_xp.into());
        hash_span.append(seed.into());
        poseidon_hash_span(hash_span.span()).into()
    }


    fn apply_health_boost_from_vitality_unlock(ref self: Adventurer, item_specials: SpecialPowers) {
        // get the vitality boost for the special
        let vit_boost = Self::get_vitality_item_boost(item_specials.special1);
        // if the special provides a vitality boost
        if (vit_boost != 0) {
            // adventurer gains health
            let health_amount = vit_boost.into() * VITALITY_INSTANT_HEALTH_BONUS.into();
            self.increase_health(health_amount);
        }
    }
}

const TWO_POW_4_NZ: NonZero<u256> = 0x10;
const TWO_POW_8_NZ: NonZero<u256> = 0x100;
const TWO_POW_9_NZ: NonZero<u256> = 0x200;
const TWO_POW_10: u256 = 0x400;
const TWO_POW_10_NZ: NonZero<u256> = 0x400;
const TWO_POW_15_NZ: NonZero<u256> = 0x8000;
const TWO_POW_16_NZ_U256: NonZero<u256> = 0x10000;
const TWO_POW_25: u256 = 0x2000000;
const TWO_POW_30_NZ: NonZero<u256> = 0x40000000;
const TWO_POW_34: u256 = 0x400000000;
const TWO_POW_44: u256 = 0x100000000000;
const TWO_POW_48: u256 = 0x1000000000000;
const TWO_POW_78: u256 = 0x40000000000000000000;
const TWO_POW_206: u256 = 0x4000000000000000000000000000000000000000000000000000;
const TWO_POW_222: u256 = 0x40000000000000000000000000000000000000000000000000000000;
const TWO_POW_128_NZ: NonZero<u256> = 0x100000000000000000000000000000000;
