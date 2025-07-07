// ---------------------------
// Item Registry Tests
// ---------------------------
#[cfg(test)]
mod tests {
    use death_mountain::models::item_registry::{Item, ItemCounter, ItemSpecialPowers};

    #[test]
    fn test_item_model_creation() {
        // Test creating an Item model
        let item = Item { id: 1, name: 'Test Sword', tier: 2, item_type: 4, slot: 1, is_genesis: false };

        assert(item.id == 1, 'Item ID should be 1');
        assert(item.name == 'Test Sword', 'Item name mismatch');
        assert(item.tier == 2, 'Item tier should be 2');
        assert(item.item_type == 4, 'Item type should be 4');
        assert(item.slot == 1, 'Item slot should be 1');
        assert(item.is_genesis == false, 'Should not be genesis');
    }

    #[test]
    fn test_genesis_item_creation() {
        // Test creating a genesis item
        let genesis_item = Item { id: 1, name: 'Pendant', tier: 3, item_type: 1, slot: 7, is_genesis: true };

        assert(genesis_item.id == 1, 'Genesis item ID should be 1');
        assert(genesis_item.name == 'Pendant', 'Should be Pendant');
        assert(genesis_item.tier == 3, 'Should be tier 3');
        assert(genesis_item.item_type == 1, 'Should be type 1');
        assert(genesis_item.slot == 7, 'Should be slot 7');
        assert(genesis_item.is_genesis == true, 'Should be genesis item');
    }

    #[test]
    fn test_item_counter_model() {
        // Test ItemCounter model
        let counter = ItemCounter { version: 'v1', count: 101, genesis_count: 101 };

        assert(counter.version == 'v1', 'Version should be v1');
        assert(counter.count == 101, 'Count should be 101');
        assert(counter.genesis_count == 101, 'Genesis count should be 101');
    }

    #[test]
    fn test_item_counter_with_custom_items() {
        // Test ItemCounter with custom items added
        let counter = ItemCounter { version: 'v1', count: 105, // 101 genesis + 4 custom
        genesis_count: 101 };

        assert(counter.count == 105, 'Count should be 105');
        assert(counter.genesis_count == 101, 'Genesis count should remain 101');

        // Calculate custom items count
        let custom_items: u64 = counter.count - counter.genesis_count.into();
        assert(custom_items == 4, 'Should have 4 custom items');
    }

    #[test]
    fn test_item_special_powers_model() {
        // Test ItemSpecialPowers model
        let special_powers = ItemSpecialPowers {
            id: 1, prefix1_unlock: 15, prefix2_unlock: 20, suffix_unlock: 10, special_power_id: 0,
        };

        assert(special_powers.id == 1, 'ID should be 1');
        assert(special_powers.prefix1_unlock == 15, 'Prefix1 unlock should be 15');
        assert(special_powers.prefix2_unlock == 20, 'Prefix2 unlock should be 20');
        assert(special_powers.suffix_unlock == 10, 'Suffix unlock should be 10');
        assert(special_powers.special_power_id == 0, 'Special power ID should be 0');
    }

    #[test]
    fn test_item_special_powers_with_special() {
        // Test ItemSpecialPowers with special power
        let special_powers = ItemSpecialPowers {
            id: 102, prefix1_unlock: 25, prefix2_unlock: 30, suffix_unlock: 20, special_power_id: 5 // Has special power
        };

        assert(special_powers.id == 102, 'ID should be 102');
        assert(special_powers.special_power_id == 5, 'Should have special power 5');
    }


    #[test]
    fn test_different_item_types() {
        // Test items of different types
        let weapon = Item {
            id: 102, name: 'Custom Sword', tier: 2, item_type: 4, // Blade_or_Hide
            slot: 1, // Weapon
            is_genesis: false,
        };

        let armor = Item {
            id: 103, name: 'Custom Armor', tier: 3, item_type: 2, // Metal_or_Hide
            slot: 2, // Chest
            is_genesis: false,
        };

        let jewelry = Item {
            id: 104,
            name: 'Custom Ring',
            tier: 1,
            item_type: 1, // Necklace type (used for rings too)
            slot: 8, // Ring
            is_genesis: false,
        };

        assert(weapon.slot == 1, 'Weapon should be in weapon slot');
        assert(armor.slot == 2, 'Armor should be in chest slot');
        assert(jewelry.slot == 8, 'Ring should be in ring slot');
    }

    #[test]
    fn test_high_tier_item() {
        // Test a high-tier (T1) item
        let legendary_item = Item {
            id: 105, name: 'Legendary Blade', tier: 1, // T1 is highest tier
            item_type: 4, slot: 1, is_genesis: false,
        };

        assert(legendary_item.tier == 1, 'Should be T1 (highest tier)');
        assert(legendary_item.is_genesis == false, 'Should not be genesis');
    }

    #[test]
    fn test_low_tier_item() {
        // Test a low-tier (T5) item
        let common_item = Item {
            id: 106,
            name: 'Common Club',
            tier: 5, // T5 is lowest tier
            item_type: 3, // Bludgeon
            slot: 1,
            is_genesis: false,
        };

        assert(common_item.tier == 5, 'Should be T5 (lowest tier)');
        assert(common_item.is_genesis == false, 'Should not be genesis');
    }
}
