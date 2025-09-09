// SPDX-License-Identifier: MIT
//
// @title Battle Page Generator
// @notice Functions for generating complete battle page content with modular 3-row layout
// @dev Implements the modular battle interface matching Frame 4191 reference design
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::adventurer::{AdventurerVerbose, ImplAdventurer};

// Import UI components
use death_mountain::utils::renderer::core::text_utils::{
    generate_adventurer_name_text_with_page, generate_logo_with_page,
};

// Import modular battle layout components
use death_mountain::utils::renderer::pages::battle_layout::{
    generate_battle_message_row, generate_beast_battle_row, generate_health_bar, generate_player_battle_row,
};
use death_mountain::utils::renderer::pages::battle_messages::generate_battle_message;
use death_mountain::utils::renderer::pages::battle_sprites::{generate_beast_sprite, generate_player_sprite};
use death_mountain::utils::string::string_utils::felt252_to_string;

/// @notice Generate battle page content (Page 2 - Battle interface)
/// @dev Creates modular 3-row battle layout with beast, message, and player sections
/// @param adventurer The adventurer data to render
/// @return Complete SVG content for battle page with modular layout
pub fn generate_battle_page_content(adventurer: AdventurerVerbose) -> ByteArray {
    let mut content = "";

    // Add custom two-line battle header: "<name>'s" and "Current Battle"
    let player_name = felt252_to_string(adventurer.name);

    // First line: Player name with apostrophe-s (using standard positioning for page 2)
    content += generate_adventurer_name_text_with_page(player_name + "'s", 2);

    // Second line: "Current Battle" (positioned below the player name at aligned x position)
    content +=
        "<text x=\"274\" y=\"160\" text-anchor=\"left\" fill=\"#FE9676\" font-family=\"monospace\" font-size=\"20\" font-weight=\"bold\">Current Battle</text>";

    content += generate_logo_with_page(2);

    // Generate modular battle layout components

    // Row 1: beast battle information (red/pink theme)
    // Beast power and level are unknown, so display dashes
    content += generate_beast_battle_row("-", "-");

    // Add beast sprite to the character column
    content += generate_beast_sprite(260, 280);

    // Display beast health as text only (no health bar since we don't know max health)
    if adventurer.beast_health > 0 {
        content += "<text x=\"260\" y=\"405\" fill=\"#FE9676\" class=\"s16\" text-anchor=\"middle\">";
        content += format!("{}", adventurer.beast_health);
        content += " HP</text>";
    }

    // Row 2: Battle message (orange theme)
    let battle_message = generate_battle_message(adventurer.clone());
    content += generate_battle_message_row(battle_message);

    // Row 3: Player battle information (green theme)
    content += generate_player_battle_row(adventurer.clone());

    // Add player sprite to the character column
    let has_weapon = adventurer.equipment.weapon.id != 0;
    content += generate_player_sprite(260, 620, has_weapon);

    // Add player health bar - use proper max health calculation
    let max_health: u64 = adventurer.stats.get_max_health().into();
    content += generate_health_bar(235, 740, adventurer.health.into(), max_health, "#78E846");

    content
}
