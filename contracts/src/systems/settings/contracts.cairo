use death_mountain::models::adventurer::adventurer::Adventurer;
use death_mountain::models::adventurer::bag::Bag;
use death_mountain::models::game::GameSettings;

#[starknet::interface]
pub trait ISettingsSystems<T> {
    fn add_settings(
        ref self: T,
        name: felt252,
        adventurer: Adventurer,
        bag: Bag,
        game_seed: u64,
        game_seed_until_xp: u16,
        in_battle: bool,
        item_set: Array<u64>,
    ) -> u32;
    fn setting_details(self: @T, settings_id: u32) -> GameSettings;
    fn game_settings(self: @T, game_id: u64) -> GameSettings;
    fn settings_count(self: @T) -> u32;
}

#[dojo::contract]
mod settings_systems {
    use death_mountain::constants::world::{DEFAULT_NS, VERSION};
    use death_mountain::models::adventurer::adventurer::Adventurer;
    use death_mountain::models::adventurer::bag::Bag;
    use death_mountain::models::game::{GameSettings, GameSettingsMetadata, SettingsCounter};
    use death_mountain::models::item_registry::Item;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage};
    use super::ISettingsSystems;
    use tournaments::components::models::game::TokenMetadata;

    #[abi(embed_v0)]
    impl SettingsSystemsImpl of ISettingsSystems<ContractState> {
        fn add_settings(
            ref self: ContractState,
            name: felt252,
            adventurer: Adventurer,
            bag: Bag,
            game_seed: u64,
            game_seed_until_xp: u16,
            in_battle: bool,
            item_set: Array<u64>,
        ) -> u32 {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            // increment settings counter
            let mut settings_count: SettingsCounter = world.read_model(VERSION);
            settings_count.count += 1;

            // Validate item_set
            _validate_item_set(@world, @item_set);

            world
                .write_model(
                    @GameSettings {
                        settings_id: settings_count.count, adventurer, bag, game_seed, game_seed_until_xp, in_battle, item_set,
                    },
                );
            world
                .write_model(
                    @GameSettingsMetadata {
                        settings_id: settings_count.count,
                        name,
                        created_by: starknet::get_caller_address(),
                        created_at: starknet::get_block_timestamp(),
                    },
                );
            world.write_model(@settings_count);

            settings_count.count
        }

        fn setting_details(self: @ContractState, settings_id: u32) -> GameSettings {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            settings
        }

        fn game_settings(self: @ContractState, game_id: u64) -> GameSettings {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let token_metadata: TokenMetadata = world.read_model(game_id);
            let game_settings: GameSettings = world.read_model(token_metadata.settings_id);
            game_settings
        }

        fn settings_count(self: @ContractState) -> u32 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings_count: SettingsCounter = world.read_model(VERSION);
            settings_count.count
        }
    }

    pub fn _validate_item_set(world: @WorldStorage, item_set: @Array<u64>) {
        // Validate item_set length
        assert!(item_set.len() <= 128, "Item set cannot exceed 128 items");
        assert!(item_set.len() > 0, "Item set cannot be empty");

        // Track duplicates
        let mut seen_items: Array<u64> = ArrayTrait::new();

        // Validate each item
        let mut i = 0;
        loop {
            if i >= item_set.len() {
                break;
            }

            let item_id = *item_set.at(i);
            
            // Check ID range for 7-bit storage
            assert!(item_id <= 127, "Item ID must be <= 127 for 7-bit storage");
            
            // Check if item exists
            let item: Item = world.read_model(item_id);
            assert!(item.id != 0, "Item does not exist in registry");
            
            // Check for duplicates
            let mut j = 0;
            let mut found_duplicate = false;
            loop {
                if j >= seen_items.len() {
                    break;
                }
                if *seen_items.at(j) == item_id {
                    found_duplicate = true;
                    break;
                }
                j += 1;
            };
            assert!(!found_duplicate, "Duplicate item ID in item_set");
            seen_items.append(item_id);
            
            i += 1;
        };
    }
}
