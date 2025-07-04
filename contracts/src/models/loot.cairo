use core::num::traits::OverflowingAdd;
use core::panic_with_felt252;
use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
use death_mountain::constants::loot::{
    ItemId, ItemIndex, ItemSlotLength, ItemSuffixLength, NUM_ITEMS, NamePrefixLength, NameSuffixLength,
    PREFIXES_UNLOCK_GREATNESS, SUFFIX_UNLOCK_GREATNESS,
};
use death_mountain::models::combat::{SpecialPowers};
use death_mountain::utils::loot::ItemUtils;

#[derive(Copy, Drop, Serde)]
pub struct Loot {
    pub id: u8,
    pub tier: Tier,
    pub item_type: Type,
    pub slot: Slot,
}

const TWO_POW_64: u256 = 0x10000000000000000;

#[generate_trait]
pub impl ImplLoot of ILoot {
    // get_specials_seed generates a seed for naming an item.
    // @param self The item.
    // @param seed The seed to use for generating the item special names
    // @return The naming seed.
    #[inline(always)]
    fn get_specials_seed(item_id: u8, entropy: u16) -> u16 {
        let (mut item_entropy, overflow) = entropy.overflowing_add(item_id.into());
        // if adding the item_id to entropy overflows
        if (overflow) {
            // we subtract to provide item specific entropy
            item_entropy = entropy - item_id.into();
        }

        // scope rnd between 0 and NUM_ITEMS-1
        let rnd = item_entropy % NUM_ITEMS.into();
        // get the item index
        let item_index = Self::get_item_index(item_id).into();
        // get the slot length
        let slot_length = Self::get_slot_length(Self::get_slot(item_id)).into();

        // return the item specific entropy
        rnd * slot_length + item_index
    }

    // get_prefix1 returns the name prefix of an item (Agony, Apocalypse, Armageddon, etc)
    // @param self The item.
    // @param seed The seed for generating the prefix
    // @return The first part of the prefix for the item
    #[inline(always)]
    fn get_prefix1(item_id: u8, seed: u16) -> u8 {
        (Self::get_specials_seed(item_id, seed) % NamePrefixLength.into() + 1).try_into().unwrap()
    }

    // get_prefix2 returns the name suffix of an item (Bane, Root, Bite, etc)
    // @param self The item.
    // @param seed The seed for generating the prefix
    // @return The second part of the prefix for the item
    #[inline(always)]
    fn get_prefix2(item_id: u8, seed: u16) -> u8 {
        (Self::get_specials_seed(item_id, seed) % NameSuffixLength.into() + 1).try_into().unwrap()
    }

    // @notice gets the item suffix of an item (of_Power, of_Giant, of_Titans, etc)
    // @param item_id the id of the item to get special1 for
    // @param seed The seed for generating the suffix
    // @return u8 the suffix for the item
    #[inline(always)]
    fn get_suffix(item_id: u8, seed: u16) -> u8 {
        (Self::get_specials_seed(item_id, seed) % ItemSuffixLength.into() + 1).try_into().unwrap()
    }

    // @notice gets the specials of an item based on a seed
    // @param id the id of the item to get specials for
    // @param greatness the greatness level of the item
    // @param seed the seed to use for generating the specials
    // @return the specials of the item
    fn get_specials(id: u8, greatness: u8, seed: u16) -> SpecialPowers {
        if greatness < SUFFIX_UNLOCK_GREATNESS {
            SpecialPowers { special1: 0, special2: 0, special3: 0 }
        } else if greatness < PREFIXES_UNLOCK_GREATNESS {
            SpecialPowers { special1: Self::get_suffix(id, seed), special2: 0, special3: 0 }
        } else {
            SpecialPowers {
                special1: Self::get_suffix(id, seed),
                special2: Self::get_prefix1(id, seed),
                special3: Self::get_prefix2(id, seed),
            }
        }
    }

    // @notice gets Loot item from item id
    // @param id the id of the item to get
    // @return the Loot item
    fn get_item(id: u8) -> Loot {
        if id == ItemId::Pendant {
            return ItemUtils::get_pendant();
        } else if id == ItemId::Necklace {
            return ItemUtils::get_necklace();
        } else if id == ItemId::Amulet {
            return ItemUtils::get_amulet();
        } else if (id == ItemId::SilverRing) {
            return ItemUtils::get_silver_ring();
        } else if (id == ItemId::BronzeRing) {
            return ItemUtils::get_bronze_ring();
        } else if (id == ItemId::PlatinumRing) {
            return ItemUtils::get_platinum_ring();
        } else if (id == ItemId::TitaniumRing) {
            return ItemUtils::get_titanium_ring();
        } else if (id == ItemId::GoldRing) {
            return ItemUtils::get_gold_ring();
        } else if (id == ItemId::GhostWand) {
            return ItemUtils::get_ghost_wand();
        } else if (id == ItemId::GraveWand) {
            return ItemUtils::get_grave_wand();
        } else if (id == ItemId::BoneWand) {
            return ItemUtils::get_bone_wand();
        } else if (id == ItemId::Wand) {
            return ItemUtils::get_wand();
        } else if (id == ItemId::Grimoire) {
            return ItemUtils::get_grimoire();
        } else if (id == ItemId::Chronicle) {
            return ItemUtils::get_chronicle();
        } else if (id == ItemId::Tome) {
            return ItemUtils::get_tome();
        } else if (id == ItemId::Book) {
            return ItemUtils::get_book();
        } else if (id == ItemId::DivineRobe) {
            return ItemUtils::get_divine_robe();
        } else if (id == ItemId::SilkRobe) {
            return ItemUtils::get_silk_robe();
        } else if (id == ItemId::LinenRobe) {
            return ItemUtils::get_linen_robe();
        } else if (id == ItemId::Robe) {
            return ItemUtils::get_robe();
        } else if (id == ItemId::Shirt) {
            return ItemUtils::get_shirt();
        } else if (id == ItemId::Crown) {
            return ItemUtils::get_crown();
        } else if (id == ItemId::DivineHood) {
            return ItemUtils::get_divine_hood();
        } else if (id == ItemId::SilkHood) {
            return ItemUtils::get_silk_hood();
        } else if (id == ItemId::LinenHood) {
            return ItemUtils::get_linen_hood();
        } else if (id == ItemId::Hood) {
            return ItemUtils::get_hood();
        } else if (id == ItemId::BrightsilkSash) {
            return ItemUtils::get_brightsilk_sash();
        } else if (id == ItemId::SilkSash) {
            return ItemUtils::get_silk_sash();
        } else if (id == ItemId::WoolSash) {
            return ItemUtils::get_wool_sash();
        } else if (id == ItemId::LinenSash) {
            return ItemUtils::get_linen_sash();
        } else if (id == ItemId::Sash) {
            return ItemUtils::get_sash();
        } else if (id == ItemId::DivineSlippers) {
            return ItemUtils::get_divine_slippers();
        } else if (id == ItemId::SilkSlippers) {
            return ItemUtils::get_silk_slippers();
        } else if (id == ItemId::WoolShoes) {
            return ItemUtils::get_wool_shoes();
        } else if (id == ItemId::LinenShoes) {
            return ItemUtils::get_linen_shoes();
        } else if (id == ItemId::Shoes) {
            return ItemUtils::get_shoes();
        } else if (id == ItemId::DivineGloves) {
            return ItemUtils::get_divine_gloves();
        } else if (id == ItemId::SilkGloves) {
            return ItemUtils::get_silk_gloves();
        } else if (id == ItemId::WoolGloves) {
            return ItemUtils::get_wool_gloves();
        } else if (id == ItemId::LinenGloves) {
            return ItemUtils::get_linen_gloves();
        } else if (id == ItemId::Gloves) {
            return ItemUtils::get_gloves();
        } else if (id == ItemId::Katana) {
            return ItemUtils::get_katana();
        } else if (id == ItemId::Falchion) {
            return ItemUtils::get_falchion();
        } else if (id == ItemId::Scimitar) {
            return ItemUtils::get_scimitar();
        } else if (id == ItemId::LongSword) {
            return ItemUtils::get_long_sword();
        } else if (id == ItemId::ShortSword) {
            return ItemUtils::get_short_sword();
        } else if (id == ItemId::DemonHusk) {
            return ItemUtils::get_demon_husk();
        } else if (id == ItemId::DragonskinArmor) {
            return ItemUtils::get_dragonskin_armor();
        } else if (id == ItemId::StuddedLeatherArmor) {
            return ItemUtils::get_studded_leather_armor();
        } else if (id == ItemId::HardLeatherArmor) {
            return ItemUtils::get_hard_leather_armor();
        } else if (id == ItemId::LeatherArmor) {
            return ItemUtils::get_leather_armor();
        } else if (id == ItemId::DemonCrown) {
            return ItemUtils::get_demon_crown();
        } else if (id == ItemId::DragonsCrown) {
            return ItemUtils::get_dragons_crown();
        } else if (id == ItemId::WarCap) {
            return ItemUtils::get_war_cap();
        } else if (id == ItemId::LeatherCap) {
            return ItemUtils::get_leather_cap();
        } else if (id == ItemId::Cap) {
            return ItemUtils::get_cap();
        } else if (id == ItemId::DemonhideBelt) {
            return ItemUtils::get_demonhide_belt();
        } else if (id == ItemId::DragonskinBelt) {
            return ItemUtils::get_dragonskin_belt();
        } else if (id == ItemId::StuddedLeatherBelt) {
            return ItemUtils::get_studded_leather_belt();
        } else if (id == ItemId::HardLeatherBelt) {
            return ItemUtils::get_hard_leather_belt();
        } else if (id == ItemId::LeatherBelt) {
            return ItemUtils::get_leather_belt();
        } else if (id == ItemId::DemonhideBoots) {
            return ItemUtils::get_demonhide_boots();
        } else if (id == ItemId::DragonskinBoots) {
            return ItemUtils::get_dragonskin_boots();
        } else if (id == ItemId::StuddedLeatherBoots) {
            return ItemUtils::get_studded_leather_boots();
        } else if (id == ItemId::HardLeatherBoots) {
            return ItemUtils::get_hard_leather_boots();
        } else if (id == ItemId::LeatherBoots) {
            return ItemUtils::get_leather_boots();
        } else if (id == ItemId::DemonsHands) {
            return ItemUtils::get_demons_hands();
        } else if (id == ItemId::DragonskinGloves) {
            return ItemUtils::get_dragonskin_gloves();
        } else if (id == ItemId::StuddedLeatherGloves) {
            return ItemUtils::get_studded_leather_gloves();
        } else if (id == ItemId::HardLeatherGloves) {
            return ItemUtils::get_hard_leather_gloves();
        } else if (id == ItemId::LeatherGloves) {
            return ItemUtils::get_leather_gloves();
        } else if (id == ItemId::Warhammer) {
            return ItemUtils::get_warhammer();
        } else if (id == ItemId::Quarterstaff) {
            return ItemUtils::get_quarterstaff();
        } else if (id == ItemId::Maul) {
            return ItemUtils::get_maul();
        } else if (id == ItemId::Mace) {
            return ItemUtils::get_mace();
        } else if (id == ItemId::Club) {
            return ItemUtils::get_club();
        } else if (id == ItemId::HolyChestplate) {
            return ItemUtils::get_holy_chestplate();
        } else if (id == ItemId::OrnateChestplate) {
            return ItemUtils::get_ornate_chestplate();
        } else if (id == ItemId::PlateMail) {
            return ItemUtils::get_plate_mail();
        } else if (id == ItemId::ChainMail) {
            return ItemUtils::get_chain_mail();
        } else if (id == ItemId::RingMail) {
            return ItemUtils::get_ring_mail();
        } else if (id == ItemId::AncientHelm) {
            return ItemUtils::get_ancient_helm();
        } else if (id == ItemId::OrnateHelm) {
            return ItemUtils::get_ornate_helm();
        } else if (id == ItemId::GreatHelm) {
            return ItemUtils::get_great_helm();
        } else if (id == ItemId::FullHelm) {
            return ItemUtils::get_full_helm();
        } else if (id == ItemId::Helm) {
            return ItemUtils::get_helm();
        } else if (id == ItemId::OrnateBelt) {
            return ItemUtils::get_ornate_belt();
        } else if (id == ItemId::WarBelt) {
            return ItemUtils::get_war_belt();
        } else if (id == ItemId::PlatedBelt) {
            return ItemUtils::get_plated_belt();
        } else if (id == ItemId::MeshBelt) {
            return ItemUtils::get_mesh_belt();
        } else if (id == ItemId::HeavyBelt) {
            return ItemUtils::get_heavy_belt();
        } else if (id == ItemId::HolyGreaves) {
            return ItemUtils::get_holy_greaves();
        } else if (id == ItemId::OrnateGreaves) {
            return ItemUtils::get_ornate_greaves();
        } else if (id == ItemId::Greaves) {
            return ItemUtils::get_greaves();
        } else if (id == ItemId::ChainBoots) {
            return ItemUtils::get_chain_boots();
        } else if (id == ItemId::HeavyBoots) {
            return ItemUtils::get_heavy_boots();
        } else if (id == ItemId::HolyGauntlets) {
            return ItemUtils::get_holy_gauntlets();
        } else if (id == ItemId::OrnateGauntlets) {
            return ItemUtils::get_ornate_gauntlets();
        } else if (id == ItemId::Gauntlets) {
            return ItemUtils::get_gauntlets();
        } else if (id == ItemId::ChainGloves) {
            return ItemUtils::get_chain_gloves();
        } else if (id == ItemId::HeavyGloves) {
            return ItemUtils::get_heavy_gloves();
        } else {
            return ItemUtils::get_blank_item();
        }
    }

    // @notice gets the type of a Loot item
    // @param id the id of the Loot item to get type for
    // @return Type the type of the Loot item
    fn get_type(id: u8) -> Type {
        if ItemUtils::is_necklace(id) {
            return Type::Necklace(());
        } else if ItemUtils::is_ring(id) {
            return Type::Ring(());
        } else if ItemUtils::is_magic_or_cloth(id) {
            return Type::Magic_or_Cloth(());
        } else if ItemUtils::is_blade_or_hide(id) {
            return Type::Blade_or_Hide(());
        } else if ItemUtils::is_bludgeon_or_metal(id) {
            return Type::Bludgeon_or_Metal(());
        } else {
            return Type::None(());
        }
    }

    // @notice gets the tier of an item.
    // @param id The item id.
    // @return The tier of the item.
    fn get_tier(id: u8) -> Tier {
        if id == ItemId::Pendant {
            return ItemUtils::get_pendant().tier;
        } else if id == ItemId::Necklace {
            return ItemUtils::get_necklace().tier;
        } else if id == ItemId::Amulet {
            return ItemUtils::get_amulet().tier;
        } else if id == ItemId::GoldRing {
            return ItemUtils::get_gold_ring().tier;
        } else if id == ItemId::SilverRing {
            return ItemUtils::get_silver_ring().tier;
        } else if id == ItemId::BronzeRing {
            return ItemUtils::get_bronze_ring().tier;
        } else if id == ItemId::PlatinumRing {
            return ItemUtils::get_platinum_ring().tier;
        } else if id == ItemId::TitaniumRing {
            return ItemUtils::get_titanium_ring().tier;
        } else if id == ItemId::GhostWand {
            return ItemUtils::get_ghost_wand().tier;
        } else if id == ItemId::GraveWand {
            return ItemUtils::get_grave_wand().tier;
        } else if id == ItemId::BoneWand {
            return ItemUtils::get_bone_wand().tier;
        } else if id == ItemId::Wand {
            return ItemUtils::get_wand().tier;
        } else if id == ItemId::Grimoire {
            return ItemUtils::get_grimoire().tier;
        } else if id == ItemId::Chronicle {
            return ItemUtils::get_chronicle().tier;
        } else if id == ItemId::Tome {
            return ItemUtils::get_tome().tier;
        } else if id == ItemId::Book {
            return ItemUtils::get_book().tier;
        } else if id == ItemId::DivineRobe {
            return ItemUtils::get_divine_robe().tier;
        } else if id == ItemId::SilkRobe {
            return ItemUtils::get_silk_robe().tier;
        } else if id == ItemId::LinenRobe {
            return ItemUtils::get_linen_robe().tier;
        } else if id == ItemId::Robe {
            return ItemUtils::get_robe().tier;
        } else if id == ItemId::Shirt {
            return ItemUtils::get_shirt().tier;
        } else if id == ItemId::Crown {
            return ItemUtils::get_crown().tier;
        } else if id == ItemId::DivineHood {
            return ItemUtils::get_divine_hood().tier;
        } else if id == ItemId::SilkHood {
            return ItemUtils::get_silk_hood().tier;
        } else if id == ItemId::LinenHood {
            return ItemUtils::get_linen_hood().tier;
        } else if id == ItemId::Hood {
            return ItemUtils::get_hood().tier;
        } else if id == ItemId::BrightsilkSash {
            return ItemUtils::get_brightsilk_sash().tier;
        } else if id == ItemId::SilkSash {
            return ItemUtils::get_silk_sash().tier;
        } else if id == ItemId::WoolSash {
            return ItemUtils::get_wool_sash().tier;
        } else if id == ItemId::LinenSash {
            return ItemUtils::get_linen_sash().tier;
        } else if id == ItemId::Sash {
            return ItemUtils::get_sash().tier;
        } else if id == ItemId::DivineSlippers {
            return ItemUtils::get_divine_slippers().tier;
        } else if id == ItemId::SilkSlippers {
            return ItemUtils::get_silk_slippers().tier;
        } else if id == ItemId::WoolShoes {
            return ItemUtils::get_wool_shoes().tier;
        } else if id == ItemId::LinenShoes {
            return ItemUtils::get_linen_shoes().tier;
        } else if id == ItemId::Shoes {
            return ItemUtils::get_shoes().tier;
        } else if id == ItemId::DivineGloves {
            return ItemUtils::get_divine_gloves().tier;
        } else if id == ItemId::SilkGloves {
            return ItemUtils::get_silk_gloves().tier;
        } else if id == ItemId::WoolGloves {
            return ItemUtils::get_wool_gloves().tier;
        } else if id == ItemId::LinenGloves {
            return ItemUtils::get_linen_gloves().tier;
        } else if id == ItemId::Gloves {
            return ItemUtils::get_gloves().tier;
        } else if id == ItemId::Katana {
            return ItemUtils::get_katana().tier;
        } else if id == ItemId::Falchion {
            return ItemUtils::get_falchion().tier;
        } else if id == ItemId::Scimitar {
            return ItemUtils::get_scimitar().tier;
        } else if id == ItemId::LongSword {
            return ItemUtils::get_long_sword().tier;
        } else if id == ItemId::ShortSword {
            return ItemUtils::get_short_sword().tier;
        } else if id == ItemId::DemonHusk {
            return ItemUtils::get_demon_husk().tier;
        } else if id == ItemId::DragonskinArmor {
            return ItemUtils::get_dragonskin_armor().tier;
        } else if id == ItemId::StuddedLeatherArmor {
            return ItemUtils::get_studded_leather_armor().tier;
        } else if id == ItemId::HardLeatherArmor {
            return ItemUtils::get_hard_leather_armor().tier;
        } else if id == ItemId::LeatherArmor {
            return ItemUtils::get_leather_armor().tier;
        } else if id == ItemId::DemonCrown {
            return ItemUtils::get_demon_crown().tier;
        } else if id == ItemId::DragonsCrown {
            return ItemUtils::get_dragons_crown().tier;
        } else if id == ItemId::WarCap {
            return ItemUtils::get_war_cap().tier;
        } else if id == ItemId::LeatherCap {
            return ItemUtils::get_leather_cap().tier;
        } else if id == ItemId::Cap {
            return ItemUtils::get_cap().tier;
        } else if id == ItemId::DemonhideBelt {
            return ItemUtils::get_demonhide_belt().tier;
        } else if id == ItemId::DragonskinBelt {
            return ItemUtils::get_dragonskin_belt().tier;
        } else if id == ItemId::StuddedLeatherBelt {
            return ItemUtils::get_studded_leather_belt().tier;
        } else if id == ItemId::HardLeatherBelt {
            return ItemUtils::get_hard_leather_belt().tier;
        } else if id == ItemId::LeatherBelt {
            return ItemUtils::get_leather_belt().tier;
        } else if id == ItemId::DemonhideBoots {
            return ItemUtils::get_demonhide_boots().tier;
        } else if id == ItemId::DragonskinBoots {
            return ItemUtils::get_dragonskin_boots().tier;
        } else if id == ItemId::StuddedLeatherBoots {
            return ItemUtils::get_studded_leather_boots().tier;
        } else if id == ItemId::HardLeatherBoots {
            return ItemUtils::get_hard_leather_boots().tier;
        } else if id == ItemId::LeatherBoots {
            return ItemUtils::get_leather_boots().tier;
        } else if id == ItemId::DemonsHands {
            return ItemUtils::get_demons_hands().tier;
        } else if id == ItemId::DragonskinGloves {
            return ItemUtils::get_dragonskin_gloves().tier;
        } else if id == ItemId::StuddedLeatherGloves {
            return ItemUtils::get_studded_leather_gloves().tier;
        } else if id == ItemId::HardLeatherGloves {
            return ItemUtils::get_hard_leather_gloves().tier;
        } else if id == ItemId::LeatherGloves {
            return ItemUtils::get_leather_gloves().tier;
        } else if id == ItemId::Warhammer {
            return ItemUtils::get_warhammer().tier;
        } else if id == ItemId::Quarterstaff {
            return ItemUtils::get_quarterstaff().tier;
        } else if id == ItemId::Maul {
            return ItemUtils::get_maul().tier;
        } else if id == ItemId::Mace {
            return ItemUtils::get_mace().tier;
        } else if id == ItemId::Club {
            return ItemUtils::get_club().tier;
        } else if id == ItemId::HolyChestplate {
            return ItemUtils::get_holy_chestplate().tier;
        } else if id == ItemId::OrnateChestplate {
            return ItemUtils::get_ornate_chestplate().tier;
        } else if id == ItemId::PlateMail {
            return ItemUtils::get_plate_mail().tier;
        } else if id == ItemId::ChainMail {
            return ItemUtils::get_chain_mail().tier;
        } else if id == ItemId::RingMail {
            return ItemUtils::get_ring_mail().tier;
        } else if id == ItemId::AncientHelm {
            return ItemUtils::get_ancient_helm().tier;
        } else if id == ItemId::OrnateHelm {
            return ItemUtils::get_ornate_helm().tier;
        } else if id == ItemId::GreatHelm {
            return ItemUtils::get_great_helm().tier;
        } else if id == ItemId::FullHelm {
            return ItemUtils::get_full_helm().tier;
        } else if id == ItemId::Helm {
            return ItemUtils::get_helm().tier;
        } else if id == ItemId::OrnateBelt {
            return ItemUtils::get_ornate_belt().tier;
        } else if id == ItemId::WarBelt {
            return ItemUtils::get_war_belt().tier;
        } else if id == ItemId::PlatedBelt {
            return ItemUtils::get_plated_belt().tier;
        } else if id == ItemId::MeshBelt {
            return ItemUtils::get_mesh_belt().tier;
        } else if id == ItemId::HeavyBelt {
            return ItemUtils::get_heavy_belt().tier;
        } else if id == ItemId::HolyGreaves {
            return ItemUtils::get_holy_greaves().tier;
        } else if id == ItemId::OrnateGreaves {
            return ItemUtils::get_ornate_greaves().tier;
        } else if id == ItemId::Greaves {
            return ItemUtils::get_greaves().tier;
        } else if id == ItemId::ChainBoots {
            return ItemUtils::get_chain_boots().tier;
        } else if id == ItemId::HeavyBoots {
            return ItemUtils::get_heavy_boots().tier;
        } else if id == ItemId::HolyGauntlets {
            return ItemUtils::get_holy_gauntlets().tier;
        } else if id == ItemId::OrnateGauntlets {
            return ItemUtils::get_ornate_gauntlets().tier;
        } else if id == ItemId::Gauntlets {
            return ItemUtils::get_gauntlets().tier;
        } else if id == ItemId::ChainGloves {
            return ItemUtils::get_chain_gloves().tier;
        } else if id == ItemId::HeavyGloves {
            return ItemUtils::get_heavy_gloves().tier;
        } else {
            return Tier::None(());
        }
    }

    // @notice gets the slot for a Loot item
    // @param id the id of the Loot item to get slot for
    // @return Slot the slot of the Loot item
    fn get_slot(id: u8) -> Slot {
        if id == ItemId::Pendant {
            return ItemUtils::get_pendant().slot;
        } else if id == ItemId::Necklace {
            return ItemUtils::get_necklace().slot;
        } else if id == ItemId::Amulet {
            return ItemUtils::get_amulet().slot;
        } else if id == ItemId::GoldRing {
            return ItemUtils::get_gold_ring().slot;
        } else if id == ItemId::SilverRing {
            return ItemUtils::get_silver_ring().slot;
        } else if id == ItemId::BronzeRing {
            return ItemUtils::get_bronze_ring().slot;
        } else if id == ItemId::PlatinumRing {
            return ItemUtils::get_platinum_ring().slot;
        } else if id == ItemId::TitaniumRing {
            return ItemUtils::get_titanium_ring().slot;
        } else if id == ItemId::GhostWand {
            return ItemUtils::get_ghost_wand().slot;
        } else if id == ItemId::GraveWand {
            return ItemUtils::get_grave_wand().slot;
        } else if id == ItemId::BoneWand {
            return ItemUtils::get_bone_wand().slot;
        } else if id == ItemId::Wand {
            return ItemUtils::get_wand().slot;
        } else if id == ItemId::Grimoire {
            return ItemUtils::get_grimoire().slot;
        } else if id == ItemId::Chronicle {
            return ItemUtils::get_chronicle().slot;
        } else if id == ItemId::Tome {
            return ItemUtils::get_tome().slot;
        } else if id == ItemId::Book {
            return ItemUtils::get_book().slot;
        } else if id == ItemId::DivineRobe {
            return ItemUtils::get_divine_robe().slot;
        } else if id == ItemId::SilkRobe {
            return ItemUtils::get_silk_robe().slot;
        } else if id == ItemId::LinenRobe {
            return ItemUtils::get_linen_robe().slot;
        } else if id == ItemId::Robe {
            return ItemUtils::get_robe().slot;
        } else if id == ItemId::Shirt {
            return ItemUtils::get_shirt().slot;
        } else if id == ItemId::Crown {
            return ItemUtils::get_crown().slot;
        } else if id == ItemId::DivineHood {
            return ItemUtils::get_divine_hood().slot;
        } else if id == ItemId::SilkHood {
            return ItemUtils::get_silk_hood().slot;
        } else if id == ItemId::LinenHood {
            return ItemUtils::get_linen_hood().slot;
        } else if id == ItemId::Hood {
            return ItemUtils::get_hood().slot;
        } else if id == ItemId::BrightsilkSash {
            return ItemUtils::get_brightsilk_sash().slot;
        } else if id == ItemId::SilkSash {
            return ItemUtils::get_silk_sash().slot;
        } else if id == ItemId::WoolSash {
            return ItemUtils::get_wool_sash().slot;
        } else if id == ItemId::LinenSash {
            return ItemUtils::get_linen_sash().slot;
        } else if id == ItemId::Sash {
            return ItemUtils::get_sash().slot;
        } else if id == ItemId::DivineSlippers {
            return ItemUtils::get_divine_slippers().slot;
        } else if id == ItemId::SilkSlippers {
            return ItemUtils::get_silk_slippers().slot;
        } else if id == ItemId::WoolShoes {
            return ItemUtils::get_wool_shoes().slot;
        } else if id == ItemId::LinenShoes {
            return ItemUtils::get_linen_shoes().slot;
        } else if id == ItemId::Shoes {
            return ItemUtils::get_shoes().slot;
        } else if id == ItemId::DivineGloves {
            return ItemUtils::get_divine_gloves().slot;
        } else if id == ItemId::SilkGloves {
            return ItemUtils::get_silk_gloves().slot;
        } else if id == ItemId::WoolGloves {
            return ItemUtils::get_wool_gloves().slot;
        } else if id == ItemId::LinenGloves {
            return ItemUtils::get_linen_gloves().slot;
        } else if id == ItemId::Gloves {
            return ItemUtils::get_gloves().slot;
        } else if id == ItemId::Katana {
            return ItemUtils::get_katana().slot;
        } else if id == ItemId::Falchion {
            return ItemUtils::get_falchion().slot;
        } else if id == ItemId::Scimitar {
            return ItemUtils::get_scimitar().slot;
        } else if id == ItemId::LongSword {
            return ItemUtils::get_long_sword().slot;
        } else if id == ItemId::ShortSword {
            return ItemUtils::get_short_sword().slot;
        } else if id == ItemId::DemonHusk {
            return ItemUtils::get_demon_husk().slot;
        } else if id == ItemId::DragonskinArmor {
            return ItemUtils::get_dragonskin_armor().slot;
        } else if id == ItemId::StuddedLeatherArmor {
            return ItemUtils::get_studded_leather_armor().slot;
        } else if id == ItemId::HardLeatherArmor {
            return ItemUtils::get_hard_leather_armor().slot;
        } else if id == ItemId::LeatherArmor {
            return ItemUtils::get_leather_armor().slot;
        } else if id == ItemId::DemonCrown {
            return ItemUtils::get_demon_crown().slot;
        } else if id == ItemId::DragonsCrown {
            return ItemUtils::get_dragons_crown().slot;
        } else if id == ItemId::WarCap {
            return ItemUtils::get_war_cap().slot;
        } else if id == ItemId::LeatherCap {
            return ItemUtils::get_leather_cap().slot;
        } else if id == ItemId::Cap {
            return ItemUtils::get_cap().slot;
        } else if id == ItemId::DemonhideBelt {
            return ItemUtils::get_demonhide_belt().slot;
        } else if id == ItemId::DragonskinBelt {
            return ItemUtils::get_dragonskin_belt().slot;
        } else if id == ItemId::StuddedLeatherBelt {
            return ItemUtils::get_studded_leather_belt().slot;
        } else if id == ItemId::HardLeatherBelt {
            return ItemUtils::get_hard_leather_belt().slot;
        } else if id == ItemId::LeatherBelt {
            return ItemUtils::get_leather_belt().slot;
        } else if id == ItemId::DemonhideBoots {
            return ItemUtils::get_demonhide_boots().slot;
        } else if id == ItemId::DragonskinBoots {
            return ItemUtils::get_dragonskin_boots().slot;
        } else if id == ItemId::StuddedLeatherBoots {
            return ItemUtils::get_studded_leather_boots().slot;
        } else if id == ItemId::HardLeatherBoots {
            return ItemUtils::get_hard_leather_boots().slot;
        } else if id == ItemId::LeatherBoots {
            return ItemUtils::get_leather_boots().slot;
        } else if id == ItemId::DemonsHands {
            return ItemUtils::get_demons_hands().slot;
        } else if id == ItemId::DragonskinGloves {
            return ItemUtils::get_dragonskin_gloves().slot;
        } else if id == ItemId::StuddedLeatherGloves {
            return ItemUtils::get_studded_leather_gloves().slot;
        } else if id == ItemId::HardLeatherGloves {
            return ItemUtils::get_hard_leather_gloves().slot;
        } else if id == ItemId::LeatherGloves {
            return ItemUtils::get_leather_gloves().slot;
        } else if id == ItemId::Warhammer {
            return ItemUtils::get_warhammer().slot;
        } else if id == ItemId::Quarterstaff {
            return ItemUtils::get_quarterstaff().slot;
        } else if id == ItemId::Maul {
            return ItemUtils::get_maul().slot;
        } else if id == ItemId::Mace {
            return ItemUtils::get_mace().slot;
        } else if id == ItemId::Club {
            return ItemUtils::get_club().slot;
        } else if id == ItemId::HolyChestplate {
            return ItemUtils::get_holy_chestplate().slot;
        } else if id == ItemId::OrnateChestplate {
            return ItemUtils::get_ornate_chestplate().slot;
        } else if id == ItemId::PlateMail {
            return ItemUtils::get_plate_mail().slot;
        } else if id == ItemId::ChainMail {
            return ItemUtils::get_chain_mail().slot;
        } else if id == ItemId::RingMail {
            return ItemUtils::get_ring_mail().slot;
        } else if id == ItemId::AncientHelm {
            return ItemUtils::get_ancient_helm().slot;
        } else if id == ItemId::OrnateHelm {
            return ItemUtils::get_ornate_helm().slot;
        } else if id == ItemId::GreatHelm {
            return ItemUtils::get_great_helm().slot;
        } else if id == ItemId::FullHelm {
            return ItemUtils::get_full_helm().slot;
        } else if id == ItemId::Helm {
            return ItemUtils::get_helm().slot;
        } else if id == ItemId::OrnateBelt {
            return ItemUtils::get_ornate_belt().slot;
        } else if id == ItemId::WarBelt {
            return ItemUtils::get_war_belt().slot;
        } else if id == ItemId::PlatedBelt {
            return ItemUtils::get_plated_belt().slot;
        } else if id == ItemId::MeshBelt {
            return ItemUtils::get_mesh_belt().slot;
        } else if id == ItemId::HeavyBelt {
            return ItemUtils::get_heavy_belt().slot;
        } else if id == ItemId::HolyGreaves {
            return ItemUtils::get_holy_greaves().slot;
        } else if id == ItemId::OrnateGreaves {
            return ItemUtils::get_ornate_greaves().slot;
        } else if id == ItemId::Greaves {
            return ItemUtils::get_greaves().slot;
        } else if id == ItemId::ChainBoots {
            return ItemUtils::get_chain_boots().slot;
        } else if id == ItemId::HeavyBoots {
            return ItemUtils::get_heavy_boots().slot;
        } else if id == ItemId::HolyGauntlets {
            return ItemUtils::get_holy_gauntlets().slot;
        } else if id == ItemId::OrnateGauntlets {
            return ItemUtils::get_ornate_gauntlets().slot;
        } else if id == ItemId::Gauntlets {
            return ItemUtils::get_gauntlets().slot;
        } else if id == ItemId::ChainGloves {
            return ItemUtils::get_chain_gloves().slot;
        } else if id == ItemId::HeavyGloves {
            return ItemUtils::get_heavy_gloves().slot;
        } else {
            return Slot::None(());
        }
    }

    // @notice gets the number of Loot items for a given slot
    // @param slot the slot to get number of items for
    // @return u8 the number of items for the given slot
    fn get_slot_length(slot: Slot) -> u8 {
        match slot {
            Slot::None(()) => 0,
            Slot::Weapon(()) => ItemSlotLength::SlotItemsLengthWeapon,
            Slot::Chest(()) => ItemSlotLength::SlotItemsLengthChest,
            Slot::Head(()) => ItemSlotLength::SlotItemsLengthHead,
            Slot::Waist(()) => ItemSlotLength::SlotItemsLengthWaist,
            Slot::Foot(()) => ItemSlotLength::SlotItemsLengthFoot,
            Slot::Hand(()) => ItemSlotLength::SlotItemsLengthHand,
            Slot::Neck(()) => ItemSlotLength::SlotItemsLengthNeck,
            Slot::Ring(()) => ItemSlotLength::SlotItemsLengthRing,
        }
    }

    // @notice gets the index of a Loot item
    // @dev the index is the items position in its repsective grouping {weapon, chest_armor, etc}
    // @param id of the item to get the index for
    // @return u8 the index of the item
    fn get_item_index(id: u8) -> u8 {
        if id == ItemId::Pendant {
            return ItemIndex::Pendant;
        } else if id == ItemId::Necklace {
            return ItemIndex::Necklace;
        } else if id == ItemId::Amulet {
            return ItemIndex::Amulet;
        } else if id == ItemId::SilverRing {
            return ItemIndex::SilverRing;
        } else if id == ItemId::BronzeRing {
            return ItemIndex::BronzeRing;
        } else if id == ItemId::PlatinumRing {
            return ItemIndex::PlatinumRing;
        } else if id == ItemId::TitaniumRing {
            return ItemIndex::TitaniumRing;
        } else if id == ItemId::GoldRing {
            return ItemIndex::GoldRing;
        } else if id == ItemId::GhostWand {
            return ItemIndex::GhostWand;
        } else if id == ItemId::GraveWand {
            return ItemIndex::GraveWand;
        } else if id == ItemId::BoneWand {
            return ItemIndex::BoneWand;
        } else if id == ItemId::Wand {
            return ItemIndex::Wand;
        } else if id == ItemId::Grimoire {
            return ItemIndex::Grimoire;
        } else if id == ItemId::Chronicle {
            return ItemIndex::Chronicle;
        } else if id == ItemId::Tome {
            return ItemIndex::Tome;
        } else if id == ItemId::Book {
            return ItemIndex::Book;
        } else if id == ItemId::DivineRobe {
            return ItemIndex::DivineRobe;
        } else if id == ItemId::SilkRobe {
            return ItemIndex::SilkRobe;
        } else if id == ItemId::LinenRobe {
            return ItemIndex::LinenRobe;
        } else if id == ItemId::Robe {
            return ItemIndex::Robe;
        } else if id == ItemId::Shirt {
            return ItemIndex::Shirt;
        } else if id == ItemId::Crown {
            return ItemIndex::Crown;
        } else if id == ItemId::DivineHood {
            return ItemIndex::DivineHood;
        } else if id == ItemId::SilkHood {
            return ItemIndex::SilkHood;
        } else if id == ItemId::LinenHood {
            return ItemIndex::LinenHood;
        } else if id == ItemId::Hood {
            return ItemIndex::Hood;
        } else if id == ItemId::BrightsilkSash {
            return ItemIndex::BrightsilkSash;
        } else if id == ItemId::SilkSash {
            return ItemIndex::SilkSash;
        } else if id == ItemId::WoolSash {
            return ItemIndex::WoolSash;
        } else if id == ItemId::LinenSash {
            return ItemIndex::LinenSash;
        } else if id == ItemId::Sash {
            return ItemIndex::Sash;
        } else if id == ItemId::DivineSlippers {
            return ItemIndex::DivineSlippers;
        } else if id == ItemId::SilkSlippers {
            return ItemIndex::SilkSlippers;
        } else if id == ItemId::WoolShoes {
            return ItemIndex::WoolShoes;
        } else if id == ItemId::LinenShoes {
            return ItemIndex::LinenShoes;
        } else if id == ItemId::Shoes {
            return ItemIndex::Shoes;
        } else if id == ItemId::DivineGloves {
            return ItemIndex::DivineGloves;
        } else if id == ItemId::SilkGloves {
            return ItemIndex::SilkGloves;
        } else if id == ItemId::WoolGloves {
            return ItemIndex::WoolGloves;
        } else if id == ItemId::LinenGloves {
            return ItemIndex::LinenGloves;
        } else if id == ItemId::Gloves {
            return ItemIndex::Gloves;
        } else if id == ItemId::Katana {
            return ItemIndex::Katana;
        } else if id == ItemId::Falchion {
            return ItemIndex::Falchion;
        } else if id == ItemId::Scimitar {
            return ItemIndex::Scimitar;
        } else if id == ItemId::LongSword {
            return ItemIndex::LongSword;
        } else if id == ItemId::ShortSword {
            return ItemIndex::ShortSword;
        } else if id == ItemId::DemonHusk {
            return ItemIndex::DemonHusk;
        } else if id == ItemId::DragonskinArmor {
            return ItemIndex::DragonskinArmor;
        } else if id == ItemId::StuddedLeatherArmor {
            return ItemIndex::StuddedLeatherArmor;
        } else if id == ItemId::HardLeatherArmor {
            return ItemIndex::HardLeatherArmor;
        } else if id == ItemId::LeatherArmor {
            return ItemIndex::LeatherArmor;
        } else if id == ItemId::DemonCrown {
            return ItemIndex::DemonCrown;
        } else if id == ItemId::DragonsCrown {
            return ItemIndex::DragonsCrown;
        } else if id == ItemId::WarCap {
            return ItemIndex::WarCap;
        } else if id == ItemId::LeatherCap {
            return ItemIndex::LeatherCap;
        } else if id == ItemId::Cap {
            return ItemIndex::Cap;
        } else if id == ItemId::DemonhideBelt {
            return ItemIndex::DemonhideBelt;
        } else if id == ItemId::DragonskinBelt {
            return ItemIndex::DragonskinBelt;
        } else if id == ItemId::StuddedLeatherBelt {
            return ItemIndex::StuddedLeatherBelt;
        } else if id == ItemId::HardLeatherBelt {
            return ItemIndex::HardLeatherBelt;
        } else if id == ItemId::LeatherBelt {
            return ItemIndex::LeatherBelt;
        } else if id == ItemId::DemonhideBoots {
            return ItemIndex::DemonhideBoots;
        } else if id == ItemId::DragonskinBoots {
            return ItemIndex::DragonskinBoots;
        } else if id == ItemId::StuddedLeatherBoots {
            return ItemIndex::StuddedLeatherBoots;
        } else if id == ItemId::HardLeatherBoots {
            return ItemIndex::HardLeatherBoots;
        } else if id == ItemId::LeatherBoots {
            return ItemIndex::LeatherBoots;
        } else if id == ItemId::DemonsHands {
            return ItemIndex::DemonsHands;
        } else if id == ItemId::DragonskinGloves {
            return ItemIndex::DragonskinGloves;
        } else if id == ItemId::StuddedLeatherGloves {
            return ItemIndex::StuddedLeatherGloves;
        } else if id == ItemId::HardLeatherGloves {
            return ItemIndex::HardLeatherGloves;
        } else if id == ItemId::LeatherGloves {
            return ItemIndex::LeatherGloves;
        } else if id == ItemId::Warhammer {
            return ItemIndex::Warhammer;
        } else if id == ItemId::Quarterstaff {
            return ItemIndex::Quarterstaff;
        } else if id == ItemId::Maul {
            return ItemIndex::Maul;
        } else if id == ItemId::Mace {
            return ItemIndex::Mace;
        } else if id == ItemId::Club {
            return ItemIndex::Club;
        } else if id == ItemId::HolyChestplate {
            return ItemIndex::HolyChestplate;
        } else if id == ItemId::OrnateChestplate {
            return ItemIndex::OrnateChestplate;
        } else if id == ItemId::PlateMail {
            return ItemIndex::PlateMail;
        } else if id == ItemId::ChainMail {
            return ItemIndex::ChainMail;
        } else if id == ItemId::RingMail {
            return ItemIndex::RingMail;
        } else if id == ItemId::AncientHelm {
            return ItemIndex::AncientHelm;
        } else if id == ItemId::OrnateHelm {
            return ItemIndex::OrnateHelm;
        } else if id == ItemId::GreatHelm {
            return ItemIndex::GreatHelm;
        } else if id == ItemId::FullHelm {
            return ItemIndex::FullHelm;
        } else if id == ItemId::Helm {
            return ItemIndex::Helm;
        } else if id == ItemId::OrnateBelt {
            return ItemIndex::OrnateBelt;
        } else if id == ItemId::WarBelt {
            return ItemIndex::WarBelt;
        } else if id == ItemId::PlatedBelt {
            return ItemIndex::PlatedBelt;
        } else if id == ItemId::MeshBelt {
            return ItemIndex::MeshBelt;
        } else if id == ItemId::HeavyBelt {
            return ItemIndex::HeavyBelt;
        } else if id == ItemId::HolyGreaves {
            return ItemIndex::HolyGreaves;
        } else if id == ItemId::OrnateGreaves {
            return ItemIndex::OrnateGreaves;
        } else if id == ItemId::Greaves {
            return ItemIndex::Greaves;
        } else if id == ItemId::ChainBoots {
            return ItemIndex::ChainBoots;
        } else if id == ItemId::HeavyBoots {
            return ItemIndex::HeavyBoots;
        } else if id == ItemId::HolyGauntlets {
            return ItemIndex::HolyGauntlets;
        } else if id == ItemId::OrnateGauntlets {
            return ItemIndex::OrnateGauntlets;
        } else if id == ItemId::Gauntlets {
            return ItemIndex::Gauntlets;
        } else if id == ItemId::ChainGloves {
            return ItemIndex::ChainGloves;
        } else if id == ItemId::HeavyGloves {
            return ItemIndex::HeavyGloves;
        } else {
            panic_with_felt252('invalid item')
        }
    }

    // is_starting_weapon returns true if the item is a starting weapon.
    // Starting weapons are: {Wand, Book, Club, ShortSword}
    // @param id The item id.
    // @return True if the item is a starting weapon.
    fn is_starting_weapon(id: u8) -> bool {
        if (id == ItemId::Wand || id == ItemId::Book || id == ItemId::Club || id == ItemId::ShortSword) {
            true
        } else {
            false
        }
    }
}
