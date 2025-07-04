// ---------------------------
// ---------- Tests ----------
// ---------------------------
#[cfg(test)]
mod tests {
    use death_mountain::constants::loot::ItemId;
    use death_mountain::models::adventurer::item::{
        IItemPrimitive, ImplItem, Item, MAX_PACKABLE_ITEM_ID, MAX_PACKABLE_XP,
    };

    #[test]
    fn item_packing() {
        // zero case
        let item = Item { id: 0, xp: 0 };
        let unpacked = ImplItem::unpack(item.pack());
        assert(item.id == unpacked.id, 'id should be the same');
        assert(item.xp == unpacked.xp, 'xp should be the same');

        let item = Item { id: 1, xp: 2 };
        let unpacked = ImplItem::unpack(item.pack());
        assert(item.id == unpacked.id, 'id should be the same');
        assert(item.xp == unpacked.xp, 'xp should be the same');

        // max value case
        let item = Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP };
        let unpacked = ImplItem::unpack(item.pack());
        assert(item.id == unpacked.id, 'id should be the same');
        assert(item.xp == unpacked.xp, 'xp should be the same');
    }

    #[test]
    #[should_panic(expected: ('item id pack overflow',))]
    fn item_packing_id_overflow() {
        // attempt to save item with id above pack limit
        let item = Item { id: MAX_PACKABLE_ITEM_ID + 1, xp: MAX_PACKABLE_XP };
        ImplItem::unpack(item.pack());
    }

    #[test]
    #[should_panic(expected: ('item xp pack overflow',))]
    fn item_packing_xp_overflow() {
        // attempt to save item with xp above pack limit
        let item = Item { id: MAX_PACKABLE_ITEM_ID, xp: MAX_PACKABLE_XP + 1 };
        ImplItem::unpack(item.pack());
    }

    #[test]
    #[available_gas(2900)]
    fn is_jewlery_simple() {
        assert(!ImplItem::new(ItemId::Book).is_jewlery(), 'should not be jewlery');
    }

    #[test]
    fn is_jewlery() {
        let mut item_index = 1;
        loop {
            if item_index == 102 {
                break;
            }

            if (item_index == ItemId::BronzeRing
                || item_index == ItemId::SilverRing
                || item_index == ItemId::GoldRing
                || item_index == ItemId::PlatinumRing
                || item_index == ItemId::TitaniumRing
                || item_index == ItemId::Necklace
                || item_index == ItemId::Amulet
                || item_index == ItemId::Pendant) {
                assert(ImplItem::new(item_index).is_jewlery(), 'should be jewlery')
            } else {
                assert(!ImplItem::new(item_index).is_jewlery(), 'should not be jewlery');
            }

            item_index += 1;
        };
    }

    #[test]
    #[available_gas(9000)]
    fn new_item() {
        // zero case
        let item = IItemPrimitive::new(0);
        assert(item.id == 0, 'id should be 0');
        assert(item.xp == 0, 'xp should be 0');

        // base case
        let item = IItemPrimitive::new(1);
        assert(item.id == 1, 'id should be 1');
        assert(item.xp == 0, 'xp should be 0');

        // max u8 case
        let item = IItemPrimitive::new(255);
        assert(item.id == 255, 'id should be 255');
        assert(item.xp == 0, 'xp should be 0');
    }

    #[test]
    #[available_gas(70320)]
    fn get_greatness() {
        let mut item = Item { id: 1, xp: 0 };
        // test 0 case (should be level 1)
        let greatness = item.get_greatness();
        assert(greatness == 1, 'greatness should be 1');

        // test level 1
        item.xp = 1;
        let greatness = item.get_greatness();
        assert(greatness == 1, 'greatness should be 1');

        // test level 2
        item.xp = 4;
        let greatness = item.get_greatness();
        assert(greatness == 2, 'greatness should be 2');

        // test level 3
        item.xp = 9;
        let greatness = item.get_greatness();
        assert(greatness == 3, 'greatness should be 3');

        // test level 4
        item.xp = 16;
        let greatness = item.get_greatness();
        assert(greatness == 4, 'greatness should be 4');

        // test level 5
        item.xp = 25;
        let greatness = item.get_greatness();
        assert(greatness == 5, 'greatness should be 5');

        // test level 6
        item.xp = 36;
        let greatness = item.get_greatness();
        assert(greatness == 6, 'greatness should be 6');

        // test level 7
        item.xp = 49;
        let greatness = item.get_greatness();
        assert(greatness == 7, 'greatness should be 7');

        // test level 8
        item.xp = 64;
        let greatness = item.get_greatness();
        assert(greatness == 8, 'greatness should be 8');

        // test level 9
        item.xp = 81;
        let greatness = item.get_greatness();
        assert(greatness == 9, 'greatness should be 9');

        // test level 10
        item.xp = 100;
        let greatness = item.get_greatness();
        assert(greatness == 10, 'greatness should be 10');

        // test level 11
        item.xp = 121;
        let greatness = item.get_greatness();
        assert(greatness == 11, 'greatness should be 11');

        // test level 12
        item.xp = 144;
        let greatness = item.get_greatness();
        assert(greatness == 12, 'greatness should be 12');

        // test level 13
        item.xp = 169;
        let greatness = item.get_greatness();
        assert(greatness == 13, 'greatness should be 13');

        // test level 14
        item.xp = 196;
        let greatness = item.get_greatness();
        assert(greatness == 14, 'greatness should be 14');

        // test level 15
        item.xp = 225;
        let greatness = item.get_greatness();
        assert(greatness == 15, 'greatness should be 15');

        // test level 16
        item.xp = 256;
        let greatness = item.get_greatness();
        assert(greatness == 16, 'greatness should be 16');

        // test level 17
        item.xp = 289;
        let greatness = item.get_greatness();
        assert(greatness == 17, 'greatness should be 17');

        // test level 18
        item.xp = 324;
        let greatness = item.get_greatness();
        assert(greatness == 18, 'greatness should be 18');

        // test level 19
        item.xp = 361;
        let greatness = item.get_greatness();
        assert(greatness == 19, 'greatness should be 19');

        // test level 20
        item.xp = 400;
        let greatness = item.get_greatness();
        assert(greatness == 20, 'greatness should be 20');

        // test overflow / max u16
        item.xp = 65535;
        let greatness = item.get_greatness();
        assert(greatness == 20, 'greatness should be 20');
    }
}
