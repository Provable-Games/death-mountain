// SPDX-License-Identifier: MIT
//
// @title UI Components
// @notice Functions for generating common UI elements like stats display, gold, health bar, and
// level @dev Reusable UI components with theme support for consistent styling
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::adventurer::{IAdventurer, ImplAdventurer};
use death_mountain::models::adventurer::stats::Stats;
use death_mountain::utils::renderer::components::theme::{get_gold_background_color, get_theme_color};
use death_mountain::utils::string::string_utils::{u256_to_string, u64_to_string, u8_to_string};

/// @notice Generate dynamic adventurer stats text elements for the 7 core stats
/// @dev Creates themed stat display with default green theme
/// @param stats The adventurer's stats to display
/// @return Complete SVG markup for all seven stats with labels and values
pub fn generate_stats_text(stats: Stats) -> ByteArray {
    generate_stats_text_with_page(stats, 0) // Default to green theme
}

/// @notice Generate dynamic adventurer stats text elements with theme color based on page
/// @dev Creates comprehensive stat display with customizable theme colors
/// @param stats The adventurer's stats to display
/// @param page Page number determining theme color (0=green, 1=orange, 2=red)
/// @return Complete SVG markup for all seven stats (STR, DEX, VIT, INT, WIS, CHA, LUCK)
pub fn generate_stats_text_with_page(stats: Stats, page: u8) -> ByteArray {
    let mut stats_text = "";
    let theme_color = get_theme_color(page);

    // STR (Strength) - stat name on top, value below - aligned with logo/level at y=124
    stats_text += "<text x=\"195\" y=\"124\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s16\">STR</text>";
    stats_text += "<text x=\"195\" y=\"164\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s32\">";
    stats_text += u8_to_string(stats.strength);
    stats_text += "</text>";

    // DEX (Dexterity) - stat name on top, value below
    stats_text += "<text x=\"195\" y=\"224\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s16\">DEX</text>";
    stats_text += "<text x=\"195\" y=\"264\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s32\">";
    stats_text += u8_to_string(stats.dexterity);
    stats_text += "</text>";

    // VIT (Vitality) - stat name on top, value below
    stats_text += "<text x=\"195\" y=\"324\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s16\">VIT</text>";
    stats_text += "<text x=\"195\" y=\"364\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s32\">";
    stats_text += u8_to_string(stats.vitality);
    stats_text += "</text>";

    // INT (Intelligence) - stat name on top, value below
    stats_text += "<text x=\"195\" y=\"424\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s16\">INT</text>";
    stats_text += "<text x=\"195\" y=\"464\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s32\">";
    stats_text += u8_to_string(stats.intelligence);
    stats_text += "</text>";

    // WIS (Wisdom) - stat name on top, value below
    stats_text += "<text x=\"195\" y=\"524\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s16\">WIS</text>";
    stats_text += "<text x=\"195\" y=\"564\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s32\">";
    stats_text += u8_to_string(stats.wisdom);
    stats_text += "</text>";

    // CHA (Charisma) - stat name on top, value below
    stats_text += "<text x=\"195\" y=\"624\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s16\">CHA</text>";
    stats_text += "<text x=\"195\" y=\"664\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s32\">";
    stats_text += u8_to_string(stats.charisma);
    stats_text += "</text>";

    // LUCK - stat name on top, value below
    stats_text += "<text x=\"195\" y=\"724\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s16\">LUCK</text>";
    stats_text += "<text x=\"195\" y=\"764\" fill=\"";
    stats_text += theme_color.clone();
    stats_text += "\" class=\"s32\">";
    stats_text += u8_to_string(stats.luck);
    stats_text += "</text>";

    stats_text
}

/// @notice Generate gold display UI components with default theme
/// @dev Creates gold display with green theme
/// @param gold The amount of gold to display
/// @return Complete SVG markup for gold display with label and value
pub fn generate_gold_display(gold: u16) -> ByteArray {
    generate_gold_display_with_page(gold, 0) // Default to green theme
}

/// @notice Generate gold display UI components with theme color
/// @dev Creates themed gold display with background and label
/// @param gold The amount of gold to display
/// @param page Page number determining theme color (0=green, 1=orange, 2=red)
/// @return Complete SVG markup for gold display with themed styling
pub fn generate_gold_display_with_page(gold: u16, page: u8) -> ByteArray {
    let mut gold_display = "";
    let theme_color = get_theme_color(page);
    let background_color = get_gold_background_color(page);

    // Add dark main rectangle for gold display
    gold_display += "<rect width=\"91\" height=\"61.1\" x=\"541.7\" y=\"113\" fill=\"";
    gold_display += background_color;
    gold_display += "\" rx=\"6\"/>";
    // Add small lighter rectangle for "GOLD" label with theme color
    gold_display += "<rect width=\"32\" height=\"16\" x=\"608\" y=\"106\" fill=\"";
    gold_display += theme_color.clone();
    gold_display += "\" rx=\"2\"/>";
    // Add "GOLD" text in black on the themed rectangle
    gold_display += "<text x=\"624\" y=\"117\" fill=\"#000\" class=\"s12\" text-anchor=\"middle\">GOLD</text>";
    // Add gold value in theme color on the darker background
    gold_display += "<text x=\"587\" y=\"150\" fill=\"";
    gold_display += theme_color;
    gold_display += "\" class=\"s24\" text-anchor=\"middle\">";
    gold_display += u256_to_string(gold.into());
    gold_display += "</text>";
    gold_display
}

/// @notice Generate level display text with default theme
/// @dev Creates level display with green theme
/// @param level The adventurer's level
/// @return SVG text element for level display
pub fn generate_level_display(level: u8) -> ByteArray {
    generate_level_display_with_page(level, 0) // Default to green theme
}

/// @notice Generate level display text with theme color
/// @dev Creates themed level display with page-specific positioning
/// @param level The adventurer's level
/// @param page Page number determining theme color and position
/// @return SVG text element for themed level display
pub fn generate_level_display_with_page(level: u8, page: u8) -> ByteArray {
    let mut level_display = "";
    let theme_color = get_theme_color(page);

    // Adjust x position based on page: page 1 uses x="268" to align with updated layout
    let x_position = if page == 1 {
        "268"
    } else {
        "339"
    };
    let y_position = if page == 1 {
        "135"
    } else {
        "124"
    };
    level_display += "<text x=\"";
    level_display += x_position;
    level_display += "\" y=\"";
    level_display += y_position;
    level_display += "\" fill=\"";
    level_display += theme_color;
    level_display += "\" class=\"s16\">LEVEL ";
    level_display += u8_to_string(level);
    level_display += "</text>";
    level_display
}

/// @notice Generate dynamic health bar with default theme and color coding
/// @dev Creates health bar with green theme text
/// @param stats The adventurer's stats for max health calculation
/// @param health Current health value
/// @return Complete SVG markup for health bar with color coding
pub fn generate_health_bar(stats: Stats, health: u16) -> ByteArray {
    generate_health_bar_with_page(stats, health, 0) // Default to green theme
}

/// @notice Generate dynamic health bar with color coding and theme color for text
/// @dev Creates responsive health bar with percentage-based color coding
/// @param stats The adventurer's stats for max health calculation
/// @param health Current health value
/// @param page Page number determining theme color for text elements
/// @return Complete SVG markup for health bar with background, filled bar, and HP display
pub fn generate_health_bar_with_page(stats: Stats, health: u16, page: u8) -> ByteArray {
    // Use page-specific positioning for backward compatibility
    let bar_x_position = if page == 1 {
        213_u32
    } else {
        286_u32
    };
    let bar_y_position = 234_u32;
    let bar_width = 300_u32;
    let text_color = get_theme_color(page);

    generate_health_bar_generic(
        health.into(), stats.get_max_health().into(), bar_x_position, bar_y_position, bar_width, text_color, true,
    )
}

/// @notice Generate configurable health bar component for any use case
/// @dev Unified health bar component supporting both dashed and solid styles
/// @param current_health Current health value
/// @param max_health Maximum health value
/// @param x X position of health bar
/// @param y Y position of health bar
/// @param width Width of health bar
/// @param text_color Color for the HP text
/// @param use_dashed_style Whether to use dashed path style (true) or solid rect style (false)
/// @return Complete SVG markup for health bar with background, filled bar, and HP display
pub fn generate_health_bar_generic(
    current_health: u64, max_health: u64, x: u32, y: u32, width: u32, text_color: ByteArray, use_dashed_style: bool,
) -> ByteArray {
    let mut health_bar = "";
    let MIN_FILLED_WIDTH: u64 = 2; // Minimum visible width when HP > 0

    // Calculate dynamic filled width
    let filled_width = if max_health > 0 {
        let calculated = (current_health * width.into()) / max_health;
        // Ensure minimum visibility when health > 0
        if current_health > 0 && calculated < MIN_FILLED_WIDTH {
            MIN_FILLED_WIDTH
        } else {
            calculated
        }
    } else {
        0
    };

    // Determine health bar color based on HP percentage
    let health_percentage = if max_health > 0 {
        (current_health * 100) / max_health
    } else {
        0
    };

    let bar_color = if health_percentage >= 75 {
        "#78E846" // Green (healthy - 75-100%)
    } else if health_percentage >= 25 {
        "#FFD700" // Yellow/Gold (wounded - 25-74%)
    } else if current_health > 0 {
        "#FF4444" // Red (critical - 1-24%)
    } else {
        "#FF4444" // Red for zero health
    };

    if use_dashed_style {
        // Generate dashed path style (original ui_components style)
        health_bar +=
            "<path stroke=\"#171D10\" stroke-dasharray=\"42 4\" stroke-linecap=\"square\" stroke-linejoin=\"round\" stroke-width=\"9\" d=\"M";
        health_bar += format!("{}", x);
        health_bar += " ";
        health_bar += format!("{}", y);
        health_bar += "h";
        health_bar += format!("{}", width);
        health_bar += "\"/>";

        // Generate filled health bar (dynamic width, color-coded)
        health_bar += "<path stroke=\"";
        health_bar += bar_color;
        health_bar +=
            "\" stroke-dasharray=\"42 4\" stroke-linecap=\"square\" stroke-linejoin=\"round\" stroke-width=\"9\" d=\"M";
        health_bar += format!("{}", x);
        health_bar += " ";
        health_bar += format!("{}", y);
        health_bar += "h";
        health_bar += format!("{}", filled_width);
        health_bar += "\"/>";

        // HP text positioned below the dashed bar
        health_bar += "<text x=\"";
        health_bar += format!("{}", x);
        health_bar += "\" y=\"";
        health_bar += format!("{}", y + 36);
        health_bar += "\" fill=\"";
        health_bar += text_color;
        health_bar += "\" class=\"s16\">";
    } else {
        // Generate solid rect style (original battle_layout style)
        let bar_height = 8_u32;

        // Health bar background
        health_bar += "<rect x=\"";
        health_bar += format!("{}", x);
        health_bar += "\" y=\"";
        health_bar += format!("{}", y);
        health_bar += "\" width=\"";
        health_bar += format!("{}", width);
        health_bar += "\" height=\"";
        health_bar += format!("{}", bar_height);
        health_bar += "\" fill=\"#333\" rx=\"4\"/>";

        // Health bar fill
        health_bar += "<rect x=\"";
        health_bar += format!("{}", x);
        health_bar += "\" y=\"";
        health_bar += format!("{}", y);
        health_bar += "\" width=\"";
        health_bar += format!("{}", filled_width);
        health_bar += "\" height=\"";
        health_bar += format!("{}", bar_height);
        health_bar += "\" fill=\"";
        health_bar += bar_color;
        health_bar += "\" rx=\"4\"/>";

        // HP text positioned below the solid bar
        health_bar += "<text x=\"";
        health_bar += format!("{}", x + width / 2);
        health_bar += "\" y=\"";
        health_bar += format!("{}", y + bar_height + 17);
        health_bar += "\" fill=\"";
        health_bar += text_color;
        health_bar += "\" class=\"s16\" text-anchor=\"middle\">";
    }

    // Add HP display (current HP / max HP)
    health_bar += u64_to_string(current_health);
    health_bar += "/";
    health_bar += u64_to_string(max_health);
    health_bar += " HP</text>";

    health_bar
}
