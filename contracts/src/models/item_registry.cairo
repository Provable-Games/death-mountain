// Base Item model for dynamic storage
#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct Item {
    #[key]
    pub id: u64,  // Changed from u8 to u64 for unlimited items
    pub name: felt252,
    pub tier: u8,  // T1-T5
    pub item_type: u8,  // Type enum
    pub slot: u8,  // Slot enum
    pub is_genesis: bool,  // Track original 101 items
}

// Item counter for auto-incrementing IDs
#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct ItemCounter {
    #[key]
    pub version: felt252,  // Use VERSION constant
    pub count: u64,  // Total items created
    pub genesis_count: u8,  // Original 101 items (fixed at 101)
}

// Item special powers configuration
#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct ItemSpecialPowers {
    #[key]
    pub id: u64,  // Item ID
    pub prefix1_unlock: u8,  // Greatness required for prefix1
    pub prefix2_unlock: u8,  // Greatness required for prefix2  
    pub suffix_unlock: u8,   // Greatness required for suffix
    pub special_power_id: u8,  // ID of special power (if any)
}