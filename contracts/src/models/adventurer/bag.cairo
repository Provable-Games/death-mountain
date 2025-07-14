// SPDX-License-Identifier: BUSL-1.1

use core::panic_with_felt252;
use core::traits::DivRem;
use death_mountain::constants::loot::SUFFIX_UNLOCK_GREATNESS;
use death_mountain::models::adventurer::item::{IItemPrimitive, ImplItem, Item};
use death_mountain::models::adventurer::stats::{ImplStats, Stats};
use death_mountain::models::loot::ImplLoot;

// Bag is used for storing gear not equipped to the adventurer
// Bag is a fixed at 15 items to fit in a felt252
#[derive(Introspect, Drop, Copy, Serde)]
pub struct Bag { // 240 bits
    pub item_1: Item, // 16 bits each
    pub item_2: Item,
    pub item_3: Item,
    pub item_4: Item,
    pub item_5: Item,
    pub item_6: Item,
    pub item_7: Item,
    pub item_8: Item,
    pub item_9: Item,
    pub item_10: Item,
    pub item_11: Item,
    pub item_12: Item,
    pub item_13: Item,
    pub item_14: Item,
    pub item_15: Item,
    pub mutated: bool,
}

#[generate_trait]
pub impl ImplBag of IBag {
    // @notice Creates a new instance of the Bag
    // @return The instance of the Bag
    fn new() -> Bag {
        Bag {
            item_1: Item { id: 0, xp: 0 },
            item_2: Item { id: 0, xp: 0 },
            item_3: Item { id: 0, xp: 0 },
            item_4: Item { id: 0, xp: 0 },
            item_5: Item { id: 0, xp: 0 },
            item_6: Item { id: 0, xp: 0 },
            item_7: Item { id: 0, xp: 0 },
            item_8: Item { id: 0, xp: 0 },
            item_9: Item { id: 0, xp: 0 },
            item_10: Item { id: 0, xp: 0 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        }
    }

    fn pack(bag: Bag) -> felt252 {
        (bag.item_1.pack().into()
            + bag.item_2.pack().into() * TWO_POW_16
            + bag.item_3.pack().into() * TWO_POW_32
            + bag.item_4.pack().into() * TWO_POW_48
            + bag.item_5.pack().into() * TWO_POW_64
            + bag.item_6.pack().into() * TWO_POW_80
            + bag.item_7.pack().into() * TWO_POW_96
            + bag.item_8.pack().into() * TWO_POW_112
            + bag.item_9.pack().into() * TWO_POW_128
            + bag.item_10.pack().into() * TWO_POW_144
            + bag.item_11.pack().into() * TWO_POW_160
            + bag.item_12.pack().into() * TWO_POW_176
            + bag.item_13.pack().into() * TWO_POW_192
            + bag.item_14.pack().into() * TWO_POW_208
            + bag.item_15.pack().into() * TWO_POW_224)
            .try_into()
            .unwrap()
    }

    fn unpack(value: felt252) -> Bag {
        let packed = value.into();
        let (packed, item_1) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_2) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_3) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_4) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_5) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_6) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_7) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_8) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_9) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_10) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_11) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_12) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_13) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (packed, item_14) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());
        let (_, item_15) = DivRem::div_rem(packed, TWO_POW_16.try_into().unwrap());

        Bag {
            item_1: ImplItem::unpack(item_1.try_into().unwrap()),
            item_2: ImplItem::unpack(item_2.try_into().unwrap()),
            item_3: ImplItem::unpack(item_3.try_into().unwrap()),
            item_4: ImplItem::unpack(item_4.try_into().unwrap()),
            item_5: ImplItem::unpack(item_5.try_into().unwrap()),
            item_6: ImplItem::unpack(item_6.try_into().unwrap()),
            item_7: ImplItem::unpack(item_7.try_into().unwrap()),
            item_8: ImplItem::unpack(item_8.try_into().unwrap()),
            item_9: ImplItem::unpack(item_9.try_into().unwrap()),
            item_10: ImplItem::unpack(item_10.try_into().unwrap()),
            item_11: ImplItem::unpack(item_11.try_into().unwrap()),
            item_12: ImplItem::unpack(item_12.try_into().unwrap()),
            item_13: ImplItem::unpack(item_13.try_into().unwrap()),
            item_14: ImplItem::unpack(item_14.try_into().unwrap()),
            item_15: ImplItem::unpack(item_15.try_into().unwrap()),
            mutated: false,
        }
    }

    // @notice Retrieves an item from the bag by its id
    // @dev If the item with the specified id is not in the bag, it throws an error
    // @param self The instance of the Bag
    // @param item_id The id of the item to be retrieved
    // @return The item from the bag with the specified id
    fn get_item(bag: Bag, item_id: u8) -> Item {
        if bag.item_1.id == item_id {
            bag.item_1
        } else if bag.item_2.id == item_id {
            bag.item_2
        } else if bag.item_3.id == item_id {
            bag.item_3
        } else if bag.item_4.id == item_id {
            bag.item_4
        } else if bag.item_5.id == item_id {
            bag.item_5
        } else if bag.item_6.id == item_id {
            bag.item_6
        } else if bag.item_7.id == item_id {
            bag.item_7
        } else if bag.item_8.id == item_id {
            bag.item_8
        } else if bag.item_9.id == item_id {
            bag.item_9
        } else if bag.item_10.id == item_id {
            bag.item_10
        } else if bag.item_11.id == item_id {
            bag.item_11
        } else if bag.item_12.id == item_id {
            bag.item_12
        } else if bag.item_13.id == item_id {
            bag.item_13
        } else if bag.item_14.id == item_id {
            bag.item_14
        } else if bag.item_15.id == item_id {
            bag.item_15
        } else {
            panic_with_felt252('Item not in bag')
        }
    }

    // @notice Adds a new item to the bag
    // @param self The instance of the Bag
    // @param item_id The id of the item to be added
    fn add_new_item(ref bag: Bag, item_id: u8) {
        let mut item = ImplItem::new(item_id);
        Self::add_item(ref bag, item);
    }

    // @notice Adds an item to the bag
    // @dev If the bag is full, it throws an error
    // @param self The instance of the Bag
    // @param item The item to be added to the bag

    fn add_item(ref bag: Bag, item: Item) {
        // assert item id is not 0
        assert(item.id != 0, 'Item ID cannot be 0');

        // add item to next available slot
        if bag.item_1.id == 0 {
            bag.item_1 = item;
        } else if bag.item_2.id == 0 {
            bag.item_2 = item;
        } else if bag.item_3.id == 0 {
            bag.item_3 = item;
        } else if bag.item_4.id == 0 {
            bag.item_4 = item;
        } else if bag.item_5.id == 0 {
            bag.item_5 = item;
        } else if bag.item_6.id == 0 {
            bag.item_6 = item;
        } else if bag.item_7.id == 0 {
            bag.item_7 = item;
        } else if bag.item_8.id == 0 {
            bag.item_8 = item;
        } else if bag.item_9.id == 0 {
            bag.item_9 = item;
        } else if bag.item_10.id == 0 {
            bag.item_10 = item;
        } else if bag.item_11.id == 0 {
            bag.item_11 = item;
        } else if bag.item_12.id == 0 {
            bag.item_12 = item;
        } else if bag.item_13.id == 0 {
            bag.item_13 = item;
        } else if bag.item_14.id == 0 {
            bag.item_14 = item;
        } else if bag.item_15.id == 0 {
            bag.item_15 = item;
        } else {
            panic_with_felt252('Bag is full')
        }

        // flag bag as being mutated
        bag.mutated = true;
    }

    // @notice Removes an item from the bag by its id
    // @param self The instance of the Bag
    // @param item_id The id of the item to be removed
    // @return The item that was removed from the bag

    fn remove_item(ref bag: Bag, item_id: u8) -> Item {
        let removed_item = Self::get_item(bag, item_id);

        if bag.item_1.id == item_id {
            bag.item_1.id = 0;
            bag.item_1.xp = 0;
        } else if bag.item_2.id == item_id {
            bag.item_2.id = 0;
            bag.item_2.xp = 0;
        } else if bag.item_3.id == item_id {
            bag.item_3.id = 0;
            bag.item_3.xp = 0;
        } else if bag.item_4.id == item_id {
            bag.item_4.id = 0;
            bag.item_4.xp = 0;
        } else if bag.item_5.id == item_id {
            bag.item_5.id = 0;
            bag.item_5.xp = 0;
        } else if bag.item_6.id == item_id {
            bag.item_6.id = 0;
            bag.item_6.xp = 0;
        } else if bag.item_7.id == item_id {
            bag.item_7.id = 0;
            bag.item_7.xp = 0;
        } else if bag.item_8.id == item_id {
            bag.item_8.id = 0;
            bag.item_8.xp = 0;
        } else if bag.item_9.id == item_id {
            bag.item_9.id = 0;
            bag.item_9.xp = 0;
        } else if bag.item_10.id == item_id {
            bag.item_10.id = 0;
            bag.item_10.xp = 0;
        } else if bag.item_11.id == item_id {
            bag.item_11.id = 0;
            bag.item_11.xp = 0;
        } else if bag.item_12.id == item_id {
            bag.item_12.id = 0;
            bag.item_12.xp = 0;
        } else if bag.item_13.id == item_id {
            bag.item_13.id = 0;
            bag.item_13.xp = 0;
        } else if bag.item_14.id == item_id {
            bag.item_14.id = 0;
            bag.item_14.xp = 0;
        } else if bag.item_15.id == item_id {
            bag.item_15.id = 0;
            bag.item_15.xp = 0;
        } else {
            panic_with_felt252('item not in bag')
        }

        // flag bag as being mutated
        bag.mutated = true;

        // return the removed item
        removed_item
    }

    // @notice Checks if the bag is full
    // @dev A bag is considered full if all item slots are occupied (id of the item is non-zero)
    // @param self The instance of the Bag
    // @return A boolean value indicating whether the bag is full
    fn is_full(bag: Bag) -> bool {
        if bag.item_1.id == 0 {
            false
        } else if bag.item_2.id == 0 {
            false
        } else if bag.item_3.id == 0 {
            false
        } else if bag.item_4.id == 0 {
            false
        } else if bag.item_5.id == 0 {
            false
        } else if bag.item_6.id == 0 {
            false
        } else if bag.item_7.id == 0 {
            false
        } else if bag.item_8.id == 0 {
            false
        } else if bag.item_9.id == 0 {
            false
        } else if bag.item_10.id == 0 {
            false
        } else if bag.item_11.id == 0 {
            false
        } else if bag.item_12.id == 0 {
            false
        } else if bag.item_13.id == 0 {
            false
        } else if bag.item_14.id == 0 {
            false
        } else if bag.item_15.id == 0 {
            false
        } else {
            // if the id of all item slots is non-zero
            // bag is full, return true
            true
        }
    }

    // @notice Checks if a specific item exists in the bag
    // @param self The Bag object in which to search for the item
    // @param item The id of the item to search for
    // @return A bool indicating whether the item is present in the bag
    fn contains(bag: Bag, item_id: u8) -> (bool, Item) {
        assert(item_id != 0, 'Item ID cannot be 0');
        if bag.item_1.id == item_id {
            return (true, bag.item_1);
        } else if bag.item_2.id == item_id {
            return (true, bag.item_2);
        } else if bag.item_3.id == item_id {
            return (true, bag.item_3);
        } else if bag.item_4.id == item_id {
            return (true, bag.item_4);
        } else if bag.item_5.id == item_id {
            return (true, bag.item_5);
        } else if bag.item_6.id == item_id {
            return (true, bag.item_6);
        } else if bag.item_7.id == item_id {
            return (true, bag.item_7);
        } else if bag.item_8.id == item_id {
            return (true, bag.item_8);
        } else if bag.item_9.id == item_id {
            return (true, bag.item_9);
        } else if bag.item_10.id == item_id {
            return (true, bag.item_10);
        } else if bag.item_11.id == item_id {
            return (true, bag.item_11);
        } else if bag.item_12.id == item_id {
            return (true, bag.item_12);
        } else if bag.item_13.id == item_id {
            return (true, bag.item_13);
        } else if bag.item_14.id == item_id {
            return (true, bag.item_14);
        } else if bag.item_15.id == item_id {
            return (true, bag.item_15);
        } else {
            return (false, Item { id: 0, xp: 0 });
        }
    }

    // @notice Gets all the jewelry items in the bag
    // @param self The instance of the Bag
    // @return An array of all the jewelry items in the bag
    fn get_jewelry(bag: Bag) -> Array<Item> {
        let mut jewlery = ArrayTrait::<Item>::new();
        if ImplItem::is_jewlery(bag.item_1) {
            jewlery.append(bag.item_1);
        }
        if ImplItem::is_jewlery(bag.item_2) {
            jewlery.append(bag.item_2);
        }
        if ImplItem::is_jewlery(bag.item_3) {
            jewlery.append(bag.item_3);
        }
        if ImplItem::is_jewlery(bag.item_4) {
            jewlery.append(bag.item_4);
        }
        if ImplItem::is_jewlery(bag.item_5) {
            jewlery.append(bag.item_5);
        }
        if ImplItem::is_jewlery(bag.item_6) {
            jewlery.append(bag.item_6);
        }
        if ImplItem::is_jewlery(bag.item_7) {
            jewlery.append(bag.item_7);
        }
        if ImplItem::is_jewlery(bag.item_8) {
            jewlery.append(bag.item_8);
        }
        if ImplItem::is_jewlery(bag.item_9) {
            jewlery.append(bag.item_9);
        }
        if ImplItem::is_jewlery(bag.item_10) {
            jewlery.append(bag.item_10);
        }
        if ImplItem::is_jewlery(bag.item_11) {
            jewlery.append(bag.item_11);
        }
        if ImplItem::is_jewlery(bag.item_12) {
            jewlery.append(bag.item_12);
        }
        if ImplItem::is_jewlery(bag.item_13) {
            jewlery.append(bag.item_13);
        }
        if ImplItem::is_jewlery(bag.item_14) {
            jewlery.append(bag.item_14);
        }
        if ImplItem::is_jewlery(bag.item_15) {
            jewlery.append(bag.item_15);
        }
        jewlery
    }

    // @notice Gets the total greatness of all jewelry items in the bag
    // @param self The instance of the Bag
    // @return The total greatness of all jewelry items in the bag
    fn get_jewelry_greatness(self: Bag) -> u8 {
        let jewelry_items = Self::get_jewelry(self);
        let mut total_greatness = 0;
        let mut item_index = 0;
        loop {
            if item_index == jewelry_items.len() {
                break;
            }
            let jewelry_item = *jewelry_items.at(item_index);
            total_greatness += jewelry_item.get_greatness();
            item_index += 1;
        };

        total_greatness
    }

    // @notice checks if the bag has any items with specials.
    // @param self The Bag to check for specials.
    // @return Returns true if bag has specials, false otherwise.
    fn has_specials(self: Bag) -> bool {
        if (self.item_1.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_2.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_3.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_4.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_5.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_6.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_7.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_8.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_9.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_10.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_11.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_12.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_13.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_14.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else if (self.item_15.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            true
        } else {
            false
        }
    }

    /// @notice Gets stat boosts based on item specials
    /// @param self: The Bag to get stat boosts for
    /// @param specials_seed: The seed to use for generating item specials
    /// @return Stats: The stat boosts for the bag
    fn get_stat_boosts(self: Bag, specials_seed: u16) -> Stats {
        let mut stats = Stats {
            strength: 0, dexterity: 0, vitality: 0, charisma: 0, intelligence: 0, wisdom: 0, luck: 0,
        };

        if (self.item_1.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_1.id, specials_seed));
        }
        if (self.item_2.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_2.id, specials_seed));
        }
        if (self.item_3.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_3.id, specials_seed));
        }
        if (self.item_4.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_4.id, specials_seed));
        }
        if (self.item_5.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_5.id, specials_seed));
        }
        if (self.item_6.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_6.id, specials_seed));
        }
        if (self.item_7.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_7.id, specials_seed));
        }
        if (self.item_8.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_8.id, specials_seed));
        }
        if (self.item_9.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_9.id, specials_seed));
        }
        if (self.item_10.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_10.id, specials_seed));
        }
        if (self.item_11.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_11.id, specials_seed));
        }
        if (self.item_12.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_12.id, specials_seed));
        }
        if (self.item_13.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_13.id, specials_seed));
        }
        if (self.item_14.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_14.id, specials_seed));
        }
        if (self.item_15.get_greatness() >= SUFFIX_UNLOCK_GREATNESS) {
            stats.apply_bag_boost(ImplLoot::get_suffix(self.item_15.id, specials_seed));
        }
        stats
    }
}
const TWO_POW_21: u256 = 0x200000;
const TWO_POW_16: u256 = 0x10000;
const TWO_POW_32: u256 = 0x100000000;
const TWO_POW_48: u256 = 0x1000000000000;
const TWO_POW_64: u256 = 0x10000000000000000;
const TWO_POW_80: u256 = 0x100000000000000000000;
const TWO_POW_96: u256 = 0x1000000000000000000000000;
const TWO_POW_112: u256 = 0x10000000000000000000000000000;
const TWO_POW_128: u256 = 0x100000000000000000000000000000000;
const TWO_POW_144: u256 = 0x1000000000000000000000000000000000000;
const TWO_POW_160: u256 = 0x10000000000000000000000000000000000000000;
const TWO_POW_176: u256 = 0x100000000000000000000000000000000000000000000;
const TWO_POW_192: u256 = 0x1000000000000000000000000000000000000000000000000;
const TWO_POW_208: u256 = 0x10000000000000000000000000000000000000000000000000000;
const TWO_POW_224: u256 = 0x100000000000000000000000000000000000000000000000000000000;
const TWO_POW_240: u256 = 0x1000000000000000000000000000000000000000000000000000000000000;

// ---------------------------
// ---------- Tests ----------
// ---------------------------
#[cfg(test)]
mod tests {
    use death_mountain::constants::loot::{ItemId, SUFFIX_UNLOCK_GREATNESS};
    use death_mountain::models::adventurer::bag::{Bag, ImplBag};
    use death_mountain::models::adventurer::item::{Item};

    #[test]
    #[available_gas(97530)]
    fn get_jewelry_greatness() {
        let katana = Item { id: ItemId::Katana, xp: 1 };
        let demon_crown = Item { id: ItemId::DemonCrown, xp: 2 };
        let silk_robe = Item { id: ItemId::SilkRobe, xp: 3 };
        let silver_ring = Item { id: ItemId::SilverRing, xp: 4 };
        let ghost_wand = Item { id: ItemId::GhostWand, xp: 5 };
        let leather_gloves = Item { id: ItemId::LeatherGloves, xp: 6 };
        let silk_gloves = Item { id: ItemId::SilkGloves, xp: 7 };
        let linen_gloves = Item { id: ItemId::LinenGloves, xp: 8 };
        let crown = Item { id: ItemId::Crown, xp: 10 };
        let amulet = Item { id: ItemId::Amulet, xp: 9 };
        let pendant = Item { id: ItemId::Pendant, xp: 16 };
        let bag = Bag {
            item_1: katana,
            item_2: demon_crown,
            item_3: silk_robe,
            item_4: silver_ring,
            item_5: ghost_wand,
            item_6: leather_gloves,
            item_7: silk_gloves,
            item_8: linen_gloves,
            item_9: crown,
            item_10: amulet,
            item_11: pendant,
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };

        let jewelry_greatness = bag.get_jewelry_greatness();
        assert(jewelry_greatness == 9, 'bagged jewlwery greatness is 9');
    }

    #[test]
    fn get_jewelry() {
        let katana = Item { id: ItemId::Katana, xp: 1 };
        let demon_crown = Item { id: ItemId::DemonCrown, xp: 2 };
        let silk_robe = Item { id: ItemId::SilkRobe, xp: 3 };
        let silver_ring = Item { id: ItemId::SilverRing, xp: 4 };
        let ghost_wand = Item { id: ItemId::GhostWand, xp: 5 };
        let leather_gloves = Item { id: ItemId::LeatherGloves, xp: 6 };
        let silk_gloves = Item { id: ItemId::SilkGloves, xp: 7 };
        let linen_gloves = Item { id: ItemId::LinenGloves, xp: 8 };
        let crown = Item { id: ItemId::Crown, xp: 10 };
        let amulet = Item { id: ItemId::Amulet, xp: 10 };
        let pendant = Item { id: ItemId::Pendant, xp: 10 };
        let bag = Bag {
            item_1: katana,
            item_2: demon_crown,
            item_3: silk_robe,
            item_4: silver_ring,
            item_5: ghost_wand,
            item_6: leather_gloves,
            item_7: silk_gloves,
            item_8: linen_gloves,
            item_9: crown,
            item_10: amulet,
            item_11: pendant,
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };

        let jewelry = ImplBag::get_jewelry(bag);
        assert(jewelry.len() == 3, 'bag should have 3 jewlery items');
        assert(*jewelry.at(0).id == silver_ring.id, 'silver ring in bag');
        assert(*jewelry.at(1).id == amulet.id, 'amulet in bag');
        assert(*jewelry.at(2).id == pendant.id, 'pendant in bag');
    }

    #[test]
    #[should_panic(expected: ('Item ID cannot be 0',))]
    #[available_gas(7500)]
    fn contains_invalid_zero() {
        let katana = Item { id: ItemId::Katana, xp: 1 };
        let demon_crown = Item { id: ItemId::DemonCrown, xp: 2 };
        let silk_robe = Item { id: ItemId::SilkRobe, xp: 3 };
        let silver_ring = Item { id: ItemId::SilverRing, xp: 4 };
        let ghost_wand = Item { id: ItemId::GhostWand, xp: 5 };
        let leather_gloves = Item { id: ItemId::LeatherGloves, xp: 6 };
        let silk_gloves = Item { id: ItemId::SilkGloves, xp: 7 };
        let linen_gloves = Item { id: ItemId::LinenGloves, xp: 8 };
        let crown = Item { id: ItemId::Crown, xp: 10 };
        let bag = Bag {
            item_1: katana,
            item_2: demon_crown,
            item_3: silk_robe,
            item_4: silver_ring,
            item_5: ghost_wand,
            item_6: leather_gloves,
            item_7: silk_gloves,
            item_8: linen_gloves,
            item_9: crown,
            item_10: Item { id: 0, xp: 0 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };
        ImplBag::contains(bag, 0);
    }

    #[test]
    #[available_gas(84500)]
    fn contains() {
        let katana = Item { id: ItemId::Katana, xp: 1 };
        let demon_crown = Item { id: ItemId::DemonCrown, xp: 2 };
        let silk_robe = Item { id: ItemId::SilkRobe, xp: 3 };
        let silver_ring = Item { id: ItemId::SilverRing, xp: 4 };
        let ghost_wand = Item { id: ItemId::GhostWand, xp: 5 };
        let leather_gloves = Item { id: ItemId::LeatherGloves, xp: 6 };
        let silk_gloves = Item { id: ItemId::SilkGloves, xp: 7 };
        let linen_gloves = Item { id: ItemId::LinenGloves, xp: 8 };
        let crown = Item { id: ItemId::Crown, xp: 10 };
        let bag = Bag {
            item_1: katana,
            item_2: demon_crown,
            item_3: silk_robe,
            item_4: silver_ring,
            item_5: ghost_wand,
            item_6: leather_gloves,
            item_7: silk_gloves,
            item_8: linen_gloves,
            item_9: crown,
            item_10: Item { id: 0, xp: 0 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };

        let (contains, item) = ImplBag::contains(bag, katana.id);
        assert(contains == true, 'katans should be in bag');
        assert(item.id == katana.id, 'item id should be katana');
        assert(item.xp == katana.xp, 'item xp should be katana');

        let (contains, item) = ImplBag::contains(bag, demon_crown.id);
        assert(contains == true, 'demon crown should be in bag');
        assert(item.id == demon_crown.id, 'item id should be demon crown');
        assert(item.xp == demon_crown.xp, 'item xp should be demon crown');

        let (contains, item) = ImplBag::contains(bag, silk_robe.id);
        assert(contains == true, 'silk robe should be in bag');
        assert(item.id == silk_robe.id, 'item id should be silk robe');
        assert(item.xp == silk_robe.xp, 'item xp should be silk robe');

        let (contains, item) = ImplBag::contains(bag, silver_ring.id);
        assert(contains == true, 'silver ring should be in bag');
        assert(item.id == silver_ring.id, 'item id should be silver ring');
        assert(item.xp == silver_ring.xp, 'item xp should be silver ring');

        let (contains, item) = ImplBag::contains(bag, ghost_wand.id);
        assert(contains == true, 'ghost wand should be in bag');
        assert(item.id == ghost_wand.id, 'item id should be ghost wand');
        assert(item.xp == ghost_wand.xp, 'item xp should be ghost wand');

        let (contains, item) = ImplBag::contains(bag, leather_gloves.id);
        assert(contains == true, 'leather gloves should be in bag');
        assert(item.id == leather_gloves.id, 'leather gloves id');
        assert(item.xp == leather_gloves.xp, 'leather gloves xp');

        let (contains, item) = ImplBag::contains(bag, silk_gloves.id);
        assert(contains == true, 'silk gloves should be in bag');
        assert(item.id == silk_gloves.id, 'item id should be silk gloves');
        assert(item.xp == silk_gloves.xp, 'item xp should be silk gloves');

        let (contains, item) = ImplBag::contains(bag, linen_gloves.id);
        assert(contains == true, 'linen gloves should be in bag');
        assert(item.id == linen_gloves.id, 'item id should be linen gloves');
        assert(item.xp == linen_gloves.xp, 'item xp should be linen gloves');

        let (contains, item) = ImplBag::contains(bag, crown.id);
        assert(contains == true, 'crown should be in bag');
        assert(item.id == crown.id, 'item id should be crown');
        assert(item.xp == crown.xp, 'item xp should be crown');

        let (contains, item) = ImplBag::contains(bag, ItemId::Maul);
        assert(contains == false, 'maul should not be in bag');
        assert(item.id == 0, 'id should be 0');
        assert(item.xp == 0, 'xp should be 0');
    }

    #[test]
    fn save_bag() {
        let mut bag = Bag {
            item_1: Item { id: 127, xp: 511 },
            item_2: Item { id: 127, xp: 511 },
            item_3: Item { id: 127, xp: 511 },
            item_4: Item { id: 127, xp: 511 },
            item_5: Item { id: 127, xp: 511 },
            item_6: Item { id: 127, xp: 511 },
            item_7: Item { id: 127, xp: 511 },
            item_8: Item { id: 127, xp: 511 },
            item_9: Item { id: 127, xp: 511 },
            item_10: Item { id: 127, xp: 511 },
            item_11: Item { id: 127, xp: 511 },
            item_12: Item { id: 127, xp: 511 },
            item_13: Item { id: 127, xp: 511 },
            item_14: Item { id: 127, xp: 511 },
            item_15: Item { id: 127, xp: 511 },
            mutated: false,
        };
        let packed_bag: Bag = ImplBag::unpack(ImplBag::pack(bag));

        assert(packed_bag.item_1.id == 127, 'Loot 1 ID is not 127');
        assert(packed_bag.item_1.xp == 511, 'Loot 1 XP is not 511');

        assert(packed_bag.item_2.id == 127, 'Loot 2 ID is not 127');
        assert(packed_bag.item_2.xp == 511, 'Loot 2 XP is not 511');

        assert(packed_bag.item_3.id == 127, 'Loot 3 ID is not 127');
        assert(packed_bag.item_3.xp == 511, 'Loot 3 XP is not 511');

        assert(packed_bag.item_4.id == 127, 'Loot 4 ID is not 127');
        assert(packed_bag.item_4.xp == 511, 'Loot 4 XP is not 511');

        assert(packed_bag.item_5.id == 127, 'Loot 5 ID is not 127');
        assert(packed_bag.item_5.xp == 511, 'Loot 5 XP is not 511');

        assert(packed_bag.item_6.id == 127, 'Loot 6 ID is not 127');
        assert(packed_bag.item_6.xp == 511, 'Loot 6 XP is not 511');

        assert(packed_bag.item_7.id == 127, 'Loot 7 ID is not 127');
        assert(packed_bag.item_7.xp == 511, 'Loot 7 XP is not 511');

        assert(packed_bag.item_8.id == 127, 'Loot 8 ID is not 127');
        assert(packed_bag.item_8.xp == 511, 'Loot 8 XP is not 511');

        assert(packed_bag.item_9.id == 127, 'Loot 9 ID is not 127');
        assert(packed_bag.item_9.xp == 511, 'Loot 9 XP is not 511');

        assert(packed_bag.item_10.id == 127, 'Loot 10 ID is not 127');
        assert(packed_bag.item_10.xp == 511, 'Loot 10 XP is not 511');

        assert(packed_bag.item_11.id == 127, 'Loot 11 ID is not 127');
        assert(packed_bag.item_11.xp == 511, 'Loot 11 XP is not 511');

        assert(packed_bag.item_12.id == 127, 'Loot 12 ID is not 127');
        assert(packed_bag.item_12.xp == 511, 'Loot 12 XP is not 511');

        assert(packed_bag.item_13.id == 127, 'Loot 13 ID is not 127');
        assert(packed_bag.item_13.xp == 511, 'Loot 13 XP is not 511');

        assert(packed_bag.item_14.id == 127, 'Loot 14 ID is not 127');
        assert(packed_bag.item_14.xp == 511, 'Loot 14 XP is not 511');

        assert(packed_bag.item_15.id == 127, 'Loot 15 ID is not 127');
        assert(packed_bag.item_15.xp == 511, 'Loot 15 XP is not 511');
    }

    #[test]
    #[should_panic(expected: ('Item ID cannot be 0',))]
    fn add_item_blank_item() {
        // start with full bag
        let mut bag = Bag {
            item_1: Item { id: 1, xp: 1 },
            item_2: Item { id: 2, xp: 1 },
            item_3: Item { id: 3, xp: 1 },
            item_4: Item { id: 4, xp: 1 },
            item_5: Item { id: 5, xp: 1 },
            item_6: Item { id: 6, xp: 1 },
            item_7: Item { id: 7, xp: 1 },
            item_8: Item { id: 8, xp: 1 },
            item_9: Item { id: 9, xp: 1 },
            item_10: Item { id: 10, xp: 1 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };

        // try adding an empty item to the bag
        // this should panic with 'Item ID cannot be 0'
        // which this test is annotated to expect
        ImplBag::add_item(ref bag, Item { id: 0, xp: 1 });
    }

    #[test]
    #[should_panic(expected: ('Bag is full',))]
    fn add_item_full_bag() {
        // start with full bag
        let mut bag = Bag {
            item_1: Item { id: 1, xp: 1 },
            item_2: Item { id: 2, xp: 1 },
            item_3: Item { id: 3, xp: 1 },
            item_4: Item { id: 4, xp: 1 },
            item_5: Item { id: 5, xp: 1 },
            item_6: Item { id: 6, xp: 1 },
            item_7: Item { id: 7, xp: 1 },
            item_8: Item { id: 8, xp: 1 },
            item_9: Item { id: 9, xp: 1 },
            item_10: Item { id: 10, xp: 1 },
            item_11: Item { id: 11, xp: 1 },
            item_12: Item { id: 12, xp: 1 },
            item_13: Item { id: 13, xp: 1 },
            item_14: Item { id: 14, xp: 1 },
            item_15: Item { id: 15, xp: 1 },
            mutated: false,
        };

        // try adding an item to a full bag
        // this should panic with 'Bag is full'
        // which this test is annotated to expect
        ImplBag::add_item(ref bag, Item { id: ItemId::Katana, xp: 1 });
    }

    #[test]
    fn add_item() {
        // start with empty bag
        let mut bag = Bag {
            item_1: Item { id: 0, xp: 0 },
            item_2: Item { id: 0, xp: 0 },
            item_3: Item { id: 0, xp: 0 },
            item_4: Item { id: 0, xp: 0 },
            item_5: Item { id: 0, xp: 0 },
            item_6: Item { id: 0, xp: 0 },
            item_7: Item { id: 0, xp: 0 },
            item_8: Item { id: 0, xp: 0 },
            item_9: Item { id: 0, xp: 0 },
            item_10: Item { id: 0, xp: 0 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };

        // initialize items
        let katana = Item { id: ItemId::Katana, xp: 1 };
        let demon_crown = Item { id: ItemId::DemonCrown, xp: 1 };
        let silk_robe = Item { id: ItemId::SilkRobe, xp: 1 };
        let silver_ring = Item { id: ItemId::SilverRing, xp: 1 };
        let ghost_wand = Item { id: ItemId::GhostWand, xp: 1 };
        let leather_gloves = Item { id: ItemId::LeatherGloves, xp: 1 };
        let silk_gloves = Item { id: ItemId::SilkGloves, xp: 1 };
        let linen_gloves = Item { id: ItemId::LinenGloves, xp: 1 };
        let crown = Item { id: ItemId::Crown, xp: 1 };
        let divine_slippers = Item { id: ItemId::DivineSlippers, xp: 1 };
        let warhammer = Item { id: ItemId::Warhammer, xp: 1 };

        // add items to bag
        ImplBag::add_item(ref bag, katana);
        ImplBag::add_item(ref bag, demon_crown);
        ImplBag::add_item(ref bag, silk_robe);
        ImplBag::add_item(ref bag, silver_ring);
        ImplBag::add_item(ref bag, ghost_wand);
        ImplBag::add_item(ref bag, leather_gloves);
        ImplBag::add_item(ref bag, silk_gloves);
        ImplBag::add_item(ref bag, linen_gloves);
        ImplBag::add_item(ref bag, crown);
        ImplBag::add_item(ref bag, divine_slippers);
        ImplBag::add_item(ref bag, warhammer);

        // assert items are in bag
        assert(bag.item_1.id == ItemId::Katana, 'item 1 should be katana');
        assert(bag.item_2.id == ItemId::DemonCrown, 'item 2 should be demon crown');
        assert(bag.item_3.id == ItemId::SilkRobe, 'item 3 should be silk robe');
        assert(bag.item_4.id == ItemId::SilverRing, 'item 4 should be silver ring');
        assert(bag.item_5.id == ItemId::GhostWand, 'item 5 should be ghost wand');
        assert(bag.item_6.id == ItemId::LeatherGloves, 'item 6 should be leather gloves');
        assert(bag.item_7.id == ItemId::SilkGloves, 'item 7 should be silk gloves');
        assert(bag.item_8.id == ItemId::LinenGloves, 'item 8 should be linen gloves');
        assert(bag.item_9.id == ItemId::Crown, 'item 9 should be crown');
        assert(bag.item_10.id == ItemId::DivineSlippers, 'should be divine slippers');
        assert(bag.item_11.id == ItemId::Warhammer, 'item 11 should be warhammer');
    }

    #[test]
    fn is_full() {
        // start with full bag
        let mut bag = Bag {
            item_1: Item { id: 1, xp: 0 },
            item_2: Item { id: 2, xp: 0 },
            item_3: Item { id: 3, xp: 0 },
            item_4: Item { id: 4, xp: 0 },
            item_5: Item { id: 5, xp: 0 },
            item_6: Item { id: 8, xp: 0 },
            item_7: Item { id: 9, xp: 0 },
            item_8: Item { id: 11, xp: 0 },
            item_9: Item { id: 12, xp: 0 },
            item_10: Item { id: 13, xp: 0 },
            item_11: Item { id: 14, xp: 0 },
            item_12: Item { id: 15, xp: 0 },
            item_13: Item { id: 16, xp: 0 },
            item_14: Item { id: 17, xp: 0 },
            item_15: Item { id: 18, xp: 0 },
            mutated: false,
        };

        // assert bag is full
        assert(ImplBag::is_full(bag) == true, 'Bag should be full');

        // remove an item
        ImplBag::remove_item(ref bag, 1);

        // assert bag is not full
        assert(ImplBag::is_full(bag) == false, 'Bag should be not full');

        // add a new item
        let mut warhammer = Item { id: ItemId::Warhammer, xp: 1 };
        ImplBag::add_item(ref bag, warhammer);

        // assert bag is full again
        assert(ImplBag::is_full(bag) == true, 'Bag should be full again');
    }

    #[test]
    #[should_panic(expected: ('Item not in bag',))]
    fn get_item_not_in_bag() {
        let item_1 = Item { id: 11, xp: 0 };
        let item_2 = Item { id: 12, xp: 0 };
        let item_3 = Item { id: 13, xp: 0 };
        let item_4 = Item { id: 14, xp: 0 };
        let item_5 = Item { id: 15, xp: 0 };
        let item_6 = Item { id: 16, xp: 0 };
        let item_7 = Item { id: 17, xp: 0 };
        let item_8 = Item { id: 18, xp: 0 };
        let item_9 = Item { id: 19, xp: 0 };
        let item_10 = Item { id: 20, xp: 0 };
        let item_11 = Item { id: 21, xp: 0 };

        let bag = Bag {
            item_1: item_1,
            item_2: item_2,
            item_3: item_3,
            item_4: item_4,
            item_5: item_5,
            item_6: item_6,
            item_7: item_7,
            item_8: item_8,
            item_9: item_9,
            item_10: item_10,
            item_11: item_11,
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };

        // try to get an item that is not in bag
        // should panic with 'Item not in bag'
        // this test is annotated to expect this panic
        // and will fail if it not thrown
        ImplBag::get_item(bag, 8);
    }

    #[test]
    fn get_item() {
        let item_1 = Item { id: 11, xp: 0 };
        let item_2 = Item { id: 12, xp: 0 };
        let item_3 = Item { id: 13, xp: 0 };
        let item_4 = Item { id: 14, xp: 0 };
        let item_5 = Item { id: 15, xp: 0 };
        let item_6 = Item { id: 16, xp: 0 };
        let item_7 = Item { id: 17, xp: 0 };
        let item_8 = Item { id: 18, xp: 0 };
        let item_9 = Item { id: 19, xp: 0 };
        let item_10 = Item { id: 20, xp: 0 };
        let item_11 = Item { id: 21, xp: 0 };
        let item_12 = Item { id: 22, xp: 0 };
        let item_13 = Item { id: 23, xp: 0 };
        let item_14 = Item { id: 24, xp: 0 };
        let item_15 = Item { id: 25, xp: 0 };

        let bag = Bag {
            item_1,
            item_2,
            item_3,
            item_4,
            item_5,
            item_6,
            item_7,
            item_8,
            item_9,
            item_10,
            item_11,
            item_12,
            item_13,
            item_14,
            item_15,
            mutated: false,
        };

        let item1_from_bag = ImplBag::get_item(bag, 11);
        assert(item1_from_bag.id == item_1.id, 'Item id should be 11');

        let item2_from_bag = ImplBag::get_item(bag, 12);
        assert(item2_from_bag.id == item_2.id, 'Item id should be 12');

        let item3_from_bag = ImplBag::get_item(bag, 13);
        assert(item3_from_bag.id == item_3.id, 'Item id should be 13');

        let item4_from_bag = ImplBag::get_item(bag, 14);
        assert(item4_from_bag.id == item_4.id, 'Item id should be 14');

        let item5_from_bag = ImplBag::get_item(bag, 15);
        assert(item5_from_bag.id == item_5.id, 'Item id should be 15');

        let item6_from_bag = ImplBag::get_item(bag, 16);
        assert(item6_from_bag.id == item_6.id, 'Item id should be 16');

        let item7_from_bag = ImplBag::get_item(bag, 17);
        assert(item7_from_bag.id == item_7.id, 'Item id should be 17');

        let item8_from_bag = ImplBag::get_item(bag, 18);
        assert(item8_from_bag.id == item_8.id, 'Item id should be 18');

        let item9_from_bag = ImplBag::get_item(bag, 19);
        assert(item9_from_bag.id == item_9.id, 'Item id should be 19');

        let item10_from_bag = ImplBag::get_item(bag, 20);
        assert(item10_from_bag.id == item_10.id, 'Item id should be 20');

        let item11_from_bag = ImplBag::get_item(bag, 21);
        assert(item11_from_bag.id == item_11.id, 'Item id should be 21');

        let item12_from_bag = ImplBag::get_item(bag, 22);
        assert(item12_from_bag.id == item_12.id, 'Item id should be 22');

        let item13_from_bag = ImplBag::get_item(bag, 23);
        assert(item13_from_bag.id == item_13.id, 'Item id should be 23');

        let item14_from_bag = ImplBag::get_item(bag, 24);
        assert(item14_from_bag.id == item_14.id, 'Item id should be 24');

        let item15_from_bag = ImplBag::get_item(bag, 25);
        assert(item15_from_bag.id == item_15.id, 'Item id should be 25');
    }

    #[test]
    fn remove_item() {
        let mut bag = Bag {
            item_1: Item { id: 1, xp: 0 },
            item_2: Item { id: 2, xp: 0 },
            item_3: Item { id: 3, xp: 0 },
            item_4: Item { id: 4, xp: 0 },
            item_5: Item { id: 5, xp: 0 },
            item_6: Item { id: 6, xp: 0 },
            item_7: Item { id: 7, xp: 0 },
            item_8: Item { id: 8, xp: 1 },
            item_9: Item { id: 9, xp: 0 },
            item_10: Item { id: 10, xp: 0 },
            item_11: Item { id: 11, xp: 0 },
            item_12: Item { id: 12, xp: 0 },
            item_13: Item { id: 13, xp: 0 },
            item_14: Item { id: 14, xp: 0 },
            item_15: Item { id: 15, xp: 0 },
            mutated: false,
        };

        // remove item from bag
        let removed_item = ImplBag::remove_item(ref bag, 6);

        // verify it has been removed
        assert(bag.item_6.id == 0, 'id should be 0');
        assert(bag.item_6.xp == 0, 'xp should be 0');
        assert(removed_item.id == 6, 'removed item is wrong');
    }

    #[test]
    #[should_panic(expected: ('Item not in bag',))]
    fn remove_item_not_in_bag() {
        // initialize bag
        let mut bag = Bag {
            item_1: Item { id: 1, xp: 0 },
            item_2: Item { id: 2, xp: 0 },
            item_3: Item { id: 3, xp: 0 },
            item_4: Item { id: 4, xp: 0 },
            item_5: Item { id: 5, xp: 0 },
            item_6: Item { id: 8, xp: 0 },
            item_7: Item { id: 9, xp: 0 },
            item_8: Item { id: 11, xp: 0 },
            item_9: Item { id: 12, xp: 0 },
            item_10: Item { id: 13, xp: 0 },
            item_11: Item { id: 14, xp: 0 },
            item_12: Item { id: 15, xp: 0 },
            item_13: Item { id: 16, xp: 0 },
            item_14: Item { id: 17, xp: 0 },
            item_15: Item { id: 18, xp: 0 },
            mutated: false,
        };

        // try to remove an item not in the bag
        // this should panic with 'item not in bag'
        // which this test is annotated to expect
        ImplBag::remove_item(ref bag, 255);
    }

    #[test]
    fn has_specials() {
        let suffix_unlock_xp = (SUFFIX_UNLOCK_GREATNESS * SUFFIX_UNLOCK_GREATNESS).into();
        let special_item = Item { id: 1, xp: suffix_unlock_xp };
        let normal_item = Item { id: 2, xp: suffix_unlock_xp - 1 };

        let bag_with_specials = Bag {
            item_1: special_item,
            item_2: normal_item,
            item_3: normal_item,
            item_4: normal_item,
            item_5: normal_item,
            item_6: normal_item,
            item_7: normal_item,
            item_8: normal_item,
            item_9: normal_item,
            item_10: normal_item,
            item_11: normal_item,
            item_12: normal_item,
            item_13: normal_item,
            item_14: normal_item,
            item_15: normal_item,
            mutated: false,
        };

        let bag_without_specials = Bag {
            item_1: normal_item,
            item_2: normal_item,
            item_3: normal_item,
            item_4: normal_item,
            item_5: normal_item,
            item_6: normal_item,
            item_7: normal_item,
            item_8: normal_item,
            item_9: normal_item,
            item_10: normal_item,
            item_11: normal_item,
            item_12: normal_item,
            item_13: normal_item,
            item_14: normal_item,
            item_15: normal_item,
            mutated: false,
        };

        assert(bag_with_specials.has_specials(), 'Bag should have specials');
        assert(!bag_without_specials.has_specials(), 'Bag should not have specials');
    }

    #[test]
    fn has_specials_empty_bag() {
        let empty_bag = Bag {
            item_1: Item { id: 0, xp: 0 },
            item_2: Item { id: 0, xp: 0 },
            item_3: Item { id: 0, xp: 0 },
            item_4: Item { id: 0, xp: 0 },
            item_5: Item { id: 0, xp: 0 },
            item_6: Item { id: 0, xp: 0 },
            item_7: Item { id: 0, xp: 0 },
            item_8: Item { id: 0, xp: 0 },
            item_9: Item { id: 0, xp: 0 },
            item_10: Item { id: 0, xp: 0 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };

        assert!(empty_bag.has_specials() == false, "Empty bag should not have specials");
    }
}
