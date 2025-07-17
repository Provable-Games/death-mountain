// SPDX-License-Identifier: BUSL-1.1

use core::panic_with_felt252;
use core::traits::DivRem;
use death_mountain::constants::combat::CombatEnums::Slot;
use death_mountain::constants::loot::SUFFIX_UNLOCK_GREATNESS;
use death_mountain::models::adventurer::item::{IItemPrimitive, ImplItem, Item};
use death_mountain::models::adventurer::stats::{ImplStats, Stats};
use death_mountain::models::loot::ImplLoot;

/// @notice The Equipment struct
/// @dev The equipment struct is used to store the adventurer's equipment
/// @dev The equipment struct is packed into a felt252
#[derive(Introspect, Drop, Copy, Serde, PartialEq)]
pub struct Equipment { // 128 bits
    pub weapon: Item,
    pub chest: Item,
    pub head: Item,
    pub waist: Item, // 16 bits per item
    pub foot: Item,
    pub hand: Item,
    pub neck: Item,
    pub ring: Item,
}

#[generate_trait]
pub impl ImplEquipment of IEquipment {
    /// @notice Creates a new Equipment
    /// @return Equipment: The new Equipment
    fn new() -> Equipment {
        Equipment {
            weapon: ImplItem::new(0),
            chest: ImplItem::new(0),
            head: ImplItem::new(0),
            waist: ImplItem::new(0),
            foot: ImplItem::new(0),
            hand: ImplItem::new(0),
            neck: ImplItem::new(0),
            ring: ImplItem::new(0),
        }
    }

    /// @notice Packs an Equipment into a felt252
    /// @param self: The Equipment to pack
    /// @return felt252: The packed Equipment
    fn pack(self: Equipment) -> felt252 {
        (self.weapon.pack().into()
            + self.chest.pack().into() * TWO_POW_16
            + self.head.pack().into() * TWO_POW_32
            + self.waist.pack().into() * TWO_POW_48
            + self.foot.pack().into() * TWO_POW_64
            + self.hand.pack().into() * TWO_POW_80
            + self.neck.pack().into() * TWO_POW_96
            + self.ring.pack().into() * TWO_POW_112)
            .try_into()
            .unwrap()
    }

    /// @notice Unpacks a felt252 into an Equipment
    /// @param value: The felt252 value to unpack
    /// @return Equipment: The unpacked Equipment
    fn unpack(value: felt252) -> Equipment {
        let packed = value.into();
        let (packed, weapon) = DivRem::div_rem(packed, TWO_POW_16_NZ);
        let (packed, chest) = DivRem::div_rem(packed, TWO_POW_16_NZ);
        let (packed, head) = DivRem::div_rem(packed, TWO_POW_16_NZ);
        let (packed, waist) = DivRem::div_rem(packed, TWO_POW_16_NZ);
        let (packed, foot) = DivRem::div_rem(packed, TWO_POW_16_NZ);
        let (packed, hand) = DivRem::div_rem(packed, TWO_POW_16_NZ);
        let (packed, neck) = DivRem::div_rem(packed, TWO_POW_16_NZ);
        let (_, ring) = DivRem::div_rem(packed, TWO_POW_16_NZ);

        Equipment {
            weapon: ImplItem::unpack(weapon.try_into().unwrap()),
            chest: ImplItem::unpack(chest.try_into().unwrap()),
            head: ImplItem::unpack(head.try_into().unwrap()),
            waist: ImplItem::unpack(waist.try_into().unwrap()),
            foot: ImplItem::unpack(foot.try_into().unwrap()),
            hand: ImplItem::unpack(hand.try_into().unwrap()),
            neck: ImplItem::unpack(neck.try_into().unwrap()),
            ring: ImplItem::unpack(ring.try_into().unwrap()),
        }
    }

    /// @notice Equips an item to the adventurer
    /// @param self: The Equipment to equip the item to
    /// @param item: The item to equip

    fn equip(ref self: Equipment, item: Item, slot: Slot) {
        match slot {
            Slot::None(()) => (),
            Slot::Weapon(()) => self.equip_weapon(item, slot),
            Slot::Chest(()) => self.equip_chest_armor(item, slot),
            Slot::Head(()) => self.equip_head_armor(item, slot),
            Slot::Waist(()) => self.equip_waist_armor(item, slot),
            Slot::Foot(()) => self.equip_foot_armor(item, slot),
            Slot::Hand(()) => self.equip_hand_armor(item, slot),
            Slot::Neck(()) => self.equip_necklace(item, slot),
            Slot::Ring(()) => self.equip_ring(item, slot),
        }
    }

    /// @notice Equips a weapon to the adventurer
    /// @param self: The Equipment to equip the weapon to
    /// @param item: The weapon to equip

    fn equip_weapon(ref self: Equipment, item: Item, slot: Slot) {
        assert(slot == Slot::Weapon, 'Item is not weapon');
        self.weapon = item
    }

    /// @notice Equips a chest armor to the adventurer
    /// @param self: The Equipment to equip the chest armor to
    /// @param item: The chest armor to equip

    fn equip_chest_armor(ref self: Equipment, item: Item, slot: Slot) {
        assert(slot == Slot::Chest, 'Item is not chest armor');
        self.chest = item
    }

    /// @notice Equips a head armor to the adventurer
    /// @param self: The Equipment to equip the head armor to
    /// @param item: The head armor to equip

    fn equip_head_armor(ref self: Equipment, item: Item, slot: Slot) {
        assert(slot == Slot::Head, 'Item is not head armor');
        self.head = item
    }

    /// @notice Equips a waist armor to the adventurer
    /// @param self: The Equipment to equip the waist armor to
    /// @param item: The waist armor to equip

    fn equip_waist_armor(ref self: Equipment, item: Item, slot: Slot) {
        assert(slot == Slot::Waist, 'Item is not waist armor');
        self.waist = item
    }

    /// @notice Equips a foot armor to the adventurer
    /// @param self: The Equipment to equip the foot armor to
    /// @param item: The foot armor to equip

    fn equip_foot_armor(ref self: Equipment, item: Item, slot: Slot) {
        assert(slot == Slot::Foot, 'Item is not foot armor');
        self.foot = item
    }

    /// @notice Equips a hand armor to the adventurer
    /// @param self: The Equipment to equip the hand armor to
    /// @param item: The hand armor to equip

    fn equip_hand_armor(ref self: Equipment, item: Item, slot: Slot) {
        assert(slot == Slot::Hand, 'Item is not hand armor');
        self.hand = item
    }

    /// @notice Equips a necklace to the adventurer
    /// @param self: The Equipment to equip the necklace to
    /// @param item: The necklace to equip

    fn equip_necklace(ref self: Equipment, item: Item, slot: Slot) {
        assert(slot == Slot::Neck, 'Item is not necklace');
        self.neck = item
    }

    /// @notice Equips a ring to the adventurer
    /// @param self: The Equipment to equip the ring to
    /// @param item: The ring to equip

    fn equip_ring(ref self: Equipment, item: Item, slot: Slot) {
        assert(slot == Slot::Ring, 'Item is not a ring');
        self.ring = item;
    }

    /// @notice Drops an item from the adventurer
    /// @param self: The Equipment to drop the item from
    /// @param item_id: The ID of the item to drop

    fn drop(ref self: Equipment, item_id: u8) {
        if self.weapon.id == item_id {
            self.weapon.id = 0;
            self.weapon.xp = 0;
        } else if self.chest.id == item_id {
            self.chest.id = 0;
            self.chest.xp = 0;
        } else if self.head.id == item_id {
            self.head.id = 0;
            self.head.xp = 0;
        } else if self.waist.id == item_id {
            self.waist.id = 0;
            self.waist.xp = 0;
        } else if self.foot.id == item_id {
            self.foot.id = 0;
            self.foot.xp = 0;
        } else if self.hand.id == item_id {
            self.hand.id = 0;
            self.hand.xp = 0;
        } else if self.neck.id == item_id {
            self.neck.id = 0;
            self.neck.xp = 0;
        } else if self.ring.id == item_id {
            self.ring.id = 0;
            self.ring.xp = 0;
        } else {
            panic_with_felt252('item is not equipped');
        }
    }

    /// @notice Increases the xp of an item at a given slot
    /// @param self: The Equipment to increase the item xp for
    /// @param slot: The Slot to increase the item xp for
    /// @param amount: The amount of xp to increase the item by
    /// @return (u8, u8): a tuple containing the previous and new level of the item
    fn increase_item_xp_at_slot(ref self: Equipment, slot: Slot, amount: u16) -> (u8, u8) {
        match slot {
            Slot::None(()) => (0, 0),
            Slot::Weapon(()) => ImplItem::increase_xp(ref self.weapon, amount),
            Slot::Chest(()) => ImplItem::increase_xp(ref self.chest, amount),
            Slot::Head(()) => ImplItem::increase_xp(ref self.head, amount),
            Slot::Waist(()) => ImplItem::increase_xp(ref self.waist, amount),
            Slot::Foot(()) => ImplItem::increase_xp(ref self.foot, amount),
            Slot::Hand(()) => ImplItem::increase_xp(ref self.hand, amount),
            Slot::Neck(()) => ImplItem::increase_xp(ref self.neck, amount),
            Slot::Ring(()) => ImplItem::increase_xp(ref self.ring, amount),
        }
    }

    /// @notice Checks if the adventurer has any items with special names
    /// @param self: The Equipment to check for item specials
    /// @return bool: True if equipment has item specials, false otherwise
    fn has_specials(self: Equipment) -> bool {
        if (self.weapon.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.chest.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.head.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.waist.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.foot.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.hand.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.neck.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.ring.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else {
            false
        }
    }

    /// @notice Gets stat boosts based on item specials
    /// @param self: The Equipment to get stat boosts for
    /// @param specials_seed: The seed to use for generating item specials
    /// @param game_libs: The game libraries to use for getting stat boosts
    /// @return Stats: The stat boosts for the equipment
    fn get_stat_boosts(self: Equipment, specials_seed: u16) -> Stats {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, charisma: 0, intelligence: 0, wisdom: 0, luck: 0,
        };

        if (self.weapon.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            let suffix = ImplLoot::get_suffix(self.weapon.id, specials_seed);
            stats.apply_suffix_boost(suffix);
            stats.apply_bag_boost(suffix);
        }
        if (self.chest.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            let suffix = ImplLoot::get_suffix(self.chest.id, specials_seed);
            stats.apply_suffix_boost(suffix);
            stats.apply_bag_boost(suffix);
        }
        if (self.head.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            let suffix = ImplLoot::get_suffix(self.head.id, specials_seed);
            stats.apply_suffix_boost(suffix);
            stats.apply_bag_boost(suffix);
        }
        if (self.waist.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            let suffix = ImplLoot::get_suffix(self.waist.id, specials_seed);
            stats.apply_suffix_boost(suffix);
            stats.apply_bag_boost(suffix);
        }
        if (self.foot.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            let suffix = ImplLoot::get_suffix(self.foot.id, specials_seed);
            stats.apply_suffix_boost(suffix);
            stats.apply_bag_boost(suffix);
        }
        if (self.hand.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            let suffix = ImplLoot::get_suffix(self.hand.id, specials_seed);
            stats.apply_suffix_boost(suffix);
            stats.apply_bag_boost(suffix);
        }
        if (self.neck.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            let suffix = ImplLoot::get_suffix(self.neck.id, specials_seed);
            stats.apply_suffix_boost(suffix);
            stats.apply_bag_boost(suffix);
        }
        if (self.ring.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            let suffix = ImplLoot::get_suffix(self.ring.id, specials_seed);
            stats.apply_suffix_boost(suffix);
            stats.apply_bag_boost(suffix);
        }
        stats
    }
}

const TWO_POW_16: u256 = 0x10000;
const TWO_POW_16_NZ: NonZero<u256> = 0x10000;
const TWO_POW_32: u256 = 0x100000000;
const TWO_POW_48: u256 = 0x1000000000000;
const TWO_POW_64: u256 = 0x10000000000000000;
const TWO_POW_80: u256 = 0x100000000000000000000;
const TWO_POW_96: u256 = 0x1000000000000000000000000;
const TWO_POW_112: u256 = 0x10000000000000000000000000000;
