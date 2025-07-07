#[cfg(test)]
mod tests {
    use death_mountain::constants::world::DEFAULT_NS;
    use death_mountain::models::item_registry::Item;
    use death_mountain::models::market::ImplMarket;
    use death_mountain::systems::settings::contracts::settings_systems::_validate_item_set;
    use death_mountain::utils::genesis_items::get_genesis_items_data;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use dojo_cairo_test::{spawn_test_world, NamespaceDef, TestResource};

    fn setup_test_world() -> WorldStorage {
        // Define the namespace
        let ndef = NamespaceDef {
            namespace: DEFAULT_NS(), resources: [
                TestResource::Model(death_mountain::models::game::m_GameSettings::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(death_mountain::models::game::m_GameSettingsMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(death_mountain::models::game::m_SettingsCounter::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(death_mountain::models::item_registry::m_Item::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(death_mountain::models::item_registry::m_ItemCounter::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(death_mountain::models::item_registry::m_ItemSpecialPowers::TEST_CLASS_HASH.try_into().unwrap()),
            ].span()
        };

        // Create test world
        let mut world = spawn_test_world([ndef].span());
        
        // Initialize genesis items for testing
        initialize_test_items(ref world);
        
        world
    }

    fn initialize_test_items(ref world: WorldStorage) {
        // Add genesis items 1-101
        let genesis_items = get_genesis_items_data();
        let mut i = 0;
        loop {
            if i >= genesis_items.len() {
                break;
            }
            let item_data = *genesis_items.at(i);
            world.write_model(@Item {
                id: item_data.id.into(),
                name: item_data.name,
                tier: item_data.tier,
                item_type: item_data.item_type,
                slot: item_data.slot,
                is_genesis: true,
            });
            i += 1;
        };

        // Add some custom items for testing (IDs 102-127)
        world.write_model(@Item {
            id: 102,
            name: 'Custom Sword',
            tier: 3,
            item_type: 2, // Blade
            slot: 1, // Weapon
            is_genesis: false,
        });
        world.write_model(@Item {
            id: 110,
            name: 'Custom Armor',
            tier: 4,
            item_type: 3, // Metal
            slot: 2, // Chest
            is_genesis: false,
        });
        world.write_model(@Item {
            id: 127,
            name: 'Max ID Item',
            tier: 5,
            item_type: 1, // Magic
            slot: 1, // Weapon
            is_genesis: false,
        });
    }

    #[test]
    fn test_validate_item_set_valid() {
        let world = setup_test_world();
        
        // Test with valid genesis items
        let mut item_set = ArrayTrait::new();
        item_set.append(1);   // Pendant
        item_set.append(10);  // Ghost Wand
        item_set.append(50);  // Platinum Ring
        item_set.append(101); // Grim Shout
        
        // Should not panic
        _validate_item_set(@world, @item_set);
    }

    #[test]
    fn test_validate_item_set_with_custom_items() {
        let world = setup_test_world();
        
        // Test with mix of genesis and custom items
        let mut item_set = ArrayTrait::new();
        item_set.append(1);    // Genesis
        item_set.append(102);  // Custom
        item_set.append(110);  // Custom
        item_set.append(127);  // Max ID
        
        // Should not panic
        _validate_item_set(@world, @item_set);
    }

    #[test]
    #[should_panic(expected: 'Item set cannot be empty')]
    fn test_validate_item_set_empty() {
        let world = setup_test_world();
        let item_set = ArrayTrait::new();
        _validate_item_set(@world, @item_set);
    }

    #[test]
    #[should_panic(expected: 'Item set cannot exceed 128 items')]
    fn test_validate_item_set_too_large() {
        let world = setup_test_world();
        let mut item_set = ArrayTrait::new();
        
        // Add 129 items (exceeds limit)
        let mut i: u64 = 1;
        loop {
            if i > 129 {
                break;
            }
            // Wrap around to valid IDs
            let id = ((i - 1) % 101) + 1;
            item_set.append(id);
            i += 1;
        };
        
        _validate_item_set(@world, @item_set);
    }

    #[test]
    #[should_panic(expected: 'Item ID must be <= 127 for 7-bit storage')]
    fn test_validate_item_set_id_too_large() {
        let world = setup_test_world();
        let mut item_set = ArrayTrait::new();
        item_set.append(1);
        item_set.append(128); // Too large for 7-bit storage
        
        _validate_item_set(@world, @item_set);
    }

    #[test]
    #[should_panic(expected: 'Item does not exist in registry')]
    fn test_validate_item_set_nonexistent_item() {
        let world = setup_test_world();
        let mut item_set = ArrayTrait::new();
        item_set.append(1);
        item_set.append(104); // Doesn't exist (only 102, 110, 127 were added)
        
        _validate_item_set(@world, @item_set);
    }

    #[test]
    #[should_panic(expected: 'Duplicate item ID in item_set')]
    fn test_validate_item_set_duplicates() {
        let world = setup_test_world();
        let mut item_set = ArrayTrait::new();
        item_set.append(1);
        item_set.append(10);
        item_set.append(1); // Duplicate
        
        _validate_item_set(@world, @item_set);
    }

    #[test]
    fn test_market_get_available_item_indices() {
        // Test market function with small item_set
        let mut item_set = ArrayTrait::new();
        item_set.append(1);
        item_set.append(5);
        item_set.append(10);
        item_set.append(15);
        item_set.append(20);
        
        let indices = ImplMarket::get_available_item_indices(item_set.span(), 12345, 3);
        assert!(indices.len() == 3, "Should return 3 indices");
        
        // Verify all indices are valid
        let mut i = 0;
        loop {
            if i >= indices.len() {
                break;
            }
            let index = *indices.at(i);
            assert!(index < 5, "Index should be < item_set length");
            i += 1;
        };
    }

    #[test]
    fn test_market_get_available_item_indices_full_market() {
        // Test when market size >= item_set size
        let mut item_set = ArrayTrait::new();
        item_set.append(1);
        item_set.append(5);
        item_set.append(10);
        
        let indices = ImplMarket::get_available_item_indices(item_set.span(), 12345, 5);
        assert!(indices.len() == 3, "Should return all 3 indices");
        
        // Should contain 0, 1, 2
        assert!(*indices.at(0) == 0, "First index should be 0");
        assert!(*indices.at(1) == 1, "Second index should be 1");
        assert!(*indices.at(2) == 2, "Third index should be 2");
    }

    #[test]
    fn test_market_is_item_index_available() {
        let mut inventory = ArrayTrait::new();
        inventory.append(0);
        inventory.append(2);
        inventory.append(5);
        
        let mut inv_span = inventory.span();
        assert!(ImplMarket::is_item_index_available(ref inv_span, 2), "Index 2 should be available");
        
        let mut inv_span = inventory.span();
        assert!(!ImplMarket::is_item_index_available(ref inv_span, 1), "Index 1 should not be available");
        
        let mut inv_span = inventory.span();
        assert!(!ImplMarket::is_item_index_available(ref inv_span, 10), "Index 10 should not be available");
    }

    #[test]
    fn test_market_get_item_id_from_index() {
        let mut item_set = ArrayTrait::new();
        item_set.append(10);  // Index 0
        item_set.append(25);  // Index 1
        item_set.append(101); // Index 2
        
        // Valid indices
        match ImplMarket::get_item_id_from_index(item_set.span(), 0) {
            Option::Some(id) => assert!(id == 10, "Index 0 should return ID 10"),
            Option::None => panic!("Should return Some"),
        }
        
        match ImplMarket::get_item_id_from_index(item_set.span(), 2) {
            Option::Some(id) => assert!(id == 101, "Index 2 should return ID 101"),
            Option::None => panic!("Should return Some"),
        }
        
        // Invalid index
        match ImplMarket::get_item_id_from_index(item_set.span(), 3) {
            Option::Some(_) => panic!("Should return None"),
            Option::None => {}, // Expected
        }
    }

    #[test]
    fn test_itemset_with_maximum_items() {
        let world = setup_test_world();
        
        // Test with a large item_set (close to maximum)
        let mut item_set = ArrayTrait::new();
        
        // Add all 101 genesis items
        let mut i: u64 = 1;
        loop {
            if i > 101 {
                break;
            }
            item_set.append(i);
            i += 1;
        };
        
        // Add custom items 102, 110, 127 that were created in setup
        item_set.append(102);
        item_set.append(110);
        item_set.append(127);
        
        // Total: 104 items (well under 128 limit)
        assert!(item_set.len() == 104, "Should have 104 items");
        
        // Should not panic with 104 items (under limit)
        _validate_item_set(@world, @item_set);
    }
}