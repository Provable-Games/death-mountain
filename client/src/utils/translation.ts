import { hexToAscii } from "@dojoengine/utils";
import { getBeastName, getBeastTier, getBeastType } from "./beast";
import { BEAST_NAME_PREFIXES, BEAST_NAME_SUFFIXES, BEAST_SPECIAL_NAME_LEVEL_UNLOCK } from "@/constants/beast";
import { BEAST_NAMES } from "@/constants/beast";
import { Dungeon } from "@/dojo/useDungeon";
import { Adventurer, GameAction, Item, ItemPurchase, Stats } from "@/types/game";
import { GameEvent } from "./events";
import { ItemUtils } from "./loot";
import { STARTING_HEALTH } from "@/constants/game";

const parseData = (values: string[], type: string): any => {
  const value = values.splice(0, 1)[0];

  switch (type) {
    case 'string':
      return hexToAscii(value);
    case 'number':
      return parseInt(value);
    case 'boolean':
      return Boolean(parseInt(value));
    case 'bigint':
      return BigInt(value);
    case 'location':
      return locations[parseInt(value)];
    case 'discovery_number':
      return discoveryTypes[parseInt(value)];
  }

  return value;
}

const parseEventField = (values: string[], type: any): any => {
  if (typeof type === 'string' && type.startsWith('array')) {
    return parseArray(values, type);
  }

  if (typeof type === 'string' && components[type]) {
    return parseComponent(values, type);
  }

  return parseData(values, type);
}

const parseArray = (values: string[], arrayType: string): any[] => {
  const baseType = arrayType.replace('array_', '');
  const length = parseInt(values.splice(0, 1)[0]);
  let result = [];

  for (let i = 0; i < length; i++) {
    if (components[baseType]) {
      result.push(parseComponent(values, baseType));
    } else {
      result.push(parseData(values, baseType));
    }
  }

  return result;
}

const parseComponent = (values: string[], componentType: string): any => {
  const component = components[componentType];
  if (!component) {
    throw new Error(`Unknown component type: ${componentType}`);
  }

  const parsedFields = Object.keys(component).reduce((acc: any, key: string) => {
    return {
      ...acc,
      [key]: parseEventField(values, component[key])
    };
  }, {});

  return parsedFields;
}

const gameEventList = [
  'adventurer',
  'bag',
  'beast',
  'discovery',
  'obstacle',
  'defeated_beast',
  'fled_beast',
  'stat_upgrade',
  'buy_items',
  'equip',
  'drop',
  'level_up',
  'market_items',
  'ambush',
  'attack',
  'beast_attack',
  'flee',
]

const locations = [
  'None',
  'Weapon',
  'Chest',
  'Head',
  'Waist',
  'Foot',
  'Hand',
  'Neck',
  'Ring',
]

const discoveryTypes = [
  'Gold',
  'Health',
  'Loot',
]

export const components: any = {
  'GameEvent': {
    adventurer_id: 'number',
    action_count: 'number',
    details: null,
  },
  'adventurer': {
    adventurer: 'adventurer_details',
  },
  'adventurer_details': {
    health: 'number',
    xp: 'number',
    gold: 'number',
    beast_health: 'number',
    stat_upgrades_available: 'number',
    stats: 'stats',
    equipment: 'equipment',
    item_specials_seed: 'number',
    action_count: 'number',
  },
  'stats': {
    strength: 'number',
    dexterity: 'number',
    vitality: 'number',
    intelligence: 'number',
    wisdom: 'number',
    charisma: 'number',
    luck: 'number',
  },
  'equipment': {
    weapon: 'item',
    chest: 'item',
    head: 'item',
    waist: 'item',
    foot: 'item',
    hand: 'item',
    neck: 'item',
    ring: 'item',
  },
  'item': {
    id: 'number',
    xp: 'number',
  },
  'bag': {
    item_1: 'item',
    item_2: 'item',
    item_3: 'item',
    item_4: 'item',
    item_5: 'item',
    item_6: 'item',
    item_7: 'item',
    item_8: 'item',
    item_9: 'item',
    item_10: 'item',
    item_11: 'item',
    item_12: 'item',
    item_13: 'item',
    item_14: 'item',
    item_15: 'item',
    mutated: 'boolean',
  },
  'beast': {
    id: 'number',
    seed: 'bigint',
    health: 'number',
    level: 'number',
    specials: 'special_powers',
    is_collectable: 'boolean',
  },
  'special_powers': {
    special1: 'number',
    special2: 'number',
    special3: 'number',
  },
  'discovery': {
    discovery: 'discovery_type',
    xp_reward: 'number',
  },
  'discovery_type': {
    type: 'discovery_number',
    amount: 'number',
  },
  'obstacle': {
    obstacle: 'obstacle_details',
    xp_reward: 'number',
  },
  'obstacle_details': {
    id: 'number',
    dodged: 'boolean',
    damage: 'number',
    location: 'location',
    critical_hit: 'boolean',
  },
  'defeated_beast': {
    beast_id: 'number',
    gold_reward: 'number',
    xp_reward: 'number',
  },
  'fled_beast': {
    beast_id: 'number',
    xp_reward: 'number',
  },
  'stat_upgrade': {
    stats: 'stats',
  },
  'buy_items': {
    potions: 'number',
    items_purchased: 'array_item_purchase',
  },
  'item_purchase': {
    item_id: 'number',
    equip: 'boolean',
  },
  'equip': {
    items: 'array_number',
  },
  'drop': {
    items: 'array_number',
  },
  'level_up': {
    level: 'number',
  },
  'market_items': {
    items: 'array_number',
  },
  'attack': {
    attack: 'attack_details',
  },
  'beast_attack': {
    attack: 'attack_details',
  },
  'flee': {
    success: 'boolean',
  },
  'ambush': {
    attack: 'attack_details',
  },
  'attack_details': {
    damage: 'number',
    location: 'location',
    critical_hit: 'boolean',
  },
}

export const translateGameEvent = (event: any, manifest: any, gameId: number | null, dungeon: Dungeon): any => {
  const eventDefinition = manifest.events.find((definition: any) => definition.selector === event.keys[1]);
  const name = eventDefinition?.tag?.split('-')[1];
  const data = event.data;

  if (name !== 'GameEvent') {
    return undefined;
  }

  if (gameId && gameId !== parseInt(data[1])) {
    return 'Fatal Error';
  }

  const keysNumber = parseInt(data[0]);
  let values = [...data.slice(1, 1 + keysNumber), ...data.slice(keysNumber + 2)];

  const action_count = parseInt(values[1]);
  const type = gameEventList[parseInt(values[2])];

  values = values.slice(3);

  const parsedFields = parseComponent(values, type);

  let result: any = {
    type,
    action_count,
  }

  if (type === 'bag') {
    result = {
      ...result,
      bag: Object.values(parsedFields)
    }
  } else if (type === 'beast') {
    result = {
      ...result,
      beast: {
        id: parsedFields.id,
        seed: parsedFields.seed,
        baseName: BEAST_NAMES[parsedFields.id],
        name: getBeastName(parsedFields.id, parsedFields.level, parsedFields.specials.special2, parsedFields.specials.special3),
        health: parsedFields.health,
        level: parsedFields.level,
        type: getBeastType(parsedFields.id),
        tier: getBeastTier(parsedFields.id),
        specialPrefix: parsedFields.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? BEAST_NAME_PREFIXES[parsedFields.specials.special2] : null,
        specialSuffix: parsedFields.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK ? BEAST_NAME_SUFFIXES[parsedFields.specials.special3] : null,
        isCollectable: dungeon.id === 'survivor' && parsedFields.is_collectable,
      }
    }
  } else {
    result = {
      ...result,
      ...parsedFields
    }
  }

  return result;
}

export const optimisticGameEvents = (adventurer: Adventurer, bag: Item[], action: GameAction): GameEvent[] => {
  let events: GameEvent[] = [];
  let action_count = adventurer.action_count;

  if (action.type === "select_stat_upgrades") {
    let stats: Stats = action.statUpgrades!;
    events = [{
      type: 'stat_upgrade',
      action_count,
      stats,
    }, {
      type: 'adventurer',
      action_count,
      adventurer: {
        ...adventurer,
        stat_upgrades_available: 0,
        health: adventurer.health + (stats.vitality * 15),
        stats: {
          charisma: adventurer.stats.charisma + stats.charisma,
          dexterity: adventurer.stats.dexterity + stats.dexterity,
          intelligence: adventurer.stats.intelligence + stats.intelligence,
          strength: adventurer.stats.strength + stats.strength,
          vitality: adventurer.stats.vitality + stats.vitality,
          wisdom: adventurer.stats.wisdom + stats.wisdom,
          luck: adventurer.stats.luck + stats.luck,
        },
        action_count,
      },
    }]
  } else if (action.type === "buy_items") {
    let potions = action.potions!;
    let items_purchased: ItemPurchase[] = action.itemPurchases!;

    let equippedWeapon = items_purchased.find((item: ItemPurchase) => item.equip && ItemUtils.isWeapon(item.item_id));
    let equippedChest = items_purchased.find((item: ItemPurchase) => item.equip && ItemUtils.isChest(item.item_id));
    let equippedHead = items_purchased.find((item: ItemPurchase) => item.equip && ItemUtils.isHead(item.item_id));
    let equippedWaist = items_purchased.find((item: ItemPurchase) => item.equip && ItemUtils.isWaist(item.item_id));
    let equippedFoot = items_purchased.find((item: ItemPurchase) => item.equip && ItemUtils.isFoot(item.item_id));
    let equippedHand = items_purchased.find((item: ItemPurchase) => item.equip && ItemUtils.isHand(item.item_id));
    let equippedNeck = items_purchased.find((item: ItemPurchase) => item.equip && ItemUtils.isNecklace(item.item_id));
    let equippedRing = items_purchased.find((item: ItemPurchase) => item.equip && ItemUtils.isRing(item.item_id));

    let updatedBag = [...bag, ...items_purchased.filter((item: ItemPurchase) => !item.equip)
      .map((item: ItemPurchase) => ({ id: item.item_id, xp: 0 }))];

    if (equippedWeapon && adventurer.equipment.weapon.id !== 0) {
      updatedBag.push(adventurer.equipment.weapon);
    }
    if (equippedChest && adventurer.equipment.chest.id !== 0) {
      updatedBag.push(adventurer.equipment.chest);
    }
    if (equippedHead && adventurer.equipment.head.id !== 0) {
      updatedBag.push(adventurer.equipment.head);
    }
    if (equippedWaist && adventurer.equipment.waist.id !== 0) {
      updatedBag.push(adventurer.equipment.waist);
    }
    if (equippedFoot && adventurer.equipment.foot.id !== 0) {
      updatedBag.push(adventurer.equipment.foot);
    }
    if (equippedHand && adventurer.equipment.hand.id !== 0) {
      updatedBag.push(adventurer.equipment.hand);
    }
    if (equippedNeck && adventurer.equipment.neck.id !== 0) {
      updatedBag.push(adventurer.equipment.neck);
    }
    if (equippedRing && adventurer.equipment.ring.id !== 0) {
      updatedBag.push(adventurer.equipment.ring);
    }

    events = [
      {
        type: 'bag',
        action_count,
        bag: updatedBag,
      },
      {
        type: 'buy_items',
        action_count,
        potions,
        items_purchased,
      }, {
        type: 'adventurer',
        action_count,
        adventurer: {
          ...adventurer,
          action_count,
          gold: action.remainingGold!,
          health: Math.min(adventurer.health + (potions * 10), STARTING_HEALTH + (adventurer.stats.vitality * 15)),
          equipment: {
            weapon: equippedWeapon ? { id: equippedWeapon.item_id, xp: 0 } : adventurer.equipment.weapon,
            chest: equippedChest ? { id: equippedChest.item_id, xp: 0 } : adventurer.equipment.chest,
            head: equippedHead ? { id: equippedHead.item_id, xp: 0 } : adventurer.equipment.head,
            waist: equippedWaist ? { id: equippedWaist.item_id, xp: 0 } : adventurer.equipment.waist,
            foot: equippedFoot ? { id: equippedFoot.item_id, xp: 0 } : adventurer.equipment.foot,
            hand: equippedHand ? { id: equippedHand.item_id, xp: 0 } : adventurer.equipment.hand,
            neck: equippedNeck ? { id: equippedNeck.item_id, xp: 0 } : adventurer.equipment.neck,
            ring: equippedRing ? { id: equippedRing.item_id, xp: 0 } : adventurer.equipment.ring,
          },
        },
      }]
  }

  return events;
}