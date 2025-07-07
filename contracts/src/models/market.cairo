// a randomised deterministic marketplace
use core::integer::u64_safe_divmod;
use death_mountain::constants::combat::CombatEnums::Tier;
use death_mountain::constants::loot::{NUM_ITEMS, NUM_ITEMS_NZ_MINUS_ONE};
use death_mountain::constants::market::{NUMBER_OF_ITEMS_PER_LEVEL, TIER_PRICE};

// Legacy struct for backward compatibility
#[derive(Introspect, Copy, Drop, Serde)]
pub struct ItemPurchase {
    pub item_id: u8,
    pub equip: bool,
}

// New struct for index-based purchasing
#[derive(Introspect, Copy, Drop, Serde)]
pub struct ItemPurchaseV2 {
    pub item_index: u8,  // Index into game's item_set (0-127)
    pub equip: bool,
}

// @dev: While we could abstract the loop in many of the functions of this class
//       we intentionally don't to provide maximum gas efficieny. For example, we could
//       provide a 'get_market_item_ids' and then have the other functions iterate over that
//       array, but that would require an additional loop and additional gas. Perhaps one of you
//       reading this will be able to find a way to abstract the loop without incurring additional
//       gas costs. If so, I look forward to seeing the associated pull request. Cheers.
#[generate_trait]
pub impl ImplMarket of IMarket {
    // @notice Retrieves the price associated with an item tier.
    // @param tier - A Tier enum indicating the item tier.
    // @return The price as an unsigned 16-bit integer.
    fn get_price(tier: Tier) -> u16 {
        match tier {
            Tier::None(()) => 0,
            Tier::T1(()) => 5 * TIER_PRICE,
            Tier::T2(()) => 4 * TIER_PRICE,
            Tier::T3(()) => 3 * TIER_PRICE,
            Tier::T4(()) => 2 * TIER_PRICE,
            Tier::T5(()) => 1 * TIER_PRICE,
        }
    }

    /// @notice Returns an array of items that are available on the market.
    /// @param seed The seed to be divided.
    /// @param market_size The size of the market.
    /// @return An array of items that are available on the market.
    fn get_available_items(seed: u64, market_size: u8) -> Array<u8> {
        if market_size >= NUM_ITEMS {
            return Self::get_all_items();
        }

        let (seed, offset) = Self::get_market_seed_and_offset(seed);

        let mut all_items = ArrayTrait::<u8>::new();
        let mut item_count: u16 = 0;
        loop {
            if item_count == market_size.into() {
                break;
            } else {
                let item_id = Self::get_id(seed + (offset.into() * item_count).into());
                all_items.append(item_id);
                item_count += 1;
            }
        };

        all_items
    }

    /// @notice Returns the size of the market.
    /// @return The size of the market as an unsigned 8-bit integer.
    fn get_market_size() -> u8 {
        NUMBER_OF_ITEMS_PER_LEVEL
    }

    /// @notice Gets a u8 item id from a u64 seed
    /// @param seed a u64 representing a unique seed.
    /// @return a u8 representing the item ID.
    fn get_id(seed: u64) -> u8 {
        (seed % NUM_ITEMS.into()).try_into().unwrap() + 1
    }

    /// @notice Checks if an item is available on the market
    /// @param inventory The inventory of the market
    /// @param item_id The item id to check for availability
    /// @return A boolean indicating if the item is available on the market.
    fn is_item_available(ref inventory: Span<u8>, item_id: u8) -> bool {
        if inventory.len() < NUM_ITEMS.into() {
            loop {
                match inventory.pop_front() {
                    Option::Some(market_item_id) => { if item_id == *market_item_id {
                        break true;
                    } },
                    Option::None(_) => { break false; },
                };
            }
        } else {
            true
        }
    }

    fn get_all_items() -> Array<u8> {
        let mut all_items = ArrayTrait::<u8>::new();
        all_items.append(1);
        all_items.append(2);
        all_items.append(3);
        all_items.append(4);
        all_items.append(5);
        all_items.append(6);
        all_items.append(7);
        all_items.append(8);
        all_items.append(9);
        all_items.append(10);
        all_items.append(11);
        all_items.append(12);
        all_items.append(13);
        all_items.append(14);
        all_items.append(15);
        all_items.append(16);
        all_items.append(17);
        all_items.append(18);
        all_items.append(19);
        all_items.append(20);
        all_items.append(21);
        all_items.append(22);
        all_items.append(23);
        all_items.append(24);
        all_items.append(25);
        all_items.append(26);
        all_items.append(27);
        all_items.append(28);
        all_items.append(29);
        all_items.append(30);
        all_items.append(31);
        all_items.append(32);
        all_items.append(33);
        all_items.append(34);
        all_items.append(35);
        all_items.append(36);
        all_items.append(37);
        all_items.append(38);
        all_items.append(39);
        all_items.append(40);
        all_items.append(41);
        all_items.append(42);
        all_items.append(43);
        all_items.append(44);
        all_items.append(45);
        all_items.append(46);
        all_items.append(47);
        all_items.append(48);
        all_items.append(49);
        all_items.append(50);
        all_items.append(51);
        all_items.append(52);
        all_items.append(53);
        all_items.append(54);
        all_items.append(55);
        all_items.append(56);
        all_items.append(57);
        all_items.append(58);
        all_items.append(59);
        all_items.append(60);
        all_items.append(61);
        all_items.append(62);
        all_items.append(63);
        all_items.append(64);
        all_items.append(65);
        all_items.append(66);
        all_items.append(67);
        all_items.append(68);
        all_items.append(69);
        all_items.append(70);
        all_items.append(71);
        all_items.append(72);
        all_items.append(73);
        all_items.append(74);
        all_items.append(75);
        all_items.append(76);
        all_items.append(77);
        all_items.append(78);
        all_items.append(79);
        all_items.append(80);
        all_items.append(81);
        all_items.append(82);
        all_items.append(83);
        all_items.append(84);
        all_items.append(85);
        all_items.append(86);
        all_items.append(87);
        all_items.append(88);
        all_items.append(89);
        all_items.append(90);
        all_items.append(91);
        all_items.append(92);
        all_items.append(93);
        all_items.append(94);
        all_items.append(95);
        all_items.append(96);
        all_items.append(97);
        all_items.append(98);
        all_items.append(99);
        all_items.append(100);
        all_items.append(101);
        all_items
    }

    /// @notice This function takes in a seed and returns a market seed and offset.
    /// @dev The seed is divided by the number of items to get the market seed and the remainder is
    /// the offset.
    /// @param seed The seed to be divided.
    /// @return A tuple where the first element is a u64 representing the market seed and the second
    /// element is a u8 representing the market offset.1
    fn get_market_seed_and_offset(seed: u64) -> (u64, u8) {
        let (seed, offset) = u64_safe_divmod(seed, NUM_ITEMS_NZ_MINUS_ONE);
        (seed, 1 + offset.try_into().unwrap())
    }

    // ============ New index-based functions for item_set support ============

    /// @notice Gets available item indices based on game's item_set
    /// @param item_set The game's curated list of items
    /// @param seed The market seed
    /// @param market_size The size of the market
    /// @return Array of indices (0-127) that point to positions in item_set
    fn get_available_item_indices(
        item_set: Span<u64>, 
        seed: u64, 
        market_size: u8
    ) -> Array<u8> {
        let item_count = item_set.len();
        if item_count == 0 {
            return ArrayTrait::new();
        }
        
        // If market size >= item_set size, return all indices
        if market_size >= item_count.try_into().unwrap() {
            let mut all_indices = ArrayTrait::<u8>::new();
            let mut i: u8 = 0;
            loop {
                if i >= item_count.try_into().unwrap() {
                    break;
                }
                all_indices.append(i);
                i += 1;
            };
            return all_indices;
        }

        // Otherwise, use seed to select random indices
        let mut indices = ArrayTrait::<u8>::new();
        let mut i = 0;
        loop {
            if i >= market_size {
                break;
            }
            // Use seed + i to get random index
            let index = ((seed + i.into()) % item_count.into()).try_into().unwrap();
            indices.append(index);
            i += 1;
        };
        
        indices
    }
    
    /// @notice Checks if item index is available in current market
    /// @param inventory Array of available indices
    /// @param item_index The index to check
    /// @return true if index is available
    fn is_item_index_available(ref inventory: Span<u8>, item_index: u8) -> bool {
        loop {
            match inventory.pop_front() {
                Option::Some(index) => {
                    if *index == item_index {
                        break true;
                    }
                },
                Option::None(_) => { break false; },
            };
        }
    }
    
    /// @notice Gets actual item ID from index and item_set
    /// @param item_set The game's item_set
    /// @param item_index The index to convert
    /// @return Option containing the item ID, or None if index out of bounds
    fn get_item_id_from_index(
        item_set: Span<u64>, 
        item_index: u8
    ) -> Option<u64> {
        if item_index >= item_set.len().try_into().unwrap() {
            return Option::None;
        }
        Option::Some(*item_set.at(item_index.into()))
    }
}
