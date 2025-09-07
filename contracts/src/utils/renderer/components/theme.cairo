// SPDX-License-Identifier: MIT
//
// @title Theme System - Color themes and styling for different pages
// @notice Manages color schemes and visual themes for different page types
// @dev Provides consistent theming across all renderer components

/// @notice Get theme color for a specific page
/// @dev Returns the appropriate primary color string for page elements
/// @param page The page number (0-3)
/// @return ByteArray containing the hex color code
pub fn get_theme_color(page: u8) -> ByteArray {
    match page {
        0 => "#78E846", // Page 0 (Inventory) - Green theme
        1 => "#E89446", // Page 1 (ItemBag) - Orange theme  
        2 => "#FE9676", // Page 2 (Battle) - Red theme
        3 => "#888888", // Page 3 (Death) - Grey theme
        _ => "#78E846" // Default to green
    }
}

/// @notice Get dark background color for gold display based on page theme
/// @dev Returns darker variant of theme color for background elements
/// @param page The page number (0-3)
/// @return ByteArray containing the hex color code for background
pub fn get_gold_background_color(page: u8) -> ByteArray {
    match page {
        0 => "#0F1F0A", // Page 0 (Inventory) - Dark green
        1 => "#2C1A0A", // Page 1 (ItemBag) - Dark orange/brown
        2 => "#2A0A0A", // Page 2 (Battle) - Dark red
        3 => "#333333", // Page 3 (Death) - Dark grey
        _ => "#0F1F0A" // Default to dark green
    }
}

/// @notice Theme configuration structure for complete theme information
/// @dev Contains all color variants for a given theme
#[derive(Drop, Serde)]
pub struct Theme {
    pub primary: ByteArray,
    pub background: ByteArray,
}

/// @notice Get complete theme configuration for a page
/// @dev Returns Theme struct with all color information
/// @param page The page number (0-3)
/// @return Theme struct containing primary and background colors
pub fn get_theme(page: u8) -> Theme {
    Theme { primary: get_theme_color(page), background: get_gold_background_color(page) }
}
