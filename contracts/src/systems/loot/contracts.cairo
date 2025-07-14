// SPDX-License-Identifier: MIT

use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
use death_mountain::models::combat::SpecialPowers;
use death_mountain::models::loot::Loot;

#[starknet::interface]
pub trait ILootSystems<T> {
    fn get_item(self: @T, item_id: u8) -> Loot;
    fn get_specials(self: @T, item_id: u8, greatness: u8, seed: u16) -> SpecialPowers;
    fn get_suffix(self: @T, item_id: u8, seed: u16) -> u8;
    fn get_prefix1(self: @T, item_id: u8, seed: u16) -> u8;
    fn get_prefix2(self: @T, item_id: u8, seed: u16) -> u8;
    fn get_tier(self: @T, item_id: u8) -> Tier;
    fn get_type(self: @T, item_id: u8) -> Type;
    fn get_slot(self: @T, item_id: u8) -> Slot;
    fn is_starting_weapon(self: @T, item_id: u8) -> bool;
}

#[dojo::contract]
mod loot_systems {
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
    use death_mountain::models::combat::SpecialPowers;
    use death_mountain::models::loot::{ImplLoot, Loot};
    use super::ILootSystems;

    #[abi(embed_v0)]
    impl LootSystemsImpl of ILootSystems<ContractState> {
        fn get_item(self: @ContractState, item_id: u8) -> Loot {
            ImplLoot::get_item(item_id)
        }

        fn get_specials(self: @ContractState, item_id: u8, greatness: u8, seed: u16) -> SpecialPowers {
            ImplLoot::get_specials(item_id, greatness, seed)
        }

        fn get_suffix(self: @ContractState, item_id: u8, seed: u16) -> u8 {
            ImplLoot::get_suffix(item_id, seed)
        }

        fn get_prefix1(self: @ContractState, item_id: u8, seed: u16) -> u8 {
            ImplLoot::get_prefix1(item_id, seed)
        }

        fn get_prefix2(self: @ContractState, item_id: u8, seed: u16) -> u8 {
            ImplLoot::get_prefix2(item_id, seed)
        }

        fn get_tier(self: @ContractState, item_id: u8) -> Tier {
            ImplLoot::get_tier(item_id)
        }

        fn get_type(self: @ContractState, item_id: u8) -> Type {
            ImplLoot::get_type(item_id)
        }

        fn get_slot(self: @ContractState, item_id: u8) -> Slot {
            ImplLoot::get_slot(item_id)
        }

        fn is_starting_weapon(self: @ContractState, item_id: u8) -> bool {
            ImplLoot::is_starting_weapon(item_id)
        }
    }
}
