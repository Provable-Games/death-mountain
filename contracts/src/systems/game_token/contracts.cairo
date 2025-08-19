// SPDX-License-Identifier: MIT

#[starknet::interface]
pub trait IGameTokenSystems<T> {
    fn create_objective(ref self: T, score: u32);
    fn player_name(ref self: T, adventurer_id: u64) -> ByteArray;
}

#[dojo::contract]
mod game_token_systems {
    use death_mountain::constants::world::{DEFAULT_NS, VERSION};
    use death_mountain::libs::game::ImplGameLibs;
    use death_mountain::models::adventurer::adventurer::{ImplAdventurer};
    use death_mountain::models::adventurer::bag::{ImplBag};
    use death_mountain::models::game::{GameSettings, GameSettingsMetadata, StatsMode};
    use death_mountain::models::objectives::{ScoreObjective, ScoreObjectiveCount};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait};
    use death_mountain::utils::vrf::VRFImpl;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::extensions::objectives::interface::{IMinigameObjectives};
    use game_components_minigame::extensions::objectives::objectives::ObjectivesComponent;
    use game_components_minigame::extensions::objectives::structs::{GameObjective};
    use game_components_minigame::interface::IMinigameTokenData;

    use game_components_minigame::minigame::MinigameComponent;

    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::{ContractAddress, get_contract_address};

    // Components
    component!(path: MinigameComponent, storage: minigame, event: MinigameEvent);
    component!(path: ObjectivesComponent, storage: objectives, event: ObjectivesEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl MinigameImpl = MinigameComponent::MinigameImpl<ContractState>;
    impl MinigameInternalImpl = MinigameComponent::InternalImpl<ContractState>;
    impl MinigameInternalObjectivesImpl = ObjectivesComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        minigame: MinigameComponent::Storage,
        #[substorage(v0)]
        objectives: ObjectivesComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MinigameEvent: MinigameComponent::Event,
        #[flat]
        ObjectivesEvent: ObjectivesComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    /// @title Dojo Init
    /// @notice Initializes the contract
    /// @dev This is the constructor for the contract. It is called once when the contract is
    /// deployed.
    ///
    /// @param creator_address: the address of the creator of the game
    /// @param denshokan_address: the address of the denshokan contract
    /// @param renderer_address: optional renderer address, defaults to 'renderer_systems' if None
    fn dojo_init(
        ref self: ContractState,
        creator_address: ContractAddress,
        denshokan_address: ContractAddress,
        renderer_address: Option<ContractAddress>,
    ) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        let (settings_systems_address, _) = world.dns(@"settings_systems").unwrap();

        // Use provided renderer address or default to 'renderer_systems'
        let final_renderer_address = match renderer_address {
            Option::Some(addr) => addr,
            Option::None => {
                let (default_renderer, _) = world.dns(@"renderer_systems").unwrap();
                default_renderer
            },
        };

        self
            .minigame
            .initializer(
                creator_address,
                "Death Mountain",
                "Death Mountain is an onchain dungeon generator",
                "Provable Games",
                "Provable Games",
                "Dungeon Generator",
                "https://deathmountain.gg/favicon.png",
                Option::None, // color
                Option::None, // client_url
                Option::Some(final_renderer_address), // renderer address
                Option::Some(settings_systems_address), // settings_address
                Option::Some(get_contract_address()), // objectives_address
                denshokan_address,
            );

        self.objectives.initializer();

        world
            .write_model(
                @GameSettings {
                    settings_id: 0,
                    vrf_address: VRFImpl::cartridge_vrf_address(),
                    adventurer: ImplAdventurer::new(0),
                    bag: ImplBag::new(),
                    game_seed: 0,
                    game_seed_until_xp: 0,
                    in_battle: false,
                    stats_mode: StatsMode::Dodge,
                    base_damage_reduction: 50,
                    market_size: 25,
                },
            );

        world
            .write_model(
                @GameSettingsMetadata {
                    settings_id: 0,
                    name: 'Default',
                    description: "Default Game Settings",
                    created_by: starknet::get_caller_address(),
                    created_at: starknet::get_block_timestamp(),
                },
            );
    }

    // ------------------------------------------ //
    // ------------ Minigame Component ------------------------ //
    // ------------------------------------------ //
    #[abi(embed_v0)]
    impl GameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: u64) -> u32 {
            let game_libs = ImplGameLibs::new(self.world(@DEFAULT_NS()));
            let adventurer = game_libs.adventurer.get_adventurer(token_id);
            adventurer.xp.into()
        }
        fn game_over(self: @ContractState, token_id: u64) -> bool {
            let game_libs = ImplGameLibs::new(self.world(@DEFAULT_NS()));
            let adventurer = game_libs.adventurer.get_adventurer(token_id);
            adventurer.health == 0
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
            let objective_ids = self.objectives.get_objective_ids(token_id, self.token_address());
            let mut objective_index = 0;
            let mut objectives = array![];
            loop {
                if objective_index == objective_ids.len() {
                    break;
                }
                let objective_id = *objective_ids.at(objective_index);
                let objective_score: ScoreObjective = world.read_model(objective_id);
                objectives
                    .append(
                        GameObjective { name: "Target Score", value: format!("Score Above {}", objective_score.score) },
                    );
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
        fn create_objective(ref self: ContractState, score: u32) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let objective_count_model: ScoreObjectiveCount = world.read_model(VERSION);
            let objective_count = objective_count_model.count;
            self
                .objectives
                .create_objective(
                    objective_count + 1, "Target Score", format!("Score Above {}", score), self.token_address(),
                );
            world.write_model(@ScoreObjectiveCount { key: VERSION, count: objective_count + 1 })
        }

        fn player_name(ref self: ContractState, adventurer_id: u64) -> ByteArray {
            self.minigame.get_player_name(adventurer_id)
        }
    }
}
