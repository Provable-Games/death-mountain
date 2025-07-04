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
    fn get_item_by_id(self: @T, item_id: u64) -> Loot; // New function for u64 IDs
}

#[dojo::contract]
mod loot_systems {
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
    use death_mountain::constants::world::{DEFAULT_NS, VERSION};
    use death_mountain::models::combat::SpecialPowers;
    use death_mountain::models::loot::{ImplLoot, Loot};
    use death_mountain::models::item_registry::{Item, ItemCounter};
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use super::ILootSystems;
    
    // Helper function to check if genesis items are initialized
    fn are_genesis_items_initialized(world: @WorldStorage) -> bool {
        let item_counter: ItemCounter = world.read_model(VERSION);
        item_counter.genesis_count > 0
    }

    #[abi(embed_v0)]
    impl LootSystemsImpl of ILootSystems<ContractState> {
        fn get_item(self: @ContractState, item_id: u8) -> Loot {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            
            // Check if genesis items are initialized
            if are_genesis_items_initialized(@world) {
                // Use dynamic lookup
                let item_id_u64: u64 = item_id.into();
                let item: Item = world.read_model(item_id_u64);
                
                // If item exists in dynamic storage
                if item.id != 0 {
                    return self.get_item_by_id(item_id_u64);
                }
            }
            
            // Fall back to hardcoded implementation
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
            let world: WorldStorage = self.world(@DEFAULT_NS());
            
            // Check if genesis items are initialized
            if are_genesis_items_initialized(@world) {
                // Use dynamic lookup
                let item_id_u64: u64 = item_id.into();
                let item: Item = world.read_model(item_id_u64);
                
                // If item exists in dynamic storage
                if item.id != 0 {
                    let loot = self.get_item_by_id(item_id_u64);
                    return loot.tier;
                }
            }
            
            // Fall back to hardcoded implementation
            ImplLoot::get_tier(item_id)
        }

        fn get_type(self: @ContractState, item_id: u8) -> Type {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            
            // Check if genesis items are initialized
            if are_genesis_items_initialized(@world) {
                // Use dynamic lookup
                let item_id_u64: u64 = item_id.into();
                let item: Item = world.read_model(item_id_u64);
                
                // If item exists in dynamic storage
                if item.id != 0 {
                    let loot = self.get_item_by_id(item_id_u64);
                    return loot.item_type;
                }
            }
            
            // Fall back to hardcoded implementation
            ImplLoot::get_type(item_id)
        }

        fn get_slot(self: @ContractState, item_id: u8) -> Slot {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            
            // Check if genesis items are initialized
            if are_genesis_items_initialized(@world) {
                // Use dynamic lookup
                let item_id_u64: u64 = item_id.into();
                let item: Item = world.read_model(item_id_u64);
                
                // If item exists in dynamic storage
                if item.id != 0 {
                    let loot = self.get_item_by_id(item_id_u64);
                    return loot.slot;
                }
            }
            
            // Fall back to hardcoded implementation
            ImplLoot::get_slot(item_id)
        }

        fn is_starting_weapon(self: @ContractState, item_id: u8) -> bool {
            ImplLoot::is_starting_weapon(item_id)
        }

        fn get_item_by_id(self: @ContractState, item_id: u64) -> Loot {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let item: Item = world.read_model(item_id);
            
            // Check if item exists (id will be 0 if not found)
            if item.id == 0 {
                // Fall back to the old implementation for u8 range
                if item_id <= 255 {
                    return ImplLoot::get_item(item_id.try_into().unwrap());
                } else {
                    // Return a blank item for non-existent items
                    return Loot {
                        id: 0,
                        tier: Tier::None(()),
                        item_type: Type::None(()),
                        slot: Slot::None(()),
                    };
                }
            }
            
            // Convert enum values to proper enum types
            let tier = if item.tier == 1 {
                Tier::T1(())
            } else if item.tier == 2 {
                Tier::T2(())
            } else if item.tier == 3 {
                Tier::T3(())
            } else if item.tier == 4 {
                Tier::T4(())
            } else if item.tier == 5 {
                Tier::T5(())
            } else {
                Tier::None(())
            };
            
            let item_type = if item.item_type == 1 {
                Type::Magic_or_Cloth(())
            } else if item.item_type == 2 {
                Type::Blade_or_Hide(())
            } else if item.item_type == 3 {
                Type::Bludgeon_or_Metal(())
            } else if item.item_type == 4 {
                Type::Necklace(())
            } else if item.item_type == 5 {
                Type::Ring(())
            } else {
                Type::None(())
            };
            
            let slot = if item.slot == 1 {
                Slot::Weapon(())
            } else if item.slot == 2 {
                Slot::Chest(())
            } else if item.slot == 3 {
                Slot::Head(())
            } else if item.slot == 4 {
                Slot::Waist(())
            } else if item.slot == 5 {
                Slot::Foot(())
            } else if item.slot == 6 {
                Slot::Hand(())
            } else if item.slot == 7 {
                Slot::Neck(())
            } else if item.slot == 8 {
                Slot::Ring(())
            } else {
                Slot::None(())
            };
            
            Loot {
                id: item.id.try_into().unwrap_or(0),
                tier,
                item_type,
                slot,
            }
        }
    }
}
