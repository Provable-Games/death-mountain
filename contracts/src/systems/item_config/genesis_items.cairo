// Genesis items data for migration
use death_mountain::constants::loot::ItemId;

// Item data structure for genesis items
#[derive(Copy, Drop)]
pub struct GenesisItemData {
    pub id: u8,
    pub name: felt252,
    pub tier: u8,      // 1-5 (T1-T5)
    pub item_type: u8, // 1: Magic_or_Cloth, 2: Blade_or_Hide, 3: Bludgeon_or_Metal, 4: Necklace, 5: Ring
    pub slot: u8,      // 1: Weapon, 2: Chest, 3: Head, 4: Waist, 5: Foot, 6: Hand, 7: Neck, 8: Ring
}

pub fn get_genesis_items_data() -> Array<GenesisItemData> {
    let mut items = array![];
    
    // Necklaces (slot: 7, type: 4)
    items.append(GenesisItemData { id: ItemId::Pendant, name: 'Pendant', tier: 1, item_type: 4, slot: 7 });
    items.append(GenesisItemData { id: ItemId::Necklace, name: 'Necklace', tier: 1, item_type: 4, slot: 7 });
    items.append(GenesisItemData { id: ItemId::Amulet, name: 'Amulet', tier: 1, item_type: 4, slot: 7 });
    
    // Rings (slot: 8, type: 5)
    items.append(GenesisItemData { id: ItemId::SilverRing, name: 'Silver Ring', tier: 2, item_type: 5, slot: 8 });
    items.append(GenesisItemData { id: ItemId::BronzeRing, name: 'Bronze Ring', tier: 3, item_type: 5, slot: 8 });
    items.append(GenesisItemData { id: ItemId::PlatinumRing, name: 'Platinum Ring', tier: 1, item_type: 5, slot: 8 });
    items.append(GenesisItemData { id: ItemId::TitaniumRing, name: 'Titanium Ring', tier: 1, item_type: 5, slot: 8 });
    items.append(GenesisItemData { id: ItemId::GoldRing, name: 'Gold Ring', tier: 1, item_type: 5, slot: 8 });
    
    // Magic Weapons (slot: 1, type: 1)
    items.append(GenesisItemData { id: ItemId::GhostWand, name: 'Ghost Wand', tier: 1, item_type: 1, slot: 1 });
    items.append(GenesisItemData { id: ItemId::GraveWand, name: 'Grave Wand', tier: 2, item_type: 1, slot: 1 });
    items.append(GenesisItemData { id: ItemId::BoneWand, name: 'Bone Wand', tier: 3, item_type: 1, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Wand, name: 'Wand', tier: 5, item_type: 1, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Grimoire, name: 'Grimoire', tier: 1, item_type: 1, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Chronicle, name: 'Chronicle', tier: 2, item_type: 1, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Tome, name: 'Tome', tier: 3, item_type: 1, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Book, name: 'Book', tier: 5, item_type: 1, slot: 1 });
    
    // Cloth Chest Armor (slot: 2, type: 1)
    items.append(GenesisItemData { id: ItemId::DivineRobe, name: 'Divine Robe', tier: 1, item_type: 1, slot: 2 });
    items.append(GenesisItemData { id: ItemId::SilkRobe, name: 'Silk Robe', tier: 2, item_type: 1, slot: 2 });
    items.append(GenesisItemData { id: ItemId::LinenRobe, name: 'Linen Robe', tier: 3, item_type: 1, slot: 2 });
    items.append(GenesisItemData { id: ItemId::Robe, name: 'Robe', tier: 4, item_type: 1, slot: 2 });
    items.append(GenesisItemData { id: ItemId::Shirt, name: 'Shirt', tier: 5, item_type: 1, slot: 2 });
    
    // Cloth Head Armor (slot: 3, type: 1)
    items.append(GenesisItemData { id: ItemId::Crown, name: 'Crown', tier: 1, item_type: 1, slot: 3 });
    items.append(GenesisItemData { id: ItemId::DivineHood, name: 'Divine Hood', tier: 1, item_type: 1, slot: 3 });
    items.append(GenesisItemData { id: ItemId::SilkHood, name: 'Silk Hood', tier: 2, item_type: 1, slot: 3 });
    items.append(GenesisItemData { id: ItemId::LinenHood, name: 'Linen Hood', tier: 3, item_type: 1, slot: 3 });
    items.append(GenesisItemData { id: ItemId::Hood, name: 'Hood', tier: 4, item_type: 1, slot: 3 });
    
    // Cloth Waist Armor (slot: 4, type: 1)
    items.append(GenesisItemData { id: ItemId::BrightsilkSash, name: 'Brightsilk Sash', tier: 1, item_type: 1, slot: 4 });
    items.append(GenesisItemData { id: ItemId::SilkSash, name: 'Silk Sash', tier: 2, item_type: 1, slot: 4 });
    items.append(GenesisItemData { id: ItemId::WoolSash, name: 'Wool Sash', tier: 3, item_type: 1, slot: 4 });
    items.append(GenesisItemData { id: ItemId::LinenSash, name: 'Linen Sash', tier: 4, item_type: 1, slot: 4 });
    items.append(GenesisItemData { id: ItemId::Sash, name: 'Sash', tier: 5, item_type: 1, slot: 4 });
    
    // Cloth Foot Armor (slot: 5, type: 1)
    items.append(GenesisItemData { id: ItemId::DivineSlippers, name: 'Divine Slippers', tier: 1, item_type: 1, slot: 5 });
    items.append(GenesisItemData { id: ItemId::SilkSlippers, name: 'Silk Slippers', tier: 2, item_type: 1, slot: 5 });
    items.append(GenesisItemData { id: ItemId::WoolShoes, name: 'Wool Shoes', tier: 3, item_type: 1, slot: 5 });
    items.append(GenesisItemData { id: ItemId::LinenShoes, name: 'Linen Shoes', tier: 4, item_type: 1, slot: 5 });
    items.append(GenesisItemData { id: ItemId::Shoes, name: 'Shoes', tier: 5, item_type: 1, slot: 5 });
    
    // Cloth Hand Armor (slot: 6, type: 1)
    items.append(GenesisItemData { id: ItemId::DivineGloves, name: 'Divine Gloves', tier: 1, item_type: 1, slot: 6 });
    items.append(GenesisItemData { id: ItemId::SilkGloves, name: 'Silk Gloves', tier: 2, item_type: 1, slot: 6 });
    items.append(GenesisItemData { id: ItemId::WoolGloves, name: 'Wool Gloves', tier: 3, item_type: 1, slot: 6 });
    items.append(GenesisItemData { id: ItemId::LinenGloves, name: 'Linen Gloves', tier: 4, item_type: 1, slot: 6 });
    items.append(GenesisItemData { id: ItemId::Gloves, name: 'Gloves', tier: 5, item_type: 1, slot: 6 });
    
    // Blade Weapons (slot: 1, type: 2)
    items.append(GenesisItemData { id: ItemId::Katana, name: 'Katana', tier: 1, item_type: 2, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Falchion, name: 'Falchion', tier: 2, item_type: 2, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Scimitar, name: 'Scimitar', tier: 3, item_type: 2, slot: 1 });
    items.append(GenesisItemData { id: ItemId::LongSword, name: 'Long Sword', tier: 4, item_type: 2, slot: 1 });
    items.append(GenesisItemData { id: ItemId::ShortSword, name: 'Short Sword', tier: 5, item_type: 2, slot: 1 });
    
    // Hide Chest Armor (slot: 2, type: 2)
    items.append(GenesisItemData { id: ItemId::DemonHusk, name: 'Demon Husk', tier: 1, item_type: 2, slot: 2 });
    items.append(GenesisItemData { id: ItemId::DragonskinArmor, name: 'Dragonskin Armor', tier: 2, item_type: 2, slot: 2 });
    items.append(GenesisItemData { id: ItemId::StuddedLeatherArmor, name: 'Studded Leather Armor', tier: 3, item_type: 2, slot: 2 });
    items.append(GenesisItemData { id: ItemId::HardLeatherArmor, name: 'Hard Leather Armor', tier: 4, item_type: 2, slot: 2 });
    items.append(GenesisItemData { id: ItemId::LeatherArmor, name: 'Leather Armor', tier: 5, item_type: 2, slot: 2 });
    
    // Hide Head Armor (slot: 3, type: 2)
    items.append(GenesisItemData { id: ItemId::DemonCrown, name: 'Demon Crown', tier: 1, item_type: 2, slot: 3 });
    items.append(GenesisItemData { id: ItemId::DragonsCrown, name: 'Dragon\'s Crown', tier: 2, item_type: 2, slot: 3 });
    items.append(GenesisItemData { id: ItemId::WarCap, name: 'War Cap', tier: 3, item_type: 2, slot: 3 });
    items.append(GenesisItemData { id: ItemId::LeatherCap, name: 'Leather Cap', tier: 4, item_type: 2, slot: 3 });
    items.append(GenesisItemData { id: ItemId::Cap, name: 'Cap', tier: 5, item_type: 2, slot: 3 });
    
    // Hide Waist Armor (slot: 4, type: 2)
    items.append(GenesisItemData { id: ItemId::DemonhideBelt, name: 'Demonhide Belt', tier: 1, item_type: 2, slot: 4 });
    items.append(GenesisItemData { id: ItemId::DragonskinBelt, name: 'Dragonskin Belt', tier: 2, item_type: 2, slot: 4 });
    items.append(GenesisItemData { id: ItemId::StuddedLeatherBelt, name: 'Studded Leather Belt', tier: 3, item_type: 2, slot: 4 });
    items.append(GenesisItemData { id: ItemId::HardLeatherBelt, name: 'Hard Leather Belt', tier: 4, item_type: 2, slot: 4 });
    items.append(GenesisItemData { id: ItemId::LeatherBelt, name: 'Leather Belt', tier: 5, item_type: 2, slot: 4 });
    
    // Hide Foot Armor (slot: 5, type: 2)
    items.append(GenesisItemData { id: ItemId::DemonhideBoots, name: 'Demonhide Boots', tier: 1, item_type: 2, slot: 5 });
    items.append(GenesisItemData { id: ItemId::DragonskinBoots, name: 'Dragonskin Boots', tier: 2, item_type: 2, slot: 5 });
    items.append(GenesisItemData { id: ItemId::StuddedLeatherBoots, name: 'Studded Leather Boots', tier: 3, item_type: 2, slot: 5 });
    items.append(GenesisItemData { id: ItemId::HardLeatherBoots, name: 'Hard Leather Boots', tier: 4, item_type: 2, slot: 5 });
    items.append(GenesisItemData { id: ItemId::LeatherBoots, name: 'Leather Boots', tier: 5, item_type: 2, slot: 5 });
    
    // Hide Hand Armor (slot: 6, type: 2)
    items.append(GenesisItemData { id: ItemId::DemonsHands, name: 'Demons Hands', tier: 1, item_type: 2, slot: 6 });
    items.append(GenesisItemData { id: ItemId::DragonskinGloves, name: 'Dragonskin Gloves', tier: 2, item_type: 2, slot: 6 });
    items.append(GenesisItemData { id: ItemId::StuddedLeatherGloves, name: 'Studded Leather Gloves', tier: 3, item_type: 2, slot: 6 });
    items.append(GenesisItemData { id: ItemId::HardLeatherGloves, name: 'Hard Leather Gloves', tier: 4, item_type: 2, slot: 6 });
    items.append(GenesisItemData { id: ItemId::LeatherGloves, name: 'Leather Gloves', tier: 5, item_type: 2, slot: 6 });
    
    // Bludgeon Weapons (slot: 1, type: 3)
    items.append(GenesisItemData { id: ItemId::Warhammer, name: 'Warhammer', tier: 1, item_type: 3, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Quarterstaff, name: 'Quarterstaff', tier: 2, item_type: 3, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Maul, name: 'Maul', tier: 3, item_type: 3, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Mace, name: 'Mace', tier: 4, item_type: 3, slot: 1 });
    items.append(GenesisItemData { id: ItemId::Club, name: 'Club', tier: 5, item_type: 3, slot: 1 });
    
    // Metal Chest Armor (slot: 2, type: 3)
    items.append(GenesisItemData { id: ItemId::HolyChestplate, name: 'Holy Chestplate', tier: 1, item_type: 3, slot: 2 });
    items.append(GenesisItemData { id: ItemId::OrnateChestplate, name: 'Ornate Chestplate', tier: 2, item_type: 3, slot: 2 });
    items.append(GenesisItemData { id: ItemId::PlateMail, name: 'Plate Mail', tier: 3, item_type: 3, slot: 2 });
    items.append(GenesisItemData { id: ItemId::ChainMail, name: 'Chain Mail', tier: 4, item_type: 3, slot: 2 });
    items.append(GenesisItemData { id: ItemId::RingMail, name: 'Ring Mail', tier: 5, item_type: 3, slot: 2 });
    
    // Metal Head Armor (slot: 3, type: 3)
    items.append(GenesisItemData { id: ItemId::AncientHelm, name: 'Ancient Helm', tier: 1, item_type: 3, slot: 3 });
    items.append(GenesisItemData { id: ItemId::OrnateHelm, name: 'Ornate Helm', tier: 2, item_type: 3, slot: 3 });
    items.append(GenesisItemData { id: ItemId::GreatHelm, name: 'Great Helm', tier: 3, item_type: 3, slot: 3 });
    items.append(GenesisItemData { id: ItemId::FullHelm, name: 'Full Helm', tier: 4, item_type: 3, slot: 3 });
    items.append(GenesisItemData { id: ItemId::Helm, name: 'Helm', tier: 5, item_type: 3, slot: 3 });
    
    // Metal Waist Armor (slot: 4, type: 3)
    items.append(GenesisItemData { id: ItemId::OrnateBelt, name: 'Ornate Belt', tier: 1, item_type: 3, slot: 4 });
    items.append(GenesisItemData { id: ItemId::WarBelt, name: 'War Belt', tier: 2, item_type: 3, slot: 4 });
    items.append(GenesisItemData { id: ItemId::PlatedBelt, name: 'Plated Belt', tier: 3, item_type: 3, slot: 4 });
    items.append(GenesisItemData { id: ItemId::MeshBelt, name: 'Mesh Belt', tier: 4, item_type: 3, slot: 4 });
    items.append(GenesisItemData { id: ItemId::HeavyBelt, name: 'Heavy Belt', tier: 5, item_type: 3, slot: 4 });
    
    // Metal Foot Armor (slot: 5, type: 3)
    items.append(GenesisItemData { id: ItemId::HolyGreaves, name: 'Holy Greaves', tier: 1, item_type: 3, slot: 5 });
    items.append(GenesisItemData { id: ItemId::OrnateGreaves, name: 'Ornate Greaves', tier: 2, item_type: 3, slot: 5 });
    items.append(GenesisItemData { id: ItemId::Greaves, name: 'Greaves', tier: 3, item_type: 3, slot: 5 });
    items.append(GenesisItemData { id: ItemId::ChainBoots, name: 'Chain Boots', tier: 4, item_type: 3, slot: 5 });
    items.append(GenesisItemData { id: ItemId::HeavyBoots, name: 'Heavy Boots', tier: 5, item_type: 3, slot: 5 });
    
    // Metal Hand Armor (slot: 6, type: 3)
    items.append(GenesisItemData { id: ItemId::HolyGauntlets, name: 'Holy Gauntlets', tier: 1, item_type: 3, slot: 6 });
    items.append(GenesisItemData { id: ItemId::OrnateGauntlets, name: 'Ornate Gauntlets', tier: 2, item_type: 3, slot: 6 });
    items.append(GenesisItemData { id: ItemId::Gauntlets, name: 'Gauntlets', tier: 3, item_type: 3, slot: 6 });
    items.append(GenesisItemData { id: ItemId::ChainGloves, name: 'Chain Gloves', tier: 4, item_type: 3, slot: 6 });
    items.append(GenesisItemData { id: ItemId::HeavyGloves, name: 'Heavy Gloves', tier: 5, item_type: 3, slot: 6 });
    
    items
}