# Death Mountain

A token-agnostic, no-code onchain dungeon creator written in Cairo.


### Key Features

- **Base Adventurer System**: Pre-built character mechanics with stats, progression, and combat
- **Configurable Dungeon Parameters**: Customizable difficulty, obstacles, beasts, and loot tables
- **Tokenized Interfaces**: Seamless integration with any ERC20/721/1155 tokens
- **Composable Architecture**: Build complex game mechanics on top of the base layer
- **No Built-in Economics**: Intentionally neutral - developers define entry costs and rewards

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Cairo 2.10.1
- Dojo 1.5.1

### Installation

```bash
# Clone the repository
git clone https://github.com/Provable-Games/death-mountain
cd death-mountain

# Install frontend dependencies
cd client
pnpm install

# Build contracts
cd ../contracts
sozo build
```

### Development

#### Frontend Development
```bash
cd client
pnpm dev           # Start development server (port 5173)
pnpm build         # Build for production
pnpm lint          # Run ESLint
pnpm preview       # Preview production build
```

#### Contract Development
```bash
cd contracts
sozo build         # Build Cairo contracts
sozo test          # Run contract tests
```

## Architecture

### Smart Contracts (Cairo/Dojo)

Death Mountain's contracts provide core game mechanics:

#### **Adventurer System**
Complete character management with RPG mechanics:
- **7 Core Stats**: Strength, Dexterity, Vitality, Intelligence, Wisdom, Charisma, Luck
- **8 Equipment Slots**: Weapon, Chest, Head, Waist, Foot, Hand, Neck, Ring
- **Progression System**: XP-based leveling with stat point allocation
- **Health System**: Starting HP of 100, scalable with Vitality
- **Bag Inventory**: Carry additional items beyond equipped gear
- **Coming Soon**: Multi-purpose Stats, Consumables, and Spells

#### **Beast System**
Dynamic enemy encounters with 75 unique beast types:
- **Tiered Difficulty**: Beasts scale with adventurer level
- **Combat Types**: Starter beasts (Gnome, Troll, Fairy, Bear) matched to weapon types
- **Special Abilities**: High-level beasts unlock critical hits and special attacks
- **Reward System**: XP and gold drops based on beast level and type
- **Flee Mechanics**: Dexterity-based escape chances
- **Coming Soon**: Ability to add custom beasts to your dungeons

#### **Obstacle System**
Environmental hazards with 75 unique obstacle types:
- **Three Categories**: 
  - Magical (25 types): Demonic Altar, Vortex of Despair, Curse, Hex
  - Sharp/Blade (25 types): Pendulum Blades, Poison Dart, Hidden Arrow
  - Crushing/Bludgeon (25 types): Collapsing Ceiling, Rockslide, Rolling Boulder
- **Damage Mechanics**: Type-based damage reduced by matching armor types
- **Intelligence Dodging**: Higher INT increases chance to avoid damage entirely
- **XP Rewards**: Both adventurer and equipped items gain experience
- **One-Time Events**: No combat loop, instant damage application
- **Coming Soon**: Ability to create custom obstacles for your dungeons

#### **Item System**
Comprehensive item generation with 101 unique base items:
- **Tier System**: T1-T5 items with inverse pricing (T5 cheapest but common)
- **Type Triangle**: Magic/Cloth > Hide/Blade > Metal/Bludgeon > Magic/Cloth
- **Item Evolution**: Items gain "greatness" (levels) unlocking:
  - Suffix at level 15 (e.g., "of Power" +3 STR)
  - Prefix at level 20 (e.g., "Demon Crown")
- **Special Powers**: 16 unique suffixes providing stat bonuses
- **Coming Soon**: Ability to add custom items

#### **Market System**
Deterministic marketplace without hardcoded economics:
- **Rotating Inventory**: Market refreshes on level up
- **Charisma Discounts**: CHA stat reduces prices for items and potions
- **Seed-Based Generation**: Reproducible market states
- **Configurable Size**: Adjustable items per market instance
- **No Base Pricing**: Developers set their own economic models
- **Coming Soon**: Ability to buy erc20 and erc721s using in-game currency


#### **Game System**
Core game loop orchestrating all systems:
- **Action Types**: Explore, Attack, Flee, Buy, Equip, Drop, Upgrade
- **State Management**: Battle states, market seeds, action tracking
- **Event Emission**: Comprehensive logging for all game actions
- **VRF Integration**: Optional true randomness for critical events
- **Gas Optimization**: Packed storage reducing transaction costs
- **Coming Soon**: Ability to define objectives for the dungeon run