// SPDX-License-Identifier: MIT

use game_components_minigame::structs::GameDetail;

#[starknet::interface]
pub trait IRendererSystems<T> {
    fn create_metadata(self: @T, adventurer_id: u64) -> ByteArray;
    fn generate_svg(self: @T, adventurer_id: u64) -> ByteArray;
    fn generate_details(self: @T, adventurer_id: u64) -> Span<GameDetail>;
}

#[dojo::contract]
mod renderer_systems {
    use death_mountain::constants::world::{DEFAULT_NS};
    use death_mountain::libs::game::ImplGameLibs;
    use death_mountain::models::adventurer::adventurer::{AdventurerVerbose, ImplAdventurer};
    use death_mountain::models::adventurer::bag::{ImplBag};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait};
    use death_mountain::utils::renderer::renderer::Renderer;
    use death_mountain::utils::renderer::renderer_utils::{generate_details, generate_svg};
    use dojo::world::{WorldStorageTrait};

    use game_components_minigame::interface::{
        IMinigameDetails, IMinigameDetailsSVG, IMinigameDispatcher, IMinigameDispatcherTrait,
    };
    use game_components_minigame::libs::require_owned_token;
    use game_components_minigame::structs::GameDetail;

    use super::IRendererSystems;


    #[abi(embed_v0)]
    impl GameDetailsImpl of IMinigameDetails<ContractState> {
        fn game_details(self: @ContractState, token_id: u64) -> Span<GameDetail> {
            self.validate_token_ownership(token_id);
            self.generate_details(token_id)
        }

        fn token_name(self: @ContractState, token_id: u64) -> ByteArray {
            self.validate_token_ownership(token_id);
            Renderer::get_name()
        }

        fn token_description(self: @ContractState, token_id: u64) -> ByteArray {
            self.validate_token_ownership(token_id);
            Renderer::get_description()
        }
    }

    #[abi(embed_v0)]
    impl GameDetailsSVGImpl of IMinigameDetailsSVG<ContractState> {
        fn game_details_svg(self: @ContractState, token_id: u64) -> ByteArray {
            self.validate_token_ownership(token_id);
            self.generate_svg(token_id.try_into().unwrap())
        }
    }

    #[abi(embed_v0)]
    impl RendererSystemsImpl of IRendererSystems<ContractState> {
        fn create_metadata(self: @ContractState, adventurer_id: u64) -> ByteArray {
            let adventurer_verbose = self.get_adventurer_verbose(adventurer_id);
            Renderer::create_metadata(adventurer_id, adventurer_verbose)
        }

        fn generate_svg(self: @ContractState, adventurer_id: u64) -> ByteArray {
            let adventurer_verbose = self.get_adventurer_verbose(adventurer_id);
            generate_svg(adventurer_verbose)
        }

        fn generate_details(self: @ContractState, adventurer_id: u64) -> Span<GameDetail> {
            let adventurer_verbose = self.get_adventurer_verbose(adventurer_id);
            generate_details(adventurer_verbose)
        }
    }

    #[generate_trait]
    impl RendererSystemsInternal of RendererSystemsInternalTrait {
        fn get_adventurer_verbose(self: @ContractState, adventurer_id: u64) -> AdventurerVerbose {
            let game_libs = ImplGameLibs::new(self.world(@DEFAULT_NS()));
            game_libs.adventurer.get_adventurer_verbose(adventurer_id)
        }

        fn validate_token_ownership(self: @ContractState, token_id: u64) {
            let mut world = self.world(@DEFAULT_NS());
            let (game_token_systems_address, _) = world.dns(@"game_token_systems").unwrap();
            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_token_systems_address };
            let token_address = minigame_dispatcher.token_address();
            require_owned_token(token_address, token_id);
        }
    }
}


#[cfg(test)]
mod renderer_tests {
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
    use death_mountain::constants::world::DEFAULT_NS;
    use death_mountain::libs::game::{GameLibs, ImplGameLibs};
    use death_mountain::models::adventurer::{
        adventurer::{Adventurer, AdventurerVerbose, ImplAdventurer}, bag::{Bag, BagVerbose, ImplBag},
        equipment::{Equipment, EquipmentVerbose}, item::{Item, ItemVerbose}, stats::{Stats},
    };
    use death_mountain::models::game::{
        e_GameEvent, m_AdventurerEntropy, m_AdventurerPacked, m_BagPacked, m_GameSettings, m_GameSettingsMetadata,
        m_SettingsCounter,
    };
    use death_mountain::models::game_data::m_DroppedItem;
    use death_mountain::systems::{
        adventurer::contracts::{IAdventurerSystemsDispatcher, adventurer_systems}, beast::contracts::beast_systems,
        game::contracts::{IGameSystemsDispatcher, IGameSystemsDispatcherTrait, game_systems},
        game_token::contracts::{IGameTokenSystemsDispatcher, game_token_systems}, loot::contracts::loot_systems,
        objectives::contracts::objectives_systems,
        renderer::contracts::{IRendererSystemsDispatcher, IRendererSystemsDispatcherTrait, renderer_systems},
        settings::contracts::settings_systems,
    };
    use death_mountain::utils::{
        renderer::renderer::Renderer, renderer::renderer_utils::{generate_svg},
        string::string_utils::{starts_with_pattern},
    };
    use dojo::world::{IWorldDispatcherTrait, WorldStorage, WorldStorageTrait};
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait, spawn_test_world,
    };
    use game_components_minigame::interface::{
        IMinigameDetailsDispatcher, IMinigameDetailsDispatcherTrait, IMinigameDetailsSVGDispatcher,
        IMinigameDetailsSVGDispatcherTrait, IMinigameDispatcher, IMinigameDispatcherTrait,
    };
    use starknet::{ContractAddress, contract_address_const};

    fn namespace_def() -> NamespaceDef {
        NamespaceDef {
            namespace: DEFAULT_NS(),
            resources: [
                TestResource::Model(m_AdventurerPacked::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_BagPacked::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_AdventurerEntropy::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_SettingsCounter::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameSettings::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameSettingsMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_DroppedItem::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Contract(game_systems::TEST_CLASS_HASH),
                TestResource::Contract(loot_systems::TEST_CLASS_HASH),
                TestResource::Contract(renderer_systems::TEST_CLASS_HASH),
                TestResource::Contract(adventurer_systems::TEST_CLASS_HASH),
                TestResource::Contract(beast_systems::TEST_CLASS_HASH),
                TestResource::Contract(settings_systems::TEST_CLASS_HASH),
                TestResource::Contract(objectives_systems::TEST_CLASS_HASH),
                TestResource::Contract(game_token_systems::TEST_CLASS_HASH),
                TestResource::Event(e_GameEvent::TEST_CLASS_HASH.try_into().unwrap()),
            ]
                .span(),
        }
    }

    fn contract_defs(denshokan_address: ContractAddress) -> Span<ContractDef> {
        let mut game_token_init_calldata: Array<felt252> = array![];
        game_token_init_calldata.append(contract_address_const::<'player1'>().into()); // creator_address
        game_token_init_calldata.append(denshokan_address.into()); // denshokan_address
        game_token_init_calldata.append(1); // Option::None for renderer address

        [
            ContractDefTrait::new(@DEFAULT_NS(), @"adventurer_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"beast_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"loot_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"game_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"game_token_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span())
                .with_init_calldata(game_token_init_calldata.span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"renderer_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"settings_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"objectives_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
        ]
            .span()
    }

    #[derive(Drop)]
    struct TestSystemDispatchers {
        adventurer: IAdventurerSystemsDispatcher,
        game: IGameSystemsDispatcher,
        game_token: IGameTokenSystemsDispatcher,
        renderer: IRendererSystemsDispatcher,
        minigame_details: IMinigameDetailsDispatcher,
        minigame_details_svg: IMinigameDetailsSVGDispatcher,
    }

    fn deploy_test_world() -> (WorldStorage, TestSystemDispatchers, GameLibs) {
        let denshokan_contracts = death_mountain::utils::setup_denshokan::setup();

        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs(denshokan_contracts.denshokan.contract_address));

        world.dispatcher.grant_owner(dojo::utils::bytearray_hash(@DEFAULT_NS()), contract_address_const::<'player1'>());

        starknet::testing::set_contract_address(contract_address_const::<'player1'>());
        starknet::testing::set_account_contract_address(contract_address_const::<'player1'>());
        starknet::testing::set_block_timestamp(300000);

        let (adventurer_address, _) = world.dns(@"adventurer_systems").unwrap();
        let (game_address, _) = world.dns(@"game_systems").unwrap();
        let (game_token_address, _) = world.dns(@"game_token_systems").unwrap();
        let (renderer_address, _) = world.dns(@"renderer_systems").unwrap();

        let dispatchers = TestSystemDispatchers {
            adventurer: IAdventurerSystemsDispatcher { contract_address: adventurer_address },
            game: IGameSystemsDispatcher { contract_address: game_address },
            game_token: IGameTokenSystemsDispatcher { contract_address: game_token_address },
            renderer: IRendererSystemsDispatcher { contract_address: renderer_address },
            minigame_details: IMinigameDetailsDispatcher { contract_address: renderer_address },
            minigame_details_svg: IMinigameDetailsSVGDispatcher { contract_address: renderer_address },
        };

        let game_libs = ImplGameLibs::new(world);

        (world, dispatchers, game_libs)
    }

    fn new_game(world: WorldStorage, game: IGameSystemsDispatcher) -> u64 {
        let (contract_address, _) = world.dns(@"game_token_systems").unwrap();
        let minigame_dispatcher = IMinigameDispatcher { contract_address };

        let adventurer_id = minigame_dispatcher
            .mint_game(
                Option::Some('player1'), // player_name
                Option::Some(0), // settings_id
                Option::None, // start
                Option::None, // end
                Option::None, // objective_ids
                Option::None, // context
                Option::None, // client_url
                Option::None, // renderer_address
                contract_address_const::<'player1'>(), // to
                false // soulbound
            );

        game.start_game(adventurer_id, 12); // Use Wand ID

        adventurer_id
    }

    fn create_empty_item_verbose() -> ItemVerbose {
        ItemVerbose { name: '', id: 0, xp: 0, tier: Tier::T1, item_type: Type::Blade_or_Hide, slot: Slot::Weapon }
    }

    fn create_test_weapon() -> ItemVerbose {
        ItemVerbose {
            name: 'Test Weapon', id: 1, xp: 100, tier: Tier::T1, item_type: Type::Blade_or_Hide, slot: Slot::Weapon,
        }
    }

    fn create_test_equipment_verbose() -> EquipmentVerbose {
        EquipmentVerbose {
            weapon: create_test_weapon(),
            chest: create_empty_item_verbose(),
            head: create_empty_item_verbose(),
            waist: create_empty_item_verbose(),
            foot: create_empty_item_verbose(),
            hand: create_empty_item_verbose(),
            neck: create_empty_item_verbose(),
            ring: create_empty_item_verbose(),
        }
    }

    fn create_test_bag_verbose() -> BagVerbose {
        BagVerbose {
            item_1: create_empty_item_verbose(),
            item_2: create_empty_item_verbose(),
            item_3: create_empty_item_verbose(),
            item_4: create_empty_item_verbose(),
            item_5: create_empty_item_verbose(),
            item_6: create_empty_item_verbose(),
            item_7: create_empty_item_verbose(),
            item_8: create_empty_item_verbose(),
            item_9: create_empty_item_verbose(),
            item_10: create_empty_item_verbose(),
            item_11: create_empty_item_verbose(),
            item_12: create_empty_item_verbose(),
            item_13: create_empty_item_verbose(),
            item_14: create_empty_item_verbose(),
            item_15: create_empty_item_verbose(),
        }
    }

    fn create_test_adventurer() -> Adventurer {
        let stats = Stats {
            strength: 10, dexterity: 8, vitality: 12, intelligence: 6, wisdom: 7, charisma: 9, luck: 5,
        };

        let equipment = Equipment {
            weapon: Item { id: 1, xp: 100 },
            chest: Item { id: 0, xp: 0 },
            head: Item { id: 0, xp: 0 },
            waist: Item { id: 0, xp: 0 },
            foot: Item { id: 0, xp: 0 },
            hand: Item { id: 0, xp: 0 },
            neck: Item { id: 0, xp: 0 },
            ring: Item { id: 0, xp: 0 },
        };

        Adventurer {
            health: 100,
            xp: 500,
            gold: 250,
            beast_health: 0,
            stat_upgrades_available: 3,
            stats,
            equipment,
            item_specials_seed: 5,
            action_count: 10,
        }
    }

    fn create_test_bag() -> Bag {
        Bag {
            item_1: Item { id: 0, xp: 0 },
            item_2: Item { id: 0, xp: 0 },
            item_3: Item { id: 0, xp: 0 },
            item_4: Item { id: 0, xp: 0 },
            item_5: Item { id: 0, xp: 0 },
            item_6: Item { id: 0, xp: 0 },
            item_7: Item { id: 0, xp: 0 },
            item_8: Item { id: 0, xp: 0 },
            item_9: Item { id: 0, xp: 0 },
            item_10: Item { id: 0, xp: 0 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        }
    }

    fn create_test_adventurer_verbose() -> AdventurerVerbose {
        let stats = Stats {
            strength: 10, dexterity: 8, vitality: 12, intelligence: 6, wisdom: 7, charisma: 9, luck: 5,
        };

        AdventurerVerbose {
            name: 'TestAdventurer',
            packed_adventurer: 0,
            packed_bag: 0,
            health: 100,
            xp: 500,
            level: 5,
            gold: 250,
            beast_health: 0,
            stat_upgrades_available: 3,
            stats,
            equipment: create_test_equipment_verbose(),
            item_specials_seed: 12345,
            action_count: 10,
            bag: create_test_bag_verbose(),
        }
    }


    #[test]
    fn test_create_metadata() {
        let metadata = Renderer::create_metadata(1, create_test_adventurer_verbose());

        assert(metadata.len() > 0, 'metadata should not be empty');
        assert(starts_with_pattern(@metadata, @"data:application/json;base64,"), 'should be base64 data URI');
    }

    #[test]
    fn test_generate_details() {
        let traits = Renderer::get_traits(create_test_adventurer_verbose());

        assert(traits.len() > 0, 'details should not be empty');
    }

    #[test]
    fn test_generate_svg() {
        let svg = Renderer::get_image(create_test_adventurer_verbose());

        assert(svg.len() > 0, 'svg should not be empty');
        assert(starts_with_pattern(@svg, @"data:image/svg+xml;base64,"), 'should start with data:image');
    }


    #[test]
    fn test_renderer_description() {
        let description = Renderer::get_description();
        assert(description.len() > 0, 'description should not be empty');
    }

    #[test]
    fn test_game_details_svg() {
        let svg = generate_svg(create_test_adventurer_verbose());

        assert(svg.len() > 0, 'svg should not be empty');
        assert(starts_with_pattern(@svg, @"data:image/svg+xml;base64"), 'should start with svg tag');
    }

    #[test]
    fn test_renderer_deployment_and_interface() {
        let (_world, dispatchers, _game_libs) = deploy_test_world();
        assert(dispatchers.renderer.contract_address != contract_address_const::<0>(), 'Contract should be deployed');
    }

    #[test]
    fn test_renderer_create_metadata_integration() {
        let (world, dispatchers, _game_libs) = deploy_test_world();

        // Mint + start game
        let adventurer_id = new_game(world, dispatchers.game);
        let metadata = dispatchers.renderer.create_metadata(adventurer_id);

        assert(metadata.len() > 0, 'metadata should not be empty');
        assert(starts_with_pattern(@metadata, @"data:application/json;base64,"), 'should be base64 data URI');
    }

    #[test]
    fn test_renderer_generate_svg_integration() {
        let (world, dispatchers, _game_libs) = deploy_test_world();

        // Mint + start game
        let adventurer_id = new_game(world, dispatchers.game);
        let svg = dispatchers.renderer.generate_svg(adventurer_id);

        assert(svg.len() > 0, 'svg should not be empty');
        assert(starts_with_pattern(@svg, @"data:image/svg+xml;base64"), 'should start with svg tag');
    }

    #[test]
    fn test_renderer_generate_details_integration() {
        let (world, dispatchers, _game_libs) = deploy_test_world();

        // Mint + start game
        let adventurer_id = new_game(world, dispatchers.game);
        let details = dispatchers.renderer.generate_details(adventurer_id);

        assert(details.len() > 0, 'details should not be empty');
    }

    #[test]
    fn test_game_details_integration() {
        let (world, dispatchers, _game_libs) = deploy_test_world();

        // Mint + start game
        let adventurer_id = new_game(world, dispatchers.game);
        let game_details = dispatchers.minigame_details.game_details(adventurer_id);

        assert(game_details.len() > 0, 'details should not be empty');

        let first_detail = game_details.at(0);
        assert(first_detail.name.len() > 0, 'name should not be empty');
        assert(first_detail.value.len() > 0, 'value should not be empty');
    }

    #[test]
    fn test_token_description_integration() {
        let (world, dispatchers, _game_libs) = deploy_test_world();

        // Mint + start game
        let adventurer_id = new_game(world, dispatchers.game);
        let description = dispatchers.minigame_details.token_description(adventurer_id);

        assert(description.len() > 0, 'should not be empty');
    }

    #[test]
    fn test_game_details_svg_integration() {
        let (world, dispatchers, _game_libs) = deploy_test_world();

        // Mint + start game
        let adventurer_id = new_game(world, dispatchers.game);
        let svg = dispatchers.minigame_details_svg.game_details_svg(adventurer_id);

        assert(svg.len() > 0, 'should not be empty');
        assert(starts_with_pattern(@svg, @"data:image/svg+xml;base64"), 'should start with svg tag');
    }

    // Test functions for SVG generation script
    #[test]
    fn test_output_normal_state_svg() {
        let mut adventurer = create_test_adventurer_verbose();
        adventurer.health = 100; // Alive
        adventurer.beast_health = 0; // Not in combat

        let svg = generate_svg(adventurer);

        println!("=== NORMAL STATE SVG ===");
        println!("{}", svg);
        println!("=== END NORMAL STATE SVG ===");

        assert(svg.len() > 0, 'svg should not be empty');
        assert(starts_with_pattern(@svg, @"data:image/svg+xml;base64"), 'should start with svg tag');
    }

    #[test]
    fn test_output_death_state_svg() {
        let mut adventurer = create_test_adventurer_verbose();
        adventurer.health = 0; // Dead
        adventurer.beast_health = 0;

        let svg = generate_svg(adventurer);

        println!("=== DEATH STATE SVG ===");
        println!("{}", svg);
        println!("=== END DEATH STATE SVG ===");

        assert(svg.len() > 0, 'svg should not be empty');
        assert(starts_with_pattern(@svg, @"data:image/svg+xml;base64"), 'should start with svg tag');
    }

    #[test]
    fn test_output_battle_state_svg() {
        let mut adventurer = create_test_adventurer_verbose();
        adventurer.health = 80; // Alive
        adventurer.beast_health = 50; // In combat

        let svg = generate_svg(adventurer);

        println!("=== BATTLE STATE SVG ===");
        println!("{}", svg);
        println!("=== END BATTLE STATE SVG ===");

        assert(svg.len() > 0, 'svg should not be empty');
        assert(starts_with_pattern(@svg, @"data:image/svg+xml;base64"), 'should start with svg tag');
    }

    #[test]
    fn test_output_death_in_battle_svg() {
        let mut adventurer = create_test_adventurer_verbose();
        adventurer.health = 0; // Dead
        adventurer.beast_health = 75; // Beast still alive (died during combat)

        let svg = generate_svg(adventurer);

        println!("=== DEATH IN BATTLE SVG ===");
        println!("{}", svg);
        println!("=== END DEATH IN BATTLE SVG ===");

        assert(svg.len() > 0, 'svg should not be empty');
        assert(starts_with_pattern(@svg, @"data:image/svg+xml;base64"), 'should start with svg tag');
    }

    #[test]
    fn test_svg_size_comparison() {
        let mut normal_adventurer = create_test_adventurer_verbose();
        normal_adventurer.health = 100;
        normal_adventurer.beast_health = 0;

        let mut dead_adventurer = create_test_adventurer_verbose();
        dead_adventurer.health = 0;
        dead_adventurer.beast_health = 0;

        let mut battle_adventurer = create_test_adventurer_verbose();
        battle_adventurer.health = 80;
        battle_adventurer.beast_health = 50;

        let mut death_in_battle_adventurer = create_test_adventurer_verbose();
        death_in_battle_adventurer.health = 0;
        death_in_battle_adventurer.beast_health = 75;

        let normal_svg = generate_svg(normal_adventurer);
        let death_svg = generate_svg(dead_adventurer);
        let battle_svg = generate_svg(battle_adventurer);
        let death_in_battle_svg = generate_svg(death_in_battle_adventurer);

        println!("=== SVG SIZE COMPARISON ===");
        println!("Normal State SVG: {} characters", normal_svg.len());
        println!("Death State SVG: {} characters", death_svg.len());
        println!("Battle State SVG: {} characters", battle_svg.len());
        println!("Death In Battle SVG: {} characters", death_in_battle_svg.len());
        println!("=== END COMPARISON ===");

        assert(normal_svg.len() > 0, 'normal svg should not be empty');
        assert(death_svg.len() > 0, 'death svg should not be empty');
        assert(battle_svg.len() > 0, 'battle svg should not be empty');
        assert(death_in_battle_svg.len() > 0, 'death in battle svg not empty');
    }
}
