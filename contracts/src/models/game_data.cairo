use death_mountain::models::adventurer::item::Item;
use starknet::ContractAddress;

/// Result type for operations
#[derive(Drop, Copy, Serde, PartialEq)]
pub enum DataResult<T> {
    Ok: T,
    Err: felt252,
}

#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct CollectableEntity {
    #[key]
    pub dungeon: ContractAddress,
    #[key]
    pub entity_hash: felt252,
    #[key]
    pub index: u64,
    pub seed: u64,
    pub id: u8,
    pub level: u16,
    pub health: u16,
    pub prefix: u8,
    pub suffix: u8,
    pub killed_by: u64,
}

#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct CollectableCount {
    #[key]
    pub dungeon: ContractAddress,
    #[key]
    pub entity_hash: felt252,
    pub count: u64,
}

#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct EntityStats {
    #[key]
    pub dungeon: ContractAddress,
    #[key]
    pub entity_hash: felt252,
    pub adventurers_killed: u64,
}

#[derive(IntrospectPacked, Copy, Drop, Serde)]
#[dojo::model]
pub struct AdventurerKilled {
    #[key]
    pub dungeon: ContractAddress,
    #[key]
    pub entity_hash: felt252,
    #[key]
    pub kill_index: u64,
    pub adventurer_id: u64,
}

#[derive(Introspect, Copy, Drop, Serde)]
#[dojo::model]
pub struct DroppedItem {
    #[key]
    pub adventurer_id: u64,
    #[key]
    pub item_id: u8,
    pub item: Item,
}
