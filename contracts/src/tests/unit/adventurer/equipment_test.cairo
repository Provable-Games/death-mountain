// SPDX-License-Identifier: MIT

#[cfg(test)]
mod tests {
    use death_mountain::constants::combat::CombatEnums::Slot;
    use death_mountain::constants::loot::ItemId;
    use death_mountain::models::adventurer::adventurer::{ImplAdventurer};
    use death_mountain::models::adventurer::equipment::{Equipment, ImplEquipment, Item};
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
}
