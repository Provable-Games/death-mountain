// SPDX-License-Identifier: MIT

#[cfg(test)]
mod tests {
    use core::panic_with_felt252;
    use death_mountain::constants::adventurer::{
        BASE_POTION_PRICE, CHARISMA_ITEM_DISCOUNT, HEALTH_INCREASE_PER_VITALITY, ITEM_MAX_GREATNESS,
        JEWELRY_BONUS_NAME_MATCH_PERCENT_PER_GREATNESS, MAX_ADVENTURER_HEALTH, MAX_ADVENTURER_XP, MAX_GOLD,
        MAX_PACKABLE_ACTION_COUNT, MAX_PACKABLE_BEAST_HEALTH, MAX_PACKABLE_ITEM_SPECIALS_SEED,
        MAX_STAT_UPGRADES_AVAILABLE, MINIMUM_ITEM_PRICE, MINIMUM_POTION_PRICE, NECKLACE_ARMOR_BONUS,
        SILVER_RING_G20_LUCK_BONUS, SILVER_RING_LUCK_BONUS_PER_GREATNESS, STARTING_GOLD, STARTING_HEALTH,
    };
    use death_mountain::constants::beast::{BeastId, BeastSettings};
    use death_mountain::constants::combat::CombatEnums::{Slot, Type};
    use death_mountain::constants::discovery::DiscoveryEnums::{DiscoveryType, ExploreResult};
    use death_mountain::constants::loot::ItemSuffix::{of_Giant, of_Perfection, of_Power, of_Protection};
    use death_mountain::constants::loot::{ItemId, ItemSuffix};
    use death_mountain::models::adventurer::adventurer::{Adventurer, IAdventurer, ImplAdventurer};
    use death_mountain::models::adventurer::bag::{ImplBag};
    use death_mountain::models::adventurer::equipment::{Equipment, ImplEquipment};
    use death_mountain::models::adventurer::item::{Item, MAX_PACKABLE_XP};
    use death_mountain::models::adventurer::stats::{ImplStats, MAX_STAT_VALUE, Stats};
    use death_mountain::models::beast::{ImplBeast};
    use death_mountain::models::combat::SpecialPowers;
    use death_mountain::models::loot::{ImplLoot};
    use death_mountain::utils::loot::ItemUtils;

    #[test]
    #[available_gas(30020000)]
    fn adventurer_packing() {
        let weapon = Item { id: ItemId::Wand, xp: MAX_PACKABLE_XP };
        let chest = Item { id: ItemId::DivineRobe, xp: MAX_PACKABLE_XP };
        let head = Item { id: ItemId::DivineHood, xp: MAX_PACKABLE_XP };
        let waist = Item { id: ItemId::BrightsilkSash, xp: MAX_PACKABLE_XP };
        let foot = Item { id: ItemId::DivineSlippers, xp: MAX_PACKABLE_XP };
        let hand = Item { id: ItemId::DivineGloves, xp: MAX_PACKABLE_XP };
        let neck = Item { id: ItemId::Amulet, xp: MAX_PACKABLE_XP };
        let ring = Item { id: ItemId::GoldRing, xp: MAX_PACKABLE_XP };
        let equipment = Equipment { weapon, chest, head, waist, foot, hand, neck, ring };

        let strength = MAX_STAT_VALUE;
        let dexterity = MAX_STAT_VALUE;
        let vitality = MAX_STAT_VALUE;
        let intelligence = MAX_STAT_VALUE;
        let wisdom = MAX_STAT_VALUE;
        let charisma = MAX_STAT_VALUE;
        let luck = 0;
        let stats = Stats { strength, dexterity, vitality, intelligence, wisdom, charisma, luck };

        let adventurer = Adventurer {
            health: MAX_ADVENTURER_HEALTH,
            xp: MAX_ADVENTURER_XP,
            gold: MAX_GOLD,
            stats,
            equipment,
            beast_health: MAX_PACKABLE_BEAST_HEALTH,
            stat_upgrades_available: MAX_STAT_UPGRADES_AVAILABLE,
            action_count: MAX_PACKABLE_ACTION_COUNT,
            item_specials_seed: MAX_PACKABLE_ITEM_SPECIALS_SEED,
        };
        let packed = ImplAdventurer::pack(adventurer);
        let unpacked: Adventurer = ImplAdventurer::unpack(packed);
        assert(adventurer.health == unpacked.health, 'health');
        assert(adventurer.xp == unpacked.xp, 'xp');
        assert(adventurer.gold == unpacked.gold, 'luck');
        assert(adventurer.beast_health == unpacked.beast_health, 'wrong beast health');
        assert(adventurer.stat_upgrades_available == unpacked.stat_upgrades_available, 'stat_upgrades_available');
        assert(adventurer.stats == unpacked.stats, 'wrong unpacked stats');
        assert(adventurer.equipment == unpacked.equipment, 'equipment mistmatch');
        assert(adventurer.action_count == unpacked.action_count, 'action_count');
        assert(adventurer.item_specials_seed == unpacked.item_specials_seed, 'item_specials_seed');

        let adventurer = Adventurer {
            health: MAX_ADVENTURER_HEALTH,
            xp: MAX_ADVENTURER_XP,
            gold: MAX_GOLD,
            stats: Stats {
                strength: MAX_STAT_VALUE,
                dexterity: 0,
                vitality: MAX_STAT_VALUE,
                intelligence: 1,
                wisdom: MAX_STAT_VALUE,
                charisma: 2,
                luck: 0,
            },
            equipment: Equipment {
                weapon: Item { id: 127, xp: 511 },
                chest: Item { id: 1, xp: 0 },
                head: Item { id: 127, xp: 511 },
                waist: Item { id: 87, xp: 1 },
                foot: Item { id: 78, xp: 511 },
                hand: Item { id: 34, xp: 2 },
                neck: Item { id: 32, xp: 511 },
                ring: Item { id: 1, xp: 3 },
            },
            beast_health: MAX_PACKABLE_BEAST_HEALTH,
            stat_upgrades_available: MAX_STAT_UPGRADES_AVAILABLE,
            action_count: MAX_PACKABLE_ACTION_COUNT,
            item_specials_seed: MAX_PACKABLE_ITEM_SPECIALS_SEED,
        };
        let packed = ImplAdventurer::pack(adventurer);
        let unpacked: Adventurer = ImplAdventurer::unpack(packed);
        assert(adventurer.health == unpacked.health, 'health');
        assert(adventurer.xp == unpacked.xp, 'xp');
        assert(adventurer.stats.strength == unpacked.stats.strength, 'strength');
        assert(adventurer.stats.dexterity == unpacked.stats.dexterity, 'dexterity');
        assert(adventurer.stats.vitality == unpacked.stats.vitality, 'vitality');
        assert(adventurer.stats.intelligence == unpacked.stats.intelligence, 'intelligence');
        assert(adventurer.stats.wisdom == unpacked.stats.wisdom, 'wisdom');
        assert(adventurer.stats.charisma == unpacked.stats.charisma, 'charisma');
        assert(adventurer.gold == unpacked.gold, 'luck');
        assert(adventurer.equipment.weapon.id == unpacked.equipment.weapon.id, 'weapon.id');
        assert(adventurer.equipment.weapon.xp == unpacked.equipment.weapon.xp, 'weapon.xp');
        assert(adventurer.equipment.chest.id == unpacked.equipment.chest.id, 'chest.id');
        assert(adventurer.equipment.chest.xp == unpacked.equipment.chest.xp, 'chest.xp');
        assert(adventurer.equipment.head.id == unpacked.equipment.head.id, 'head.id');
        assert(adventurer.equipment.head.xp == unpacked.equipment.head.xp, 'head.xp');
        assert(adventurer.equipment.waist.id == unpacked.equipment.waist.id, 'waist.id');
        assert(adventurer.equipment.waist.xp == unpacked.equipment.waist.xp, 'waist.xp');
        assert(adventurer.equipment.foot.id == unpacked.equipment.foot.id, 'foot.id');
        assert(adventurer.equipment.foot.xp == unpacked.equipment.foot.xp, 'foot.xp');
        assert(adventurer.equipment.hand.id == unpacked.equipment.hand.id, 'hand.id');
        assert(adventurer.equipment.hand.xp == unpacked.equipment.hand.xp, 'hand.xp2');
        assert(adventurer.equipment.neck.id == unpacked.equipment.neck.id, 'neck.id');
        assert(adventurer.equipment.neck.xp == unpacked.equipment.neck.xp, 'neck.xp');
        assert(adventurer.equipment.ring.id == unpacked.equipment.ring.id, 'ring.id');
        assert(adventurer.equipment.ring.xp == unpacked.equipment.ring.xp, 'ring.xp');
        //assert(adventurer.beast_health == unpacked.beast_health, 'beast_health');
        assert(adventurer.stat_upgrades_available == unpacked.stat_upgrades_available, 'stat_upgrades_available');
    }

    #[test]
    #[available_gas(1914024)]
    fn jewelry_gold_bonus() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let base_gold_amount = 100;

        // no gold ring equipped gets no bonus
        assert(adventurer.equipment.ring.jewelry_gold_bonus(base_gold_amount) == 0, 'no bonus with gold gold ring');

        // equip gold ring with G1
        let gold_ring = Item { id: ItemId::GoldRing, xp: 1 };
        adventurer.equipment.ring = gold_ring;
        let _bonus = adventurer.equipment.ring.jewelry_gold_bonus(base_gold_amount);
        assert(adventurer.equipment.ring.jewelry_gold_bonus(base_gold_amount) == 3, 'bonus should be 3');

        // increase greatness of gold ring to 10
        adventurer.equipment.ring.xp = 100;
        assert(adventurer.equipment.ring.jewelry_gold_bonus(base_gold_amount) == 30, 'bonus should be 30');

        // increase greatness of gold ring to 20
        adventurer.equipment.ring.xp = 400;
        assert(adventurer.equipment.ring.jewelry_gold_bonus(base_gold_amount) == 60, 'bonus should be 60');

        // zero case
        assert(adventurer.equipment.ring.jewelry_gold_bonus(0) == 0, 'bonus should be 0');

        // change to platinum ring
        let platinum_ring = Item { id: ItemId::PlatinumRing, xp: 1 };
        adventurer.equipment.ring = platinum_ring;
        assert(adventurer.equipment.ring.jewelry_gold_bonus(0) == 0, 'no bonus with plat ring');
    }

    #[test]
    #[available_gas(194024)]
    fn get_bonus_luck() {
        // equip silver ring
        let mut silver_ring = Item { id: ItemId::SilverRing, xp: 1 };
        assert(silver_ring.jewelry_bonus_luck() == SILVER_RING_LUCK_BONUS_PER_GREATNESS, 'wrong g1 bonus luck');

        // increase greatness to 20
        silver_ring.xp = 400;
        assert(silver_ring.jewelry_bonus_luck() == SILVER_RING_LUCK_BONUS_PER_GREATNESS * 20, 'wrong g20 bonus luck');

        // verify none of the other rings provide a luck bonus
        let gold_ring = Item { id: ItemId::GoldRing, xp: 400 };
        let bronze_ring = Item { id: ItemId::BronzeRing, xp: 400 };
        let platinum_ring = Item { id: ItemId::PlatinumRing, xp: 400 };
        let titanium_ring = Item { id: ItemId::TitaniumRing, xp: 400 };

        assert(gold_ring.jewelry_bonus_luck() == 0, 'no bonus luck for gold ring');
        assert(bronze_ring.jewelry_bonus_luck() == 0, 'no bonus luck for bronze ring');
        assert(platinum_ring.jewelry_bonus_luck() == 0, 'no bonus luck for platinum ring');
        assert(titanium_ring.jewelry_bonus_luck() == 0, 'no bonus luck for titanium ring');
    }

    #[test]
    #[available_gas(44860)]
    fn unlocked_specials() {
        let previous_level = 0;
        let new_level = 0;
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);
        assert(!suffix_unlocked, 'suffix should not be unlocked');
        assert(!prefixes_unlocked, 'prefixes should not be unlocked');

        let previous_level = 0;
        let new_level = 1;
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);
        assert(!suffix_unlocked, 'suffix should not be unlocked');
        assert(!prefixes_unlocked, 'prefixes should not be unlocked');

        let previous_level = 1;
        let new_level = 14;
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);
        assert(!suffix_unlocked, 'suffix should not be unlocked');
        assert(!prefixes_unlocked, 'prefixes should not be unlocked');

        let previous_level = 14;
        let new_level = 15;
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);
        assert(suffix_unlocked, 'suffix should be unlocked');
        assert(!prefixes_unlocked, 'prefixes should not be unlocked');

        let previous_level = 15;
        let new_level = 18;
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);
        assert(!suffix_unlocked, 'suffix should not be unlocked');
        assert(!prefixes_unlocked, 'prefixes should not be unlocked');

        let previous_level = 18;
        let new_level = 19;
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);
        assert(!suffix_unlocked, 'suffix should not be unlocked');
        assert(prefixes_unlocked, 'prefixes should be unlocked');

        let previous_level = 19;
        let new_level = 20;
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);
        assert(!suffix_unlocked, 'suffix should not be unlocked');
        assert(!prefixes_unlocked, 'prefixes should not be unlocked');

        let previous_level = 14;
        let new_level = 19;
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);
        assert(suffix_unlocked, 'suffix should be unlocked');
        assert(prefixes_unlocked, 'prefixes should be unlocked');
    }

    #[test]
    #[available_gas(284000)]
    fn jewelry_armor_bonus() {
        // amulet test cases
        let amulet = Item { id: ItemId::Amulet, xp: 400 };
        assert(amulet.jewelry_armor_bonus(Type::None(()), 100) == 0, 'None Type gets 0 bonus');
        assert(
            amulet.jewelry_armor_bonus(Type::Magic_or_Cloth(()), 100) == NECKLACE_ARMOR_BONUS.into() * 20,
            'Amulet provide cloth bonus',
        );
        assert(amulet.jewelry_armor_bonus(Type::Blade_or_Hide(()), 100) == 0, 'Amulet does not boost hide');
        assert(amulet.jewelry_armor_bonus(Type::Bludgeon_or_Metal(()), 100) == 0, 'Amulet does not boost metal');
        assert(amulet.jewelry_armor_bonus(Type::Necklace(()), 100) == 0, 'Necklace Type gets 0 bonus');
        assert(amulet.jewelry_armor_bonus(Type::Ring(()), 100) == 0, 'Ring Type gets 0 bonus');

        // pendant test cases
        let pendant = Item { id: ItemId::Pendant, xp: 400 };
        assert(pendant.jewelry_armor_bonus(Type::None(()), 100) == 0, 'None Type gets 0 bonus');
        assert(pendant.jewelry_armor_bonus(Type::Magic_or_Cloth(()), 100) == 0, 'Pendant does not boost cloth');
        assert(
            pendant.jewelry_armor_bonus(Type::Blade_or_Hide(()), 100) == NECKLACE_ARMOR_BONUS.into() * 20,
            'Pendant boosts hide',
        );
        assert(pendant.jewelry_armor_bonus(Type::Bludgeon_or_Metal(()), 100) == 0, 'Pendant does not boost metal');
        assert(pendant.jewelry_armor_bonus(Type::Necklace(()), 100) == 0, 'Necklace Type gets 0 bonus');
        assert(pendant.jewelry_armor_bonus(Type::Ring(()), 100) == 0, 'Ring Type gets 0 bonus');

        // necklace test cases
        let necklace = Item { id: ItemId::Necklace, xp: 400 };
        assert(necklace.jewelry_armor_bonus(Type::None(()), 100) == 0, 'None Type gets 0 bonus');
        assert(necklace.jewelry_armor_bonus(Type::Magic_or_Cloth(()), 100) == 0, 'Necklace does not boost cloth');
        assert(necklace.jewelry_armor_bonus(Type::Blade_or_Hide(()), 100) == 0, 'Necklace does not boost hide');
        assert(
            necklace.jewelry_armor_bonus(Type::Bludgeon_or_Metal(()), 100) == NECKLACE_ARMOR_BONUS.into() * 20,
            'Necklace boosts metal',
        );
        assert(necklace.jewelry_armor_bonus(Type::Necklace(()), 100) == 0, 'Necklace Type gets 0 bonus');
        assert(necklace.jewelry_armor_bonus(Type::Ring(()), 100) == 0, 'Ring Type gets 0 bonus');

        // test non jewelry item
        let katana = Item { id: ItemId::Katana, xp: 400 };
        assert(katana.jewelry_armor_bonus(Type::None(()), 100) == 0, 'Katan does not boost armor');
    }

    #[test]
    #[available_gas(60180)]
    fn name_match_bonus_damage() {
        let base_damage = 100;

        let titanium_ring = Item { id: ItemId::TitaniumRing, xp: 400 };
        assert(titanium_ring.name_match_bonus_damage(base_damage) == 0, 'no bonus for titanium ring');

        let platinum_ring = Item { id: ItemId::PlatinumRing, xp: 0 };
        assert(
            platinum_ring.name_match_bonus_damage(base_damage) == JEWELRY_BONUS_NAME_MATCH_PERCENT_PER_GREATNESS.into(),
            'should be 3hp name bonus',
        );

        let platinum_ring = Item { id: ItemId::PlatinumRing, xp: 100 };
        assert(
            platinum_ring
                .name_match_bonus_damage(base_damage) == (JEWELRY_BONUS_NAME_MATCH_PERCENT_PER_GREATNESS * 10)
                .into(),
            'should be 30hp name bonus',
        );

        let platinum_ring = Item { id: ItemId::PlatinumRing, xp: 400 };
        assert(
            platinum_ring
                .name_match_bonus_damage(base_damage) == (JEWELRY_BONUS_NAME_MATCH_PERCENT_PER_GREATNESS * 20)
                .into(),
            'should be 60hp name bonus',
        );
    }

    #[test]
    fn get_beast() {
        let beast = ImplBeast::get_beast(1, ImplLoot::get_type(12), 1, 1, 1, 1, 1);
        assert(beast.combat_spec.level == 1, 'beast should be lvl1');
        assert(beast.combat_spec.specials.special1 == 0, 'beast should have no special1');
        assert(beast.combat_spec.specials.special2 == 0, 'beast should have no special2');
        assert(beast.combat_spec.specials.special3 == 0, 'beast should have no special3');

        let beast = ImplBeast::get_beast(1, ImplLoot::get_type(12), 1, 1, 1, 1, 1);
        assert(beast.combat_spec.level == 1, 'beast should be lvl1');
        assert(beast.combat_spec.specials.special1 == 0, 'beast should have no special1');
        assert(beast.combat_spec.specials.special2 == 0, 'beast should have no special2');
        assert(beast.combat_spec.specials.special3 == 0, 'beast should have no special3');
    }

    #[test]
    #[available_gas(999999999999999999)]
    fn get_beast_distribution_fixed_entropy() {
        let mut warlock_count: u32 = 0;
        let mut typhon_count: u32 = 0;
        let mut jiangshi_count: u32 = 0;
        let mut anansi_count: u32 = 0;
        let mut basilisk_count: u32 = 0;
        let mut gorgon_count: u32 = 0;
        let mut kitsune_count: u32 = 0;
        let mut lich_count: u32 = 0;
        let mut chimera_count: u32 = 0;
        let mut wendigo_count: u32 = 0;
        let mut raksasa_count: u32 = 0;
        let mut werewolf_count: u32 = 0;
        let mut banshee_count: u32 = 0;
        let mut draugr_count: u32 = 0;
        let mut vampire_count: u32 = 0;
        let mut goblin_count: u32 = 0;
        let mut ghoul_count: u32 = 0;
        let mut wraith_count: u32 = 0;
        let mut sprite_count: u32 = 0;
        let mut kappa_count: u32 = 0;
        let mut fairy_count: u32 = 0;
        let mut leprechaun_count: u32 = 0;
        let mut kelpie_count: u32 = 0;
        let mut pixie_count: u32 = 0;
        let mut gnome_count: u32 = 0;
        let mut griffin_count: u32 = 0;
        let mut manticore_count: u32 = 0;
        let mut phoenix_count: u32 = 0;
        let mut dragon_count: u32 = 0;
        let mut minotaur_count: u32 = 0;
        let mut qilin_count: u32 = 0;
        let mut ammit_count: u32 = 0;
        let mut nue_count: u32 = 0;
        let mut skinwalker_count: u32 = 0;
        let mut chupacabra_count: u32 = 0;
        let mut weretiger_count: u32 = 0;
        let mut wyvern_count: u32 = 0;
        let mut roc_count: u32 = 0;
        let mut harpy_count: u32 = 0;
        let mut pegasus_count: u32 = 0;
        let mut hippogriff_count: u32 = 0;
        let mut fenrir_count: u32 = 0;
        let mut jaguar_count: u32 = 0;
        let mut satori_count: u32 = 0;
        let mut direwolf_count: u32 = 0;
        let mut bear_count: u32 = 0;
        let mut wolf_count: u32 = 0;
        let mut mantis_count: u32 = 0;
        let mut spider_count: u32 = 0;
        let mut rat_count: u32 = 0;
        let mut kraken_count: u32 = 0;
        let mut colossus_count: u32 = 0;
        let mut balrog_count: u32 = 0;
        let mut leviathan_count: u32 = 0;
        let mut tarrasque_count: u32 = 0;
        let mut titan_count: u32 = 0;
        let mut nephilim_count: u32 = 0;
        let mut behemoth_count: u32 = 0;
        let mut hydra_count: u32 = 0;
        let mut juggernaut_count: u32 = 0;
        let mut oni_count: u32 = 0;
        let mut jotunn_count: u32 = 0;
        let mut ettin_count: u32 = 0;
        let mut cyclops_count: u32 = 0;
        let mut giant_count: u32 = 0;
        let mut nemean_lion_count: u32 = 0;
        let mut berserker_count: u32 = 0;
        let mut yeti_count: u32 = 0;
        let mut golem_count: u32 = 0;
        let mut ent_count: u32 = 0;
        let mut troll_count: u32 = 0;
        let mut bigfoot_count: u32 = 0;
        let mut ogre_count: u32 = 0;
        let mut orc_count: u32 = 0;
        let mut skeleton_count: u32 = 0;

        let mut total_beasts = 0;

        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let mut xp = 1;

        let level_seed: u64 = 123456789;
        loop {
            if xp == 2000 {
                break;
            }

            adventurer.xp = xp;

            let (
                beast_seed,
                _,
                beast_health_rnd,
                beast_level_rnd,
                beast_specials1_rnd,
                beast_specials2_rnd,
                _,
                explore_rnd,
            ) =
                ImplAdventurer::get_randomness(
                adventurer.xp, level_seed,
            );
            match ImplAdventurer::get_random_explore(explore_rnd) {
                ExploreResult::Beast(()) => {
                    total_beasts += 1;
                    // generate randomness for beast
                    let beast = ImplBeast::get_beast(
                        adventurer.get_level(),
                        ImplLoot::get_type(adventurer.equipment.weapon.id),
                        beast_seed,
                        beast_health_rnd,
                        beast_level_rnd,
                        beast_specials1_rnd,
                        beast_specials2_rnd,
                    );

                    if beast.id == BeastId::Warlock {
                        warlock_count += 1;
                    } else if beast.id == BeastId::Typhon {
                        typhon_count += 1;
                    } else if beast.id == BeastId::Jiangshi {
                        jiangshi_count += 1;
                    } else if beast.id == BeastId::Anansi {
                        anansi_count += 1;
                    } else if beast.id == BeastId::Basilisk {
                        basilisk_count += 1;
                    } else if beast.id == BeastId::Gorgon {
                        gorgon_count += 1;
                    } else if beast.id == BeastId::Kitsune {
                        kitsune_count += 1;
                    } else if beast.id == BeastId::Lich {
                        lich_count += 1;
                    } else if beast.id == BeastId::Chimera {
                        chimera_count += 1;
                    } else if beast.id == BeastId::Wendigo {
                        wendigo_count += 1;
                    } else if beast.id == BeastId::Rakshasa {
                        raksasa_count += 1;
                    } else if beast.id == BeastId::Werewolf {
                        werewolf_count += 1;
                    } else if beast.id == BeastId::Banshee {
                        banshee_count += 1;
                    } else if beast.id == BeastId::Draugr {
                        draugr_count += 1;
                    } else if beast.id == BeastId::Vampire {
                        vampire_count += 1;
                    } else if beast.id == BeastId::Goblin {
                        goblin_count += 1;
                    } else if beast.id == BeastId::Ghoul {
                        ghoul_count += 1;
                    } else if beast.id == BeastId::Wraith {
                        wraith_count += 1;
                    } else if beast.id == BeastId::Sprite {
                        sprite_count += 1;
                    } else if beast.id == BeastId::Kappa {
                        kappa_count += 1;
                    } else if beast.id == BeastId::Fairy {
                        fairy_count += 1;
                    } else if beast.id == BeastId::Leprechaun {
                        leprechaun_count += 1;
                    } else if beast.id == BeastId::Kelpie {
                        kelpie_count += 1;
                    } else if beast.id == BeastId::Pixie {
                        pixie_count += 1;
                    } else if beast.id == BeastId::Gnome {
                        gnome_count += 1;
                    } else if beast.id == BeastId::Griffin {
                        griffin_count += 1;
                    } else if beast.id == BeastId::Manticore {
                        manticore_count += 1;
                    } else if beast.id == BeastId::Phoenix {
                        phoenix_count += 1;
                    } else if beast.id == BeastId::Dragon {
                        dragon_count += 1;
                    } else if beast.id == BeastId::Minotaur {
                        minotaur_count += 1;
                    } else if beast.id == BeastId::Qilin {
                        qilin_count += 1;
                    } else if beast.id == BeastId::Ammit {
                        ammit_count += 1;
                    } else if beast.id == BeastId::Nue {
                        nue_count += 1;
                    } else if beast.id == BeastId::Skinwalker {
                        skinwalker_count += 1;
                    } else if beast.id == BeastId::Chupacabra {
                        chupacabra_count += 1;
                    } else if beast.id == BeastId::Weretiger {
                        weretiger_count += 1;
                    } else if beast.id == BeastId::Wyvern {
                        wyvern_count += 1;
                    } else if beast.id == BeastId::Roc {
                        roc_count += 1;
                    } else if beast.id == BeastId::Harpy {
                        harpy_count += 1;
                    } else if beast.id == BeastId::Pegasus {
                        pegasus_count += 1;
                    } else if beast.id == BeastId::Hippogriff {
                        hippogriff_count += 1;
                    } else if beast.id == BeastId::Fenrir {
                        fenrir_count += 1;
                    } else if beast.id == BeastId::Jaguar {
                        jaguar_count += 1;
                    } else if beast.id == BeastId::Satori {
                        satori_count += 1;
                    } else if beast.id == BeastId::DireWolf {
                        direwolf_count += 1;
                    } else if beast.id == BeastId::Bear {
                        bear_count += 1;
                    } else if beast.id == BeastId::Wolf {
                        wolf_count += 1;
                    } else if beast.id == BeastId::Mantis {
                        mantis_count += 1;
                    } else if beast.id == BeastId::Spider {
                        spider_count += 1;
                    } else if beast.id == BeastId::Rat {
                        rat_count += 1;
                    } else if beast.id == BeastId::Kraken {
                        kraken_count += 1;
                    } else if beast.id == BeastId::Colossus {
                        colossus_count += 1;
                    } else if beast.id == BeastId::Balrog {
                        balrog_count += 1;
                    } else if beast.id == BeastId::Leviathan {
                        leviathan_count += 1;
                    } else if beast.id == BeastId::Tarrasque {
                        tarrasque_count += 1;
                    } else if beast.id == BeastId::Titan {
                        titan_count += 1;
                    } else if beast.id == BeastId::Nephilim {
                        nephilim_count += 1;
                    } else if beast.id == BeastId::Behemoth {
                        behemoth_count += 1;
                    } else if beast.id == BeastId::Hydra {
                        hydra_count += 1;
                    } else if beast.id == BeastId::Juggernaut {
                        juggernaut_count += 1;
                    } else if beast.id == BeastId::Oni {
                        oni_count += 1;
                    } else if beast.id == BeastId::Jotunn {
                        jotunn_count += 1;
                    } else if beast.id == BeastId::Ettin {
                        ettin_count += 1;
                    } else if beast.id == BeastId::Cyclops {
                        cyclops_count += 1;
                    } else if beast.id == BeastId::Giant {
                        giant_count += 1;
                    } else if beast.id == BeastId::NemeanLion {
                        nemean_lion_count += 1;
                    } else if beast.id == BeastId::Berserker {
                        berserker_count += 1;
                    } else if beast.id == BeastId::Yeti {
                        yeti_count += 1;
                    } else if beast.id == BeastId::Golem {
                        golem_count += 1;
                    } else if beast.id == BeastId::Ent {
                        ent_count += 1;
                    } else if beast.id == BeastId::Troll {
                        troll_count += 1;
                    } else if beast.id == BeastId::Bigfoot {
                        bigfoot_count += 1;
                    } else if beast.id == BeastId::Ogre {
                        ogre_count += 1;
                    } else if beast.id == BeastId::Orc {
                        orc_count += 1;
                    } else if beast.id == BeastId::Skeleton {
                        skeleton_count += 1;
                    }
                },
                ExploreResult::Obstacle(()) => {},
                ExploreResult::Discovery(()) => {},
            }

            xp += 1;
        };

        // assert beasts distributions are reasonably uniform
        let warlock_percentage = (warlock_count * 1000) / total_beasts;
        assert(warlock_percentage >= 4 && warlock_percentage <= 23, 'warlock distribution');

        let typhon_percentage = (typhon_count * 1000) / total_beasts;
        assert(typhon_percentage >= 4 && typhon_percentage <= 23, 'typhon distribution');

        let jiangshi_percentage = (jiangshi_count * 1000) / total_beasts;
        assert(jiangshi_percentage >= 4 && jiangshi_percentage <= 23, 'jiangshi distribution');

        let anansi_percentage = (anansi_count * 1000) / total_beasts;
        assert(anansi_percentage >= 4 && anansi_percentage <= 23, 'anansi distribution');

        let basilisk_percentage = (basilisk_count * 1000) / total_beasts;
        assert(basilisk_percentage >= 4 && basilisk_percentage <= 23, 'basilisk distribution');

        let gorgon_percentage = (gorgon_count * 1000) / total_beasts;
        assert(gorgon_percentage >= 4 && gorgon_percentage <= 23, 'gorgon distribution');

        let kitsune_percentage = (kitsune_count * 1000) / total_beasts;
        assert(kitsune_percentage >= 4 && kitsune_percentage <= 23, 'kitsune distribution');

        let lich_percentage = (lich_count * 1000) / total_beasts;
        assert(lich_percentage >= 4 && lich_percentage <= 23, 'lich distribution');

        let chimera_percentage = (chimera_count * 1000) / total_beasts;
        assert(chimera_percentage >= 4 && chimera_percentage <= 23, 'chimera distribution');

        let wendigo_percentage = (wendigo_count * 1000) / total_beasts;
        assert(wendigo_percentage >= 4 && wendigo_percentage <= 23, 'wendigo distribution');

        let raksasa_percentage = (raksasa_count * 1000) / total_beasts;
        assert(raksasa_percentage >= 4 && raksasa_percentage <= 23, 'raksasa distribution');

        let werewolf_percentage = (werewolf_count * 1000) / total_beasts;
        assert(werewolf_percentage >= 4 && werewolf_percentage <= 23, 'werewolf distribution');

        let banshee_percentage = (banshee_count * 1000) / total_beasts;
        assert(banshee_percentage >= 4 && banshee_percentage <= 23, 'banshee distribution');

        let draugr_percentage = (draugr_count * 1000) / total_beasts;
        assert(draugr_percentage >= 4 && draugr_percentage <= 23, 'draugr distribution');

        let vampire_percentage = (vampire_count * 1000) / total_beasts;
        assert(vampire_percentage >= 4 && vampire_percentage <= 23, 'vampire distribution');

        let goblin_percentage = (goblin_count * 1000) / total_beasts;
        assert(goblin_percentage >= 4 && goblin_percentage <= 23, 'goblin distribution');

        let ghoul_percentage = (ghoul_count * 1000) / total_beasts;
        assert(ghoul_percentage >= 4 && ghoul_percentage <= 23, 'ghoul distribution');

        let wraith_percentage = (wraith_count * 1000) / total_beasts;
        assert(wraith_percentage >= 4 && wraith_percentage <= 23, 'wraith distribution');

        let sprite_percentage = (sprite_count * 1000) / total_beasts;
        assert(sprite_percentage >= 4 && sprite_percentage <= 23, 'sprite distribution');

        let kappa_percentage = (kappa_count * 1000) / total_beasts;
        assert(kappa_percentage >= 4 && kappa_percentage <= 23, 'kappa distribution');

        let fairy_percentage = (fairy_count * 1000) / total_beasts;
        assert(fairy_percentage >= 4 && fairy_percentage <= 23, 'fairy distribution');

        let leprechaun_percentage = (leprechaun_count * 1000) / total_beasts;
        assert(leprechaun_percentage >= 4 && leprechaun_percentage <= 23, 'leprechaun distribution');

        let kelpie_percentage = (kelpie_count * 1000) / total_beasts;
        assert(kelpie_percentage >= 4 && kelpie_percentage <= 23, 'kelpie distribution');

        let pixie_percentage = (pixie_count * 1000) / total_beasts;
        assert(pixie_percentage >= 4 && pixie_percentage <= 23, 'pixie distribution');

        let gnome_percentage = (gnome_count * 1000) / total_beasts;
        assert(gnome_percentage >= 4 && gnome_percentage <= 23, 'gnome distribution');

        let griffin_percentage = (griffin_count * 1000) / total_beasts;
        assert(griffin_percentage >= 4 && griffin_percentage <= 23, 'griffin distribution');

        let manticore_percentage = (manticore_count * 1000) / total_beasts;
        assert(manticore_percentage >= 4 && manticore_percentage <= 23, 'manticore distribution');

        let phoenix_percentage = (phoenix_count * 1000) / total_beasts;
        assert(phoenix_percentage >= 4 && phoenix_percentage <= 23, 'phoenix distribution');

        let dragon_percentage = (dragon_count * 1000) / total_beasts;
        assert(dragon_percentage >= 4 && dragon_percentage <= 23, 'dragon distribution');

        let minotaur_percentage = (minotaur_count * 1000) / total_beasts;
        assert(minotaur_percentage >= 4 && minotaur_percentage <= 23, 'minotaur distribution');

        let qilin_percentage = (qilin_count * 1000) / total_beasts;
        assert(qilin_percentage >= 4 && qilin_percentage <= 23, 'qilin distribution');

        let ammit_percentage = (ammit_count * 1000) / total_beasts;
        assert(ammit_percentage >= 4 && ammit_percentage <= 23, 'ammit distribution');

        let nue_percentage = (nue_count * 1000) / total_beasts;
        assert(nue_percentage >= 4 && nue_percentage <= 23, 'nue distribution');

        let skinwalker_percentage = (skinwalker_count * 1000) / total_beasts;
        assert(skinwalker_percentage >= 4 && skinwalker_percentage <= 23, 'skinwalker distribution');

        let chupacabra_percentage = (chupacabra_count * 1000) / total_beasts;
        assert(chupacabra_percentage >= 4 && chupacabra_percentage <= 23, 'chupacabra distribution');

        let weretiger_percentage = (weretiger_count * 1000) / total_beasts;
        assert(weretiger_percentage >= 4 && weretiger_percentage <= 23, 'weretiger distribution');

        let wyvern_percentage = (wyvern_count * 1000) / total_beasts;
        assert(wyvern_percentage >= 4 && wyvern_percentage <= 23, 'wyvern distribution');

        let roc_percentage = (roc_count * 1000) / total_beasts;
        assert(roc_percentage >= 4 && roc_percentage <= 23, 'roc distribution');

        let harpy_percentage = (harpy_count * 1000) / total_beasts;
        assert(harpy_percentage >= 4 && harpy_percentage <= 23, 'harpy distribution');

        let pegasus_percentage = (pegasus_count * 1000) / total_beasts;
        assert(pegasus_percentage >= 4 && pegasus_percentage <= 23, 'pegasus distribution');

        let hippogriff_percentage = (hippogriff_count * 1000) / total_beasts;
        assert(hippogriff_percentage >= 4 && hippogriff_percentage <= 23, 'hippogriff distribution');

        let fenrir_percentage = (fenrir_count * 1000) / total_beasts;
        assert(fenrir_percentage >= 4 && fenrir_percentage <= 23, 'fenrir distribution');

        let jaguar_percentage = (jaguar_count * 1000) / total_beasts;
        assert(jaguar_percentage >= 4 && jaguar_percentage <= 23, 'jaguar distribution');

        let satori_percentage = (satori_count * 1000) / total_beasts;
        assert(satori_percentage >= 4 && satori_percentage <= 23, 'satori distribution');

        let direwolf_percentage = (direwolf_count * 1000) / total_beasts;
        assert(direwolf_percentage >= 4 && direwolf_percentage <= 23, 'direwolf distribution');

        let bear_percentage = (bear_count * 1000) / total_beasts;
        assert(bear_percentage >= 4 && bear_percentage <= 23, 'bear distribution');

        let wolf_percentage = (wolf_count * 1000) / total_beasts;
        assert(wolf_percentage >= 4 && wolf_percentage <= 23, 'wolf distribution');

        let mantis_percentage = (mantis_count * 1000) / total_beasts;
        assert(mantis_percentage >= 4 && mantis_percentage <= 23, 'mantis distribution');

        let spider_percentage = (spider_count * 1000) / total_beasts;
        assert(spider_percentage >= 4 && spider_percentage <= 23, 'spider distribution');

        let rat_percentage = (rat_count * 1000) / total_beasts;
        assert(rat_percentage >= 4 && rat_percentage <= 23, 'rat distribution');

        let kraken_percentage = (kraken_count * 1000) / total_beasts;
        assert(kraken_percentage >= 4 && kraken_percentage <= 23, 'kraken distribution');

        let colossus_percentage = (colossus_count * 1000) / total_beasts;
        assert(colossus_percentage >= 4 && colossus_percentage <= 23, 'colossus distribution');

        let balrog_percentage = (balrog_count * 1000) / total_beasts;
        assert(balrog_percentage >= 4 && balrog_percentage <= 23, 'balrog distribution');

        let leviathan_percentage = (leviathan_count * 1000) / total_beasts;
        assert(leviathan_percentage >= 4 && leviathan_percentage <= 23, 'leviathan distribution');

        let tarrasque_percentage = (tarrasque_count * 1000) / total_beasts;
        assert(tarrasque_percentage >= 4 && tarrasque_percentage <= 23, 'tarrasque distribution');

        let titan_percentage = (titan_count * 1000) / total_beasts;
        assert(titan_percentage >= 4 && titan_percentage <= 23, 'titan distribution');

        let nephilim_percentage = (nephilim_count * 1000) / total_beasts;
        assert(nephilim_percentage >= 4 && nephilim_percentage <= 23, 'nephilim distribution');

        let behemoth_percentage = (behemoth_count * 1000) / total_beasts;
        assert(behemoth_percentage >= 4 && behemoth_percentage <= 23, 'behemoth distribution');

        let hydra_percentage = (hydra_count * 1000) / total_beasts;
        assert(hydra_percentage >= 4 && hydra_percentage <= 23, 'hydra distribution');

        let juggernaut_percentage = (juggernaut_count * 1000) / total_beasts;
        assert(juggernaut_percentage >= 4 && juggernaut_percentage <= 23, 'juggernaut distribution');

        let oni_percentage = (oni_count * 1000) / total_beasts;
        assert(oni_percentage >= 4 && oni_percentage <= 23, 'oni distribution');

        let jotunn_percentage = (jotunn_count * 1000) / total_beasts;
        assert(jotunn_percentage >= 4 && jotunn_percentage <= 23, 'jotunn distribution');

        let ettin_percentage = (ettin_count * 1000) / total_beasts;
        assert(ettin_percentage >= 4 && ettin_percentage <= 23, 'ettin distribution');

        let cyclops_percentage = (cyclops_count * 1000) / total_beasts;
        assert(cyclops_percentage >= 4 && cyclops_percentage <= 23, 'cyclops distribution');

        let giant_percentage = (giant_count * 1000) / total_beasts;
        assert(giant_percentage >= 4 && giant_percentage <= 23, 'giant distribution');

        let nemean_lion_percentage = (nemean_lion_count * 1000) / total_beasts;
        assert(nemean_lion_percentage >= 4 && nemean_lion_percentage <= 23, 'nemean_lion distribution');

        let berserker_percentage = (berserker_count * 1000) / total_beasts;
        assert(berserker_percentage >= 4 && berserker_percentage <= 23, 'berserker distribution');

        let yeti_percentage = (yeti_count * 1000) / total_beasts;
        assert(yeti_percentage >= 4 && yeti_percentage <= 23, 'yeti distribution');

        let golem_percentage = (golem_count * 1000) / total_beasts;
        assert(golem_percentage >= 4 && golem_percentage <= 23, 'golem distribution');

        let ent_percentage = (ent_count * 1000) / total_beasts;
        assert(ent_percentage >= 4 && ent_percentage <= 23, 'ent distribution');

        let troll_percentage = (troll_count * 1000) / total_beasts;
        assert(troll_percentage >= 4 && troll_percentage <= 23, 'troll distribution');

        let bigfoot_percentage = (bigfoot_count * 1000) / total_beasts;
        assert(bigfoot_percentage >= 4 && bigfoot_percentage <= 23, 'bigfoot distribution');

        let ogre_percentage = (ogre_count * 1000) / total_beasts;
        assert(ogre_percentage >= 4 && ogre_percentage <= 23, 'ogre distribution');

        let orc_percentage = (orc_count * 1000) / total_beasts;
        assert(orc_percentage >= 4 && orc_percentage <= 23, 'orc distribution');

        let skeleton_percentage = (skeleton_count * 1000) / total_beasts;
        assert(skeleton_percentage >= 4 && skeleton_percentage <= 23, 'skeleton distribution');
        // println!("warlock percentage: {}", warlock_percentage);
    // println!("typhon percentage: {}", typhon_percentage);
    // println!("jiangshi percentage: {}", jiangshi_percentage);
    // println!("anansi percentage: {}", anansi_percentage);
    // println!("basilisk percentage: {}", basilisk_percentage);
    // println!("gorgon percentage: {}", gorgon_percentage);
    // println!("kitsune percentage: {}", kitsune_percentage);
    // println!("lich percentage: {}", lich_percentage);
    // println!("chimera percentage: {}", chimera_percentage);
    // println!("wendigo percentage: {}", wendigo_percentage);
    // println!("raksasa percentage: {}", raksasa_percentage);
    // println!("werewolf percentage: {}", werewolf_percentage);
    // println!("banshee percentage: {}", banshee_percentage);
    // println!("draugr percentage: {}", draugr_percentage);
    // println!("vampire percentage: {}", vampire_percentage);
    // println!("goblin percentage: {}", goblin_percentage);
    // println!("ghoul percentage: {}", ghoul_percentage);
    // println!("wraith percentage: {}", wraith_percentage);
    // println!("sprite percentage: {}", sprite_percentage);
    // println!("kappa percentage: {}", kappa_percentage);
    // println!("fairy percentage: {}", fairy_percentage);
    // println!("leprechaun percentage: {}", leprechaun_percentage);
    // println!("kelpie percentage: {}", kelpie_percentage);
    // println!("pixie percentage: {}", pixie_percentage);
    // println!("gnome percentage: {}", gnome_percentage);
    // println!("griffin percentage: {}", griffin_percentage);
    // println!("manticore percentage: {}", manticore_percentage);
    // println!("phoenix percentage: {}", phoenix_percentage);
    // println!("dragon percentage: {}", dragon_percentage);
    // println!("minotaur percentage: {}", minotaur_percentage);
    // println!("qilin percentage: {}", qilin_percentage);
    // println!("ammit percentage: {}", ammit_percentage);
    // println!("nue percentage: {}", nue_percentage);
    // println!("skinwalker percentage: {}", skinwalker_percentage);
    // println!("chupacabra percentage: {}", chupacabra_percentage);
    // println!("weretiger percentage: {}", weretiger_percentage);
    // println!("wyvern percentage: {}", wyvern_percentage);
    // println!("roc percentage: {}", roc_percentage);
    // println!("harpy percentage: {}", harpy_percentage);
    // println!("pegasus percentage: {}", pegasus_percentage);
    // println!("hippogriff percentage: {}", hippogriff_percentage);
    // println!("fenrir percentage: {}", fenrir_percentage);
    // println!("jaguar percentage: {}", jaguar_percentage);
    // println!("satori percentage: {}", satori_percentage);
    // println!("direwolf percentage: {}", direwolf_percentage);
    // println!("bear percentage: {}", bear_percentage);
    // println!("wolf percentage: {}", wolf_percentage);
    // println!("mantis percentage: {}", mantis_percentage);
    // println!("spider percentage: {}", spider_percentage);
    // println!("rat percentage: {}", rat_percentage);
    // println!("kraken percentage: {}", kraken_percentage);
    // println!("colossus percentage: {}", colossus_percentage);
    // println!("balrog percentage: {}", balrog_percentage);
    // println!("leviathan percentage: {}", leviathan_percentage);
    // println!("tarrasque percentage: {}", tarrasque_percentage);
    // println!("titan percentage: {}", titan_percentage);
    // println!("nephilim percentage: {}", nephilim_percentage);
    // println!("behemoth percentage: {}", behemoth_percentage);
    // println!("hydra percentage: {}", hydra_percentage);
    // println!("juggernaut percentage: {}", juggernaut_percentage);
    // println!("oni percentage: {}", oni_percentage);
    // println!("jotunn percentage: {}", jotunn_percentage);
    // println!("ettin percentage: {}", ettin_percentage);
    // println!("cyclops percentage: {}", cyclops_percentage);
    // println!("giant percentage: {}", giant_percentage);
    // println!("nemean_lion percentage: {}", nemean_lion_percentage);
    // println!("berserker percentage: {}", berserker_percentage);
    // println!("yeti percentage: {}", yeti_percentage);
    // println!("golem percentage: {}", golem_percentage);
    // println!("ent percentage: {}", ent_percentage);
    // println!("troll percentage: {}", troll_percentage);
    // println!("bigfoot percentage: {}", bigfoot_percentage);
    // println!("ogre percentage: {}", ogre_percentage);
    // println!("orc percentage: {}", orc_percentage);
    // println!("skeleton percentage: {}", skeleton_percentage);
    }

    #[test]
    fn get_beast_distribution_fixed_xp() {
        let mut warlock_count: u32 = 0;
        let mut typhon_count: u32 = 0;
        let mut jiangshi_count: u32 = 0;
        let mut anansi_count: u32 = 0;
        let mut basilisk_count: u32 = 0;
        let mut gorgon_count: u32 = 0;
        let mut kitsune_count: u32 = 0;
        let mut lich_count: u32 = 0;
        let mut chimera_count: u32 = 0;
        let mut wendigo_count: u32 = 0;
        let mut raksasa_count: u32 = 0;
        let mut werewolf_count: u32 = 0;
        let mut banshee_count: u32 = 0;
        let mut draugr_count: u32 = 0;
        let mut vampire_count: u32 = 0;
        let mut goblin_count: u32 = 0;
        let mut ghoul_count: u32 = 0;
        let mut wraith_count: u32 = 0;
        let mut sprite_count: u32 = 0;
        let mut kappa_count: u32 = 0;
        let mut fairy_count: u32 = 0;
        let mut leprechaun_count: u32 = 0;
        let mut kelpie_count: u32 = 0;
        let mut pixie_count: u32 = 0;
        let mut gnome_count: u32 = 0;
        let mut griffin_count: u32 = 0;
        let mut manticore_count: u32 = 0;
        let mut phoenix_count: u32 = 0;
        let mut dragon_count: u32 = 0;
        let mut minotaur_count: u32 = 0;
        let mut qilin_count: u32 = 0;
        let mut ammit_count: u32 = 0;
        let mut nue_count: u32 = 0;
        let mut skinwalker_count: u32 = 0;
        let mut chupacabra_count: u32 = 0;
        let mut weretiger_count: u32 = 0;
        let mut wyvern_count: u32 = 0;
        let mut roc_count: u32 = 0;
        let mut harpy_count: u32 = 0;
        let mut pegasus_count: u32 = 0;
        let mut hippogriff_count: u32 = 0;
        let mut fenrir_count: u32 = 0;
        let mut jaguar_count: u32 = 0;
        let mut satori_count: u32 = 0;
        let mut direwolf_count: u32 = 0;
        let mut bear_count: u32 = 0;
        let mut wolf_count: u32 = 0;
        let mut mantis_count: u32 = 0;
        let mut spider_count: u32 = 0;
        let mut rat_count: u32 = 0;
        let mut kraken_count: u32 = 0;
        let mut colossus_count: u32 = 0;
        let mut balrog_count: u32 = 0;
        let mut leviathan_count: u32 = 0;
        let mut tarrasque_count: u32 = 0;
        let mut titan_count: u32 = 0;
        let mut nephilim_count: u32 = 0;
        let mut behemoth_count: u32 = 0;
        let mut hydra_count: u32 = 0;
        let mut juggernaut_count: u32 = 0;
        let mut oni_count: u32 = 0;
        let mut jotunn_count: u32 = 0;
        let mut ettin_count: u32 = 0;
        let mut cyclops_count: u32 = 0;
        let mut giant_count: u32 = 0;
        let mut nemean_lion_count: u32 = 0;
        let mut berserker_count: u32 = 0;
        let mut yeti_count: u32 = 0;
        let mut golem_count: u32 = 0;
        let mut ent_count: u32 = 0;
        let mut troll_count: u32 = 0;
        let mut bigfoot_count: u32 = 0;
        let mut ogre_count: u32 = 0;
        let mut orc_count: u32 = 0;
        let mut skeleton_count: u32 = 0;
        let mut total_beasts = 0;

        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.xp = 200;

        let mut level_seed: u64 = 1;
        loop {
            if level_seed == 3000 {
                break;
            }
            let (
                beast_seed,
                _,
                beast_health_rnd,
                beast_level_rnd,
                beast_specials1_rnd,
                beast_specials2_rnd,
                _,
                explore_rnd,
            ) =
                ImplAdventurer::get_randomness(
                adventurer.xp, level_seed,
            );
            match ImplAdventurer::get_random_explore(explore_rnd) {
                ExploreResult::Beast(()) => {
                    total_beasts += 1;
                    // get beast based on entropy seeds
                    let beast = ImplBeast::get_beast(
                        adventurer.get_level(),
                        ImplLoot::get_type(adventurer.equipment.weapon.id),
                        beast_seed,
                        beast_health_rnd,
                        beast_level_rnd,
                        beast_specials1_rnd,
                        beast_specials2_rnd,
                    );
                    if beast.id == BeastId::Warlock {
                        warlock_count += 1;
                    } else if beast.id == BeastId::Typhon {
                        typhon_count += 1;
                    } else if beast.id == BeastId::Jiangshi {
                        jiangshi_count += 1;
                    } else if beast.id == BeastId::Anansi {
                        anansi_count += 1;
                    } else if beast.id == BeastId::Basilisk {
                        basilisk_count += 1;
                    } else if beast.id == BeastId::Gorgon {
                        gorgon_count += 1;
                    } else if beast.id == BeastId::Kitsune {
                        kitsune_count += 1;
                    } else if beast.id == BeastId::Lich {
                        lich_count += 1;
                    } else if beast.id == BeastId::Chimera {
                        chimera_count += 1;
                    } else if beast.id == BeastId::Wendigo {
                        wendigo_count += 1;
                    } else if beast.id == BeastId::Rakshasa {
                        raksasa_count += 1;
                    } else if beast.id == BeastId::Werewolf {
                        werewolf_count += 1;
                    } else if beast.id == BeastId::Banshee {
                        banshee_count += 1;
                    } else if beast.id == BeastId::Draugr {
                        draugr_count += 1;
                    } else if beast.id == BeastId::Vampire {
                        vampire_count += 1;
                    } else if beast.id == BeastId::Goblin {
                        goblin_count += 1;
                    } else if beast.id == BeastId::Ghoul {
                        ghoul_count += 1;
                    } else if beast.id == BeastId::Wraith {
                        wraith_count += 1;
                    } else if beast.id == BeastId::Sprite {
                        sprite_count += 1;
                    } else if beast.id == BeastId::Kappa {
                        kappa_count += 1;
                    } else if beast.id == BeastId::Fairy {
                        fairy_count += 1;
                    } else if beast.id == BeastId::Leprechaun {
                        leprechaun_count += 1;
                    } else if beast.id == BeastId::Kelpie {
                        kelpie_count += 1;
                    } else if beast.id == BeastId::Pixie {
                        pixie_count += 1;
                    } else if beast.id == BeastId::Gnome {
                        gnome_count += 1;
                    } else if beast.id == BeastId::Griffin {
                        griffin_count += 1;
                    } else if beast.id == BeastId::Manticore {
                        manticore_count += 1;
                    } else if beast.id == BeastId::Phoenix {
                        phoenix_count += 1;
                    } else if beast.id == BeastId::Dragon {
                        dragon_count += 1;
                    } else if beast.id == BeastId::Minotaur {
                        minotaur_count += 1;
                    } else if beast.id == BeastId::Qilin {
                        qilin_count += 1;
                    } else if beast.id == BeastId::Ammit {
                        ammit_count += 1;
                    } else if beast.id == BeastId::Nue {
                        nue_count += 1;
                    } else if beast.id == BeastId::Skinwalker {
                        skinwalker_count += 1;
                    } else if beast.id == BeastId::Chupacabra {
                        chupacabra_count += 1;
                    } else if beast.id == BeastId::Weretiger {
                        weretiger_count += 1;
                    } else if beast.id == BeastId::Wyvern {
                        wyvern_count += 1;
                    } else if beast.id == BeastId::Roc {
                        roc_count += 1;
                    } else if beast.id == BeastId::Harpy {
                        harpy_count += 1;
                    } else if beast.id == BeastId::Pegasus {
                        pegasus_count += 1;
                    } else if beast.id == BeastId::Hippogriff {
                        hippogriff_count += 1;
                    } else if beast.id == BeastId::Fenrir {
                        fenrir_count += 1;
                    } else if beast.id == BeastId::Jaguar {
                        jaguar_count += 1;
                    } else if beast.id == BeastId::Satori {
                        satori_count += 1;
                    } else if beast.id == BeastId::DireWolf {
                        direwolf_count += 1;
                    } else if beast.id == BeastId::Bear {
                        bear_count += 1;
                    } else if beast.id == BeastId::Wolf {
                        wolf_count += 1;
                    } else if beast.id == BeastId::Mantis {
                        mantis_count += 1;
                    } else if beast.id == BeastId::Spider {
                        spider_count += 1;
                    } else if beast.id == BeastId::Rat {
                        rat_count += 1;
                    } else if beast.id == BeastId::Kraken {
                        kraken_count += 1;
                    } else if beast.id == BeastId::Colossus {
                        colossus_count += 1;
                    } else if beast.id == BeastId::Balrog {
                        balrog_count += 1;
                    } else if beast.id == BeastId::Leviathan {
                        leviathan_count += 1;
                    } else if beast.id == BeastId::Tarrasque {
                        tarrasque_count += 1;
                    } else if beast.id == BeastId::Titan {
                        titan_count += 1;
                    } else if beast.id == BeastId::Nephilim {
                        nephilim_count += 1;
                    } else if beast.id == BeastId::Behemoth {
                        behemoth_count += 1;
                    } else if beast.id == BeastId::Hydra {
                        hydra_count += 1;
                    } else if beast.id == BeastId::Juggernaut {
                        juggernaut_count += 1;
                    } else if beast.id == BeastId::Oni {
                        oni_count += 1;
                    } else if beast.id == BeastId::Jotunn {
                        jotunn_count += 1;
                    } else if beast.id == BeastId::Ettin {
                        ettin_count += 1;
                    } else if beast.id == BeastId::Cyclops {
                        cyclops_count += 1;
                    } else if beast.id == BeastId::Giant {
                        giant_count += 1;
                    } else if beast.id == BeastId::NemeanLion {
                        nemean_lion_count += 1;
                    } else if beast.id == BeastId::Berserker {
                        berserker_count += 1;
                    } else if beast.id == BeastId::Yeti {
                        yeti_count += 1;
                    } else if beast.id == BeastId::Golem {
                        golem_count += 1;
                    } else if beast.id == BeastId::Ent {
                        ent_count += 1;
                    } else if beast.id == BeastId::Troll {
                        troll_count += 1;
                    } else if beast.id == BeastId::Bigfoot {
                        bigfoot_count += 1;
                    } else if beast.id == BeastId::Ogre {
                        ogre_count += 1;
                    } else if beast.id == BeastId::Orc {
                        orc_count += 1;
                    } else if beast.id == BeastId::Skeleton {
                        skeleton_count += 1;
                    }
                },
                ExploreResult::Obstacle(()) => {},
                ExploreResult::Discovery(()) => {},
            }

            level_seed += 1;
        };

        // assert beasts distributions are reasonably uniform
        let warlock_percentage = (warlock_count * 1000) / total_beasts;
        assert(warlock_percentage >= 4 && warlock_percentage <= 23, 'warlock distribution');

        let typhon_percentage = (typhon_count * 1000) / total_beasts;
        assert(typhon_percentage >= 4 && typhon_percentage <= 23, 'typhon distribution');

        let jiangshi_percentage = (jiangshi_count * 1000) / total_beasts;
        assert(jiangshi_percentage >= 4 && jiangshi_percentage <= 23, 'jiangshi distribution');

        let anansi_percentage = (anansi_count * 1000) / total_beasts;
        assert(anansi_percentage >= 4 && anansi_percentage <= 23, 'anansi distribution');

        let basilisk_percentage = (basilisk_count * 1000) / total_beasts;
        assert(basilisk_percentage >= 4 && basilisk_percentage <= 23, 'basilisk distribution');

        let gorgon_percentage = (gorgon_count * 1000) / total_beasts;
        assert(gorgon_percentage >= 4 && gorgon_percentage <= 23, 'gorgon distribution');

        let kitsune_percentage = (kitsune_count * 1000) / total_beasts;
        assert(kitsune_percentage >= 4 && kitsune_percentage <= 23, 'kitsune distribution');

        let lich_percentage = (lich_count * 1000) / total_beasts;
        assert(lich_percentage >= 4 && lich_percentage <= 23, 'lich distribution');

        let chimera_percentage = (chimera_count * 1000) / total_beasts;
        assert(chimera_percentage >= 4 && chimera_percentage <= 23, 'chimera distribution');

        let wendigo_percentage = (wendigo_count * 1000) / total_beasts;
        assert(wendigo_percentage >= 4 && wendigo_percentage <= 23, 'wendigo distribution');

        let raksasa_percentage = (raksasa_count * 1000) / total_beasts;
        assert(raksasa_percentage >= 4 && raksasa_percentage <= 23, 'raksasa distribution');

        let werewolf_percentage = (werewolf_count * 1000) / total_beasts;
        assert(werewolf_percentage >= 4 && werewolf_percentage <= 23, 'werewolf distribution');

        let banshee_percentage = (banshee_count * 1000) / total_beasts;
        assert(banshee_percentage >= 4 && banshee_percentage <= 23, 'banshee distribution');

        let draugr_percentage = (draugr_count * 1000) / total_beasts;
        assert(draugr_percentage >= 4 && draugr_percentage <= 23, 'draugr distribution');

        let vampire_percentage = (vampire_count * 1000) / total_beasts;
        assert(vampire_percentage >= 4 && vampire_percentage <= 23, 'vampire distribution');

        let goblin_percentage = (goblin_count * 1000) / total_beasts;
        assert(goblin_percentage >= 4 && goblin_percentage <= 23, 'goblin distribution');

        let ghoul_percentage = (ghoul_count * 1000) / total_beasts;
        assert(ghoul_percentage >= 4 && ghoul_percentage <= 23, 'ghoul distribution');

        let wraith_percentage = (wraith_count * 1000) / total_beasts;
        assert(wraith_percentage >= 4 && wraith_percentage <= 23, 'wraith distribution');

        let sprite_percentage = (sprite_count * 1000) / total_beasts;
        assert(sprite_percentage >= 4 && sprite_percentage <= 23, 'sprite distribution');

        let kappa_percentage = (kappa_count * 1000) / total_beasts;
        assert(kappa_percentage >= 4 && kappa_percentage <= 23, 'kappa distribution');

        let fairy_percentage = (fairy_count * 1000) / total_beasts;
        assert(fairy_percentage >= 4 && fairy_percentage <= 23, 'fairy distribution');

        let leprechaun_percentage = (leprechaun_count * 1000) / total_beasts;
        assert(leprechaun_percentage >= 4 && leprechaun_percentage <= 23, 'leprechaun distribution');

        let kelpie_percentage = (kelpie_count * 1000) / total_beasts;
        assert(kelpie_percentage >= 4 && kelpie_percentage <= 23, 'kelpie distribution');

        let pixie_percentage = (pixie_count * 1000) / total_beasts;
        assert(pixie_percentage >= 4 && pixie_percentage <= 23, 'pixie distribution');

        let gnome_percentage = (gnome_count * 1000) / total_beasts;
        assert(gnome_percentage >= 4 && gnome_percentage <= 23, 'gnome distribution');

        let griffin_percentage = (griffin_count * 1000) / total_beasts;
        assert(griffin_percentage >= 4 && griffin_percentage <= 23, 'griffin distribution');

        let manticore_percentage = (manticore_count * 1000) / total_beasts;
        assert(manticore_percentage >= 4 && manticore_percentage <= 23, 'manticore distribution');

        let phoenix_percentage = (phoenix_count * 1000) / total_beasts;
        assert(phoenix_percentage >= 4 && phoenix_percentage <= 23, 'phoenix distribution');

        let dragon_percentage = (dragon_count * 1000) / total_beasts;
        assert(dragon_percentage >= 4 && dragon_percentage <= 23, 'dragon distribution');

        let minotaur_percentage = (minotaur_count * 1000) / total_beasts;
        assert(minotaur_percentage >= 4 && minotaur_percentage <= 23, 'minotaur distribution');

        let qilin_percentage = (qilin_count * 1000) / total_beasts;
        assert(qilin_percentage >= 4 && qilin_percentage <= 23, 'qilin distribution');

        let ammit_percentage = (ammit_count * 1000) / total_beasts;
        assert(ammit_percentage >= 4 && ammit_percentage <= 23, 'ammit distribution');

        let nue_percentage = (nue_count * 1000) / total_beasts;
        assert(nue_percentage >= 4 && nue_percentage <= 23, 'nue distribution');

        let skinwalker_percentage = (skinwalker_count * 1000) / total_beasts;
        assert(skinwalker_percentage >= 4 && skinwalker_percentage <= 23, 'skinwalker distribution');

        let chupacabra_percentage = (chupacabra_count * 1000) / total_beasts;
        assert(chupacabra_percentage >= 4 && chupacabra_percentage <= 23, 'chupacabra distribution');

        let weretiger_percentage = (weretiger_count * 1000) / total_beasts;
        assert(weretiger_percentage >= 4 && weretiger_percentage <= 23, 'weretiger distribution');

        let wyvern_percentage = (wyvern_count * 1000) / total_beasts;
        assert(wyvern_percentage >= 4 && wyvern_percentage <= 23, 'wyvern distribution');

        let roc_percentage = (roc_count * 1000) / total_beasts;
        assert(roc_percentage >= 4 && roc_percentage <= 23, 'roc distribution');

        let harpy_percentage = (harpy_count * 1000) / total_beasts;
        assert(harpy_percentage >= 4 && harpy_percentage <= 23, 'harpy distribution');

        let pegasus_percentage = (pegasus_count * 1000) / total_beasts;
        assert(pegasus_percentage >= 4 && pegasus_percentage <= 23, 'pegasus distribution');

        let hippogriff_percentage = (hippogriff_count * 1000) / total_beasts;
        assert(hippogriff_percentage >= 4 && hippogriff_percentage <= 23, 'hippogriff distribution');

        let fenrir_percentage = (fenrir_count * 1000) / total_beasts;
        assert(fenrir_percentage >= 4 && fenrir_percentage <= 23, 'fenrir distribution');

        let jaguar_percentage = (jaguar_count * 1000) / total_beasts;
        assert(jaguar_percentage >= 4 && jaguar_percentage <= 23, 'jaguar distribution');

        let satori_percentage = (satori_count * 1000) / total_beasts;
        assert(satori_percentage >= 4 && satori_percentage <= 23, 'satori distribution');

        let direwolf_percentage = (direwolf_count * 1000) / total_beasts;
        assert(direwolf_percentage >= 4 && direwolf_percentage <= 23, 'direwolf distribution');

        let bear_percentage = (bear_count * 1000) / total_beasts;
        assert(bear_percentage >= 4 && bear_percentage <= 23, 'bear distribution');

        let wolf_percentage = (wolf_count * 1000) / total_beasts;
        assert(wolf_percentage >= 4 && wolf_percentage <= 23, 'wolf distribution');

        let mantis_percentage = (mantis_count * 1000) / total_beasts;
        assert(mantis_percentage >= 4 && mantis_percentage <= 23, 'mantis distribution');

        let spider_percentage = (spider_count * 1000) / total_beasts;
        assert(spider_percentage >= 4 && spider_percentage <= 23, 'spider distribution');

        let rat_percentage = (rat_count * 1000) / total_beasts;
        assert(rat_percentage >= 4 && rat_percentage <= 23, 'rat distribution');

        let kraken_percentage = (kraken_count * 1000) / total_beasts;
        assert(kraken_percentage >= 4 && kraken_percentage <= 23, 'kraken distribution');

        let colossus_percentage = (colossus_count * 1000) / total_beasts;
        assert(colossus_percentage >= 4 && colossus_percentage <= 23, 'colossus distribution');

        let balrog_percentage = (balrog_count * 1000) / total_beasts;
        assert(balrog_percentage >= 4 && balrog_percentage <= 23, 'balrog distribution');

        let leviathan_percentage = (leviathan_count * 1000) / total_beasts;
        assert(leviathan_percentage >= 4 && leviathan_percentage <= 23, 'leviathan distribution');

        let tarrasque_percentage = (tarrasque_count * 1000) / total_beasts;
        assert(tarrasque_percentage >= 4 && tarrasque_percentage <= 23, 'tarrasque distribution');

        let titan_percentage = (titan_count * 1000) / total_beasts;
        assert(titan_percentage >= 4 && titan_percentage <= 23, 'titan distribution');

        let nephilim_percentage = (nephilim_count * 1000) / total_beasts;
        assert(nephilim_percentage >= 4 && nephilim_percentage <= 23, 'nephilim distribution');

        let behemoth_percentage = (behemoth_count * 1000) / total_beasts;
        assert(behemoth_percentage >= 4 && behemoth_percentage <= 23, 'behemoth distribution');

        let hydra_percentage = (hydra_count * 1000) / total_beasts;
        assert(hydra_percentage >= 4 && hydra_percentage <= 23, 'hydra distribution');

        let juggernaut_percentage = (juggernaut_count * 1000) / total_beasts;
        assert(juggernaut_percentage >= 4 && juggernaut_percentage <= 23, 'juggernaut distribution');

        let oni_percentage = (oni_count * 1000) / total_beasts;
        assert(oni_percentage >= 4 && oni_percentage <= 23, 'oni distribution');

        let jotunn_percentage = (jotunn_count * 1000) / total_beasts;
        assert(jotunn_percentage >= 4 && jotunn_percentage <= 23, 'jotunn distribution');

        let ettin_percentage = (ettin_count * 1000) / total_beasts;
        assert(ettin_percentage >= 4 && ettin_percentage <= 23, 'ettin distribution');

        let cyclops_percentage = (cyclops_count * 1000) / total_beasts;
        assert(cyclops_percentage >= 4 && cyclops_percentage <= 23, 'cyclops distribution');

        let giant_percentage = (giant_count * 1000) / total_beasts;
        assert(giant_percentage >= 4 && giant_percentage <= 23, 'giant distribution');

        let nemean_lion_percentage = (nemean_lion_count * 1000) / total_beasts;
        assert(nemean_lion_percentage >= 4 && nemean_lion_percentage <= 23, 'nemean_lion distribution');

        let berserker_percentage = (berserker_count * 1000) / total_beasts;
        assert(berserker_percentage >= 4 && berserker_percentage <= 23, 'berserker distribution');

        let yeti_percentage = (yeti_count * 1000) / total_beasts;
        assert(yeti_percentage >= 4 && yeti_percentage <= 23, 'yeti distribution');

        let golem_percentage = (golem_count * 1000) / total_beasts;
        assert(golem_percentage >= 4 && golem_percentage <= 23, 'golem distribution');

        let ent_percentage = (ent_count * 1000) / total_beasts;
        assert(ent_percentage >= 4 && ent_percentage <= 23, 'ent distribution');

        let troll_percentage = (troll_count * 1000) / total_beasts;
        assert(troll_percentage >= 4 && troll_percentage <= 23, 'troll distribution');

        let bigfoot_percentage = (bigfoot_count * 1000) / total_beasts;
        assert(bigfoot_percentage >= 4 && bigfoot_percentage <= 23, 'bigfoot distribution');

        let ogre_percentage = (ogre_count * 1000) / total_beasts;
        assert(ogre_percentage >= 4 && ogre_percentage <= 23, 'ogre distribution');

        let orc_percentage = (orc_count * 1000) / total_beasts;
        assert(orc_percentage >= 4 && orc_percentage <= 23, 'orc distribution');

        let skeleton_percentage = (skeleton_count * 1000) / total_beasts;
        assert(skeleton_percentage >= 4 && skeleton_percentage <= 23, 'skeleton distribution');
    }


    #[test]
    fn charisma_adjusted_item_price() {
        let mut stats = ImplStats::new();

        // zero case
        let item_price = stats.charisma_adjusted_item_price(0);
        assert(item_price == MINIMUM_ITEM_PRICE.into(), 'item should be min price');

        // above minimum price, no charisma (base case)
        let item_price = stats.charisma_adjusted_item_price(10);
        assert(item_price == 10, 'price should not change');

        // above minimum price, 1 charisma (base case)
        stats.charisma = 1;
        let item_price = stats.charisma_adjusted_item_price(10);
        assert(item_price == 10 - CHARISMA_ITEM_DISCOUNT.into(), 'price should not change');

        // underflow case
        stats.charisma = 31;
        let item_price = stats.charisma_adjusted_item_price(15);
        assert(item_price == MINIMUM_ITEM_PRICE.into(), 'price should be minimum');
    }

    #[test]
    fn charisma_adjusted_potion_price() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // default case (no charisma discount)
        let potion_price = adventurer.charisma_adjusted_potion_price();
        assert(potion_price == BASE_POTION_PRICE.into(), 'potion should be base price');

        // advance adventurer to level 2 (potion cost should double)
        adventurer.xp = 4;
        let potion_price = adventurer.charisma_adjusted_potion_price();
        assert(potion_price == BASE_POTION_PRICE.into() * 2, 'potion should cost double base');

        // give adventurer 1 charisma (potion cost should go back to base price)
        adventurer.stats.charisma = 1;
        let potion_price = adventurer.charisma_adjusted_potion_price();
        assert(potion_price == BASE_POTION_PRICE.into(), 'potion should be base price');

        // give adventurer 2 charisma which would result in a 0 cost potion
        // but since potion cost cannot be 0, it should be minimum price
        adventurer.stats.charisma = 2;
        let potion_price = adventurer.charisma_adjusted_potion_price();
        assert(potion_price == MINIMUM_POTION_PRICE.into(), 'potion should be minimum price');

        // give adventurer 31 charisma which would result in an underflow
        adventurer.stats.charisma = 31;
        let potion_price = adventurer.charisma_adjusted_potion_price();
        assert(potion_price == MINIMUM_POTION_PRICE.into(), 'potion should be minimum price');
    }

    #[test]
    #[should_panic(expected: ('health overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_health() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.health = MAX_ADVENTURER_HEALTH + 1;
        ImplAdventurer::pack(adventurer);
    }

    #[test]
    #[should_panic(expected: ('gold overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_gold() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.gold = MAX_GOLD + 1;
        ImplAdventurer::pack(adventurer);
    }

    #[test]
    #[should_panic(expected: ('xp overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_xp() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.xp = MAX_ADVENTURER_XP + 1;
        ImplAdventurer::pack(adventurer);
    }

    #[test]
    #[should_panic(expected: ('beast health overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_beast_health() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.beast_health = MAX_PACKABLE_BEAST_HEALTH + 1;
        ImplAdventurer::pack(adventurer);
    }

    #[test]
    #[should_panic(expected: ('stat upgrades avail overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_stat_points_available() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stat_upgrades_available = MAX_STAT_UPGRADES_AVAILABLE + 1;
        ImplAdventurer::pack(adventurer);
    }

    #[test]
    #[available_gas(2000000)]
    fn new_adventurer() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        ImplAdventurer::pack(adventurer);
        assert(adventurer.health == STARTING_HEALTH.into(), 'wrong starting health');
        assert(adventurer.gold == STARTING_GOLD.into(), 'wrong starting gold');
        assert(adventurer.xp == 0, 'wrong starting xp');
    }

    #[test]
    #[available_gas(305064)]
    fn increase_health() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // test stock max health is 100
        adventurer.increase_health(5);
        assert(adventurer.health == 100, 'max health with 0 vit is 100');

        // increase max health via vitality boost
        adventurer.stats.vitality = 1;
        adventurer.increase_health(5);
        assert(adventurer.health == 105, 'health should be 105');

        // verify max health is starting health + vitality boost
        adventurer.increase_health(50);
        assert(adventurer.health == STARTING_HEALTH.into() + HEALTH_INCREASE_PER_VITALITY.into(), 'max health error');
    }

    #[test]
    #[available_gas(2701164)]
    fn increase_gold() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // assert starting state
        assert(adventurer.gold == STARTING_GOLD.into(), 'wrong advntr starting gold');

        // base case
        adventurer.increase_gold(5);
        assert(adventurer.gold == STARTING_GOLD.into() + 5, 'gold should be +5');

        // at max value case
        adventurer.increase_gold(MAX_GOLD);
        assert(adventurer.gold == MAX_GOLD, 'gold should be max');

        // pack and unpack adventurer to test overflow in packing
        let packed = ImplAdventurer::pack(adventurer);
        let unpacked: Adventurer = ImplAdventurer::unpack(packed);
        assert(unpacked.gold == MAX_GOLD, 'should still be max gold');
    }

    #[test]
    #[available_gas(197164)]
    fn decrease_health() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let starting_health = adventurer.health;
        let deduct_amount = 5;

        // base case
        adventurer.decrease_health(deduct_amount);
        assert(adventurer.health == starting_health - deduct_amount, 'wrong health');

        // underflow case
        adventurer.decrease_health(65535);
        assert(adventurer.health == 0, 'health should be 0');
    }

    #[test]
    #[available_gas(197064)]
    fn deduct_gold() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let starting_gold = adventurer.gold.into();
        let deduct_amount = 5;

        // base case
        adventurer.deduct_gold(deduct_amount);
        assert(adventurer.gold == starting_gold - deduct_amount, 'wrong gold');

        // test underflow
        adventurer.deduct_gold(65535);
        assert(adventurer.gold == 0, 'gold should be 0');
    }

    #[test]
    #[available_gas(339614)]
    fn increase_adventurer_xp() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // base case level increase
        let (previous_level, new_level) = adventurer.increase_adventurer_xp(4);
        assert(adventurer.xp == 4, 'xp should be 4');
        assert(previous_level == 1, 'previous level should be 1');
        assert(new_level == 2, 'new level should be 2');

        // base case no level increase
        let (previous_level, new_level) = adventurer.increase_adventurer_xp(1);
        assert(adventurer.xp == 5, 'xp should be 5');
        assert(previous_level == 2, 'prev level should be 2');
        assert(new_level == 2, 'new level should still be 2');

        // multi-level and exceed max xp case
        let (previous_level, new_level) = adventurer.increase_adventurer_xp(MAX_ADVENTURER_XP + 10);
        assert(adventurer.xp == MAX_ADVENTURER_XP, 'xp should stop at max xp');
        assert(previous_level == 2, 'prev level should be 2');
        assert(new_level == 181, 'new level should be max 181');
    }

    #[test]
    #[available_gas(3000000)]
    fn increase_stat_upgrades_available() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let original_stat_points = adventurer.stat_upgrades_available;

        // zero case
        adventurer.increase_stat_upgrades_available(0);
        assert(adventurer.stat_upgrades_available == original_stat_points, 'stat points should not change');

        // base case - adding 1 stat point (no need to pack and unpack this test case)
        adventurer.increase_stat_upgrades_available(1);
        assert(adventurer.stat_upgrades_available == 1 + original_stat_points, 'stat points should be +1');

        // max stat upgrade value case
        adventurer.increase_stat_upgrades_available(MAX_STAT_UPGRADES_AVAILABLE);
        assert(adventurer.stat_upgrades_available == MAX_STAT_UPGRADES_AVAILABLE, 'stat points should be max');

        // pack and unpack at max value to ensure our max values are correct for packing
        let packed = ImplAdventurer::pack(adventurer);
        let unpacked: Adventurer = ImplAdventurer::unpack(packed);
        assert(unpacked.stat_upgrades_available == MAX_STAT_UPGRADES_AVAILABLE, 'stat point should still be max');
    }

    #[test]
    #[available_gas(449564)]
    fn get_equipped_items() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        let starting_equipment = adventurer.get_equipped_items();
        assert(starting_equipment.len() == 1, 'adventurer starts with 1 item');
        assert(*starting_equipment.at(0).id == ItemId::Wand, 'adventurer starts with wand');

        // equip chest armor
        let chest = Item { id: ItemId::DivineRobe, xp: 1 };
        adventurer.equipment.equip_chest_armor(chest, ImplLoot::get_slot(chest.id));

        // assert we now have two items equipped
        let equipped_items = adventurer.get_equipped_items();
        assert(equipped_items.len() == 2, 'should have 2 items equipped');
        assert(*equipped_items.at(0).id == ItemId::Wand, 'should have wand equipped');
        assert(*equipped_items.at(1).id == ItemId::DivineRobe, 'should have robe equipped');

        // equip head armor
        let head = Item { id: ItemId::Crown, xp: 1 };
        adventurer.equipment.equip_head_armor(head, ImplLoot::get_slot(head.id));

        // assert we now have three items equipped
        let equipped_items = adventurer.get_equipped_items();
        assert(equipped_items.len() == 3, 'should have 3 items equipped');
        assert(*equipped_items.at(0).id == ItemId::Wand, 'should have wand equipped');
        assert(*equipped_items.at(1).id == ItemId::DivineRobe, 'should have robe equipped');
        assert(*equipped_items.at(2).id == ItemId::Crown, 'should have crown equipped');

        // equip waist armor
        let waist = Item { id: ItemId::DemonhideBelt, xp: 1 };
        adventurer.equipment.equip_waist_armor(waist, ImplLoot::get_slot(waist.id));

        // assert we now have four items equipped
        let equipped_items = adventurer.get_equipped_items();
        assert(equipped_items.len() == 4, 'should have 4 items equipped');
        assert(*equipped_items.at(0).id == ItemId::Wand, 'should have wand equipped');
        assert(*equipped_items.at(1).id == ItemId::DivineRobe, 'should have robe equipped');
        assert(*equipped_items.at(2).id == ItemId::Crown, 'should have crown equipped');
        assert(*equipped_items.at(3).id == ItemId::DemonhideBelt, 'should have belt equipped');

        // equip foot armor
        let foot = Item { id: ItemId::LeatherBoots, xp: 1 };
        adventurer.equipment.equip_foot_armor(foot, ImplLoot::get_slot(foot.id));

        // assert we now have five items equipped
        let equipped_items = adventurer.get_equipped_items();
        assert(equipped_items.len() == 5, 'should have 5 items equipped');
        assert(*equipped_items.at(0).id == ItemId::Wand, 'should have wand equipped');
        assert(*equipped_items.at(1).id == ItemId::DivineRobe, 'should have robe equipped');
        assert(*equipped_items.at(2).id == ItemId::Crown, 'should have crown equipped');
        assert(*equipped_items.at(3).id == ItemId::DemonhideBelt, 'should have belt equipped');
        assert(*equipped_items.at(4).id == ItemId::LeatherBoots, 'should have boots equipped');

        // equip hand armor
        let hand = Item { id: ItemId::LeatherGloves, xp: 1 };
        adventurer.equipment.equip_hand_armor(hand, ImplLoot::get_slot(hand.id));

        // assert we now have six items equipped
        let equipped_items = adventurer.get_equipped_items();
        assert(equipped_items.len() == 6, 'should have 6 items equipped');
        assert(*equipped_items.at(0).id == ItemId::Wand, 'should have wand equipped');
        assert(*equipped_items.at(1).id == ItemId::DivineRobe, 'should have robe equipped');
        assert(*equipped_items.at(2).id == ItemId::Crown, 'should have crown equipped');
        assert(*equipped_items.at(3).id == ItemId::DemonhideBelt, 'should have belt equipped');
        assert(*equipped_items.at(4).id == ItemId::LeatherBoots, 'should have boots equipped');
        assert(*equipped_items.at(5).id == ItemId::LeatherGloves, 'should have gloves equipped');

        // equip necklace
        let neck = Item { id: ItemId::Amulet, xp: 1 };
        adventurer.equipment.equip_necklace(neck, ImplLoot::get_slot(neck.id));

        // assert we now have seven items equipped
        let equipped_items = adventurer.get_equipped_items();
        assert(equipped_items.len() == 7, 'should have 7 items equipped');
        assert(*equipped_items.at(0).id == ItemId::Wand, 'should have wand equipped');
        assert(*equipped_items.at(1).id == ItemId::DivineRobe, 'should have robe equipped');
        assert(*equipped_items.at(2).id == ItemId::Crown, 'should have crown equipped');
        assert(*equipped_items.at(3).id == ItemId::DemonhideBelt, 'should have belt equipped');
        assert(*equipped_items.at(4).id == ItemId::LeatherBoots, 'should have boots equipped');
        assert(*equipped_items.at(5).id == ItemId::LeatherGloves, 'should have gloves equipped');
        assert(*equipped_items.at(6).id == ItemId::Amulet, 'should have amulet equipped');

        // equip ring
        let ring = Item { id: ItemId::GoldRing, xp: 1 };
        adventurer.equipment.equip_ring(ring, ImplLoot::get_slot(ring.id));

        // assert we now have eight items equipped
        let equipped_items = adventurer.get_equipped_items();
        assert(equipped_items.len() == 8, 'should have 8 items equipped');
        assert(*equipped_items.at(0).id == ItemId::Wand, 'should have wand equipped');
        assert(*equipped_items.at(1).id == ItemId::DivineRobe, 'should have robe equipped');
        assert(*equipped_items.at(2).id == ItemId::Crown, 'should have crown equipped');
        assert(*equipped_items.at(3).id == ItemId::DemonhideBelt, 'should have belt equipped');
        assert(*equipped_items.at(4).id == ItemId::LeatherBoots, 'should have boots equipped');
        assert(*equipped_items.at(5).id == ItemId::LeatherGloves, 'should have gloves equipped');
        assert(*equipped_items.at(6).id == ItemId::Amulet, 'should have amulet equipped');
        assert(*equipped_items.at(7).id == ItemId::GoldRing, 'should have ring equipped');

        // equip a different weapon
        let weapon = Item { id: ItemId::Katana, xp: 1 };
        adventurer.equipment.equip_weapon(weapon, ImplLoot::get_slot(weapon.id));

        // assert we still have eight items equipped
        let equipped_items = adventurer.get_equipped_items();
        assert(equipped_items.len() == 8, 'should have 8 items equipped');
        assert(*equipped_items.at(0).id == ItemId::Katana, 'should have katana equipped');
        assert(*equipped_items.at(1).id == ItemId::DivineRobe, 'should have robe equipped');
        assert(*equipped_items.at(2).id == ItemId::Crown, 'should have crown equipped');
        assert(*equipped_items.at(3).id == ItemId::DemonhideBelt, 'should have belt equipped');
        assert(*equipped_items.at(4).id == ItemId::LeatherBoots, 'should have boots equipped');
        assert(*equipped_items.at(5).id == ItemId::LeatherGloves, 'should have gloves equipped');
        assert(*equipped_items.at(6).id == ItemId::Amulet, 'should have amulet equipped');
        assert(*equipped_items.at(7).id == ItemId::GoldRing, 'should have ring equipped');
    }

    #[test]
    #[available_gas(184944)]
    fn set_beast_health() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // base case
        adventurer.set_beast_health(100);
        assert(adventurer.beast_health == 100, 'wrong beast health');

        // overflow case
        adventurer.set_beast_health(65535);
        assert(adventurer.beast_health == BeastSettings::MAXIMUM_HEALTH, 'beast health should be max');
    }

    #[test]
    #[available_gas(194964)]
    fn deduct_beast_health() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // stage beast with 100
        adventurer.set_beast_health(100);

        // deduct 5 (base case)
        adventurer.deduct_beast_health(5);
        assert(adventurer.beast_health == 95, 'beast should have 95HP');

        // deduct 2^16 - 1 (overflow case)
        adventurer.deduct_beast_health(65535);
        assert(adventurer.beast_health == 0, 'beast should have 0HP');
    }

    #[test]
    #[available_gas(300000)]
    fn get_item_at_slot() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // stage items
        let weapon = Item { id: ItemId::Katana, xp: 1 };
        let chest = Item { id: ItemId::DivineRobe, xp: 1 };
        let head = Item { id: ItemId::Crown, xp: 1 };
        let waist = Item { id: ItemId::DemonhideBelt, xp: 1 };
        let foot = Item { id: ItemId::LeatherBoots, xp: 1 };
        let hand = Item { id: ItemId::LeatherGloves, xp: 1 };
        let neck = Item { id: ItemId::Amulet, xp: 1 };
        let ring = Item { id: ItemId::GoldRing, xp: 1 };

        // equip items
        adventurer.equipment.equip_weapon(weapon, ImplLoot::get_slot(weapon.id));
        adventurer.equipment.equip_chest_armor(chest, ImplLoot::get_slot(chest.id));
        adventurer.equipment.equip_head_armor(head, ImplLoot::get_slot(head.id));
        adventurer.equipment.equip_waist_armor(waist, ImplLoot::get_slot(waist.id));
        adventurer.equipment.equip_foot_armor(foot, ImplLoot::get_slot(foot.id));
        adventurer.equipment.equip_hand_armor(hand, ImplLoot::get_slot(hand.id));
        adventurer.equipment.equip_necklace(neck, ImplLoot::get_slot(neck.id));
        adventurer.equipment.equip_ring(ring, ImplLoot::get_slot(ring.id));

        // verify getting item by slot returns correct items
        assert(adventurer.equipment.get_item_at_slot(Slot::Weapon(())) == weapon, 'wrong weapon');
        assert(adventurer.equipment.get_item_at_slot(Slot::Chest(())) == chest, 'wrong chest armor');
        assert(adventurer.equipment.get_item_at_slot(Slot::Head(())) == head, 'wrong head armor');
        assert(adventurer.equipment.get_item_at_slot(Slot::Waist(())) == waist, 'wrong waist armor');
        assert(adventurer.equipment.get_item_at_slot(Slot::Foot(())) == foot, 'wrong foot armor');
        assert(adventurer.equipment.get_item_at_slot(Slot::Hand(())) == hand, 'wrong hand armor');
        assert(adventurer.equipment.get_item_at_slot(Slot::Neck(())) == neck, 'wrong necklace');
        assert(adventurer.equipment.get_item_at_slot(Slot::Ring(())) == ring, 'wrong ring');
    }

    #[test]
    #[available_gas(600000)]
    fn get_level() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        assert(adventurer.get_level() == 1, 'level should be 1');

        adventurer.xp = 4;
        assert(adventurer.get_level() == 2, 'level should be 2');

        adventurer.xp = 9;
        assert(adventurer.get_level() == 3, 'level should be 3');

        adventurer.xp = 16;
        assert(adventurer.get_level() == 4, 'level should be 4');

        // max xp available for packing (2^13 - 1)
        adventurer.xp = 8191;
        assert(adventurer.get_level() == 90, 'level should be 15');

        // max u16 value
        adventurer.xp = 65535;
        assert(adventurer.get_level() == 255, 'level should be 15');
    }

    #[test]
    #[available_gas(234224)]
    fn charisma_health_discount_overflow() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // max charisma
        adventurer.stats.charisma = 255;
        let discount = adventurer.charisma_adjusted_potion_price();
        assert(discount == MINIMUM_POTION_PRICE.into(), 'discount');

        // set charisma to 0
        adventurer.stats.charisma = 0;
        let discount = adventurer.charisma_adjusted_potion_price();
        assert(discount == MINIMUM_POTION_PRICE.into() * adventurer.get_level().into(), 'no charisma potion');
    }

    #[test]
    #[available_gas(234524)]
    fn charisma_item_discount_overflow() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item_price = 15;

        // no charisma case
        adventurer.stats.charisma = 0;
        assert(adventurer.stats.charisma_adjusted_item_price(item_price) == 15, 'should be no discount');

        // small discount case
        adventurer.stats.charisma = 1;
        assert(
            adventurer.stats.charisma_adjusted_item_price(item_price) == item_price - CHARISMA_ITEM_DISCOUNT.into(),
            'wrong discounted price',
        );

        // underflow case
        adventurer.stats.charisma = 255;
        assert(
            adventurer.stats.charisma_adjusted_item_price(item_price) == MINIMUM_ITEM_PRICE.into(),
            'item should be min price',
        );
    }

    #[test]
    #[available_gas(256224)]
    fn increase_xp() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // increase adventurer xp by 3 which should level up the adventurer
        adventurer.increase_adventurer_xp(4);
        assert(adventurer.get_level() == 2, 'advtr should be lvl 2');

        // double level up without spending previous stat point
        adventurer.increase_adventurer_xp(12);
        assert(adventurer.get_level() == 4, 'advtr should be lvl 4');
    }

    #[test]
    #[available_gas(293884)]
    fn apply_suffix_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Power);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Power);
        assert(adventurer.stats.strength == 3, 'strength should be 3');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');

        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Giant);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Giant);
        assert(adventurer.stats.strength == 3, 'strength should be 3');
        assert(adventurer.stats.vitality == 3, 'vitality should be 3');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');

        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Perfection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Perfection);
        assert(adventurer.stats.strength == 4, 'strength should be 4');
        assert(adventurer.stats.vitality == 4, 'vitality should be 4');
        assert(adventurer.stats.dexterity == 1, 'dexterity should be 1');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');

        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Rage);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Rage);
        assert(adventurer.stats.strength == 5, 'strength should be 5');
        assert(adventurer.stats.vitality == 4, 'vitality should be 4');
        assert(adventurer.stats.dexterity == 1, 'dexterity should be 1');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 1, 'wisdom should be 1');
        assert(adventurer.stats.charisma == 1, 'charisma should be 1');

        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Fury);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Fury);
        assert(adventurer.stats.strength == 5, 'strength should be 5');
        assert(adventurer.stats.vitality == 5, 'vitality should be 5');
        assert(adventurer.stats.dexterity == 1, 'dexterity should be 1');
        assert(adventurer.stats.intelligence == 1, 'intelligence should be 1');
        assert(adventurer.stats.wisdom == 1, 'wisdom should be 1');
        assert(adventurer.stats.charisma == 2, 'charisma should be 2');
    }

    #[test]
    #[available_gas(1900000)]
    fn remove_suffix_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.strength = 4;
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Power);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Power);
        assert(adventurer.stats.strength == 1, 'strength should be 1');
    }

    #[test]
    fn apply_power_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Power);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Power);
        assert(adventurer.stats.strength == 3, 'strength should be 3');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_giant_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Giant);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Giant);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 3, 'vitality should be 3');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_skill_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Skill);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Skill);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 3, 'dexterity should be 3');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_perfection_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Perfection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Perfection);
        assert(adventurer.stats.strength == 1, 'strength should be 1');
        assert(adventurer.stats.vitality == 1, 'vitality should be 1');
        assert(adventurer.stats.dexterity == 1, 'dexterity should be 1');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_brilliance_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Brilliance);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Brilliance);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 3, 'intelligence should be 3');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_enlightenment_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Enlightenment);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Enlightenment);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 3, 'wisdom should be 3');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_protection_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Protection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Protection);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 2, 'vitality should be 2');
        assert(adventurer.stats.dexterity == 1, 'dexterity should be 1');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_anger_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Anger);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Anger);
        assert(adventurer.stats.strength == 2, 'strength should be 2');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 1, 'dexterity should be 1');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_rage_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Rage);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Rage);
        assert(adventurer.stats.strength == 1, 'strength should be 1');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 1, 'wisdom should be 1');
        assert(adventurer.stats.charisma == 1, 'charisma should be 1');
    }

    #[test]
    fn apply_fury_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Fury);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Fury);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 1, 'vitality should be 1');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 1, 'intelligence should be 1');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 1, 'charisma should be 1');
    }

    #[test]
    fn apply_vitriol_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Vitriol);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Vitriol);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 2, 'intelligence should be 2');
        assert(adventurer.stats.wisdom == 1, 'wisdom should be 1');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_fox_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_the_Fox);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_the_Fox);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 2, 'dexterity should be 2');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 1, 'charisma should be 1');
    }

    #[test]
    fn apply_detection_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Detection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Detection);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 1, 'dexterity should be 1');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 2, 'wisdom should be 2');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_reflection_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Reflection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Reflection);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 1, 'intelligence should be 1');
        assert(adventurer.stats.wisdom == 2, 'wisdom should be 2');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_twins_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_the_Twins);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_the_Twins);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 3, 'charisma should be 3');
    }

    #[test]
    fn apply_and_remove_power_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Power);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Power);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Power);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Power);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_giant_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Giant);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Giant);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Giant);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Giant);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_titans_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Titans);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Titans);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Titans);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Titans);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_skill_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Skill);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Skill);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Skill);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Skill);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_perfection_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Perfection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Perfection);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Perfection);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Perfection);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_brilliance_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Brilliance);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Brilliance);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Brilliance);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Brilliance);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_enlightenment_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Enlightenment);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Enlightenment);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Enlightenment);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Enlightenment);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_protection_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Protection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Protection);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Protection);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Protection);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_anger_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Anger);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Anger);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Anger);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Anger);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_rage_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Rage);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Rage);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Rage);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Rage);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_fury_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Fury);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Fury);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Fury);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Fury);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_vitriol_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Vitriol);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Vitriol);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Vitriol);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Vitriol);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_fox_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_the_Fox);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_the_Fox);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_the_Fox);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_the_Fox);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_detection_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Detection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Detection);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Detection);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Detection);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_reflection_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_Reflection);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_Reflection);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_Reflection);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_Reflection);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn apply_and_remove_twins_boost() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        adventurer.stats.apply_suffix_boost(ItemSuffix::of_the_Twins);
        adventurer.stats.apply_bag_boost(ItemSuffix::of_the_Twins);
        adventurer.stats.remove_suffix_boost(ItemSuffix::of_the_Twins);
        adventurer.stats.remove_bag_boost(ItemSuffix::of_the_Twins);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn get_and_apply_stats() {
        let mut adventurer = Adventurer {
            health: 100,
            xp: 1,
            stats: Stats { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0 },
            gold: 40,
            equipment: Equipment {
                weapon: Item { id: ItemId::Wand, xp: 225 },
                chest: Item { id: ItemId::DivineRobe, xp: 65535 },
                head: Item { id: ItemId::DivineHood, xp: 225 },
                waist: Item { id: ItemId::BrightsilkSash, xp: 225 },
                foot: Item { id: ItemId::DivineSlippers, xp: 1000 },
                hand: Item { id: ItemId::DivineGloves, xp: 224 },
                neck: Item { id: ItemId::Amulet, xp: 1 },
                ring: Item { id: ItemId::GoldRing, xp: 1 },
            },
            beast_health: 20,
            stat_upgrades_available: 0,
            action_count: 0,
            item_specials_seed: 0,
        };

        let stat_boosts = adventurer.equipment.get_stat_boosts(1);
        assert(stat_boosts.strength == 1, 'wrong strength');
        assert(stat_boosts.vitality == 2, 'wrong vitality');
        assert(stat_boosts.dexterity == 4, 'wrong dexterity');
        assert(stat_boosts.intelligence == 2, 'wrong intelligence');
        assert(stat_boosts.wisdom == 5, 'wrong wisdom');
        assert(stat_boosts.charisma == 1, 'wrong charisma');
        assert(stat_boosts.luck == 0, 'wrong luck');
    }

    // test base case
    #[test]
    #[available_gas(207524)]
    fn apply_stats() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        let boost_stats = Stats {
            strength: 5, dexterity: 1, vitality: 5, intelligence: 1, wisdom: 1, charisma: 2, luck: 1,
        };

        adventurer.stats.apply_stats(boost_stats);
        assert(adventurer.stats.strength == 5, 'strength should be 5');
        assert(adventurer.stats.dexterity == 1, 'dexterity should be 1');
        assert(adventurer.stats.vitality == 5, 'vitality should be 5');

        assert(adventurer.stats.intelligence == 1, 'intelligence should be 1');
        assert(adventurer.stats.wisdom == 1, 'wisdom should be 1');
        assert(adventurer.stats.charisma == 2, 'charisma should be 2');
    }

    // test zero case
    #[test]
    #[available_gas(207524)]
    fn apply_stats_zero() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        let boost_stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };

        adventurer.stats.apply_stats(boost_stats);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    // test max value case
    #[test]
    #[available_gas(207524)]
    fn apply_stats_max() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let boost_stats = Stats {
            strength: 255, dexterity: 255, vitality: 255, intelligence: 255, wisdom: 255, charisma: 255, luck: 255,
        };

        adventurer.stats.apply_stats(boost_stats);
        assert(adventurer.stats.strength == 255, 'strength should be max');
        assert(adventurer.stats.dexterity == 255, 'dexterity should be max');
        assert(adventurer.stats.vitality == 255, 'vitality should be max');
        assert(adventurer.stats.intelligence == 255, 'intelligence should be max');
        assert(adventurer.stats.wisdom == 255, 'wisdom should be max');
        assert(adventurer.stats.charisma == 255, 'charisma should be max');
    }

    // base case
    #[test]
    #[available_gas(53430)]
    fn remove_stats() {
        let mut adventurer = Adventurer {
            health: 100,
            xp: 1,
            stats: Stats { strength: 5, dexterity: 4, vitality: 3, intelligence: 2, wisdom: 1, charisma: 0, luck: 0 },
            gold: 40,
            equipment: Equipment {
                weapon: Item { id: 1, xp: 225 },
                chest: Item { id: 2, xp: 65535 },
                head: Item { id: 3, xp: 225 },
                waist: Item { id: 4, xp: 225 },
                foot: Item { id: 5, xp: 1000 },
                hand: Item { id: 6, xp: 224 },
                neck: Item { id: 7, xp: 1 },
                ring: Item { id: 8, xp: 1 },
            },
            beast_health: 20,
            stat_upgrades_available: 0,
            item_specials_seed: 0,
            action_count: 0,
        };

        let boost_stats = Stats {
            strength: 5, dexterity: 4, vitality: 3, intelligence: 2, wisdom: 1, charisma: 0, luck: 1,
        };

        adventurer.stats.remove_stats(boost_stats);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    // zero case
    #[test]
    #[available_gas(53430)]
    fn remove_stats_zero() {
        let mut adventurer = Adventurer {
            health: 100,
            xp: 1,
            stats: Stats { strength: 5, dexterity: 4, vitality: 3, intelligence: 2, wisdom: 1, charisma: 0, luck: 0 },
            gold: 40,
            equipment: Equipment {
                weapon: Item { id: 1, xp: 225 },
                chest: Item { id: 2, xp: 65535 },
                head: Item { id: 3, xp: 225 },
                waist: Item { id: 4, xp: 225 },
                foot: Item { id: 5, xp: 1000 },
                hand: Item { id: 6, xp: 224 },
                neck: Item { id: 7, xp: 1 },
                ring: Item { id: 8, xp: 1 },
            },
            beast_health: 20,
            stat_upgrades_available: 0,
            item_specials_seed: 0,
            action_count: 0,
        };

        let boost_stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };

        adventurer.stats.remove_stats(boost_stats);
        assert(adventurer.stats.strength == 5, 'strength should be 5');
        assert(adventurer.stats.dexterity == 4, 'dexterity should be 4');
        assert(adventurer.stats.vitality == 3, 'vitality should be 3');
        assert(adventurer.stats.intelligence == 2, 'intelligence should be 2');
        assert(adventurer.stats.wisdom == 1, 'wisdom should be 1');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    // max values case
    #[test]
    fn remove_stats_max() {
        let mut adventurer = Adventurer {
            health: 100,
            xp: 1,
            stats: Stats {
                strength: 255, dexterity: 255, vitality: 255, intelligence: 255, wisdom: 255, charisma: 255, luck: 0,
            },
            gold: 40,
            equipment: Equipment {
                weapon: Item { id: 1, xp: 225 },
                chest: Item { id: 2, xp: 65535 },
                head: Item { id: 3, xp: 225 },
                waist: Item { id: 4, xp: 225 },
                foot: Item { id: 5, xp: 1000 },
                hand: Item { id: 6, xp: 224 },
                neck: Item { id: 7, xp: 1 },
                ring: Item { id: 8, xp: 1 },
            },
            beast_health: 20,
            stat_upgrades_available: 0,
            item_specials_seed: 0,
            action_count: 0,
        };

        let boost_stats = Stats {
            strength: 255, dexterity: 255, vitality: 255, intelligence: 255, wisdom: 255, charisma: 255, luck: 255,
        };

        adventurer.stats.remove_stats(boost_stats);
        assert(adventurer.stats.strength == 0, 'strength should be 0');
        assert(adventurer.stats.dexterity == 0, 'dexterity should be 0');
        assert(adventurer.stats.vitality == 0, 'vitality should be 0');
        assert(adventurer.stats.intelligence == 0, 'intelligence should be 0');
        assert(adventurer.stats.wisdom == 0, 'wisdom should be 0');
        assert(adventurer.stats.charisma == 0, 'charisma should be 0');
    }

    #[test]
    fn get_discovery() {
        let adventurer_level = 1;
        let mut discovery_rnd = 1;
        let mut discovery_amount_rnd1 = 2;
        let mut discovery_amount_rnd2 = 3;

        // discover gold
        let discovery_type = ImplAdventurer::get_discovery(
            adventurer_level, discovery_rnd, discovery_amount_rnd1, discovery_amount_rnd2,
        );
        assert(discovery_type == DiscoveryType::Gold((1)), 'should have found gold');

        // discover health
        discovery_rnd = 140;
        let discovery_type = ImplAdventurer::get_discovery(
            adventurer_level, discovery_rnd, discovery_amount_rnd1, discovery_amount_rnd2,
        );
        assert(discovery_type == DiscoveryType::Health((2)), 'should have found health');

        // discover nonrare loot (low rn)
        discovery_rnd = 255;
        let discovery_type = ImplAdventurer::get_discovery(
            adventurer_level, discovery_rnd, discovery_amount_rnd1, discovery_amount_rnd2,
        );
        match discovery_type {
            DiscoveryType::Loot(item_id) => {
                let mut t5_items = ItemUtils::get_t5_items();
                loop {
                    match t5_items.pop_front() {
                        Option::Some(t5_item) => { if item_id == *t5_item {
                            break;
                        } },
                        Option::None(_) => { panic_with_felt252('should have found t5 loot'); },
                    };
                }
            },
            _ => panic_with_felt252('should have found t4 loot'),
        }

        // increase discovery amount rnd1 above 50% of u8 range to get to next loot tier
        discovery_amount_rnd1 = 128;
        let discovery_type = ImplAdventurer::get_discovery(
            adventurer_level, discovery_rnd, discovery_amount_rnd1, discovery_amount_rnd2,
        );
        match discovery_type {
            DiscoveryType::Loot(item_id) => {
                let mut t5_items = ItemUtils::get_t4_items();
                loop {
                    match t5_items.pop_front() {
                        Option::Some(t5_item) => { if item_id == *t5_item {
                            break;
                        } },
                        Option::None(_) => { panic_with_felt252('should have found t4 loot'); },
                    };
                }
            },
            _ => panic_with_felt252('should have found t4 loot'),
        }

        // increase discovery amount rnd1 above 80% of u8 range (255) to get to next loot tier
        discovery_amount_rnd1 = 204;
        let discovery_type = ImplAdventurer::get_discovery(
            adventurer_level, discovery_rnd, discovery_amount_rnd1, discovery_amount_rnd2,
        );
        match discovery_type {
            DiscoveryType::Loot(item_id) => {
                let mut t5_items = ItemUtils::get_t3_items();
                loop {
                    match t5_items.pop_front() {
                        Option::Some(t5_item) => { if item_id == *t5_item {
                            break;
                        } },
                        Option::None(_) => { panic_with_felt252('should have found t3 loot'); },
                    };
                }
            },
            _ => panic_with_felt252('should have found t3 loot'),
        }

        // increase discovery amount rnd1 above 92% of u8 range (255) to get to next loot tier
        discovery_amount_rnd1 = 235;
        let discovery_type = ImplAdventurer::get_discovery(
            adventurer_level, discovery_rnd, discovery_amount_rnd1, discovery_amount_rnd2,
        );
        match discovery_type {
            DiscoveryType::Loot(item_id) => {
                let mut t5_items = ItemUtils::get_t2_items();
                loop {
                    match t5_items.pop_front() {
                        Option::Some(t5_item) => { if item_id == *t5_item {
                            break;
                        } },
                        Option::None(_) => { panic_with_felt252('should have found t2 loot'); },
                    };
                }
            },
            _ => panic_with_felt252('should have found t2 loot'),
        }

        // increase discovery amount rnd1 above 98% of u8 range (255) to get to next loot tier
        discovery_amount_rnd1 = 250;
        let discovery_type = ImplAdventurer::get_discovery(
            adventurer_level, discovery_rnd, discovery_amount_rnd1, discovery_amount_rnd2,
        );
        match discovery_type {
            DiscoveryType::Loot(item_id) => {
                let mut t5_items = ItemUtils::get_t1_items();
                loop {
                    match t5_items.pop_front() {
                        Option::Some(t5_item) => { if item_id == *t5_item {
                            break;
                        } },
                        Option::None(_) => { panic_with_felt252('should have found t1 loot'); },
                    };
                }
            },
            _ => panic_with_felt252('should have found t1 loot'),
        }
    }

    #[test]
    #[available_gas(698414)]
    fn calculate_luck() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let bag = ImplBag::new();
        assert(adventurer.equipment.calculate_luck(bag) == 2, 'start with 2 luck');

        // equip a greatness 1 necklace
        let neck = Item { id: ItemId::Amulet, xp: 1 };
        adventurer.equipment.equip_necklace(neck, ImplLoot::get_slot(neck.id));
        assert(adventurer.equipment.calculate_luck(bag) == 2, 'still 2 luck');

        // equip a greatness 1 ring
        let ring = Item { id: ItemId::GoldRing, xp: 1 };
        adventurer.equipment.equip_ring(ring, ImplLoot::get_slot(ring.id));
        assert(adventurer.equipment.calculate_luck(bag) == 2, 'still 2 luck');

        // equip a greatness 19 silver ring
        let mut silver_ring = Item { id: ItemId::SilverRing, xp: 399 };
        adventurer.equipment.equip_ring(silver_ring, ImplLoot::get_slot(silver_ring.id));
        assert(adventurer.equipment.calculate_luck(bag) == 39, 'should be 39 luck');

        // increase silver ring to greatness 20 to unlock extra 20 luck
        adventurer.equipment.ring.xp = 400;
        assert(adventurer.equipment.calculate_luck(bag) == 41, 'should be 41 luck');

        // overflow case
        adventurer.equipment.ring.xp = 65535;
        adventurer.equipment.neck.xp = 65535;
        assert(
            adventurer.equipment.calculate_luck(bag) == (ITEM_MAX_GREATNESS * 2) + SILVER_RING_G20_LUCK_BONUS,
            'should be 60 luck',
        );
    }

    #[test]
    #[available_gas(177984)]
    fn in_battle() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        assert(adventurer.in_battle() == true, 'new advntr start in battle');

        adventurer.beast_health = 0;
        assert(adventurer.in_battle() == false, 'advntr not in battle');

        // overflow check
        adventurer.beast_health = 65535;
        assert(adventurer.in_battle() == true, 'advntr in battle');
    }

    #[test]
    #[available_gas(421224)]
    fn is_ambush() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // without any wisdom, should get ambushed by all entropy
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 1),
            'no wisdom should get ambushed',
        );
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 2),
            'no wisdom should get ambushed',
        );
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 3),
            'no wisdom should get ambushed',
        );
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 4),
            'no wisdom should get ambushed',
        );
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 5),
            'no wisdom should get ambushed',
        );

        // level 1 adventurer with 1 wisdom should never get ambushed
        adventurer.stats.wisdom = 1;
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 1),
            'wise adventurer avoids ambush',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 2),
            'wise adventurer avoids ambush',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 3),
            'wise adventurer avoids ambush',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 4),
            'wise adventurer avoids ambush',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 5),
            'wise adventurer avoids ambush',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 6),
            'wise adventurer avoids ambush',
        );

        // increase adventurer to level 2, now chance is 50% so they will not be ambushed
        // for the bottom half of the u8 range (0-127)
        adventurer.xp = 4;
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 1),
            'should not be ambushed 1',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 2),
            'should not be ambushed 2',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 3),
            'should not be ambushed 3',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 4),
            'should not be ambushed 4',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 5),
            'should not be ambushed 5',
        );
        assert(
            !ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 127),
            'should not be ambushed 127',
        );
        // for the top half of the u8 range (128-255)
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 128), 'should be ambushed 128',
        );
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 129), 'should be ambushed 129',
        );
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 254), 'should be ambushed 254',
        );
        assert(
            ImplAdventurer::is_ambushed(adventurer.get_level(), adventurer.stats.wisdom, 255), 'should be ambushed 255',
        );
    }

    #[test]
    fn get_gold_discovery() {
        let adventurer_level = 1;
        let entropy = 0;
        let gold_discovery = ImplAdventurer::get_gold_discovery(adventurer_level, entropy);
        assert(gold_discovery == 1, 'gold_discovery should be 1');
    }

    #[test]
    fn get_health_discovery() {
        let adventurer_level = 1;
        let entropy = 0;
        let discovery_amount = ImplAdventurer::get_health_discovery(adventurer_level, entropy);
        assert(discovery_amount == 2, 'health discovery should be 2');
    }

    fn is_item_in_set(item_id: u8, ref item_set: Span<u8>) -> bool {
        loop {
            match item_set.pop_front() {
                Option::Some(item) => { if item_id == (*item).into() {
                    break true;
                } },
                Option::None(_) => { break false; },
            };
        }
    }

    #[test]
    fn is_item_in_set_found() {
        let mut item_set = array![ItemId::Cap, ItemId::Club, ItemId::Sash];
        let item_id: u8 = ItemId::Club.into();
        let mut item_set_span = item_set.span();
        assert(is_item_in_set(item_id, ref item_set_span), 'Item should be in set');
    }

    #[test]
    fn is_item_in_set_not_found() {
        let mut item_set = array![ItemId::Cap, ItemId::Club, ItemId::Sash];
        let item_id: u8 = ItemId::Helm.into();
        let mut item_set_span = item_set.span();
        assert(!is_item_in_set(item_id, ref item_set_span), 'Item should not be in set');
    }

    #[test]
    fn is_item_in_set_empty_set() {
        let mut item_set = array![];
        let item_id: u8 = ItemId::Cap.into();
        let mut item_set_span = item_set.span();
        assert(!is_item_in_set(item_id, ref item_set_span), 'Item should not be in empty set');
    }

    #[test]
    fn is_item_in_set_single_item_found() {
        let mut item_set = array![ItemId::Cap];
        let item_id: u8 = ItemId::Cap.into();
        let mut item_set_span = item_set.span();
        assert(is_item_in_set(item_id, ref item_set_span), 'Single item should be in set');
    }

    #[test]
    fn is_item_in_set_single_item_not_found() {
        let mut item_set = array![ItemId::Cap];
        let item_id: u8 = ItemId::Club.into();
        let mut item_set_span = item_set.span();
        assert(!is_item_in_set(item_id, ref item_set_span), 'Single item should not be set');
    }

    #[test]
    fn loot_discovery_distribution() {
        let mut t5_count: u32 = 0;
        let mut t4_count: u32 = 0;
        let mut t3_count: u32 = 0;
        let mut t2_count: u32 = 0;
        let mut t1_count: u32 = 0;

        let mut rnd1: u8 = 0;
        let rnd2: u8 = 0;
        loop {
            if rnd1 == 255 {
                break;
            }

            let mut t5_items = ItemUtils::get_t5_items();
            let mut t4_items = ItemUtils::get_t4_items();
            let mut t3_items = ItemUtils::get_t3_items();
            let mut t2_items = ItemUtils::get_t2_items();
            let mut t1_items = ItemUtils::get_t1_items();
            let mut jewlery_items = ItemUtils::get_jewelry_items();

            let item_id = ImplAdventurer::get_loot_discovery(rnd1, rnd2);

            assert(!is_item_in_set(item_id, ref jewlery_items), 'No finding jewlery');

            if is_item_in_set(item_id, ref t5_items) {
                t5_count += 1;
            } else if is_item_in_set(item_id, ref t4_items) {
                t4_count += 1;
            } else if is_item_in_set(item_id, ref t3_items) {
                t3_count += 1;
            } else if is_item_in_set(item_id, ref t2_items) {
                t2_count += 1;
            } else if is_item_in_set(item_id, ref t1_items) {
                t1_count += 1;
            }

            rnd1 += 1;
        };

        // assert T5 is greater than T4 is greater than T3 is greater than T2 is greater than T1
        assert(t5_count > t4_count, 'T5 should be more than T4');
        assert(t4_count > t3_count, 'T4 should be more than T3');
        assert(t3_count > t2_count, 'T3 should be more than T2');
        assert(t2_count > t1_count, 'T2 should be more than T1');

        // generate percentages
        let total_count = t5_count + t4_count + t3_count + t2_count + t1_count;
        let t5_percentage = (t5_count * 100) / total_count;
        let t4_percentage = (t4_count * 100) / total_count;
        let t3_percentage = (t3_count * 100) / total_count;
        let t2_percentage = (t2_count * 100) / total_count;
        let t1_percentage = (t1_count * 100) / total_count;

        // print percentages
        // println!("T5: {}%", t5_percentage);
        // println!("T4: {}%", t4_percentage);
        // println!("T3: {}%", t3_percentage);
        // println!("T2: {}%", t2_percentage);
        // println!("T1: {}%", t1_percentage);

        // verify distribution
        assert(t5_percentage == 49, 'wrong t5 percentage');
        assert(t4_percentage == 29, 'wrong t4 percentage');
        assert(t3_percentage == 12, 'wrong t3 percentage');
        assert(t2_percentage == 5, 'wrong t2 percentage');
        assert(t1_percentage == 2, 'wrong t1 percentage');
    }

    #[test]
    fn get_random_discovery_distribution() {
        let mut gold_count: u32 = 0;
        let mut health_count: u32 = 0;
        let mut loot_count: u32 = 0;

        let mut adventurer_level = 1;
        let mut discovery_type_rnd: u8 = 0;

        loop {
            if adventurer_level == 50 {
                break;
            }

            loop {
                if discovery_type_rnd == 255 {
                    break;
                }

                let discovery_type = ImplAdventurer::get_discovery(adventurer_level, discovery_type_rnd, 1, 1);

                match discovery_type {
                    DiscoveryType::Gold(_) => { gold_count += 1; },
                    DiscoveryType::Health(_) => { health_count += 1; },
                    DiscoveryType::Loot(_) => { loot_count += 1; },
                }

                discovery_type_rnd += 1;
            };
            discovery_type_rnd = 0;
            adventurer_level += 1;
        };

        // Calculate total count
        let total_count = gold_count + health_count + loot_count;

        // Calculate percentages
        let gold_percentage = (gold_count * 100) / total_count;
        let health_percentage = (health_count * 100) / total_count;
        let loot_percentage = (loot_count * 100) / total_count;

        // print percentages
        // println!("Gold: {}%", gold_percentage);
        // println!("Health: {}%", health_percentage);
        // println!("Loot: {}%", loot_percentage);

        // Verify percentages
        assert(gold_percentage == 44, 'wrong gold percentage');
        assert(health_percentage == 45, 'wrong health percentage');
        assert(loot_percentage == 10, 'wrong loot percentage');
    }

    #[test]
    fn get_item_simple() {
        let equipment = Equipment {
            weapon: Item { id: ItemId::Katana, xp: 15 },
            chest: Item { id: ItemId::DivineRobe, xp: 25 },
            head: Item { id: ItemId::Crown, xp: 35 },
            waist: Item { id: ItemId::BrightsilkSash, xp: 45 },
            foot: Item { id: ItemId::DivineSlippers, xp: 55 },
            hand: Item { id: ItemId::DivineGloves, xp: 65 },
            neck: Item { id: ItemId::Amulet, xp: 75 },
            ring: Item { id: ItemId::GoldRing, xp: 85 },
        };

        let item = equipment.get_item(ItemId::Katana);
        assert(item.id == ItemId::Katana, 'wrong item id');
        assert(item.xp == 15, 'wrong item xp');
    }

    #[test]
    fn get_item_extended() {
        let equipment = Equipment {
            weapon: Item { id: ItemId::Katana, xp: 15 },
            chest: Item { id: ItemId::DivineRobe, xp: 25 },
            head: Item { id: ItemId::Crown, xp: 35 },
            waist: Item { id: ItemId::BrightsilkSash, xp: 45 },
            foot: Item { id: ItemId::DivineSlippers, xp: 55 },
            hand: Item { id: ItemId::DivineGloves, xp: 65 },
            neck: Item { id: ItemId::Amulet, xp: 75 },
            ring: Item { id: ItemId::GoldRing, xp: 85 },
        };

        let weapon = equipment.get_item(ItemId::Katana);
        assert(weapon.id == ItemId::Katana, 'wrong weapon id');
        assert(weapon.xp == 15, 'wrong weapon xp');
        assert(ImplLoot::get_slot(weapon.id) == Slot::Weapon, 'wrong weapon slot');

        let chest = equipment.get_item(ItemId::DivineRobe);
        assert(chest.id == ItemId::DivineRobe, 'wrong chest id');
        assert(chest.xp == 25, 'wrong chest xp');
        assert(ImplLoot::get_slot(chest.id) == Slot::Chest, 'wrong chest slot');

        let head = equipment.get_item(ItemId::Crown);
        assert(head.id == ItemId::Crown, 'wrong head id');
        assert(head.xp == 35, 'wrong head xp');
        assert(ImplLoot::get_slot(head.id) == Slot::Head, 'wrong head slot');

        let waist = equipment.get_item(ItemId::BrightsilkSash);
        assert(waist.id == ItemId::BrightsilkSash, 'wrong waist id');
        assert(waist.xp == 45, 'wrong waist xp');
        assert(ImplLoot::get_slot(waist.id) == Slot::Waist, 'wrong waist slot');

        let foot = equipment.get_item(ItemId::DivineSlippers);
        assert(foot.id == ItemId::DivineSlippers, 'wrong foot id');
        assert(foot.xp == 55, 'wrong foot xp');
        assert(ImplLoot::get_slot(foot.id) == Slot::Foot, 'wrong foot slot');

        let hand = equipment.get_item(ItemId::DivineGloves);
        assert(hand.id == ItemId::DivineGloves, 'wrong hand id');
        assert(hand.xp == 65, 'wrong hand xp');
        assert(ImplLoot::get_slot(hand.id) == Slot::Hand, 'wrong hand slot');

        let neck = equipment.get_item(ItemId::Amulet);
        assert(neck.id == ItemId::Amulet, 'wrong neck id');
        assert(neck.xp == 75, 'wrong neck xp');
        assert(ImplLoot::get_slot(neck.id) == Slot::Neck, 'wrong neck slot');

        let ring = equipment.get_item(ItemId::GoldRing);
        assert(ring.id == ItemId::GoldRing, 'wrong ring id');
        assert(ring.xp == 85, 'wrong ring xp');
        assert(ImplLoot::get_slot(ring.id) == Slot::Ring, 'wrong ring slot');
    }

    #[test]
    fn get_item_no_match() {
        let equipment = Equipment {
            weapon: Item { id: 10, xp: 10 },
            chest: Item { id: 20, xp: 20 },
            head: Item { id: 30, xp: 30 },
            waist: Item { id: 40, xp: 40 },
            foot: Item { id: 50, xp: 50 },
            hand: Item { id: 60, xp: 60 },
            neck: Item { id: 70, xp: 70 },
            ring: Item { id: 80, xp: 80 },
        };

        assert(equipment.get_item(255).id == 0, 'should be item id 0');
        assert(equipment.get_item(255).xp == 0, 'should be item xp 0');
    }

    #[test]
    fn get_battle_randomness() {
        // Test case 1: Basic functionality
        let mut level_seed: u64 = 1;
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let mut action_count = 0;

        let (rnd1, rnd2, rnd3, rnd4) = ImplAdventurer::get_battle_randomness(adventurer.xp, action_count, level_seed);
        assert(rnd1 != 0 && rnd2 != 0 && rnd3 != 0 && rnd4 != 0, 'Randomness should not be zero');
        // assert values don't equal each other
        assert(rnd1 != rnd2, 'rnd1 same as rnd2');
        assert(rnd1 != rnd3, 'rnd1 same as rnd3');
        assert(rnd1 != rnd4, 'rnd1 same as rnd4');
        assert(rnd2 != rnd3, 'rnd2 same as rnd3');
        assert(rnd2 != rnd4, 'rnd2 same as rnd4');
        assert(rnd3 != rnd4, 'rnd3 same as rnd4');

        // Test case 2: Different seed produces different results
        level_seed = 2;
        let (rnd5, rnd6, rnd7, rnd8) = ImplAdventurer::get_battle_randomness(adventurer.xp, action_count, level_seed);
        assert(rnd1 != rnd5 || rnd2 != rnd6 || rnd3 != rnd7 || rnd4 != rnd8, 'entropy should affect rnd');

        // Test case 3: XP affects randomness
        adventurer.xp = 10;
        let (rnd9, rnd10, rnd11, rnd12) = ImplAdventurer::get_battle_randomness(
            adventurer.xp, action_count, level_seed,
        );
        adventurer.xp = 11;
        let (rnd13, rnd14, rnd15, rnd16) = ImplAdventurer::get_battle_randomness(
            adventurer.xp, action_count, level_seed,
        );
        assert(rnd9 != rnd13 || rnd10 != rnd14 || rnd11 != rnd15 || rnd12 != rnd16, 'XP should affect rnd');

        // Test case 4: Battle action count affects randomness
        action_count = 1;
        let (rnd17, rnd18, rnd19, rnd20) = ImplAdventurer::get_battle_randomness(
            adventurer.xp, action_count, level_seed,
        );
        action_count = 2;
        let (rnd21, rnd22, rnd23, rnd24) = ImplAdventurer::get_battle_randomness(
            adventurer.xp, action_count, level_seed,
        );
        assert(rnd17 != rnd21 || rnd18 != rnd22 || rnd19 != rnd23 || rnd20 != rnd24, 'action count should affect rnd');

        // Test case 6: Action count overflow
        action_count = 65535;
        action_count = ImplAdventurer::increment_battle_action_count(action_count);
        assert(action_count == 0, 'action count should overflow');
    }

    #[test]
    #[available_gas(40000)]
    fn get_random_explore() {
        // exploring with zero entropy will result in a beast discovery
        let entropy = 0;
        let discovery = ImplAdventurer::get_random_explore(entropy);
        assert(discovery == ExploreResult::Beast(()), 'adventurer should find beast');

        let entropy = 1;
        let discovery = ImplAdventurer::get_random_explore(entropy);
        assert(discovery == ExploreResult::Obstacle(()), 'adventurer should find obstacle');

        let entropy = 2;
        let discovery = ImplAdventurer::get_random_explore(entropy);
        assert(discovery == ExploreResult::Discovery(()), 'adventurer should find treasure');

        // rollover and verify beast discovery
        let entropy = 3;
        let discovery = ImplAdventurer::get_random_explore(entropy);
        assert(discovery == ExploreResult::Beast(()), 'adventurer should find beast');
    }

    #[test]
    #[available_gas(163120)]
    fn get_random_attack_location() {
        // base cases
        let mut entropy = 0;
        let mut armor = ImplAdventurer::get_attack_location(entropy);
        assert(armor == Slot::Chest(()), 'should be chest');

        entropy = 1;
        armor = ImplAdventurer::get_attack_location(entropy);
        assert(armor == Slot::Head(()), 'should be head');

        entropy = 2;
        armor = ImplAdventurer::get_attack_location(entropy);
        assert(armor == Slot::Waist(()), 'should be waist');

        entropy = 3;
        armor = ImplAdventurer::get_attack_location(entropy);
        assert(armor == Slot::Foot(()), 'should be foot');

        entropy = 4;
        armor = ImplAdventurer::get_attack_location(entropy);
        assert(armor == Slot::Hand(()), 'should be hand');

        // rollover and verify armor goes back to chest
        entropy = 5;
        armor = ImplAdventurer::get_attack_location(entropy);
        assert(armor == Slot::Chest(()), 'should be chest');
    }

    #[test]
    #[available_gas(205004)]
    fn get_max_health() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // assert starting state
        assert(adventurer.stats.get_max_health() == STARTING_HEALTH.into(), 'advntr should have max health');

        // base case
        adventurer.stats.vitality = 1;
        // assert max health is starting health + single vitality increase
        assert(
            adventurer.stats.get_max_health() == STARTING_HEALTH.into() + HEALTH_INCREASE_PER_VITALITY.into(),
            'max health shuld be 120',
        );

        // extreme/overflow case
        adventurer.stats.vitality = 255;
        assert(adventurer.stats.get_max_health() == MAX_ADVENTURER_HEALTH, 'wrong max health');
    }

    #[test]
    fn apply_health_boost_from_vitality_unlock_gas() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let no_boost_specials = SpecialPowers { special1: of_Power, special2: 0, special3: 0 };
        adventurer.apply_health_boost_from_vitality_unlock(no_boost_specials);
        assert(adventurer.health == 100, 'health should not change');
    }

    #[test]
    fn apply_health_boost_from_vitality_unlock() {
        // Create a new adventurer
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // Set initial health to a known value
        let starting_health = 10;
        adventurer.health = starting_health;

        // Test case 1: No vitality boost
        let no_boost_specials = SpecialPowers { special1: of_Power, special2: 0, special3: 0 };
        let mut previous_health = adventurer.health;
        adventurer.apply_health_boost_from_vitality_unlock(no_boost_specials);
        assert(adventurer.health == previous_health, 'Health should not change');

        // Test case 2: Vitality boost from of_Giant (3 vitality)
        let giant_specials = SpecialPowers { special1: of_Giant, special2: 0, special3: 0 };
        previous_health = adventurer.health;
        adventurer.apply_health_boost_from_vitality_unlock(giant_specials);
        let health_increase = 3 * HEALTH_INCREASE_PER_VITALITY;
        assert(adventurer.health == previous_health + health_increase.into(), 'of giants, wrong hp increase');

        // Test case 3: Vitality boost from of_Protection (2 vitality)
        let protection_specials = SpecialPowers { special1: of_Protection, special2: 0, special3: 0 };
        previous_health = adventurer.health;
        adventurer.apply_health_boost_from_vitality_unlock(protection_specials);
        let health_increase = 2 * HEALTH_INCREASE_PER_VITALITY;
        assert(adventurer.health == previous_health + health_increase.into(), 'of protection, wrong hp');

        // Test case 4: Vitality boost from of_Perfection (1 vitality)
        let perfection_specials = SpecialPowers { special1: of_Perfection, special2: 0, special3: 0 };
        previous_health = adventurer.health;
        adventurer.apply_health_boost_from_vitality_unlock(perfection_specials);
        let health_increase = HEALTH_INCREASE_PER_VITALITY;
        assert(adventurer.health == previous_health + health_increase.into(), 'of perfection, wrong hp');

        // Test case 5: No additional boost when at max health
        adventurer.health = adventurer.stats.get_max_health();
        previous_health = adventurer.health;
        adventurer.apply_health_boost_from_vitality_unlock(giant_specials);
        assert(adventurer.health == previous_health, 'Health should not exceed max');
    }

    #[test]
    fn unpacking_seed() {
        let seed = 0x000000000001000000000000000000000000000001030250802200743200105a;
        let unpacked: Adventurer = ImplAdventurer::unpack(seed);

        println!("unpacked.beast_health: {:?}", unpacked.beast_health);
        println!("unpacked.health: {:?}", unpacked.health);
        println!("unpacked.xp: {:?}", unpacked.xp);
    }
}
