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
    fn get_item_by_id(self: @T, item_id: u64) -> Loot; // For u64 IDs
    fn add_item(
        ref self: T,
        name: felt252,
        tier: u8,
        item_type: u8,
        slot: u8,
        prefix1_unlock: u8,
        prefix2_unlock: u8,
        suffix_unlock: u8,
        special_power_id: u8,
    ) -> u64; // Returns new item ID
    fn initialize_genesis_items(ref self: T); // Initialize the original 101 items
}

#[dojo::contract]
mod loot_systems {
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
    use death_mountain::constants::loot::{PREFIXES_UNLOCK_GREATNESS, SUFFIX_UNLOCK_GREATNESS};
    use death_mountain::constants::world::{DEFAULT_NS, VERSION};
    use death_mountain::models::combat::SpecialPowers;
    use death_mountain::models::item_registry::{Item, ItemCounter, ItemSpecialPowers};
    use death_mountain::models::loot::{ImplLoot, Loot};
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use super::ILootSystems;

    // Internal validation function
    fn validate_item(name: felt252, tier: u8, item_type: u8, slot: u8) -> bool {
        // Name cannot be empty
        if name == 0 {
            return false;
        }

        // Validate tier (1-5)
        if tier < 1 || tier > 5 {
            return false;
        }

        // Validate item type (1-5 based on Type enum)
        if item_type < 1 || item_type > 5 {
            return false;
        }

        // Validate slot (1-8 based on Slot enum)
        if slot < 1 || slot > 8 {
            return false;
        }

        true
    }

    #[abi(embed_v0)]
    impl LootSystemsImpl of ILootSystems<ContractState> {
        fn get_item(self: @ContractState, item_id: u8) -> Loot {
            // For now, continue using the hardcoded implementation
            // This will be replaced once migration is complete
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
                    return Loot { id: 0, tier: Tier::None(()), item_type: Type::None(()), slot: Slot::None(()) };
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

            Loot { id: item.id.try_into().unwrap_or(0), tier, item_type, slot }
        }

        fn add_item(
            ref self: ContractState,
            name: felt252,
            tier: u8,
            item_type: u8,
            slot: u8,
            prefix1_unlock: u8,
            prefix2_unlock: u8,
            suffix_unlock: u8,
            special_power_id: u8,
        ) -> u64 {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Validate the item
            assert(validate_item(name, tier, item_type, slot), 'Invalid item parameters');

            // Get and increment item counter
            let mut item_counter: ItemCounter = world.read_model(VERSION);
            item_counter.count += 1;

            // Create the new item
            let item = Item {
                id: item_counter.count,
                name,
                tier,
                item_type,
                slot,
                is_genesis: false // New items are not genesis items
            };

            // Create special powers configuration
            let item_special_powers = ItemSpecialPowers {
                id: item_counter.count, prefix1_unlock, prefix2_unlock, suffix_unlock, special_power_id,
            };

            // Write to storage
            world.write_model(@item);
            world.write_model(@item_special_powers);
            world.write_model(@item_counter);

            // Return the new item ID
            item_counter.count
        }

        fn initialize_genesis_items(ref self: ContractState) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Initialize item counter if not already done
            let mut item_counter: ItemCounter = world.read_model(VERSION);
            if item_counter.genesis_count > 0 {
                // Genesis items already initialized
                return;
            }

            // Get all genesis items data
            let genesis_items = death_mountain::utils::genesis_items::get_genesis_items_data();
            let genesis_items_span = genesis_items.span();

            // Create all 101 genesis items
            let mut i = 0;
            loop {
                if i >= genesis_items_span.len() {
                    break;
                }

                let item_data = *genesis_items_span.at(i);

                // Create the item
                world
                    .write_model(
                        @Item {
                            id: item_data.id.into(),
                            name: item_data.name,
                            tier: item_data.tier,
                            item_type: item_data.item_type,
                            slot: item_data.slot,
                            is_genesis: true,
                        },
                    );

                // Create special powers configuration (all genesis items use same unlock values)
                world
                    .write_model(
                        @ItemSpecialPowers {
                            id: item_data.id.into(),
                            prefix1_unlock: PREFIXES_UNLOCK_GREATNESS,
                            prefix2_unlock: PREFIXES_UNLOCK_GREATNESS,
                            suffix_unlock: SUFFIX_UNLOCK_GREATNESS,
                            special_power_id: 0,
                        },
                    );

                i += 1;
            };

            // Update counter
            item_counter.count = 101; // Total items including genesis
            item_counter.genesis_count = 101; // Number of genesis items
            world.write_model(@item_counter);
        }
    }
}
