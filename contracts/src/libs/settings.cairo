use death_mountain::models::game::GameSettings;
use game_components_minigame::extensions::settings::structs::GameSetting;

pub fn generate_settings_array(game_settings: GameSettings) -> Span<GameSetting> {
    // Equipment and bag has been removed
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
        GameSetting { name: "Game Seed", value: format!("{}", game_settings.game_seed) },
        GameSetting { name: "Game Seed Until XP", value: format!("{}", game_settings.game_seed_until_xp) },
        GameSetting { name: "In Battle", value: format!("{}", game_settings.in_battle) },
        GameSetting { name: "Base Damage Reduction", value: format!("{}", game_settings.base_damage_reduction) },
    ]
        .span()
}
