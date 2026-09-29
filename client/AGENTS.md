This file provides guidance for working with the React frontend in this directory.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (port 5173, HTTPS via mkcert)
pnpm build            # Production build (tsc && vite build)
pnpm lint             # Run ESLint
pnpm preview          # Preview production build
```

## Project Structure

```
src/
├── App.tsx               # Root component, routing setup
├── Main.tsx              # Entry point with providers
├── stores/               # Zustand state management
│   ├── gameStore.ts      # Adventurer, beast, bag, events, market
│   ├── marketStore.ts    # Item purchases, pricing state
│   └── uiStore.ts        # UI toggles, overlays
├── dojo/                 # Blockchain integration hooks
│   ├── useSystemCalls.ts # Contract call wrappers (explore, attack, etc.)
│   ├── useGameTokens.ts  # Token ownership, minting
│   ├── useGameSettings.ts# Dungeon configuration
│   ├── useGameEvents.ts  # Event subscription
│   └── useDungeon.ts     # Dungeon state
├── desktop/              # Desktop-optimized UI
│   ├── pages/            # Full page components
│   ├── overlays/         # Modal overlays (Combat, Explore, Market, Inventory)
│   ├── components/       # Desktop-specific components
│   └── contexts/         # Desktop context providers
├── mobile/               # Mobile-optimized UI
│   ├── pages/            # Mobile page layouts
│   ├── containers/       # Screen containers (BeastScreen, etc.)
│   ├── components/       # Mobile-specific components
│   └── contexts/         # Mobile context providers
├── components/           # Shared UI components
├── contexts/             # Global context providers
│   ├── controller.tsx    # Cartridge Controller wallet
│   └── starknet.tsx      # Starknet connection
├── types/                # TypeScript interfaces
│   └── game.ts           # Adventurer, Beast, Item, Stats types
├── utils/                # Utility functions
│   ├── events.ts         # GameEvent processing
│   ├── translation.ts    # Contract event → UI event mapping
│   ├── loot.ts           # Item utilities (slots, types, boosts)
│   └── game.ts           # Game logic helpers
├── constants/            # Static game data
│   ├── beast.ts          # Beast names, prefixes, suffixes
│   ├── loot.ts           # Item definitions
│   └── obstacles.ts      # Obstacle definitions
├── api/                  # External API integrations
├── generated/            # Auto-generated Dojo bindings
└── abi/                  # Contract ABIs
```

## Key Patterns

### Zustand Store Usage

```typescript
import { useGameStore, shallow } from "@/stores/gameStore";

// Select specific state to avoid unnecessary re-renders
const { adventurer, beast } = useGameStore(
  (state) => ({ adventurer: state.adventurer, beast: state.beast }),
  shallow
);
```

### System Calls (Contract Interactions)

```typescript
import { useSystemCalls } from "@/dojo/useSystemCalls";

const { explore, attack, flee, equip, buyItems } = useSystemCalls();

// All actions follow pattern: prepare calls → execute → handle events
await explore(adventurer_id, till_beast);
```

### Event Translation

Contract events are translated via `translateGameEvent()` in `utils/translation.ts`:

```typescript
const translatedEvents = receipt.events.map((event) =>
  translateGameEvent(event, manifest, gameId, dungeon)
);
```

### Path Aliases

Use `@/` for imports from `src/`:

```typescript
import { Adventurer } from "@/types/game";
import { useGameStore } from "@/stores/gameStore";
```

## State Management

### gameStore (Primary State)

- `adventurer`: Current character state
- `adventurerState`: Snapshot for undo operations
- `bag`: Inventory items (not equipped)
- `beast`: Current enemy in battle
- `marketItemIds`: Available items for purchase
- `exploreLog`: Recent exploration events
- `battleEvent`: Current combat event

### Optimistic Updates

Equipment changes use optimistic updates with undo:

```typescript
equipItem(item); // Optimistic local update
undoEquipment(); // Revert to adventurerState
```

## Platform-Specific UI

Desktop and mobile have separate component trees:

- **Desktop**: `src/desktop/` - Uses overlays for game screens
- **Mobile**: `src/mobile/` - Uses container components

Shared components live in `src/components/`.

## Dependencies

| Package                 | Purpose                          |
| ----------------------- | -------------------------------- |
| `@dojoengine/sdk`       | Dojo integration, contract calls |
| `@cartridge/controller` | Wallet connection                |
| `starknetkit`           | Starknet utilities               |
| `@mui/material`         | UI component library             |
| `zustand`               | State management                 |
| `framer-motion`         | Animations                       |
| `notistack`             | Toast notifications              |

## Environment Variables

```env
VITE_PUBLIC_NODE_URL=          # StarkNet RPC endpoint
VITE_PUBLIC_TORII=             # Torii indexer URL
VITE_PUBLIC_VRF_PROVIDER_ADDRESS=  # VRF randomness provider
```

## Build Configuration

Vite config includes:

- WASM support (`vite-plugin-wasm`)
- Top-level await support
- HTTPS via mkcert (for wallet connections)
- Manual chunks for vendor code splitting
- Terser minification (drops console/debugger in prod)
