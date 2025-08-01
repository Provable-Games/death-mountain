// SPDX-License-Identifier: BUSL-1.1

use core::num::traits::Sqrt;
use core::traits::DivRem;
use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
use death_mountain::constants::loot::{ImplItemNaming, ItemId};
use death_mountain::models::loot::{ImplLoot};

#[derive(Introspect, Drop, Copy, PartialEq, Serde)]
// 21 bits in storage
pub struct Item {
    // 7 bits
    pub id: u8,
    // 9 bits
    pub xp: u16,
}

// for clients and renderers
#[derive(Introspect, Drop, Copy, PartialEq, Serde)]
pub struct ItemVerbose {
    pub name: felt252,
    pub id: u8,
    pub xp: u16,
    pub tier: Tier,
    pub item_type: Type,
    pub slot: Slot,
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

/// @notice Converts an Item to an ItemVerbose
/// @param self the Item to convert
/// @return ItemVerbose: the verbose Item
impl ItemIntoItemVerbose of Into<Item, ItemVerbose> {
    fn into(self: Item) -> ItemVerbose {
        let item_stats = ImplLoot::get_item(self.id);
        let name = ImplItemNaming::item_id_to_string(self.id);
        ItemVerbose {
            name,
            id: self.id,
            xp: self.xp,
            tier: item_stats.tier,
            item_type: item_stats.item_type,
            slot: item_stats.slot,
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

// ---------------------------
// ---------- Tests ----------
// ---------------------------
#[cfg(test)]
mod tests {
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
    use death_mountain::constants::loot::ItemId;
    use death_mountain::models::adventurer::item::{
        IItemPrimitive, ImplItem, Item, ItemVerbose, MAX_ITEM_XP, MAX_PACKABLE_ITEM_ID, MAX_PACKABLE_XP,
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

    #[test]
    #[available_gas(1000000)]
    fn test_item_into_item_verbose_empty() {
        let empty_item = Item { id: 0, xp: 0 };
        let verbose_item: ItemVerbose = empty_item.into();

        assert(verbose_item.id == 0, 'id should be 0');
        assert(verbose_item.xp == 0, 'xp should be 0');
        assert(verbose_item.name == 0, 'name should be 0');
        assert(verbose_item.tier == Tier::None, 'tier should be None');
        assert(verbose_item.item_type == Type::None, 'type should be None');
        assert(verbose_item.slot == Slot::None, 'slot should be None');
    }

    #[test]
    #[available_gas(1000000)]
    fn test_item_into_item_verbose_weapon() {
        // Test T1 weapon - Katana
        let katana = Item { id: ItemId::Katana, xp: 100 };
        let verbose_katana: ItemVerbose = katana.into();

        assert(verbose_katana.id == ItemId::Katana, 'katana id mismatch');
        assert(verbose_katana.xp == 100, 'katana xp mismatch');
        assert(verbose_katana.name == 'Katana', 'katana name mismatch');
        assert(verbose_katana.tier == Tier::T1, 'katana tier should be T1');
        assert(verbose_katana.item_type == Type::Blade_or_Hide, 'katana type mismatch');
        assert(verbose_katana.slot == Slot::Weapon, 'katana slot should be weapon');

        // Test T5 weapon - Wand
        let wand = Item { id: ItemId::Wand, xp: 50 };
        let verbose_wand: ItemVerbose = wand.into();

        assert(verbose_wand.id == ItemId::Wand, 'wand id mismatch');
        assert(verbose_wand.xp == 50, 'wand xp mismatch');
        assert(verbose_wand.name == 'Wand', 'wand name mismatch');
        assert(verbose_wand.tier == Tier::T5, 'wand tier should be T5');
        assert(verbose_wand.item_type == Type::Magic_or_Cloth, 'wand type mismatch');
        assert(verbose_wand.slot == Slot::Weapon, 'wand slot should be weapon');
    }

    #[test]
    #[available_gas(1000000)]
    fn test_item_into_item_verbose_armor() {
        // Test chest armor
        let divine_robe = Item { id: ItemId::DivineRobe, xp: 200 };
        let verbose_robe: ItemVerbose = divine_robe.into();

        assert(verbose_robe.id == ItemId::DivineRobe, 'robe id mismatch');
        assert(verbose_robe.xp == 200, 'robe xp mismatch');
        assert(verbose_robe.name == 'Divine Robe', 'robe name mismatch');
        assert(verbose_robe.tier == Tier::T1, 'robe tier should be T1');
        assert(verbose_robe.item_type == Type::Magic_or_Cloth, 'robe type mismatch');
        assert(verbose_robe.slot == Slot::Chest, 'robe slot should be chest');

        // Test head armor
        let crown = Item { id: ItemId::Crown, xp: 150 };
        let verbose_crown: ItemVerbose = crown.into();

        assert(verbose_crown.id == ItemId::Crown, 'crown id mismatch');
        assert(verbose_crown.xp == 150, 'crown xp mismatch');
        assert(verbose_crown.name == 'Crown', 'crown name mismatch');
        assert(verbose_crown.tier == Tier::T1, 'crown tier should be T1');
        assert(verbose_crown.item_type == Type::Magic_or_Cloth, 'crown type mismatch');
        assert(verbose_crown.slot == Slot::Head, 'crown slot should be head');

        // Test foot armor
        let leather_boots = Item { id: ItemId::LeatherBoots, xp: 75 };
        let verbose_boots: ItemVerbose = leather_boots.into();

        assert(verbose_boots.id == ItemId::LeatherBoots, 'boots id mismatch');
        assert(verbose_boots.xp == 75, 'boots xp mismatch');
        assert(verbose_boots.name == 'Leather Boots', 'boots name mismatch');
        assert(verbose_boots.tier == Tier::T5, 'boots tier should be T5');
        assert(verbose_boots.item_type == Type::Blade_or_Hide, 'boots type mismatch');
        assert(verbose_boots.slot == Slot::Foot, 'boots slot should be foot');
    }

    #[test]
    #[available_gas(1000000)]
    fn test_item_into_item_verbose_jewelry() {
        // Test necklace
        let amulet = Item { id: ItemId::Amulet, xp: 300 };
        let verbose_amulet: ItemVerbose = amulet.into();

        assert(verbose_amulet.id == ItemId::Amulet, 'amulet id mismatch');
        assert(verbose_amulet.xp == 300, 'amulet xp mismatch');
        assert(verbose_amulet.name == 'Amulet', 'amulet name mismatch');
        assert(verbose_amulet.tier == Tier::T1, 'amulet tier should be T1');
        assert(verbose_amulet.item_type == Type::Necklace, 'amulet type mismatch');
        assert(verbose_amulet.slot == Slot::Neck, 'amulet slot should be neck');

        // Test ring
        let gold_ring = Item { id: ItemId::GoldRing, xp: 250 };
        let verbose_ring: ItemVerbose = gold_ring.into();

        assert(verbose_ring.id == ItemId::GoldRing, 'ring id mismatch');
        assert(verbose_ring.xp == 250, 'ring xp mismatch');
        assert(verbose_ring.name == 'Gold Ring', 'ring name mismatch');
        assert(verbose_ring.tier == Tier::T1, 'ring tier should be T1');
        assert(verbose_ring.item_type == Type::Ring, 'ring type mismatch');
        assert(verbose_ring.slot == Slot::Ring, 'ring slot should be ring');
    }

    #[test]
    #[available_gas(1000000)]
    fn test_item_into_item_verbose_all_tiers() {
        // T1 item
        let t1_item = Item { id: ItemId::GhostWand, xp: 10 };
        let verbose_t1: ItemVerbose = t1_item.into();
        assert(verbose_t1.tier == Tier::T1, 'T1 tier mismatch');
        assert(verbose_t1.name == 'Ghost Wand', 'T1 name mismatch');

        // T2 item
        let t2_item = Item { id: ItemId::SilkRobe, xp: 20 };
        let verbose_t2: ItemVerbose = t2_item.into();
        assert(verbose_t2.tier == Tier::T2, 'T2 tier mismatch');
        assert(verbose_t2.name == 'Silk Robe', 'T2 name mismatch');

        // T3 item
        let t3_item = Item { id: ItemId::BronzeRing, xp: 30 };
        let verbose_t3: ItemVerbose = t3_item.into();
        assert(verbose_t3.tier == Tier::T3, 'T3 tier mismatch');
        assert(verbose_t3.name == 'Bronze Ring', 'T3 name mismatch');

        // T4 item
        let t4_item = Item { id: ItemId::LinenHood, xp: 40 };
        let verbose_t4: ItemVerbose = t4_item.into();
        assert(verbose_t4.tier == Tier::T4, 'T4 tier mismatch');
        assert(verbose_t4.name == 'Linen Hood', 'T4 name mismatch');

        // T5 item
        let t5_item = Item { id: ItemId::Shoes, xp: 50 };
        let verbose_t5: ItemVerbose = t5_item.into();
        assert(verbose_t5.tier == Tier::T5, 'T5 tier mismatch');
        assert(verbose_t5.name == 'Shoes', 'T5 name mismatch');
    }

    #[test]
    #[available_gas(1000000)]
    fn test_item_into_item_verbose_xp_values() {
        // Test with 0 XP
        let zero_xp = Item { id: ItemId::Katana, xp: 0 };
        let verbose_zero: ItemVerbose = zero_xp.into();
        assert(verbose_zero.xp == 0, 'zero xp mismatch');

        // Test with max item XP
        let max_xp = Item { id: ItemId::DivineRobe, xp: MAX_ITEM_XP };
        let verbose_max: ItemVerbose = max_xp.into();
        assert(verbose_max.xp == MAX_ITEM_XP, 'max xp mismatch');

        // Test with max packable XP
        let max_pack_xp = Item { id: ItemId::Crown, xp: MAX_PACKABLE_XP };
        let verbose_max_pack: ItemVerbose = max_pack_xp.into();
        assert(verbose_max_pack.xp == MAX_PACKABLE_XP, 'max packable xp mismatch');

        // Test various XP values preserve correctly
        let mid_xp = Item { id: ItemId::Amulet, xp: 255 };
        let verbose_mid: ItemVerbose = mid_xp.into();
        assert(verbose_mid.xp == 255, 'mid xp mismatch');
    }

    #[test]
    #[available_gas(1000000)]
    fn test_item_into_item_verbose_all_slots() {
        // Weapon slot
        let weapon = Item { id: ItemId::Warhammer, xp: 10 };
        let verbose_weapon: ItemVerbose = weapon.into();
        assert(verbose_weapon.slot == Slot::Weapon, 'weapon slot mismatch');

        // Chest slot
        let chest = Item { id: ItemId::HolyChestplate, xp: 20 };
        let verbose_chest: ItemVerbose = chest.into();
        assert(verbose_chest.slot == Slot::Chest, 'chest slot mismatch');

        // Head slot
        let head = Item { id: ItemId::DemonCrown, xp: 30 };
        let verbose_head: ItemVerbose = head.into();
        assert(verbose_head.slot == Slot::Head, 'head slot mismatch');

        // Waist slot
        let waist = Item { id: ItemId::DemonhideBelt, xp: 40 };
        let verbose_waist: ItemVerbose = waist.into();
        assert(verbose_waist.slot == Slot::Waist, 'waist slot mismatch');

        // Foot slot
        let foot = Item { id: ItemId::DivineSlippers, xp: 50 };
        let verbose_foot: ItemVerbose = foot.into();
        assert(verbose_foot.slot == Slot::Foot, 'foot slot mismatch');

        // Hand slot
        let hand = Item { id: ItemId::DivineGloves, xp: 60 };
        let verbose_hand: ItemVerbose = hand.into();
        assert(verbose_hand.slot == Slot::Hand, 'hand slot mismatch');

        // Neck slot
        let neck = Item { id: ItemId::Pendant, xp: 70 };
        let verbose_neck: ItemVerbose = neck.into();
        assert(verbose_neck.slot == Slot::Neck, 'neck slot mismatch');

        // Ring slot
        let ring = Item { id: ItemId::PlatinumRing, xp: 80 };
        let verbose_ring: ItemVerbose = ring.into();
        assert(verbose_ring.slot == Slot::Ring, 'ring slot mismatch');
    }

    #[test]
    #[available_gas(1000000)]
    fn test_item_into_item_verbose_all_types() {
        // Magic or Cloth type
        let magic_item = Item { id: ItemId::Grimoire, xp: 100 };
        let verbose_magic: ItemVerbose = magic_item.into();
        assert(verbose_magic.item_type == Type::Magic_or_Cloth, 'magic type mismatch');

        // Blade or Hide type
        let blade_item = Item { id: ItemId::Falchion, xp: 200 };
        let verbose_blade: ItemVerbose = blade_item.into();
        assert(verbose_blade.item_type == Type::Blade_or_Hide, 'blade type mismatch');

        // Bludgeon or Metal type
        let bludgeon_item = Item { id: ItemId::Quarterstaff, xp: 300 };
        let verbose_bludgeon: ItemVerbose = bludgeon_item.into();
        assert(verbose_bludgeon.item_type == Type::Bludgeon_or_Metal, 'bludgeon type mismatch');

        // Necklace type
        let necklace_item = Item { id: ItemId::Necklace, xp: 400 };
        let verbose_necklace: ItemVerbose = necklace_item.into();
        assert(verbose_necklace.item_type == Type::Necklace, 'necklace type mismatch');

        // Ring type
        let ring_item = Item { id: ItemId::SilverRing, xp: 500 };
        let verbose_ring: ItemVerbose = ring_item.into();
        assert(verbose_ring.item_type == Type::Ring, 'ring type mismatch');
    }
}
