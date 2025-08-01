# Feature: Individual Item Special Storage

## Overview

Refactor the item specials storage system to provide each item with its own dedicated storage instead of all items sharing a single seed. This will enable persistent, unique special attributes for each item instance, improving randomness variety and reducing computational overhead from repeated calculations.

## Background

Currently, the Death Mountain game uses a shared storage pattern for item specials where:
- Each adventurer has a single `item_specials_seed` (16 bits) stored in the Adventurer struct
- Item specials are calculated on-demand by combining this shared seed with item-specific entropy
- This requires recalculation every time specials are needed (combat, stats, display)
- All items for an adventurer share the same base seed, limiting randomness variety

This approach has served well for initial implementation but presents limitations as the game scales:
- Gas costs from repeated calculations during combat and stat applications
- Limited entropy space due to single seed constraint
- No ability to persist unique or evolving special attributes per item
- Inability to support future features like upgradeable or tradeable item specials

## Requirements

### Functional Requirements

1. **Individual Storage**: Each item instance should have its own persistent storage for special powers
2. **Backward Compatibility**: Existing adventurers with shared seeds must continue to function
3. **Migration Path**: Provide a mechanism to migrate from shared seed to individual storage
4. **Query Efficiency**: Support efficient batch queries for multiple item specials
5. **Storage Efficiency**: Use packed storage patterns similar to existing models (AdventurerPacked, BagPacked)

### Performance Requirements

- Reduce gas costs by eliminating repeated special calculations
- Support efficient bulk operations for querying all item specials for an adventurer
- Maintain or improve current response times for item special retrieval

### Data Model Requirements

- Store specials using a Map-like structure with composite keys (e.g., `(adventurer_id, item_id)`)
- Preserve the existing SpecialPowers structure (special1, special2, special3)
- Support the current unlock mechanics (greatness 15 for suffix, 20 for prefixes)

## Technical Context

### Current Implementation
- **Adventurer Model**: `contracts/src/models/adventurer/adventurer.cairo` - Contains `item_specials_seed`
- **Loot System**: `contracts/src/models/loot.cairo` - `get_specials()` calculation logic
- **Combat System**: `contracts/src/models/combat.cairo` - SpecialPowers struct definition
- **Game System**: `contracts/src/systems/game/contracts.cairo` - Uses specials in combat and stats

### Existing Storage Patterns
- **Simple Models**: `ScoreObjective` with single key
- **Composite Key Models**: `CollectableEntity` with multiple keys
- **Packed Models**: `AdventurerPacked`, `BagPacked` for efficient storage
- **Relationship Models**: `DroppedItem` linking entities

### Key Interfaces
- `ILoot::get_specials()` - Current interface for calculating specials
- Special unlock constants: `SUFFIX_UNLOCK_GREATNESS = 15`, `PREFIXES_UNLOCK_GREATNESS = 20`

## Acceptance Criteria

- [ ] New Dojo model created for individual item special storage
- [ ] Storage uses composite key structure (adventurer_id + item identifier)
- [ ] Existing shared seed functionality remains for backward compatibility
- [ ] Migration mechanism allows transitioning from shared to individual storage
- [ ] Game system updated to read from individual storage when available
- [ ] Batch query support for retrieving all specials for an adventurer
- [ ] Gas costs reduced compared to current repeated calculations
- [ ] All existing tests pass with new implementation
- [ ] New tests verify individual storage functionality
- [ ] Documentation updated to reflect new storage pattern

## Testing Requirements

### Unit Tests
- Test individual special storage and retrieval
- Verify backward compatibility with shared seed
- Test migration from shared to individual storage
- Validate batch query operations

### Integration Tests
- Combat calculations use correct specials from individual storage
- Stat boosts apply correctly with new storage
- Special unlock mechanics work as expected
- Performance benchmarks show improvement

### Edge Cases to Test
- Adventurer with no specials unlocked
- Adventurer with partial migration (some items migrated, others not)
- Maximum number of items with specials
- Concurrent access patterns

## Questions for Implementation

1. Should we use item_id or item_slot as part of the composite key?
2. What's the preferred migration strategy - lazy (on-demand) or batch?
3. Should we maintain the current entropy-based generation for initial values?
4. Do we need versioning to support future special mechanics changes?
5. Should special values be mutable after initial generation?

## Future Considerations

This refactor opens possibilities for:
- Upgradeable item specials through gameplay
- Trading items with persistent special attributes
- More complex special mechanics (evolving specials, combinations)
- Reduced gas costs for combat-heavy gameplay
- Better support for item NFT metadata with unique attributes