# Test Refactoring Checklist

This checklist tracks the migration of tests from inline locations to the dedicated test directory structure.

## Overview
- **Total Tests**: 282 (251 unit + 31 integration)
- **Start Date**: 2025-07-17
- **Tracking File**: `test_refactor_tracking.json`
- **Progress Script**: `track_refactor_progress.py`

## Pre-Migration Setup
- [x] Create tracking files (`test_refactor_tracking.json`, `track_refactor_progress.py`)
- [ ] Create test directory structure: `src/tests/`
- [ ] Backup current state: `git branch backup/pre-test-refactor`

## Phase 1: Unit Test Migration (251 tests)

### Directory Structure Creation
- [ ] Create `src/tests/unit/` directory
- [ ] Create `src/tests/unit/adventurer/` directory
- [ ] Create `src/tests/unit/models/` directory
- [ ] Create `src/tests/unit/utils/` directory

### Adventurer Tests (175 tests)
- [ ] **adventurer_test.cairo** (94 tests)
  - [ ] Extract tests from `src/models/adventurer/adventurer.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify: `python track_refactor_progress.py verify --source src/models/adventurer/adventurer.cairo --target src/tests/unit/adventurer/adventurer_test.cairo`
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file adventurer/adventurer_test.cairo --tests 94`

- [ ] **equipment_test.cairo** (32 tests)
  - [ ] Extract tests from `src/models/adventurer/equipment.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file adventurer/equipment_test.cairo --tests 32`

- [ ] **stats_test.cairo** (27 tests)
  - [ ] Extract tests from `src/models/adventurer/stats.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file adventurer/stats_test.cairo --tests 27`

- [ ] **bag_test.cairo** (15 tests)
  - [ ] Extract tests from `src/models/adventurer/bag.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file adventurer/bag_test.cairo --tests 15`

- [ ] **item_test.cairo** (7 tests)
  - [ ] Extract tests from `src/models/adventurer/item.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file adventurer/item_test.cairo --tests 7`

### Model Tests (67 tests)
- [ ] **combat_test.cairo** (18 tests)
  - [ ] Extract tests from `src/models/combat.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file models/combat_test.cairo --tests 18`

- [ ] **loot_test.cairo** (17 tests)
  - [ ] Extract tests from `src/models/loot.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file models/loot_test.cairo --tests 17`

- [ ] **beast_test.cairo** (17 tests)
  - [ ] Extract tests from `src/models/beast.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file models/beast_test.cairo --tests 17`

- [ ] **market_test.cairo** (10 tests)
  - [ ] Extract tests from `src/models/market.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file models/market_test.cairo --tests 10`

- [ ] **obstacle_test.cairo** (5 tests)
  - [ ] Extract tests from `src/models/obstacle.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file models/obstacle_test.cairo --tests 5`

### Utils Tests (9 tests)
- [ ] **loot_test.cairo** (8 tests)
  - [ ] Extract tests from `src/utils/loot.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file utils/loot_test.cairo --tests 8`

- [ ] **renderer_utils_test.cairo** (1 test)
  - [ ] Extract tests from `src/utils/renderer/renderer_utils.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_1 --file utils/renderer_utils_test.cairo --tests 1`

## Phase 2: Integration Test Migration (31 tests)

### Directory Structure Creation
- [ ] Create `src/tests/integration/` directory
- [ ] Create `src/tests/integration/game/` directory

### Game Integration Tests
- [ ] **game_test.cairo** (31 tests)
  - [ ] Extract tests from `src/systems/game/contracts.cairo`
  - [ ] Update imports in test file
  - [ ] Remove tests from source file
  - [ ] Verify test count matches
  - [ ] Update progress: `python track_refactor_progress.py update --phase phase_2 --file integration/game/game_test.cairo --tests 31`

## Phase 3: Update Module Declarations and Workflow

### Module Declarations
- [ ] Update `src/lib.cairo` with test module structure
- [ ] Add `#[cfg(test)]` module declarations
- [ ] Ensure all test files are properly declared

### Workflow Updates
- [ ] Update `.github/workflows/test-contract.yml`
- [ ] Update test matrix configuration
- [ ] Update test execution commands
- [ ] Test workflow with new structure

## Phase 4: Verification

### Test Execution
- [ ] Run all unit tests: `sozo test src/tests/unit/`
- [ ] Run adventurer tests: `sozo test src/tests/unit/adventurer/`
- [ ] Run model tests: `sozo test src/tests/unit/models/`
- [ ] Run utils tests: `sozo test src/tests/unit/utils/`
- [ ] Run integration tests: `sozo test src/tests/integration/`
- [ ] Verify all 282 tests pass

### Final Checks
- [ ] All source files no longer contain test functions
- [ ] All test files have proper imports
- [ ] Test count matches original (282 total)
- [ ] Git diff shows only test movements, no logic changes
- [ ] CI/CD pipeline passes with new structure

## Post-Migration
- [ ] Update documentation
- [ ] Clean up tracking files
- [ ] Create PR with changes
- [ ] Get PR reviewed and merged

## Commands Reference

### Check current test counts in source files:
```bash
python track_refactor_progress.py check
```

### View current progress:
```bash
python track_refactor_progress.py status
```

### Update progress after migrating a file:
```bash
python track_refactor_progress.py update --phase phase_1 --file adventurer/adventurer_test.cairo --tests 94
```

### Verify test migration:
```bash
python track_refactor_progress.py verify --source src/models/adventurer/adventurer.cairo --target src/tests/unit/adventurer/adventurer_test.cairo
```

## Notes
- Always verify test counts match between source and target
- Ensure imports are updated correctly
- Run tests after each file migration to catch issues early
- Keep tracking file updated for accurate progress monitoring