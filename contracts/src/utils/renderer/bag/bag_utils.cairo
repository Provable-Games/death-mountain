// SPDX-License-Identifier: MIT
//
// @title Bag Utilities
// @notice Utility functions for bag item processing and data access
// @dev Helper functions for bag item manipulation, word extraction, and data retrieval
// @author Built for the Loot Survivor ecosystem

use death_mountain::constants::combat::CombatEnums::{Slot};
use death_mountain::models::adventurer::bag::BagVerbose;
use death_mountain::models::adventurer::item::ItemVerbose;
use death_mountain::utils::renderer::components::icons::{chest, foot, hand, head, neck, ring, waist, weapon};
use death_mountain::utils::string::string_utils::felt252_to_string;

/// @notice Split bag item name into words for line-by-line rendering
/// @dev Converts felt252 item names to word arrays, handles empty items with word extraction
/// @param item_name The felt252 representation of the bag item name
/// @return Array of words, or ["EMPTY"] for empty slots
pub fn get_bag_item_words(item_name: felt252) -> Array<ByteArray> {
    if item_name == 0 {
        return array!["EMPTY"];
    }

    let name_str = felt252_to_string(item_name);

    // If name is empty, return EMPTY
    if name_str.len() == 0 {
        return array!["EMPTY"];
    }

    // Extract words from bag item name
    let mut words: Array<ByteArray> = array![];
    let mut current_word = "";
    let mut i = 0;

    while i < name_str.len() {
        let byte = name_str.at(i).unwrap();
        if byte == 32 { // ASCII code for space
            if current_word.len() > 0 {
                words.append(current_word);
                current_word = "";
            }
        } else {
            current_word.append_byte(byte);
        }
        i += 1;
    };

    // Add the last word if it exists
    if current_word.len() > 0 {
        words.append(current_word);
    }

    words
}

/// @notice Get bag item by index with bounds checking
/// @dev Provides safe access to bag items using 0-based indexing (0-14 for 15 items)
/// @param bag The bag containing items to access
/// @param index The index of the item to retrieve (0-14)
/// @return ItemVerbose struct for the requested item, falls back to item_1 for invalid indices
pub fn get_bag_item_by_index(bag: BagVerbose, index: u8) -> ItemVerbose {
    match index {
        0 => bag.item_1,
        1 => bag.item_2,
        2 => bag.item_3,
        3 => bag.item_4,
        4 => bag.item_5,
        5 => bag.item_6,
        6 => bag.item_7,
        7 => bag.item_8,
        8 => bag.item_9,
        9 => bag.item_10,
        10 => bag.item_11,
        11 => bag.item_12,
        12 => bag.item_13,
        13 => bag.item_14,
        14 => bag.item_15,
        _ => bag.item_1 // Fallback, should never happen with 0-14 indices
    }
}

/// @notice Get item icon SVG based on slot type
/// @dev Maps item slot types to their corresponding SVG icon functions
/// @param slot The slot type of the item (Weapon, Chest, Head, etc.)
/// @return ByteArray containing the SVG path for the item icon
pub fn get_item_icon_svg(slot: Slot) -> ByteArray {
    match slot {
        Slot::Weapon => weapon(),
        Slot::Chest => chest(),
        Slot::Head => head(),
        Slot::Waist => waist(),
        Slot::Foot => foot(),
        Slot::Hand => hand(),
        Slot::Neck => neck(),
        Slot::Ring => ring(),
        _ => weapon() // Default fallback
    }
}

/// @notice Get icon-specific positioning adjustments for item bag page
/// @dev Provides fine-tuned positioning offsets for different item types to improve visual
/// alignment @param slot The slot type of the item
/// @return Tuple of (x_offset, y_offset) adjustments in pixels
pub fn get_icon_position_adjustment(slot: Slot) -> (i16, i16) {
    match slot {
        Slot::Weapon => (4, -4), // +4px right, +4px up (in SVG coordinates: -4px Y)
        Slot::Foot => (0, 8), // +8px down from original position  
        Slot::Hand => (8, -3), // +8px right, +3px up (in SVG coordinates: -3px Y)
        Slot::Head => (0, 8),
        Slot::Waist => (2, 4),
        Slot::Chest => (-2, 0),
        _ => (0, 0) // No adjustment for other icon types
    }
}
