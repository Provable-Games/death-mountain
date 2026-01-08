import { ClauseBuilder, ParsedEntity, UnionOfModelData, HistoricalToriiQueryBuilder } from '@dojoengine/sdk';
import { SchemaType } from '../generated/models.gen.ts';
import { useDynamicConnector } from "../contexts/starknet.tsx";

export interface Item {
  id: number;
  xp: number;
}

export interface Equipment {
  weapon: Item;
  chest: Item;
  head: Item;
  waist: Item;
  foot: Item;
  hand: Item;
  neck: Item;
  ring: Item;
}

export interface Adventurer {
  health: number;
  xp: number;
  gold: number;
  beast_health: number;
  stat_upgrades_available: number;
  stats: Stats;
  equipment: Equipment;
  item_specials_seed: number;
  action_count: number;
}

export interface Bag {
  item_1: Item;
  item_2: Item;
  item_3: Item;
  item_4: Item;
  item_5: Item;
  item_6: Item;
  item_7: Item;
  item_8: Item;
  item_9: Item;
  item_10: Item;
  item_11: Item;
  item_12: Item;
  item_13: Item;
  item_14: Item;
  item_15: Item;
}

export interface Beast {
  id: number;
  seed: bigint;
  baseName: string;
  name: string;
  health: number;
  level: number;
  type: string;
  tier: number;
  specialPrefix: string | null;
  specialSuffix: string | null;
  isCollectable: boolean;
}

export interface Stats {
  strength: number;
  dexterity: number;
  vitality: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  luck: number;
}

export interface CombatStats {
  baseDamage: number;
  protection: number;
  bestDamage: number;
  bestProtection: number;
  bestItems: Item[];
  critChance: number;
  criticalDamage: number;
  gearScore: number;
}

export interface ItemPurchase {
  item_id: number;
  equip: boolean;
}

export interface Obstacle {
  id: number;
  dodged: boolean;
  damage: number;
  location: string;
  critical_hit: boolean;
}

export interface Attack {
  damage: number;
  location: string;
  critical_hit: boolean;
}

export interface GameAction {
  type: string;
  statUpgrades?: Stats;
  items?: number[];
  itemPurchases?: ItemPurchase[];
  potions?: number;
  remainingGold?: number;
  untilBeast?: boolean;
  untilDeath?: boolean;
  gameId?: number;
  settings?: any;
}

export interface Payment {
  paymentType: 'Ticket' | 'Golden Pass';
  goldenPass?: {
    address: string;
    tokenId: number;
  }
}

export interface Collectable {
  beast: Beast;
  showPopup: boolean;
  tokenURI: string | null;
}

export interface Metadata {
  player_name: string;
  minted_at: number;
  settings_id: number;
  minted_by: string;
  expires_at: number;
  available_at: number;
}

export interface Quest {
  id: number;
  chapterId: number;
  targetScore: number;
}

export interface GameSettingsData {
  vrf_address: string;
  name: string;
  in_battle: boolean;
  game_seed: number;
  game_seed_until_xp: number;
  stats_mode: string;
  base_damage_reduction: number;
  market_size: number;
  adventurer: Adventurer;
  bag: Item[];
}

export type GameSchemaType = SchemaType;
export type GameSchemaModels = GameSchemaType['lootsurvivor'];
export type GameComponentModels = GameSchemaType['tournaments'];
export type GameSchemaModelNames = keyof GameSchemaModels;
export type GameComponentModelNames = keyof GameComponentModels;
export type GameModelType = UnionOfModelData<GameSchemaType>;
export type GameEntity = ParsedEntity<GameSchemaType>;

export class GameQueryBuilder extends HistoricalToriiQueryBuilder<GameSchemaType> { }
export class GameClauseBuilder extends ClauseBuilder<GameSchemaType> { }

export const useEntityModel = () => {
  const { currentNetworkConfig } = useDynamicConnector();

  const getEntityModel = <M extends GameModelType>(entity: GameEntity, modelName: GameSchemaModelNames | GameComponentModelNames): M => (
    entity?.models[`${currentNetworkConfig.namespace}`]?.[modelName] as M
  );

  return { getEntityModel };
};