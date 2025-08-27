// SPDX-License-Identifier: BUSL-1.1

use core::panic_with_felt252;
use core::traits::DivRem;
use death_mountain::constants::loot::SUFFIX_UNLOCK_GREATNESS;
use death_mountain::models::adventurer::item::{IItemPrimitive, ImplItem, Item, ItemVerbose};
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

// for clients and renderers
#[derive(Introspect, Drop, Copy, Serde)]
pub struct BagVerbose {
    pub item_1: ItemVerbose,
    pub item_2: ItemVerbose,
    pub item_3: ItemVerbose,
    pub item_4: ItemVerbose,
    pub item_5: ItemVerbose,
    pub item_6: ItemVerbose,
    pub item_7: ItemVerbose,
    pub item_8: ItemVerbose,
    pub item_9: ItemVerbose,
    pub item_10: ItemVerbose,
    pub item_11: ItemVerbose,
    pub item_12: ItemVerbose,
    pub item_13: ItemVerbose,
    pub item_14: ItemVerbose,
    pub item_15: ItemVerbose,
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

    // @notice Packs the bag into a felt252
    // @param bag The instance of the Bag
    // @return The packed bag
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

    // @notice Unpacks a felt252 into a Bag
    // @param value The packed bag
    // @return The unpacked bag
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
    // @param self The instance of the Bag
    // @param item_id The id of the item to be retrieved
    // @return The item from the bag with the specified id
    // @panics If the item is not in the bag
    fn get_item(self: Bag, item_id: u8) -> Item {
        if self.item_1.id == item_id {
            self.item_1
        } else if self.item_2.id == item_id {
            self.item_2
        } else if self.item_3.id == item_id {
            self.item_3
        } else if self.item_4.id == item_id {
            self.item_4
        } else if self.item_5.id == item_id {
            self.item_5
        } else if self.item_6.id == item_id {
            self.item_6
        } else if self.item_7.id == item_id {
            self.item_7
        } else if self.item_8.id == item_id {
            self.item_8
        } else if self.item_9.id == item_id {
            self.item_9
        } else if self.item_10.id == item_id {
            self.item_10
        } else if self.item_11.id == item_id {
            self.item_11
        } else if self.item_12.id == item_id {
            self.item_12
        } else if self.item_13.id == item_id {
            self.item_13
        } else if self.item_14.id == item_id {
            self.item_14
        } else if self.item_15.id == item_id {
            self.item_15
        } else {
            panic_with_felt252('Item not in bag')
        }
    }

    // @notice Adds a new item to the bag
    // @param self The instance of the Bag
    // @param item_id The id of the item to be added
    fn add_new_item(ref self: Bag, item_id: u8) {
        let item = ImplItem::new(item_id);
        self.add_item(item);
    }

    // @notice Adds an item to the bag
    // @param self The instance of the Bag
    // @param item The item to be added to the bag
    // @panics If the item id is 0
    // @panics If the bag is full
    fn add_item(ref self: Bag, item: Item) {
        assert(item.id != 0, 'Item ID cannot be 0');

        // add item to next available slot
        if self.item_1.id == 0 {
            self.item_1 = item;
        } else if self.item_2.id == 0 {
            self.item_2 = item;
        } else if self.item_3.id == 0 {
            self.item_3 = item;
        } else if self.item_4.id == 0 {
            self.item_4 = item;
        } else if self.item_5.id == 0 {
            self.item_5 = item;
        } else if self.item_6.id == 0 {
            self.item_6 = item;
        } else if self.item_7.id == 0 {
            self.item_7 = item;
        } else if self.item_8.id == 0 {
            self.item_8 = item;
        } else if self.item_9.id == 0 {
            self.item_9 = item;
        } else if self.item_10.id == 0 {
            self.item_10 = item;
        } else if self.item_11.id == 0 {
            self.item_11 = item;
        } else if self.item_12.id == 0 {
            self.item_12 = item;
        } else if self.item_13.id == 0 {
            self.item_13 = item;
        } else if self.item_14.id == 0 {
            self.item_14 = item;
        } else if self.item_15.id == 0 {
            self.item_15 = item;
        } else {
            panic_with_felt252('Bag is full')
        }

        // flag bag as mutated
        self.mutated = true;
    }

    // @notice Removes an item from the bag by its id
    // @param self The instance of the Bag
    // @param item_id The id of the item to be removed
    // @return The item that was removed from the bag
    fn remove_item(ref self: Bag, item_id: u8) -> Item {
        let removed_item = self.get_item(item_id);

        if self.item_1.id == item_id {
            self.item_1.id = 0;
            self.item_1.xp = 0;
        } else if self.item_2.id == item_id {
            self.item_2.id = 0;
            self.item_2.xp = 0;
        } else if self.item_3.id == item_id {
            self.item_3.id = 0;
            self.item_3.xp = 0;
        } else if self.item_4.id == item_id {
            self.item_4.id = 0;
            self.item_4.xp = 0;
        } else if self.item_5.id == item_id {
            self.item_5.id = 0;
            self.item_5.xp = 0;
        } else if self.item_6.id == item_id {
            self.item_6.id = 0;
            self.item_6.xp = 0;
        } else if self.item_7.id == item_id {
            self.item_7.id = 0;
            self.item_7.xp = 0;
        } else if self.item_8.id == item_id {
            self.item_8.id = 0;
            self.item_8.xp = 0;
        } else if self.item_9.id == item_id {
            self.item_9.id = 0;
            self.item_9.xp = 0;
        } else if self.item_10.id == item_id {
            self.item_10.id = 0;
            self.item_10.xp = 0;
        } else if self.item_11.id == item_id {
            self.item_11.id = 0;
            self.item_11.xp = 0;
        } else if self.item_12.id == item_id {
            self.item_12.id = 0;
            self.item_12.xp = 0;
        } else if self.item_13.id == item_id {
            self.item_13.id = 0;
            self.item_13.xp = 0;
        } else if self.item_14.id == item_id {
            self.item_14.id = 0;
            self.item_14.xp = 0;
        } else if self.item_15.id == item_id {
            self.item_15.id = 0;
            self.item_15.xp = 0;
        } else {
            panic_with_felt252('item not in bag')
        }

        self.mutated = true;

        removed_item
    }

    // @notice Checks if the bag is full
    // @dev A bag is considered full if all item slots are occupied (id of the item is non-zero)
    // @param self The instance of the Bag
    // @return A boolean value indicating whether the bag is full
    fn is_full(self: Bag) -> bool {
        if self.item_1.id == 0 {
            false
        } else if self.item_2.id == 0 {
            false
        } else if self.item_3.id == 0 {
            false
        } else if self.item_4.id == 0 {
            false
        } else if self.item_5.id == 0 {
            false
        } else if self.item_6.id == 0 {
            false
        } else if self.item_7.id == 0 {
            false
        } else if self.item_8.id == 0 {
            false
        } else if self.item_9.id == 0 {
            false
        } else if self.item_10.id == 0 {
            false
        } else if self.item_11.id == 0 {
            false
        } else if self.item_12.id == 0 {
            false
        } else if self.item_13.id == 0 {
            false
        } else if self.item_14.id == 0 {
            false
        } else if self.item_15.id == 0 {
            false
        } else {
            true
        }
    }

    // @notice Checks if a specific item exists in the bag
    // @param self The Bag object in which to search for the item
    // @param item The id of the item to search for
    // @return A bool indicating whether the item is present in the bag
    fn contains(self: Bag, item_id: u8) -> (bool, Item) {
        assert(item_id != 0, 'Item ID cannot be 0');
        if self.item_1.id == item_id {
            return (true, self.item_1);
        } else if self.item_2.id == item_id {
            return (true, self.item_2);
        } else if self.item_3.id == item_id {
            return (true, self.item_3);
        } else if self.item_4.id == item_id {
            return (true, self.item_4);
        } else if self.item_5.id == item_id {
            return (true, self.item_5);
        } else if self.item_6.id == item_id {
            return (true, self.item_6);
        } else if self.item_7.id == item_id {
            return (true, self.item_7);
        } else if self.item_8.id == item_id {
            return (true, self.item_8);
        } else if self.item_9.id == item_id {
            return (true, self.item_9);
        } else if self.item_10.id == item_id {
            return (true, self.item_10);
        } else if self.item_11.id == item_id {
            return (true, self.item_11);
        } else if self.item_12.id == item_id {
            return (true, self.item_12);
        } else if self.item_13.id == item_id {
            return (true, self.item_13);
        } else if self.item_14.id == item_id {
            return (true, self.item_14);
        } else if self.item_15.id == item_id {
            return (true, self.item_15);
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

impl BagIntoBagVerbose of Into<Bag, BagVerbose> {
    fn into(self: Bag) -> BagVerbose {
        BagVerbose {
            item_1: self.item_1.into(),
            item_2: self.item_2.into(),
            item_3: self.item_3.into(),
            item_4: self.item_4.into(),
            item_5: self.item_5.into(),
            item_6: self.item_6.into(),
            item_7: self.item_7.into(),
            item_8: self.item_8.into(),
            item_9: self.item_9.into(),
            item_10: self.item_10.into(),
            item_11: self.item_11.into(),
            item_12: self.item_12.into(),
            item_13: self.item_13.into(),
            item_14: self.item_14.into(),
            item_15: self.item_15.into(),
        }
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
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
    use death_mountain::constants::loot::{ItemId, SUFFIX_UNLOCK_GREATNESS};
    use death_mountain::models::adventurer::bag::{Bag, BagVerbose, ImplBag};
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
    #[available_gas(7400)]
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
        bag.contains(0);
    }

    #[test]
    #[available_gas(83200)]
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

        let (contains, item) = bag.contains(katana.id);
        assert(contains == true, 'katans should be in bag');
        assert(item.id == katana.id, 'item id should be katana');
        assert(item.xp == katana.xp, 'item xp should be katana');

        let (contains, item) = bag.contains(demon_crown.id);
        assert(contains == true, 'demon crown should be in bag');
        assert(item.id == demon_crown.id, 'item id should be demon crown');
        assert(item.xp == demon_crown.xp, 'item xp should be demon crown');

        let (contains, item) = bag.contains(silk_robe.id);
        assert(contains == true, 'silk robe should be in bag');
        assert(item.id == silk_robe.id, 'item id should be silk robe');
        assert(item.xp == silk_robe.xp, 'item xp should be silk robe');

        let (contains, item) = bag.contains(silver_ring.id);
        assert(contains == true, 'silver ring should be in bag');
        assert(item.id == silver_ring.id, 'item id should be silver ring');
        assert(item.xp == silver_ring.xp, 'item xp should be silver ring');

        let (contains, item) = bag.contains(ghost_wand.id);
        assert(contains == true, 'ghost wand should be in bag');
        assert(item.id == ghost_wand.id, 'item id should be ghost wand');
        assert(item.xp == ghost_wand.xp, 'item xp should be ghost wand');

        let (contains, item) = bag.contains(leather_gloves.id);
        assert(contains == true, 'leather gloves should be in bag');
        assert(item.id == leather_gloves.id, 'leather gloves id');
        assert(item.xp == leather_gloves.xp, 'leather gloves xp');

        let (contains, item) = bag.contains(silk_gloves.id);
        assert(contains == true, 'silk gloves should be in bag');
        assert(item.id == silk_gloves.id, 'item id should be silk gloves');
        assert(item.xp == silk_gloves.xp, 'item xp should be silk gloves');

        let (contains, item) = bag.contains(linen_gloves.id);
        assert(contains == true, 'linen gloves should be in bag');
        assert(item.id == linen_gloves.id, 'item id should be linen gloves');
        assert(item.xp == linen_gloves.xp, 'item xp should be linen gloves');

        let (contains, item) = bag.contains(crown.id);
        assert(contains == true, 'crown should be in bag');
        assert(item.id == crown.id, 'item id should be crown');
        assert(item.xp == crown.xp, 'item xp should be crown');

        let (contains, item) = bag.contains(ItemId::Maul);
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
        bag.add_item(Item { id: 0, xp: 1 });
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
        bag.add_item(Item { id: ItemId::Katana, xp: 1 });
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
        bag.add_item(katana);
        bag.add_item(demon_crown);
        bag.add_item(silk_robe);
        bag.add_item(silver_ring);
        bag.add_item(ghost_wand);
        bag.add_item(leather_gloves);
        bag.add_item(silk_gloves);
        bag.add_item(linen_gloves);
        bag.add_item(crown);
        bag.add_item(divine_slippers);
        bag.add_item(warhammer);

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
        assert(bag.is_full() == true, 'Bag should be full');

        // remove an item
        bag.remove_item(1);

        // assert bag is not full
        assert(bag.is_full() == false, 'Bag should be not full');

        // add a new item
        let warhammer = Item { id: ItemId::Warhammer, xp: 1 };
        bag.add_item(warhammer);

        // assert bag is full again
        assert(bag.is_full() == true, 'Bag should be full again');
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
        // expect panic with 'Item not in bag'
        bag.get_item(8);
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

        let item1_from_bag = bag.get_item(11);
        assert(item1_from_bag.id == item_1.id, 'Item id should be 11');

        let item2_from_bag = bag.get_item(12);
        assert(item2_from_bag.id == item_2.id, 'Item id should be 12');

        let item3_from_bag = bag.get_item(13);
        assert(item3_from_bag.id == item_3.id, 'Item id should be 13');

        let item4_from_bag = bag.get_item(14);
        assert(item4_from_bag.id == item_4.id, 'Item id should be 14');

        let item5_from_bag = bag.get_item(15);
        assert(item5_from_bag.id == item_5.id, 'Item id should be 15');

        let item6_from_bag = bag.get_item(16);
        assert(item6_from_bag.id == item_6.id, 'Item id should be 16');

        let item7_from_bag = bag.get_item(17);
        assert(item7_from_bag.id == item_7.id, 'Item id should be 17');

        let item8_from_bag = bag.get_item(18);
        assert(item8_from_bag.id == item_8.id, 'Item id should be 18');

        let item9_from_bag = bag.get_item(19);
        assert(item9_from_bag.id == item_9.id, 'Item id should be 19');

        let item10_from_bag = bag.get_item(20);
        assert(item10_from_bag.id == item_10.id, 'Item id should be 20');

        let item11_from_bag = bag.get_item(21);
        assert(item11_from_bag.id == item_11.id, 'Item id should be 21');

        let item12_from_bag = bag.get_item(22);
        assert(item12_from_bag.id == item_12.id, 'Item id should be 22');

        let item13_from_bag = bag.get_item(23);
        assert(item13_from_bag.id == item_13.id, 'Item id should be 23');

        let item14_from_bag = bag.get_item(24);
        assert(item14_from_bag.id == item_14.id, 'Item id should be 24');

        let item15_from_bag = bag.get_item(25);
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
        let removed_item = bag.remove_item(6);

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
        bag.remove_item(255);
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

    #[test]
    #[available_gas(637800)]
    fn test_bag_into_bag_verbose_gas() {
        let empty_bag = Bag {
            item_1: Item { id: 1, xp: 100 },
            item_2: Item { id: 2, xp: 101 },
            item_3: Item { id: 3, xp: 102 },
            item_4: Item { id: 4, xp: 103 },
            item_5: Item { id: 5, xp: 104 },
            item_6: Item { id: 6, xp: 105 },
            item_7: Item { id: 7, xp: 106 },
            item_8: Item { id: 8, xp: 107 },
            item_9: Item { id: 9, xp: 108 },
            item_10: Item { id: 10, xp: 109 },
            item_11: Item { id: 11, xp: 110 },
            item_12: Item { id: 12, xp: 111 },
            item_13: Item { id: 13, xp: 112 },
            item_14: Item { id: 14, xp: 113 },
            item_15: Item { id: 15, xp: 114 },
            mutated: false,
        };
        let _verbose_bag: BagVerbose = empty_bag.into();
    }


    #[test]
    fn test_bag_into_bag_verbose_empty_bag() {
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

        let verbose_bag: BagVerbose = empty_bag.into();

        assert!(
            verbose_bag.item_1.name == 0,
            "item1 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_1.name,
        );
        assert!(verbose_bag.item_1.id == 0, "item1 wrong id. expected 0, actual {:?}", verbose_bag.item_1.id);
        assert!(verbose_bag.item_1.xp == 0, "item1 wrong xp. expected 0, actual {:?}", verbose_bag.item_1.xp);
        assert(verbose_bag.item_1.tier == Tier::None, 'item1 wrong tier');
        assert(verbose_bag.item_1.item_type == Type::None, 'item1 wrong type');
        assert(verbose_bag.item_1.slot == Slot::None, 'item1 wrong slot');
        assert(verbose_bag.item_2.name == 0, 'item2 wrong name');

        assert!(
            verbose_bag.item_2.name == 0,
            "item2 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_2.name,
        );
        assert!(verbose_bag.item_2.id == 0, "item2 wrong id. expected 0, actual {:?}", verbose_bag.item_2.id);
        assert!(verbose_bag.item_2.xp == 0, "item2 wrong xp. expected 0, actual {:?}", verbose_bag.item_2.xp);
        assert(verbose_bag.item_2.tier == Tier::None, 'item2 wrong tier');
        assert(verbose_bag.item_2.item_type == Type::None, 'item2 wrong type');
        assert(verbose_bag.item_2.slot == Slot::None, 'item2 wrong slot');

        assert!(
            verbose_bag.item_3.name == 0,
            "item3 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_3.name,
        );
        assert!(verbose_bag.item_3.id == 0, "item3 wrong id. expected 0, actual {:?}", verbose_bag.item_3.id);
        assert!(verbose_bag.item_3.xp == 0, "item3 wrong xp. expected 0, actual {:?}", verbose_bag.item_3.xp);
        assert(verbose_bag.item_3.tier == Tier::None, 'item3 wrong tier');
        assert(verbose_bag.item_3.item_type == Type::None, 'item3 wrong type');
        assert(verbose_bag.item_3.slot == Slot::None, 'item3 wrong slot');

        assert!(
            verbose_bag.item_4.name == 0,
            "item4 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_4.name,
        );
        assert!(verbose_bag.item_4.id == 0, "item4 wrong id. expected 0, actual {:?}", verbose_bag.item_4.id);
        assert!(verbose_bag.item_4.xp == 0, "item4 wrong xp. expected 0, actual {:?}", verbose_bag.item_4.xp);
        assert(verbose_bag.item_4.tier == Tier::None, 'item4 wrong tier');
        assert(verbose_bag.item_4.item_type == Type::None, 'item4 wrong type');
        assert(verbose_bag.item_4.slot == Slot::None, 'item4 wrong slot');

        assert!(
            verbose_bag.item_5.name == 0,
            "item5 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_5.name,
        );
        assert!(verbose_bag.item_5.id == 0, "item5 wrong id. expected 0, actual {:?}", verbose_bag.item_5.id);
        assert!(verbose_bag.item_5.xp == 0, "item5 wrong xp. expected 0, actual {:?}", verbose_bag.item_5.xp);
        assert(verbose_bag.item_5.tier == Tier::None, 'item5 wrong tier');
        assert(verbose_bag.item_5.item_type == Type::None, 'item5 wrong type');
        assert(verbose_bag.item_5.slot == Slot::None, 'item5 wrong slot');

        assert!(
            verbose_bag.item_6.name == 0,
            "item6 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_6.name,
        );
        assert!(verbose_bag.item_6.id == 0, "item6 wrong id. expected 0, actual {:?}", verbose_bag.item_6.id);
        assert!(verbose_bag.item_6.xp == 0, "item6 wrong xp. expected 0, actual {:?}", verbose_bag.item_6.xp);
        assert(verbose_bag.item_6.tier == Tier::None, 'item6 wrong tier');
        assert(verbose_bag.item_6.item_type == Type::None, 'item6 wrong type');
        assert(verbose_bag.item_6.slot == Slot::None, 'item6 wrong slot');

        assert!(
            verbose_bag.item_7.name == 0,
            "item7 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_7.name,
        );
        assert!(verbose_bag.item_7.id == 0, "item7 wrong id. expected 0, actual {:?}", verbose_bag.item_7.id);
        assert!(verbose_bag.item_7.xp == 0, "item7 wrong xp. expected 0, actual {:?}", verbose_bag.item_7.xp);
        assert(verbose_bag.item_7.tier == Tier::None, 'item7 wrong tier');
        assert(verbose_bag.item_7.item_type == Type::None, 'item7 wrong type');
        assert(verbose_bag.item_7.slot == Slot::None, 'item7 wrong slot');

        assert!(
            verbose_bag.item_8.name == 0,
            "item8 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_8.name,
        );
        assert!(verbose_bag.item_8.id == 0, "item8 wrong id. expected 0, actual {:?}", verbose_bag.item_8.id);
        assert!(verbose_bag.item_8.xp == 0, "item8 wrong xp. expected 0, actual {:?}", verbose_bag.item_8.xp);
        assert(verbose_bag.item_8.tier == Tier::None, 'item8 wrong tier');
        assert(verbose_bag.item_8.item_type == Type::None, 'item8 wrong type');
        assert(verbose_bag.item_8.slot == Slot::None, 'item8 wrong slot');

        assert!(
            verbose_bag.item_9.name == 0,
            "item9 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_9.name,
        );
        assert!(verbose_bag.item_9.id == 0, "item9 wrong id. expected 0, actual {:?}", verbose_bag.item_9.id);
        assert!(verbose_bag.item_9.xp == 0, "item9 wrong xp. expected 0, actual {:?}", verbose_bag.item_9.xp);
        assert(verbose_bag.item_9.tier == Tier::None, 'item9 wrong tier');
        assert(verbose_bag.item_9.item_type == Type::None, 'item9 wrong type');
        assert(verbose_bag.item_9.slot == Slot::None, 'item9 wrong slot');

        assert!(
            verbose_bag.item_10.name == 0,
            "item10 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_10.name,
        );
        assert!(verbose_bag.item_10.id == 0, "item10 wrong id. expected 0, actual {:?}", verbose_bag.item_10.id);
        assert!(verbose_bag.item_10.xp == 0, "item10 wrong xp. expected 0, actual {:?}", verbose_bag.item_10.xp);
        assert(verbose_bag.item_10.tier == Tier::None, 'item10 wrong tier');
        assert(verbose_bag.item_10.item_type == Type::None, 'item10 wrong type');
        assert(verbose_bag.item_10.slot == Slot::None, 'item10 wrong slot');

        assert!(
            verbose_bag.item_11.name == 0,
            "item11 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_11.name,
        );
        assert!(verbose_bag.item_11.id == 0, "item11 wrong id. expected 0, actual {:?}", verbose_bag.item_11.id);
        assert!(verbose_bag.item_11.xp == 0, "item11 wrong xp. expected 0, actual {:?}", verbose_bag.item_11.xp);
        assert(verbose_bag.item_11.tier == Tier::None, 'item11 wrong tier');
        assert(verbose_bag.item_11.item_type == Type::None, 'item11 wrong type');
        assert(verbose_bag.item_11.slot == Slot::None, 'item11 wrong slot');

        assert!(
            verbose_bag.item_12.name == 0,
            "item12 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_12.name,
        );
        assert!(verbose_bag.item_12.id == 0, "item12 wrong id. expected 0, actual {:?}", verbose_bag.item_12.id);
        assert!(verbose_bag.item_12.xp == 0, "item12 wrong xp. expected 0, actual {:?}", verbose_bag.item_12.xp);
        assert(verbose_bag.item_12.tier == Tier::None, 'item12 wrong tier');
        assert(verbose_bag.item_12.item_type == Type::None, 'item12 wrong type');
        assert(verbose_bag.item_12.slot == Slot::None, 'item12 wrong slot');

        assert!(
            verbose_bag.item_13.name == 0,
            "item13 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_13.name,
        );
        assert!(verbose_bag.item_13.id == 0, "item13 wrong id. expected 0, actual {:?}", verbose_bag.item_13.id);
        assert!(verbose_bag.item_13.xp == 0, "item13 wrong xp. expected 0, actual {:?}", verbose_bag.item_13.xp);
        assert(verbose_bag.item_13.tier == Tier::None, 'item13 wrong tier');
        assert(verbose_bag.item_13.item_type == Type::None, 'item13 wrong type');
        assert(verbose_bag.item_13.slot == Slot::None, 'item13 wrong slot');

        assert!(
            verbose_bag.item_14.name == 0,
            "item14 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_14.name,
        );
        assert!(verbose_bag.item_14.id == 0, "item14 wrong id. expected 0, actual {:?}", verbose_bag.item_14.id);
        assert!(verbose_bag.item_14.xp == 0, "item14 wrong xp. expected 0, actual {:?}", verbose_bag.item_14.xp);
        assert(verbose_bag.item_14.tier == Tier::None, 'item14 wrong tier');
        assert(verbose_bag.item_14.item_type == Type::None, 'item14 wrong type');
        assert(verbose_bag.item_14.slot == Slot::None, 'item14 wrong slot');

        assert!(
            verbose_bag.item_15.name == 0,
            "item15 wrong name. expected {:?}, actual {:?}",
            'None',
            verbose_bag.item_15.name,
        );
        assert!(verbose_bag.item_15.id == 0, "item15 wrong id. expected 0, actual {:?}", verbose_bag.item_15.id);
        assert!(verbose_bag.item_15.xp == 0, "item15 wrong xp. expected 0, actual {:?}", verbose_bag.item_15.xp);
        assert(verbose_bag.item_15.tier == Tier::None, 'item15 wrong tier');
        assert(verbose_bag.item_15.item_type == Type::None, 'item15 wrong type');
        assert(verbose_bag.item_15.slot == Slot::None, 'item15 wrong slot');
    }

    #[test]
    fn test_bag_into_bag_verbose_full_bag() {
        let full_bag = Bag {
            item_1: Item { id: ItemId::Katana, xp: 100 },
            item_2: Item { id: ItemId::DemonCrown, xp: 200 },
            item_3: Item { id: ItemId::SilkRobe, xp: 300 },
            item_4: Item { id: ItemId::SilverRing, xp: 400 },
            item_5: Item { id: ItemId::GhostWand, xp: 500 },
            item_6: Item { id: ItemId::LeatherGloves, xp: 50 },
            item_7: Item { id: ItemId::SilkGloves, xp: 75 },
            item_8: Item { id: ItemId::LinenGloves, xp: 80 },
            item_9: Item { id: ItemId::Crown, xp: 150 },
            item_10: Item { id: ItemId::DivineSlippers, xp: 250 },
            item_11: Item { id: ItemId::Warhammer, xp: 350 },
            item_12: Item { id: ItemId::Quarterstaff, xp: 450 },
            item_13: Item { id: ItemId::Amulet, xp: 130 },
            item_14: Item { id: ItemId::BronzeRing, xp: 225 },
            item_15: Item { id: ItemId::Pendant, xp: 150 },
            mutated: true,
        };

        let verbose_bag: BagVerbose = full_bag.into();

        assert!(
            verbose_bag.item_1.id == ItemId::Katana,
            "wrong item1 id. expected {:?}, actual {:?}",
            ItemId::Katana,
            verbose_bag.item_1.id,
        );
        assert!(verbose_bag.item_1.xp == 100, "wrong item1 xp. expected 100, actual {:?}", verbose_bag.item_1.xp);
        assert!(
            verbose_bag.item_1.name == 'Katana',
            "wrong item1 name. expected {:?}, actual {:?}",
            'Katana',
            verbose_bag.item_1.name,
        );
        assert(verbose_bag.item_1.tier == Tier::T1, 'wrong item1 tier');
        assert(verbose_bag.item_1.item_type == Type::Blade_or_Hide, 'wrong item1 type');
        assert(verbose_bag.item_1.slot == Slot::Weapon, 'wrong item1 slot');

        assert!(
            verbose_bag.item_2.id == ItemId::DemonCrown,
            "wrong item2 id. expected {:?}, actual {:?}",
            ItemId::DemonCrown,
            verbose_bag.item_2.id,
        );
        assert!(verbose_bag.item_2.xp == 200, "wrong item2 xp. expected 200, actual {:?}", verbose_bag.item_2.xp);
        assert!(
            verbose_bag.item_2.name == 'Demon Crown',
            "wrong item2 name. expected {:?}, actual {:?}",
            'DemonCrown',
            verbose_bag.item_2.name,
        );
        assert(verbose_bag.item_2.tier == Tier::T1, 'wrong item2 tier');
        assert(verbose_bag.item_2.item_type == Type::Blade_or_Hide, 'wrong item2 type');
        assert(verbose_bag.item_2.slot == Slot::Head, 'wrong item2 slot');

        assert!(
            verbose_bag.item_3.id == ItemId::SilkRobe,
            "wrong item3 id. expected {:?}, actual {:?}",
            ItemId::SilkRobe,
            verbose_bag.item_3.id,
        );
        assert!(verbose_bag.item_3.xp == 300, "wrong item3 xp. expected 300, actual {:?}", verbose_bag.item_3.xp);
        assert!(
            verbose_bag.item_3.name == 'Silk Robe',
            "wrong item3 name. expected {:?}, actual {:?}",
            'SilkRobe',
            verbose_bag.item_3.name,
        );
        assert(verbose_bag.item_3.tier == Tier::T2, 'wrong item3 tier');
        assert(verbose_bag.item_3.item_type == Type::Magic_or_Cloth, 'wrong item3 type');
        assert(verbose_bag.item_3.slot == Slot::Chest, 'wrong item3 slot');

        assert!(
            verbose_bag.item_4.id == ItemId::SilverRing,
            "wrong item4 id. expected {:?}, actual {:?}",
            ItemId::SilverRing,
            verbose_bag.item_4.id,
        );
        assert!(verbose_bag.item_4.xp == 400, "wrong item4 xp. expected 400, actual {:?}", verbose_bag.item_4.xp);
        assert!(
            verbose_bag.item_4.name == 'Silver Ring',
            "wrong item4 name. expected {:?}, actual {:?}",
            'SilverRing',
            verbose_bag.item_4.name,
        );
        assert(verbose_bag.item_4.tier == Tier::T2, 'wrong item4 tier');
        assert(verbose_bag.item_4.item_type == Type::Ring, 'wrong item4 type');
        assert(verbose_bag.item_4.slot == Slot::Ring, 'wrong item4 slot');

        assert!(
            verbose_bag.item_5.id == ItemId::GhostWand,
            "wrong item5 id. expected {:?}, actual {:?}",
            ItemId::GhostWand,
            verbose_bag.item_5.id,
        );
        assert!(verbose_bag.item_5.xp == 500, "wrong item5 xp. expected 500, actual {:?}", verbose_bag.item_5.xp);
        assert!(
            verbose_bag.item_5.name == 'Ghost Wand',
            "wrong item5 name. expected {:?}, actual {:?}",
            'GhostWand',
            verbose_bag.item_5.name,
        );
        assert(verbose_bag.item_5.tier == Tier::T1, 'wrong item5 tier');
        assert(verbose_bag.item_5.item_type == Type::Magic_or_Cloth, 'wrong item5 type');
        assert(verbose_bag.item_5.slot == Slot::Weapon, 'wrong item5 slot');

        assert!(
            verbose_bag.item_6.id == ItemId::LeatherGloves,
            "wrong item6 id. expected {:?}, actual {:?}",
            ItemId::LeatherGloves,
            verbose_bag.item_6.id,
        );
        assert!(verbose_bag.item_6.xp == 50, "wrong item6 xp. expected 50, actual {:?}", verbose_bag.item_6.xp);
        assert!(
            verbose_bag.item_6.name == 'Leather Gloves',
            "wrong item6 name. expected {:?}, actual {:?}",
            'LeatherGloves',
            verbose_bag.item_6.name,
        );
        assert(verbose_bag.item_6.tier == Tier::T5, 'wrong item6 tier');
        assert(verbose_bag.item_6.item_type == Type::Blade_or_Hide, 'wrong item6 type');
        assert(verbose_bag.item_6.slot == Slot::Hand, 'wrong item6 slot');

        assert!(
            verbose_bag.item_7.id == ItemId::SilkGloves,
            "wrong item7 id. expected {:?}, actual {:?}",
            ItemId::SilkGloves,
            verbose_bag.item_7.id,
        );
        assert!(verbose_bag.item_7.xp == 75, "wrong item7 xp. expected 75, actual {:?}", verbose_bag.item_7.xp);
        assert!(
            verbose_bag.item_7.name == 'Silk Gloves',
            "wrong item7 name. expected {:?}, actual {:?}",
            'SilkGloves',
            verbose_bag.item_7.name,
        );
        assert(verbose_bag.item_7.tier == Tier::T2, 'wrong item7 tier');
        assert(verbose_bag.item_7.item_type == Type::Magic_or_Cloth, 'wrong item7 type');
        assert(verbose_bag.item_7.slot == Slot::Hand, 'wrong item7 slot');

        assert!(
            verbose_bag.item_8.id == ItemId::LinenGloves,
            "wrong item8 id. expected {:?}, actual {:?}",
            ItemId::LinenGloves,
            verbose_bag.item_8.id,
        );
        assert!(verbose_bag.item_8.xp == 80, "wrong item8 xp. expected 80, actual {:?}", verbose_bag.item_8.xp);
        assert!(
            verbose_bag.item_8.name == 'Linen Gloves',
            "wrong item8 name. expected {:?}, actual {:?}",
            'LinenGloves',
            verbose_bag.item_8.name,
        );
        assert(verbose_bag.item_8.tier == Tier::T4, 'wrong item8 tier');
        assert(verbose_bag.item_8.item_type == Type::Magic_or_Cloth, 'wrong item8 type');
        assert(verbose_bag.item_8.slot == Slot::Hand, 'wrong item8 slot');

        assert!(
            verbose_bag.item_9.id == ItemId::Crown,
            "wrong item9 id. expected {:?}, actual {:?}",
            ItemId::Crown,
            verbose_bag.item_9.id,
        );
        assert!(verbose_bag.item_9.xp == 150, "wrong item9 xp. expected 150, actual {:?}", verbose_bag.item_9.xp);
        assert!(
            verbose_bag.item_9.name == 'Crown',
            "wrong item9 name. expected {:?}, actual {:?}",
            'Crown',
            verbose_bag.item_9.name,
        );
        assert(verbose_bag.item_9.tier == Tier::T1, 'wrong item9 tier');
        assert(verbose_bag.item_9.item_type == Type::Magic_or_Cloth, 'wrong item9 type');
        assert(verbose_bag.item_9.slot == Slot::Head, 'wrong item9 slot');

        assert!(
            verbose_bag.item_10.id == ItemId::DivineSlippers,
            "wrong item10 id. expected {:?}, actual {:?}",
            ItemId::DivineSlippers,
            verbose_bag.item_10.id,
        );
        assert!(verbose_bag.item_10.xp == 250, "wrong item10 xp. expected 250, actual {:?}", verbose_bag.item_10.xp);
        assert!(
            verbose_bag.item_10.name == 'Divine Slippers',
            "wrong item10 name. expected {:?}, actual {:?}",
            'DivineSlippers',
            verbose_bag.item_10.name,
        );
        assert(verbose_bag.item_10.tier == Tier::T1, 'wrong item10 tier');
        assert(verbose_bag.item_10.item_type == Type::Magic_or_Cloth, 'wrong item10 type');
        assert(verbose_bag.item_10.slot == Slot::Foot, 'wrong item10 slot');

        assert!(
            verbose_bag.item_11.id == ItemId::Warhammer,
            "wrong item11 id. expected {:?}, actual {:?}",
            ItemId::Warhammer,
            verbose_bag.item_11.id,
        );
        assert!(verbose_bag.item_11.xp == 350, "wrong item11 xp. expected 350, actual {:?}", verbose_bag.item_11.xp);
        assert!(
            verbose_bag.item_11.name == 'Warhammer',
            "wrong item11 name. expected {:?}, actual {:?}",
            'Warhammer',
            verbose_bag.item_11.name,
        );
        assert(verbose_bag.item_11.tier == Tier::T1, 'wrong item11 tier');
        assert(verbose_bag.item_11.item_type == Type::Bludgeon_or_Metal, 'wrong item11 type');
        assert(verbose_bag.item_11.slot == Slot::Weapon, 'wrong item11 slot');

        assert!(
            verbose_bag.item_12.id == ItemId::Quarterstaff,
            "wrong item12 id. expected {:?}, actual {:?}",
            ItemId::Quarterstaff,
            verbose_bag.item_12.id,
        );
        assert!(verbose_bag.item_12.xp == 450, "wrong item12 xp. expected 450, actual {:?}", verbose_bag.item_12.xp);
        assert!(
            verbose_bag.item_12.name == 'Quarterstaff',
            "wrong item12 name. expected {:?}, actual {:?}",
            'Quarterstaff',
            verbose_bag.item_12.name,
        );
        assert(verbose_bag.item_12.tier == Tier::T2, 'wrong item12 tier');
        assert(verbose_bag.item_12.item_type == Type::Bludgeon_or_Metal, 'wrong item12 type');
        assert(verbose_bag.item_12.slot == Slot::Weapon, 'wrong item12 slot');

        assert!(
            verbose_bag.item_13.id == ItemId::Amulet,
            "wrong item13 id. expected {:?}, actual {:?}",
            ItemId::Amulet,
            verbose_bag.item_13.id,
        );
        assert!(verbose_bag.item_13.xp == 130, "wrong item13 xp. expected 130, actual {:?}", verbose_bag.item_13.xp);
        assert!(
            verbose_bag.item_13.name == 'Amulet',
            "wrong item13 name. expected {:?}, actual {:?}",
            'Amulet',
            verbose_bag.item_13.name,
        );
        assert(verbose_bag.item_13.tier == Tier::T1, 'wrong item13 tier');
        assert(verbose_bag.item_13.item_type == Type::Necklace, 'wrong item13 type');
        assert(verbose_bag.item_13.slot == Slot::Neck, 'wrong item13 slot');

        assert!(
            verbose_bag.item_14.id == ItemId::BronzeRing,
            "wrong item14 id. expected {:?}, actual {:?}",
            ItemId::BronzeRing,
            verbose_bag.item_14.id,
        );
        assert!(verbose_bag.item_14.xp == 225, "wrong item14 xp. expected 225, actual {:?}", verbose_bag.item_14.xp);
        assert!(
            verbose_bag.item_14.name == 'Bronze Ring',
            "wrong item14 name. expected {:?}, actual {:?}",
            'BronzeRing',
            verbose_bag.item_14.name,
        );
        assert(verbose_bag.item_14.tier == Tier::T3, 'wrong item14 tier');
        assert(verbose_bag.item_14.item_type == Type::Ring, 'wrong item14 type');
        assert(verbose_bag.item_14.slot == Slot::Ring, 'wrong item14 slot');

        assert!(
            verbose_bag.item_15.id == ItemId::Pendant,
            "wrong item15 id. expected {:?}, actual {:?}",
            ItemId::Pendant,
            verbose_bag.item_15.id,
        );
        assert!(verbose_bag.item_15.xp == 150, "wrong item15 xp. expected 150, actual {:?}", verbose_bag.item_15.xp);
        assert!(
            verbose_bag.item_15.name == 'Pendant',
            "wrong item15 name. expected {:?}, actual {:?}",
            'Pendant',
            verbose_bag.item_15.name,
        );
        assert(verbose_bag.item_15.tier == Tier::T1, 'wrong item15 tier');
        assert(verbose_bag.item_15.item_type == Type::Necklace, 'wrong item15 type');
        assert(verbose_bag.item_15.slot == Slot::Neck, 'wrong item15 slot');
    }

    #[test]
    fn test_bag_into_bag_verbose_partial_bag() {
        let partial_bag = Bag {
            item_1: Item { id: ItemId::Katana, xp: 10 },
            item_2: Item { id: ItemId::Crown, xp: 20 },
            item_3: Item { id: ItemId::SilverRing, xp: 30 },
            item_4: Item { id: 0, xp: 0 },
            item_5: Item { id: 0, xp: 0 },
            item_6: Item { id: ItemId::LeatherGloves, xp: 60 },
            item_7: Item { id: 0, xp: 0 },
            item_8: Item { id: 0, xp: 0 },
            item_9: Item { id: ItemId::GhostWand, xp: 90 },
            item_10: Item { id: 0, xp: 0 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: ItemId::Amulet, xp: 130 },
            item_14: Item { id: ItemId::Pendant, xp: 150 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };

        let verbose_bag: BagVerbose = partial_bag.into();

        assert!(
            verbose_bag.item_1.id == ItemId::Katana,
            "wrong item1 id. expected {:?}, actual {:?}",
            ItemId::Katana,
            verbose_bag.item_1.id,
        );
        assert!(verbose_bag.item_1.xp == 10, "wrong item1 xp. expected 10, actual {:?}", verbose_bag.item_1.xp);
        assert!(
            verbose_bag.item_1.name == 'Katana',
            "wrong item1 name. expected {:?}, actual {:?}",
            'Katana',
            verbose_bag.item_1.name,
        );
        assert(verbose_bag.item_1.tier == Tier::T1, 'wrong item1 tier');
        assert(verbose_bag.item_1.item_type == Type::Blade_or_Hide, 'wrong item1 type');
        assert(verbose_bag.item_1.slot == Slot::Weapon, 'wrong item1 slot');

        assert!(
            verbose_bag.item_2.id == ItemId::Crown,
            "wrong item2 id. expected {:?}, actual {:?}",
            ItemId::Crown,
            verbose_bag.item_2.id,
        );
        assert!(verbose_bag.item_2.xp == 20, "wrong item2 xp. expected 20, actual {:?}", verbose_bag.item_2.xp);
        assert!(
            verbose_bag.item_2.name == 'Crown',
            "wrong item2 name. expected {:?}, actual {:?}",
            'Crown',
            verbose_bag.item_2.name,
        );
        assert(verbose_bag.item_2.tier == Tier::T1, 'wrong item2 tier');
        assert(verbose_bag.item_2.item_type == Type::Magic_or_Cloth, 'wrong item2 type');
        assert(verbose_bag.item_2.slot == Slot::Head, 'wrong item2 slot');

        assert!(
            verbose_bag.item_3.id == ItemId::SilverRing,
            "wrong item3 id. expected {:?}, actual {:?}",
            ItemId::SilverRing,
            verbose_bag.item_3.id,
        );
        assert!(verbose_bag.item_3.xp == 30, "wrong item3 xp. expected 30, actual {:?}", verbose_bag.item_3.xp);
        assert!(
            verbose_bag.item_3.name == 'Silver Ring',
            "wrong item3 name. expected {:?}, actual {:?}",
            'SilverRing',
            verbose_bag.item_3.name,
        );
        assert(verbose_bag.item_3.tier == Tier::T2, 'wrong item3 tier');
        assert(verbose_bag.item_3.item_type == Type::Ring, 'wrong item3 type');
        assert(verbose_bag.item_3.slot == Slot::Ring, 'wrong item3 slot');

        assert!(verbose_bag.item_4.id == 0, "wrong item4 id. expected {:?}, actual {:?}", 0, verbose_bag.item_4.id);
        assert!(verbose_bag.item_4.xp == 0, "wrong item4 xp. expected 0, actual {:?}", verbose_bag.item_4.xp);
        assert!(
            verbose_bag.item_4.name == 0, "wrong item4 name. expected {:?}, actual {:?}", 0, verbose_bag.item_4.name,
        );
        assert(verbose_bag.item_4.tier == Tier::None, 'wrong item4 tier');
        assert(verbose_bag.item_4.item_type == Type::None, 'wrong item4 type');
        assert(verbose_bag.item_4.slot == Slot::None, 'wrong item4 slot');

        assert!(verbose_bag.item_5.id == 0, "wrong item5 id. expected {:?}, actual {:?}", 0, verbose_bag.item_5.id);
        assert!(verbose_bag.item_5.xp == 0, "wrong item5 xp. expected 0, actual {:?}", verbose_bag.item_5.xp);
        assert!(
            verbose_bag.item_5.name == 0, "wrong item5 name. expected {:?}, actual {:?}", 0, verbose_bag.item_5.name,
        );
        assert(verbose_bag.item_5.tier == Tier::None, 'wrong item5 tier');
        assert(verbose_bag.item_5.item_type == Type::None, 'wrong item5 type');
        assert(verbose_bag.item_5.slot == Slot::None, 'wrong item5 slot');

        assert!(
            verbose_bag.item_6.id == ItemId::LeatherGloves,
            "wrong item6 id. expected {:?}, actual {:?}",
            ItemId::LeatherGloves,
            verbose_bag.item_6.id,
        );
        assert!(verbose_bag.item_6.xp == 60, "wrong item6 xp. expected 60, actual {:?}", verbose_bag.item_6.xp);
        assert!(
            verbose_bag.item_6.name == 'Leather Gloves',
            "wrong item6 name. expected {:?}, actual {:?}",
            'LeatherGloves',
            verbose_bag.item_6.name,
        );
        assert(verbose_bag.item_6.tier == Tier::T5, 'wrong item6 tier');
        assert(verbose_bag.item_6.item_type == Type::Blade_or_Hide, 'wrong item6 type');
        assert(verbose_bag.item_6.slot == Slot::Hand, 'wrong item6 slot');

        assert!(verbose_bag.item_7.id == 0, "wrong item7 id. expected {:?}, actual {:?}", 0, verbose_bag.item_7.id);
        assert!(verbose_bag.item_7.xp == 0, "wrong item7 xp. expected 0, actual {:?}", verbose_bag.item_7.xp);
        assert!(
            verbose_bag.item_7.name == 0, "wrong item7 name. expected {:?}, actual {:?}", 0, verbose_bag.item_7.name,
        );
        assert(verbose_bag.item_7.tier == Tier::None, 'wrong item7 tier');
        assert(verbose_bag.item_7.item_type == Type::None, 'wrong item7 type');
        assert(verbose_bag.item_7.slot == Slot::None, 'wrong item7 slot');

        assert!(verbose_bag.item_8.id == 0, "wrong item8 id. expected {:?}, actual {:?}", 0, verbose_bag.item_8.id);
        assert!(verbose_bag.item_8.xp == 0, "wrong item8 xp. expected 0, actual {:?}", verbose_bag.item_8.xp);
        assert!(
            verbose_bag.item_8.name == 0, "wrong item8 name. expected {:?}, actual {:?}", 0, verbose_bag.item_8.name,
        );
        assert(verbose_bag.item_8.tier == Tier::None, 'wrong item8 tier');
        assert(verbose_bag.item_8.item_type == Type::None, 'wrong item8 type');
        assert(verbose_bag.item_8.slot == Slot::None, 'wrong item8 slot');

        assert!(
            verbose_bag.item_9.id == ItemId::GhostWand,
            "wrong item9 id. expected {:?}, actual {:?}",
            ItemId::GhostWand,
            verbose_bag.item_9.id,
        );
        assert!(verbose_bag.item_9.xp == 90, "wrong item9 xp. expected 90, actual {:?}", verbose_bag.item_9.xp);
        assert!(
            verbose_bag.item_9.name == 'Ghost Wand',
            "wrong item9 name. expected {:?}, actual {:?}",
            'GhostWand',
            verbose_bag.item_9.name,
        );
        assert(verbose_bag.item_9.tier == Tier::T1, 'wrong item9 tier');
        assert(verbose_bag.item_9.item_type == Type::Magic_or_Cloth, 'wrong item9 type');
        assert(verbose_bag.item_9.slot == Slot::Weapon, 'wrong item9 slot');

        assert!(verbose_bag.item_10.id == 0, "wrong item10 id. expected {:?}, actual {:?}", 0, verbose_bag.item_10.id);
        assert!(verbose_bag.item_10.xp == 0, "wrong item10 xp. expected 0, actual {:?}", verbose_bag.item_10.xp);
        assert!(
            verbose_bag.item_10.name == 0, "wrong item10 name. expected {:?}, actual {:?}", 0, verbose_bag.item_10.name,
        );
        assert(verbose_bag.item_10.tier == Tier::None, 'wrong item10 tier');
        assert(verbose_bag.item_10.item_type == Type::None, 'wrong item10 type');
        assert(verbose_bag.item_10.slot == Slot::None, 'wrong item10 slot');

        assert!(verbose_bag.item_11.id == 0, "wrong item11 id. expected {:?}, actual {:?}", 0, verbose_bag.item_11.id);
        assert!(verbose_bag.item_11.xp == 0, "wrong item11 xp. expected 0, actual {:?}", verbose_bag.item_11.xp);
        assert!(
            verbose_bag.item_11.name == 0, "wrong item11 name. expected {:?}, actual {:?}", 0, verbose_bag.item_11.name,
        );
        assert(verbose_bag.item_11.tier == Tier::None, 'wrong item11 tier');
        assert(verbose_bag.item_11.item_type == Type::None, 'wrong item11 type');
        assert(verbose_bag.item_11.slot == Slot::None, 'wrong item11 slot');

        assert!(verbose_bag.item_12.id == 0, "wrong item12 id. expected {:?}, actual {:?}", 0, verbose_bag.item_12.id);
        assert!(verbose_bag.item_12.xp == 0, "wrong item12 xp. expected 0, actual {:?}", verbose_bag.item_12.xp);
        assert!(
            verbose_bag.item_12.name == 0, "wrong item12 name. expected {:?}, actual {:?}", 0, verbose_bag.item_12.name,
        );
        assert(verbose_bag.item_12.tier == Tier::None, 'wrong item12 tier');
        assert(verbose_bag.item_12.item_type == Type::None, 'wrong item12 type');
        assert(verbose_bag.item_12.slot == Slot::None, 'wrong item12 slot');

        assert!(
            verbose_bag.item_13.id == ItemId::Amulet,
            "wrong item13 id. expected {:?}, actual {:?}",
            ItemId::Amulet,
            verbose_bag.item_13.id,
        );
        assert!(verbose_bag.item_13.xp == 130, "wrong item13 xp. expected 130, actual {:?}", verbose_bag.item_13.xp);
        assert!(
            verbose_bag.item_13.name == 'Amulet',
            "wrong item13 name. expected {:?}, actual {:?}",
            'Amulet',
            verbose_bag.item_13.name,
        );
        assert(verbose_bag.item_13.tier == Tier::T1, 'wrong item13 tier');
        assert(verbose_bag.item_13.item_type == Type::Necklace, 'wrong item13 type');
        assert(verbose_bag.item_13.slot == Slot::Neck, 'wrong item13 slot');

        assert!(
            verbose_bag.item_14.id == ItemId::Pendant,
            "wrong item14 id. expected {:?}, actual {:?}",
            ItemId::Pendant,
            verbose_bag.item_14.id,
        );
        assert!(verbose_bag.item_14.xp == 150, "wrong item14 xp. expected 150, actual {:?}", verbose_bag.item_14.xp);
        assert!(
            verbose_bag.item_14.name == 'Pendant',
            "wrong item14 name. expected {:?}, actual {:?}",
            'Pendant',
            verbose_bag.item_14.name,
        );
        assert(verbose_bag.item_14.tier == Tier::T1, 'wrong item14 tier');
        assert(verbose_bag.item_14.item_type == Type::Necklace, 'wrong item14 type');
        assert(verbose_bag.item_14.slot == Slot::Neck, 'wrong item14 slot');

        assert!(verbose_bag.item_15.id == 0, "wrong item15 id. expected {:?}, actual {:?}", 0, verbose_bag.item_15.id);
        assert!(verbose_bag.item_15.xp == 0, "wrong item15 xp. expected 0, actual {:?}", verbose_bag.item_15.xp);
        assert!(
            verbose_bag.item_15.name == 0, "wrong item15 name. expected {:?}, actual {:?}", 0, verbose_bag.item_15.name,
        );
        assert(verbose_bag.item_15.tier == Tier::None, 'wrong item15 tier');
        assert(verbose_bag.item_15.item_type == Type::None, 'wrong item15 type');
        assert(verbose_bag.item_15.slot == Slot::None, 'wrong item15 slot');
    }
}
