import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, CairoOption, CairoOptionVariant, BigNumberish } from 'starknet';

// Type definition for `lootsurvivor::models::game::AdventurerEntropy` struct
export interface AdventurerEntropy {
	adventurer_id: BigNumberish;
	market_seed: BigNumberish;
	beast_seed: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::AdventurerEntropyValue` struct
export interface AdventurerEntropyValue {
	market_seed: BigNumberish;
	beast_seed: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::AdventurerPacked` struct
export interface AdventurerPacked {
	adventurer_id: BigNumberish;
	packed: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::AdventurerPackedValue` struct
export interface AdventurerPackedValue {
	packed: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::BagPacked` struct
export interface BagPacked {
	adventurer_id: BigNumberish;
	packed: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::BagPackedValue` struct
export interface BagPackedValue {
	packed: BigNumberish;
}

// Type definition for `tournaments::components::models::game::GameCounter` struct
export interface GameCounter {
	key: BigNumberish;
	count: BigNumberish;
}

// Type definition for `tournaments::components::models::game::GameCounterValue` struct
export interface GameCounterValue {
	count: BigNumberish;
}

// Type definition for `tournaments::components::models::game::GameMetadata` struct
export interface GameMetadata {
	contract_address: string;
	creator_address: string;
	name: BigNumberish;
	description: string;
	developer: BigNumberish;
	publisher: BigNumberish;
	genre: BigNumberish;
	image: string;
}

// Type definition for `tournaments::components::models::game::GameMetadataValue` struct
export interface GameMetadataValue {
	creator_address: string;
	name: BigNumberish;
	description: string;
	developer: BigNumberish;
	publisher: BigNumberish;
	genre: BigNumberish;
	image: string;
}

// Type definition for `tournaments::components::models::game::Score` struct
export interface Score {
	game_id: BigNumberish;
	score: BigNumberish;
}

// Type definition for `tournaments::components::models::game::ScoreValue` struct
export interface ScoreValue {
	score: BigNumberish;
}

// Type definition for `tournaments::components::models::game::Settings` struct
export interface Settings {
	id: BigNumberish;
	name: BigNumberish;
	value: BigNumberish;
}

// Type definition for `tournaments::components::models::game::SettingsCounter` struct
export interface SettingsCounter {
	key: BigNumberish;
	count: BigNumberish;
}

// Type definition for `tournaments::components::models::game::SettingsCounterValue` struct
export interface SettingsCounterValue {
	count: BigNumberish;
}

// Type definition for `tournaments::components::models::game::SettingsDetails` struct
export interface SettingsDetails {
	id: BigNumberish;
	name: BigNumberish;
	description: string;
	exists: boolean;
}

// Type definition for `tournaments::components::models::game::SettingsDetailsValue` struct
export interface SettingsDetailsValue {
	name: BigNumberish;
	description: string;
	exists: boolean;
}

// Type definition for `tournaments::components::models::game::SettingsValue` struct
export interface SettingsValue {
	value: BigNumberish;
}

// Type definition for `tournaments::components::models::game::TokenMetadata` struct
export interface TokenMetadata {
	token_id: BigNumberish;
	minted_by: string;
	player_name: BigNumberish;
	settings_id: BigNumberish;
	lifecycle: Lifecycle;
}

// Type definition for `tournaments::components::models::game::TokenMetadataValue` struct
export interface TokenMetadataValue {
	minted_by: string;
	player_name: BigNumberish;
	settings_id: BigNumberish;
	lifecycle: Lifecycle;
}

// Type definition for `tournaments::components::models::lifecycle::Lifecycle` struct
export interface Lifecycle {
	mint: BigNumberish;
	start: CairoOption<BigNumberish>;
	end: CairoOption<BigNumberish>;
}

// Type definition for `lootsurvivor::models::adventurer::stats::Stats` struct
export interface Stats {
	strength: BigNumberish;
	dexterity: BigNumberish;
	vitality: BigNumberish;
	intelligence: BigNumberish;
	wisdom: BigNumberish;
	charisma: BigNumberish;
	luck: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::AttackEvent` struct
export interface AttackEvent {
	damage: BigNumberish;
	location: SlotEnum;
	critical_hit: boolean;
}

// Type definition for `lootsurvivor::models::game::BattleEvent` struct
export interface BattleEvent {
	adventurer_id: BigNumberish;
	adventurer_xp: BigNumberish;
	details: BattleEventDetailsEnum;
}

// Type definition for `lootsurvivor::models::game::BattleEventValue` struct
export interface BattleEventValue {
	adventurer_xp: BigNumberish;
	details: BattleEventDetailsEnum;
}

// Type definition for `lootsurvivor::models::game::DefeatedBeastEvent` struct
export interface DefeatedBeastEvent {
	beast_id: BigNumberish;
	gold_reward: BigNumberish;
	xp_reward: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::DiscoveryEvent` struct
export interface DiscoveryEvent {
	discovery_type: DiscoveryTypeEnum;
	xp_reward: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::FledBeastEvent` struct
export interface FledBeastEvent {
	beast_id: BigNumberish;
	xp_reward: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::GameEvent` struct
export interface GameEvent {
	adventurer_id: BigNumberish;
	details: GameEventDetailsEnum;
}

// Type definition for `lootsurvivor::models::game::GameEventValue` struct
export interface GameEventValue {
	details: GameEventDetailsEnum;
}

// Type definition for `lootsurvivor::models::game::ItemEvent` struct
export interface ItemEvent {
	items: Array<BigNumberish>;
}

// Type definition for `lootsurvivor::models::game::LevelUpEvent` struct
export interface LevelUpEvent {
	level: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::MarketEvent` struct
export interface MarketEvent {
	potions: BigNumberish;
	items_purchased: Array<ItemPurchase>;
}

// Type definition for `lootsurvivor::models::game::ObstacleEvent` struct
export interface ObstacleEvent {
	obstacle_id: BigNumberish;
	dodged: boolean;
	damage: BigNumberish;
	location: SlotEnum;
	critical_hit: boolean;
	xp_reward: BigNumberish;
}

// Type definition for `lootsurvivor::models::game::StatUpgradeEvent` struct
export interface StatUpgradeEvent {
	stats: Stats;
}

// Type definition for `lootsurvivor::models::market::ItemPurchase` struct
export interface ItemPurchase {
	item_id: BigNumberish;
	equip: boolean;
}

// Type definition for `lootsurvivor::constants::combat::CombatEnums::Slot` enum
export const slot = [
	'None',
	'Weapon',
	'Chest',
	'Head',
	'Waist',
	'Foot',
	'Hand',
	'Neck',
	'Ring',
] as const;
export type Slot = { [key in typeof slot[number]]: string };
export type SlotEnum = CairoCustomEnum;

// Type definition for `lootsurvivor::constants::discovery::DiscoveryEnums::DiscoveryType` enum
export const discoveryType = [
	'Gold',
	'Health',
	'Loot',
] as const;
export type DiscoveryType = { [key in typeof discoveryType[number]]: string };
export type DiscoveryTypeEnum = CairoCustomEnum;

// Type definition for `lootsurvivor::models::game::BattleEventDetails` enum
export const battleEventDetails = [
	'ambush',
	'flee',
	'attack',
	'beast_attack',
	'equip',
	'fled_beast',
	'defeated_beast',
] as const;
export type BattleEventDetails = { 
	ambush: AttackEvent,
	flee: boolean,
	attack: AttackEvent,
	beast_attack: AttackEvent,
	equip: ItemEvent,
	fled_beast: FledBeastEvent,
	defeated_beast: DefeatedBeastEvent,
};
export type BattleEventDetailsEnum = CairoCustomEnum;

// Type definition for `lootsurvivor::models::game::GameEventDetails` enum
export const gameEventDetails = [
	'discovery',
	'obstacle',
	'defeated_beast',
	'fled_beast',
	'stat_upgrade',
	'market',
	'equip',
	'drop',
	'level_up',
] as const;
export type GameEventDetails = { 
	discovery: DiscoveryEvent,
	obstacle: ObstacleEvent,
	defeated_beast: DefeatedBeastEvent,
	fled_beast: FledBeastEvent,
	stat_upgrade: StatUpgradeEvent,
	market: MarketEvent,
	equip: ItemEvent,
	drop: ItemEvent,
	level_up: LevelUpEvent,
};
export type GameEventDetailsEnum = CairoCustomEnum;

// Type definition for `lootsurvivor::models::game::Bag` struct
export interface Bag {
	adventurer_id: BigNumberish;
	items: Array<BigNumberish>;
}

// Type definition for `lootsurvivor::models::game::Item` struct
export interface Item {
	id: BigNumberish;
	item_type: BigNumberish;
	slot: SlotEnum;
	rarity: BigNumberish;
	stats: Stats;
}

// Type definition for `lootsurvivor::models::game::Adventurer` struct
export interface Adventurer {
	id: BigNumberish;
	level: BigNumberish;
	xp: BigNumberish;
	gold: BigNumberish;
	health: BigNumberish;
	max_health: BigNumberish;
	stats: Stats;
	equipped_items: Array<BigNumberish>;
}

export interface SchemaType extends ISchemaType {
	lootsurvivor: {
		AdventurerEntropy: AdventurerEntropy,
		AdventurerEntropyValue: AdventurerEntropyValue,
		AdventurerPacked: AdventurerPacked,
		AdventurerPackedValue: AdventurerPackedValue,
		BagPacked: BagPacked,
		BagPackedValue: BagPackedValue,
		Bag: Bag,
		Item: Item,
		Adventurer: Adventurer,
	},
	tournaments: {
		GameCounter: GameCounter,
		GameCounterValue: GameCounterValue,
		GameMetadata: GameMetadata,
		GameMetadataValue: GameMetadataValue,
		Score: Score,
		ScoreValue: ScoreValue,
		Settings: Settings,
		SettingsCounter: SettingsCounter,
		SettingsCounterValue: SettingsCounterValue,
		SettingsDetails: SettingsDetails,
		SettingsDetailsValue: SettingsDetailsValue,
		SettingsValue: SettingsValue,
		TokenMetadata: TokenMetadata,
		TokenMetadataValue: TokenMetadataValue,
		Lifecycle: Lifecycle,
		Stats: Stats,
		AttackEvent: AttackEvent,
		BattleEvent: BattleEvent,
		BattleEventValue: BattleEventValue,
		DefeatedBeastEvent: DefeatedBeastEvent,
		DiscoveryEvent: DiscoveryEvent,
		FledBeastEvent: FledBeastEvent,
		GameEvent: GameEvent,
		GameEventValue: GameEventValue,
		ItemEvent: ItemEvent,
		LevelUpEvent: LevelUpEvent,
		MarketEvent: MarketEvent,
		ObstacleEvent: ObstacleEvent,
		StatUpgradeEvent: StatUpgradeEvent,
		ItemPurchase: ItemPurchase,
	},
}
export const schema: SchemaType = {
	lootsurvivor: {
		AdventurerEntropy: {
			adventurer_id: 0,
			market_seed: 0,
			beast_seed: 0,
		},
		AdventurerEntropyValue: {
			market_seed: 0,
			beast_seed: 0,
		},
		AdventurerPacked: {
			adventurer_id: 0,
			packed: 0,
		},
		AdventurerPackedValue: {
			packed: 0,
		},
		BagPacked: {
			adventurer_id: 0,
			packed: 0,
		},
		BagPackedValue: {
			packed: 0,
		},
		Bag: {
			adventurer_id: 0,
			items: [0],
		},
		Item: {
			id: 0,
			item_type: 0,
			slot: new CairoCustomEnum({
				None: "",
				Weapon: undefined,
				Chest: undefined,
				Head: undefined,
				Waist: undefined,
				Foot: undefined,
				Hand: undefined,
				Neck: undefined,
				Ring: undefined,
			}),
			rarity: 0,
			stats: {
				strength: 0,
				dexterity: 0,
				vitality: 0,
				intelligence: 0,
				wisdom: 0,
				charisma: 0,
				luck: 0,
			},
		},
		Adventurer: {
			id: 0,
			level: 0,
			xp: 0,
			gold: 0,
			health: 0,
			max_health: 0,
			stats: {
				strength: 0,
				dexterity: 0,
				vitality: 0,
				intelligence: 0,
				wisdom: 0,
				charisma: 0,
				luck: 0,
			},
			equipped_items: [0],
		},
	},
	tournaments: {
		GameCounter: {
			key: 0,
			count: 0,
		},
		GameCounterValue: {
			count: 0,
		},
		GameMetadata: {
			contract_address: "",
			creator_address: "",
			name: 0,
			description: "",
			developer: 0,
			publisher: 0,
			genre: 0,
			image: "",
		},
		GameMetadataValue: {
			creator_address: "",
			name: 0,
			description: "",
			developer: 0,
			publisher: 0,
			genre: 0,
			image: "",
		},
		Score: {
			game_id: 0,
			score: 0,
		},
		ScoreValue: {
			score: 0,
		},
		Settings: {
			id: 0,
			name: 0,
			value: 0,
		},
		SettingsCounter: {
			key: 0,
			count: 0,
		},
		SettingsCounterValue: {
			count: 0,
		},
		SettingsDetails: {
			id: 0,
			name: 0,
			description: "",
			exists: false,
		},
		SettingsDetailsValue: {
			name: 0,
			description: "",
			exists: false,
		},
		SettingsValue: {
			value: 0,
		},
		TokenMetadata: {
			token_id: 0,
			minted_by: "",
			player_name: 0,
			settings_id: 0,
			lifecycle: { mint: 0, start: new CairoOption(CairoOptionVariant.None), end: new CairoOption(CairoOptionVariant.None), },
		},
		TokenMetadataValue: {
			minted_by: "",
			player_name: 0,
			settings_id: 0,
			lifecycle: { mint: 0, start: new CairoOption(CairoOptionVariant.None), end: new CairoOption(CairoOptionVariant.None), },
		},
		Lifecycle: {
			mint: 0,
			start: new CairoOption(CairoOptionVariant.None),
			end: new CairoOption(CairoOptionVariant.None),
		},
		Stats: {
			strength: 0,
			dexterity: 0,
			vitality: 0,
			intelligence: 0,
			wisdom: 0,
			charisma: 0,
			luck: 0,
		},
		AttackEvent: {
			damage: 0,
			location: new CairoCustomEnum({ 
				None: "",
				Weapon: undefined,
				Chest: undefined,
				Head: undefined,
				Waist: undefined,
				Foot: undefined,
				Hand: undefined,
				Neck: undefined,
				Ring: undefined,
			}),
			critical_hit: false,
		},
		BattleEvent: {
			adventurer_id: 0,
			adventurer_xp: 0,
			details: new CairoCustomEnum({ 
				ambush: { damage: 0, location: new CairoCustomEnum({ 
					None: "",
					Weapon: undefined,
					Chest: undefined,
					Head: undefined,
					Waist: undefined,
					Foot: undefined,
					Hand: undefined,
					Neck: undefined,
					Ring: undefined,
				}), critical_hit: false, },
				flee: undefined,
				attack: undefined,
				beast_attack: undefined,
				equip: undefined,
				fled_beast: undefined,
				defeated_beast: undefined,
			}),
		},
		BattleEventValue: {
			adventurer_xp: 0,
			details: new CairoCustomEnum({ 
				ambush: { damage: 0, location: new CairoCustomEnum({ 
					None: "",
					Weapon: undefined,
					Chest: undefined,
					Head: undefined,
					Waist: undefined,
					Foot: undefined,
					Hand: undefined,
					Neck: undefined,
					Ring: undefined,
				}), critical_hit: false, },
				flee: undefined,
				attack: undefined,
				beast_attack: undefined,
				equip: undefined,
				fled_beast: undefined,
				defeated_beast: undefined,
			}),
		},
		DefeatedBeastEvent: {
			beast_id: 0,
			gold_reward: 0,
			xp_reward: 0,
		},
		DiscoveryEvent: {
			discovery_type: new CairoCustomEnum({ 
				Gold: 0,
				Health: undefined,
				Loot: undefined,
			}),
			xp_reward: 0,
		},
		FledBeastEvent: {
			beast_id: 0,
			xp_reward: 0,
		},
		GameEvent: {
			adventurer_id: 0,
			details: new CairoCustomEnum({ 
				discovery: { discovery_type: new CairoCustomEnum({ 
					Gold: 0,
					Health: undefined,
					Loot: undefined,
				}), xp_reward: 0, },
				obstacle: undefined,
				defeated_beast: undefined,
				fled_beast: undefined,
				stat_upgrade: undefined,
				market: undefined,
				equip: undefined,
				drop: undefined,
				level_up: undefined,
			}),
		},
		GameEventValue: {
			details: new CairoCustomEnum({ 
				discovery: { discovery_type: new CairoCustomEnum({ 
					Gold: 0,
					Health: undefined,
					Loot: undefined,
				}), xp_reward: 0, },
				obstacle: undefined,
				defeated_beast: undefined,
				fled_beast: undefined,
				stat_upgrade: undefined,
				market: undefined,
				equip: undefined,
				drop: undefined,
				level_up: undefined,
			}),
		},
		ItemEvent: {
			items: [0],
		},
		LevelUpEvent: {
			level: 0,
		},
		MarketEvent: {
			potions: 0,
			items_purchased: [{ item_id: 0, equip: false, }],
		},
		ObstacleEvent: {
			obstacle_id: 0,
			dodged: false,
			damage: 0,
			location: new CairoCustomEnum({ 
				None: "",
				Weapon: undefined,
				Chest: undefined,
				Head: undefined,
				Waist: undefined,
				Foot: undefined,
				Hand: undefined,
				Neck: undefined,
				Ring: undefined,
			}),
			critical_hit: false,
			xp_reward: 0,
		},
		StatUpgradeEvent: {
			stats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0, },
		},
		ItemPurchase: {
			item_id: 0,
			equip: false,
		},
	},
};
export enum ModelsMapping {
	AdventurerEntropy = 'lootsurvivor-AdventurerEntropy',
	AdventurerEntropyValue = 'lootsurvivor-AdventurerEntropyValue',
	AdventurerPacked = 'lootsurvivor-AdventurerPacked',
	AdventurerPackedValue = 'lootsurvivor-AdventurerPackedValue',
	BagPacked = 'lootsurvivor-BagPacked',
	BagPackedValue = 'lootsurvivor-BagPackedValue',
	GameCounter = 'tournaments-GameCounter',
	GameCounterValue = 'tournaments-GameCounterValue',
	GameMetadata = 'tournaments-GameMetadata',
	GameMetadataValue = 'tournaments-GameMetadataValue',
	Score = 'tournaments-Score',
	ScoreValue = 'tournaments-ScoreValue',
	Settings = 'tournaments-Settings',
	SettingsCounter = 'tournaments-SettingsCounter',
	SettingsCounterValue = 'tournaments-SettingsCounterValue',
	SettingsDetails = 'tournaments-SettingsDetails',
	SettingsDetailsValue = 'tournaments-SettingsDetailsValue',
	SettingsValue = 'tournaments-SettingsValue',
	TokenMetadata = 'tournaments-TokenMetadata',
	TokenMetadataValue = 'tournaments-TokenMetadataValue',
	Lifecycle = 'tournaments-Lifecycle',
	Slot = 'lootsurvivor-Slot',
	DiscoveryType = 'lootsurvivor-DiscoveryType',
	Stats = 'lootsurvivor-Stats',
	AttackEvent = 'lootsurvivor-AttackEvent',
	BattleEvent = 'lootsurvivor-BattleEvent',
	BattleEventDetails = 'lootsurvivor-BattleEventDetails',
	BattleEventValue = 'lootsurvivor-BattleEventValue',
	DefeatedBeastEvent = 'lootsurvivor-DefeatedBeastEvent',
	DiscoveryEvent = 'lootsurvivor-DiscoveryEvent',
	FledBeastEvent = 'lootsurvivor-FledBeastEvent',
	GameEvent = 'lootsurvivor-GameEvent',
	GameEventDetails = 'lootsurvivor-GameEventDetails',
	GameEventValue = 'lootsurvivor-GameEventValue',
	ItemEvent = 'lootsurvivor-ItemEvent',
	LevelUpEvent = 'lootsurvivor-LevelUpEvent',
	MarketEvent = 'lootsurvivor-MarketEvent',
	ObstacleEvent = 'lootsurvivor-ObstacleEvent',
	StatUpgradeEvent = 'lootsurvivor-StatUpgradeEvent',
	ItemPurchase = 'lootsurvivor-ItemPurchase',
}