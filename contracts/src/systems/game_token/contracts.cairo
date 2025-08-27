// SPDX-License-Identifier: MIT

#[starknet::interface]
pub trait IGameTokenSystems<T> {
    fn player_name(ref self: T, adventurer_id: u64) -> felt252;
}

#[dojo::contract]
mod game_token_systems {
    use death_mountain::constants::world::DEFAULT_NS;
    use death_mountain::libs::game::ImplGameLibs;
    use death_mountain::models::adventurer::adventurer::{ImplAdventurer};
    use death_mountain::models::adventurer::bag::{ImplBag};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait};
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::interface::IMinigameTokenData;

    use game_components_minigame::minigame::MinigameComponent;

    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::{ContractAddress};

    // Components
    component!(path: MinigameComponent, storage: minigame, event: MinigameEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl MinigameImpl = MinigameComponent::MinigameImpl<ContractState>;
    impl MinigameInternalImpl = MinigameComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        minigame: MinigameComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MinigameEvent: MinigameComponent::Event,
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
        let (objectives_systems_address, _) = world.dns(@"objectives_systems").unwrap();

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
                Option::Some(objectives_systems_address), // objectives_address
                denshokan_address,
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

    // ------------------------------------------ //
    // ------------ Game Token Systems ------------------------ //
    // ------------------------------------------ //
    #[abi(embed_v0)]
    impl GameTokenSystemsImpl of super::IGameTokenSystems<ContractState> {
        fn player_name(ref self: ContractState, adventurer_id: u64) -> felt252 {
            self.minigame.get_player_name(adventurer_id)
        }
    }
}
