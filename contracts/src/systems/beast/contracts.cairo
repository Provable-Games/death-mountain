// SPDX-License-Identifier: BUSL-1.1

use death_mountain::constants::combat::CombatEnums::Type;
use death_mountain::models::beast::Beast;
use death_mountain::models::game_data::{AdventurerKilled, CollectableEntity, CollectableResult, EntityStats};
use starknet::ContractAddress;

#[starknet::interface]
pub trait IBeastSystems<T> {
    fn add_collectable(
        ref self: T, seed: u64, entity_id: u8, level: u16, health: u16, prefix: u8, suffix: u8, adventurer_id: u64,
    );
    fn add_kill(ref self: T, entity_hash: felt252, adventurer_id: u64);
    fn premint_collectable(
        ref self: T, seed: u64, entity_id: u8, prefix: u8, suffix: u8, level: u16, health: u16,
    ) -> u64;
    fn get_valid_collectable(
        self: @T, dungeon: ContractAddress, adventurer_id: u64, entity_hash: felt252,
    ) -> CollectableResult<(u64, u16, u16)>;
    fn get_collectable(self: @T, dungeon: ContractAddress, entity_hash: felt252, index: u64) -> CollectableEntity;
    fn get_collectable_count(self: @T, dungeon: ContractAddress, entity_hash: felt252) -> u64;
    fn is_beast_collectable(self: @T, dungeon: ContractAddress, beast_id: u8, prefix: u8, suffix: u8) -> bool;
    fn get_entity_stats(self: @T, dungeon: ContractAddress, entity_hash: felt252) -> EntityStats;
    fn get_adventurer_killed(
        self: @T, dungeon: ContractAddress, entity_hash: felt252, kill_index: u64,
    ) -> AdventurerKilled;
    fn get_starter_beast(self: @T, starter_weapon_type: Type) -> Beast;
    fn get_beast(
        self: @T,
        adventurer_level: u8,
        weapon_type: Type,
        seed: u32,
        health_rnd: u16,
        level_rnd: u16,
        special2_rnd: u8,
        special3_rnd: u8,
    ) -> Beast;
}

#[dojo::contract]
mod beast_systems {
    use death_mountain::constants::combat::CombatEnums::Type;
    use death_mountain::constants::world::DEFAULT_NS;
    use death_mountain::models::adventurer::adventurer::ImplAdventurer;
    use death_mountain::models::beast::{Beast, ImplBeast};
    use death_mountain::models::game_data::{
        AdventurerKilled, CollectableCount, CollectableEntity, CollectableResult, EntityStats,
    };
    use death_mountain::utils::vrf::VRFImpl;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};
    use game_components_token::core::interface::{IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait};
    use game_components_token::extensions::minter::interface::{IMinigameTokenMinterDispatcher, IMinigameTokenMinterDispatcherTrait};
    use starknet::ContractAddress;
    use super::IBeastSystems;

    #[abi(embed_v0)]
    impl BeastSystemsImpl of IBeastSystems<ContractState> {
        fn add_collectable(
            ref self: ContractState,
            seed: u64,
            entity_id: u8,
            level: u16,
            health: u16,
            prefix: u8,
            suffix: u8,
            adventurer_id: u64,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let (contract_address, _) = world.dns(@"game_systems").unwrap();
            assert!(contract_address == starknet::get_caller_address(), "Only game_systems can add collectables");

            let (game_token_systems_address, _) = world.dns(@"game_token_systems").unwrap();
            let game_token = IMinigameDispatcher { contract_address: game_token_systems_address };
            let token_address = game_token.token_address();
            let token_metadata = IMinigameTokenDispatcher { contract_address: token_address }.token_metadata(adventurer_id);
            let minted_by_address = IMinigameTokenMinterDispatcher { contract_address: token_address }.get_minter_address(token_metadata.minted_by);
            let entity_hash = ImplBeast::get_beast_hash(entity_id, prefix, suffix);
            let mut collectable_count: CollectableCount = world.read_model((minted_by_address, entity_hash));

            world
                .write_model(
                    @CollectableEntity {
                        dungeon: minted_by_address,
                        entity_hash,
                        index: collectable_count.count,
                        seed,
                        id: entity_id,
                        level,
                        health,
                        prefix,
                        suffix,
                        killed_by: adventurer_id,
                    },
                );

            collectable_count.count += 1;
            world.write_model(@collectable_count);
        }

        fn add_kill(ref self: ContractState, entity_hash: felt252, adventurer_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let (contract_address, _) = world.dns(@"game_systems").unwrap();
            assert!(contract_address == starknet::get_caller_address(), "Only game_systems can add kills");

            let (game_token_systems_address, _) = world.dns(@"game_token_systems").unwrap();
            let game_token = IMinigameDispatcher { contract_address: game_token_systems_address };
            let token_address = game_token.token_address();
            let token_metadata = IMinigameTokenDispatcher { contract_address: token_address }.token_metadata(adventurer_id);
            let minted_by_address = IMinigameTokenMinterDispatcher { contract_address: token_address }.get_minter_address(token_metadata.minted_by);
            let mut entity_stats: EntityStats = world.read_model((token_metadata.minted_by, entity_hash));

            entity_stats.adventurers_killed += 1;
            world.write_model(@entity_stats);
            world
                .write_model(
                    @AdventurerKilled {
                        dungeon: minted_by_address,
                        entity_hash,
                        kill_index: entity_stats.adventurers_killed,
                        adventurer_id,
                    },
                );
        }

        fn premint_collectable(
            ref self: ContractState, seed: u64, entity_id: u8, prefix: u8, suffix: u8, level: u16, health: u16,
        ) -> u64 {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = starknet::get_caller_address();

            let entity_hash = ImplBeast::get_beast_hash(entity_id, prefix, suffix);
            let mut collectable_count: CollectableCount = world.read_model((caller, entity_hash));

            world
                .write_model(
                    @CollectableEntity {
                        dungeon: caller,
                        entity_hash,
                        index: collectable_count.count,
                        seed,
                        id: entity_id,
                        level,
                        health,
                        prefix,
                        suffix,
                        killed_by: 0,
                    },
                );

            collectable_count.count += 1;
            world.write_model(@collectable_count);
            seed
        }

        fn get_valid_collectable(
            self: @ContractState, dungeon: ContractAddress, adventurer_id: u64, entity_hash: felt252,
        ) -> CollectableResult<(u64, u16, u16)> {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let collectable_entity: CollectableEntity = world.read_model((dungeon, entity_hash, 0));

            if collectable_entity.killed_by == adventurer_id {
                CollectableResult::Ok((collectable_entity.seed, collectable_entity.level, collectable_entity.health))
            } else {
                CollectableResult::Err('Not Valid'.into())
            }
        }

        fn get_collectable(
            self: @ContractState, dungeon: ContractAddress, entity_hash: felt252, index: u64,
        ) -> CollectableEntity {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model((dungeon, entity_hash, index))
        }

        fn get_collectable_count(self: @ContractState, dungeon: ContractAddress, entity_hash: felt252) -> u64 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let collectable_count: CollectableCount = world.read_model((dungeon, entity_hash));
            collectable_count.count
        }

        fn is_beast_collectable(
            self: @ContractState, dungeon: ContractAddress, beast_id: u8, prefix: u8, suffix: u8,
        ) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let entity_hash = ImplBeast::get_beast_hash(beast_id, prefix, suffix);
            let collectable_entity: CollectableEntity = world.read_model((dungeon, entity_hash, 0));
            collectable_entity.id == 0
        }

        fn get_entity_stats(self: @ContractState, dungeon: ContractAddress, entity_hash: felt252) -> EntityStats {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model((dungeon, entity_hash))
        }

        fn get_adventurer_killed(
            self: @ContractState, dungeon: ContractAddress, entity_hash: felt252, kill_index: u64,
        ) -> AdventurerKilled {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model((dungeon, entity_hash, kill_index))
        }

        fn get_starter_beast(self: @ContractState, starter_weapon_type: Type) -> Beast {
            ImplBeast::get_starter_beast(starter_weapon_type)
        }

        fn get_beast(
            self: @ContractState,
            adventurer_level: u8,
            weapon_type: Type,
            seed: u32,
            health_rnd: u16,
            level_rnd: u16,
            special2_rnd: u8,
            special3_rnd: u8,
        ) -> Beast {
            ImplBeast::get_beast(adventurer_level, weapon_type, seed, health_rnd, level_rnd, special2_rnd, special3_rnd)
        }
    }
}
