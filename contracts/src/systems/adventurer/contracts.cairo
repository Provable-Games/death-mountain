// SPDX-License-Identifier: BUSL-1.1

use death_mountain::constants::discovery::DiscoveryEnums::DiscoveryType;
use death_mountain::models::adventurer::adventurer::{Adventurer, AdventurerVerbose};
use death_mountain::models::adventurer::bag::Bag;
use death_mountain::models::adventurer::item::Item;
use death_mountain::models::adventurer::stats::Stats;
use death_mountain::models::game::AdventurerEntropy;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IAdventurerSystems<T> {
    fn record_item_drop(ref self: T, adventurer_id: u64, item: Item);
    fn generate_starting_stats(self: @T, seed: u64) -> Stats;
    fn load_assets(self: @T, adventurer_id: u64) -> (Adventurer, Bag);
    fn get_adventurer(self: @T, adventurer_id: u64) -> Adventurer;
    fn get_adventurer_level(self: @T, adventurer_id: u64) -> u8;
    fn get_adventurer_health(self: @T, adventurer_id: u64) -> u16;
    fn get_adventurer_dungeon(self: @T, adventurer_id: u64) -> ContractAddress;
    fn get_adventurer_verbose(self: @T, adventurer_id: u64) -> AdventurerVerbose;
    fn get_adventurer_entropy(self: @T, adventurer_id: u64) -> AdventurerEntropy;
    fn get_adventurer_packed(self: @T, adventurer_id: u64) -> felt252;
    fn get_bag_packed(self: @T, adventurer_id: u64) -> felt252;
    fn get_bag(self: @T, adventurer_id: u64) -> Bag;
    fn get_adventurer_name(self: @T, adventurer_id: u64) -> felt252;
    fn add_stat_boosts(self: @T, adventurer: Adventurer, bag: Bag) -> Adventurer;
    fn remove_stat_boosts(self: @T, adventurer: Adventurer, bag: Bag) -> Adventurer;
    fn pack_adventurer(self: @T, adventurer: Adventurer) -> felt252;
    fn unpack_adventurer(self: @T, packed_adventurer: felt252) -> Adventurer;
    fn get_discovery(
        self: @T, adventurer_level: u8, discovery_type_rnd: u8, amount_rnd1: u8, amount_rnd2: u8,
    ) -> DiscoveryType;
    fn pack_bag(self: @T, bag: Bag) -> felt252;
    fn unpack_bag(self: @T, packed_bag: felt252) -> Bag;
    fn add_item_to_bag(self: @T, bag: Bag, item: Item) -> Bag;
    fn remove_item_from_bag(self: @T, bag: Bag, item_id: u8) -> (Bag, Item);
    fn add_new_item_to_bag(self: @T, bag: Bag, item_id: u8) -> Bag;
    fn bag_contains(self: @T, bag: Bag, item_id: u8) -> (bool, Item);
    fn get_randomness(self: @T, adventurer_xp: u16, seed: u64) -> (u32, u32, u16, u16, u8, u8, u8, u8);
    fn get_battle_randomness(self: @T, xp: u16, action_count: u16, seed: u64) -> (u8, u8, u8, u8);
    fn get_market(self: @T, adventurer_id: u64, seed: u64, market_size: u8) -> Array<u8>;
}

#[dojo::contract]
mod adventurer_systems {
    use death_mountain::constants::discovery::DiscoveryEnums::DiscoveryType;
    use death_mountain::constants::world::DEFAULT_NS;
    use death_mountain::models::adventurer::adventurer::{Adventurer, AdventurerVerbose, ImplAdventurer};
    use death_mountain::models::adventurer::bag::{Bag, BagVerbose, IBag, ImplBag};
    use death_mountain::models::adventurer::equipment::{EquipmentVerbose, IEquipment, ImplEquipment};
    use death_mountain::models::adventurer::item::Item;
    use death_mountain::models::adventurer::stats::{ImplStats, Stats};
    use death_mountain::models::game::{AdventurerEntropy, AdventurerPacked, BagPacked};
    use death_mountain::models::game_data::{DroppedItem};
    use death_mountain::models::market::ImplMarket;
    use death_mountain::systems::game_token::contracts::{IGameTokenSystemsDispatcher, IGameTokenSystemsDispatcherTrait};
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};
    use game_components_token::core::interface::{IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait};
    use game_components_token::extensions::minter::interface::{
        IMinigameTokenMinterDispatcher, IMinigameTokenMinterDispatcherTrait,
    };
    use starknet::ContractAddress;
    use super::IAdventurerSystems;

    #[abi(embed_v0)]
    impl AdventurerSystemsImpl of IAdventurerSystems<ContractState> {
        fn record_item_drop(ref self: ContractState, adventurer_id: u64, item: Item) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (contract_address, _) = world.dns(@"game_systems").unwrap();
            assert!(contract_address == starknet::get_caller_address(), "Only game_systems can record item drops");
            world.write_model(@DroppedItem { adventurer_id, item_id: item.id, item });
        }

        fn generate_starting_stats(self: @ContractState, seed: u64) -> Stats {
            ImplStats::generate_starting_stats(seed)
        }

        fn load_assets(self: @ContractState, adventurer_id: u64) -> (Adventurer, Bag) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let (mut adventurer, _) = _load_adventurer(world, adventurer_id);

            if adventurer.equipment.has_specials() {
                let item_stat_boosts = _get_stat_boosts(adventurer);
                adventurer.stats.apply_stats(item_stat_boosts);
            }

            let (bag, _) = _load_bag(world, adventurer_id);
            if bag.has_specials() {
                let bag_stat_boosts = _get_bag_stat_boosts(adventurer, bag);
                adventurer.stats.apply_stats(bag_stat_boosts);
            }

            adventurer.set_luck(bag);
            (adventurer, bag)
        }

        fn get_adventurer(self: @ContractState, adventurer_id: u64) -> Adventurer {
            let (adventurer, _) = _load_adventurer(self.world(@DEFAULT_NS()), adventurer_id);
            adventurer
        }

        fn get_adventurer_level(self: @ContractState, adventurer_id: u64) -> u8 {
            let (adventurer, _) = _load_adventurer(self.world(@DEFAULT_NS()), adventurer_id);
            adventurer.get_level()
        }

        fn get_adventurer_health(self: @ContractState, adventurer_id: u64) -> u16 {
            let (adventurer, _) = _load_adventurer(self.world(@DEFAULT_NS()), adventurer_id);
            adventurer.health
        }

        fn get_adventurer_verbose(self: @ContractState, adventurer_id: u64) -> AdventurerVerbose {
            let world_storage = self.world(@DEFAULT_NS());

            let (adventurer, packed_adventurer) = _load_adventurer(world_storage, adventurer_id);
            let (bag, packed_bag) = _load_bag(world_storage, adventurer_id);
            let name: felt252 = _get_adventurer_name(world_storage, adventurer_id);

            // proceed to create the verbose adventurer
            let equipment_verbose: EquipmentVerbose = adventurer.equipment.into();
            let bag_verbose: BagVerbose = bag.into();

            AdventurerVerbose {
                name,
                packed_adventurer,
                packed_bag,
                health: adventurer.health,
                xp: adventurer.xp,
                level: adventurer.get_level(),
                gold: adventurer.gold,
                beast_health: adventurer.beast_health,
                stat_upgrades_available: adventurer.stat_upgrades_available,
                stats: adventurer.stats,
                equipment: equipment_verbose,
                item_specials_seed: adventurer.item_specials_seed,
                action_count: adventurer.action_count,
                bag: bag_verbose,
            }
        }

        fn get_adventurer_dungeon(self: @ContractState, adventurer_id: u64) -> ContractAddress {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let (game_token_systems_address, _) = world.dns(@"game_token_systems").unwrap();
            let game_token = IMinigameDispatcher { contract_address: game_token_systems_address };
            let token_address = game_token.token_address();
            let token_metadata = IMinigameTokenDispatcher { contract_address: token_address }
                .token_metadata(adventurer_id);
            let minted_by_address = IMinigameTokenMinterDispatcher { contract_address: token_address }
                .get_minter_address(token_metadata.minted_by);
            minted_by_address
        }

        fn get_adventurer_entropy(self: @ContractState, adventurer_id: u64) -> AdventurerEntropy {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(adventurer_id)
        }

        fn get_adventurer_packed(self: @ContractState, adventurer_id: u64) -> felt252 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let adventurer_packed: AdventurerPacked = world.read_model(adventurer_id);
            adventurer_packed.packed
        }

        fn get_bag_packed(self: @ContractState, adventurer_id: u64) -> felt252 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let bag_packed: BagPacked = world.read_model(adventurer_id);
            bag_packed.packed
        }

        fn get_bag(self: @ContractState, adventurer_id: u64) -> Bag {
            let (bag, _) = _load_bag(self.world(@DEFAULT_NS()), adventurer_id);
            bag
        }

        fn get_adventurer_name(self: @ContractState, adventurer_id: u64) -> felt252 {
            _get_adventurer_name(self.world(@DEFAULT_NS()), adventurer_id)
        }

        fn add_stat_boosts(self: @ContractState, mut adventurer: Adventurer, bag: Bag) -> Adventurer {
            if adventurer.equipment.has_specials() {
                let item_stat_boosts = _get_stat_boosts(adventurer);
                adventurer.stats.apply_stats(item_stat_boosts);
            }
            if bag.has_specials() {
                let bag_stat_boosts = _get_bag_stat_boosts(adventurer, bag);
                adventurer.stats.apply_stats(bag_stat_boosts);
            }
            adventurer
        }

        fn remove_stat_boosts(self: @ContractState, mut adventurer: Adventurer, bag: Bag) -> Adventurer {
            if adventurer.equipment.has_specials() {
                let item_stat_boosts = _get_stat_boosts(adventurer);
                adventurer.stats.remove_stats(item_stat_boosts);
            }
            if bag.has_specials() {
                let bag_stat_boosts = _get_bag_stat_boosts(adventurer, bag);
                adventurer.stats.remove_stats(bag_stat_boosts);
            }
            adventurer
        }

        fn pack_adventurer(self: @ContractState, adventurer: Adventurer) -> felt252 {
            ImplAdventurer::pack(adventurer)
        }

        fn unpack_adventurer(self: @ContractState, packed_adventurer: felt252) -> Adventurer {
            ImplAdventurer::unpack(packed_adventurer)
        }

        fn get_discovery(
            self: @ContractState, adventurer_level: u8, discovery_type_rnd: u8, amount_rnd1: u8, amount_rnd2: u8,
        ) -> DiscoveryType {
            ImplAdventurer::get_discovery(adventurer_level, discovery_type_rnd, amount_rnd1, amount_rnd2)
        }

        fn pack_bag(self: @ContractState, bag: Bag) -> felt252 {
            ImplBag::pack(bag)
        }

        fn unpack_bag(self: @ContractState, packed_bag: felt252) -> Bag {
            ImplBag::unpack(packed_bag)
        }

        fn add_item_to_bag(self: @ContractState, mut bag: Bag, item: Item) -> Bag {
            ImplBag::add_item(ref bag, item);
            bag
        }

        fn remove_item_from_bag(self: @ContractState, mut bag: Bag, item_id: u8) -> (Bag, Item) {
            let item = bag.remove_item(item_id);
            (bag, item)
        }

        fn add_new_item_to_bag(self: @ContractState, mut bag: Bag, item_id: u8) -> Bag {
            bag.add_new_item(item_id);
            bag
        }

        fn bag_contains(self: @ContractState, bag: Bag, item_id: u8) -> (bool, Item) {
            ImplBag::contains(bag, item_id)
        }

        fn get_randomness(self: @ContractState, adventurer_xp: u16, seed: u64) -> (u32, u32, u16, u16, u8, u8, u8, u8) {
            ImplAdventurer::get_randomness(adventurer_xp, seed)
        }

        fn get_battle_randomness(self: @ContractState, xp: u16, action_count: u16, seed: u64) -> (u8, u8, u8, u8) {
            ImplAdventurer::get_battle_randomness(xp, action_count, seed)
        }

        fn get_market(self: @ContractState, adventurer_id: u64, seed: u64, market_size: u8) -> Array<u8> {
            ImplMarket::get_available_items(adventurer_id, seed, market_size)
        }
    }

    /// @title Load Adventurer
    /// @notice Loads the adventurer and returns the adventurer.
    /// @dev This function is called when the adventurer is loaded.
    /// @param world A reference to the WorldStorage object.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @return The unpacked adventurer struct.
    /// @return A felt252 representing the adventurer.
    fn _load_adventurer(world: WorldStorage, adventurer_id: u64) -> (Adventurer, felt252) {
        let adventurer_packed: AdventurerPacked = world.read_model(adventurer_id);
        let adventurer = ImplAdventurer::unpack(adventurer_packed.packed);
        (adventurer, adventurer_packed.packed)
    }

    /// @title Load Bag
    /// @notice Loads the bag and returns the bag.
    /// @dev This function is called when the bag is loaded.
    /// @param self A reference to the ContractState object.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @return The unpacked bag struct.
    /// @return A felt252 representing the bag.
    fn _load_bag(world: WorldStorage, adventurer_id: u64) -> (Bag, felt252) {
        let bag_packed: BagPacked = world.read_model(adventurer_id);
        let bag = ImplBag::unpack(bag_packed.packed);
        (bag, bag_packed.packed)
    }

    fn _get_adventurer_name(world: WorldStorage, adventurer_id: u64) -> felt252 {
        let (game_token_address, _) = world.dns(@"game_token_systems").unwrap();
        let game_token = IGameTokenSystemsDispatcher { contract_address: game_token_address };
        let player_name = game_token.player_name(adventurer_id);
        player_name
    }

    fn _get_stat_boosts(adventurer: Adventurer) -> Stats {
        adventurer.equipment.get_stat_boosts(adventurer.item_specials_seed)
    }

    fn _get_bag_stat_boosts(adventurer: Adventurer, bag: Bag) -> Stats {
        bag.get_stat_boosts(adventurer.item_specials_seed)
    }
}
