# Item Set Implementation Plan

## Overview

This document outlines the changes required to implement an `item_set` system in Death Mountain's game settings. The goal is to allow game settings to specify a maximum of 128 item IDs that players can purchase from, while keeping the item IDs stored on the Adventurer small (7-bit values, supporting items 0-127).

## Key Ambiguities Resolved

1. **Storage Type**: `item_set` will be stored as `Array<u64>` in GameSettings model, not `Span<u64>` (Spans are views, not storage)

2. **Market Seed Behavior**: Market randomization will select from indices 0 to item_set.len()-1, not from the actual item IDs

3. **Adventurer Item Storage**: Items on Adventurer use 7 bits, supporting item IDs 0-127
   - **CONSTRAINT**: With u64 item IDs in registry but 7-bit storage on Adventurer, we're limited to items 0-127
   - **SOLUTION**: Limit item_set to maximum 128 items, validate all IDs are <= 127

4. **Breaking Change**: Changing ItemPurchase.item_id to item_index is a breaking change requiring migration

5. **Market Availability**: When market shows "available items", should it show:
   - Indices (0, 5, 12) - confusing to players
   - Actual item IDs (101, 550, 1337) - clear but requires lookup

6. **Item Equipping**: After purchase, the item needs to be stored on Adventurer:
   - Current: Stores u8 item_id directly
   - New: Must ensure purchased item ID fits in u8 or change storage type

7. **Loot System Integration**: The loot system expects u8 item IDs:
   - get_item(id: u8) returns item data
   - Need get_item_u64(id: u64) OR ensure all item_set IDs fit in u8

## Current System Analysis

### Current Item Purchase Flow
1. **GameSettings Model** (`src/models/game.cairo:50-58`):
   - Contains: `adventurer`, `bag`, `game_seed`, `game_seed_until_xp`, `in_battle`
   - No item restrictions currently

2. **ItemPurchase Struct** (`src/models/market.cairo:8-11`):
   - `item_id: u8` - Direct item ID (1-101 for genesis items, u64 for dynamic items)
   - `equip: bool` - Whether to equip after purchase

3. **Market System** (`src/models/market.cairo`):
   - `get_available_items()` returns items 1-101 based on market seed
   - `is_item_available()` checks if item is in current market
   - Hard-coded to work with 101 genesis items via `NUM_ITEMS` constant

4. **Buy Items Function** (`src/systems/game/contracts.cairo:15`):
   - `buy_items(adventurer_id: u64, potions: u8, items: Array<ItemPurchase>)`
   - Validates item availability through market system
   - Directly uses `item_id` from ItemPurchase

## Proposed Architecture

### 1. GameSettings Model Updates

**File**: `src/models/game.cairo`

Add `item_set` field to GameSettings:
```cairo
#[derive(Introspect, Copy, Drop, Serde)]
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    pub adventurer: Adventurer,
    pub bag: Bag,
    pub game_seed: u64,
    pub game_seed_until_xp: u16,
    pub in_battle: bool,
    pub item_set: Array<u64>,  // NEW: Max 128 item IDs (stored as Array, not Span)
}
```

**CLARIFICATION**: Arrays are used for storage in Dojo models, Spans are views over arrays.

### 2. Settings System Updates

**File**: `src/systems/settings/contracts.cairo`

Update `add_settings` function:
```cairo
fn add_settings(
    ref self: T,
    name: felt252,
    adventurer: Adventurer,
    bag: Bag,
    game_seed: u64,
    game_seed_until_xp: u16,
    in_battle: bool,
    item_set: Array<u64>,  // NEW: Array of item IDs (max 128)
) -> u32;
```

Add validation:
- Ensure `item_set.len() <= 128`
- Validate all item IDs exist in item registry
- Ensure no duplicate item IDs
- **CRITICAL**: Ensure all item IDs are <= 127 (7-bit limit)

### 3. ItemPurchase System Refactor

**File**: `src/models/market.cairo`

Update ItemPurchase struct to use index instead of direct ID:
```cairo
#[derive(Introspect, Copy, Drop, Serde)]
pub struct ItemPurchase {
    pub item_index: u8,  // CHANGED: Index into game's item_set (0-127)
    pub equip: bool,
}
```

### 4. Market System Updates

**File**: `src/models/market.cairo`

Add new functions:
```cairo
impl ImplMarket of IMarket {
    // NEW: Get available item indices based on game's item_set
    // Returns indices (0-127) that point to positions in item_set, NOT item IDs
    fn get_available_item_indices(
        item_set: Span<u64>, 
        seed: u64, 
        market_size: u8
    ) -> Array<u8>;
    
    // NEW: Check if item index is available in current market
    // inventory contains indices (0-127), NOT item IDs
    fn is_item_index_available(
        ref inventory: Span<u8>, 
        item_index: u8
    ) -> bool;
    
    // NEW: Get actual item ID from index and item_set
    // Returns None if index >= item_set.len()
    // MUST ensure returned ID fits in 7 bits (<=127) for Adventurer storage
    fn get_item_id_from_index(
        item_set: Span<u64>, 
        item_index: u8
    ) -> Option<u64>;
}
```

### 5. Game System Updates

**File**: `src/systems/game/contracts.cairo`

Update `buy_items` function logic:
1. Get game settings to access `item_set`
2. Convert `item_index` to actual `item_id` using `item_set`
3. Validate item exists and is available
4. Process purchase with actual item ID

```cairo
fn buy_items(ref self: T, adventurer_id: u64, potions: u8, items: Array<ItemPurchase>) {
    // Get game settings
    let game_settings = _get_game_settings(world, adventurer_id);
    
    // For each item purchase
    for item_purchase in items {
        // Convert index to actual item ID
        let item_id = match ImplMarket::get_item_id_from_index(
            game_settings.item_set, 
            item_purchase.item_index
        ) {
            Option::Some(id) => id,
            Option::None(_) => panic!("Invalid item index"),
        };
        
        // Validate and process purchase...
    }
}
```

### 6. Event System Updates

**File**: `src/models/game.cairo`

Update events to maintain backward compatibility:
```cairo
#[derive(Introspect, Copy, Drop, Serde)]
pub struct BuyItemsEvent {
    pub potions: u8,
    pub items_purchased: Span<ItemPurchase>,  // Contains indices
    pub actual_items: Span<u64>,              // NEW: Actual item IDs purchased
}
```

## Migration Strategy

### Phase 1: Model Updates
1. Add `item_set` field to GameSettings model
2. Update SettingsCounter if needed for new model structure
3. Ensure backward compatibility with existing games

### Phase 2: Market System Refactor
1. Add new market functions for index-based operations
2. Keep existing functions for backward compatibility
3. Update ItemPurchase struct

### Phase 3: Game Logic Updates
1. Update buy_items function to use new index-based system
2. Add validation for item_set bounds
3. Update event emissions

### Phase 4: Settings System Integration
1. Update add_settings function signature
2. Add item_set validation logic
3. Test with various item_set configurations

## Backward Compatibility

### Existing Games
- Games created before this update will have empty `item_set`
- Add fallback logic: if `item_set` is empty, use genesis items (1-101)
- **BREAKING**: ItemPurchase struct change requires migration

### Default Behavior
```cairo
fn get_effective_item_set(game_settings: GameSettings) -> Span<u64> {
    if game_settings.item_set.len() == 0 {
        // Fallback to genesis items for existing games
        // Returns [1, 2, 3, ..., 101] as u64 values
        get_genesis_item_ids_as_u64()
    } else {
        game_settings.item_set.span()
    }
}
```

### Migration Strategy for ItemPurchase
Since changing `item_id` to `item_index` is breaking:
1. **Option A**: Create new struct `ItemPurchaseV2` and deprecate old one
2. **Option B**: Add version field to game settings to handle both formats
3. **Option C**: Keep `item_id` name but change semantics (risky)

## Validation Rules

### Item Set Validation
1. **Size Limit**: Maximum 128 items in item_set
2. **Item Existence**: All item IDs must exist in item registry
3. **No Duplicates**: Each item ID can only appear once
4. **Valid Range**: Item indices must be 0-127 (matching item_set.len()-1)
5. **ID Range**: All item IDs in item_set MUST be <= 127 (7-bit storage limit on Adventurer)

### Purchase Validation
1. **Index Bounds**: item_index must be < item_set.length
2. **Market Availability**: Item must be available in current market
3. **Affordability**: Player must have sufficient gold

## Testing Strategy

### Unit Tests
1. Test item_set validation in settings system
2. Test index-to-ID conversion functions
3. Test market operations with custom item_sets
4. Test backward compatibility with empty item_sets

### Integration Tests
1. Test complete purchase flow with custom item_set
2. Test game creation with various item_set sizes
3. Test error cases (invalid indices, unavailable items)

### Edge Cases
1. Empty item_set (backward compatibility)
2. Single item in item_set
3. Maximum 128 items in item_set
4. Invalid item indices (>= item_set.length)
5. Item IDs > 127 in item_set (should fail validation)

## Implementation Order

1. **GameSettings Model Update** - Add item_set field
2. **Settings System** - Update add_settings function and validation
3. **Market System** - Add index-based functions
4. **ItemPurchase Update** - Change to use indices
5. **Game System** - Update buy_items logic
6. **Event Updates** - Add actual_items to events
7. **Testing** - Comprehensive test suite
8. **Documentation** - Update API docs and examples

## Benefits

1. **Scalability**: Unlimited items in registry, 128 per game instance
2. **Efficiency**: 7-bit item storage on adventurer remains unchanged
3. **Flexibility**: Game creators can curate specific item sets
4. **Composability**: Different games can have different item focuses
5. **Backward Compatibility**: Existing games continue to work
6. **Storage Optimization**: No increase in Adventurer storage size

## Considerations

1. **Gas Costs**: Larger item_set spans will cost more gas to store
2. **Validation Overhead**: Need to validate item_set on game creation
3. **Client Updates**: Frontend needs to understand index-based system
4. **Migration**: Existing games need graceful fallback handling

This architecture maintains the core benefit of keeping adventurer storage at 7 bits per item while providing the flexibility for unlimited item expansion through game-specific item sets.

## Additional Implementation Notes

### Genesis Items Compatibility
- Genesis items (IDs 1-101) fit within the 7-bit limit (0-127)
- New dynamic items must be assigned IDs 102-127 (only 26 slots available)
- Consider reserving ID 0 as "no item" or invalid marker

### Future Considerations
- If more than 128 items needed per game, would require:
  - Expanding Adventurer item storage to 8 bits (supporting 256 items)
  - Or implementing a two-tier system with "item packs" selected at game creation