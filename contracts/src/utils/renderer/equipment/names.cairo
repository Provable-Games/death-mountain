// SPDX-License-Identifier: MIT
//
// @title Equipment Name Rendering
// @notice Functions for rendering equipment names below slots with multi-line support
// @dev Handles text wrapping, positioning, and empty item display for equipment names
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::equipment::EquipmentVerbose;
use death_mountain::utils::string::string_utils::{felt252_to_string, u256_to_string};

/// @notice Extract individual words from equipment name text
/// @dev Splits text on spaces to enable multi-line name rendering
/// @param text The equipment name text to split
/// @return Array of individual words for line-by-line rendering
fn extract_words(text: ByteArray) -> Array<ByteArray> {
    let mut words: Array<ByteArray> = array![];
    let mut current_word = "";
    let mut i = 0;

    while i < text.len() {
        let byte = text.at(i).unwrap();
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

/// @notice Split equipment name into words for line-by-line rendering
/// @dev Converts felt252 item names to word arrays, handles empty items
/// @param item_name The felt252 representation of the equipment name
/// @return Array of words, or ["EMPTY"] for unequipped slots
pub fn get_equipment_words(item_name: felt252) -> Array<ByteArray> {
    if item_name == 0 {
        return array!["EMPTY"];
    }

    let name_str = felt252_to_string(item_name);

    // If name is empty, return EMPTY
    if name_str.len() == 0 {
        return array!["EMPTY"];
    }

    extract_words(name_str)
}

/// @notice Render equipment name words at specified position with line spacing
/// @dev Creates multi-line text with consistent positioning and styling
/// @param words Array of words to render line by line
/// @param x Horizontal center position for the text
/// @param base_y Starting vertical position for the first line
/// @return Complete SVG text markup for the multi-line equipment name
pub fn render_equipment_words(words: Array<ByteArray>, x: u16, base_y: u16) -> ByteArray {
    let mut name_text = "";
    let mut i = 0;

    while i < words.len() {
        let y_u32: u32 = base_y.into() + (i * 14); // 14px line spacing
        // Clamp y to prevent u16 overflow, use u32 directly for display
        name_text += "<text x=\"";
        name_text += u256_to_string(x.into());
        name_text += "\" y=\"";
        name_text += u256_to_string(y_u32.into());
        name_text += "\" fill=\"#78E846\" class=\"s12\" text-anchor=\"middle\">";
        name_text += words.at(i).clone();
        name_text += "</text>";
        i += 1;
    };

    name_text
}

/// @notice Generate equipment names positioned below their respective slots
/// @dev Creates complete name display for all 8 equipment slots with proper positioning
/// @param equipment The adventurer's equipment with item names
/// @return Complete SVG markup for all equipment names
pub fn generate_equipment_names(equipment: EquipmentVerbose) -> ByteArray {
    let mut names = "";

    // Equipment names - Top row (below equipment boxes)
    let weapon_words = get_equipment_words(equipment.weapon.name);
    names += render_equipment_words(weapon_words, 321, 442);

    let chest_words = get_equipment_words(equipment.chest.name);
    names += render_equipment_words(chest_words, 413, 442);

    let head_words = get_equipment_words(equipment.head.name);
    names += render_equipment_words(head_words, 505, 442);

    let waist_words = get_equipment_words(equipment.waist.name);
    names += render_equipment_words(waist_words, 597, 442);

    // Equipment names - Bottom row (below equipment boxes)
    let hand_words = get_equipment_words(equipment.hand.name);
    names += render_equipment_words(hand_words, 321, 576);

    let foot_words = get_equipment_words(equipment.foot.name);
    names += render_equipment_words(foot_words, 413, 576);

    let ring_words = get_equipment_words(equipment.ring.name);
    names += render_equipment_words(ring_words, 505, 576);

    let neck_words = get_equipment_words(equipment.neck.name);
    names += render_equipment_words(neck_words, 597, 576);

    names
}
