// SPDX-License-Identifier: MIT
//
// @title Equipment Icon Positioning
// @notice Functions for positioning equipment icons within their slots
// @dev Handles icon placement, scaling, and theme coloring for equipment display
// @author Built for the Loot Survivor ecosystem

use death_mountain::utils::renderer::components::icons::{chest, foot, hand, head, neck, ring, waist, weapon};

/// @notice Generate equipment icons positioned within their slots
/// @dev Creates SVG groups with proper transforms and theme coloring for each equipment type
/// @return Complete SVG markup for all positioned equipment icons
pub fn generate_equipment_icons() -> ByteArray {
    let mut icons = "";

    // Top row equipment icons
    icons += "<g transform=\"translate(309, 367) scale(3)\" fill=\"#78E846\">" + weapon() + "</g>";
    icons += "<g transform=\"translate(390, 368) scale(3)\" fill=\"#78E846\">" + chest() + "</g>";
    icons += "<g transform=\"translate(483, 378) scale(3)\" fill=\"#78E846\">" + head() + "</g>";
    icons += "<g transform=\"translate(575, 370) scale(3)\" fill=\"#78E846\">" + waist() + "</g>";

    // Bottom row equipment icons
    icons += "<g transform=\"translate(308, 503) scale(3)\" fill=\"#78E846\">" + hand() + "</g>";
    icons += "<g transform=\"translate(391, 508) scale(3)\" fill=\"#78E846\">" + foot() + "</g>";
    icons += "<g transform=\"translate(483, 503) scale(3)\" fill=\"#78E846\">" + ring() + "</g>";
    icons += "<g transform=\"translate(578, 506) scale(3)\" fill=\"#78E846\">" + neck() + "</g>";

    icons
}
