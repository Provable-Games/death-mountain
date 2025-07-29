// SPDX-License-Identifier: MIT

use death_mountain::constants::combat::CombatEnums::{Slot};
use death_mountain::constants::discovery::DiscoveryEnums::DiscoveryType;
use death_mountain::models::adventurer::adventurer::Adventurer;
use death_mountain::models::adventurer::bag::Bag;
use death_mountain::models::adventurer::stats::Stats;
use death_mountain::models::combat::SpecialPowers;
use death_mountain::models::market::ItemPurchase;
use starknet::ContractAddress;

// ------------------------------------------ //
// ------------ Models ---------------------- //
// ------------------------------------------ //
#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct AdventurerPacked {
    #[key]
    pub adventurer_id: u64,
    pub packed: felt252,
}

#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct BagPacked {
    #[key]
    pub adventurer_id: u64,
    pub packed: felt252,
}

#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct AdventurerEntropy {
    #[key]
    pub adventurer_id: u64,
    pub market_seed: u64,
    pub beast_seed: u64,
}

#[derive(Introspect, Drop, Serde)]
#[dojo::model]
pub struct GameSettingsMetadata {
    #[key]
    pub settings_id: u32,
    pub name: felt252,
    pub description: ByteArray,
    pub created_by: ContractAddress,
    pub created_at: u64,
}

#[derive(Introspect, Copy, Drop, Serde)]
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    pub vrf_address: ContractAddress,
    pub adventurer: Adventurer,
    pub bag: Bag,
    pub game_seed: u64,
    pub game_seed_until_xp: u16,
    pub in_battle: bool,
    pub stats_mode: StatsMode,
    pub base_damage_reduction: u8,
}

#[derive(Introspect, Copy, Drop, Serde, PartialEq)]
pub enum StatsMode {
    Dodge,
    Reduction,
}

#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct SettingsCounter {
    #[key]
    pub id: felt252,
    pub count: u32,
}
// ------------------------------------------ //
// ------------ Events ---------------------- //
// ------------------------------------------ //
#[derive(Introspect, Copy, Drop, Serde)]
#[dojo::event]
pub struct GameEvent {
    #[key]
    pub adventurer_id: u64,
    pub action_count: u16,
    pub details: GameEventDetails,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub enum GameEventDetails {
    adventurer: Adventurer,
    bag: Bag,
    beast: BeastEvent,
    discovery: DiscoveryEvent,
    obstacle: ObstacleEvent,
    defeated_beast: DefeatedBeastEvent,
    fled_beast: FledBeastEvent,
    stat_upgrade: StatUpgradeEvent,
    buy_items: BuyItemsEvent,
    equip: ItemEvent,
    drop: ItemEvent,
    level_up: LevelUpEvent,
    market_items: MarketItemsEvent,
    ambush: AttackEvent,
    attack: AttackEvent,
    beast_attack: AttackEvent,
    flee: bool,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct BeastEvent {
    pub id: u8,
    pub seed: u64,
    pub health: u16,
    pub level: u16,
    pub specials: SpecialPowers,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct DiscoveryEvent {
    pub discovery_type: DiscoveryType,
    pub xp_reward: u16,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct ObstacleEvent {
    pub obstacle_id: u8,
    pub dodged: bool,
    pub damage: u16,
    pub location: Slot,
    pub critical_hit: bool,
    pub xp_reward: u16,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct DefeatedBeastEvent {
    pub beast_id: u8,
    pub gold_reward: u16,
    pub xp_reward: u16,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct FledBeastEvent {
    pub beast_id: u8,
    pub xp_reward: u16,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct StatUpgradeEvent {
    pub stats: Stats,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct LevelUpEvent {
    pub level: u8,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct MarketItemsEvent {
    pub items: Span<u8>,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct BuyItemsEvent {
    pub potions: u8,
    pub items_purchased: Span<ItemPurchase>,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct ItemEvent {
    pub items: Span<u8>,
}

#[derive(Introspect, Copy, Drop, Serde)]
pub struct AttackEvent {
    pub damage: u16,
    pub location: Slot,
    pub critical_hit: bool,
}
