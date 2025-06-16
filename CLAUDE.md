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
  - `main.ts` - Main game state
  - `explore.ts` - Exploration state
  - `combat.ts` - Combat mechanics
- **Game Screens**: Located in `client/src/pages/`
  - `Game.tsx` - Main game screen
  - `Start.tsx` - Game start/character creation
  - `Watch.tsx` - Spectator mode
  - `Campaign.tsx` - Campaign mode
- **Dojo Integration**: `client/src/dojo/` contains blockchain interaction code
- **Components**: Reusable UI components in `client/src/components/`
- **Containers**: Screen-specific containers in `client/src/containers/`

### Smart Contract Architecture
- **Cairo Contracts** in `contracts/src/`
- **Systems**: Core game logic contracts
  - `adventurer.cairo` - Player character logic
  - `beast.cairo` - Enemy logic
  - `combat.cairo` - Battle mechanics
  - `loot.cairo` - Item system
  - `market.cairo` - Trading system
- **Models**: Data structures in `contracts/src/models/`
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
- `VITE_PUBLIC_CHAIN` - Network (sepolia/mainnet)
- Contract addresses for ETH, LORDS tokens, and game contracts

### Network Configurations
- Development: `dojo_dev.toml`
- Sepolia testnet: `dojo_sepolia.toml`
- Mainnet: `dojo_mainnet.toml`

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