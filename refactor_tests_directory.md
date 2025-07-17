# Test Directory Refactoring Plan

## Executive Summary
Reorganize all tests from inline locations to a dedicated `contracts/src/tests/` directory with clear separation between unit and integration tests. This will improve test discovery, parallel execution reliability, and maintainability.

## Current Test Distribution
Based on analysis, tests are currently scattered across source files:

### Unit Tests (251 total)
- `src/models/adventurer/adventurer.cairo` - 94 tests
- `src/models/adventurer/equipment.cairo` - 32 tests  
- `src/models/adventurer/stats.cairo` - 27 tests
- `src/models/combat.cairo` - 18 tests
- `src/models/loot.cairo` - 17 tests
- `src/models/beast.cairo` - 17 tests
- `src/models/adventurer/bag.cairo` - 15 tests
- `src/models/market.cairo` - 10 tests
- `src/utils/loot.cairo` - 8 tests
- `src/models/adventurer/item.cairo` - 7 tests
- `src/models/obstacle.cairo` - 5 tests
- `src/utils/renderer/renderer_utils.cairo` - 1 test

### Integration Tests (31 total)
- `src/systems/game/contracts.cairo` - 31 tests

## Proposed Directory Structure

```
contracts/src/tests/
├── unit/
│   ├── adventurer/
│   │   ├── adventurer_test.cairo      (94 tests from adventurer.cairo)
│   │   ├── equipment_test.cairo       (32 tests from equipment.cairo)
│   │   ├── stats_test.cairo          (27 tests from stats.cairo)
│   │   ├── bag_test.cairo            (15 tests from bag.cairo)
│   │   └── item_test.cairo           (7 tests from item.cairo)
│   ├── models/
│   │   ├── combat_test.cairo         (18 tests from combat.cairo)
│   │   ├── loot_test.cairo           (17 tests from loot.cairo)
│   │   ├── beast_test.cairo          (17 tests from beast.cairo)
│   │   ├── market_test.cairo         (10 tests from market.cairo)
│   │   └── obstacle_test.cairo       (5 tests from obstacle.cairo)
│   └── utils/
│       ├── loot_test.cairo           (8 tests from utils/loot.cairo)
│       └── renderer_utils_test.cairo (1 test from renderer_utils.cairo)
└── integration/
    └── game/
        └── game_test.cairo           (31 tests from game/contracts.cairo)
```

## Required Changes

### 1. File Creation and Movement

#### Unit Tests - Adventurer Package (175 tests)
- **Create**: `src/tests/unit/adventurer/adventurer_test.cairo`
  - Extract 94 `#[test]` functions from `src/models/adventurer/adventurer.cairo`
  - Update imports to reference source modules

- **Create**: `src/tests/unit/adventurer/equipment_test.cairo`
  - Extract 32 tests from `src/models/adventurer/equipment.cairo`
  
- **Create**: `src/tests/unit/adventurer/stats_test.cairo`
  - Extract 27 tests from `src/models/adventurer/stats.cairo`
  
- **Create**: `src/tests/unit/adventurer/bag_test.cairo`
  - Extract 15 tests from `src/models/adventurer/bag.cairo`
  
- **Create**: `src/tests/unit/adventurer/item_test.cairo`
  - Extract 7 tests from `src/models/adventurer/item.cairo`

#### Unit Tests - Models Package (67 tests)
- **Create**: `src/tests/unit/models/combat_test.cairo`
  - Extract 18 tests from `src/models/combat.cairo`
  
- **Create**: `src/tests/unit/models/loot_test.cairo`
  - Extract 17 tests from `src/models/loot.cairo`
  
- **Create**: `src/tests/unit/models/beast_test.cairo`
  - Extract 17 tests from `src/models/beast.cairo`
  
- **Create**: `src/tests/unit/models/market_test.cairo`
  - Extract 10 tests from `src/models/market.cairo`
  
- **Create**: `src/tests/unit/models/obstacle_test.cairo`
  - Extract 5 tests from `src/models/obstacle.cairo`

#### Unit Tests - Utils Package (9 tests)
- **Create**: `src/tests/unit/utils/loot_test.cairo`
  - Extract 8 tests from `src/utils/loot.cairo`
  
- **Create**: `src/tests/unit/utils/renderer_utils_test.cairo`
  - Extract 1 test from `src/utils/renderer/renderer_utils.cairo`

#### Integration Tests (31 tests)
- **Create**: `src/tests/integration/game/game_test.cairo`
  - Extract 31 tests from `src/systems/game/contracts.cairo`

### 2. Import Updates

Each test file will need imports updated to reference the source modules:

```cairo
// Example for adventurer_test.cairo
use death_mountain::models::adventurer::{
    Adventurer, AdventurerImpl, ImplAdventurer, 
    STARTING_GOLD, STARTING_HEALTH, // constants
};
use death_mountain::models::adventurer::stats::Stats;
// ... other imports
```

### 3. Module Declaration Updates

Add module declarations to `src/lib.cairo`:
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

### 4. Workflow Updates

Update `.github/workflows/test-contract.yml` matrix:

```yaml
matrix:
  test-group: 
    - unit-adventurer    # 175 tests
    - unit-models        # 67 tests  
    - unit-utils         # 9 tests
    - integration-game   # 31 tests
```

Update test execution:
```bash
case ${{ matrix.test-group }} in
  unit-adventurer)
    sozo test src/tests/unit/adventurer/
    ;;
  unit-models)
    sozo test src/tests/unit/models/
    ;;
  unit-utils)
    sozo test src/tests/unit/utils/
    ;;
  integration-game)
    sozo test src/tests/integration/
    ;;
esac
```

## Current vs Proposed Parallelization

### Current (Imbalanced)
- **integration**: 31 tests (game only)
- **adventurer**: 175 tests (5.6x more than integration)
- **other**: 76 tests (models + utils mixed)

### Proposed (Better Balanced)
- **unit-adventurer**: 175 tests
- **unit-models**: 67 tests
- **unit-utils**: 9 tests  
- **integration-game**: 31 tests

Can further balance by splitting adventurer into subgroups if needed.

## Benefits

1. **Clear Organization**: Tests are organized by type (unit/integration) and package
2. **Easy Discovery**: Simple to see all test packages at a glance
3. **Reliable Parallelization**: No risk of missing tests when configuring parallel runs
4. **Better Separation**: Source code separated from test code
5. **Scalability**: Easy to add new test categories or packages
6. **Maintenance**: Easier to find and update related tests
7. **Flexible Grouping**: Easy to rebalance test groups for optimal parallel execution

## Potential Challenges

1. **Large Refactor**: Moving 282 tests across 13 files
2. **Import Management**: All test imports need updating
3. **Git History**: May lose some git blame history on tests
4. **Review Effort**: Large PR to review
5. **Merge Conflicts**: High risk if other PRs modify tests

## Migration Strategy

1. **Phase 1**: Create directory structure and move unit tests
2. **Phase 2**: Move integration tests  
3. **Phase 3**: Update workflow for new structure
4. **Phase 4**: Verify all tests still pass

## Alternative Approach

If full migration is too risky, consider:
1. Start with new tests only going to new structure
2. Gradually migrate existing tests over time
3. Use both structures temporarily with clear workflow handling

## Current Pain Points

1. **Test Discovery**: Hard to know if all tests are included in parallel runs
2. **Mixed Concerns**: Tests mixed with implementation makes files large
3. **Unclear Categorization**: Not obvious which tests are unit vs integration
4. **Parallel Configuration**: Complex path patterns needed for test groups
5. **Risk of Missing Tests**: Easy to overlook tests when configuring workflows

## Test Execution Commands

After refactoring, test execution becomes cleaner:

```bash
# Run all unit tests
sozo test src/tests/unit/

# Run specific unit test package
sozo test src/tests/unit/adventurer/

# Run all integration tests  
sozo test src/tests/integration/

# Run specific test file
sozo test src/tests/unit/adventurer/adventurer_test.cairo
```

## Recommendation

This refactoring would significantly improve test organization and make parallel execution more reliable. The clear structure would prevent missing tests and make the codebase more maintainable. However, it's a substantial change that requires careful execution and testing.

**Verdict**: Worth doing if you have a stable period without many active PRs. The long-term benefits of clarity and maintainability outweigh the short-term migration effort.