// SPDX-License-Identifier: MIT
//
// @title Item Bag Page Generator
// @notice Functions for generating complete item bag page content
// @dev Handles bag page assembly with bag items, slots, icons, badges, and themed styling
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::adventurer::AdventurerVerbose;

use death_mountain::utils::renderer::bag::bag_renderer::{
    generate_bag_header, generate_bag_item_icons, generate_bag_item_level_badges, generate_bag_item_names,
    generate_bag_item_slots,
};

use death_mountain::utils::renderer::components::ui_components::{
    generate_gold_display_with_page, generate_health_bar_with_page, generate_level_display_with_page,
};
use death_mountain::utils::renderer::core::text_utils::{
    generate_adventurer_name_text_with_page, generate_logo_with_page,
};
use death_mountain::utils::string::string_utils::felt252_to_string;

/// @notice Generate item bag page content (Page 1 - Orange theme)
/// @dev Creates complete bag page with bag items, slots, icons, badges, and names
/// @param adventurer The adventurer data to render
/// @return Complete SVG content for bag page
pub fn generate_item_bag_page_content(adventurer: AdventurerVerbose) -> ByteArray {
    let mut content = "";

    // Copy inventory layout elements but without stats section
    content += generate_adventurer_name_text_with_page(felt252_to_string(adventurer.name), 1);
    content += generate_logo_with_page(1);
    content += generate_gold_display_with_page(adventurer.gold, 1);
    content += generate_level_display_with_page(adventurer.level, 1);
    content += generate_health_bar_with_page(adventurer.stats, adventurer.health, 1);
    content += generate_bag_header();
    content += generate_bag_item_slots();
    content += generate_bag_item_icons(adventurer.bag);
    content += generate_bag_item_level_badges(adventurer.bag);
    content += generate_bag_item_names(adventurer.bag);

    content
}
