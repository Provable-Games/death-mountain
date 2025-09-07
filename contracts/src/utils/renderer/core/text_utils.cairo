// SPDX-License-Identifier: MIT
//
// @title Text Utilities
// @notice Functions for text processing, name rendering, and responsive typography
// @dev Text utilities with theme support and responsive sizing for optimal display
// @author Built for the Loot Survivor ecosystem

use death_mountain::utils::renderer::components::theme::get_theme_color;

/// @notice Generate dynamic adventurer name text with theme color and responsive font sizing
/// @dev Creates themed name display with page-specific positioning and truncation handling
/// @param name The adventurer's name to display
/// @param page Page number determining theme color and position
/// @return SVG text element with responsive sizing based on name length
pub fn generate_adventurer_name_text_with_page(name: ByteArray, page: u8) -> ByteArray {
    let mut name_text = "";
    let theme_color = get_theme_color(page);

    // Truncate name if longer than 31 characters to ensure smooth UI display
    let truncated_name = if name.len() > 31 {
        let mut result = "";
        let mut i = 0;
        while i < 28 {
            if i < name.len() {
                result.append_byte(name.at(i).unwrap());
            }
            i += 1;
        };
        result += "...";
        result
    } else {
        name
    };

    // Get the length of the (potentially truncated) adventurer name to determine font size
    let name_length = truncated_name.len();

    let font_size = if name_length <= 10 {
        "24px"
    } else if name_length <= 16 {
        "18px"
    } else {
        "10px"
    };

    // Use dynamic text rendering with calculated font size and theme color
    // Adjust x position based on page: align with respective logo positions
    let x_position = if page == 1 {
        "268" // Page 1: Item Bag
    } else if page == 2 {
        "274" // Page 2: Battle - align with battle grid at x=224
    } else {
        "339" // Page 0: Inventory and other pages
    };
    let y_position = if page == 1 {
        "171"
    } else if page == 2 {
        "135" // Page 2: Battle - align horizontally with logo
    } else {
        "160" // Page 0: Inventory and other pages
    };
    name_text += "<text x=\"";
    name_text += x_position;
    name_text += "\" y=\"";
    name_text += y_position;
    name_text += "\" fill=\"";
    name_text += theme_color;
    name_text += "\" style=\"font-size:";
    name_text += font_size;
    name_text += "\" text-anchor=\"left\">";
    name_text += truncated_name;
    name_text += "</text>";

    name_text
}

/// @notice Generate dynamic adventurer name text with default green theme (legacy function)
/// @dev Creates name display with responsive font sizing using default theme
/// @param name The adventurer's name to display
/// @return SVG text element with responsive sizing and green theme
pub fn generate_adventurer_name_text(name: ByteArray) -> ByteArray {
    generate_adventurer_name_text_with_page(name, 0) // Default to green theme
}

/// @notice Generate the logo SVG path with theme color and page-specific positioning
/// @dev Creates decorative "S" element with proper positioning based on page layout
/// @param page Page number determining theme color and position
/// @return Complete SVG path element for the themed logo
pub fn generate_logo_with_page(page: u8) -> ByteArray {
    let mut logo = "";
    let theme_color = get_theme_color(page);

    logo += "<path fill=\"";
    logo += theme_color;

    // Adjust logo position based on page layout
    if page == 1 {
        // Page 1 (Item Bag) - position logo to align with new layout starting at x=213
        logo +=
            "\" fill-rule=\"evenodd\" d=\"M213 115.5c0 2.4 0 2.5-1.2 2.7l-1.3.1-.1 9.4-.2 9.4h7.9l.1 2.6.1 2.7 4.4.1c6.4.2 6.5.2 6.5-2.9v-2.5l3.8-.1 3.9-.2v-18.5l-1.3-.1c-1.2-.2-1.3-.3-1.3-2.7V113h-21.3v2.5Zm7.9 12.1v4l-2.4-.2-2.5-.1-.1-3.8-.1-3.9h5.1v4Zm10.6 0v4h-5v-8h5.1v4Zm-5.5 6.7v2.3h-4.6V132h4.6v2.3ZM210.5 140c-.2.3-.2 6.3-.1 13.3V166l9.4.1 9.4.1v-5.5h-13.4v-21.3h-2.6c-1.6 0-2.6.2-2.7.6Zm7.8 5c-.1.4-.2 3.5 0 6.9v6.2l6.6.1 6.6.2v10.1l-10.5.1-10.5.1-.2 2.7-.1 2.7h24.1v-2.5c0-2.4 0-2.6 1.3-2.7l1.3-.2v-8l.2-8h-13.4v-2.2l6.6-.1 6.6-.2v-5.5l-9.2-.1c-7.2-.1-9.2 0-9.4.5Z\" clip-rule=\"evenodd\"/>";
    } else if page == 2 {
        // Page 2 (Battle) - position logo to align with battle grid starting at x=224
        logo +=
            "\" fill-rule=\"evenodd\" d=\"M224 115.5c0 2.4 0 2.5-1.2 2.7l-1.3.1-.1 9.4-.2 9.4h7.9l.1 2.6.1 2.7 4.4.1c6.4.2 6.5.2 6.5-2.9v-2.5l3.8-.1 3.9-.2v-18.5l-1.3-.1c-1.2-.2-1.3-.3-1.3-2.7V113h-21.3v2.5Zm7.9 12.1v4l-2.4-.2-2.5-.1-.1-3.8-.1-3.9h5.1v4Zm10.6 0v4h-5v-8h5.1v4Zm-5.5 6.7v2.3h-4.6V132h4.6v2.3ZM221.5 140c-.2.3-.2 6.3-.1 13.3V166l9.4.1 9.4.1v-5.5h-13.4v-21.3h-2.6c-1.6 0-2.6.2-2.7.6Zm7.8 5c-.1.4-.2 3.5 0 6.9v6.2l6.6.1 6.6.2v10.1l-10.5.1-10.5.1-.2 2.7-.1 2.7h24.1v-2.5c0-2.4 0-2.6 1.3-2.7l1.3-.2v-8l.2-8h-13.4v-2.2l6.6-.1 6.6-.2v-5.5l-9.2-.1c-7.2-.1-9.2 0-9.4.5Z\" clip-rule=\"evenodd\"/>";
    } else {
        // Page 0 (Inventory) and other pages - use original position
        logo +=
            "\" fill-rule=\"evenodd\" d=\"M288.5 115.5c0 2.4 0 2.5-1.2 2.7l-1.3.1-.1 9.4-.2 9.4h7.9l.1 2.6.1 2.7 4.4.1c6.4.2 6.5.2 6.5-2.9v-2.5l3.8-.1 3.9-.2v-18.5l-1.3-.1c-1.2-.2-1.3-.3-1.3-2.7V113h-21.3v2.5Zm7.9 12.1v4l-2.4-.2-2.5-.1-.1-3.8-.1-3.9h5.1v4Zm10.6 0v4h-5v-8h5.1v4Zm-5.5 6.7v2.3h-4.6V132h4.6v2.3ZM286 140c-.2.3-.2 6.3-.1 13.3V166l9.4.1 9.4.1v-5.5h-13.4v-21.3h-2.6c-1.6 0-2.6.2-2.7.6Zm7.8 5c-.1.4-.2 3.5 0 6.9v6.2l6.6.1 6.6.2v10.1l-10.5.1-10.5.1-.2 2.7-.1 2.7h24.1v-2.5c0-2.4 0-2.6 1.3-2.7l1.3-.2v-8l.2-8h-13.4v-2.2l6.6-.1 6.6-.2v-5.5l-9.2-.1c-7.2-.1-9.2 0-9.4.5Z\" clip-rule=\"evenodd\"/>";
    }

    logo
}

/// @notice Generate the logo SVG path with default green theme (legacy function)
/// @dev Creates decorative "S" element using default theme and positioning
/// @return Complete SVG path element for the logo with green theme
pub fn generate_logo() -> ByteArray {
    generate_logo_with_page(0) // Default to green theme
}
