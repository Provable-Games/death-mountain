use death_mountain::models::adventurer::{adventurer::Adventurer, bag::Bag, stats::Stats};
use death_mountain::models::market::ItemPurchase;

#[starknet::interface]
pub trait IGameTokenSystems<T> {
    fn start_game(ref self: T, adventurer_id: u64, weapon: u8);
    fn explore(ref self: T, adventurer_id: u64, till_beast: bool);
    fn attack(ref self: T, adventurer_id: u64, to_the_death: bool);
    fn flee(ref self: T, adventurer_id: u64, to_the_death: bool);
    fn equip(ref self: T, adventurer_id: u64, items: Array<u8>);
    fn drop(ref self: T, adventurer_id: u64, items: Array<u8>);
    fn buy_items(ref self: T, adventurer_id: u64, potions: u8, items: Array<ItemPurchase>);
    fn select_stat_upgrades(ref self: T, adventurer_id: u64, stat_upgrades: Stats);
    fn create_settings(ref self: T, name: felt252, adventurer: Adventurer, bag: Bag, game_seed: u64, game_seed_until_xp: u16, in_battle: bool);
    fn create_objective(ref self: T, score: u32);
    fn settings_id(ref self: T, adventurer_id: u64) -> u32;
    fn player_name(ref self: T, adventurer_id: u64) -> felt252;
}

#[dojo::contract]
mod game_token_systems {
    use death_mountain::constants::world::DEFAULT_NS;
    use death_mountain::libs::game::ImplGameLibs;
    use death_mountain::models::adventurer::adventurer::{ImplAdventurer};
    use death_mountain::models::adventurer::bag::{ImplBag};

    use death_mountain::models::game::{GameSettings, GameSettingsMetadata};
    use death_mountain::models::adventurer::{adventurer::Adventurer, bag::Bag, stats::Stats};
    use death_mountain::models::market::ItemPurchase;
    use death_mountain::models::objectives::{ScoreObjective, ScoreObjectiveCount};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait};
    use death_mountain::systems::game::contracts::{IGameSystemsDispatcher, IGameSystemsDispatcherTrait};
    use death_mountain::systems::settings::contracts::{ISettingsSystemsDispatcher, ISettingsSystemsDispatcherTrait};
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};

    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ContractAddress;

    use game_components_minigame::minigame::minigame_component;
    use game_components_minigame::interface::{IMinigameScore, IMinigameDetails, IMinigameSettings, IMinigameObjectives};
    use game_components_minigame::models::game_details::{GameDetail};
    use game_components_minigame::models::settings::{GameSetting, GameSettingDetails};
    use game_components_minigame::models::objectives::{GameObjective};

    // Components
    component!(path: minigame_component, storage: minigame, event: MinigameEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl MinigameImpl = minigame_component::MinigameImpl<ContractState>;
    impl MinigameInternalImpl = minigame_component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        minigame: minigame_component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MinigameEvent: minigame_component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    /// @title Dojo Init
    /// @notice Initializes the contract
    /// @dev This is the constructor for the contract. It is called once when the contract is
    /// deployed.
    ///
    /// @param creator_address: the address of the creator of the game
    fn dojo_init(ref self: ContractState, creator_address: ContractAddress, denshokan_address: ContractAddress) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());

        self
            .minigame
            .initializer(
                creator_address,
                'Death Mountain',
                "Death Mountain is an onchain dungeon generator",
                'Provable Games',
                'Provable Games',
                'Dungeon Generator',
                "https://deathmountain.gg/favicon-32x32.png",
                Option::None, // color
                Option::None, // renderer address
                DEFAULT_NS(),
                denshokan_address,
            );

        world
            .write_model(
                @GameSettings {
                    settings_id: 0,
                    adventurer: ImplAdventurer::new(0),
                    bag: ImplBag::new(),
                    game_seed: 0,
                    game_seed_until_xp: 0,
                    in_battle: false,
                },
            );

        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 0,
                    name: 'Default',
                    created_by: starknet::get_caller_address(),
                    created_at: starknet::get_block_timestamp(),
                },
            );
    }

    // ------------------------------------------ //
    // ------------ Minigame Component ------------------------ //
    // ------------------------------------------ //
    #[abi(embed_v0)]
    impl GameScoreImpl of IMinigameScore<ContractState> {
        fn score(self: @ContractState, token_id: u64) -> u32 {
            let game_libs = ImplGameLibs::new(self.world(@DEFAULT_NS()));
            let adventurer = game_libs.adventurer.get_adventurer(token_id);
            adventurer.xp.into()
        }
    }

    #[abi(embed_v0)]
    impl GameDetailsImpl of IMinigameDetails<ContractState> {
        fn token_description(self: @ContractState, token_id: u64) -> ByteArray {
            format!("Test Token Description for token {}", token_id)
        }
        fn game_details(self: @ContractState, token_id: u64) -> Span<GameDetail> {
            array![
                GameDetail {
                    name: "Test Game Detail",
                    value: format!("Test Value for token {}", token_id),
                },
            ].span()
        }
    }

    #[abi(embed_v0)]
    impl SettingsImpl of IMinigameSettings<ContractState> {
        fn setting_exists(self: @ContractState, settings_id: u32) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            settings.adventurer.health != 0
        }
        fn settings(self: @ContractState, settings_id: u32) -> GameSettingDetails {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            let settings_details: GameSettingsMetadata = world.read_model(settings_id);
            GameSettingDetails {
                name: format!("{}", settings_details.name),
                description: "Add Description Here",
                settings: array![
                    GameSetting {
                        name: "Starting Health",
                        value: format!("{}", settings.adventurer.health),
                    },
                ].span(),
            }
        }
    }

    #[abi(embed_v0)]
    impl ObjectivesImpl of IMinigameObjectives<ContractState> {
        fn objective_exists(self: @ContractState, objective_id: u32) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let objective_score: ScoreObjective = world.read_model(objective_id);
            objective_score.exists
        }
        fn completed_objective(self: @ContractState, token_id: u64, objective_id: u32) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let objective_score: ScoreObjective = world.read_model(objective_id);
            let game_libs = ImplGameLibs::new(world);
            let (mut adventurer, _) = game_libs.adventurer.load_assets(token_id);
            adventurer.xp.into() >= objective_score.score
        }
        fn objectives(self: @ContractState, token_id: u64) -> Span<GameObjective> {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let objective_ids = self.minigame.get_objective_ids(token_id);
            let mut objective_index = 0;
            let mut objectives = array![];
            loop {
                if objective_index == objective_ids.len() {
                    break;
                }
                let objective_id = *objective_ids.at(objective_index);
                let objective_score: ScoreObjective = world.read_model(objective_id);
                objectives.append(GameObjective { name: "Score Target", value: format!("Score Above {}", objective_score.score) });
                objective_index += 1;
            };
            objectives.span()
        }
    }

    // ------------------------------------------ //
    // ------------ Game Token Systems ------------------------ //
    // ------------------------------------------ //
    #[abi(embed_v0)]
    impl GameTokenSystemsImpl of super::IGameTokenSystems<ContractState> {
        fn start_game(ref self: ContractState, adventurer_id: u64, weapon: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            self.minigame.pre_action(adventurer_id);
            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let game_systems = IGameSystemsDispatcher { contract_address: game_systems_address };
            game_systems.start_game(adventurer_id, weapon);
            self.minigame.post_action(adventurer_id, false);
        }

        fn explore(ref self: ContractState, adventurer_id: u64, till_beast: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            self.minigame.pre_action(adventurer_id);
            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let game_systems = IGameSystemsDispatcher { contract_address: game_systems_address };
            let game_over = game_systems.explore(adventurer_id, till_beast);
            self.minigame.post_action(adventurer_id, game_over);
        }


        fn attack(ref self: ContractState, adventurer_id: u64, to_the_death: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            self.minigame.pre_action(adventurer_id);
            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let game_systems = IGameSystemsDispatcher { contract_address: game_systems_address };
            let game_over = game_systems.attack(adventurer_id, to_the_death);
            self.minigame.post_action(adventurer_id, game_over);
        }

        fn flee(ref self: ContractState, adventurer_id: u64, to_the_death: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            self.minigame.pre_action(adventurer_id);
            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let game_systems = IGameSystemsDispatcher { contract_address: game_systems_address };
            let game_over = game_systems.flee(adventurer_id, to_the_death);
            self.minigame.post_action(adventurer_id, game_over);
        }

        fn equip(ref self: ContractState, adventurer_id: u64, items: Array<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            self.minigame.pre_action(adventurer_id);
            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let game_systems = IGameSystemsDispatcher { contract_address: game_systems_address };
            let game_over = game_systems.equip(adventurer_id, items);
            self.minigame.post_action(adventurer_id, game_over);
        }

        fn drop(ref self: ContractState, adventurer_id: u64, items: Array<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            self.minigame.pre_action(adventurer_id);
            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let game_systems = IGameSystemsDispatcher { contract_address: game_systems_address };
            game_systems.drop(adventurer_id, items);
            self.minigame.post_action(adventurer_id, false);
        }

        fn buy_items(ref self: ContractState, adventurer_id: u64, potions: u8, items: Array<ItemPurchase>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            self.minigame.pre_action(adventurer_id);
            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let game_systems = IGameSystemsDispatcher { contract_address: game_systems_address };
            game_systems.buy_items(adventurer_id, potions, items);
            self.minigame.post_action(adventurer_id, false);
        }

        fn select_stat_upgrades(ref self: ContractState, adventurer_id: u64, stat_upgrades: Stats) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            self.minigame.pre_action(adventurer_id);
            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let game_systems = IGameSystemsDispatcher { contract_address: game_systems_address };
            game_systems.select_stat_upgrades(adventurer_id, stat_upgrades);
            self.minigame.post_action(adventurer_id, false);
        }

        fn create_settings(
            ref self: ContractState,
            name: felt252,
            adventurer: Adventurer,
            bag: Bag,
            game_seed: u64,
            game_seed_until_xp: u16,
            in_battle: bool,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (settings_systems_address, _) = world.dns(@"settings_systems").unwrap();
            let settings_systems = ISettingsSystemsDispatcher { contract_address: settings_systems_address };
            let (settings_id, settings) = settings_systems.add_settings(name, adventurer, bag, game_seed, game_seed_until_xp, in_battle);
            self.minigame.create_settings(settings_id, format!("{}", name), "New Setting Description", settings);
        }

        fn create_objective(ref self: ContractState, score: u32) {
            self.minigame.create_objective(0, "Target Score", format!("{}", score));
        }

        fn settings_id(ref self: ContractState, adventurer_id: u64) -> u32 {
            self.minigame.get_settings_id(adventurer_id)
        }

        fn player_name(ref self: ContractState, adventurer_id: u64) -> felt252 {
            self.minigame.get_player_name(adventurer_id)
        }
    }
}
