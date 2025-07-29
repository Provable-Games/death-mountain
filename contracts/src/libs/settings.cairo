use death_mountain::models::game::GameSettings;
use game_components_minigame::extensions::settings::structs::GameSetting;

pub fn generate_settings_array(game_settings: GameSettings) -> Span<GameSetting> {
    array![
        GameSetting { name: "Starting Health", value: format!("{}", game_settings.adventurer.health) },
        GameSetting { name: "Starting XP", value: format!("{}", game_settings.adventurer.xp) },
        GameSetting { name: "Starting Gold", value: format!("{}", game_settings.adventurer.gold) },
        GameSetting { name: "Starting Strength", value: format!("{}", game_settings.adventurer.stats.strength) },
        GameSetting { name: "Starting Dexterity", value: format!("{}", game_settings.adventurer.stats.dexterity) },
        GameSetting { name: "Starting Vitality", value: format!("{}", game_settings.adventurer.stats.vitality) },
        GameSetting {
            name: "Starting Intelligence", value: format!("{}", game_settings.adventurer.stats.intelligence),
        },
        GameSetting { name: "Starting Wisdom", value: format!("{}", game_settings.adventurer.stats.wisdom) },
        GameSetting { name: "Starting Charisma", value: format!("{}", game_settings.adventurer.stats.charisma) },
        GameSetting { name: "Starting Luck", value: format!("{}", game_settings.adventurer.stats.luck) },
        GameSetting { name: "Beast Health", value: format!("{}", game_settings.adventurer.beast_health) },
        GameSetting {
            name: "Stats Upgrades Available", value: format!("{}", game_settings.adventurer.stat_upgrades_available),
        },
        GameSetting { name: "Starting Weapon ID", value: format!("{}", game_settings.adventurer.equipment.weapon.id) },
        GameSetting { name: "Starting Weapon XP", value: format!("{}", game_settings.adventurer.equipment.weapon.xp) },
        GameSetting {
            name: "Starting Chest Armor ID", value: format!("{}", game_settings.adventurer.equipment.chest.id),
        },
        GameSetting {
            name: "Starting Chest Armor XP", value: format!("{}", game_settings.adventurer.equipment.chest.xp),
        },
        GameSetting {
            name: "Starting Head Armor ID", value: format!("{}", game_settings.adventurer.equipment.head.id),
        },
        GameSetting {
            name: "Starting Head Armor XP", value: format!("{}", game_settings.adventurer.equipment.head.xp),
        },
        GameSetting {
            name: "Starting Waist Armor ID", value: format!("{}", game_settings.adventurer.equipment.waist.id),
        },
        GameSetting {
            name: "Starting Waist Armor XP", value: format!("{}", game_settings.adventurer.equipment.waist.xp),
        },
        GameSetting {
            name: "Starting Foot Armor ID", value: format!("{}", game_settings.adventurer.equipment.foot.id),
        },
        GameSetting {
            name: "Starting Foot Armor XP", value: format!("{}", game_settings.adventurer.equipment.foot.xp),
        },
        GameSetting {
            name: "Starting Hand Armor ID", value: format!("{}", game_settings.adventurer.equipment.hand.id),
        },
        GameSetting {
            name: "Starting Hand Armor XP", value: format!("{}", game_settings.adventurer.equipment.hand.xp),
        },
        GameSetting { name: "Starting Neck Item ID", value: format!("{}", game_settings.adventurer.equipment.neck.id) },
        GameSetting { name: "Starting Neck Item XP", value: format!("{}", game_settings.adventurer.equipment.neck.xp) },
        GameSetting { name: "Starting Ring ID", value: format!("{}", game_settings.adventurer.equipment.ring.id) },
        GameSetting { name: "Starting Ring XP", value: format!("{}", game_settings.adventurer.equipment.ring.xp) },
        GameSetting { name: "Starting Bag Item 1 ID", value: format!("{}", game_settings.bag.item_1.id) },
        GameSetting { name: "Starting Bag Item 1 XP", value: format!("{}", game_settings.bag.item_1.xp) },
        GameSetting { name: "Starting Bag Item 2 ID", value: format!("{}", game_settings.bag.item_2.id) },
        GameSetting { name: "Starting Bag Item 2 XP", value: format!("{}", game_settings.bag.item_2.xp) },
        GameSetting { name: "Starting Bag Item 3 ID", value: format!("{}", game_settings.bag.item_3.id) },
        GameSetting { name: "Starting Bag Item 3 XP", value: format!("{}", game_settings.bag.item_3.xp) },
        GameSetting { name: "Starting Bag Item 4 ID", value: format!("{}", game_settings.bag.item_4.id) },
        GameSetting { name: "Starting Bag Item 4 XP", value: format!("{}", game_settings.bag.item_4.xp) },
        GameSetting { name: "Starting Bag Item 5 ID", value: format!("{}", game_settings.bag.item_5.id) },
        GameSetting { name: "Starting Bag Item 5 XP", value: format!("{}", game_settings.bag.item_5.xp) },
        GameSetting { name: "Starting Bag Item 6 ID", value: format!("{}", game_settings.bag.item_6.id) },
        GameSetting { name: "Starting Bag Item 6 XP", value: format!("{}", game_settings.bag.item_6.xp) },
        GameSetting { name: "Starting Bag Item 7 ID", value: format!("{}", game_settings.bag.item_7.id) },
        GameSetting { name: "Starting Bag Item 7 XP", value: format!("{}", game_settings.bag.item_7.xp) },
        GameSetting { name: "Starting Bag Item 8 ID", value: format!("{}", game_settings.bag.item_8.id) },
        GameSetting { name: "Starting Bag Item 8 XP", value: format!("{}", game_settings.bag.item_8.xp) },
        GameSetting { name: "Starting Bag Item 9 ID", value: format!("{}", game_settings.bag.item_9.id) },
        GameSetting { name: "Starting Bag Item 9 XP", value: format!("{}", game_settings.bag.item_9.xp) },
        GameSetting { name: "Starting Bag Item 10 ID", value: format!("{}", game_settings.bag.item_10.id) },
        GameSetting { name: "Starting Bag Item 10 XP", value: format!("{}", game_settings.bag.item_10.xp) },
        GameSetting { name: "Starting Bag Item 11 ID", value: format!("{}", game_settings.bag.item_11.id) },
        GameSetting { name: "Starting Bag Item 11 XP", value: format!("{}", game_settings.bag.item_11.xp) },
        GameSetting { name: "Starting Bag Item 12 ID", value: format!("{}", game_settings.bag.item_12.id) },
        GameSetting { name: "Starting Bag Item 12 XP", value: format!("{}", game_settings.bag.item_12.xp) },
        GameSetting { name: "Starting Bag Item 13 ID", value: format!("{}", game_settings.bag.item_13.id) },
        GameSetting { name: "Starting Bag Item 13 XP", value: format!("{}", game_settings.bag.item_13.xp) },
        GameSetting { name: "Starting Bag Item 14 ID", value: format!("{}", game_settings.bag.item_14.id) },
        GameSetting { name: "Starting Bag Item 14 XP", value: format!("{}", game_settings.bag.item_14.xp) },
        GameSetting { name: "Starting Bag Item 15 ID", value: format!("{}", game_settings.bag.item_15.id) },
        GameSetting { name: "Starting Bag Item 15 XP", value: format!("{}", game_settings.bag.item_15.xp) },
        GameSetting { name: "Game Seed", value: format!("{}", game_settings.game_seed) },
        GameSetting { name: "Game Seed Until XP", value: format!("{}", game_settings.game_seed_until_xp) },
        GameSetting { name: "In Battle", value: format!("{}", game_settings.in_battle) },
        GameSetting { name: "Base Damage Reduction", value: format!("{}", game_settings.base_damage_reduction) },
    ]
        .span()
}
