// SPDX-License-Identifier: MIT
//
// @title SVG Icon Components - Equipment and item icon definitions
// @notice Reusable SVG path elements for equipment icons
// @dev Each icon is designed to be scalable and visually clear at multiple sizes

/// @notice Generates the weapon icon SVG path
/// @dev Optimized path data for sword/weapon representation
/// @return SVG path element for weapon icon
pub fn weapon() -> ByteArray {
    "<path d=\"M8 4V3H6V2H5V1H3v2H2v2H1v1h2V5h2v2H4v2H3v2H2v2H1v2H0v2h2v-2h1v-2h1v-2h1V9h1V7h2v5h2v-2h1V8h1V6h1V4H8Z\"/>"
}

/// @notice Generates the chest armor icon SVG path
/// @dev Detailed path data representing chest/torso armor
/// @return SVG path element for chest armor icon
pub fn chest() -> ByteArray {
    "<path d=\"M0 8h2V7H0v1Zm3-3V2H2v1H1v2H0v1h4V5H3Zm2-4H4v4h1V1Zm6 0v4h1V1h-1Zm4 4V3h-1V2h-1v3h-1v1h4V5h-1Zm-1 3h2V7h-2v1ZM9 7H7V6H4v1H3v4h4v-1h2v1h4V7h-1V6H9v1Zm1 6v1h1v2h1v-2h1v-2H9v1h1Zm-3-1h2v-1H7v1Zm0 1v-1H3v2h1v2h1v-2h1v-1h1Zm2 0H7v1H6v2h4v-2H9v-1Z\" />"
}

/// @notice Generates the head armor/helmet icon SVG path
/// @dev Stylized helmet design with clear visual recognition
/// @return SVG path element for head armor icon
pub fn head() -> ByteArray {
    "<path d=\"M12 2h-1V1h-1V0H6v1H5v1H4v1H3v8h1v1h2V8H5V7H4V5h3v4h2V5h3v2h-1v1h-1v4h2v-1h1V3h-1V2ZM2 2V1H1V0H0v2h1v2h1v1-2h1V2H2Zm13-2v1h-1v1h-1v1h1v2-1h1V2h1V0h-1Z\"/>"
}

/// @notice Generates the waist armor/belt icon SVG path
/// @dev Belt or waist armor representation with buckle details
/// @return SVG path element for waist armor icon
pub fn waist() -> ByteArray {
    "<path d=\"M0 13h2v-1H0v1Zm0-2h3v-1H0v1Zm1-7H0v5h3V8h2V3H1v1Zm0-2h4V0H1v2Zm5 0h1V1h1v1h1V0H6v2Zm8-2h-4v2h4V0Zm0 4V3h-4v5h2v1h3V4h-1Zm-2 7h3v-1h-3v1Zm1 2h2v-1h-2v1ZM6 9h1v1h1V9h1V3H6v6Z\"/>"
}

/// @notice Generates the foot armor/boots icon SVG path
/// @dev Boot design with detailed sole and upper construction
/// @return SVG path element for foot armor icon
pub fn foot() -> ByteArray {
    "<path d=\"M4 1V0H0v2h5V1H4Zm2-1H5v1h1V0Zm0 2H5v1h1V2Zm0 2V3H5v1h1Zm0 2V5H5v1h1Zm0 2V7H5v1h1Zm5 0V7H9v1h2Zm0-2V5H9v1h2Zm0-2V3H9v1h2Zm0-2H9v1h2V2Zm0-2H9v1h2V0ZM8 1V0H7v2h2V1H8Zm0 6h1V6H8V5h1V4H8V3h1-2v5h1V7ZM6 9V8H4V7h1V6H4V5h1V4H4V3h1-5v8h5V9h1Zm5 0h-1V8H7v1H6v2H5v1h6V9ZM0 13h5v-1H0v1Zm11 0v-1H5v1h6Zm1 0h4v-1h-4v1Zm3-3V9h-1V8h-2v1h-1v1h1v2h4v-2h-1Zm-4-2v1-1Z\"/>"
}

/// @notice Generates the hand armor/gloves icon SVG path
/// @dev Gauntlet design showing fingers and hand protection
/// @return SVG path element for hand armor icon
pub fn hand() -> ByteArray {
    "<path d=\"M9 8v1H8v3H4v-1h3V2H6v7H5V1H4v8H3V2H2v8H1V5H0v10h1v2h5v-1h2v-1h1v-2h1V8H9Z\"/>"
}

/// @notice Generates the neck armor/necklace icon SVG path
/// @dev Amulet or neck piece design with decorative elements
/// @return SVG path element for neck armor icon
pub fn neck() -> ByteArray {
    "<path d=\"M14 8V6h-1V5h-1V4h-1V3h-1V2H8V1H2v1H1v1H0v8h1v1h1v1h4v-1h1v-1H3v-1H2V4h1V3h4v1h2v1h1v1h1v1h1v1h1v1h-2v1h1v1h2v-1h1V8h-1Zm-6 3v1h1v-1H8Zm1 0h2v-1H9v1Zm4 3v-2h-1v2h1Zm-6-2v2h1v-2H7Zm2 4h2v-1H9v1Zm-1-2v1h1v-1H8Zm3 1h1v-1h-1v1Zm0-3h1v-1h-1v1Zm-2 2h2v-2H9v2Z\"/>"
}

/// @notice Generates the ring icon SVG path
/// @dev Ring design with gem or decorative element
/// @return SVG path element for ring icon
pub fn ring() -> ByteArray {
    "<path d=\"M13 3V2h-1V1h-2v1h1v3h-1v2H9v1H8v1H7v1H6v1H4v1H1v-1H0v2h1v1h1v1h4v-1h2v-1h1v-1h1v-1h1v-1h1V9h1V7h1V3h-1ZM3 9h1V8h1V7h1V6h1V5h1V4h2V2H9V1H8v1H6v1H5v1H4v1H3v1H2v1H1v2H0v1h1v1h2V9Z\"/>"
}

/// @notice Generates the power icon SVG path with customizable fill color
/// @dev Power icon that can be themed for both player and beast stats
/// @param fill_color The fill color for the power icon (e.g., "#78E846" for green, "#FE9676" for
/// orange)
/// @return SVG path element for power icon with specified color
pub fn power_icon(fill_color: ByteArray) -> ByteArray {
    let mut icon = "<path fill=\"";
    icon += fill_color;
    icon +=
        "\" d=\"M9 6H8V4H7v3H4v1H3v2h1V8h3V7h2V6h2V0h2v6h-2v1h2V6h2V0h2v6h-2v1h2v7h-1v1h-5v1h5v-1h1v8h-1v1H4v-1H3v-8h1v1h3v-1H4v-1H1v-2H0V6h1V4h6V0h2v6Z\"/>";
    icon
}

/// @notice Generates the level icon SVG path
/// @dev Level indicator icon for both player and beast with customizable color
/// @param fill_color The fill color for the level icon
/// @return SVG path element for level icon
pub fn level_icon(fill_color: ByteArray) -> ByteArray {
    let mut icon = "";
    icon += "<path fill=\"";
    icon += fill_color.clone();
    icon +=
        "\" d=\"M20 20h3v2h-3v-2ZM18 18h2v2h-2v-2ZM16 16h2v2h-2v-2ZM7 7h3v2H7V7ZM5 5h2v2H5V5ZM3 3h2v2H3V3ZM3 20h2v2H3v-2ZM5 18h2v2H5v-2ZM7 16h3v2H7v-2Z\"/>";
    icon += "<path fill=\"";
    icon += fill_color.clone();
    icon += "\" d=\"M14 9V3h-2v6h-2v3H3v2h7v2h2v6h2v-6h2v-2h7v-2h-7V9h-2Z\"/>";
    icon += "<path fill=\"";
    icon += fill_color;
    icon += "\" d=\"M16 7h2v2h-2V7ZM18 5h2v2h-2V5ZM20 3h3v2h-3V3Z\"/>";
    icon
}

/// @notice Generates the dexterity icon SVG path
/// @dev Dexterity stat icon with customizable color
/// @param fill_color The fill color for the dexterity icon
/// @return SVG path element for dexterity icon
pub fn dexterity_icon(fill_color: ByteArray) -> ByteArray {
    let mut icon = "<path fill=\"";
    icon += fill_color;
    icon +=
        "\" d=\"M12 13v-2h-1v-1h-1V9H9V7H7V6H6V5H5V3H3V2H2V1H1v25h1v-1h1v-2h2v-1h1v-1h1v-2h2v-1h1v-1h1v-2h1v-1h2v-1h-2ZM26 13v-2h-2v-1h-1V9h-1V7h-2V6h-1V5h-1V3h-2V2h-1V1h-1v25h1v-1h1v-2h2v-1h1v-1h1v-2h2v-1h1v-1h1v-2h2v-1h1v-1h-1Z\"/>";
    icon
}

/// @notice Generates the grave icon SVG for death page
/// @dev Pixelated tombstone design with cross symbol for deceased adventurers
/// @return SVG content for grave icon with 80x100 dimensions
pub fn grave_icon() -> ByteArray {
    let mut icon = "";

    // Tombstone body
    icon += "<path fill=\"#666\" d=\"M20 25h40v55H20z\"/>";

    // Arched tombstone top (pixelated dome effect)
    icon += "<path fill=\"#666\" d=\"M25 15h30v15H25z\"/>";
    icon += "<path fill=\"#666\" d=\"M30 10h20v10H30z\"/>";
    icon += "<path fill=\"#666\" d=\"M35 5h10v10H35z\"/>";

    // Cross symbol
    icon += "<path fill=\"#999\" d=\"M37 20h6v30h-6z\"/>"; // Vertical bar
    icon += "<path fill=\"#999\" d=\"M27 30h26v6H27z\"/>"; // Horizontal bar

    // Ground and details
    icon += "<path fill=\"#444\" d=\"M10 80h60v4H10z\"/>";
    icon += "<path fill=\"#555\" d=\"M15 78h3v3h-3zM62 78h3v3h-3zM25 76h2v2h-2zM53 76h2v2h-2zM56 30h4v45h-4z\"/>";
    icon += "<path fill=\"#555\" d=\"M25 76h30v4H25z\"/>";

    // Depth details
    icon += "<path fill=\"#777\" d=\"M20 25h4v4h-4z\"/>";
    icon += "<path fill=\"#555\" d=\"M56 25h4v4h-4z\"/>";

    icon
}
