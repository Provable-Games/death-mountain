// SPDX-License-Identifier: MIT
//
// @title Inventory Page Generator
// @notice Functions for generating complete inventory page content
// @dev Handles inventory page assembly with stats, equipment, and themed styling
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::adventurer::AdventurerVerbose;

use death_mountain::utils::renderer::components::ui_components::{
    generate_gold_display_with_page, generate_health_bar_with_page, generate_level_display_with_page,
    generate_stats_text_with_page,
};
use death_mountain::utils::renderer::core::text_utils::{
    generate_adventurer_name_text_with_page, generate_logo_with_page,
};

use death_mountain::utils::renderer::equipment::{
    badges::generate_equipment_level_badges, names::generate_equipment_names, positioning::generate_equipment_icons,
    slots::generate_equipment_slots,
};
use death_mountain::utils::string::string_utils::felt252_to_string;


/// @notice Generate inventory page content (Page 0 - Green theme)
/// @dev Creates complete inventory page with stats, equipment slots, icons, badges, and names
/// @param adventurer The adventurer data to render
/// @return Complete SVG content for inventory page
pub fn generate_inventory_page_content(adventurer: AdventurerVerbose) -> ByteArray {
    let mut content = "";

    content += generate_stats_text_with_page(adventurer.stats, 0);
    content += generate_adventurer_name_text_with_page(felt252_to_string(adventurer.name), 0);
    content += generate_logo_with_page(0);
    content += generate_gold_display_with_page(adventurer.gold, 0);
    content += generate_level_display_with_page(adventurer.level, 0);
    content += generate_health_bar_with_page(adventurer.stats, adventurer.health, 0);
    content += generate_inventory_header();
    content += generate_equipment_slots();
    content += generate_equipment_icons();
    content += generate_equipment_level_badges(adventurer.equipment);
    content += generate_equipment_names(adventurer.equipment);

    content
}

/// @notice Generate inventory section header with themed styling
/// @dev Creates styled "INVENTORY" text header with green theme color - moved here from
/// renderer_utils @return SVG text element for inventory section header
pub fn generate_inventory_header() -> ByteArray {
    let mut inventory_header = "";
    inventory_header += "<text x=\"286\" y=\"325\" fill=\"#78E846\" class=\"s16\">";
    inventory_header += "INVENTORY";
    inventory_header += "</text>";
    inventory_header
}
