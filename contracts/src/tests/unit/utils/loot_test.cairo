// SPDX-License-Identifier: MIT

#[cfg(test)]
mod tests {
    use death_mountain::constants::loot::ItemId;
    use death_mountain::utils::loot::{ItemUtils};

    #[test]
    #[available_gas(151130)]
    pub fn is_necklace() {
        let necklace: Array<u8> = array![ItemId::Pendant, ItemId::Necklace, ItemId::Amulet];

        let mut item_index = 0;
        loop {
            if item_index == necklace.len() {
                break;
            }
            let item = *necklace.at(item_index);
            assert(ItemUtils::is_necklace(item), 'should be necklace');
            assert(!ItemUtils::is_head_armor(item), 'not head armor');
            assert(!ItemUtils::is_ring(item), 'not ring1');
            assert(!ItemUtils::is_weapon(item), 'not a weapon');
            assert(!ItemUtils::is_chest_armor(item), 'not chest armor');
            assert(!ItemUtils::is_waist_armor(item), 'not waist armor');
            assert(!ItemUtils::is_hand_armor(item), 'not hand armor');
            assert(!ItemUtils::is_foot_armor(item), 'not foot armor');
            item_index += 1;
        }
    }

    #[test]
    #[available_gas(225210)]
    pub fn is_ring() {
        let rings: Array<u8> = array![
            ItemId::SilverRing, ItemId::BronzeRing, ItemId::PlatinumRing, ItemId::TitaniumRing, ItemId::GoldRing,
        ];

        let mut item_index = 0;
        loop {
            if item_index == rings.len() {
                break;
            }
            let item = *rings.at(item_index);
            assert(ItemUtils::is_ring(item), 'should be ring');
            assert(!ItemUtils::is_necklace(item), 'not necklace');
            assert(!ItemUtils::is_head_armor(item), 'not head armor');
            assert(!ItemUtils::is_weapon(item), 'not a weapon');
            assert(!ItemUtils::is_chest_armor(item), 'not chest armor');
            assert(!ItemUtils::is_waist_armor(item), 'not waist armor');
            assert(!ItemUtils::is_hand_armor(item), 'not hand armor');
            assert(!ItemUtils::is_foot_armor(item), 'not foot armor');
            item_index += 1;
        }
    }

    #[test]
    #[available_gas(560070)]
    pub fn is_weapon() {
        let weapons: Array<u8> = array![
            ItemId::GhostWand,
            ItemId::GraveWand,
            ItemId::BoneWand,
            ItemId::Wand,
            ItemId::Katana,
            ItemId::Falchion,
            ItemId::Scimitar,
            ItemId::LongSword,
            ItemId::ShortSword,
            ItemId::Warhammer,
            ItemId::Quarterstaff,
            ItemId::Maul,
            ItemId::Mace,
            ItemId::Club,
        ];

        let mut item_index = 0;
        loop {
            if item_index == weapons.len() {
                break;
            }
            let item = *weapons.at(item_index);
            assert(ItemUtils::is_weapon(item), 'should be weapon');
            assert(!ItemUtils::is_necklace(item), 'not necklace');
            assert(!ItemUtils::is_ring(item), 'not ring2');
            assert(!ItemUtils::is_chest_armor(item), 'not chest armor');
            assert(!ItemUtils::is_head_armor(item), 'not head armor');
            assert(!ItemUtils::is_waist_armor(item), 'not waist armor');
            assert(!ItemUtils::is_hand_armor(item), 'not hand armor');
            assert(!ItemUtils::is_foot_armor(item), 'not foot armor');
            item_index += 1;
        }
    }

    #[test]
    #[available_gas(597210)]
    pub fn is_chest_armor() {
        let chest_armor: Array<u8> = array![
            ItemId::DivineRobe,
            ItemId::SilkRobe,
            ItemId::LinenRobe,
            ItemId::Robe,
            ItemId::Shirt,
            ItemId::DemonHusk,
            ItemId::DragonskinArmor,
            ItemId::StuddedLeatherArmor,
            ItemId::HardLeatherArmor,
            ItemId::LeatherArmor,
            ItemId::HolyChestplate,
            ItemId::OrnateChestplate,
            ItemId::PlateMail,
            ItemId::ChainMail,
            ItemId::RingMail,
        ];

        let mut item_index = 0;
        loop {
            if item_index == chest_armor.len() {
                break;
            }
            let item = *chest_armor.at(item_index);
            assert(ItemUtils::is_chest_armor(item), 'should be chest armor');
            assert(!ItemUtils::is_necklace(item), 'not necklace');
            assert(!ItemUtils::is_ring(item), 'not ring3');
            assert(!ItemUtils::is_weapon(item), 'not a weapon');
            assert(!ItemUtils::is_head_armor(item), 'not head armor');
            assert(!ItemUtils::is_waist_armor(item), 'not waist armor');
            assert(!ItemUtils::is_hand_armor(item), 'not hand armor');
            assert(!ItemUtils::is_foot_armor(item), 'not foot armor');
            item_index += 1;
        }
    }

    #[test]
    #[available_gas(597210)]
    pub fn is_head_armor() {
        let head_armor: Array<u8> = array![
            ItemId::Crown,
            ItemId::DivineHood,
            ItemId::SilkHood,
            ItemId::LinenHood,
            ItemId::Hood,
            ItemId::DemonCrown,
            ItemId::DragonsCrown,
            ItemId::WarCap,
            ItemId::LeatherCap,
            ItemId::Cap,
            ItemId::AncientHelm,
            ItemId::OrnateHelm,
            ItemId::GreatHelm,
            ItemId::FullHelm,
            ItemId::Helm,
        ];
        let mut item_index = 0;
        loop {
            if item_index == head_armor.len() {
                break;
            }
            let item = *head_armor.at(item_index);
            assert(ItemUtils::is_head_armor(item), 'should be head armor');
            assert(!ItemUtils::is_necklace(item), 'not necklace');
            assert(!ItemUtils::is_ring(item), 'not ring4');
            assert(!ItemUtils::is_weapon(item), 'not a weapon');
            assert(!ItemUtils::is_chest_armor(item), 'not chest armor');
            assert(!ItemUtils::is_waist_armor(item), 'not waist armor');
            assert(!ItemUtils::is_hand_armor(item), 'not hand armor');
            assert(!ItemUtils::is_foot_armor(item), 'not foot armor');
            item_index += 1;
        }
    }

    #[test]
    #[available_gas(597210)]
    pub fn is_waist_armor() {
        let waist_armor_items: Array<u8> = array![
            ItemId::BrightsilkSash,
            ItemId::SilkSash,
            ItemId::WoolSash,
            ItemId::LinenSash,
            ItemId::Sash,
            ItemId::DemonhideBelt,
            ItemId::DragonskinBelt,
            ItemId::StuddedLeatherBelt,
            ItemId::HardLeatherBelt,
            ItemId::LeatherBelt,
            ItemId::OrnateBelt,
            ItemId::WarBelt,
            ItemId::PlatedBelt,
            ItemId::MeshBelt,
            ItemId::HeavyBelt,
        ];

        let mut item_index = 0;
        loop {
            if item_index == waist_armor_items.len() {
                break;
            }
            let item = *waist_armor_items.at(item_index);
            assert(ItemUtils::is_waist_armor(item), 'should be waist armor');
            assert(!ItemUtils::is_necklace(item), 'not necklace');
            assert(!ItemUtils::is_ring(item), 'not ring5');
            assert(!ItemUtils::is_weapon(item), 'not a weapon');
            assert(!ItemUtils::is_chest_armor(item), 'not chest armor');
            assert(!ItemUtils::is_head_armor(item), 'not head armor');
            assert(!ItemUtils::is_hand_armor(item), 'not hand armor');
            assert(!ItemUtils::is_foot_armor(item), 'not foot armor');
            item_index += 1;
        }
    }

    #[test]
    #[available_gas(597210)]
    pub fn is_hand_armor() {
        let hand_armor_items: Array<u8> = array![
            ItemId::DivineGloves,
            ItemId::SilkGloves,
            ItemId::WoolGloves,
            ItemId::LinenGloves,
            ItemId::Gloves,
            ItemId::DemonsHands,
            ItemId::DragonskinGloves,
            ItemId::StuddedLeatherGloves,
            ItemId::HardLeatherGloves,
            ItemId::LeatherGloves,
            ItemId::HolyGauntlets,
            ItemId::OrnateGauntlets,
            ItemId::Gauntlets,
            ItemId::ChainGloves,
            ItemId::HeavyGloves,
        ];

        let mut item_index = 0;
        loop {
            if item_index == hand_armor_items.len() {
                break;
            }
            let item = *hand_armor_items.at(item_index);
            assert(ItemUtils::is_hand_armor(item), 'should be hand armor');
            assert(!ItemUtils::is_necklace(item), 'not necklace');
            assert(!ItemUtils::is_ring(item), 'not ring6');
            assert(!ItemUtils::is_weapon(item), 'not a weapon');
            assert(!ItemUtils::is_chest_armor(item), 'not chest armor');
            assert(!ItemUtils::is_head_armor(item), 'not head armor');
            assert(!ItemUtils::is_waist_armor(item), 'not waist armor');
            assert(!ItemUtils::is_foot_armor(item), 'not foot armor');
            item_index += 1;
        }
    }

    #[test]
    #[available_gas(597210)]
    pub fn is_foot_armor() {
        let foot_armor_items: Array<u8> = array![
            ItemId::DivineSlippers,
            ItemId::SilkSlippers,
            ItemId::WoolShoes,
            ItemId::LinenShoes,
            ItemId::Shoes,
            ItemId::DemonhideBoots,
            ItemId::DragonskinBoots,
            ItemId::StuddedLeatherBoots,
            ItemId::HardLeatherBoots,
            ItemId::LeatherBoots,
            ItemId::HolyGreaves,
            ItemId::OrnateGreaves,
            ItemId::Greaves,
            ItemId::ChainBoots,
            ItemId::HeavyBoots,
        ];

        let mut item_index = 0;
        loop {
            if item_index == foot_armor_items.len() {
                break;
            }
            let item = *foot_armor_items.at(item_index);
            assert(ItemUtils::is_foot_armor(item), 'should be foot armor');
            assert(!ItemUtils::is_necklace(item), 'not necklace');
            assert(!ItemUtils::is_ring(item), 'not ring7');
            assert(!ItemUtils::is_weapon(item), 'not a weapon');
            assert(!ItemUtils::is_chest_armor(item), 'not chest armor');
            assert(!ItemUtils::is_head_armor(item), 'not head armor');
            assert(!ItemUtils::is_waist_armor(item), 'not waist armor');
            assert(!ItemUtils::is_hand_armor(item), 'not hand armor');
            item_index += 1;
        }
    }
}
