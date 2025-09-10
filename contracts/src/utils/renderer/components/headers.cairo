// SPDX-License-Identifier: MIT
//
// @title SVG Headers and Footers
// @notice Functions for generating SVG container elements, CSS styles, and filters
// @dev Handles static, animated, and dynamic multi-page SVG generation
// @author Built for the Loot Survivor ecosystem

use death_mountain::utils::string::string_utils::u256_to_string;

/// @notice Generate basic SVG header with container elements
/// @dev Creates static SVG with standard dimensions and filter setup
/// @return SVG opening tags with container structure and filter references
pub fn generate_svg_header() -> ByteArray {
    let mut header = "";
    header += "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"862\" height=\"950\" fill=\"none\">";
    header += "<g filter=\"url(#a)\"><g clip-path=\"url(#b)\">";
    header += "<rect width=\"567\" height=\"862\" x=\"147.2\" y=\"27\" fill=\"#000\" rx=\"10\"/>";
    header
}

/// @notice Generate animated SVG header with CSS transitions for multi-page animations
/// @dev Creates SVG with predefined 4-page animation cycle and typography styles
/// @return SVG header with embedded CSS animations for 20-second 4-page cycle
pub fn generate_animated_svg_header() -> ByteArray {
    let mut header = "";
    header += "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"862\" height=\"950\" fill=\"none\">";
    header += "<style>";
    header += ".page{opacity:0;animation:pageTransition 20s infinite;}";
    header += ".page:nth-child(1){animation-delay:0s;}";
    header += ".page:nth-child(2){animation-delay:5s;}";
    header += ".page:nth-child(3){animation-delay:10s;}";
    header += ".page:nth-child(4){animation-delay:15s;}";
    header += "@keyframes pageTransition{0%,20%{opacity:1;}25%,95%{opacity:0;}100%{opacity:0;}}";
    header += "text{font-family:VT323,IBM Plex Mono,Roboto Mono,Source Code Pro,monospace;font-weight:bold}";
    header += ".s8{font-size:8px}.s10{font-size:10px}.s12{font-size:12px}";
    header += ".s16{font-size:16px}.s24{font-size:24px}.s32{font-size:32px}";
    header += "</style>";
    header += "<g filter=\"url(#a)\">";
    header
}

/// @notice Generate dynamic animated SVG header based on page count
/// @dev Creates responsive animation system that adapts to any number of pages
/// @param page_count Number of pages to animate through (1=static, >1=animated)
/// @return SVG header with dynamic CSS animations or static layout
pub fn generate_dynamic_animated_svg_header(page_count: u8) -> ByteArray {
    let mut header = "";
    header += "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"862\" height=\"950\" fill=\"none\">";
    header += "<style>";

    // Only add animation CSS if more than 1 page
    if page_count > 1 {
        // Animation constants
        let display_duration = 5_u8; // 5 seconds per page display
        let transition_duration = 1_u8; // 1 second transition between pages
        let page_width = 1200_u16; // Width of each page in pixels

        // Calculate total cycle duration: each page gets display + transition time
        let total_duration = page_count * (display_duration + transition_duration);

        // Container that slides between pages using transform
        header += ".page-container{animation:slidePages ";
        header += u256_to_string(total_duration.into());
        header += "s infinite;}";

        // Generate positioning for all pages dynamically
        header += ".page{transform-origin:0 0;}";
        let mut page_index = 2_u8; // Start from second page (first page is at 0,0)
        while page_index <= page_count {
            let x_position = (page_index - 1).into() * page_width.into();
            header += ".page:nth-child(";
            header += u256_to_string(page_index.into());
            header += "){transform:translateX(";
            header += u256_to_string(x_position);
            header += "px);}";
            page_index += 1;
        };

        // Generate dynamic keyframes for N pages
        header += "@keyframes slidePages{";

        // Calculate percentage per page cycle
        let page_cycle_percent = 100_u32 / page_count.into();
        let display_percent = (display_duration.into() * 100_u32) / total_duration.into();

        let mut current_page = 0_u8;
        while current_page < page_count {
            // Calculate start and end percentages for this page
            let cycle_start = current_page.into() * page_cycle_percent;
            let display_end = cycle_start + display_percent;

            // Calculate the transform value (negative because container moves left)
            let transform_x_abs = current_page.into() * page_width.into();

            // Add keyframe for this page's display period
            header += u256_to_string(cycle_start.into());
            header += "%,";
            header += u256_to_string(display_end.into());
            header += "%{transform:translateX(-";
            header += u256_to_string(transform_x_abs);
            header += "px);}";

            current_page += 1;
        };

        // Add final keyframe to loop back to first page
        header += "100%{transform:translateX(0px);}";
        header += "}";
    } else {
        // No animation for single page - just static display
        header += ".page{transform-origin:0 0;}";
    }

    header += "text{font-family:VT323,IBM Plex Mono,Roboto Mono,Source Code Pro,monospace;font-weight:bold}";
    header += ".s8{font-size:8px}.s10{font-size:10px}.s12{font-size:12px}";
    header += ".s16{font-size:16px}.s24{font-size:24px}.s32{font-size:32px}";
    header += "</style>";
    header += "<g filter=\"url(#a)\">";
    header
}

/// @notice Generate static SVG footer with CSS styles, clip paths, and filter definitions
/// @dev Creates complete SVG closing structure with embedded styles and filter effects
/// @return SVG footer with typography styles, clip paths, and drop shadow filters
pub fn generate_svg_footer() -> ByteArray {
    let mut footer = "";
    footer +=
        "</g></g><defs><style>text{font-family:VT323,IBM Plex Mono,Roboto Mono,Source Code Pro,monospace;font-weight:bold}.s8{font-size:8px}.s10{font-size:10px}.s12{font-size:12px}.s16{font-size:16px}.s24{font-size:24px}.s32{font-size:32px}</style><clipPath id=\"b\"><rect width=\"567\" height=\"862\" x=\"147.2\" y=\"27\" fill=\"#fff\" rx=\"10\"/></clipPath><clipPath id=\"c\"><path fill=\"#fff\" d=\"M302 373h37v37h-37z\"/></clipPath><clipPath id=\"d\"><path fill=\"#fff\" d=\"M298 504h47v47h-47z\"/></clipPath><filter id=\"a\" width=\"861\" height=\"1402\" x=\".2\" y=\"0\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dy=\"23\"/><feGaussianBlur stdDeviation=\"25\"/><feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.26 0\"/><feBlend in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_19_3058\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dy=\"92\"/><feGaussianBlur stdDeviation=\"46\"/><feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0\"/><feBlend in2=\"effect1_dropShadow_19_3058\" result=\"effect2_dropShadow_19_3058\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dy=\"206\"/><feGaussianBlur stdDeviation=\"62\"/><feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.13 0\"/><feBlend in2=\"effect2_dropShadow_19_3058\" result=\"effect3_dropShadow_19_3058\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dy=\"366\"/><feGaussianBlur stdDeviation=\"73.5\"/><feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0\"/><feBlend in2=\"effect3_dropShadow_19_3058\" result=\"effect4_dropShadow_19_3058\"/><feBlend in=\"SourceGraphic\" in2=\"effect4_dropShadow_19_3058\" result=\"shape\"/></filter></defs></svg>";
    footer
}

/// @notice Generate animated SVG footer with definitions and closing tags
/// @dev Creates footer for animated SVGs with clip paths and filter definitions
/// @return SVG footer optimized for animated content with proper closing structure
pub fn generate_animated_svg_footer() -> ByteArray {
    let mut footer = "";
    footer +=
        "</g><defs><clipPath id=\"b\"><rect width=\"567\" height=\"862\" x=\"147.2\" y=\"27\" fill=\"#fff\" rx=\"10\"/></clipPath>";
    footer += "<clipPath id=\"c\"><path fill=\"#fff\" d=\"M302 373h37v37h-37z\"/></clipPath>";
    footer += "<clipPath id=\"d\"><path fill=\"#fff\" d=\"M298 504h47v47h-47z\"/></clipPath>";
    footer +=
        "<filter id=\"a\" width=\"861\" height=\"1402\" x=\".2\" y=\"0\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\">";
    footer += "<feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/>";
    footer +=
        "<feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/>";
    footer += "<feOffset dy=\"23\"/><feGaussianBlur stdDeviation=\"25\"/>";
    footer += "<feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.26 0\"/>";
    footer += "<feBlend in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_19_3058\"/>";
    footer +=
        "<feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/>";
    footer += "<feOffset dy=\"92\"/><feGaussianBlur stdDeviation=\"46\"/>";
    footer += "<feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0\"/>";
    footer += "<feBlend in2=\"effect1_dropShadow_19_3058\" result=\"effect2_dropShadow_19_3058\"/>";
    footer +=
        "<feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/>";
    footer += "<feOffset dy=\"206\"/><feGaussianBlur stdDeviation=\"62\"/>";
    footer += "<feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.13 0\"/>";
    footer += "<feBlend in2=\"effect2_dropShadow_19_3058\" result=\"effect3_dropShadow_19_3058\"/>";
    footer +=
        "<feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/>";
    footer += "<feOffset dy=\"366\"/><feGaussianBlur stdDeviation=\"73.5\"/>";
    footer += "<feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0\"/>";
    footer += "<feBlend in2=\"effect3_dropShadow_19_3058\" result=\"effect4_dropShadow_19_3058\"/>";
    footer += "<feBlend in=\"SourceGraphic\" in2=\"effect4_dropShadow_19_3058\" result=\"shape\"/>";
    footer += "</filter></defs></svg>";
    footer
}
