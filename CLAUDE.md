# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Death Mountain is a blockchain-based adventure RPG game built on StarkNet using the Dojo engine. The game features adventurers battling beasts, collecting loot, and progressing through various challenges.

## Common Development Commands

### Frontend Development (client/)
```bash
cd client
pnpm install        # Install dependencies
pnpm dev           # Start development server (port 5173)
pnpm build         # Build for production (runs tsc && vite build)
pnpm lint          # Run ESLint
pnpm preview       # Preview production build
```

### Backend Development (contracts/)
```bash
cd contracts
sozo build         # Build Cairo contracts
sozo test          # Run contract tests
```

## Architecture Overview

### Frontend Architecture
- **React + TypeScript** application using Vite as build tool
- **State Management**: Zustand stores in `client/src/stores/`
  - `gameStore.ts` - Main game state and player data
  - `marketStore.ts` - Marketplace and trading state
  - `uiStore.ts` - UI state management
- **Platform-Specific UI**:
  - `client/src/desktop/` - Desktop-optimized components and pages
  - `client/src/mobile/` - Mobile-optimized components and pages
- **Dojo Integration**: `client/src/dojo/` contains blockchain interaction code
- **Generated Code**: `client/src/generated/` - Auto-generated contract bindings
- **Game Data**: `client/src/constants/` - Static game data (beasts, loot, obstacles)
- **Components**: Reusable UI components in `client/src/components/`
- **Containers**: Screen-specific containers in `client/src/containers/`

### Smart Contract Architecture
- **Cairo Contracts** in `contracts/src/`
- **Systems**: Core game logic contracts in `contracts/src/systems/`
  - `adventurer/` - Player character system
  - `beast/` - Enemy and combat system
  - `game/` - Main game loop and state management
  - `loot/` - Item generation and management
  - `market/` - Trading and marketplace logic
  - `settings/` - Game configuration
  - `renderer/` - NFT metadata rendering
- **Models**: Data structures in `contracts/src/models/`
- **Libraries**: Shared code in `contracts/src/libs/`
- **Constants**: Game constants in `contracts/src/constants/`
- **Dojo Framework**: Version 1.5.1 for on-chain game state

### Key Integration Points
- **Wallet Connection**: Uses Cartridge Controller and StarknetKit
- **Contract Calls**: Through generated bindings in `client/src/generated/`
- **Game State**: Managed through Dojo's entity-component system
- **Audio System**: Background music and sound effects in `client/public/audio/`

## Important Configuration

### Environment Variables (client/.env)
- `VITE_PUBLIC_NODE_URL` - StarkNet RPC endpoint
- `VITE_PUBLIC_TORII` - Torii indexer URL
- Contract addresses for ETH, LORDS tokens, and game contracts

### Network Configurations
- Development: `dojo_dev.toml`
- Sepolia testnet: `dojo_sepolia.toml`
- Mainnet: `dojo_mainnet.toml`
- Slot testnet: `dojo_slot.toml`

## Development Workflow

1. **Frontend Changes**: Work in `client/src/`, run `pnpm dev` to see changes
2. **Contract Changes**: Modify Cairo files in `contracts/src/`, deploy with Dojo CLI
3. **Asset Updates**: Place images in appropriate directories under `client/src/assets/`
4. **State Management**: Update Zustand stores for new game features
5. **UI Components**: Use Material-UI components, maintain consistent styling

## Code Conventions

- TypeScript strict mode enabled
- React functional components with hooks
- Zustand for global state management
- Cairo 2.10.1 syntax for smart contracts
- Component files use `.tsx` extension
- Utility files use `.ts` extension
- Cairo formatting: `scarb fmt` with max line length 120

## Additional Commands

### Cairo Formatting
```bash
cd contracts
scarb fmt    # Format Cairo code
```

### Deployment
- Frontend deployment configured for Google App Engine (`client/app.yaml`)
- Contract deployment via Dojo CLI with network-specific profiles