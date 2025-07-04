// ---------------------------
// ---------- Tests ----------
// ---------------------------
#[cfg(test)]
mod tests {
    use death_mountain::constants::combat::CombatEnums::{Tier};
    use death_mountain::constants::loot::{ItemId, NUM_ITEMS};
    use death_mountain::constants::market::{TIER_PRICE};
    use death_mountain::models::market::ImplMarket;
    const TEST_MARKET_SEED: u256 = 515;
    const TEST_OFFSET: u8 = 3;

    #[test]
    fn is_item_available() {
        let mut market_inventory = ArrayTrait::<u8>::new();
        market_inventory.append(ItemId::Wand);
        market_inventory.append(ItemId::Book);
        market_inventory.append(ItemId::Katana);
        market_inventory.append(ItemId::GhostWand);
        market_inventory.append(ItemId::DivineHood);
        market_inventory.append(ItemId::DivineSlippers);
        market_inventory.append(ItemId::DivineGloves);
        market_inventory.append(ItemId::ShortSword);
        market_inventory.append(ItemId::GoldRing);
        market_inventory.append(ItemId::Necklace);
        let mut market_inventory_span = market_inventory.span();
        assert(ImplMarket::is_item_available(ref market_inventory_span, ItemId::Katana), 'item should be available');
    }

    #[test]
    #[available_gas(34000000)]
    fn get_id() {
        // test lower end of u64
        let mut i: u64 = 0;
        loop {
            if (i == 999) {
                break;
            }
            // get market item id
            let item_id = ImplMarket::get_id(i);
            // assert item id is within range of items
            assert(item_id != 0 && item_id <= NUM_ITEMS, 'offset out of bounds');
            i += 1;
        };

        // test upper end of u64
        let mut i: u64 = 0xffffffffffffff0f;
        loop {
            if (i == 0xffffffffffffffff) {
                break;
            }
            // get market item id
            let item_id = ImplMarket::get_id(i);
            // assert item id is within range of items
            assert(item_id != 0 && item_id <= NUM_ITEMS, 'offset out of bounds');
            i += 1;
        };
    }

    #[test]
    #[available_gas(50000)]
    fn get_price() {
        let t1_price = ImplMarket::get_price(Tier::T1(()));
        assert(t1_price == (6 - 1) * TIER_PRICE, 't1 price');

        let t2_price = ImplMarket::get_price(Tier::T2(()));
        assert(t2_price == (6 - 2) * TIER_PRICE, 't2 price');

        let t3_price = ImplMarket::get_price(Tier::T3(()));
        assert(t3_price == (6 - 3) * TIER_PRICE, 't3 price');

        let t4_price = ImplMarket::get_price(Tier::T4(()));
        assert(t4_price == (6 - 4) * TIER_PRICE, 't4 price');

        let t5_price = ImplMarket::get_price(Tier::T5(()));
        assert(t5_price == (6 - 5) * TIER_PRICE, 't5 price');
    }

    #[test]
    fn get_available_items_check_duplicates() {
        let market_seed = 12345;
        let market_size = 100;

        // get items from the market
        let market_items = ImplMarket::get_available_items(market_seed, market_size);

        // iterate over the items
        let mut item_index = 0;
        loop {
            if item_index == market_items.len() {
                break;
            }
            let item = *market_items.at(item_index);
            let market_items_clone = market_items.clone();

            // and verify the item is not a duplicate
            let mut duplicate_check_index = item_index + 1;
            loop {
                if duplicate_check_index == market_items_clone.len() {
                    break;
                }
                assert(item != *market_items_clone.at(duplicate_check_index), 'duplicate item id');
                duplicate_check_index += 1;
            };
            item_index += 1;
        };
    }

    #[test]
    #[available_gas(4500000)]
    fn get_available_items_count() {
        let market_seed = 12345;
        let mut market_size = 1;

        let inventory = ImplMarket::get_available_items(market_seed, market_size);
        assert(inventory.len() == market_size.into(), 'inventory size should be 1');

        market_size = 2;
        let inventory = ImplMarket::get_available_items(market_seed, market_size);
        assert(inventory.len() == market_size.into(), 'inventory size should be 2');

        market_size = 10;
        let inventory = ImplMarket::get_available_items(market_seed, market_size);
        assert(inventory.len() == market_size.into(), 'inventory size should be 10');

        market_size = 100;
        let inventory = ImplMarket::get_available_items(market_seed, market_size);
        assert(inventory.len() == market_size.into(), 'inventory size should be 100');

        // test max u8 market size
        // should return all items which is 101 (NUM_ITEMS)
        market_size = 255;
        let inventory = ImplMarket::get_available_items(market_seed, market_size);
        assert(inventory.len() == NUM_ITEMS.into(), 'inventory size should be 101');
    }

    #[test]
    #[available_gas(15500000)]
    fn get_available_items_ownership() {
        let market_seed = 12345;
        let market_size = 21;

        let inventory = @ImplMarket::get_available_items(market_seed, market_size);
        assert(inventory.len() == market_size.into(), 'incorrect number of items');

        // iterate over the items on the market
        let mut item_count: u32 = 0;
        loop {
            if item_count == market_size.into() {
                break ();
            }

            // get item id and assert it's within range
            let item_id = *inventory.at(item_count.into());
            assert(item_id != 0 && item_id <= NUM_ITEMS, 'item id out of range');

            let mut inventory_span = inventory.span();

            // assert item is available on the market
            assert(ImplMarket::is_item_available(ref inventory_span, item_id), 'item');

            item_count += 1;
        };
    }

    #[test]
    #[available_gas(8000000)]
    fn get_available_items_ownership_multi_level8() {
        let market_seed = 12345;
        let market_size = 255;

        let inventory = @ImplMarket::get_available_items(market_seed, market_size);
        println!("inventory len: {}", inventory.len());
        assert(inventory.len() == NUM_ITEMS.into(), 'incorrect number of items');

        // iterate over the items on the market
        let mut item_count: u32 = 0;
        loop {
            if item_count == inventory.len() {
                break ();
            }

            // get item id and assert it's within range
            let item_id = *inventory.at(item_count);
            assert(item_id != 0 && item_id <= NUM_ITEMS, 'item id out of range');

            let mut inventory_span = inventory.span();

            // assert item is available on the market
            assert(ImplMarket::is_item_available(ref inventory_span, item_id), 'item should be available');

            item_count += 1;
        };
    }

    #[test]
    fn get_market_seed_and_offset() {
        let mut i: u8 = 1;
        loop {
            if (i == 255) {
                break;
            }
            let adventurer_entropy = 1;

            let (_, market_offset) = ImplMarket::get_market_seed_and_offset(adventurer_entropy);

            // assert market offset is within range of items
            assert(market_offset != 0 && market_offset < NUM_ITEMS, 'offset out of bounds');
            i += 1;
        };
    }

    #[test]
    fn get_all_items() {
        let items = ImplMarket::get_all_items();
        assert(items.len() == NUM_ITEMS.into(), 'incorrect number of items');
        // verify item array contains numbers 1 through 101
        let mut item_count: u32 = 0;
        loop {
            if item_count == NUM_ITEMS.into() {
                break;
            }
            let item_id = *items.at(item_count);
            assert(item_id.into() == item_count + 1, 'item id out of range');
            item_count += 1;
        };
    }

    #[test]
    fn unique_market() {
        // loop from 0 to 255 and get the market seed and offset
        let mut i: u64 = 0;
        loop {
            if (i > 101) {
                break;
            }
            let seed: u64 = i;
            let (market_seed, offset) = ImplMarket::get_market_seed_and_offset(seed);
            let item1 = ImplMarket::get_id(market_seed);
            let item2 = ImplMarket::get_id(market_seed + offset.into());
            let item3 = ImplMarket::get_id(market_seed + (offset.into() * 2));
            let item4 = ImplMarket::get_id(market_seed + (offset.into() * 3));

            // assert items are different
            assert(item1 != item2, 'item1 and item2 are same');
            assert(item1 != item3, 'item1 and item3 are same');
            assert(item1 != item4, 'item1 and item4 are same');
            assert(item2 != item3, 'item2 and item3 are same');
            assert(item2 != item4, 'item2 and item4 are same');
            assert(item3 != item4, 'item3 and item4 are same');

            // increment i
            i += 1;
        };
    }
}
