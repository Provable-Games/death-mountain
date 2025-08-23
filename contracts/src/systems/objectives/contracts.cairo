#[starknet::interface]
pub trait IObjectivesSystems<T> {
    fn create_objective(ref self: T, score: u32);
}

#[dojo::contract]
mod objectives_systems {
    use death_mountain::constants::world::{DEFAULT_NS, VERSION};
    use death_mountain::libs::game::ImplGameLibs;
    use death_mountain::models::objectives::{ScoreObjective, ScoreObjectiveCount};
    use death_mountain::systems::adventurer::contracts::IAdventurerSystemsDispatcherTrait;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::extensions::objectives::interface::{IMinigameObjectives, IMinigameObjectivesDetails};
    use game_components_minigame::extensions::objectives::objectives::ObjectivesComponent;
    use game_components_minigame::extensions::objectives::structs::GameObjective;
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};

    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: ObjectivesComponent, storage: objectives, event: ObjectivesEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    impl MinigameInternalObjectivesImpl = ObjectivesComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        objectives: ObjectivesComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ObjectivesEvent: ObjectivesComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }


    /// @title Dojo Init
    /// @notice Initializes the contract
    /// @dev This is the constructor for the contract. It is called once when the contract is
    /// deployed.
    fn dojo_init(ref self: ContractState) {
        self.objectives.initializer();
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
    }

    #[abi(embed_v0)]
    impl ObjectivesDetailsImpl of IMinigameObjectivesDetails<ContractState> {
        fn objectives_details(self: @ContractState, token_id: u64) -> Span<GameObjective> {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let (game_token_systems_address, _) = world.dns(@"game_token_systems").unwrap();
            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_token_systems_address };
            let token_address = minigame_dispatcher.token_address();
            let objective_ids = self.objectives.get_objective_ids(token_id, token_address);
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
    // ------------ Objective Systems ------------------------ //
    // ------------------------------------------ //
    #[abi(embed_v0)]
    impl ObjectivesSystemsImpl of super::IObjectivesSystems<ContractState> {
        fn create_objective(ref self: ContractState, score: u32) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let objective_count_model: ScoreObjectiveCount = world.read_model(VERSION);
            let objective_count = objective_count_model.count;
            let (game_token_systems_address, _) = world.dns(@"game_token_systems").unwrap();
            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_token_systems_address };
            let token_address = minigame_dispatcher.token_address();
            self
                .objectives
                .create_objective(objective_count + 1, "Target Score", format!("Score Above {}", score), token_address);
            world.write_model(@ScoreObjectiveCount { key: VERSION, count: objective_count + 1 })
        }
    }
}
