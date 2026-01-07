## Role & Context

You are a senior frontend developer specializing in modern web applications with deep expertise in React 18+, Vite 5+, and TypeScript 5+. Your primary focus is building performant, accessible, and maintainable user interfaces on top of decentralize networks like Ethereum and Starknet.

## Project Overview

This is the React/TypeScript frontend for Death Mountain, a token-agnostic onchain dungeon creator on Starknet. The client integrates with Dojo smart contracts via the Dojo SDK and provides separate optimized experiences for desktop and mobile.

## Development Commands

```bash
pnpm install         # Install dependencies
pnpm dev             # Start dev server (port 5173)
pnpm build           # Build for production (runs tsc first)
pnpm lint            # Run ESLint
pnpm preview         # Preview production build
```

## Architecture

### Entry Points

- `Main.tsx` - React root with providers
- `App.tsx` - Device detection routes to desktop or mobile layouts

### State Management

- **`stores/`** - Zustand stores:
  - `gameStore.ts` - Game state (adventurer, beast, battle status)
  - `marketStore.ts` - Market items and transactions
  - `uiStore.ts` - UI state (modals, overlays, sounds)

### React Contexts (`contexts/`)

- `controller.tsx` - Cartridge Controller wallet connection
- `starknet.tsx` - Starknet provider configuration
- `metagame.tsx` - Metagame SDK integration
- `Statistics.tsx` - Game statistics provider
- `SoundProvider.tsx` - Audio management

### Dojo Integration (`dojo/`)

Contract interaction hooks - all blockchain calls go through these:

- `useSystemCalls.ts` - Game actions (startGame, explore, attack, flee, equip, drop, buyItems, selectStatUpgrades)
- `useDungeon.ts` - Dungeon configuration and settings
- `useGameEvents.ts` - Event subscriptions and parsing
- `useGameTokens.ts` - NFT token utilities
- `useGameSettings.ts` - Game settings queries
- `useQuests.ts` - Quest/objective tracking

### Platform-Specific Code

Both `desktop/` and `mobile/` follow the same structure:

- `pages/` - Route components (GamePage, StartPage, WatchPage)
- `components/` - UI components
- `contexts/GameDirector.tsx` - Game flow orchestration
- `assets/` - Platform-specific assets

### Supporting Directories

- `api/` - Starknet API calls and GraphQL queries
- `generated/models.gen.ts` - Auto-generated types from contract ABIs
- `types/` - TypeScript type definitions
- `utils/` - Utility functions (analytics, beast, loot, market, events, themes)
- `constants/` - Game constants matching contract values
- `abi/` - Contract ABI JSON files
- `dungeons/` - Dungeon-specific components

## Key Patterns

### Contract Calls

All contract interactions use `useSystemCalls` hook:

```typescript
const { explore, attack, flee, equipItem, buyItems } = useSystemCalls();
```

### State Updates

Game state flows: Contract Events → `useGameEvents` → Zustand stores → UI components

### Theming

MUI theming with Emotion. Themes defined in `utils/themes.ts`. Desktop and mobile have separate theme configurations.

### Path Aliases

`@/*` maps to `src/*` (configured in tsconfig.json and vite.config.ts)

## Version Requirements

- Node.js 18+
- pnpm
- TypeScript 5.8+
- React 18.2+
- Vite 5.4+

## Key Dependencies

- `@dojoengine/sdk` - Dojo client SDK for contract interaction
- `@starknet-react/core` - React wallet integration
- `@cartridge/controller` - Cartridge wallet connector
- `starknet` - Starknet.js for low-level calls
- `@mui/material` - Component library (v7)
- `zustand` - State management
- `framer-motion` - Animations
- `recharts` - Charts for statistics

## Code Style

- Functional components with hooks
- Zustand for global state, React context for provider patterns
- Material-UI components with Emotion styling
- Path aliases (`@/`) for imports
- ESLint with React Hooks and Refresh plugins
