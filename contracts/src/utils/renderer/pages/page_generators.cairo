// SPDX-License-Identifier: MIT
//
// @title Page Content Generators
// @notice Functions for generating complete page content and layouts
// @dev Handles page routing, content generation, and page wrapper functionality
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::adventurer::AdventurerVerbose;
pub use death_mountain::utils::renderer::pages::battle::generate_battle_page_content;

// Local import for death page
pub use death_mountain::utils::renderer::pages::death::generate_death_page_content;

// Import and re-export individual page modules for backward compatibility
pub use death_mountain::utils::renderer::pages::inventory::generate_inventory_page_content;
pub use death_mountain::utils::renderer::pages::item_bag::generate_item_bag_page_content;

/// @notice Main page router - generates content based on page number
/// @dev Routes to appropriate page content generator based on page parameter
/// @param adventurer The adventurer data to render
/// @param page The page number (0=inventory, 1=bag, 2=battle, 3=death)
/// @return Complete page content for the specified page
pub fn generate_page_content(adventurer: AdventurerVerbose, page: u8) -> ByteArray {
    match page {
        0 => generate_inventory_page_content(adventurer),
        1 => generate_item_bag_page_content(adventurer),
        2 => generate_battle_page_content(adventurer),
        3 => generate_death_page_content(adventurer),
        _ => generate_inventory_page_content(adventurer) // Default to inventory page
    }
}


/// @notice Generate page wrapper with animation class and background
/// @dev Wraps page content with animation classes and background for smooth transitions
/// @param page_content The page content to wrap
/// @param border_content The border content to include
/// @return Complete wrapped page with animation support
pub fn generate_page_wrapper(page_content: ByteArray, border_content: ByteArray) -> ByteArray {
    let mut wrapper = "";
    wrapper += "<g class=\"page\" clip-path=\"url(#b)\">";
    wrapper += "<rect width=\"567\" height=\"862\" x=\"147.2\" y=\"27\" fill=\"#000\" rx=\"10\"/>";
    wrapper += page_content;
    wrapper += border_content;
    wrapper += "</g>";
    wrapper
}
