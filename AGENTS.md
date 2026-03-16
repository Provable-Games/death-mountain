## Project Overview

Death Mountain is a blockchain-based adventure RPG built on StarkNet using the Dojo game engine. Players control adventurers battling beasts, navigating obstacles, collecting loot, and progressing through dungeons. The game features tokenized interfaces for ERC20/721/1155 integration and configurable dungeon parameters.

## Repository Structure

```
death-mountain/
├── client/          # React + TypeScript frontend (Vite)
├── contracts/       # Cairo smart contracts (Dojo 1.6.0)
└── .github/         # CI workflows
```

See `client/CLAUDE.md` and `contracts/CLAUDE.md` for detailed guidance on each layer.

## Quick Start

### Prerequisites

- Node.js 18+, pnpm
- Cairo 2.10.1, Dojo 1.6.0

### Frontend

```bash
cd client && pnpm install && pnpm dev   # Port 5173
```

### Contracts

```bash
cd contracts && sozo build && sozo test
```

## Architecture Overview

### Data Flow

1. **User Action** → React UI triggers `useSystemCalls` hook
2. **Contract Call** → Starknet transaction via Cartridge Controller
3. **State Update** → Dojo models emit events, Torii indexes them
4. **UI Update** → Zustand stores update from event data

### Key Integration Points

- **Wallet**: Cartridge Controller + StarknetKit
- **Contract Bindings**: Auto-generated in `client/src/generated/`
- **State Sync**: Dojo's entity-component system via Torii indexer
- **Game Events**: `GameEvent` enum in contracts → `translateGameEvent` in client

### Game Systems

| System               | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `game_systems`       | Core game loop: explore, attack, flee, buy, equip             |
| `adventurer_systems` | Character stats, leveling, equipment management               |
| `beast_systems`      | Enemy encounters, combat resolution                           |
| `loot_systems`       | Item generation, type triangle (Magic > Hide > Metal > Magic) |
| `settings_systems`   | Dungeon configuration, game parameters                        |

### Frontend State

| Store         | Purpose                                       |
| ------------- | --------------------------------------------- |
| `gameStore`   | Adventurer, beast, bag, battle events, market |
| `marketStore` | Item purchases, pricing                       |
| `uiStore`     | UI toggles, overlay states                    |

## Network Configurations

| Network        | Config File         | Namespace  |
| -------------- | ------------------- | ---------- |
| Local (Katana) | `dojo_dev.toml`     | `ls_0_0_4` |
| Sepolia        | `dojo_sepolia.toml` | `ls_0_0_9` |
| Mainnet        | `dojo_mainnet.toml` | varies     |
| Slot           | `dojo_slot.toml`    | varies     |

## Code Conventions

- **Cairo**: `scarb fmt` with 120 char line limit
- **TypeScript**: ESLint, strict mode
- **Imports**: Use `@/` alias for client src paths
- **Platform UI**: Desktop in `client/src/desktop/`, Mobile in `client/src/mobile/`
