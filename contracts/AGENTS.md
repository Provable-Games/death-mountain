This file provides guidance for working with the Cairo smart contracts in this directory.

## Commands

```bash
sozo build                    # Build all contracts
sozo test                     # Run all tests
sozo test <test_name>         # Run specific test
scarb fmt                     # Format Cairo code (max 120 chars/line)
```

### Deployment

```bash
sozo migrate --profile sepolia    # Deploy to Sepolia
sozo migrate --profile mainnet    # Deploy to Mainnet
sozo migrate --profile slot       # Deploy to Slot testnet
```

## Project Structure

```
src/
├── lib.cairo              # Module declarations
├── systems/               # Dojo contract implementations
│   ├── game/             # Core game loop (explore, attack, flee, buy, equip)
│   ├── adventurer/       # Character management, stat calculations
│   ├── beast/            # Enemy generation, combat logic
│   ├── loot/             # Item type/tier resolution
│   ├── settings/         # Game configuration
│   ├── renderer/         # On-chain SVG NFT metadata
│   ├── game_token/       # Token contract integration
│   └── objectives/       # Dungeon objectives
├── models/               # Dojo models (on-chain state)
│   ├── adventurer/       # Adventurer, Bag, Equipment, Item, Stats
│   ├── game.cairo        # GameSettings, GameState, GameEvent
│   ├── beast.cairo       # Beast struct and combat specs
│   ├── combat.cairo      # CombatSpec, damage calculations
│   ├── loot.cairo        # Item definitions (101 base items)
│   ├── market.cairo      # Market state, ItemPurchase
│   └── obstacle.cairo    # Obstacle types (75 unique)
├── constants/            # Game constants and enums
├── libs/                 # Shared utilities
│   ├── game.cairo        # GameLibs dispatcher factory
│   └── settings.cairo    # Settings helpers
└── utils/                # Utility functions
    ├── loot.cairo        # Item type/tier lookup
    ├── vrf.cairo         # VRF randomness integration
    ├── renderer/         # SVG generation utilities
    └── string/           # String manipulation
```

## Key Patterns

### Dojo Contract Structure

```cairo
#[starknet::interface]
pub trait IMySystem<T> {
    fn my_action(ref self: T, adventurer_id: u64);
}

#[dojo::contract]
mod my_system {
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use death_mountain::constants::world::DEFAULT_NS;

    #[abi(embed_v0)]
    impl MySystemImpl of super::IMySystem<ContractState> {
        fn my_action(ref self: ContractState, adventurer_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            // Access models via world.read_model, world.write_model
        }
    }
}
```

### Dojo Model Definition

```cairo
#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct MyModel {
    #[key]
    pub id: u64,
    pub data: felt252,
}
```

### Cross-System Calls via GameLibs

```cairo
use death_mountain::libs::game::{GameLibs, ImplGameLibs};

let game_libs = ImplGameLibs::new(world);
let item_type = game_libs.loot.get_type(item_id);
let beast = game_libs.beast.get_starter_beast(weapon_type);
```

### Event Emission

```cairo
use dojo::event::EventStorage;
use death_mountain::models::game::{GameEvent, GameEventDetails};

fn _emit_game_event(ref world: WorldStorage, adventurer_id: u64, action_count: u16, details: GameEventDetails) {
    world.emit_event(@GameEvent { adventurer_id, action_count, details });
}
```

## Game Mechanics

### Combat Type Triangle

- **Magic/Cloth** beats **Hide/Blade**
- **Hide/Blade** beats **Metal/Bludgeon**
- **Metal/Bludgeon** beats **Magic/Cloth**

### Item Tiers (T1-T5)

- T5: Common, cheapest
- T1: Rare, most expensive
- Items gain "greatness" (XP), unlocking:
  - Suffix at level 15 (stat bonuses)
  - Prefix at level 20 (special names)

### Adventurer Stats

7 core stats: Strength, Dexterity, Vitality, Intelligence, Wisdom, Charisma, Luck

### Equipment Slots

8 slots: Weapon, Chest, Head, Waist, Foot, Hand, Neck, Ring

## Dependencies

```toml
dojo = "v1.6.0"
openzeppelin_token = "1.0.0"
game_components_minigame = "0.0.10"  # Provable Games shared components
alexandria_encoding = "v0.3.0"       # Cairo utilities
graffiti                             # SVG text rendering
```

## Testing

Tests use `#[test]` attribute and are colocated with source files:

```cairo
#[cfg(test)]
mod tests {
    #[test]
    fn test_my_function() {
        // Test implementation
    }
}
```

For integration tests requiring world setup, use `utils/setup_denshokan.cairo`.

## Configuration Files

| File                | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `Scarb.toml`        | Package config, dependencies, formatter settings |
| `dojo_dev.toml`     | Local Katana config                              |
| `dojo_sepolia.toml` | Sepolia testnet config                           |
| `dojo_mainnet.toml` | Mainnet config                                   |
| `manifest_*.json`   | Deployed contract addresses per network          |
