// SPDX-License-Identifier: MIT

#[starknet::interface]
pub trait IGameTokenSystems<T> {}

#[dojo::contract]
mod game_token_systems {
    use death_mountain::constants::world::{DEFAULT_NS, SCORE_ATTRIBUTE, SCORE_MODEL, SETTINGS_MODEL};
    use death_mountain::libs::game::ImplGameLibs;
    use death_mountain::models::adventurer::adventurer::{ImplAdventurer};
    use death_mountain::models::adventurer::bag::{ImplBag};

    use death_mountain::models::game::{GameSettings, GameSettingsMetadata, StatsMode};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait};
    use death_mountain::systems::renderer::contracts::{IRendererSystemsDispatcherTrait};
    use death_mountain::utils::vrf::VRFImpl;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage};

    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::interface::{IERC721Metadata};
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::ContractAddress;

    use tournaments::components::game::game_component;
    use tournaments::components::interfaces::{IGameDetails, ISettings};
    use tournaments::components::libs::lifecycle::LifecycleAssertionsImpl;

    // Components
    component!(path: game_component, storage: game, event: GameEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);

    #[abi(embed_v0)]
    impl GameImpl = game_component::GameImpl<ContractState>;
    impl GameInternalImpl = game_component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721CamelOnlyImpl = ERC721Component::ERC721CamelOnlyImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        game: game_component::Storage,
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        GameEvent: game_component::Event,
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    /// @title Dojo Init
    /// @notice Initializes the contract
    /// @dev This is the constructor for the contract. It is called once when the contract is
    /// deployed.
    ///
    /// @param creator_address: the address of the creator of the game
    fn dojo_init(ref self: ContractState, creator_address: ContractAddress) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());

        self.erc721.initializer("Death Mountain", "DM", "https://deathmountain.gg/");
        self
            .game
            .initializer(
                creator_address,
                'Death Mountain',
                "Death Mountain is an onchain dungeon generator",
                'Provable Games',
                'Provable Games',
                'Dungeon Generator',
                "https://deathmountain.gg/favicon-32x32.png",
                DEFAULT_NS(),
                SCORE_MODEL(),
                SCORE_ATTRIBUTE(),
                SETTINGS_MODEL(),
            );

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
                    base_damage_reduction: 0,
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
    // ------------ Game Component ------------------------ //
    // ------------------------------------------ //
    #[abi(embed_v0)]
    impl SettingsImpl of ISettings<ContractState> {
        fn setting_exists(self: @ContractState, settings_id: u32) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            settings.adventurer.health != 0
        }
    }

    #[abi(embed_v0)]
    impl GameDetailsImpl of IGameDetails<ContractState> {
        fn score(self: @ContractState, game_id: u64) -> u32 {
            let game_libs = ImplGameLibs::new(self.world(@DEFAULT_NS()));
            let adventurer = game_libs.adventurer.get_adventurer(game_id);
            adventurer.xp.into()
        }
    }

    #[abi(embed_v0)]
    impl ERC721Metadata of IERC721Metadata<ContractState> {
        /// Returns the NFT name.
        fn name(self: @ContractState) -> ByteArray {
            "Death Mountain"
        }

        /// Returns the NFT symbol.
        fn symbol(self: @ContractState) -> ByteArray {
            "DM"
        }

        /// Returns the Uniform Resource Identifier (URI) for the `token_id` token.
        /// If the URI is not set, the return value will be an empty ByteArray.
        ///
        /// Requirements:
        ///
        /// - `token_id` exists.
        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            self.erc721._require_owned(token_id);

            let game_libs = ImplGameLibs::new(self.world(@DEFAULT_NS()));
            game_libs.renderer.create_metadata(token_id.try_into().unwrap())
        }
    }
}
