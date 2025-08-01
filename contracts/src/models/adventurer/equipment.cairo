// SPDX-License-Identifier: BUSL-1.1

use core::panic_with_felt252;
use core::traits::DivRem;
use death_mountain::constants::combat::CombatEnums::Slot;
use death_mountain::constants::loot::SUFFIX_UNLOCK_GREATNESS;
use death_mountain::models::adventurer::item::{IItemPrimitive, ImplItem, Item, ItemVerbose};
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

/// @notice Intended for clients and onchain renderers
#[derive(Introspect, Drop, Copy, Serde, PartialEq)]
pub struct EquipmentVerbose {
    pub weapon: ItemVerbose,
    pub chest: ItemVerbose,
    pub head: ItemVerbose,
    pub waist: ItemVerbose,
    pub foot: ItemVerbose,
    pub hand: ItemVerbose,
    pub neck: ItemVerbose,
    pub ring: ItemVerbose,
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

/// @notice Converts an Equipment to an EquipmentVerbose
/// @param self the Equipment to convert
/// @return EquipmentVerbose: the verbose Equipment
impl EquipmentIntoEquipmentVerbose of Into<Equipment, EquipmentVerbose> {
    fn into(self: Equipment) -> EquipmentVerbose {
        EquipmentVerbose {
            weapon: self.weapon.into(),
            chest: self.chest.into(),
            head: self.head.into(),
            waist: self.waist.into(),
            foot: self.foot.into(),
            hand: self.hand.into(),
            neck: self.neck.into(),
            ring: self.ring.into(),
        }
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

// ---------------------------
// ---------- Tests ----------
// ---------------------------
#[cfg(test)]
mod tests {
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
    use death_mountain::constants::loot::ItemId;
    use death_mountain::models::adventurer::adventurer::{ImplAdventurer};
    use death_mountain::models::adventurer::equipment::{Equipment, EquipmentVerbose, ImplEquipment, Item};
    use death_mountain::models::adventurer::item::{MAX_ITEM_XP, MAX_PACKABLE_ITEM_ID, MAX_PACKABLE_XP};
    use death_mountain::models::loot::ImplLoot;

    #[test]
    #[available_gas(1447420)]
    fn equipment_packing() {
        let equipment = Equipment {
            weapon: Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP },
            chest: Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP },
            head: Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP },
            waist: Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP },
            foot: Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP },
            hand: Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP },
            neck: Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP },
            ring: Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP },
        };

        let packed_equipment: Equipment = ImplEquipment::unpack(equipment.pack());

        assert(packed_equipment.weapon.id == equipment.weapon.id, 'wrong weapon id');
        assert(packed_equipment.weapon.xp == equipment.weapon.xp, 'wrong weapon xp');

        assert(packed_equipment.chest.id == equipment.chest.id, 'wrong chest id');
        assert(packed_equipment.chest.xp == equipment.chest.xp, 'wrong chest xp');

        assert(packed_equipment.head.id == equipment.head.id, 'wrong head id');
        assert(packed_equipment.head.xp == equipment.head.xp, 'wrong head xp');

        assert(packed_equipment.waist.id == equipment.waist.id, 'wrong waist id');
        assert(packed_equipment.waist.xp == equipment.waist.xp, 'wrong waist xp');

        assert(packed_equipment.foot.id == equipment.foot.id, 'wrong foot id');
        assert(packed_equipment.foot.xp == equipment.foot.xp, 'wrong foot xp');

        assert(packed_equipment.hand.id == equipment.hand.id, 'wrong hand id');
        assert(packed_equipment.hand.xp == equipment.hand.xp, 'wrong hand xp');

        assert(packed_equipment.neck.id == equipment.neck.id, 'wrong neck id');
        assert(packed_equipment.neck.xp == equipment.neck.xp, 'wrong neck xp');

        assert(packed_equipment.ring.id == equipment.ring.id, 'wrong ring id');
        assert(packed_equipment.ring.xp == equipment.ring.xp, 'wrong ring xp');

        let equipment = Equipment {
            weapon: Item { id: 127, xp: 511 },
            chest: Item { id: 0, xp: 0 },
            head: Item { id: 127, xp: 511 },
            waist: Item { id: 1, xp: 1 },
            foot: Item { id: 127, xp: 511 },
            hand: Item { id: 0, xp: 0 },
            neck: Item { id: 127, xp: 511 },
            ring: Item { id: 0, xp: 0 },
        };

        let packed_equipment: Equipment = ImplEquipment::unpack(equipment.pack());

        assert(packed_equipment.weapon.id == equipment.weapon.id, 'wrong weapon id');
        assert(packed_equipment.weapon.xp == equipment.weapon.xp, 'wrong weapon xp');

        assert(packed_equipment.chest.id == equipment.chest.id, 'wrong chest id');
        assert(packed_equipment.chest.xp == equipment.chest.xp, 'wrong chest xp');

        assert(packed_equipment.head.id == equipment.head.id, 'wrong head id');
        assert(packed_equipment.head.xp == equipment.head.xp, 'wrong head xp');

        assert(packed_equipment.waist.id == equipment.waist.id, 'wrong waist id');
        assert(packed_equipment.waist.xp == equipment.waist.xp, 'wrong waist xp');

        assert(packed_equipment.foot.id == equipment.foot.id, 'wrong foot id');
        assert(packed_equipment.foot.xp == equipment.foot.xp, 'wrong foot xp');

        assert(packed_equipment.hand.id == equipment.hand.id, 'wrong hand id');
        assert(packed_equipment.hand.xp == equipment.hand.xp, 'wrong hand xp');

        assert(packed_equipment.neck.id == equipment.neck.id, 'wrong neck id');
        assert(packed_equipment.neck.xp == equipment.neck.xp, 'wrong neck xp');

        assert(packed_equipment.ring.id == equipment.ring.id, 'wrong ring id');
        assert(packed_equipment.ring.xp == equipment.ring.xp, 'wrong ring xp');
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_weapon_xp() {
        let equipment = Equipment {
            weapon: Item { id: 127, xp: MAX_PACKABLE_XP + 1 },
            chest: Item { id: 127, xp: 511 },
            head: Item { id: 127, xp: 511 },
            waist: Item { id: 127, xp: 511 },
            foot: Item { id: 127, xp: 511 },
            hand: Item { id: 127, xp: 511 },
            neck: Item { id: 127, xp: 511 },
            ring: Item { id: 127, xp: 511 },
        };

        equipment.pack();
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_chest_xp() {
        let equipment = Equipment {
            weapon: Item { id: 127, xp: 511 },
            chest: Item { id: 127, xp: MAX_PACKABLE_XP + 1 },
            head: Item { id: 127, xp: 511 },
            waist: Item { id: 127, xp: 511 },
            foot: Item { id: 127, xp: 511 },
            hand: Item { id: 127, xp: 511 },
            neck: Item { id: 127, xp: 511 },
            ring: Item { id: 127, xp: 511 },
        };

        equipment.pack();
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_head_xp() {
        let equipment = Equipment {
            weapon: Item { id: 127, xp: 511 },
            chest: Item { id: 127, xp: 511 },
            head: Item { id: 127, xp: MAX_PACKABLE_XP + 1 },
            waist: Item { id: 127, xp: 511 },
            foot: Item { id: 127, xp: 511 },
            hand: Item { id: 127, xp: 511 },
            neck: Item { id: 127, xp: 511 },
            ring: Item { id: 127, xp: 511 },
        };

        equipment.pack();
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_waist_xp() {
        let equipment = Equipment {
            weapon: Item { id: 127, xp: 511 },
            chest: Item { id: 127, xp: 511 },
            head: Item { id: 127, xp: 511 },
            waist: Item { id: 127, xp: MAX_PACKABLE_XP + 1 },
            foot: Item { id: 127, xp: 511 },
            hand: Item { id: 127, xp: 511 },
            neck: Item { id: 127, xp: 511 },
            ring: Item { id: 127, xp: 511 },
        };

        equipment.pack();
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_foot_xp() {
        let equipment = Equipment {
            weapon: Item { id: 127, xp: 511 },
            chest: Item { id: 127, xp: 511 },
            head: Item { id: 127, xp: 511 },
            waist: Item { id: 127, xp: 511 },
            foot: Item { id: 127, xp: MAX_PACKABLE_XP + 1 },
            hand: Item { id: 127, xp: 511 },
            neck: Item { id: 127, xp: 511 },
            ring: Item { id: 127, xp: 511 },
        };

        equipment.pack();
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_hand_xp() {
        let equipment = Equipment {
            weapon: Item { id: 127, xp: 511 },
            chest: Item { id: 127, xp: 511 },
            head: Item { id: 127, xp: 511 },
            waist: Item { id: 127, xp: 511 },
            foot: Item { id: 127, xp: 511 },
            hand: Item { id: 127, xp: MAX_PACKABLE_XP + 1 },
            neck: Item { id: 127, xp: 511 },
            ring: Item { id: 127, xp: 511 },
        };

        equipment.pack();
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_neck_xp() {
        let equipment = Equipment {
            weapon: Item { id: 127, xp: 511 },
            chest: Item { id: 127, xp: 511 },
            head: Item { id: 127, xp: 511 },
            waist: Item { id: 127, xp: 511 },
            foot: Item { id: 127, xp: 511 },
            hand: Item { id: 127, xp: 511 },
            neck: Item { id: 127, xp: MAX_PACKABLE_XP + 1 },
            ring: Item { id: 127, xp: 511 },
        };

        equipment.pack();
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    #[available_gas(3000000)]
    fn pack_protection_overflow_ring_xp() {
        let equipment = Equipment {
            weapon: Item { id: 127, xp: 511 },
            chest: Item { id: 127, xp: 511 },
            head: Item { id: 127, xp: 511 },
            waist: Item { id: 127, xp: 511 },
            foot: Item { id: 127, xp: 511 },
            hand: Item { id: 127, xp: 511 },
            neck: Item { id: 127, xp: 511 },
            ring: Item { id: 127, xp: MAX_PACKABLE_XP + 1 },
        };

        equipment.pack();
    }

    #[test]
    #[should_panic(expected: ('Item is not weapon',))]
    #[available_gas(90000)]
    fn equip_invalid_weapon() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::DemonCrown, xp: 1 };
        // try to equip demon crown as a weapon
        // should panic with 'Item is not weapon' message
        adventurer.equipment.equip_weapon(item, ImplLoot::get_slot(item.id));
    }

    #[test]
    #[available_gas(171984)]
    fn equip_valid_weapon() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::Katana, xp: 1 };
        adventurer.equipment.equip_weapon(item, ImplLoot::get_slot(item.id));
        assert(adventurer.equipment.weapon.id == ItemId::Katana, 'did not equip weapon');
        assert(adventurer.equipment.weapon.xp == 1, 'weapon xp is not 1');
    }

    #[test]
    #[should_panic(expected: ('Item is not chest armor',))]
    #[available_gas(90000)]
    fn equip_invalid_chest() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // try to equip a Demon Crown as chest item
        // should panic with 'Item is not chest armor' message
        let item = Item { id: ItemId::DemonCrown, xp: 1 };
        adventurer.equipment.equip_chest_armor(item, ImplLoot::get_slot(item.id));
    }

    #[test]
    #[available_gas(171984)]
    fn equip_valid_chest() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::DivineRobe, xp: 1 };
        adventurer.equipment.equip_chest_armor(item, ImplLoot::get_slot(item.id));
        assert(adventurer.equipment.chest.id == ItemId::DivineRobe, 'did not equip chest armor');
        assert(adventurer.equipment.chest.xp == 1, 'chest armor xp is not 1');
    }

    #[test]
    #[should_panic(expected: ('Item is not head armor',))]
    #[available_gas(90000)]
    fn equip_invalid_head() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // try to equip a Katana as head item
        // should panic with 'Item is not head armor' message
        let item = Item { id: ItemId::Katana, xp: 1 };
        adventurer.equipment.equip_head_armor(item, ImplLoot::get_slot(item.id));
    }

    #[test]
    #[available_gas(171984)]
    fn equip_valid_head() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::Crown, xp: 1 };
        adventurer.equipment.equip_head_armor(item, ImplLoot::get_slot(item.id));
        assert(adventurer.equipment.head.id == ItemId::Crown, 'did not equip head armor');
        assert(adventurer.equipment.head.xp == 1, 'head armor xp is not 1');
    }


    #[test]
    #[should_panic(expected: ('Item is not waist armor',))]
    #[available_gas(90000)]
    fn equip_invalid_waist() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // try to equip a Demon Crown as waist item
        // should panic with 'Item is not waist armor' message
        let item = Item { id: ItemId::DemonCrown, xp: 1 };
        adventurer.equipment.equip_waist_armor(item, ImplLoot::get_slot(item.id));
    }

    #[test]
    #[available_gas(171984)]
    fn equip_valid_waist() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::WoolSash, xp: 1 };
        adventurer.equipment.equip_waist_armor(item, ImplLoot::get_slot(item.id));
        assert(adventurer.equipment.waist.id == ItemId::WoolSash, 'did not equip waist armor');
        assert(adventurer.equipment.waist.xp == 1, 'waist armor xp is not 1');
    }

    #[test]
    #[should_panic(expected: ('Item is not foot armor',))]
    #[available_gas(90000)]
    fn equip_invalid_foot() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // try to equip a Demon Crown as foot item
        // should panic with 'Item is not foot armor' message
        let item = Item { id: ItemId::DemonCrown, xp: 1 };
        adventurer.equipment.equip_foot_armor(item, ImplLoot::get_slot(item.id));
    }

    #[test]
    #[available_gas(172184)]
    fn equip_valid_foot() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::SilkSlippers, xp: 1 };
        adventurer.equipment.equip_foot_armor(item, ImplLoot::get_slot(item.id));
        assert(adventurer.equipment.foot.id == ItemId::SilkSlippers, 'did not equip foot armor');
        assert(adventurer.equipment.foot.xp == 1, 'foot armor xp is not 1');
    }

    #[test]
    #[should_panic(expected: ('Item is not hand armor',))]
    #[available_gas(90000)]
    fn equip_invalid_hand() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // try to equip a Demon Crown as hand item
        // should panic with 'Item is not hand armor' message
        let item = Item { id: ItemId::DemonCrown, xp: 1 };
        adventurer.equipment.equip_hand_armor(item, ImplLoot::get_slot(item.id));
    }

    #[test]
    #[available_gas(172184)]
    fn equip_valid_hand() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::DivineGloves, xp: 1 };
        adventurer.equipment.equip_hand_armor(item, ImplLoot::get_slot(item.id));
        assert(adventurer.equipment.hand.id == ItemId::DivineGloves, 'did not equip hand armor');
        assert(adventurer.equipment.hand.xp == 1, 'hand armor xp is not 1');
    }

    #[test]
    #[should_panic(expected: ('Item is not necklace',))]
    #[available_gas(90000)]
    fn equip_invalid_neck() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // try to equip a Demon Crown as necklace
        // should panic with 'Item is not necklace' message
        let item = Item { id: ItemId::DemonCrown, xp: 1 };
        adventurer.equipment.equip_necklace(item, ImplLoot::get_slot(item.id));
    }

    #[test]
    #[available_gas(172184)]
    fn equip_valid_neck() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::Pendant, xp: 1 };
        adventurer.equipment.equip_necklace(item, ImplLoot::get_slot(item.id));
        assert(adventurer.equipment.neck.id == ItemId::Pendant, 'did not equip necklace');
        assert(adventurer.equipment.neck.xp == 1, 'necklace xp is not 1');
    }

    #[test]
    #[should_panic(expected: ('Item is not a ring',))]
    #[available_gas(90000)]
    fn equip_invalid_ring() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // try to equip a Demon Crown as ring
        // should panic with 'Item is not a ring' message
        let item = Item { id: ItemId::DemonCrown, xp: 1 };
        adventurer.equipment.equip_ring(item, ImplLoot::get_slot(item.id));
    }

    #[test]
    #[available_gas(172184)]
    fn equip_valid_ring() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let item = Item { id: ItemId::PlatinumRing, xp: 1 };
        adventurer.equipment.equip_ring(item, ImplLoot::get_slot(item.id));
        assert(adventurer.equipment.ring.id == ItemId::PlatinumRing, 'did not equip ring');
        assert(adventurer.equipment.ring.xp == 1, 'ring xp is not 1');
    }

    #[test]
    #[available_gas(511384)]
    fn drop_item() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // assert starting conditions
        assert(adventurer.equipment.weapon.id == ItemId::Wand, 'weapon should be wand');
        assert(adventurer.equipment.chest.id == 0, 'chest should be 0');
        assert(adventurer.equipment.head.id == 0, 'head should be 0');
        assert(adventurer.equipment.waist.id == 0, 'waist should be 0');
        assert(adventurer.equipment.foot.id == 0, 'foot should be 0');
        assert(adventurer.equipment.hand.id == 0, 'hand should be 0');
        assert(adventurer.equipment.neck.id == 0, 'neck should be 0');
        assert(adventurer.equipment.ring.id == 0, 'ring should be 0');

        // drop equipped wand
        adventurer.equipment.drop(ItemId::Wand);
        assert(adventurer.equipment.weapon.id == 0, 'weapon should be 0');
        assert(adventurer.equipment.weapon.xp == 0, 'weapon xp should be 0');

        // instantiate additional items
        let weapon = Item { id: ItemId::Katana, xp: 1 };
        let chest = Item { id: ItemId::DivineRobe, xp: 1 };
        let head = Item { id: ItemId::Crown, xp: 1 };
        let waist = Item { id: ItemId::DemonhideBelt, xp: 1 };
        let foot = Item { id: ItemId::LeatherBoots, xp: 1 };
        let hand = Item { id: ItemId::LeatherGloves, xp: 1 };
        let neck = Item { id: ItemId::Amulet, xp: 1 };
        let ring = Item { id: ItemId::GoldRing, xp: 1 };

        // equip item
        adventurer.equipment.equip(weapon, ImplLoot::get_slot(weapon.id));
        adventurer.equipment.equip(chest, ImplLoot::get_slot(chest.id));
        adventurer.equipment.equip(head, ImplLoot::get_slot(head.id));
        adventurer.equipment.equip(waist, ImplLoot::get_slot(waist.id));
        adventurer.equipment.equip(foot, ImplLoot::get_slot(foot.id));
        adventurer.equipment.equip(hand, ImplLoot::get_slot(hand.id));
        adventurer.equipment.equip(neck, ImplLoot::get_slot(neck.id));
        adventurer.equipment.equip(ring, ImplLoot::get_slot(ring.id));

        // assert items were equipped
        assert(adventurer.equipment.weapon.id == weapon.id, 'weapon should be equipped');
        assert(adventurer.equipment.chest.id == chest.id, 'chest should be equipped');
        assert(adventurer.equipment.head.id == head.id, 'head should be equipped');
        assert(adventurer.equipment.waist.id == waist.id, 'waist should be equipped');
        assert(adventurer.equipment.foot.id == foot.id, 'foot should be equipped');
        assert(adventurer.equipment.hand.id == hand.id, 'hand should be equipped');
        assert(adventurer.equipment.neck.id == neck.id, 'neck should be equipped');
        assert(adventurer.equipment.ring.id == ring.id, 'ring should be equipped');

        // drop equipped items one by one and assert they get dropped
        adventurer.equipment.drop(weapon.id);
        assert(adventurer.equipment.weapon.id == 0, 'weapon should be 0');
        assert(adventurer.equipment.weapon.xp == 0, 'weapon xp should be 0');

        adventurer.equipment.drop(chest.id);
        assert(adventurer.equipment.chest.id == 0, 'chest should be 0');
        assert(adventurer.equipment.chest.xp == 0, 'chest xp should be 0');

        adventurer.equipment.drop(head.id);
        assert(adventurer.equipment.head.id == 0, 'head should be 0');
        assert(adventurer.equipment.head.xp == 0, 'head xp should be 0');

        adventurer.equipment.drop(waist.id);
        assert(adventurer.equipment.waist.id == 0, 'waist should be 0');
        assert(adventurer.equipment.waist.xp == 0, 'waist xp should be 0');

        adventurer.equipment.drop(foot.id);
        assert(adventurer.equipment.foot.id == 0, 'foot should be 0');
        assert(adventurer.equipment.foot.xp == 0, 'foot xp should be 0');

        adventurer.equipment.drop(hand.id);
        assert(adventurer.equipment.hand.id == 0, 'hand should be 0');
        assert(adventurer.equipment.hand.xp == 0, 'hand xp should be 0');

        adventurer.equipment.drop(neck.id);
        assert(adventurer.equipment.neck.id == 0, 'neck should be 0');
        assert(adventurer.equipment.neck.xp == 0, 'neck xp should be 0');

        adventurer.equipment.drop(ring.id);
        assert(adventurer.equipment.ring.id == 0, 'ring should be 0');
        assert(adventurer.equipment.ring.xp == 0, 'ring xp should be 0');
    }

    #[test]
    #[should_panic(expected: ('item is not equipped',))]
    #[available_gas(172984)]
    fn drop_item_not_equipped() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        // try to drop an item that isn't equipped
        // this should panic with 'item is not equipped'
        // the test is annotated to expect this panic
        adventurer.equipment.drop(ItemId::Crown);
    }

    #[test]
    #[available_gas(550000)]
    fn equip_item() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // assert starting conditions
        assert(adventurer.equipment.weapon.id == 12, 'weapon should be 12');
        assert(adventurer.equipment.chest.id == 0, 'chest should be 0');
        assert(adventurer.equipment.head.id == 0, 'head should be 0');
        assert(adventurer.equipment.waist.id == 0, 'waist should be 0');
        assert(adventurer.equipment.foot.id == 0, 'foot should be 0');
        assert(adventurer.equipment.hand.id == 0, 'hand should be 0');
        assert(adventurer.equipment.neck.id == 0, 'neck should be 0');
        assert(adventurer.equipment.ring.id == 0, 'ring should be 0');

        // stage items
        let weapon = Item { id: ItemId::Katana, xp: 1 };
        let chest = Item { id: ItemId::DivineRobe, xp: 1 };
        let head = Item { id: ItemId::Crown, xp: 1 };
        let waist = Item { id: ItemId::DemonhideBelt, xp: 1 };
        let foot = Item { id: ItemId::LeatherBoots, xp: 1 };
        let hand = Item { id: ItemId::LeatherGloves, xp: 1 };
        let neck = Item { id: ItemId::Amulet, xp: 1 };
        let ring = Item { id: ItemId::GoldRing, xp: 1 };

        adventurer.equipment.equip(weapon, ImplLoot::get_slot(weapon.id));
        adventurer.equipment.equip(chest, ImplLoot::get_slot(chest.id));
        adventurer.equipment.equip(head, ImplLoot::get_slot(head.id));
        adventurer.equipment.equip(waist, ImplLoot::get_slot(waist.id));
        adventurer.equipment.equip(foot, ImplLoot::get_slot(foot.id));
        adventurer.equipment.equip(hand, ImplLoot::get_slot(hand.id));
        adventurer.equipment.equip(neck, ImplLoot::get_slot(neck.id));
        adventurer.equipment.equip(ring, ImplLoot::get_slot(ring.id));

        // assert items were added
        assert(adventurer.equipment.weapon.id == weapon.id, 'weapon should be equipped');
        assert(adventurer.equipment.chest.id == chest.id, 'chest should be equipped');
        assert(adventurer.equipment.head.id == head.id, 'head should be equipped');
        assert(adventurer.equipment.waist.id == waist.id, 'waist should be equipped');
        assert(adventurer.equipment.foot.id == foot.id, 'foot should be equipped');
        assert(adventurer.equipment.hand.id == hand.id, 'hand should be equipped');
        assert(adventurer.equipment.neck.id == neck.id, 'neck should be equipped');
        assert(adventurer.equipment.ring.id == ring.id, 'ring should be equipped');
    }

    #[test]
    #[available_gas(1000000)]
    fn is_equipped() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);
        let wand = Item { id: ItemId::Wand, xp: 1 };
        let demon_crown = Item { id: ItemId::DemonCrown, xp: 1 };

        // assert starting state
        assert(adventurer.equipment.weapon.id == wand.id, 'weapon should be wand');
        assert(adventurer.equipment.chest.id == 0, 'chest should be 0');
        assert(adventurer.equipment.head.id == 0, 'head should be 0');
        assert(adventurer.equipment.waist.id == 0, 'waist should be 0');
        assert(adventurer.equipment.foot.id == 0, 'foot should be 0');
        assert(adventurer.equipment.hand.id == 0, 'hand should be 0');
        assert(adventurer.equipment.neck.id == 0, 'neck should be 0');
        assert(adventurer.equipment.ring.id == 0, 'ring should be 0');

        // assert base case for is_equipped
        assert(adventurer.equipment.is_equipped(wand.id) == true, 'wand should be equipped');
        assert(adventurer.equipment.is_equipped(demon_crown.id) == false, 'demon crown is not equipped');

        // stage items
        let katana = Item { id: ItemId::Katana, xp: 1 };
        let divine_robe = Item { id: ItemId::DivineRobe, xp: 1 };
        let crown = Item { id: ItemId::Crown, xp: 1 };
        let demonhide_belt = Item { id: ItemId::DemonhideBelt, xp: 1 };
        let leather_boots = Item { id: ItemId::LeatherBoots, xp: 1 };
        let leather_gloves = Item { id: ItemId::LeatherGloves, xp: 1 };
        let amulet = Item { id: ItemId::Amulet, xp: 1 };
        let gold_ring = Item { id: ItemId::GoldRing, xp: 1 };

        // Equip a katana and verify is_equipped returns true for katana and false everything else
        adventurer.equipment.equip(katana, ImplLoot::get_slot(katana.id));
        assert(adventurer.equipment.is_equipped(katana.id) == true, 'weapon should be equipped');
        assert(adventurer.equipment.is_equipped(wand.id) == false, 'wand should not be equipped');
        assert(adventurer.equipment.is_equipped(crown.id) == false, 'crown should not be equipped');
        assert(adventurer.equipment.is_equipped(divine_robe.id) == false, 'divine robe is not equipped');
        assert(adventurer.equipment.is_equipped(demonhide_belt.id) == false, 'demonhide belt is not equipped');
        assert(adventurer.equipment.is_equipped(leather_boots.id) == false, 'leather boots is not equipped');
        assert(adventurer.equipment.is_equipped(leather_gloves.id) == false, 'leather gloves is not equipped');
        assert(adventurer.equipment.is_equipped(amulet.id) == false, 'amulet is not equipped');
        assert(adventurer.equipment.is_equipped(gold_ring.id) == false, 'gold ring is not equipped');

        // equip a divine robe and verify is_equipped returns true for katana and divine robe and
        // false everything else
        adventurer.equipment.equip(divine_robe, ImplLoot::get_slot(divine_robe.id));
        assert(adventurer.equipment.is_equipped(divine_robe.id) == true, 'divine robe should be equipped');
        assert(adventurer.equipment.is_equipped(katana.id) == true, 'katana still equipped');
        assert(adventurer.equipment.is_equipped(crown.id) == false, 'crown should not be equipped');
        assert(adventurer.equipment.is_equipped(demonhide_belt.id) == false, 'demonhide belt is not equipped');
        assert(adventurer.equipment.is_equipped(leather_boots.id) == false, 'leather boots is not equipped');
        assert(adventurer.equipment.is_equipped(leather_gloves.id) == false, 'leather gloves is not equipped');
        assert(adventurer.equipment.is_equipped(amulet.id) == false, 'amulet is not equipped');
        assert(adventurer.equipment.is_equipped(gold_ring.id) == false, 'gold ring is not equipped');

        // equip a crown and verify is_equipped returns true for katana, divine robe, and crown and
        // false everything else
        adventurer.equipment.equip(crown, ImplLoot::get_slot(crown.id));
        assert(adventurer.equipment.is_equipped(crown.id) == true, 'crown should be equipped');
        assert(adventurer.equipment.is_equipped(divine_robe.id) == true, 'divine robe should be equipped');
        assert(adventurer.equipment.is_equipped(katana.id) == true, 'katana still equipped');
        assert(adventurer.equipment.is_equipped(demonhide_belt.id) == false, 'demonhide belt is not equipped');
        assert(adventurer.equipment.is_equipped(leather_boots.id) == false, 'leather boots is not equipped');
        assert(adventurer.equipment.is_equipped(leather_gloves.id) == false, 'leather gloves is not equipped');
        assert(adventurer.equipment.is_equipped(amulet.id) == false, 'amulet is not equipped');
        assert(adventurer.equipment.is_equipped(gold_ring.id) == false, 'gold ring is not equipped');

        // equip a demonhide belt and verify is_equipped returns true for katana, divine robe,
        // crown, and demonhide belt and false everything else
        adventurer.equipment.equip(demonhide_belt, ImplLoot::get_slot(demonhide_belt.id));
        assert(adventurer.equipment.is_equipped(demonhide_belt.id) == true, 'demonhide belt is equipped');
        assert(adventurer.equipment.is_equipped(crown.id) == true, 'crown should be equipped');
        assert(adventurer.equipment.is_equipped(divine_robe.id) == true, 'divine robe should be equipped');
        assert(adventurer.equipment.is_equipped(katana.id) == true, 'katana still equipped');
        assert(adventurer.equipment.is_equipped(leather_boots.id) == false, 'leather boots is not equipped');
        assert(adventurer.equipment.is_equipped(leather_gloves.id) == false, 'leather gloves is not equipped');
        assert(adventurer.equipment.is_equipped(amulet.id) == false, 'amulet is not equipped');
        assert(adventurer.equipment.is_equipped(gold_ring.id) == false, 'gold ring is not equipped');

        // equip leather boots and verify is_equipped returns true for katana, divine robe, crown,
        // demonhide belt, and leather boots and false everything else
        adventurer.equipment.equip(leather_boots, ImplLoot::get_slot(leather_boots.id));
        assert(adventurer.equipment.is_equipped(leather_boots.id) == true, 'leather boots is equipped');
        assert(adventurer.equipment.is_equipped(demonhide_belt.id) == true, 'demonhide belt is equipped');
        assert(adventurer.equipment.is_equipped(crown.id) == true, 'crown should be equipped');
        assert(adventurer.equipment.is_equipped(divine_robe.id) == true, 'divine robe should be equipped');
        assert(adventurer.equipment.is_equipped(katana.id) == true, 'katana still equipped');
        assert(adventurer.equipment.is_equipped(leather_gloves.id) == false, 'leather gloves is not equipped');
        assert(adventurer.equipment.is_equipped(amulet.id) == false, 'amulet is not equipped');
        assert(adventurer.equipment.is_equipped(gold_ring.id) == false, 'gold ring is not equipped');

        // equip leather gloves and verify is_equipped returns true for katana, divine robe, crown,
        // demonhide belt, leather boots, and leather gloves and false everything else
        adventurer.equipment.equip(leather_gloves, ImplLoot::get_slot(leather_gloves.id));
        assert(adventurer.equipment.is_equipped(leather_gloves.id) == true, 'leather gloves is equipped');
        assert(adventurer.equipment.is_equipped(leather_boots.id) == true, 'leather boots is equipped');
        assert(adventurer.equipment.is_equipped(demonhide_belt.id) == true, 'demonhide belt is equipped');
        assert(adventurer.equipment.is_equipped(crown.id) == true, 'crown should be equipped');
        assert(adventurer.equipment.is_equipped(divine_robe.id) == true, 'divine robe should be equipped');
        assert(adventurer.equipment.is_equipped(katana.id) == true, 'katana still equipped');
        assert(adventurer.equipment.is_equipped(amulet.id) == false, 'amulet is not equipped');
        assert(adventurer.equipment.is_equipped(gold_ring.id) == false, 'gold ring is not equipped');

        // equip amulet and verify is_equipped returns true for katana, divine robe, crown,
        // demonhide belt, leather boots, leather gloves, and amulet and false everything else
        adventurer.equipment.equip(amulet, ImplLoot::get_slot(amulet.id));
        assert(adventurer.equipment.is_equipped(amulet.id) == true, 'amulet is equipped');
        assert(adventurer.equipment.is_equipped(leather_gloves.id) == true, 'leather gloves is equipped');
        assert(adventurer.equipment.is_equipped(leather_boots.id) == true, 'leather boots is equipped');
        assert(adventurer.equipment.is_equipped(demonhide_belt.id) == true, 'demonhide belt is equipped');
        assert(adventurer.equipment.is_equipped(crown.id) == true, 'crown should be equipped');
        assert(adventurer.equipment.is_equipped(divine_robe.id) == true, 'divine robe should be equipped');
        assert(adventurer.equipment.is_equipped(katana.id) == true, 'katana still equipped');
        assert(adventurer.equipment.is_equipped(gold_ring.id) == false, 'gold ring is not equipped');

        // equip gold ring and verify is_equipped returns true for katana, divine robe, crown,
        // demonhide belt, leather boots, leather gloves, amulet, and gold ring and false everything
        // else
        adventurer.equipment.equip(gold_ring, ImplLoot::get_slot(gold_ring.id));
        assert(adventurer.equipment.is_equipped(gold_ring.id) == true, 'gold ring is equipped');
        assert(adventurer.equipment.is_equipped(amulet.id) == true, 'amulet is equipped');
        assert(adventurer.equipment.is_equipped(leather_gloves.id) == true, 'leather gloves is equipped');
        assert(adventurer.equipment.is_equipped(leather_boots.id) == true, 'leather boots is equipped');
        assert(adventurer.equipment.is_equipped(demonhide_belt.id) == true, 'demonhide belt is equipped');
        assert(adventurer.equipment.is_equipped(crown.id) == true, 'crown should be equipped');
        assert(adventurer.equipment.is_equipped(divine_robe.id) == true, 'divine robe should be equipped');
        assert(adventurer.equipment.is_equipped(katana.id) == true, 'katana still equipped');
    }

    #[test]
    #[available_gas(385184)]
    fn increase_item_xp_at_slot() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // assert starting conditions
        assert(adventurer.equipment.weapon.xp == 0, 'weapon should start with 0xp');
        assert(adventurer.equipment.chest.xp == 0, 'chest should start with 0xp');
        assert(adventurer.equipment.head.xp == 0, 'head should start with 0xp');
        assert(adventurer.equipment.waist.xp == 0, 'waist should start with 0xp');
        assert(adventurer.equipment.foot.xp == 0, 'foot should start with 0xp');
        assert(adventurer.equipment.hand.xp == 0, 'hand should start with 0xp');
        assert(adventurer.equipment.neck.xp == 0, 'neck should start with 0xp');
        assert(adventurer.equipment.ring.xp == 0, 'ring should start with 0xp');

        adventurer.equipment.increase_item_xp_at_slot(Slot::Weapon(()), 1);
        assert(adventurer.equipment.weapon.xp == 1, 'weapon should have 1xp');

        adventurer.equipment.increase_item_xp_at_slot(Slot::Chest(()), 1);
        assert(adventurer.equipment.chest.xp == 1, 'chest should have 1xp');

        adventurer.equipment.increase_item_xp_at_slot(Slot::Head(()), 1);
        assert(adventurer.equipment.head.xp == 1, 'head should have 1xp');

        adventurer.equipment.increase_item_xp_at_slot(Slot::Waist(()), 1);
        assert(adventurer.equipment.waist.xp == 1, 'waist should have 1xp');

        adventurer.equipment.increase_item_xp_at_slot(Slot::Foot(()), 1);
        assert(adventurer.equipment.foot.xp == 1, 'foot should have 1xp');

        adventurer.equipment.increase_item_xp_at_slot(Slot::Hand(()), 1);
        assert(adventurer.equipment.hand.xp == 1, 'hand should have 1xp');

        adventurer.equipment.increase_item_xp_at_slot(Slot::Neck(()), 1);
        assert(adventurer.equipment.neck.xp == 1, 'neck should have 1xp');

        adventurer.equipment.increase_item_xp_at_slot(Slot::Ring(()), 1);
        assert(adventurer.equipment.ring.xp == 1, 'ring should have 1xp');
    }

    #[test]
    #[available_gas(198084)]
    fn increase_item_xp_at_slot_max() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        assert(adventurer.equipment.weapon.xp == 0, 'weapon should start with 0xp');
        adventurer.equipment.increase_item_xp_at_slot(Slot::Weapon(()), 65535);
        assert(adventurer.equipment.weapon.xp == MAX_ITEM_XP, 'weapon should have max xp');
    }

    #[test]
    #[available_gas(198084)]
    fn increase_item_xp_at_slot_zero() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        assert(adventurer.equipment.weapon.xp == 0, 'weapon should start with 0xp');
        adventurer.equipment.increase_item_xp_at_slot(Slot::Weapon(()), 0);
        assert(adventurer.equipment.weapon.xp == 0, 'weapon should still have 0xp');
    }

    #[test]
    #[available_gas(1000000)]
    fn equipment_into_equipment_verbose() {
        let mut adventurer = ImplAdventurer::new(ItemId::Wand);

        // Equip some items
        let katana = Item { id: ItemId::Katana, xp: 100 };
        let divine_robe = Item { id: ItemId::DivineRobe, xp: 200 };

        adventurer.equipment.equip(katana, ImplLoot::get_slot(katana.id));
        adventurer.equipment.equip(divine_robe, ImplLoot::get_slot(divine_robe.id));

        // verify the conversion worked correctly
        let equipment_verbose: EquipmentVerbose = adventurer.equipment.into();
        assert(equipment_verbose.weapon.id == ItemId::Katana, 'weapon id mismatch');
        assert(equipment_verbose.weapon.xp == 100, 'weapon xp mismatch');
        assert(equipment_verbose.chest.id == ItemId::DivineRobe, 'chest id mismatch');
        assert(equipment_verbose.chest.xp == 200, 'chest xp mismatch');
    }

    #[test]
    #[available_gas(2000000)]
    fn test_equipment_into_equipment_verbose_empty() {
        let empty_equipment = Equipment {
            weapon: Item { id: 0, xp: 0 },
            chest: Item { id: 0, xp: 0 },
            head: Item { id: 0, xp: 0 },
            waist: Item { id: 0, xp: 0 },
            foot: Item { id: 0, xp: 0 },
            hand: Item { id: 0, xp: 0 },
            neck: Item { id: 0, xp: 0 },
            ring: Item { id: 0, xp: 0 },
        };

        let verbose_equipment: EquipmentVerbose = empty_equipment.into();

        // Weapon assertions
        assert(verbose_equipment.weapon.id == 0, 'weapon wrong id');
        assert(verbose_equipment.weapon.xp == 0, 'weapon wrong xp');
        assert(verbose_equipment.weapon.name == 0, 'weapon wrong name');
        assert(verbose_equipment.weapon.tier == Tier::None, 'weapon wrong tier');
        assert(verbose_equipment.weapon.item_type == Type::None, 'weapon wrong type');
        assert(verbose_equipment.weapon.slot == Slot::None, 'weapon wrong slot');

        // Chest assertions
        assert(verbose_equipment.chest.id == 0, 'chest wrong id');
        assert(verbose_equipment.chest.xp == 0, 'chest wrong xp');
        assert(verbose_equipment.chest.name == 0, 'chest wrong name');
        assert(verbose_equipment.chest.tier == Tier::None, 'chest wrong tier');
        assert(verbose_equipment.chest.item_type == Type::None, 'chest wrong type');
        assert(verbose_equipment.chest.slot == Slot::None, 'chest wrong slot');

        // Head assertions
        assert(verbose_equipment.head.id == 0, 'head wrong id');
        assert(verbose_equipment.head.xp == 0, 'head wrong xp');
        assert(verbose_equipment.head.name == 0, 'head wrong name');
        assert(verbose_equipment.head.tier == Tier::None, 'head wrong tier');
        assert(verbose_equipment.head.item_type == Type::None, 'head wrong type');
        assert(verbose_equipment.head.slot == Slot::None, 'head wrong slot');

        // Waist assertions
        assert(verbose_equipment.waist.id == 0, 'waist wrong id');
        assert(verbose_equipment.waist.xp == 0, 'waist wrong xp');
        assert(verbose_equipment.waist.name == 0, 'waist wrong name');
        assert(verbose_equipment.waist.tier == Tier::None, 'waist wrong tier');
        assert(verbose_equipment.waist.item_type == Type::None, 'waist wrong type');
        assert(verbose_equipment.waist.slot == Slot::None, 'waist wrong slot');

        // Foot assertions
        assert(verbose_equipment.foot.id == 0, 'foot wrong id');
        assert(verbose_equipment.foot.xp == 0, 'foot wrong xp');
        assert(verbose_equipment.foot.name == 0, 'foot wrong name');
        assert(verbose_equipment.foot.tier == Tier::None, 'foot wrong tier');
        assert(verbose_equipment.foot.item_type == Type::None, 'foot wrong type');
        assert(verbose_equipment.foot.slot == Slot::None, 'foot wrong slot');

        // Hand assertions
        assert(verbose_equipment.hand.id == 0, 'hand wrong id');
        assert(verbose_equipment.hand.xp == 0, 'hand wrong xp');
        assert(verbose_equipment.hand.name == 0, 'hand wrong name');
        assert(verbose_equipment.hand.tier == Tier::None, 'hand wrong tier');
        assert(verbose_equipment.hand.item_type == Type::None, 'hand wrong type');
        assert(verbose_equipment.hand.slot == Slot::None, 'hand wrong slot');

        // Neck assertions
        assert(verbose_equipment.neck.id == 0, 'neck wrong id');
        assert(verbose_equipment.neck.xp == 0, 'neck wrong xp');
        assert(verbose_equipment.neck.name == 0, 'neck wrong name');
        assert(verbose_equipment.neck.tier == Tier::None, 'neck wrong tier');
        assert(verbose_equipment.neck.item_type == Type::None, 'neck wrong type');
        assert(verbose_equipment.neck.slot == Slot::None, 'neck wrong slot');

        // Ring assertions
        assert(verbose_equipment.ring.id == 0, 'ring wrong id');
        assert(verbose_equipment.ring.xp == 0, 'ring wrong xp');
        assert(verbose_equipment.ring.name == 0, 'ring wrong name');
        assert(verbose_equipment.ring.tier == Tier::None, 'ring wrong tier');
        assert(verbose_equipment.ring.item_type == Type::None, 'ring wrong type');
        assert(verbose_equipment.ring.slot == Slot::None, 'ring wrong slot');
    }

    #[test]
    #[available_gas(3000000)]
    fn test_equipment_into_equipment_verbose_full() {
        let full_equipment = Equipment {
            weapon: Item { id: ItemId::Katana, xp: 100 },
            chest: Item { id: ItemId::DivineRobe, xp: 200 },
            head: Item { id: ItemId::DemonCrown, xp: 300 },
            waist: Item { id: ItemId::DemonhideBelt, xp: 400 },
            foot: Item { id: ItemId::DivineSlippers, xp: 150 },
            hand: Item { id: ItemId::DivineGloves, xp: 250 },
            neck: Item { id: ItemId::Amulet, xp: 350 },
            ring: Item { id: ItemId::PlatinumRing, xp: 450 },
        };

        let verbose_equipment: EquipmentVerbose = full_equipment.into();

        // Weapon assertions
        assert(verbose_equipment.weapon.id == ItemId::Katana, 'weapon wrong id');
        assert(verbose_equipment.weapon.xp == 100, 'weapon wrong xp');
        assert(verbose_equipment.weapon.name == 'Katana', 'weapon wrong name');
        assert(verbose_equipment.weapon.tier == Tier::T1, 'weapon wrong tier');
        assert(verbose_equipment.weapon.item_type == Type::Blade_or_Hide, 'weapon wrong type');
        assert(verbose_equipment.weapon.slot == Slot::Weapon, 'weapon wrong slot');

        // Chest assertions
        assert(verbose_equipment.chest.id == ItemId::DivineRobe, 'chest wrong id');
        assert(verbose_equipment.chest.xp == 200, 'chest wrong xp');
        assert(verbose_equipment.chest.name == 'Divine Robe', 'chest wrong name');
        assert(verbose_equipment.chest.tier == Tier::T1, 'chest wrong tier');
        assert(verbose_equipment.chest.item_type == Type::Magic_or_Cloth, 'chest wrong type');
        assert(verbose_equipment.chest.slot == Slot::Chest, 'chest wrong slot');

        // Head assertions
        assert(verbose_equipment.head.id == ItemId::DemonCrown, 'head wrong id');
        assert(verbose_equipment.head.xp == 300, 'head wrong xp');
        assert(verbose_equipment.head.name == 'Demon Crown', 'head wrong name');
        assert(verbose_equipment.head.tier == Tier::T1, 'head wrong tier');
        assert(verbose_equipment.head.item_type == Type::Blade_or_Hide, 'head wrong type');
        assert(verbose_equipment.head.slot == Slot::Head, 'head wrong slot');

        // Waist assertions
        assert(verbose_equipment.waist.id == ItemId::DemonhideBelt, 'waist wrong id');
        assert(verbose_equipment.waist.xp == 400, 'waist wrong xp');
        assert(verbose_equipment.waist.name == 'Demonhide Belt', 'waist wrong name');
        assert(verbose_equipment.waist.tier == Tier::T1, 'waist wrong tier');
        assert(verbose_equipment.waist.item_type == Type::Blade_or_Hide, 'waist wrong type');
        assert(verbose_equipment.waist.slot == Slot::Waist, 'waist wrong slot');

        // Foot assertions
        assert(verbose_equipment.foot.id == ItemId::DivineSlippers, 'foot wrong id');
        assert(verbose_equipment.foot.xp == 150, 'foot wrong xp');
        assert(verbose_equipment.foot.name == 'Divine Slippers', 'foot wrong name');
        assert(verbose_equipment.foot.tier == Tier::T1, 'foot wrong tier');
        assert(verbose_equipment.foot.item_type == Type::Magic_or_Cloth, 'foot wrong type');
        assert(verbose_equipment.foot.slot == Slot::Foot, 'foot wrong slot');

        // Hand assertions
        assert(verbose_equipment.hand.id == ItemId::DivineGloves, 'hand wrong id');
        assert(verbose_equipment.hand.xp == 250, 'hand wrong xp');
        assert(verbose_equipment.hand.name == 'Divine Gloves', 'hand wrong name');
        assert(verbose_equipment.hand.tier == Tier::T1, 'hand wrong tier');
        assert(verbose_equipment.hand.item_type == Type::Magic_or_Cloth, 'hand wrong type');
        assert(verbose_equipment.hand.slot == Slot::Hand, 'hand wrong slot');

        // Neck assertions
        assert(verbose_equipment.neck.id == ItemId::Amulet, 'neck wrong id');
        assert(verbose_equipment.neck.xp == 350, 'neck wrong xp');
        assert(verbose_equipment.neck.name == 'Amulet', 'neck wrong name');
        assert(verbose_equipment.neck.tier == Tier::T1, 'neck wrong tier');
        assert(verbose_equipment.neck.item_type == Type::Necklace, 'neck wrong type');
        assert(verbose_equipment.neck.slot == Slot::Neck, 'neck wrong slot');

        // Ring assertions
        assert(verbose_equipment.ring.id == ItemId::PlatinumRing, 'ring wrong id');
        assert(verbose_equipment.ring.xp == 450, 'ring wrong xp');
        assert(verbose_equipment.ring.name == 'Platinum Ring', 'ring wrong name');
        assert(verbose_equipment.ring.tier == Tier::T1, 'ring wrong tier');
        assert(verbose_equipment.ring.item_type == Type::Ring, 'ring wrong type');
        assert(verbose_equipment.ring.slot == Slot::Ring, 'ring wrong slot');
    }

    #[test]
    #[available_gas(2500000)]
    fn test_equipment_into_equipment_verbose_partial() {
        let partial_equipment = Equipment {
            weapon: Item { id: ItemId::Wand, xp: 10 },
            chest: Item { id: 0, xp: 0 },
            head: Item { id: ItemId::Crown, xp: 20 },
            waist: Item { id: 0, xp: 0 },
            foot: Item { id: ItemId::LeatherBoots, xp: 30 },
            hand: Item { id: 0, xp: 0 },
            neck: Item { id: ItemId::Pendant, xp: 40 },
            ring: Item { id: ItemId::GoldRing, xp: 50 },
        };

        let verbose_equipment: EquipmentVerbose = partial_equipment.into();

        // Weapon assertions
        assert(verbose_equipment.weapon.id == ItemId::Wand, 'weapon wrong id');
        assert(verbose_equipment.weapon.xp == 10, 'weapon wrong xp');
        assert(verbose_equipment.weapon.name == 'Wand', 'weapon wrong name');
        assert(verbose_equipment.weapon.tier == Tier::T5, 'weapon wrong tier');
        assert(verbose_equipment.weapon.item_type == Type::Magic_or_Cloth, 'weapon wrong type');
        assert(verbose_equipment.weapon.slot == Slot::Weapon, 'weapon wrong slot');

        // Chest assertions (empty)
        assert(verbose_equipment.chest.id == 0, 'chest wrong id');
        assert(verbose_equipment.chest.xp == 0, 'chest wrong xp');
        assert(verbose_equipment.chest.name == 0, 'chest wrong name');
        assert(verbose_equipment.chest.tier == Tier::None, 'chest wrong tier');
        assert(verbose_equipment.chest.item_type == Type::None, 'chest wrong type');
        assert(verbose_equipment.chest.slot == Slot::None, 'chest wrong slot');

        // Head assertions
        assert(verbose_equipment.head.id == ItemId::Crown, 'head wrong id');
        assert(verbose_equipment.head.xp == 20, 'head wrong xp');
        assert(verbose_equipment.head.name == 'Crown', 'head wrong name');
        assert(verbose_equipment.head.tier == Tier::T1, 'head wrong tier');
        assert(verbose_equipment.head.item_type == Type::Magic_or_Cloth, 'head wrong type');
        assert(verbose_equipment.head.slot == Slot::Head, 'head wrong slot');

        // Waist assertions (empty)
        assert(verbose_equipment.waist.id == 0, 'waist wrong id');
        assert(verbose_equipment.waist.xp == 0, 'waist wrong xp');
        assert(verbose_equipment.waist.name == 0, 'waist wrong name');
        assert(verbose_equipment.waist.tier == Tier::None, 'waist wrong tier');
        assert(verbose_equipment.waist.item_type == Type::None, 'waist wrong type');
        assert(verbose_equipment.waist.slot == Slot::None, 'waist wrong slot');

        // Foot assertions
        assert(verbose_equipment.foot.id == ItemId::LeatherBoots, 'foot wrong id');
        assert(verbose_equipment.foot.xp == 30, 'foot wrong xp');
        assert(verbose_equipment.foot.name == 'Leather Boots', 'foot wrong name');
        assert(verbose_equipment.foot.tier == Tier::T5, 'foot wrong tier');
        assert(verbose_equipment.foot.item_type == Type::Blade_or_Hide, 'foot wrong type');
        assert(verbose_equipment.foot.slot == Slot::Foot, 'foot wrong slot');

        // Hand assertions (empty)
        assert(verbose_equipment.hand.id == 0, 'hand wrong id');
        assert(verbose_equipment.hand.xp == 0, 'hand wrong xp');
        assert(verbose_equipment.hand.name == 0, 'hand wrong name');
        assert(verbose_equipment.hand.tier == Tier::None, 'hand wrong tier');
        assert(verbose_equipment.hand.item_type == Type::None, 'hand wrong type');
        assert(verbose_equipment.hand.slot == Slot::None, 'hand wrong slot');

        // Neck assertions
        assert(verbose_equipment.neck.id == ItemId::Pendant, 'neck wrong id');
        assert(verbose_equipment.neck.xp == 40, 'neck wrong xp');
        assert(verbose_equipment.neck.name == 'Pendant', 'neck wrong name');
        assert(verbose_equipment.neck.tier == Tier::T1, 'neck wrong tier');
        assert(verbose_equipment.neck.item_type == Type::Necklace, 'neck wrong type');
        assert(verbose_equipment.neck.slot == Slot::Neck, 'neck wrong slot');

        // Ring assertions
        assert(verbose_equipment.ring.id == ItemId::GoldRing, 'ring wrong id');
        assert(verbose_equipment.ring.xp == 50, 'ring wrong xp');
        assert(verbose_equipment.ring.name == 'Gold Ring', 'ring wrong name');
        assert(verbose_equipment.ring.tier == Tier::T1, 'ring wrong tier');
        assert(verbose_equipment.ring.item_type == Type::Ring, 'ring wrong type');
        assert(verbose_equipment.ring.slot == Slot::Ring, 'ring wrong slot');
    }

    #[test]
    #[available_gas(2000000)]
    fn test_equipment_into_equipment_verbose_max_xp() {
        let max_xp_equipment = Equipment {
            weapon: Item { id: ItemId::Katana, xp: MAX_PACKABLE_XP },
            chest: Item { id: ItemId::DivineRobe, xp: MAX_PACKABLE_XP },
            head: Item { id: ItemId::Crown, xp: MAX_PACKABLE_XP },
            waist: Item { id: ItemId::BrightsilkSash, xp: MAX_PACKABLE_XP },
            foot: Item { id: ItemId::SilkSlippers, xp: MAX_PACKABLE_XP },
            hand: Item { id: ItemId::SilkGloves, xp: MAX_PACKABLE_XP },
            neck: Item { id: ItemId::Amulet, xp: MAX_PACKABLE_XP },
            ring: Item { id: ItemId::SilverRing, xp: MAX_PACKABLE_XP },
        };

        let verbose_equipment: EquipmentVerbose = max_xp_equipment.into();

        // Verify all items maintain their max XP value after conversion
        assert(verbose_equipment.weapon.xp == MAX_PACKABLE_XP, 'weapon xp not max');
        assert(verbose_equipment.chest.xp == MAX_PACKABLE_XP, 'chest xp not max');
        assert(verbose_equipment.head.xp == MAX_PACKABLE_XP, 'head xp not max');
        assert(verbose_equipment.waist.xp == MAX_PACKABLE_XP, 'waist xp not max');
        assert(verbose_equipment.foot.xp == MAX_PACKABLE_XP, 'foot xp not max');
        assert(verbose_equipment.hand.xp == MAX_PACKABLE_XP, 'hand xp not max');
        assert(verbose_equipment.neck.xp == MAX_PACKABLE_XP, 'neck xp not max');
        assert(verbose_equipment.ring.xp == MAX_PACKABLE_XP, 'ring xp not max');

        // Verify IDs are preserved
        assert(verbose_equipment.weapon.id == ItemId::Katana, 'weapon id wrong');
        assert(verbose_equipment.chest.id == ItemId::DivineRobe, 'chest id wrong');
        assert(verbose_equipment.head.id == ItemId::Crown, 'head id wrong');
        assert(verbose_equipment.waist.id == ItemId::BrightsilkSash, 'waist id wrong');
        assert(verbose_equipment.foot.id == ItemId::SilkSlippers, 'foot id wrong');
        assert(verbose_equipment.hand.id == ItemId::SilkGloves, 'hand id wrong');
        assert(verbose_equipment.neck.id == ItemId::Amulet, 'neck id wrong');
        assert(verbose_equipment.ring.id == ItemId::SilverRing, 'ring id wrong');
    }

    #[test]
    #[available_gas(2000000)]
    fn test_equipment_into_equipment_verbose_mixed_tiers() {
        // Test with items from different tiers
        let mixed_equipment = Equipment {
            weapon: Item { id: ItemId::Katana, xp: 100 }, // T1
            chest: Item { id: ItemId::SilkRobe, xp: 200 }, // T2
            head: Item { id: ItemId::LinenHood, xp: 300 }, // T4
            waist: Item { id: ItemId::WoolSash, xp: 400 }, // T3
            foot: Item { id: ItemId::DivineSlippers, xp: 500 }, // T1
            hand: Item { id: ItemId::SilkGloves, xp: 50 }, // T2
            neck: Item { id: ItemId::Amulet, xp: 150 }, // T1
            ring: Item { id: ItemId::BronzeRing, xp: 250 } // T3
        };

        let verbose_equipment: EquipmentVerbose = mixed_equipment.into();

        // Verify tier assignments
        assert(verbose_equipment.weapon.tier == Tier::T1, 'weapon tier wrong');
        assert(verbose_equipment.chest.tier == Tier::T2, 'chest tier wrong');
        assert(verbose_equipment.head.tier == Tier::T4, 'head tier wrong');
        assert(verbose_equipment.waist.tier == Tier::T3, 'waist tier wrong');
        assert(verbose_equipment.foot.tier == Tier::T1, 'foot tier wrong');
        assert(verbose_equipment.hand.tier == Tier::T2, 'hand tier wrong');
        assert(verbose_equipment.neck.tier == Tier::T1, 'neck tier wrong');
        assert(verbose_equipment.ring.tier == Tier::T3, 'ring tier wrong');

        // Verify XP values are preserved
        assert(verbose_equipment.weapon.xp == 100, 'weapon xp wrong');
        assert(verbose_equipment.chest.xp == 200, 'chest xp wrong');
        assert(verbose_equipment.head.xp == 300, 'head xp wrong');
        assert(verbose_equipment.waist.xp == 400, 'waist xp wrong');
        assert(verbose_equipment.foot.xp == 500, 'foot xp wrong');
        assert(verbose_equipment.hand.xp == 50, 'hand xp wrong');
        assert(verbose_equipment.neck.xp == 150, 'neck xp wrong');
        assert(verbose_equipment.ring.xp == 250, 'ring xp wrong');
    }
}
