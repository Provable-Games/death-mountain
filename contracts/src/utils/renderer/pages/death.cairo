// SPDX-License-Identifier: MIT
//
// @title Death Page Generator
// @notice Functions for generating the death page content with grey theme
// @dev Creates a grey-themed page similar to inventory but without equipment section
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::adventurer::AdventurerVerbose;
use death_mountain::utils::renderer::components::icons::grave_icon;

use death_mountain::utils::renderer::components::ui_components::{
    generate_gold_display_with_page, generate_level_display_with_page, generate_stats_text_with_page,
};
use death_mountain::utils::renderer::core::text_utils::{
    generate_adventurer_name_text_with_page, generate_logo_with_page,
};
use death_mountain::utils::string::string_utils::{felt252_to_string, u64_to_string};

/// @notice Generate death page content (Page 3 - Grey theme)
/// @dev Creates complete death page with stats, but no equipment section
/// @param adventurer The adventurer data to render (should have health == 0)
/// @return Complete SVG content for death page with grey theme
pub fn generate_death_page_content(adventurer: AdventurerVerbose) -> ByteArray {
    let mut content = "";

    // Use page 3 for grey theme
    content += generate_stats_text_with_page(adventurer.stats, 3);
    content += generate_adventurer_name_text_with_page(felt252_to_string(adventurer.name), 3);
    content += generate_logo_with_page(3);
    content += generate_gold_display_with_page(adventurer.gold, 3);
    content += generate_level_display_with_page(adventurer.level, 3);
    content += generate_grave_icon_positioned();
    content += generate_death_message(adventurer.xp);

    content
}


/// @notice Generate positioned grave icon for death page
/// @dev Creates grave icon centered and scaled accounting for left-side stats text
/// @return SVG group element containing the positioned grave icon
pub fn generate_grave_icon_positioned() -> ByteArray {
    let mut positioned_icon = "";

    // Position the grave icon at x=320 to align with death message text
    // Positioned at (320, 320) to align with text, scaled 3.0x
    positioned_icon += "<g transform=\"translate(320, 320) scale(3.0)\" viewBox=\"0 0 80 100\">";
    positioned_icon += grave_icon();
    positioned_icon += "</g>";

    positioned_icon
}

/// @notice Generate Death Mountain inspired death message
/// @dev Creates a 3-line death message with heroic tone, only XP as variable
/// @param adventurer The deceased adventurer data (only XP is used)
/// @return SVG text elements containing the formatted death message
pub fn generate_death_message(adventurer_xp: u16) -> ByteArray {
    let mut message = "";

    let xp_str = u64_to_string(adventurer_xp.into());

    message += "<text x=\"440\" y=\"655\" fill=\"#888888\" class=\"s16\" text-anchor=\"middle\">";
    message += "Though they fought valiantly,";
    message += "</text>";

    message += "<text x=\"440\" y=\"688\" fill=\"#888888\" class=\"s16\" text-anchor=\"middle\">";
    message += "Death Mountain has claimed another.";
    message += "</text>";

    message += "<text x=\"440\" y=\"721\" fill=\"#888888\" class=\"s16\" text-anchor=\"middle\">";
    message += "Final score: <tspan font-weight=\"bold\">";
    message += xp_str;
    message += "</tspan> XP";
    message += "</text>";

    message
}
