// SPDX-License-Identifier: MIT
//
// @title Bag Renderer
// @notice Functions for rendering bag-related UI elements
// @dev Handles bag header, slots, icons, level badges, and item names
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::bag::BagVerbose;
use death_mountain::utils::renderer::bag::bag_utils::{
    get_bag_item_by_index, get_bag_item_words, get_icon_position_adjustment, get_item_icon_svg,
};
use death_mountain::utils::renderer::components::theme::get_theme_color;
use death_mountain::utils::renderer::core::math_utils::get_greatness;
use death_mountain::utils::string::string_utils::{u256_to_string, u8_to_string};

/// @notice Generate bag section header with themed styling
/// @dev Creates "ITEM BAG" header text with orange theme positioning
/// @return SVG text element for bag header
pub fn generate_bag_header() -> ByteArray {
    let mut bag_header = "";
    let theme_color = get_theme_color(1); // Orange theme for bag
    bag_header += "<text x=\"213\" y=\"325\" fill=\"";
    bag_header += theme_color;
    bag_header += "\" class=\"s16\" text-anchor=\"left\">";
    bag_header += "ITEM BAG";
    bag_header += "</text>";
    bag_header
}

/// @notice Generate bag item slot containers in 3x5 grid layout
/// @dev Creates 15 item slots with proper spacing and orange theme styling
/// @return Complete SVG markup for all bag item slots
pub fn generate_bag_item_slots() -> ByteArray {
    let mut slots = "";

    // Use updated spacing pattern from manual adjustments: 20px spacing = 91px total spacing
    // (71+20)
    // Manual layout: x="213, 304, 395, 486, 577" = 91px spacing between centers
    let start_x = 213_u16; // Match manual layout starting position
    let start_y = 350_u16; // Same as original
    let slot_size = 71_u16; // Same as equipment
    let spacing_x = 91_u16; // Match manual layout: 304-213=91px spacing between centers
    let spacing_y = 134_u16; // Match manual layout: 484-350=134px vertical spacing

    let mut row = 0_u8;
    while row < 3 { // 3 rows
        let mut col = 0_u8;
        while col < 5 { // 5 columns
            let x = start_x + (col.into() * spacing_x);
            let y = start_y + (row.into() * spacing_y);
            slots += "<rect width=\""
                + u256_to_string(slot_size.into())
                + "\" height=\""
                + u256_to_string(slot_size.into())
                + "\" x=\""
                + u256_to_string(x.into())
                + "\" y=\""
                + u256_to_string(y.into())
                + "\" stroke=\"#B5561F\" rx=\"5.5\" fill=\"none\"/>";
            col += 1;
        };
        row += 1;
    };

    slots
}

/// @notice Generate bag item icons positioned within slots
/// @dev Creates themed icons for all bag items with proper positioning and icon-specific
/// adjustments @param bag The bag containing items to render
/// @return Complete SVG markup for all visible bag item icons
pub fn generate_bag_item_icons(bag: BagVerbose) -> ByteArray {
    let mut icons = "";
    let theme_color = get_theme_color(1); // Orange theme

    // Array of bag items for easier iteration
    let bag_items = array![
        bag.item_1,
        bag.item_2,
        bag.item_3,
        bag.item_4,
        bag.item_5,
        bag.item_6,
        bag.item_7,
        bag.item_8,
        bag.item_9,
        bag.item_10,
        bag.item_11,
        bag.item_12,
        bag.item_13,
        bag.item_14,
        bag.item_15,
    ];

    // Match the updated slot positioning from manual adjustments
    let start_x = 213_u16; // Same as updated slots
    let start_y = 350_u16; // Same as slots  
    let spacing_x = 91_u16; // Same as updated slots
    let spacing_y = 134_u16; // Same as updated slots

    // Center icon within each slot - manual layout uses: translate(225, 362) for first icon
    // 225 - 213 = 12px offset to center the 3x scaled icon in the 71px slot
    let icon_offset_x = 12_u16; // Match manual layout centering
    let icon_offset_y = 12_u16; // Match manual layout centering
    let icon_start_x = start_x + icon_offset_x;
    let icon_start_y = start_y + icon_offset_y;

    let mut item_index = 0_u8;
    while item_index < 15 {
        let item = *bag_items.at(item_index.into());
        if item.id != 0 { // Only render if item exists
            let row = item_index / 5; // 5 items per row now
            let col = item_index % 5; // Column within the row
            let base_x = icon_start_x + (col.into() * spacing_x);
            let base_y = icon_start_y + (row.into() * spacing_y);

            // Apply icon-specific positioning adjustments
            let (adj_x, adj_y) = get_icon_position_adjustment(item.slot);
            let base_x_i32: i32 = base_x.into();
            let base_y_i32: i32 = base_y.into();
            let adj_x_i32: i32 = adj_x.into();
            let adj_y_i32: i32 = adj_y.into();
            let x: u16 = (base_x_i32 + adj_x_i32).try_into().unwrap();
            let y: u16 = (base_y_i32 + adj_y_i32).try_into().unwrap();

            // Get appropriate icon based on item slot type
            let icon_svg = get_item_icon_svg(item.slot);
            icons += "<g transform=\"translate("
                + u256_to_string(x.into())
                + ", "
                + u256_to_string(y.into())
                + ") scale(3)\" fill=\""
                + theme_color.clone()
                + "\">"
                + icon_svg
                + "</g>";
        }
        item_index += 1;
    };

    icons
}

/// @notice Generate level badges for bag items
/// @dev Creates level badges positioned at slot edges with XP-based greatness calculation
/// @param bag The bag containing items with XP values for level calculation
/// @return Complete SVG markup for all bag item level badges
pub fn generate_bag_item_level_badges(bag: BagVerbose) -> ByteArray {
    let mut badges = "";
    let theme_color = get_theme_color(1); // Orange theme

    // Array of bag items for easier iteration
    let bag_items = array![
        bag.item_1,
        bag.item_2,
        bag.item_3,
        bag.item_4,
        bag.item_5,
        bag.item_6,
        bag.item_7,
        bag.item_8,
        bag.item_9,
        bag.item_10,
        bag.item_11,
        bag.item_12,
        bag.item_13,
        bag.item_14,
        bag.item_15,
    ];

    // Badge positioning: positioned using cell x + 49px offset, y aligned with cell tops minus 8px
    // Manual layout: badges at x="262, 353, 444, 535, 626" y="342, 476, 610"
    let start_x = 213_u16;
    let start_y = 350_u16;
    let spacing_x = 91_u16;
    let spacing_y = 134_u16;
    let badge_width = 38_u16;
    let badge_height = 16_u16;
    let badge_offset_x = 49_u16; // Cell x + 49px to match manual positioning
    let badge_offset_y = -8_i16; // Cell y - 8px to align badge middle with cell top line

    let mut item_index = 0_u8;
    while item_index < 15 {
        let item = *bag_items.at(item_index.into());
        if item.id != 0 { // Only render badges for items that exist
            let row = item_index / 5; // 5 items per row
            let col = item_index % 5; // Column within the row
            let slot_x = start_x + (col.into() * spacing_x);
            let slot_y = start_y + (row.into() * spacing_y);
            let badge_x = slot_x + badge_offset_x; // Cell x + 49px
            let badge_y = slot_y.into() + badge_offset_y.into(); // Cell y - 8px

            // Generate level badge background
            badges += "<rect width=\""
                + u256_to_string(badge_width.into())
                + "\" height=\""
                + u256_to_string(badge_height.into())
                + "\" x=\""
                + u256_to_string(badge_x.into())
                + "\" y=\""
                + u256_to_string(badge_y.into())
                + "\" fill=\""
                + theme_color.clone()
                + "\" rx=\"2\"/>";

            // Generate level text (centered in badge)
            let text_x = badge_x + (badge_width / 2);
            let text_y = badge_y + 11; // Vertical center
            badges += "<text x=\""
                + u256_to_string(text_x.into())
                + "\" y=\""
                + u256_to_string(text_y.into())
                + "\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
            badges += u8_to_string(get_greatness(item.xp));
            badges += "</text>";
        }
        item_index += 1;
    };

    badges
}

/// @notice Generate bag item names positioned below their respective slots
/// @dev Creates multi-line names with word wrapping and proper grid positioning
/// @param bag The bag containing items with names to render
/// @return Complete SVG markup for all bag item names
pub fn generate_bag_item_names(bag: BagVerbose) -> ByteArray {
    let mut names = "";
    let theme_color = get_theme_color(1); // Orange theme for bag

    // Position names below each grid box using same grid positioning
    let start_x = 213_u16 + 35_u16; // Cell center: start_x + (slot_size/2) = 213 + 35.5 ≈ 248
    let start_y = 350_u16;
    let spacing_x = 91_u16;
    let spacing_y = 134_u16;
    let slot_size = 71_u16;

    // Y positions for multi-line names below each row of cells (moved closer to boxes)
    let row_0_y1 = start_y + slot_size + 14; // 350 + 71 + 14 = 435
    let row_0_y2 = row_0_y1 + 14; // 435 + 14 = 449
    let row_1_y1 = start_y + spacing_y + slot_size + 14; // 350 + 134 + 71 + 14 = 569  
    let row_1_y2 = row_1_y1 + 14; // 569 + 14 = 583
    let row_2_y1 = start_y + (2 * spacing_y) + slot_size + 14; // 350 + 268 + 71 + 14 = 703
    let row_2_y2 = row_2_y1 + 14; // 703 + 14 = 717

    let mut item_index = 0_u8;
    while item_index < 15 {
        let item = get_bag_item_by_index(bag.clone(), item_index);
        let words = get_bag_item_words(item.name);

        let col = item_index % 5;
        let row = item_index / 5;
        let x = start_x + (col.into() * spacing_x);

        let (base_y1, base_y2) = if row == 0 {
            (row_0_y1, row_0_y2)
        } else if row == 1 {
            (row_1_y1, row_1_y2)
        } else {
            (row_2_y1, row_2_y2)
        };

        // Render the words (either EMPTY or actual item name words)
        let mut word_index = 0_u32;
        while word_index < words.len() {
            let y = if word_index == 0 {
                base_y1
            } else if word_index == 1 {
                base_y2
            } else {
                base_y2 + ((word_index - 1) * 14).try_into().unwrap() // Additional lines if more than 2 words
            };

            names += "<text x=\"";
            names += u256_to_string(x.into());
            names += "\" y=\"";
            names += u256_to_string(y.into());
            names += "\" fill=\"";
            names += theme_color.clone();
            names += "\" class=\"s12\" text-anchor=\"middle\">";
            names += words.at(word_index).clone();
            names += "</text>";

            word_index += 1;

            // up to 3 lines for three-word items
            if word_index >= 3 {
                break;
            }
        };

        item_index += 1;
    };

    names
}
