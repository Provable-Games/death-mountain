# Test Refactoring Quick Reference

## Test Distribution Summary
```
Unit Tests (251 total):
├── adventurer/ (175 tests)
│   ├── adventurer.cairo → adventurer_test.cairo (94)
│   ├── equipment.cairo → equipment_test.cairo (32)
│   ├── stats.cairo → stats_test.cairo (27)
│   ├── bag.cairo → bag_test.cairo (15)
│   └── item.cairo → item_test.cairo (7)
├── models/ (67 tests)
│   ├── combat.cairo → combat_test.cairo (18)
│   ├── loot.cairo → loot_test.cairo (17)
│   ├── beast.cairo → beast_test.cairo (17)
│   ├── market.cairo → market_test.cairo (10)
│   └── obstacle.cairo → obstacle_test.cairo (5)
└── utils/ (9 tests)
    ├── loot.cairo → loot_test.cairo (8)
    └── renderer_utils.cairo → renderer_utils_test.cairo (1)

Integration Tests (31 total):
└── game/
    └── contracts.cairo → game_test.cairo (31)
```

## Migration Steps Per File

1. **Create target test file** in appropriate directory
2. **Copy test functions** from source file
3. **Update imports** in test file:
   ```cairo
   use death_mountain::models::adventurer::{Adventurer, AdventurerImpl};
   use death_mountain::constants::{STARTING_GOLD, STARTING_HEALTH};
   ```
4. **Remove test code** from source file
5. **Verify counts**: 
   ```bash
   python track_refactor_progress.py verify --source <src> --target <target>
   ```
6. **Update progress**:
   ```bash
   python track_refactor_progress.py update --phase phase_1 --file <file> --tests <count>
   ```

## Import Pattern Examples

### For Adventurer Tests:
```cairo
use death_mountain::models::adventurer::{
    Adventurer, AdventurerImpl, ImplAdventurer,
    STARTING_GOLD, STARTING_HEALTH
};
use death_mountain::models::adventurer::stats::Stats;
use death_mountain::models::adventurer::equipment::Equipment;
```

### For Model Tests:
```cairo
use death_mountain::models::combat::{Combat, CombatImpl};
use death_mountain::models::beast::{Beast, BeastImpl};
use death_mountain::constants::beast_settings;
```

### For Integration Tests:
```cairo
use death_mountain::systems::game::contracts::game;
use dojo::model::{ModelStorage, ModelValueStorage};
use dojo::world::WorldStorageTrait;
```

## Test Module Structure in lib.cairo
```cairo
#[cfg(test)]
mod tests {
    mod unit {
        mod adventurer {
            mod adventurer_test;
            mod equipment_test;
            mod stats_test;
            mod bag_test;
            mod item_test;
        }
        mod models {
            mod combat_test;
            mod loot_test;
            mod beast_test;
            mod market_test;
            mod obstacle_test;
        }
        mod utils {
            mod loot_test;
            mod renderer_utils_test;
        }
    }
    mod integration {
        mod game {
            mod game_test;
        }
    }
}
```

## Common Issues & Solutions

### Import Errors
- Ensure you're using the full module path from crate root
- Check that constants are imported separately
- Verify trait imports (e.g., `ImplAdventurer`)

### Test Discovery
- Make sure test file is declared in lib.cairo
- Use `#[cfg(test)]` for test modules
- Check file naming matches module declaration

### Test Execution
```bash
# Run all tests
sozo test

# Run specific directory
sozo test src/tests/unit/adventurer/

# Run specific file
sozo test src/tests/unit/adventurer/adventurer_test.cairo
```

## Progress Tracking Commands

```bash
# Check current status
python track_refactor_progress.py status

# Verify source file test counts
python track_refactor_progress.py check

# Update after migration
python track_refactor_progress.py update --phase phase_1 --file <file> --tests <count>

# Verify migration
python track_refactor_progress.py verify --source <src> --target <target>
```