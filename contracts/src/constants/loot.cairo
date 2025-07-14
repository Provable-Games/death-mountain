// SPDX-License-Identifier: MIT

pub mod ItemId {
    pub const Pendant: u8 = 1;
    pub const Necklace: u8 = 2;
    pub const Amulet: u8 = 3;
    pub const SilverRing: u8 = 4;
    pub const BronzeRing: u8 = 5;
    pub const PlatinumRing: u8 = 6;
    pub const TitaniumRing: u8 = 7;
    pub const GoldRing: u8 = 8;
    pub const GhostWand: u8 = 9;
    pub const GraveWand: u8 = 10;
    pub const BoneWand: u8 = 11;
    pub const Wand: u8 = 12;
    pub const Grimoire: u8 = 13;
    pub const Chronicle: u8 = 14;
    pub const Tome: u8 = 15;
    pub const Book: u8 = 16;
    pub const DivineRobe: u8 = 17;
    pub const SilkRobe: u8 = 18;
    pub const LinenRobe: u8 = 19;
    pub const Robe: u8 = 20;
    pub const Shirt: u8 = 21;
    pub const Crown: u8 = 22;
    pub const DivineHood: u8 = 23;
    pub const SilkHood: u8 = 24;
    pub const LinenHood: u8 = 25;
    pub const Hood: u8 = 26;
    pub const BrightsilkSash: u8 = 27;
    pub const SilkSash: u8 = 28;
    pub const WoolSash: u8 = 29;
    pub const LinenSash: u8 = 30;
    pub const Sash: u8 = 31;
    pub const DivineSlippers: u8 = 32;
    pub const SilkSlippers: u8 = 33;
    pub const WoolShoes: u8 = 34;
    pub const LinenShoes: u8 = 35;
    pub const Shoes: u8 = 36;
    pub const DivineGloves: u8 = 37;
    pub const SilkGloves: u8 = 38;
    pub const WoolGloves: u8 = 39;
    pub const LinenGloves: u8 = 40;
    pub const Gloves: u8 = 41;
    pub const Katana: u8 = 42;
    pub const Falchion: u8 = 43;
    pub const Scimitar: u8 = 44;
    pub const LongSword: u8 = 45;
    pub const ShortSword: u8 = 46;
    pub const DemonHusk: u8 = 47;
    pub const DragonskinArmor: u8 = 48;
    pub const StuddedLeatherArmor: u8 = 49;
    pub const HardLeatherArmor: u8 = 50;
    pub const LeatherArmor: u8 = 51;
    pub const DemonCrown: u8 = 52;
    pub const DragonsCrown: u8 = 53;
    pub const WarCap: u8 = 54;
    pub const LeatherCap: u8 = 55;
    pub const Cap: u8 = 56;
    pub const DemonhideBelt: u8 = 57;
    pub const DragonskinBelt: u8 = 58;
    pub const StuddedLeatherBelt: u8 = 59;
    pub const HardLeatherBelt: u8 = 60;
    pub const LeatherBelt: u8 = 61;
    pub const DemonhideBoots: u8 = 62;
    pub const DragonskinBoots: u8 = 63;
    pub const StuddedLeatherBoots: u8 = 64;
    pub const HardLeatherBoots: u8 = 65;
    pub const LeatherBoots: u8 = 66;
    pub const DemonsHands: u8 = 67;
    pub const DragonskinGloves: u8 = 68;
    pub const StuddedLeatherGloves: u8 = 69;
    pub const HardLeatherGloves: u8 = 70;
    pub const LeatherGloves: u8 = 71;
    pub const Warhammer: u8 = 72;
    pub const Quarterstaff: u8 = 73;
    pub const Maul: u8 = 74;
    pub const Mace: u8 = 75;
    pub const Club: u8 = 76;
    pub const HolyChestplate: u8 = 77;
    pub const OrnateChestplate: u8 = 78;
    pub const PlateMail: u8 = 79;
    pub const ChainMail: u8 = 80;
    pub const RingMail: u8 = 81;
    pub const AncientHelm: u8 = 82;
    pub const OrnateHelm: u8 = 83;
    pub const GreatHelm: u8 = 84;
    pub const FullHelm: u8 = 85;
    pub const Helm: u8 = 86;
    pub const OrnateBelt: u8 = 87;
    pub const WarBelt: u8 = 88;
    pub const PlatedBelt: u8 = 89;
    pub const MeshBelt: u8 = 90;
    pub const HeavyBelt: u8 = 91;
    pub const HolyGreaves: u8 = 92;
    pub const OrnateGreaves: u8 = 93;
    pub const Greaves: u8 = 94;
    pub const ChainBoots: u8 = 95;
    pub const HeavyBoots: u8 = 96;
    pub const HolyGauntlets: u8 = 97;
    pub const OrnateGauntlets: u8 = 98;
    pub const Gauntlets: u8 = 99;
    pub const ChainGloves: u8 = 100;
    pub const HeavyGloves: u8 = 101;
}

// Item Slot Length
pub mod ItemSlotLength {
    pub const SlotItemsLengthWeapon: u8 = 18;
    pub const SlotItemsLengthChest: u8 = 15;
    pub const SlotItemsLengthHead: u8 = 15;
    pub const SlotItemsLengthWaist: u8 = 15;
    pub const SlotItemsLengthFoot: u8 = 15;
    pub const SlotItemsLengthHand: u8 = 15;
    pub const SlotItemsLengthNeck: u8 = 3;
    pub const SlotItemsLengthRing: u8 = 5;
}

pub mod ItemIndex {
    // Weapon
    pub const Warhammer: u8 = 0;
    pub const Quarterstaff: u8 = 1;
    pub const Maul: u8 = 2;
    pub const Mace: u8 = 3;
    pub const Club: u8 = 4;
    pub const Katana: u8 = 5;
    pub const Falchion: u8 = 6;
    pub const Scimitar: u8 = 7;
    pub const LongSword: u8 = 8;
    pub const ShortSword: u8 = 9;
    pub const GhostWand: u8 = 10;
    pub const GraveWand: u8 = 11;
    pub const BoneWand: u8 = 12;
    pub const Wand: u8 = 13;
    pub const Grimoire: u8 = 14;
    pub const Chronicle: u8 = 15;
    pub const Tome: u8 = 16;
    pub const Book: u8 = 17;

    // Chest
    pub const DivineRobe: u8 = 0;
    pub const SilkRobe: u8 = 1;
    pub const LinenRobe: u8 = 2;
    pub const Robe: u8 = 3;
    pub const Shirt: u8 = 4;
    pub const DemonHusk: u8 = 5;
    pub const DragonskinArmor: u8 = 6;
    pub const StuddedLeatherArmor: u8 = 7;
    pub const HardLeatherArmor: u8 = 8;
    pub const LeatherArmor: u8 = 9;
    pub const HolyChestplate: u8 = 10;
    pub const OrnateChestplate: u8 = 11;
    pub const PlateMail: u8 = 12;
    pub const ChainMail: u8 = 13;
    pub const RingMail: u8 = 14;

    // Head
    pub const AncientHelm: u8 = 0;
    pub const OrnateHelm: u8 = 1;
    pub const GreatHelm: u8 = 2;
    pub const FullHelm: u8 = 3;
    pub const Helm: u8 = 4;
    pub const DemonCrown: u8 = 5;
    pub const DragonsCrown: u8 = 6;
    pub const WarCap: u8 = 7;
    pub const LeatherCap: u8 = 8;
    pub const Cap: u8 = 9;
    pub const Crown: u8 = 10;
    pub const DivineHood: u8 = 11;
    pub const SilkHood: u8 = 12;
    pub const LinenHood: u8 = 13;
    pub const Hood: u8 = 14;

    // Waist
    pub const OrnateBelt: u8 = 0;
    pub const WarBelt: u8 = 1;
    pub const PlatedBelt: u8 = 2;
    pub const MeshBelt: u8 = 3;
    pub const HeavyBelt: u8 = 4;
    pub const DemonhideBelt: u8 = 5;
    pub const DragonskinBelt: u8 = 6;
    pub const StuddedLeatherBelt: u8 = 7;
    pub const HardLeatherBelt: u8 = 8;
    pub const LeatherBelt: u8 = 9;
    pub const BrightsilkSash: u8 = 10;
    pub const SilkSash: u8 = 11;
    pub const WoolSash: u8 = 12;
    pub const LinenSash: u8 = 13;
    pub const Sash: u8 = 14;

    // Foot
    pub const HolyGreaves: u8 = 0;
    pub const OrnateGreaves: u8 = 1;
    pub const Greaves: u8 = 2;
    pub const ChainBoots: u8 = 3;
    pub const HeavyBoots: u8 = 4;
    pub const DemonhideBoots: u8 = 5;
    pub const DragonskinBoots: u8 = 6;
    pub const StuddedLeatherBoots: u8 = 7;
    pub const HardLeatherBoots: u8 = 8;
    pub const LeatherBoots: u8 = 9;
    pub const DivineSlippers: u8 = 10;
    pub const SilkSlippers: u8 = 11;
    pub const WoolShoes: u8 = 12;
    pub const LinenShoes: u8 = 13;
    pub const Shoes: u8 = 14;

    // Hand
    pub const HolyGauntlets: u8 = 0;
    pub const OrnateGauntlets: u8 = 1;
    pub const Gauntlets: u8 = 2;
    pub const ChainGloves: u8 = 3;
    pub const HeavyGloves: u8 = 4;
    pub const DemonsHands: u8 = 5;
    pub const DragonskinGloves: u8 = 6;
    pub const StuddedLeatherGloves: u8 = 7;
    pub const HardLeatherGloves: u8 = 8;
    pub const LeatherGloves: u8 = 9;
    pub const DivineGloves: u8 = 10;
    pub const SilkGloves: u8 = 11;
    pub const WoolGloves: u8 = 12;
    pub const LinenGloves: u8 = 13;
    pub const Gloves: u8 = 14;

    // Necklaces
    pub const Necklace: u8 = 0;
    pub const Amulet: u8 = 1;
    pub const Pendant: u8 = 2;

    // Rings
    pub const GoldRing: u8 = 0;
    pub const SilverRing: u8 = 1;
    pub const BronzeRing: u8 = 2;
    pub const PlatinumRing: u8 = 3;
    pub const TitaniumRing: u8 = 4;
}

pub mod ItemNamePrefix {
    pub const Agony: u8 = 1;
    pub const Apocalypse: u8 = 2;
    pub const Armageddon: u8 = 3;
    pub const Beast: u8 = 4;
    pub const Behemoth: u8 = 5;
    pub const Blight: u8 = 6;
    pub const Blood: u8 = 7;
    pub const Bramble: u8 = 8;
    pub const Brimstone: u8 = 9;
    pub const Brood: u8 = 10;
    pub const Carrion: u8 = 11;
    pub const Cataclysm: u8 = 12;
    pub const Chimeric: u8 = 13;
    pub const Corpse: u8 = 14;
    pub const Corruption: u8 = 15;
    pub const Damnation: u8 = 16;
    pub const Death: u8 = 17;
    pub const Demon: u8 = 18;
    pub const Dire: u8 = 19;
    pub const Dragon: u8 = 20;
    pub const Dread: u8 = 21;
    pub const Doom: u8 = 22;
    pub const Dusk: u8 = 23;
    pub const Eagle: u8 = 24;
    pub const Empyrean: u8 = 25;
    pub const Fate: u8 = 26;
    pub const Foe: u8 = 27;
    pub const Gale: u8 = 28;
    pub const Ghoul: u8 = 29;
    pub const Gloom: u8 = 30;
    pub const Glyph: u8 = 31;
    pub const Golem: u8 = 32;
    pub const Grim: u8 = 33;
    pub const Hate: u8 = 34;
    pub const Havoc: u8 = 35;
    pub const Honour: u8 = 36;
    pub const Horror: u8 = 37;
    pub const Hypnotic: u8 = 38;
    pub const Kraken: u8 = 39;
    pub const Loath: u8 = 40;
    pub const Maelstrom: u8 = 41;
    pub const Mind: u8 = 42;
    pub const Miracle: u8 = 43;
    pub const Morbid: u8 = 44;
    pub const Oblivion: u8 = 45;
    pub const Onslaught: u8 = 46;
    pub const Pain: u8 = 47;
    pub const Pandemonium: u8 = 48;
    pub const Phoenix: u8 = 49;
    pub const Plague: u8 = 50;
    pub const Rage: u8 = 51;
    pub const Rapture: u8 = 52;
    pub const Rune: u8 = 53;
    pub const Skull: u8 = 54;
    pub const Sol: u8 = 55;
    pub const Soul: u8 = 56;
    pub const Sorrow: u8 = 57;
    pub const Spirit: u8 = 58;
    pub const Storm: u8 = 59;
    pub const Tempest: u8 = 60;
    pub const Torment: u8 = 61;
    pub const Vengeance: u8 = 62;
    pub const Victory: u8 = 63;
    pub const Viper: u8 = 64;
    pub const Vortex: u8 = 65;
    pub const Woe: u8 = 66;
    pub const Wrath: u8 = 67;
    pub const Lights: u8 = 68;
    pub const Shimmering: u8 = 69;
}

pub mod ItemNameSuffix {
    pub const Bane: u8 = 1;
    pub const Root: u8 = 2;
    pub const Bite: u8 = 3;
    pub const Song: u8 = 4;
    pub const Roar: u8 = 5;
    pub const Grasp: u8 = 6;
    pub const Instrument: u8 = 7;
    pub const Glow: u8 = 8;
    pub const Bender: u8 = 9;
    pub const Shadow: u8 = 10;
    pub const Whisper: u8 = 11;
    pub const Shout: u8 = 12;
    pub const Growl: u8 = 13;
    pub const Tear: u8 = 14;
    pub const Peak: u8 = 15;
    pub const Form: u8 = 16;
    pub const Sun: u8 = 17;
    pub const Moon: u8 = 18;
}

pub mod ItemSuffix {
    pub const of_Power: u8 = 1;
    pub const of_Giant: u8 = 2;
    pub const of_Titans: u8 = 3;
    pub const of_Skill: u8 = 4;
    pub const of_Perfection: u8 = 5;
    pub const of_Brilliance: u8 = 6;
    pub const of_Enlightenment: u8 = 7;
    pub const of_Protection: u8 = 8;
    pub const of_Anger: u8 = 9;
    pub const of_Rage: u8 = 10;
    pub const of_Fury: u8 = 11;
    pub const of_Vitriol: u8 = 12;
    pub const of_the_Fox: u8 = 13;
    pub const of_Detection: u8 = 14;
    pub const of_Reflection: u8 = 15;
    pub const of_the_Twins: u8 = 16;
}

pub mod ItemString {
    pub const Pendant: felt252 = 'Pendant';
    pub const Necklace: felt252 = 'Necklace';
    pub const Amulet: felt252 = 'Amulet';
    pub const SilverRing: felt252 = 'Silver Ring';
    pub const BronzeRing: felt252 = 'Bronze Ring';
    pub const PlatinumRing: felt252 = 'Platinum Ring';
    pub const TitaniumRing: felt252 = 'Titanium Ring';
    pub const GoldRing: felt252 = 'Gold Ring';
    pub const GhostWand: felt252 = 'Ghost Wand';
    pub const GraveWand: felt252 = 'Grave Wand';
    pub const BoneWand: felt252 = 'Bone Wand';
    pub const Wand: felt252 = 'Wand';
    pub const Grimoire: felt252 = 'Grimoire';
    pub const Chronicle: felt252 = 'Chronicle';
    pub const Tome: felt252 = 'Tome';
    pub const Book: felt252 = 'Book';
    pub const DivineRobe: felt252 = 'Divine Robe';
    pub const SilkRobe: felt252 = 'Silk Robe';
    pub const LinenRobe: felt252 = 'Linen Robe';
    pub const Robe: felt252 = 'Robe';
    pub const Shirt: felt252 = 'Shirt';
    pub const Crown: felt252 = 'Crown';
    pub const DivineHood: felt252 = 'Divine Hood';
    pub const SilkHood: felt252 = 'Silk Hood';
    pub const LinenHood: felt252 = 'Linen Hood';
    pub const Hood: felt252 = 'Hood';
    pub const BrightsilkSash: felt252 = 'Brightsilk Sash';
    pub const SilkSash: felt252 = 'Silk Sash';
    pub const WoolSash: felt252 = 'Wool Sash';
    pub const LinenSash: felt252 = 'Linen Sash';
    pub const Sash: felt252 = 'Sash';
    pub const DivineSlippers: felt252 = 'Divine Slippers';
    pub const SilkSlippers: felt252 = 'Silk Slippers';
    pub const WoolShoes: felt252 = 'Wool Shoes';
    pub const LinenShoes: felt252 = 'Linen Shoes';
    pub const Shoes: felt252 = 'Shoes';
    pub const DivineGloves: felt252 = 'Divine Gloves';
    pub const SilkGloves: felt252 = 'Silk Gloves';
    pub const WoolGloves: felt252 = 'Wool Gloves';
    pub const LinenGloves: felt252 = 'Linen Gloves';
    pub const Gloves: felt252 = 'Gloves';
    pub const Katana: felt252 = 'Katana';
    pub const Falchion: felt252 = 'Falchion';
    pub const Scimitar: felt252 = 'Scimitar';
    pub const LongSword: felt252 = 'Long Sword';
    pub const ShortSword: felt252 = 'Short Sword';
    pub const DemonHusk: felt252 = 'Demon Husk';
    pub const DragonskinArmor: felt252 = 'Dragonskin Armor';
    pub const StuddedLeatherArmor: felt252 = 'Studded Leather Armor';
    pub const HardLeatherArmor: felt252 = 'Hard Leather Armor';
    pub const LeatherArmor: felt252 = 'Leather Armor';
    pub const DemonCrown: felt252 = 'Demon Crown';
    pub const DragonsCrown: felt252 = 'Dragon\'s Crown';
    pub const WarCap: felt252 = 'War Cap';
    pub const LeatherCap: felt252 = 'Leather Cap';
    pub const Cap: felt252 = 'Cap';
    pub const DemonhideBelt: felt252 = 'Demonhide Belt';
    pub const DragonskinBelt: felt252 = 'Dragonskin Belt';
    pub const StuddedLeatherBelt: felt252 = 'Studded Leather Belt';
    pub const HardLeatherBelt: felt252 = 'Hard Leather Belt';
    pub const LeatherBelt: felt252 = 'Leather Belt';
    pub const DemonhideBoots: felt252 = 'Demonhide Boots';
    pub const DragonskinBoots: felt252 = 'Dragonskin Boots';
    pub const StuddedLeatherBoots: felt252 = 'Studded Leather Boots';
    pub const HardLeatherBoots: felt252 = 'Hard Leather Boots';
    pub const LeatherBoots: felt252 = 'Leather Boots';
    pub const DemonsHands: felt252 = 'Demon\'s Hands';
    pub const DragonskinGloves: felt252 = 'Dragonskin Gloves';
    pub const StuddedLeatherGloves: felt252 = 'Studded Leather Gloves';
    pub const HardLeatherGloves: felt252 = 'Hard Leather Gloves';
    pub const LeatherGloves: felt252 = 'Leather Gloves';
    pub const Warhammer: felt252 = 'Warhammer';
    pub const Quarterstaff: felt252 = 'Quarterstaff';
    pub const Maul: felt252 = 'Maul';
    pub const Mace: felt252 = 'Mace';
    pub const Club: felt252 = 'Club';
    pub const HolyChestplate: felt252 = 'Holy Chestplate';
    pub const OrnateChestplate: felt252 = 'Ornate Chestplate';
    pub const PlateMail: felt252 = 'Plate Mail';
    pub const ChainMail: felt252 = 'Chain Mail';
    pub const RingMail: felt252 = 'Ring Mail';
    pub const AncientHelm: felt252 = 'Ancient Helm';
    pub const OrnateHelm: felt252 = 'Ornate Helm';
    pub const GreatHelm: felt252 = 'Great Helm';
    pub const FullHelm: felt252 = 'Full Helm';
    pub const Helm: felt252 = 'Helm';
    pub const OrnateBelt: felt252 = 'Ornate Belt';
    pub const WarBelt: felt252 = 'War Belt';
    pub const PlatedBelt: felt252 = 'Plated Belt';
    pub const MeshBelt: felt252 = 'Mesh Belt';
    pub const HeavyBelt: felt252 = 'Heavy Belt';
    pub const HolyGreaves: felt252 = 'Holy Greaves';
    pub const OrnateGreaves: felt252 = 'Ornate Greaves';
    pub const Greaves: felt252 = 'Greaves';
    pub const ChainBoots: felt252 = 'Chain Boots';
    pub const HeavyBoots: felt252 = 'Heavy Boots';
    pub const HolyGauntlets: felt252 = 'Holy Gauntlets';
    pub const OrnateGauntlets: felt252 = 'Ornate Gauntlets';
    pub const Gauntlets: felt252 = 'Gauntlets';
    pub const ChainGloves: felt252 = 'Chain Gloves';
    pub const HeavyGloves: felt252 = 'Heavy Gloves';
}

pub mod ItemSuffixString {
    pub const of_Power: felt252 = 'of Power';
    pub const of_Giant: felt252 = 'of Giant';
    pub const of_Titans: felt252 = 'of Titans';
    pub const of_Skill: felt252 = 'of Skill';
    pub const of_Perfection: felt252 = 'of Perfection';
    pub const of_Brilliance: felt252 = 'of Brilliance';
    pub const of_Enlightenment: felt252 = 'of Enlightenment';
    pub const of_Protection: felt252 = 'of Protection';
    pub const of_Anger: felt252 = 'of Anger';
    pub const of_Rage: felt252 = 'of Rage';
    pub const of_Fury: felt252 = 'of Fury';
    pub const of_Vitriol: felt252 = 'of Vitriol';
    pub const of_the_Fox: felt252 = 'of the Fox';
    pub const of_Detection: felt252 = 'of Detection';
    pub const of_Reflection: felt252 = 'of Reflection';
    pub const of_the_Twins: felt252 = 'of the Twins';
}

pub mod ItemNameSuffixString {
    pub const Bane: felt252 = 'Bane';
    pub const Root: felt252 = 'Root';
    pub const Bite: felt252 = 'Bite';
    pub const Song: felt252 = 'Song';
    pub const Roar: felt252 = 'Roar';
    pub const Grasp: felt252 = 'Grasp';
    pub const Instrument: felt252 = 'Instrument';
    pub const Glow: felt252 = 'Glow';
    pub const Bender: felt252 = 'Bender';
    pub const Shadow: felt252 = 'Shadow';
    pub const Whisper: felt252 = 'Whisper';
    pub const Shout: felt252 = 'Shout';
    pub const Growl: felt252 = 'Growl';
    pub const Tear: felt252 = 'Tear';
    pub const Peak: felt252 = 'Peak';
    pub const Form: felt252 = 'Form';
    pub const Sun: felt252 = 'Sun';
    pub const Moon: felt252 = 'Moon';
}

pub mod ItemNamePrefixString {
    pub const Agony: felt252 = 'Agony';
    pub const Apocalypse: felt252 = 'Apocalypse';
    pub const Armageddon: felt252 = 'Armageddon';
    pub const Beast: felt252 = 'Beast';
    pub const Behemoth: felt252 = 'Behemoth';
    pub const Blight: felt252 = 'Blight';
    pub const Blood: felt252 = 'Blood';
    pub const Bramble: felt252 = 'Bramble';
    pub const Brimstone: felt252 = 'Brimstone';
    pub const Brood: felt252 = 'Brood';
    pub const Carrion: felt252 = 'Carrion';
    pub const Cataclysm: felt252 = 'Cataclysm';
    pub const Chimeric: felt252 = 'Chimeric';
    pub const Corpse: felt252 = 'Corpse';
    pub const Corruption: felt252 = 'Corruption';
    pub const Damnation: felt252 = 'Damnation';
    pub const Death: felt252 = 'Death';
    pub const Demon: felt252 = 'Demon';
    pub const Dire: felt252 = 'Dire';
    pub const Dragon: felt252 = 'Dragon';
    pub const Dread: felt252 = 'Dread';
    pub const Doom: felt252 = 'Doom';
    pub const Dusk: felt252 = 'Dusk';
    pub const Eagle: felt252 = 'Eagle';
    pub const Empyrean: felt252 = 'Empyrean';
    pub const Fate: felt252 = 'Fate';
    pub const Foe: felt252 = 'Foe';
    pub const Gale: felt252 = 'Gale';
    pub const Ghoul: felt252 = 'Ghoul';
    pub const Gloom: felt252 = 'Gloom';
    pub const Glyph: felt252 = 'Glyph';
    pub const Golem: felt252 = 'Golem';
    pub const Grim: felt252 = 'Grim';
    pub const Hate: felt252 = 'Hate';
    pub const Havoc: felt252 = 'Havoc';
    pub const Honour: felt252 = 'Honour';
    pub const Horror: felt252 = 'Horror';
    pub const Hypnotic: felt252 = 'Hypnotic';
    pub const Kraken: felt252 = 'Kraken';
    pub const Loath: felt252 = 'Loath';
    pub const Maelstrom: felt252 = 'Maelstrom';
    pub const Mind: felt252 = 'Mind';
    pub const Miracle: felt252 = 'Miracle';
    pub const Morbid: felt252 = 'Morbid';
    pub const Oblivion: felt252 = 'Oblivion';
    pub const Onslaught: felt252 = 'Onslaught';
    pub const Pain: felt252 = 'Pain';
    pub const Pandemonium: felt252 = 'Pandemonium';
    pub const Phoenix: felt252 = 'Phoenix';
    pub const Plague: felt252 = 'Plague';
    pub const Rage: felt252 = 'Rage';
    pub const Rapture: felt252 = 'Rapture';
    pub const Rune: felt252 = 'Rune';
    pub const Skull: felt252 = 'Skull';
    pub const Sol: felt252 = 'Sol';
    pub const Soul: felt252 = 'Soul';
    pub const Sorrow: felt252 = 'Sorrow';
    pub const Spirit: felt252 = 'Spirit';
    pub const Storm: felt252 = 'Storm';
    pub const Tempest: felt252 = 'Tempest';
    pub const Torment: felt252 = 'Torment';
    pub const Vengeance: felt252 = 'Vengeance';
    pub const Victory: felt252 = 'Victory';
    pub const Viper: felt252 = 'Viper';
    pub const Vortex: felt252 = 'Vortex';
    pub const Woe: felt252 = 'Woe';
    pub const Wrath: felt252 = 'Wrath';
    pub const Lights: felt252 = 'Lights';
    pub const Shimmering: felt252 = 'Shimmering';
}

// suffix and prefix
pub const NamePrefixLength: u8 = 69; // requires 7 bits
pub const NameSuffixLength: u8 = 18; // requires 5 bits
pub const ItemSuffixLength: u8 = 16; // requires 4 bits

pub const NUM_ITEMS: u8 = 101;
pub const NUM_ITEMS_NZ: NonZero<u64> = 101;
pub const NUM_ITEMS_NZ_MINUS_ONE: NonZero<u64> = 100;
pub const SUFFIX_UNLOCK_GREATNESS: u8 = 15;
pub const PREFIXES_UNLOCK_GREATNESS: u8 = 19;


#[generate_trait]
pub impl ImplItemNaming of ItemNamingTrait {
    fn item_id_to_string(item: u8) -> felt252 {
        if (item == ItemId::Pendant) {
            ItemString::Pendant
        } else if (item == ItemId::Necklace) {
            ItemString::Necklace
        } else if (item == ItemId::Amulet) {
            ItemString::Amulet
        } else if (item == ItemId::SilverRing) {
            ItemString::SilverRing
        } else if (item == ItemId::BronzeRing) {
            ItemString::BronzeRing
        } else if (item == ItemId::PlatinumRing) {
            ItemString::PlatinumRing
        } else if (item == ItemId::TitaniumRing) {
            ItemString::TitaniumRing
        } else if (item == ItemId::GoldRing) {
            ItemString::GoldRing
        } else if (item == ItemId::GhostWand) {
            ItemString::GhostWand
        } else if (item == ItemId::GraveWand) {
            ItemString::GraveWand
        } else if (item == ItemId::BoneWand) {
            ItemString::BoneWand
        } else if (item == ItemId::Wand) {
            ItemString::Wand
        } else if (item == ItemId::Grimoire) {
            ItemString::Grimoire
        } else if (item == ItemId::Chronicle) {
            ItemString::Chronicle
        } else if (item == ItemId::Tome) {
            ItemString::Tome
        } else if (item == ItemId::Book) {
            ItemString::Book
        } else if (item == ItemId::DivineRobe) {
            ItemString::DivineRobe
        } else if (item == ItemId::SilkRobe) {
            ItemString::SilkRobe
        } else if (item == ItemId::LinenRobe) {
            ItemString::LinenRobe
        } else if (item == ItemId::Robe) {
            ItemString::Robe
        } else if (item == ItemId::Shirt) {
            ItemString::Shirt
        } else if (item == ItemId::Crown) {
            ItemString::Crown
        } else if (item == ItemId::DivineHood) {
            ItemString::DivineHood
        } else if (item == ItemId::SilkHood) {
            ItemString::SilkHood
        } else if (item == ItemId::LinenHood) {
            ItemString::LinenHood
        } else if (item == ItemId::Hood) {
            ItemString::Hood
        } else if (item == ItemId::BrightsilkSash) {
            ItemString::BrightsilkSash
        } else if (item == ItemId::SilkSash) {
            ItemString::SilkSash
        } else if (item == ItemId::WoolSash) {
            ItemString::WoolSash
        } else if (item == ItemId::LinenSash) {
            ItemString::LinenSash
        } else if (item == ItemId::Sash) {
            ItemString::Sash
        } else if (item == ItemId::DivineSlippers) {
            ItemString::DivineSlippers
        } else if (item == ItemId::SilkSlippers) {
            ItemString::SilkSlippers
        } else if (item == ItemId::WoolShoes) {
            ItemString::WoolShoes
        } else if (item == ItemId::LinenShoes) {
            ItemString::LinenShoes
        } else if (item == ItemId::Shoes) {
            ItemString::Shoes
        } else if (item == ItemId::DivineGloves) {
            ItemString::DivineGloves
        } else if (item == ItemId::SilkGloves) {
            ItemString::SilkGloves
        } else if (item == ItemId::WoolGloves) {
            ItemString::WoolGloves
        } else if (item == ItemId::LinenGloves) {
            ItemString::LinenGloves
        } else if (item == ItemId::Gloves) {
            ItemString::Gloves
        } else if (item == ItemId::Katana) {
            ItemString::Katana
        } else if (item == ItemId::Falchion) {
            ItemString::Falchion
        } else if (item == ItemId::Scimitar) {
            ItemString::Scimitar
        } else if (item == ItemId::LongSword) {
            ItemString::LongSword
        } else if (item == ItemId::ShortSword) {
            ItemString::ShortSword
        } else if (item == ItemId::DemonHusk) {
            ItemString::DemonHusk
        } else if (item == ItemId::DragonskinArmor) {
            ItemString::DragonskinArmor
        } else if (item == ItemId::StuddedLeatherArmor) {
            ItemString::StuddedLeatherArmor
        } else if (item == ItemId::HardLeatherArmor) {
            ItemString::HardLeatherArmor
        } else if (item == ItemId::LeatherArmor) {
            ItemString::LeatherArmor
        } else if (item == ItemId::DemonCrown) {
            ItemString::DemonCrown
        } else if (item == ItemId::DragonsCrown) {
            ItemString::DragonsCrown
        } else if (item == ItemId::WarCap) {
            ItemString::WarCap
        } else if (item == ItemId::LeatherCap) {
            ItemString::LeatherCap
        } else if (item == ItemId::Cap) {
            ItemString::Cap
        } else if (item == ItemId::DemonhideBelt) {
            ItemString::DemonhideBelt
        } else if (item == ItemId::DragonskinBelt) {
            ItemString::DragonskinBelt
        } else if (item == ItemId::StuddedLeatherBelt) {
            ItemString::StuddedLeatherBelt
        } else if (item == ItemId::HardLeatherBelt) {
            ItemString::HardLeatherBelt
        } else if (item == ItemId::LeatherBelt) {
            ItemString::LeatherBelt
        } else if (item == ItemId::DemonhideBoots) {
            ItemString::DemonhideBoots
        } else if (item == ItemId::DragonskinBoots) {
            ItemString::DragonskinBoots
        } else if (item == ItemId::StuddedLeatherBoots) {
            ItemString::StuddedLeatherBoots
        } else if (item == ItemId::HardLeatherBoots) {
            ItemString::HardLeatherBoots
        } else if (item == ItemId::LeatherBoots) {
            ItemString::LeatherBoots
        } else if (item == ItemId::DemonsHands) {
            ItemString::DemonsHands
        } else if (item == ItemId::DragonskinGloves) {
            ItemString::DragonskinGloves
        } else if (item == ItemId::StuddedLeatherGloves) {
            ItemString::StuddedLeatherGloves
        } else if (item == ItemId::HardLeatherGloves) {
            ItemString::HardLeatherGloves
        } else if (item == ItemId::LeatherGloves) {
            ItemString::LeatherGloves
        } else if (item == ItemId::Warhammer) {
            ItemString::Warhammer
        } else if (item == ItemId::Quarterstaff) {
            ItemString::Quarterstaff
        } else if (item == ItemId::Maul) {
            ItemString::Maul
        } else if (item == ItemId::Mace) {
            ItemString::Mace
        } else if (item == ItemId::Club) {
            ItemString::Club
        } else if (item == ItemId::HolyChestplate) {
            ItemString::HolyChestplate
        } else if (item == ItemId::OrnateChestplate) {
            ItemString::OrnateChestplate
        } else if (item == ItemId::PlateMail) {
            ItemString::PlateMail
        } else if (item == ItemId::ChainMail) {
            ItemString::ChainMail
        } else if (item == ItemId::RingMail) {
            ItemString::RingMail
        } else if (item == ItemId::AncientHelm) {
            ItemString::AncientHelm
        } else if (item == ItemId::OrnateHelm) {
            ItemString::OrnateHelm
        } else if (item == ItemId::GreatHelm) {
            ItemString::GreatHelm
        } else if (item == ItemId::FullHelm) {
            ItemString::FullHelm
        } else if (item == ItemId::Helm) {
            ItemString::Helm
        } else if (item == ItemId::OrnateBelt) {
            ItemString::OrnateBelt
        } else if (item == ItemId::WarBelt) {
            ItemString::WarBelt
        } else if (item == ItemId::PlatedBelt) {
            ItemString::PlatedBelt
        } else if (item == ItemId::MeshBelt) {
            ItemString::MeshBelt
        } else if (item == ItemId::HeavyBelt) {
            ItemString::HeavyBelt
        } else if (item == ItemId::HolyGreaves) {
            ItemString::HolyGreaves
        } else if (item == ItemId::OrnateGreaves) {
            ItemString::OrnateGreaves
        } else if (item == ItemId::Greaves) {
            ItemString::Greaves
        } else if (item == ItemId::ChainBoots) {
            ItemString::ChainBoots
        } else if (item == ItemId::HeavyBoots) {
            ItemString::HeavyBoots
        } else if (item == ItemId::HolyGauntlets) {
            ItemString::HolyGauntlets
        } else if (item == ItemId::OrnateGauntlets) {
            ItemString::OrnateGauntlets
        } else if (item == ItemId::Gauntlets) {
            ItemString::Gauntlets
        } else if (item == ItemId::ChainGloves) {
            ItemString::ChainGloves
        } else if (item == ItemId::HeavyGloves) {
            ItemString::HeavyGloves
        } else {
            ''
        }
    }

    fn prefix1_to_string(name_prefix: u8) -> felt252 {
        if (name_prefix == ItemNamePrefix::Agony) {
            ItemNamePrefixString::Agony
        } else if (name_prefix == ItemNamePrefix::Apocalypse) {
            ItemNamePrefixString::Apocalypse
        } else if (name_prefix == ItemNamePrefix::Armageddon) {
            ItemNamePrefixString::Armageddon
        } else if (name_prefix == ItemNamePrefix::Beast) {
            ItemNamePrefixString::Beast
        } else if (name_prefix == ItemNamePrefix::Behemoth) {
            ItemNamePrefixString::Behemoth
        } else if (name_prefix == ItemNamePrefix::Blight) {
            ItemNamePrefixString::Blight
        } else if (name_prefix == ItemNamePrefix::Blood) {
            ItemNamePrefixString::Blood
        } else if (name_prefix == ItemNamePrefix::Bramble) {
            ItemNamePrefixString::Bramble
        } else if (name_prefix == ItemNamePrefix::Brimstone) {
            ItemNamePrefixString::Brimstone
        } else if (name_prefix == ItemNamePrefix::Brood) {
            ItemNamePrefixString::Brood
        } else if (name_prefix == ItemNamePrefix::Carrion) {
            ItemNamePrefixString::Carrion
        } else if (name_prefix == ItemNamePrefix::Cataclysm) {
            ItemNamePrefixString::Cataclysm
        } else if (name_prefix == ItemNamePrefix::Chimeric) {
            ItemNamePrefixString::Chimeric
        } else if (name_prefix == ItemNamePrefix::Corpse) {
            ItemNamePrefixString::Corpse
        } else if (name_prefix == ItemNamePrefix::Corruption) {
            ItemNamePrefixString::Corruption
        } else if (name_prefix == ItemNamePrefix::Damnation) {
            ItemNamePrefixString::Damnation
        } else if (name_prefix == ItemNamePrefix::Death) {
            ItemNamePrefixString::Death
        } else if (name_prefix == ItemNamePrefix::Demon) {
            ItemNamePrefixString::Demon
        } else if (name_prefix == ItemNamePrefix::Dire) {
            ItemNamePrefixString::Dire
        } else if (name_prefix == ItemNamePrefix::Dragon) {
            ItemNamePrefixString::Dragon
        } else if (name_prefix == ItemNamePrefix::Dread) {
            ItemNamePrefixString::Dread
        } else if (name_prefix == ItemNamePrefix::Doom) {
            ItemNamePrefixString::Doom
        } else if (name_prefix == ItemNamePrefix::Dusk) {
            ItemNamePrefixString::Dusk
        } else if (name_prefix == ItemNamePrefix::Eagle) {
            ItemNamePrefixString::Eagle
        } else if (name_prefix == ItemNamePrefix::Empyrean) {
            ItemNamePrefixString::Empyrean
        } else if (name_prefix == ItemNamePrefix::Fate) {
            ItemNamePrefixString::Fate
        } else if (name_prefix == ItemNamePrefix::Foe) {
            ItemNamePrefixString::Foe
        } else if (name_prefix == ItemNamePrefix::Gale) {
            ItemNamePrefixString::Gale
        } else if (name_prefix == ItemNamePrefix::Ghoul) {
            ItemNamePrefixString::Ghoul
        } else if (name_prefix == ItemNamePrefix::Gloom) {
            ItemNamePrefixString::Gloom
        } else if (name_prefix == ItemNamePrefix::Glyph) {
            ItemNamePrefixString::Glyph
        } else if (name_prefix == ItemNamePrefix::Golem) {
            ItemNamePrefixString::Golem
        } else if (name_prefix == ItemNamePrefix::Grim) {
            ItemNamePrefixString::Grim
        } else if (name_prefix == ItemNamePrefix::Hate) {
            ItemNamePrefixString::Hate
        } else if (name_prefix == ItemNamePrefix::Havoc) {
            ItemNamePrefixString::Havoc
        } else if (name_prefix == ItemNamePrefix::Honour) {
            ItemNamePrefixString::Honour
        } else if (name_prefix == ItemNamePrefix::Horror) {
            ItemNamePrefixString::Horror
        } else if (name_prefix == ItemNamePrefix::Hypnotic) {
            ItemNamePrefixString::Hypnotic
        } else if (name_prefix == ItemNamePrefix::Kraken) {
            ItemNamePrefixString::Kraken
        } else if (name_prefix == ItemNamePrefix::Loath) {
            ItemNamePrefixString::Loath
        } else if (name_prefix == ItemNamePrefix::Maelstrom) {
            ItemNamePrefixString::Maelstrom
        } else if (name_prefix == ItemNamePrefix::Mind) {
            ItemNamePrefixString::Mind
        } else if (name_prefix == ItemNamePrefix::Miracle) {
            ItemNamePrefixString::Miracle
        } else if (name_prefix == ItemNamePrefix::Morbid) {
            ItemNamePrefixString::Morbid
        } else if (name_prefix == ItemNamePrefix::Oblivion) {
            ItemNamePrefixString::Oblivion
        } else if (name_prefix == ItemNamePrefix::Onslaught) {
            ItemNamePrefixString::Onslaught
        } else if (name_prefix == ItemNamePrefix::Pain) {
            ItemNamePrefixString::Pain
        } else if (name_prefix == ItemNamePrefix::Pandemonium) {
            ItemNamePrefixString::Pandemonium
        } else if (name_prefix == ItemNamePrefix::Phoenix) {
            ItemNamePrefixString::Phoenix
        } else if (name_prefix == ItemNamePrefix::Plague) {
            ItemNamePrefixString::Plague
        } else if (name_prefix == ItemNamePrefix::Rage) {
            ItemNamePrefixString::Rage
        } else if (name_prefix == ItemNamePrefix::Rapture) {
            ItemNamePrefixString::Rapture
        } else if (name_prefix == ItemNamePrefix::Rune) {
            ItemNamePrefixString::Rune
        } else if (name_prefix == ItemNamePrefix::Skull) {
            ItemNamePrefixString::Skull
        } else if (name_prefix == ItemNamePrefix::Sol) {
            ItemNamePrefixString::Sol
        } else if (name_prefix == ItemNamePrefix::Soul) {
            ItemNamePrefixString::Soul
        } else if (name_prefix == ItemNamePrefix::Sorrow) {
            ItemNamePrefixString::Sorrow
        } else if (name_prefix == ItemNamePrefix::Spirit) {
            ItemNamePrefixString::Spirit
        } else if (name_prefix == ItemNamePrefix::Storm) {
            ItemNamePrefixString::Storm
        } else if (name_prefix == ItemNamePrefix::Tempest) {
            ItemNamePrefixString::Tempest
        } else if (name_prefix == ItemNamePrefix::Torment) {
            ItemNamePrefixString::Torment
        } else if (name_prefix == ItemNamePrefix::Vengeance) {
            ItemNamePrefixString::Vengeance
        } else if (name_prefix == ItemNamePrefix::Victory) {
            ItemNamePrefixString::Victory
        } else if (name_prefix == ItemNamePrefix::Viper) {
            ItemNamePrefixString::Viper
        } else if (name_prefix == ItemNamePrefix::Vortex) {
            ItemNamePrefixString::Vortex
        } else if (name_prefix == ItemNamePrefix::Woe) {
            ItemNamePrefixString::Woe
        } else if (name_prefix == ItemNamePrefix::Wrath) {
            ItemNamePrefixString::Wrath
        } else if (name_prefix == ItemNamePrefix::Lights) {
            ItemNamePrefixString::Lights
        } else if (name_prefix == ItemNamePrefix::Shimmering) {
            ItemNamePrefixString::Shimmering
        } else {
            ''
        }
    }
    fn prefix2_to_string(name_suffix: u8) -> felt252 {
        if (name_suffix == ItemNameSuffix::Bane) {
            ItemNameSuffixString::Bane
        } else if (name_suffix == ItemNameSuffix::Root) {
            ItemNameSuffixString::Root
        } else if (name_suffix == ItemNameSuffix::Bite) {
            ItemNameSuffixString::Bite
        } else if (name_suffix == ItemNameSuffix::Song) {
            ItemNameSuffixString::Song
        } else if (name_suffix == ItemNameSuffix::Roar) {
            ItemNameSuffixString::Roar
        } else if (name_suffix == ItemNameSuffix::Grasp) {
            ItemNameSuffixString::Grasp
        } else if (name_suffix == ItemNameSuffix::Instrument) {
            ItemNameSuffixString::Instrument
        } else if (name_suffix == ItemNameSuffix::Glow) {
            ItemNameSuffixString::Glow
        } else if (name_suffix == ItemNameSuffix::Bender) {
            ItemNameSuffixString::Bender
        } else if (name_suffix == ItemNameSuffix::Shadow) {
            ItemNameSuffixString::Shadow
        } else if (name_suffix == ItemNameSuffix::Whisper) {
            ItemNameSuffixString::Whisper
        } else if (name_suffix == ItemNameSuffix::Shout) {
            ItemNameSuffixString::Shout
        } else if (name_suffix == ItemNameSuffix::Growl) {
            ItemNameSuffixString::Growl
        } else if (name_suffix == ItemNameSuffix::Tear) {
            ItemNameSuffixString::Tear
        } else if (name_suffix == ItemNameSuffix::Peak) {
            ItemNameSuffixString::Peak
        } else if (name_suffix == ItemNameSuffix::Form) {
            ItemNameSuffixString::Form
        } else if (name_suffix == ItemNameSuffix::Sun) {
            ItemNameSuffixString::Sun
        } else if (name_suffix == ItemNameSuffix::Moon) {
            ItemNameSuffixString::Moon
        } else {
            ''
        }
    }
    fn suffix_to_string(suffix: u8) -> felt252 {
        if (suffix == ItemSuffix::of_Power) {
            ItemSuffixString::of_Power
        } else if (suffix == ItemSuffix::of_Giant) {
            ItemSuffixString::of_Giant
        } else if (suffix == ItemSuffix::of_Titans) {
            ItemSuffixString::of_Titans
        } else if (suffix == ItemSuffix::of_Skill) {
            ItemSuffixString::of_Skill
        } else if (suffix == ItemSuffix::of_Perfection) {
            ItemSuffixString::of_Perfection
        } else if (suffix == ItemSuffix::of_Brilliance) {
            ItemSuffixString::of_Brilliance
        } else if (suffix == ItemSuffix::of_Enlightenment) {
            ItemSuffixString::of_Enlightenment
        } else if (suffix == ItemSuffix::of_Protection) {
            ItemSuffixString::of_Protection
        } else if (suffix == ItemSuffix::of_Anger) {
            ItemSuffixString::of_Anger
        } else if (suffix == ItemSuffix::of_Rage) {
            ItemSuffixString::of_Rage
        } else if (suffix == ItemSuffix::of_Fury) {
            ItemSuffixString::of_Fury
        } else if (suffix == ItemSuffix::of_Vitriol) {
            ItemSuffixString::of_Vitriol
        } else if (suffix == ItemSuffix::of_the_Fox) {
            ItemSuffixString::of_the_Fox
        } else if (suffix == ItemSuffix::of_Detection) {
            ItemSuffixString::of_Detection
        } else if (suffix == ItemSuffix::of_Reflection) {
            ItemSuffixString::of_Reflection
        } else if (suffix == ItemSuffix::of_the_Twins) {
            ItemSuffixString::of_the_Twins
        } else {
            ''
        }
    }
}
