// SPDX-License-Identifier: BUSL-1.1

use core::num::traits::Sqrt;
use core::traits::DivRem;
use death_mountain::constants::loot::ItemId;

#[derive(Introspect, Drop, Copy, PartialEq, Serde)]
// 21 bits in storage
pub struct Item {
    // 7 bits
    pub id: u8,
    // 9 bits
    pub xp: u16,
}


#[generate_trait]
pub impl ImplItem of IItemPrimitive {
    /// @notice creates a new Item with the given id
    /// @param item_id the id of the item
    /// @return the new Item
    fn new(item_id: u8) -> Item {
        Item { id: item_id, xp: 0 }
    }

    /// @notice Packs an Item into a felt252
    /// @param self: The Item to pack
    /// @return felt252: The packed Item
    fn pack(self: Item) -> felt252 {
        assert(self.id <= MAX_PACKABLE_ITEM_ID, 'item id pack overflow');
        assert(self.xp <= MAX_PACKABLE_XP, 'item xp pack overflow');
        (self.id.into() + self.xp.into() * TWO_POW_7).try_into().unwrap()
    }

    /// @notice Unpacks a felt252 into an Item
    /// @param value: The felt252 to unpack
    /// @return Item: The unpacked Item
    fn unpack(value: felt252) -> Item {
        let packed = value.into();
        let (packed, id) = DivRem::div_rem(packed, TWO_POW_7_Z);
        let (_, xp) = DivRem::div_rem(packed, TWO_POW_9_Z);

        Item { id: id.try_into().unwrap(), xp: xp.try_into().unwrap() }
    }

    /// @notice checks if the item is a jewelery
    /// @param self the Item to check
    /// @return bool: true if the item is a jewelery, false otherwise
    fn is_jewlery(self: Item) -> bool {
        if (self.id == ItemId::BronzeRing) {
            true
        } else if (self.id == ItemId::SilverRing) {
            true
        } else if (self.id == ItemId::GoldRing) {
            true
        } else if (self.id == ItemId::PlatinumRing) {
            true
        } else if (self.id == ItemId::TitaniumRing) {
            true
        } else if (self.id == ItemId::Necklace) {
            true
        } else if (self.id == ItemId::Amulet) {
            true
        } else if (self.id == ItemId::Pendant) {
            true
        } else {
            false
        }
    }

    /// @notice increases the xp of an item
    /// @param item: the Item to increase the xp of
    /// @param amount: the amount to increase the xp by
    /// @return (u8, u8): the previous level and the new level

    fn increase_xp(ref item: Item, amount: u16) -> (u8, u8) {
        let previous_level = item.get_greatness();
        let new_xp = item.xp + amount;
        if (new_xp > MAX_ITEM_XP) {
            item.xp = MAX_ITEM_XP;
        } else {
            item.xp = new_xp;
        }

        let new_level = item.get_greatness();
        (previous_level, new_level)
    }

    /// @notice gets the greatness of an item
    /// @param self the Item to get the greatness of
    /// @return u8: the greatness of the item

    fn get_greatness(self: Item) -> u8 {
        if self.xp == 0 {
            1
        } else {
            let level = self.xp.sqrt();
            if (level > MAX_GREATNESS) {
                MAX_GREATNESS
            } else {
                level
            }
        }
    }
}

const TWO_POW_7: u256 = 0x80;
const TWO_POW_7_Z: NonZero<u256> = 0x80;
const TWO_POW_9_Z: NonZero<u256> = 0x200;
const MAX_GREATNESS: u8 = 20;
pub const MAX_PACKABLE_ITEM_ID: u8 = 127;
pub const MAX_PACKABLE_XP: u16 = 511;
pub const MAX_ITEM_XP: u16 = 400;
