// SPDX-License-Identifier: MIT
//
// @title Equipment Level Badges
// @notice Functions for generating level badges for equipment items
// @dev Creates level display badges positioned at the top-right of each equipment slot
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::equipment::EquipmentVerbose;
use death_mountain::utils::renderer::core::math_utils::get_greatness;
use death_mountain::utils::string::string_utils::u8_to_string;

/// @notice Generate level badges for each equipment slot
/// @dev Creates rectangular badges with level text positioned at slot edges
/// @param equipment The adventurer's equipment with XP values for level calculation
/// @return Complete SVG markup for all equipment level badges
pub fn generate_equipment_level_badges(equipment: EquipmentVerbose) -> ByteArray {
    let mut badges = "";

    // Top row equipment level badges - positioned like gold badge (top-right, extending beyond
    // slot)
    // Weapon level badge (top-left slot)
    badges += "<rect width=\"38\" height=\"16\" x=\"335\" y=\"355\" fill=\"#78E846\" rx=\"2\"/>";
    badges +=
        "<text x=\"354\" y=\"366\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
    badges += u8_to_string(get_greatness(equipment.weapon.xp));
    badges += "</text>";

    // Chest level badge (top-middle-left slot)
    badges += "<rect width=\"38\" height=\"16\" x=\"427\" y=\"355\" fill=\"#78E846\" rx=\"2\"/>";
    badges +=
        "<text x=\"446\" y=\"366\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
    badges += u8_to_string(get_greatness(equipment.chest.xp));
    badges += "</text>";

    // Head level badge (top-middle-right slot)
    badges += "<rect width=\"38\" height=\"16\" x=\"519\" y=\"355\" fill=\"#78E846\" rx=\"2\"/>";
    badges +=
        "<text x=\"538\" y=\"366\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
    badges += u8_to_string(get_greatness(equipment.head.xp));
    badges += "</text>";

    // Waist level badge (top-right slot)
    badges += "<rect width=\"38\" height=\"16\" x=\"611\" y=\"355\" fill=\"#78E846\" rx=\"2\"/>";
    badges +=
        "<text x=\"630\" y=\"366\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
    badges += u8_to_string(get_greatness(equipment.waist.xp));
    badges += "</text>";

    // Bottom row equipment level badges
    // Hand level badge (bottom-left slot)
    badges += "<rect width=\"38\" height=\"16\" x=\"335\" y=\"489\" fill=\"#78E846\" rx=\"2\"/>";
    badges +=
        "<text x=\"354\" y=\"500\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
    badges += u8_to_string(get_greatness(equipment.hand.xp));
    badges += "</text>";

    // Foot level badge (bottom-middle-left slot)
    badges += "<rect width=\"38\" height=\"16\" x=\"427\" y=\"489\" fill=\"#78E846\" rx=\"2\"/>";
    badges +=
        "<text x=\"446\" y=\"500\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
    badges += u8_to_string(get_greatness(equipment.foot.xp));
    badges += "</text>";

    // Ring level badge (bottom-middle-right slot)
    badges += "<rect width=\"38\" height=\"16\" x=\"519\" y=\"489\" fill=\"#78E846\" rx=\"2\"/>";
    badges +=
        "<text x=\"538\" y=\"500\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
    badges += u8_to_string(get_greatness(equipment.ring.xp));
    badges += "</text>";

    // Neck level badge (bottom-right slot)
    badges += "<rect width=\"38\" height=\"16\" x=\"611\" y=\"489\" fill=\"#78E846\" rx=\"2\"/>";
    badges +=
        "<text x=\"630\" y=\"500\" fill=\"#000\" class=\"s10\" stroke=\"#000\" stroke-width=\"0.5\" text-anchor=\"middle\">LVL ";
    badges += u8_to_string(get_greatness(equipment.neck.xp));
    badges += "</text>";

    badges
}
