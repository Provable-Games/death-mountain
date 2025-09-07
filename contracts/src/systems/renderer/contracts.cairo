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
    use death_mountain::models::adventurer::adventurer::AdventurerVerbose;
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
            let adventurer_verbose = self.get_adventurer_verbose(token_id);
            Renderer::get_traits(adventurer_verbose)
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

        fn generate_details(self: @ContractState, adventurer_id: u64) -> Span<GameDetail> {
            let adventurer_verbose = self.get_adventurer_verbose(adventurer_id);
            generate_details(adventurer_verbose)
        }

        fn generate_svg(self: @ContractState, adventurer_id: u64) -> ByteArray {
            let adventurer_verbose = self.get_adventurer_verbose(adventurer_id);
            generate_svg(adventurer_verbose)
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
