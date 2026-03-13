import { BEAST_NAME_PREFIXES, BEAST_NAME_SUFFIXES, BEAST_NAMES, BEAST_SPECIAL_NAME_LEVEL_UNLOCK } from "@/constants/beast";
import { OBSTACLE_NAMES } from "@/constants/obstacle";
import { Adventurer, Attack, Beast, Item, ItemPurchase, Obstacle, Stats, useEntityModel } from "@/types/game";
import { preloadAssets } from "./assetLoader";
import { getBeastImageById, getBeastName, getBeastTier, getBeastType } from "./beast";
import { getLocationName } from "./game";
import { streamIds } from "./cloudflare";
import { ItemUtils } from "./loot";
import { Dungeon } from "@/dojo/useDungeon";

export interface GameEvent {
  type: 'adventurer' | 'bag' | 'beast' | 'discovery' | 'obstacle' | 'defeated_beast' | 'fled_beast' | 'stat_upgrade' |
  'buy_items' | 'equip' | 'drop' | 'level_up' | 'market_items' | 'ambush' | 'attack' | 'beast_attack' | 'flee' | 'unknown';
  action_count: number;
  adventurer?: Adventurer;
  bag?: Item[];
  beast?: Beast;
  discovery?: {
    type: 'Gold' | 'Health' | 'Loot';
    amount: number;
  }
  obstacle?: Obstacle;
  stats?: Stats;
  attack?: Attack;

  xp_reward?: number;
  gold_reward?: number;

  beast_id?: number;
  potions?: number;
  items_purchased?: ItemPurchase[];
  items?: number[];
  market_seed?: bigint;
  level?: number;
  success?: boolean;

}

export const processRawGameEvent = (rawEvent: any, dungeon: Dungeon): GameEvent => {
  let event = {
    action_count: rawEvent.action_count,
    details: rawEvent.details.variant
  }

  return processGameEvent(event, dungeon);
}

export const processGameEvent = (event: any, dungeon: Dungeon): GameEvent => {
  const { action_count, details } = event;

  if ('adventurer' in details) {
    return {
      type: 'adventurer',
      action_count,
      adventurer: details.adventurer
    };
  }

  else if ('bag' in details) {
    return {
      type: 'bag',
      action_count,
      bag: Object.values(details.bag)
    };
  }

  else if ('beast' in details) {
    const beast = details.beast;
    return {
      type: 'beast',
      action_count,
      beast: {
        id: beast.id,
        seed: BigInt(beast.seed),
        baseName: BEAST_NAMES[beast.id],
        name: getBeastName(beast.id, beast.level, beast.specials.special2, beast.specials.special3),
        health: beast.health,
        level: beast.level,
        type: getBeastType(beast.id),
        tier: getBeastTier(beast.id),
        specialPrefix: beast.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? BEAST_NAME_PREFIXES[beast.specials.special2] : null,
        specialSuffix: beast.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? BEAST_NAME_SUFFIXES[beast.specials.special3] : null,
        isCollectable: dungeon.id === 'survivor' && beast.is_collectable
      }
    };
  }

  else if ('discovery' in details) {
    const discovery = details.discovery;
    return {
      type: 'discovery',
      action_count,
      discovery: {
        type: Object.keys((discovery.discovery_type.variant || discovery.discovery_type))[0] as 'Gold' | 'Health' | 'Loot',
        amount: Object.values((discovery.discovery_type.variant || discovery.discovery_type))[0] as number,
      },
      xp_reward: discovery.xp_reward
    };
  }

  else if ('obstacle' in details) {
    const obstacle = details.obstacle;
    return {
      type: 'obstacle',
      action_count,
      xp_reward: obstacle.xp_reward,
      obstacle: {
        id: obstacle.obstacle_id,
        damage: obstacle.damage,
        location: getLocationName(obstacle.location),
        critical_hit: obstacle.critical_hit,
        dodged: obstacle.dodged
      }
    };
  }

  else if ('defeated_beast' in details) {
    const beast = details.defeated_beast;
    return {
      type: 'defeated_beast',
      action_count,
      beast_id: beast.beast_id,
      gold_reward: beast.gold_reward,
      xp_reward: beast.xp_reward
    };
  }

  else if ('fled_beast' in details) {
    const beast = details.fled_beast;
    return {
      type: 'fled_beast',
      action_count,
      beast_id: beast.beast_id,
      xp_reward: beast.xp_reward
    };
  }

  else if ('stat_upgrade' in details) {
    const upgrade = details.stat_upgrade;
    return {
      type: 'stat_upgrade',
      action_count,
      stats: upgrade.stats
    };
  }

  else if ('buy_items' in details) {
    const buy_items = details.buy_items;
    return {
      type: 'buy_items',
      action_count,
      potions: buy_items.potions,
      items_purchased: buy_items.items_purchased
    };
  }

  else if ('equip' in details) {
    const equip = details.equip;
    return {
      type: 'equip',
      action_count,
      items: equip.items
    };
  }

  else if ('drop' in details) {
    const drop = details.drop;
    return {
      type: 'drop',
      action_count,
      items: drop.items
    };
  }

  else if ('level_up' in details) {
    const levelUp = details.level_up;
    return {
      type: 'level_up',
      action_count,
      level: levelUp.level,
    };
  }

  else if ('market_items' in details) {
    const marketItems = details.market_items;
    return {
      type: 'market_items',
      action_count,
      items: marketItems.items
    };
  }

  else if ('attack' in details) {
    const attack = details.attack;
    return {
      type: 'attack',
      action_count,
      attack: {
        damage: attack.damage,
        location: 'None',
        critical_hit: attack.critical_hit
      }
    };
  }

  else if ('beast_attack' in details) {
    const beastAttack = details.beast_attack;
    return {
      type: 'beast_attack',
      action_count,
      attack: {
        damage: beastAttack.damage,
        location: getLocationName(beastAttack.location),
        critical_hit: beastAttack.critical_hit
      }
    };
  }

  else if ('flee' in details) {
    return {
      type: 'flee',
      action_count,
      success: details.flee
    };
  }

  else if ('ambush' in details) {
    const ambush = details.ambush;
    return {
      type: 'ambush',
      action_count,
      attack: {
        damage: ambush.damage,
        location: getLocationName(ambush.location),
        critical_hit: ambush.critical_hit,
      }
    };
  }

  return { type: 'unknown', action_count: 0 };
}

export const getVideoId = (event: GameEvent) => {
  if (event.type === 'beast') {
    preloadAssets([`/images/battle_scenes/${event.beast!.baseName.toLowerCase()}.png`]);
    return streamIds[event.beast!.baseName as keyof typeof streamIds];
  } else if (event.type === 'obstacle') {
    return streamIds[OBSTACLE_NAMES[event.obstacle!.id as keyof typeof OBSTACLE_NAMES] as keyof typeof streamIds];
  } else if (event.type === 'discovery') {
    return streamIds[event.discovery!.type as keyof typeof streamIds];
  } else if (event.type === 'level_up') {
    return streamIds.level_up;
  }

  return null;
}

// Videos that transition to the next video
export const transitionVideos = [
  streamIds.explore,
]

export const BattleEvents = [
  'attack',
  'beast_attack',
  'flee',
  'ambush'
]

export const ExplorerReplayEvents = [
  'discovery',
  'obstacle',
  'defeated_beast',
  'fled_beast',
  'stat_upgrade',
  'buy_items',
  'level_up',
  'equip',
  'drop',
]

export const getEventIcon = (event: GameEvent) => {
  switch (event.type) {
    case 'discovery':
      if (event.discovery?.type === 'Gold') return '/images/mobile/gold.png';
      if (event.discovery?.type === 'Health') return '/images/health.png';
      if (event.discovery?.type === 'Loot') return ItemUtils.getItemImage(event.discovery?.amount!);
    case 'obstacle':
      const obstacleName = OBSTACLE_NAMES[event.obstacle?.id!];
      const snakeCaseName = obstacleName.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return `/images/obstacles/${snakeCaseName}.png`;
    case 'defeated_beast':
      return getBeastImageById(event.beast_id!);
    case 'fled_beast':
      return getBeastImageById(event.beast_id!);
    case 'stat_upgrade':
      return '/images/mobile/adventurer.png';
    case 'level_up':
      return '/images/mobile/upgrade.png';
    case 'buy_items':
      return '/images/mobile/market.png';
    default:
      return '/images/mobile/adventurer.png';
  }
};

export const getEventTitle = (event: GameEvent) => {
  switch (event.type) {
    case 'beast':
      return `Encountered beast`;
    case 'discovery':
      if (event.discovery?.type === 'Gold') return 'Discovered Gold';
      if (event.discovery?.type === 'Health') return 'Discovered Health';
      if (event.discovery?.type === 'Loot') return `Discovered ${ItemUtils.getItemName(event.discovery?.amount!)}`;
      return 'Discovered Unknown';
    case 'obstacle':
      const location = getLocationName(event.obstacle?.location);
      const obstacleName = OBSTACLE_NAMES[event.obstacle?.id!] || 'Unknown Obstacle';
      if (event.obstacle?.dodged) {
        return `Avoided ${obstacleName}`;
      }
      return `${obstacleName} hit your ${location}`;
    case 'defeated_beast':
      return `Defeated ${BEAST_NAMES[event.beast_id!]}`;
    case 'fled_beast':
      return `Fled from ${BEAST_NAMES[event.beast_id!]}`;
    case 'level_up':
      return 'Level Up';
    case 'stat_upgrade':
      return 'Stats Upgraded';
    case 'buy_items':
      return 'Visited Market';
    case 'equip':
      return 'Equipped Items';
    case 'drop':
      return 'Dropped Items'
    default:
      return 'Unknown Event';
  }
};