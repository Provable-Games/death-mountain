// SPDX-License-Identifier: MIT
//
// @title Battle Layout Components
// @notice Modular components for the 3-row battle interface layout
// @dev Implements the beast/player battle interface with row-based structure
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::adventurer::AdventurerVerbose;
use death_mountain::utils::renderer::components::icons::{dexterity_icon, level_icon, power_icon};
use death_mountain::utils::renderer::components::ui_components::generate_health_bar_generic;
use death_mountain::utils::string::string_utils::u64_to_string;

// Layout constants
const BATTLE_ROW_Y: u32 = 220_u32; // Top row (beast) Y position
const BATTLE_ROW_HEIGHT: u32 = 222_u32; // Height of top/bottom rows
const MESSAGE_ROW_Y: u32 = 470_u32; // Middle message row Y position  
const MESSAGE_ROW_HEIGHT: u32 = 66_u32; // Height of message row
const PLAYER_ROW_Y: u32 = 562_u32; // Bottom row (player) Y position

// Column layout constants
const COL1_X: u32 = 224_u32; // Character sprite column X
const COL1_WIDTH: u32 = 172_u32; // Character sprite column width
const COL2_X: u32 = 412_u32; // Power column X  
const COL2_WIDTH: u32 = 110_u32; // Power column width
const COL3_X: u32 = 536_u32; // Level/stats column X
const COL3_WIDTH: u32 = 110_u32; // Level/stats column width

// Message row spans full width
const MESSAGE_X: u32 = 225_u32;
const MESSAGE_WIDTH: u32 = 421_u32;

/// @notice Generate the top battle row containing beast information
/// @dev Creates red-themed row with beast sprite, power, and level display
/// @param power The beast's power value to display (or "-" if unknown)
/// @param level The beast's level to display (or "-" if unknown)
/// @return SVG content for the beast battle row
pub fn generate_beast_battle_row(power: ByteArray, level: ByteArray) -> ByteArray {
    let mut row = "";

    // beast row background container
    row += "<rect x=\"";
    row += format!("{}", COL1_X);
    row += "\" y=\"";
    row += format!("{}", BATTLE_ROW_Y);
    row += "\" width=\"";
    row += format!("{}", COL1_WIDTH);
    row += "\" height=\"";
    row += format!("{}", BATTLE_ROW_HEIGHT);
    row += "\" rx=\"6\" fill=\"#210E04\"/>";

    // beast label
    row += "<rect x=\"238\" y=\"233\" width=\"60\" height=\"21\" rx=\"2\" fill=\"#FE9675\"/>";
    row += "<text x=\"268\" y=\"249\" fill=\"black\" class=\"s16\" text-anchor=\"middle\">BEAST</text>";

    // Power column
    row += "<rect x=\"";
    row += format!("{}", COL2_X);
    row += "\" y=\"";
    row += format!("{}", BATTLE_ROW_Y);
    row += "\" width=\"";
    row += format!("{}", COL2_WIDTH);
    row += "\" height=\"";
    row += format!("{}", BATTLE_ROW_HEIGHT);
    row += "\" rx=\"6\" fill=\"#210E04\"/>";

    // Add power icon above POWER text
    row += "<g transform=\"translate(453, 250) scale(1.0)\">";
    row += power_icon("#FE9676");
    row += "</g>";

    row += "<text x=\"467\" y=\"331\" fill=\"#FE9676\" class=\"s16\" text-anchor=\"middle\">POWER</text>";
    row += "<text x=\"467\" y=\"370\" fill=\"#FE9676\" class=\"s32\" text-anchor=\"middle\">";
    row += power;
    row += "</text>";

    // Level column
    row += "<rect x=\"";
    row += format!("{}", COL3_X);
    row += "\" y=\"";
    row += format!("{}", BATTLE_ROW_Y);
    row += "\" width=\"";
    row += format!("{}", COL3_WIDTH);
    row += "\" height=\"";
    row += format!("{}", BATTLE_ROW_HEIGHT);
    row += "\" rx=\"6\" fill=\"#210E04\"/>";

    // Add level icon above LEVEL text
    row += "<g transform=\"translate(578, 250) scale(1.0)\">";
    row += level_icon("#FE9676");
    row += "</g>";

    row += "<text x=\"591\" y=\"331\" fill=\"#FE9676\" class=\"s16\" text-anchor=\"middle\">LEVEL</text>";
    row += "<text x=\"591\" y=\"370\" fill=\"#FE9676\" class=\"s32\" text-anchor=\"middle\">";
    row += level;
    row += "</text>";

    row
}

/// @notice Generate the middle message row for battle events
/// @dev Creates orange-themed row spanning full width with battle messages
/// @param message The battle message to display
/// @return SVG content for the battle message row
pub fn generate_battle_message_row(message: ByteArray) -> ByteArray {
    let mut row = "";

    // Message row background
    row += "<rect x=\"";
    row += format!("{}", MESSAGE_X);
    row += "\" y=\"";
    row += format!("{}", MESSAGE_ROW_Y);
    row += "\" width=\"";
    row += format!("{}", MESSAGE_WIDTH);
    row += "\" height=\"";
    row += format!("{}", MESSAGE_ROW_HEIGHT);
    row += "\" rx=\"5\" fill=\"#2C1A0A\" stroke=\"black\"/>";

    // Battle message text
    row += "<text x=\"435\" y=\"510\" fill=\"#E89446\" class=\"s16\" text-anchor=\"middle\">";
    row += message;
    row += "</text>";

    row
}

/// @notice Generate the bottom player row containing adventurer information
/// @dev Creates green-themed row with player sprite, power, and stats display
/// @param adventurer The adventurer data to display
/// @return SVG content for the player battle row
pub fn generate_player_battle_row(adventurer: AdventurerVerbose) -> ByteArray {
    let mut row = "";

    // Player row background container
    row += "<rect x=\"";
    row += format!("{}", COL1_X);
    row += "\" y=\"";
    row += format!("{}", PLAYER_ROW_Y);
    row += "\" width=\"";
    row += format!("{}", COL1_WIDTH);
    row += "\" height=\"";
    row += format!("{}", BATTLE_ROW_HEIGHT);
    row += "\" rx=\"6\" fill=\"#171D10\"/>";

    // Player label
    row += "<rect x=\"237\" y=\"575\" width=\"40\" height=\"21\" rx=\"4\" fill=\"#78E846\"/>";
    row += "<text x=\"257\" y=\"591\" fill=\"black\" class=\"s16\" text-anchor=\"middle\">YOU</text>";

    // Power column
    row += "<rect x=\"";
    row += format!("{}", COL2_X);
    row += "\" y=\"";
    row += format!("{}", PLAYER_ROW_Y);
    row += "\" width=\"";
    row += format!("{}", COL2_WIDTH);
    row += "\" height=\"";
    row += format!("{}", BATTLE_ROW_HEIGHT);
    row += "\" rx=\"6\" fill=\"#171D10\"/>";

    // Add green power icon above POWER text
    row += "<g transform=\"translate(453, 592) scale(1.0)\">";
    row += power_icon("#78E846");
    row += "</g>";

    row += "<text x=\"467\" y=\"673\" fill=\"#78E846\" class=\"s16\" text-anchor=\"middle\">POWER</text>";
    row += "<text x=\"467\" y=\"712\" fill=\"#78E846\" class=\"s32\" text-anchor=\"middle\">";
    // Calculate power based on weapon + stats
    let power = adventurer.stats.strength + adventurer.stats.dexterity;
    row += u64_to_string(power.into());
    row += "</text>";

    // Stats column
    row += "<rect x=\"";
    row += format!("{}", COL3_X);
    row += "\" y=\"";
    row += format!("{}", PLAYER_ROW_Y);
    row += "\" width=\"";
    row += format!("{}", COL3_WIDTH);
    row += "\" height=\"";
    row += format!("{}", BATTLE_ROW_HEIGHT);
    row += "\" rx=\"6\" fill=\"#171D10\"/>";

    // Add dexterity icon above DEX text
    row += "<g transform=\"translate(577, 592) scale(1.0)\">";
    row += dexterity_icon("#78E846");
    row += "</g>";

    row += "<text x=\"591\" y=\"673\" fill=\"#78E846\" class=\"s16\" text-anchor=\"middle\">DEX</text>";
    row += "<text x=\"591\" y=\"712\" fill=\"#78E846\" class=\"s32\" text-anchor=\"middle\">";
    row += u64_to_string(adventurer.stats.dexterity.into());
    row += "</text>";

    row
}

/// @notice Generate health bar component for battle layouts
/// @dev Wrapper for the unified health bar component using solid rect style
/// @param x X position of health bar
/// @param y Y position of health bar
/// @param current_health Current health value
/// @param max_health Maximum health value
/// @param color_theme Color theme for the health bar text
/// @return SVG content for the health bar
pub fn generate_health_bar(x: u32, y: u32, current_health: u64, max_health: u64, color_theme: ByteArray) -> ByteArray {
    // Use solid rect style (false) with fixed width of 150px for battle layout
    generate_health_bar_generic(current_health, max_health, x, y, 150_u32, color_theme, false)
}
