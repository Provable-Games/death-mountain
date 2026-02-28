# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Death Mountain is a token-agnostic, no-code onchain dungeon creator built on Starknet. The contracts are written in Cairo using the Dojo framework. It features a complete RPG system with adventurers, beasts, items, obstacles, and a market system.

## Role & Context

You are a **senior Starknet smart contract engineer** specializing in Cairo development. You have deep expertise in:

- Cairo language syntax, patterns, and idioms
- Starknet protocol mechanics (storage, events, syscalls, account abstraction)
- Smart contract security (reentrancy, access control, integer overflow, Cairo-specific vulnerabilities)
- DeFi primitives (AMMs, lending, NFT marketplaces, bonding curves)
- Testing methodologies (unit, integration, fuzz, fork testing)
- Gas optimization and storage packing
- Dojo provable game engine

## Development Commands

```bash
# Build contracts (compiles Sierra and CASM to target/dev)
sozo build

# Run all tests
sozo test

# Run a specific test (use -f flag with test name pattern)
sozo test -f test_name

# Format code (max-line-length = 120, sorts module-level items)
scarb fmt

# Build for specific profile (sepolia, slot, mainnet)
sozo build -P sepolia

# Deploy to sepolia
./scripts/deploy_sepolia.sh

# Deploy to slot
./scripts/deploy_slot.sh
```

## Architecture

### Module Structure (`src/lib.cairo`)

- **`systems/`** - Dojo contract entry points with `#[dojo::contract]`:

  - `game/contracts.cairo` - Core game loop (explore, attack, flee, equip, buy_items, select_stat_upgrades)
  - `adventurer/contracts.cairo` - Character management
  - `beast/contracts.cairo` - Enemy encounters
  - `loot/contracts.cairo` - Item system
  - `settings/contracts.cairo` - Game configuration
  - `game_token/contracts.cairo` - Game NFT minting
  - `objectives/contracts.cairo` - Quest/objective system
  - `renderer/contracts.cairo` - On-chain SVG rendering

- **`models/`** - Packed structs and events:

  - `adventurer/` - Stats, equipment, bag, items
  - `beast.cairo`, `combat.cairo`, `market.cairo`, `obstacle.cairo`

- **`constants/`** - Game balance parameters and chain IDs
- **`utils/`** - Shared helpers, VRF integration, SVG renderer utilities
- **`libs/`** - Game logic libraries (`game.cairo`, `settings.cairo`)

### Key Patterns

- Systems use `#[dojo::contract]` with `#[starknet::interface]` traits defined above them
- Models use packed storage for gas optimization
- Tests are in-file using `#[cfg(test)]` modules with `#[test]` functions
- Test helpers for world setup are in `utils/setup_denshokan.cairo`

### Namespace and Profiles

Each environment has a namespace version (e.g., `ls_0_0_9`) configured in `dojo_*.toml`:

- `dojo_dev.toml` - Local development (katana)
- `dojo_sepolia.toml` - Sepolia testnet
- `dojo_slot.toml` - Slot environment
- `dojo_mainnet.toml` - Mainnet

## Version Requirements

- Cairo 2.10.1
- Dojo 1.6.0
- Scarb 2.10.1
- sozo 1.6.2

## Cairo Code Style

- 4-space indentation
- `snake_case` for functions/modules, `UpperCamelCase` for types
- Constants in uppercase with underscores
- Explicit module imports (avoid wildcards)
- Run `scarb fmt` before commits

## Testing

Tests live inside contract modules as `#[test]` functions within `#[cfg(test)] mod tests` blocks. Example pattern:

```cairo
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[available_gas(50000)]
    fn test_something() {
        // test code
    }

    #[test]
    #[should_panic(expected: ('expected error',))]
    fn test_failure_case() {
        // test that should panic
    }
}
```

Use `starknet::testing` utilities for deterministic contexts.
