// SPDX-License-Identifier: MIT

#[cfg(test)]
mod tests {
    use death_mountain::constants::adventurer::{BASE_POTION_PRICE, POTION_HEALTH_AMOUNT};
    use death_mountain::constants::beast::BeastSettings;
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier};
    use death_mountain::constants::loot::{ItemId};

    use death_mountain::constants::world::DEFAULT_NS;

    use death_mountain::libs::game::{GameLibs, ImplGameLibs};
    use death_mountain::models::adventurer::adventurer::{IAdventurer, ImplAdventurer};
    use death_mountain::models::adventurer::stats::{IStat, Stats};
    use death_mountain::models::game::{AdventurerEntropy};
    use death_mountain::models::game::{
        e_GameEvent, m_AdventurerEntropy, m_AdventurerPacked, m_BagPacked, m_GameSettings, m_GameSettingsMetadata,
        m_SettingsCounter,
    };
    use death_mountain::models::market::{ItemPurchase};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait, adventurer_systems};
    use death_mountain::systems::beast::contracts::{beast_systems};
    use death_mountain::systems::game::contracts::{IGameSystemsDispatcher, IGameSystemsDispatcherTrait, game_systems};
    use death_mountain::systems::game_token::contracts::{game_token_systems};
    use death_mountain::systems::loot::contracts::{ILootSystemsDispatcherTrait, loot_systems};
    use death_mountain::systems::renderer::contracts::{renderer_systems};
    use dojo::model::{ModelStorage};
    use dojo::world::{IWorldDispatcherTrait, WorldStorage, WorldStorageTrait};
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait, spawn_test_world,
    };
    use starknet::{contract_address_const};
    use tournaments::components::interfaces::{IGameTokenDispatcher, IGameTokenDispatcherTrait};

    use tournaments::components::models::game::{
        m_GameCounter, m_GameMetadata, m_Score, m_Settings, m_SettingsDetails, m_TokenMetadata,
    };

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: DEFAULT_NS(),
            resources: [
                TestResource::Model(m_AdventurerPacked::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_BagPacked::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_AdventurerEntropy::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_TokenMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameCounter::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Score::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Settings::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_SettingsDetails::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_SettingsCounter::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameSettings::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameSettingsMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Contract(game_systems::TEST_CLASS_HASH),
                TestResource::Contract(loot_systems::TEST_CLASS_HASH),
                TestResource::Contract(renderer_systems::TEST_CLASS_HASH),
                TestResource::Contract(adventurer_systems::TEST_CLASS_HASH),
                TestResource::Contract(beast_systems::TEST_CLASS_HASH),
                TestResource::Contract(game_token_systems::TEST_CLASS_HASH),
                TestResource::Event(e_GameEvent::TEST_CLASS_HASH.try_into().unwrap()),
            ]
                .span(),
        };
        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@DEFAULT_NS(), @"game_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"loot_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"renderer_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"adventurer_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"beast_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"game_token_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span())
                .with_init_calldata(array![contract_address_const::<'player1'>().into()].span()),
        ]
            .span()
    }

    fn deploy_dungeon() -> (dojo::world::WorldStorage, IGameSystemsDispatcher, GameLibs) {
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        world.dispatcher.grant_owner(dojo::utils::bytearray_hash(@DEFAULT_NS()), contract_address_const::<'player1'>());

        starknet::testing::set_contract_address(contract_address_const::<'player1'>());
        starknet::testing::set_account_contract_address(contract_address_const::<'player1'>());
        starknet::testing::set_block_timestamp(300000);

        let (contract_address, _) = world.dns(@"game_systems").unwrap();
        let game_systems_dispatcher = IGameSystemsDispatcher { contract_address: contract_address };

        let game_libs = ImplGameLibs::new(world);
        (world, game_systems_dispatcher, game_libs)
    }

    fn new_game(world: WorldStorage, game: IGameSystemsDispatcher) -> u64 {
        let (contract_address, _) = world.dns(@"game_token_systems").unwrap();
        let game_token_dispatcher = IGameTokenDispatcher { contract_address };

        let adventurer_id = game_token_dispatcher
            .mint('player1', 0, Option::None, Option::None, contract_address_const::<'player1'>());
        game.start_game(adventurer_id, ItemId::Wand);

        adventurer_id
    }

    #[test]
    fn test_new_game() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // load player assets
        let (mut adventurer, _) = game_libs.adventurer.load_assets(adventurer_id);

        assert(adventurer.xp == 0, 'should start with 0 xp');
        assert(adventurer.equipment.weapon.id == ItemId::Wand, 'wrong starting weapon');
        assert(adventurer.beast_health == BeastSettings::STARTER_BEAST_HEALTH.into(), 'wrong starter beast health ');
    }

    #[test]
    #[should_panic(expected: ('Action not allowed in battle', 'ENTRYPOINT_FAILED'))]
    fn no_explore_during_battle() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // try to explore before defeating start beast
        game.explore(adventurer_id, true);
    }

    #[test]
    fn defeat_starter_beast() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // attack beast
        game.attack(adventurer_id, false);

        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        assert(adventurer.beast_health == 0, 'beast should be dead');
        assert(adventurer.get_level() == 2, 'should be level 2');
        assert(adventurer.stat_upgrades_available == 1, 'should have 1 stat available');
        assert(adventurer.stats.count_total_stats() > 0, 'should have starting stats');
    }

    #[test]
    #[should_panic(expected: ('Cant flee starter beast', 'ENTRYPOINT_FAILED'))]
    fn cant_flee_starter_beast() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // immediately attempt to flee starter beast
        // which is not allowed and should result in a panic 'Cant flee starter beast'
        game.flee(adventurer_id, false);
    }

    #[test]
    #[should_panic(expected: ('Not in battle', 'ENTRYPOINT_FAILED'))]
    fn cant_attack_outside_battle() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, true);
        // attack dead beast
        game.attack(adventurer_id, true);
    }

    #[test]
    #[should_panic(expected: ('Not in battle', 'ENTRYPOINT_FAILED'))]
    fn cant_flee_outside_battle() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);
        game.flee(adventurer_id, false);
    }

    #[test]
    fn game_flow() { // adventurer_id 1 with simple entropy
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // attack starter beast
        game.attack(adventurer_id, false);

        let stat_upgrades = Stats {
            strength: 0, dexterity: 1, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        game.select_stat_upgrades(adventurer_id, stat_upgrades.clone());

        // go exploring
        game.explore(adventurer_id, true);

        // upgrade
        game.select_stat_upgrades(adventurer_id, stat_upgrades.clone());

        // go exploring
        game.explore(adventurer_id, true);

        // upgrade
        game.select_stat_upgrades(adventurer_id, stat_upgrades.clone());

        // go exploring
        game.explore(adventurer_id, true);

        // verify we found a beast
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        assert(adventurer.beast_health != 0, 'should have found a beast');

        // flee from beast
        game.flee(adventurer_id, true);
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        assert(adventurer.beast_health == 0 || adventurer.health == 0, 'flee or die');
    }

    #[test]
    #[should_panic(expected: ('Stat upgrade available', 'ENTRYPOINT_FAILED'))]
    fn explore_not_allowed_with_avail_stat_upgrade() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // get updated adventurer
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // assert adventurer is now level 2 and has 1 stat upgrade available
        assert(adventurer.get_level() == 2, 'advntr should be lvl 2');
        assert(adventurer.stat_upgrades_available == 1, 'advntr should have 1 stat avl');

        // verify adventurer is unable to explore with stat upgrade available
        // this test is annotated to expect a panic so if it doesn't, this test will fail
        game.explore(adventurer_id, true);
    }

    #[test]
    #[should_panic(expected: ('Action not allowed in battle', 'ENTRYPOINT_FAILED'))]
    fn buy_items_during_battle() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Market is closed', 'ENTRYPOINT_FAILED'))]
    fn buy_items_with_stat_upgrades() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // get entropy
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);

        // get valid item from market
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);
        let item_id = *market_items.at(0);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });
        // should panic with message 'Market is closed'
        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Item already owned', 'ENTRYPOINT_FAILED'))]
    fn buy_duplicate_item_equipped() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

        // get first item on the market
        let item_id = *market_items.at(3);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });
        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });

        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Item already owned', 'ENTRYPOINT_FAILED'))]
    fn buy_duplicate_item_bagged() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

        // try to buy same item but equip one and put one in bag
        let item_id = *market_items.at(0);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });

        // should throw 'Item already owned' panic
        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Market item does not exist', 'ENTRYPOINT_FAILED'))]
    fn buy_item_not_on_market() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: 255, equip: false });

        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    fn buy_and_bag_item() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: *market_items.at(0), equip: false });

        game.buy_items(adventurer_id, 0, shopping_cart);

        let (_, bag) = game_libs.adventurer.load_assets(adventurer_id);
        assert(bag.item_1.id == *market_items.at(0), 'item should be in bag');
    }

    #[test]
    fn buy_items() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

        let mut purchased_weapon: u8 = 0;
        let mut purchased_chest: u8 = 0;
        let mut purchased_waist: u8 = 0;
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        let mut i: u32 = 0;
        loop {
            if i == market_items.len() {
                break ();
            }
            let market_item_id = *market_items.at(i);
            let market_item_tier = game_libs.loot.get_tier(market_item_id);

            if (market_item_tier != Tier::T5 && market_item_tier != Tier::T4) {
                i += 1;
                continue;
            }

            let market_item_slot = game_libs.loot.get_slot(market_item_id);

            // if the item is a weapon and we haven't purchased a weapon yet
            // and the item is a tier 4 or 5 item
            // repeat this for everything
            if (market_item_slot == Slot::Weapon && purchased_weapon == 0 && market_item_id != 12) {
                shopping_cart.append(ItemPurchase { item_id: market_item_id, equip: true });
                purchased_weapon = market_item_id;
            } else if (market_item_slot == Slot::Chest && purchased_chest == 0) {
                shopping_cart.append(ItemPurchase { item_id: market_item_id, equip: true });
                purchased_chest = market_item_id;
            } else if (market_item_slot == Slot::Waist && purchased_waist == 0) {
                shopping_cart.append(ItemPurchase { item_id: market_item_id, equip: false });
                purchased_waist = market_item_id;
            }
            i += 1;
        };

        // verify we have at least two items in shopping cart
        let shopping_cart_length = shopping_cart.len();
        assert(shopping_cart_length > 1, 'need more items to buy');

        // buy items in shopping cart
        game.buy_items(adventurer_id, 0, shopping_cart.clone());

        // get updated adventurer and bag state
        let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);

        let mut buy_and_equip_tested = false;
        let mut buy_and_bagged_tested = false;

        // iterate over the items we bought
        let mut i: u32 = 0;
        loop {
            if i == shopping_cart.len() {
                break ();
            }
            let item_purchase = *shopping_cart.at(i);

            // if the item was purchased with equip flag set to true
            if item_purchase.equip {
                // assert it's equipped
                assert(adventurer.equipment.is_equipped(item_purchase.item_id), 'item not equipped');
                buy_and_equip_tested = true;
            } else {
                // if equip was false, verify item is in bag
                let (contains, _) = game_libs.adventurer.bag_contains(bag, item_purchase.item_id);
                assert(contains, 'item not in bag');
                buy_and_bagged_tested = true;
            }
            i += 1;
        };

        assert(buy_and_equip_tested, 'did not test buy and equip');
        assert(buy_and_bagged_tested, 'did not test buy and bag');
    }

    #[test]
    #[should_panic(expected: ('Item not in bag', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn equip_not_in_bag() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // initialize an array of items to equip that contains an item not in bag
        let mut items_to_equip = ArrayTrait::<u8>::new();
        items_to_equip.append(1);

        // try to equip the item which is not in bag
        // this should result in a panic 'Item not in bag' which is
        // annotated in the test
        game.equip(adventurer_id, items_to_equip);
    }

    #[test]
    #[should_panic(expected: ('Too many items', 'ENTRYPOINT_FAILED'))]
    fn equip_too_many_items() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // initialize an array of 9 items (too many to equip)
        let mut items_to_equip = ArrayTrait::<u8>::new();
        items_to_equip.append(1);
        items_to_equip.append(2);
        items_to_equip.append(3);
        items_to_equip.append(4);
        items_to_equip.append(5);
        items_to_equip.append(6);
        items_to_equip.append(7);
        items_to_equip.append(8);
        items_to_equip.append(9);

        // try to equip the 9 items
        // this should result in a panic 'Too many items' which is
        // annotated in the test
        game.equip(adventurer_id, items_to_equip);
    }

    #[test]
    fn equip() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

        let mut purchased_weapon: u8 = 0;
        let mut purchased_chest: u8 = 0;
        let mut purchased_head: u8 = 0;
        let mut purchased_waist: u8 = 0;
        let mut purchased_foot: u8 = 0;
        let mut purchased_hand: u8 = 0;
        let mut purchased_items = ArrayTrait::<u8>::new();
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        let mut i: u32 = 0;
        loop {
            if i == market_items.len() {
                break ();
            }
            let item_id = *market_items.at(i);
            let item_slot = game_libs.loot.get_slot(item_id);
            let item_tier = game_libs.loot.get_tier(item_id);

            // if the item is a weapon and we haven't purchased a weapon yet
            // and the item is a tier 4 or 5 item
            // repeat this for everything
            if (item_slot == Slot::Weapon
                && item_tier == Tier::T5
                && purchased_weapon == 0
                && item_id != ItemId::Wand) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_weapon = item_id;
            } else if (item_slot == Slot::Chest && item_tier == Tier::T5 && purchased_chest == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_chest = item_id;
            } else if (item_slot == Slot::Head && item_tier == Tier::T5 && purchased_head == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_head = item_id;
            } else if (item_slot == Slot::Waist && item_tier == Tier::T5 && purchased_waist == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_waist = item_id;
            } else if (item_slot == Slot::Foot && item_tier == Tier::T5 && purchased_foot == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_foot = item_id;
            } else if (item_slot == Slot::Hand && item_tier == Tier::T5 && purchased_hand == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_hand = item_id;
            }
            i += 1;
        };

        let purchased_items_span = purchased_items.span();

        // verify we have at least 2 items in our shopping cart
        assert(shopping_cart.len() >= 2, 'insufficient item purchase');
        // buy items
        game.buy_items(adventurer_id, 0, shopping_cart);

        // get bag from storage
        let (_, bag) = game_libs.adventurer.load_assets(adventurer_id);

        let mut items_to_equip = ArrayTrait::<u8>::new();
        // iterate over the items we bought
        let mut i: u32 = 0;
        loop {
            if i == purchased_items_span.len() {
                break ();
            }
            // verify they are all in our bag
            let (contains, _) = game_libs.adventurer.bag_contains(bag, *purchased_items_span.at(i));
            assert(contains, 'item should be in bag');
            items_to_equip.append(*purchased_items_span.at(i));
            i += 1;
        };

        // equip all of the items we bought
        game.equip(adventurer_id, items_to_equip.clone());

        // get update bag from storage
        let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);

        // iterate over the items we equipped
        let mut i: u32 = 0;
        loop {
            if i == items_to_equip.len() {
                break ();
            }
            let (contains, _) = game_libs.adventurer.bag_contains(bag, *purchased_items_span.at(i));
            // verify they are no longer in bag
            assert(!contains, 'item should not be in bag');
            // and equipped on the adventurer
            assert(adventurer.equipment.is_equipped(*purchased_items_span.at(i)), 'item should be equipped1');
            i += 1;
        };
    }

    #[test]
    fn buy_potions() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get updated adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // store original adventurer health and gold before buying potion
        let adventurer_health_pre_potion = adventurer.health;
        let adventurer_gold_pre_potion = adventurer.gold;

        // buy potions
        let number_of_potions = 1;
        let shopping_cart = ArrayTrait::<ItemPurchase>::new();
        game.buy_items(adventurer_id, number_of_potions, shopping_cart);

        // get updated adventurer stat
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        // verify potion increased health by POTION_HEALTH_AMOUNT or adventurer health is full
        assert(
            adventurer.health == adventurer_health_pre_potion
                + (POTION_HEALTH_AMOUNT.into() * number_of_potions.into()),
            'potion did not give health',
        );

        // verify potion cost reduced adventurers gold balance
        assert(adventurer.gold < adventurer_gold_pre_potion, 'potion cost is wrong');
    }

    #[test]
    #[should_panic(expected: ('Health already full', 'ENTRYPOINT_FAILED'))]
    fn buy_potions_exceed_max_health() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get updated adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // get number of potions required to reach full health
        let potions_to_full_health: u8 = (POTION_HEALTH_AMOUNT.into()
            / (adventurer.stats.get_max_health() - adventurer.health))
            .try_into()
            .unwrap();

        // attempt to buy one more potion than is required to reach full health
        // this should result in a panic 'Health already full'
        // this test is annotated to expect that panic
        let shopping_cart = ArrayTrait::<ItemPurchase>::new();
        let potions = potions_to_full_health + 1;
        game.buy_items(adventurer_id, potions, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Market is closed', 'ENTRYPOINT_FAILED'))]
    fn cant_buy_potion_with_stat_upgrade() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // upgrade adventurer
        let shopping_cart = ArrayTrait::<ItemPurchase>::new();
        let potions = 1;
        game.buy_items(adventurer_id, potions, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Action not allowed in battle', 'ENTRYPOINT_FAILED'))]
    fn cant_buy_potion_during_battle() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // attempt to immediately buy health before clearing starter beast
        // this should result in contract throwing a panic 'Action not allowed in battle'
        // This test is annotated to expect that panic
        let shopping_cart = ArrayTrait::<ItemPurchase>::new();
        let potions = 1;
        game.buy_items(adventurer_id, potions, shopping_cart);
    }

    #[test]
    fn get_potion_price_underflow() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        let potion_price = adventurer.charisma_adjusted_potion_price();
        let adventurer_level = adventurer.get_level();
        assert(potion_price == BASE_POTION_PRICE.into() * adventurer_level.into(), 'wrong lvl1 potion price');

        // defeat starter beast and advance to level 2
        game.attack(adventurer_id, true);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        // get level 2 potion price
        let potion_price = adventurer.charisma_adjusted_potion_price();
        let adventurer_level = adventurer.get_level();

        // verify potion price
        assert(
            potion_price == (BASE_POTION_PRICE.into() * adventurer_level.into()) - adventurer.stats.charisma.into(),
            'wrong lvl2 potion price',
        );
    }

    #[test]
    fn drop_item() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };
        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

        // get first item on the market
        let purchased_item_id = *market_items.at(0);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: purchased_item_id, equip: false });

        // buy first item on market and bag it
        game.buy_items(adventurer_id, 0, shopping_cart);

        // get bag state
        let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);

        // assert adventurer has starting weapon equipped
        assert(adventurer.equipment.weapon.id != 0, 'adventurer should have weapon');
        // assert bag has the purchased item
        let (contains, _) = game_libs.adventurer.bag_contains(bag, purchased_item_id);
        assert(contains, 'item should be in bag');

        // create drop list consisting of adventurers equipped weapon and purchased item that is in
        // bag
        let mut drop_list = ArrayTrait::<u8>::new();
        drop_list.append(adventurer.equipment.weapon.id);
        drop_list.append(purchased_item_id);

        // call contract drop
        game.drop(adventurer_id, drop_list);

        let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);

        // assert adventurer has no weapon equipped
        assert(adventurer.equipment.weapon.id == 0, 'weapon id should be 0');
        assert(adventurer.equipment.weapon.xp == 0, 'weapon should have no xp');

        // assert bag does not have the purchased item
        let (contains, _) = game_libs.adventurer.bag_contains(bag, purchased_item_id);
        assert(!contains, 'item should not be in bag');
    }

    #[test]
    #[should_panic(expected: ('Cant drop during starter beast', 'ENTRYPOINT_FAILED'))]
    fn drop_on_starter_beast() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        let mut drop_list = ArrayTrait::<u8>::new();
        drop_list.append(255);

        // try to drop an item the adventurer doesn't own
        // this should result in a panic 'Item not owned by adventurer'
        // this test is annotated to expect that panic
        game.drop(adventurer_id, drop_list);
    }

    #[test]
    fn upgrade_stats() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // get adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        let original_charisma = adventurer.stats.charisma;

        // call upgrade_stats with stat upgrades
        // TODO: test with more than one which is challenging
        // because we need a multi-level or G20 stat unlocks
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };
        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get update adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // assert charisma was increased
        assert(adventurer.stats.charisma == original_charisma + 1, 'charisma not increased');
        // assert stat point was used
        assert(adventurer.stat_upgrades_available == 0, 'should have used stat point');
    }

    #[test]
    #[should_panic(expected: ('insufficient stat upgrades', 'ENTRYPOINT_FAILED'))]
    fn upgrade_stats_not_enough_points() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // try to upgrade charisma x2 with only 1 stat available
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 2, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);
    }

    #[test]
    fn upgrade_adventurer() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // get original adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        let original_charisma = adventurer.stats.charisma;
        let original_health = adventurer.health;

        // buy a potion
        let potions = 1;

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

        // buy two items
        let mut items_to_purchase = ArrayTrait::<ItemPurchase>::new();
        let purchase_and_equip = ItemPurchase { item_id: *market_items.at(19), equip: true };
        let purchase_and_not_equip = ItemPurchase { item_id: *market_items.at(20), equip: false };
        items_to_purchase.append(purchase_and_equip);
        items_to_purchase.append(purchase_and_not_equip);

        // stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        // call upgrade
        game.select_stat_upgrades(adventurer_id, stat_upgrades);
        game.buy_items(adventurer_id, potions, items_to_purchase);

        // get updated adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // assert health was increased by one potion
        assert(adventurer.health == original_health + POTION_HEALTH_AMOUNT.into(), 'health not increased');
        // assert charisma was increased
        assert(adventurer.stats.charisma == original_charisma + 1, 'charisma not increased');
        // assert stat point was used
        assert(adventurer.stat_upgrades_available == 0, 'should have used stat point');
        // assert adventurer has the purchased items
        assert(adventurer.equipment.is_equipped(purchase_and_equip.item_id), 'purchase should be equipped');
        assert(!adventurer.equipment.is_equipped(purchase_and_not_equip.item_id), 'purchase should not be equipped');
    }

    #[test]
    #[should_panic(expected: ('Cant drop during starter beast', 'ENTRYPOINT_FAILED'))]
    fn no_dropping_starter_weapon_during_starter_beast() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // try to drop starter weapon during starter beast battle
        let mut drop_items = array![ItemId::Wand];
        game.drop(adventurer_id, drop_items);
    }

    #[test]
    fn drop_starter_item_after_starter_beast() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast
        game.attack(adventurer_id, false);

        // try to drop starter weapon
        let mut drop_items = array![ItemId::Wand];
        game.drop(adventurer_id, drop_items);
    }

    #[test]
    fn item_level_up() {
        let (mut world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);

        let (mut adventurer, _) = game_libs.adventurer.load_assets(adventurer_id);

        assert(adventurer.equipment.weapon.xp == 8, 'xp not set correctly');
        assert(adventurer.stat_upgrades_available == 1, 'wrong stats available');
    }
}
