use death_mountain::models::item_registry::{Item, ItemSpecialPowers};

#[starknet::interface]
pub trait IItemConfigSystems<T> {
    // Add new item to the game
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
    ) -> u64;  // Returns new item ID
    
    // Initialize genesis items (original 101)
    fn create_genesis_items(ref self: T);
    
    // Validate item before adding
    fn validate_item(
        self: @T,
        name: felt252,
        tier: u8,
        item_type: u8,
        slot: u8,
    ) -> bool;
    
    // Get total item count
    fn get_item_count(self: @T) -> u64;
    
    // Get item by ID
    fn get_item(self: @T, item_id: u64) -> Item;
    
    // Get item special powers
    fn get_item_special_powers(self: @T, item_id: u64) -> ItemSpecialPowers;
}

#[dojo::contract]
mod item_config_systems {
    use death_mountain::constants::loot::{
        PREFIXES_UNLOCK_GREATNESS, SUFFIX_UNLOCK_GREATNESS,
    };
    use death_mountain::constants::world::{DEFAULT_NS, VERSION};
    use death_mountain::models::item_registry::{Item, ItemCounter, ItemSpecialPowers};
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use super::IItemConfigSystems;

    #[abi(embed_v0)]
    impl ItemConfigSystemsImpl of IItemConfigSystems<ContractState> {
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
            assert(Self::validate_item(@self, name, tier, item_type, slot), 'Invalid item parameters');
            
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
                is_genesis: false,  // New items are not genesis items
            };
            
            // Create special powers configuration
            let item_special_powers = ItemSpecialPowers {
                id: item_counter.count,
                prefix1_unlock,
                prefix2_unlock,
                suffix_unlock,
                special_power_id,
            };
            
            // Write to storage
            world.write_model(@item);
            world.write_model(@item_special_powers);
            world.write_model(@item_counter);
            
            // Return the new item ID
            item_counter.count
        }
        
        fn create_genesis_items(ref self: ContractState) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            
            // Initialize item counter if not already done
            let mut item_counter: ItemCounter = world.read_model(VERSION);
            if item_counter.genesis_count > 0 {
                // Genesis items already created
                return;
            }
            
            // Get all genesis items data
            let genesis_items = death_mountain::systems::item_config::genesis_items::get_genesis_items_data();
            let genesis_items_span = genesis_items.span();
            
            // Create all 101 genesis items
            let mut i = 0;
            loop {
                if i >= genesis_items_span.len() {
                    break;
                }
                
                let item_data = *genesis_items_span.at(i);
                
                // Create the item
                world.write_model(@Item {
                    id: item_data.id.into(),
                    name: item_data.name,
                    tier: item_data.tier,
                    item_type: item_data.item_type,
                    slot: item_data.slot,
                    is_genesis: true,
                });
                
                // Create special powers configuration (all genesis items use same unlock values)
                world.write_model(@ItemSpecialPowers {
                    id: item_data.id.into(),
                    prefix1_unlock: PREFIXES_UNLOCK_GREATNESS,
                    prefix2_unlock: PREFIXES_UNLOCK_GREATNESS,
                    suffix_unlock: SUFFIX_UNLOCK_GREATNESS,
                    special_power_id: 0,
                });
                
                i += 1;
            };
            
            // Update counter
            item_counter.count = 101;  // Total items including genesis
            item_counter.genesis_count = 101;  // Number of genesis items
            world.write_model(@item_counter);
        }
        
        fn validate_item(
            self: @ContractState,
            name: felt252,
            tier: u8,
            item_type: u8,
            slot: u8,
        ) -> bool {
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
        
        fn get_item_count(self: @ContractState) -> u64 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let item_counter: ItemCounter = world.read_model(VERSION);
            item_counter.count
        }
        
        fn get_item(self: @ContractState, item_id: u64) -> Item {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(item_id)
        }
        
        fn get_item_special_powers(self: @ContractState, item_id: u64) -> ItemSpecialPowers {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(item_id)
        }
    }
}