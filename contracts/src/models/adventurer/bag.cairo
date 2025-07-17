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
