// SPDX-License-Identifier: MIT
//
// @title SVG Builder Utilities
// @notice Core SVG construction and assembly functions
// @dev Handles SVG structure, borders, containers, and complete SVG generation
// @author Built for the Loot Survivor ecosystem

use death_mountain::utils::renderer::components::theme::get_theme_color;

/// @notice Generate decorative border based on page type with themed colors
/// @dev Creates comprehensive decorative border SVG with page-specific theme colors
/// @param page The page number for theme color selection (0=green, 1=orange, 2=red)
/// @return Complete SVG border markup with themed colors
pub fn generate_border_for_page(page: u8) -> ByteArray {
    let mut border = "";

    // For page 2 (battle), use gradient instead of solid color
    let border_color = if page == 2 {
        // Add gradient definition for battle page
        border += generate_battle_gradient();
        "url(#battleGradient)"
    } else {
        get_theme_color(page)
    };
    border += "<path fill=\"";
    border += border_color.clone();
    border += "\" d=\"M686 863h-6v-7h6v7Z\"/><path fill=\"";
    border += border_color.clone();
    border +=
        "\" fill-rule=\"evenodd\" d=\"M153 428h8V104h6v342h-14c1 3-1 22 1 23h13v342h-6V488h-8v348h-6V482h14v-6h-14v-35h13v-7h-13V80h6v348Zm0 17v1l1-1h-1Zm561-11h-14v7h14v35h-14v6h14v354h-6V488h-8v323l-6-1V470l1-1h13v-23h-13l-1-341 6-1v324c2 2 6 0 8 0V80h6v354Zm-4 48-2 1 2-1Zm-5-12a35 35 0 0 1 1 0h-1Zm3 0h-1 1Z\" clip-rule=\"evenodd\"/><path fill=\"";
    border += border_color.clone();
    border += "\" d=\"M694 819Z\"/><path fill=\"";
    border += border_color.clone();
    border +=
        "\" fill-rule=\"evenodd\" d=\"M700 462h-6v-8h6v8Zm-5-8h4-4Zm-528 8h-6v-8h6v8Zm-1-1h-4 4v-7 7Zm-4-7h2-2ZM658 53h14v13h-1 15c0 1 0 0 0 0l1 1h-1v13-1l1 1h13v17h-6V85h-12V75h-1l-1-2h-14V60l-1-1h-12V45h-3 3-8v-5h13v13Zm30 28h11-11Zm-8-9h-13 13Zm-27-15v1h12l2 2-2-2h-12v-1Zm5-4 4 1-4-1Zm11 1h2-2Zm-23-9Zm-430 0h-7 6-6l-1 1v13h-12c-2 1 0 11-1 14h-15v12c-2 2-10 0-13 1v11h-5V81h11l1-1V66h16V54v12h-1V54l1-1h13V40h13v5Zm-16 13h6-6Z\" clip-rule=\"evenodd\"/><path fill=\"";
    border += border_color.clone();
    border += "\" d=\"m174 80-1 1h-11v16h-1V80h13Zm507-5h1v10h12v1h-12l-1-1V75Z\"/><path fill=\"";
    border += border_color.clone();
    border += "\" d=\"M682 86h-1v-1l1 1Zm-1-11Z\"/><path fill=\"";
    border += border_color.clone();
    border +=
        "\" fill-rule=\"evenodd\" d=\"M666 28c4-2 9-1 13-1v6h-7v-2 9h14l1-1V28h26-26v11l-1 1V27h28v26h-14v13h9-1v-5c1-2 3-1 5-1-2 0-4-1-5 1v-2h6v14h-20V45h-28V28h13v3-3h-13Zm26 12h8v7c2 2 6 0 8 0V33h-16v7Zm7 4v1-1ZM181 28c5-2 9-1 14-1l-4 1 4-1v18h-28l-1 7 1-7v28h-20V59h6v8l8-1 1-1-1 1V53h-14V27h28v13h-1 15v-7h-8v-5Zm-15 40v4h-18 18v-4Zm-14-8v5-5Zm18-27h-17v15l8-1c-1-9 1-7 9-7v-7Zm-22-5h25l1 4-1-4h-25Z\" clip-rule=\"evenodd\"/><path fill=\"";
    border += border_color.clone();
    border += "\" d=\"M679 53c9-1 8 0 8 8h-8v-8Z\"/>";
    border += "<path fill=\"";
    border += border_color.clone();
    border +=
        "\" fill-rule=\"evenodd\" d=\"M714 857h-6v-8h-8v14l-1-1 1 1h14v26h-28v-13h-15l1-1-1 1v7-1c2 2 7 0 9 1v6h-14v-2l13 1-13-1v-11 1-8h28v-27c7 2 14 0 20 0v15Zm-9 27h-8 8Zm-5-15v7h-8v7h16v1-2c2 1 1-1 1-2v-10 10c0 1 1 3-1 2v-13h-8Zm-1 6h-7 7Zm-33-5 1 3-1-3Zm42-2v1-1Zm-270-5v6l-1-1v-1l1 2h16v14c-2-4-1-9-1-13 0 4-1 9 1 13v1-1h13v-14h166v7H515l118-1v-5 5l-118 1h-25l5-1h1l-6 1h-3v7h171v6H480v-13h-7c-2 2 0 9-1 12 1-3-1-10 1-12v13c-4-1-23 1-25-1-2-1 0-10-1-12l-13-1v-6h-7v6h-14v13h-24 24v-13h14v-6 7h-13v13h-25c-2 0-1-12-1-13h1-8v13H203v-6h171l-171 1v4-4l171-1v-7H228v-7h166v14-1l3 1 11-1v-13h14c1 0 0 0 0 0v-6h16Zm-59 13v12-12Zm76 8Zm-10-9h-8 8Zm-8-12 1 1-1-1Z\" clip-rule=\"evenodd\"/><path fill=\"";
    border += border_color.clone();
    border += "\" d=\"M154 868h6-6Z\"/><path fill=\"";
    border += border_color.clone();
    border +=
        "\" fill-rule=\"evenodd\" d=\"M167 869h28v19h-13v-5h7v-7h-14v1l-1-1 1 1v12h-28v-26h13l1-1v-13h-7c-2 1-1 6-1 8h-5l-1-1h1-1v-13h20v26Zm-7-1h-7v5l-1 1 1-1v10h17v-7c-1-2-8-1-8-1s7-1 8 1h-9v-7l-1-1Zm-8 13v1-1Zm0-6Zm24 0h-1 1Zm-15-10Zm-9-2h2-3 1Zm-4-7Zm291 32h-17v-5h17v5Zm-2-1v-3 3Zm257-68c2-2 4-1 6-1v18h-14v13h-15v14h-12c2-2 9 0 12-1-3 1-10-1-12 1l-1 1v12h-12l-1-1h13-13c-2-7 1-6 7-6v-12h14v-14h14v-12l1-1h13v-11h5-5Zm-28 24v14-14Zm-499-13h13v13h15v14h13v12c1 2 4 1 6 1h1c-2 0-6 1-7-1h8v7h-13v-13h-14v-14h-14l-1-1v-12h-13v-18h6v12Zm41 36h-1 1Zm0 0Zm-5-4Zm-24-29v10-10Zm-16 2h-1 1Z\" clip-rule=\"evenodd\"/><path fill=\"";
    border += border_color.clone();
    border += "\" d=\"M408 869v1h-1l1-1Z\"/><path fill=\"";
    border += border_color.clone();
    border += "\" fill-rule=\"evenodd\" d=\"M181 863h-7v-7h7v7Zm-1-1h-5 5v-6 6Z\" clip-rule=\"evenodd\"/>";
    border += "<path fill=\"";
    border += border_color.clone();
    border +=
        "\" fill-rule=\"evenodd\" d=\"M181 60h-7v-7h7v7Zm-1-1v-5 5Zm199-19h9l1-1V28v11l-1 1V27h26v12l-1 1 1-1 2 1h11v6c9 0 5-1 7-5 1-3 11 0 13-2 2-1 1-9 1-11 0 2 1 10-1 11V27h26l-1 13h8V27h178v6H487l-1 7h147v5H467V33h-13v8h-1 1v4h-15v6l-2 1h-14l-1-1v-6h-14V33h-14v12H227v-5h147v-7H203v-6h176v13Zm14-7v12-12Zm74 0v12-12Zm14 7V28v12Z\" clip-rule=\"evenodd\"/><path fill=\"";
    border += border_color.clone();
    border += "\" d=\"M439 33h-17v-6h17v6Zm227-5Z\"/>";
    border
}

/// @notice Generate decorative border and background elements (legacy function)
/// @dev Creates default green-themed border for backward compatibility
/// @return Complete SVG border markup with green theme
pub fn generate_border() -> ByteArray {
    generate_border_for_page(0) // Default to green border
}

/// @notice Generate sliding page container start tag for animation
/// @dev Creates opening group tag with page-container class for CSS animations
/// @return SVG group opening tag for page sliding animations
pub fn generate_sliding_container_start() -> ByteArray {
    "<g class=\"page-container\">"
}

/// @notice Generate sliding page container end tag for animation
/// @dev Creates closing group tag to complete page container wrapper
/// @return SVG group closing tag for page sliding animations
pub fn generate_sliding_container_end() -> ByteArray {
    "</g>"
}

/// @notice Generate battle gradient definition for SVG
/// @dev Creates the linear gradient definition used in Union.svg for battle elements
/// @return SVG gradient definition that transitions from orange-red to green
pub fn generate_battle_gradient() -> ByteArray {
    let mut gradient = "";
    gradient += "<defs>";
    gradient +=
        "<linearGradient id=\"battleGradient\" x1=\"284.3\" x2=\"284.3\" y1=\".8\" y2=\"862.8\" gradientUnits=\"userSpaceOnUse\">";
    gradient += "<stop stop-color=\"#FE9676\"/>";
    gradient += "<stop offset=\"1\" stop-color=\"#58F54C\"/>";
    gradient += "</linearGradient>";
    gradient += "</defs>";
    gradient
}

