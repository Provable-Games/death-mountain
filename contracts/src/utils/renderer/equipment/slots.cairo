// SPDX-License-Identifier: MIT
//
// @title Equipment Slot Generation
// @notice Functions for generating equipment slot containers and layout
// @dev Provides consistent slot sizing and positioning for inventory UI
// @author Built for the Loot Survivor ecosystem

/// @notice Generate equipment slot containers for the inventory page
/// @dev Creates 8 equipment slots in a 2x4 grid layout with consistent styling
/// @return SVG rectangles for all equipment slots with proper positioning
pub fn generate_equipment_slots() -> ByteArray {
    let mut slots = "";

    // Top row equipment slots
    slots +=
        "<rect width=\"71\" height=\"71\" x=\"285.7\" y=\"357.6\" stroke=\"#2B5418\" rx=\"5.5\" fill=\"none\"/>"; // Weapon slot
    slots +=
        "<rect width=\"71\" height=\"71\" x=\"377.7\" y=\"357.6\" stroke=\"#2B5418\" rx=\"5.5\" fill=\"none\"/>"; // Chest slot
    slots +=
        "<rect width=\"71\" height=\"71\" x=\"469.7\" y=\"357.6\" stroke=\"#2B5418\" rx=\"5.5\" fill=\"none\"/>"; // Head slot
    slots +=
        "<rect width=\"71\" height=\"71\" x=\"561.7\" y=\"357.6\" stroke=\"#2B5418\" rx=\"5.5\" fill=\"none\"/>"; // Waist slot

    // Bottom row equipment slots
    slots +=
        "<rect width=\"71\" height=\"71\" x=\"285.7\" y=\"491.6\" stroke=\"#2B5418\" rx=\"5.5\" fill=\"none\"/>"; // Hand slot
    slots +=
        "<rect width=\"71\" height=\"71\" x=\"377.7\" y=\"491.6\" stroke=\"#2B5418\" rx=\"5.5\" fill=\"none\"/>"; // Foot slot
    slots +=
        "<rect width=\"71\" height=\"71\" x=\"469.7\" y=\"491.6\" stroke=\"#2B5418\" rx=\"5.5\" fill=\"none\"/>"; // Ring slot
    slots +=
        "<rect width=\"71\" height=\"71\" x=\"561.7\" y=\"491.6\" stroke=\"#2B5418\" rx=\"5.5\" fill=\"none\"/>"; // Neck slot

    slots
}
