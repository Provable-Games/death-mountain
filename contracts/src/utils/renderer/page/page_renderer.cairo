use death_mountain::models::adventurer::adventurer::AdventurerVerbose;
use death_mountain::models::renderer::{BattleState, PageMode};
use death_mountain::utils::encoding::encoding::bytes_base64_encode;
use death_mountain::utils::renderer::renderer::Renderer;
use death_mountain::utils::renderer::renderer_utils::{generate_svg, generate_svg_with_page};
use death_mountain::utils::string::string_utils::{u64_to_string, u8_to_string};

/// @title PageRenderer Trait - Paginated rendering interface for multipage NFTs
/// @notice Extends rendering capabilities to support multiple pages with transitions
/// @dev Enables creation of multipage NFT experiences with sequential page navigation
pub trait PageRenderer {
    /// @notice Renders specific page metadata for a given token
    /// @param token_id The NFT token ID to render metadata for
    /// @param adventurer_verbose Pre-fetched adventurer data with resolved item names
    /// @param page The page number to render (0-indexed)
    /// @return Base64-encoded JSON metadata string containing SVG for specified page
    fn render_page(token_id: u64, adventurer_verbose: AdventurerVerbose, page: u8) -> ByteArray;
    /// @notice Gets total number of pages available for an adventurer
    /// @param adventurer_verbose Pre-fetched adventurer data with resolved item names
    /// @return Total number of pages available
    fn get_page_count(adventurer_verbose: AdventurerVerbose) -> u8;
    /// @notice Gets SVG image data for a specific page
    /// @param adventurer_verbose Pre-fetched adventurer data with resolved item names
    /// @param page The page number to render (0-indexed)
    /// @return Base64-encoded SVG image data URI
    fn get_page_image(adventurer_verbose: AdventurerVerbose, page: u8) -> ByteArray;
    /// @notice Renders animated multi-page SVG with transitions
    /// @param token_id The NFT token ID to render metadata for
    /// @param adventurer_verbose Pre-fetched adventurer data with resolved item names
    /// @return Base64-encoded JSON metadata string containing animated SVG
    fn render_animated_pages(token_id: u64, adventurer_verbose: AdventurerVerbose) -> ByteArray;
    /// @notice Gets the current battle state of the adventurer
    /// @param adventurer_verbose Pre-fetched adventurer data with resolved item names
    /// @return BattleState indicating current combat status
    fn get_battle_state(adventurer_verbose: AdventurerVerbose) -> BattleState;
    /// @notice Checks if adventurer is currently in battle mode
    /// @param adventurer_verbose Pre-fetched adventurer data with resolved item names
    /// @return True if in battle mode, false otherwise
    fn is_battle_mode(adventurer_verbose: AdventurerVerbose) -> bool;
    /// @notice Gets the appropriate page mode based on battle state
    /// @param adventurer_verbose Pre-fetched adventurer data with resolved item names
    /// @return PageMode indicating how pages should be displayed
    fn get_page_mode(adventurer_verbose: AdventurerVerbose) -> PageMode;
}

/// @notice Implementation of the PageRenderer trait for multipage NFT support
/// @dev Extends base rendering with pagination capabilities
pub impl PageRendererImpl of PageRenderer {
    fn render_page(token_id: u64, adventurer_verbose: AdventurerVerbose, page: u8) -> ByteArray {
        // Get page count first to avoid move issues
        let page_count = Self::get_page_count(adventurer_verbose.clone());

        // Generate SVG for specific page
        let svg = generate_svg_with_page(adventurer_verbose, page);
        let svg_base64 = bytes_base64_encode(svg);

        // Create JSON metadata with pagination info
        let mut json = "{\"name\":\"Adventurer #";
        json += u64_to_string(token_id);
        json += " - Page ";
        json += u8_to_string(page + 1);
        json += "\",\"description\":\"";
        json += Renderer::get_description();
        json += "\",\"image\":\"data:image/svg+xml;base64,";
        json += svg_base64;
        json += "\",\"pages\":{\"current\":";
        json += u8_to_string(page);
        json += ",\"total\":";
        json += u8_to_string(page_count);
        json += "}}";

        // Encode JSON to base64 and return as data URI
        let json_base64 = bytes_base64_encode(json);
        let mut result: ByteArray = "data:application/json;base64,";
        result += json_base64;

        result
    }

    fn get_page_count(adventurer_verbose: AdventurerVerbose) -> u8 {
        match Self::get_page_mode(adventurer_verbose) {
            PageMode::BattleOnly => 2, // TEMPORARILY DISABLED - now returns normal 2-page count
            PageMode::DeathOnly => 1, // Only death page when dead
            PageMode::Normal(count) => count // Normal 2-page cycle (Inventory, ItemBag)
        }
    }

    fn get_page_image(adventurer_verbose: AdventurerVerbose, page: u8) -> ByteArray {
        // Generate SVG for specific page
        let svg = generate_svg_with_page(adventurer_verbose, page);
        let svg_base64 = bytes_base64_encode(svg);

        let image = "data:image/svg+xml;base64," + svg_base64;
        image
    }

    fn render_animated_pages(token_id: u64, adventurer_verbose: AdventurerVerbose) -> ByteArray {
        // Generate dynamic animated SVG based on battle state
        let animated_svg = generate_svg(adventurer_verbose.clone());
        let svg_base64 = bytes_base64_encode(animated_svg);
        let page_count = Self::get_page_count(adventurer_verbose.clone());

        // Create JSON metadata for animated pages
        let mut json = "{\"name\":\"Adventurer #";
        json += u64_to_string(token_id);
        json += " - Animated\",\"description\":\"";
        json += Renderer::get_description();
        json += "\",\"image\":\"data:image/svg+xml;base64,";
        json += svg_base64;
        json += "\",\"animation\":true,\"pages\":{\"total\":";
        json += u8_to_string(page_count);
        json += ",\"mode\":\"";

        // Add battle state info to metadata
        let battle_state = Self::get_battle_state(adventurer_verbose.clone());
        match battle_state {
            BattleState::Dead => json += "dead",
            BattleState::InCombat => json += "battle",
            BattleState::Normal => json += "normal",
        }
        json += "\"}}";

        // Encode JSON to base64 and return as data URI
        let json_base64 = bytes_base64_encode(json);
        let mut result: ByteArray = "data:application/json;base64,";
        result += json_base64;

        result
    }

    fn get_battle_state(adventurer_verbose: AdventurerVerbose) -> BattleState {
        if adventurer_verbose.health == 0 {
            BattleState::Dead
        } else if adventurer_verbose.beast_health > 0 {
            BattleState::InCombat
        } else {
            BattleState::Normal
        }
    }

    fn is_battle_mode(adventurer_verbose: AdventurerVerbose) -> bool {
        adventurer_verbose.beast_health > 0 && adventurer_verbose.health > 0
    }

    fn get_page_mode(adventurer_verbose: AdventurerVerbose) -> PageMode {
        match Self::get_battle_state(adventurer_verbose) {
            BattleState::Dead => PageMode::DeathOnly, // Only death page when dead
            // BattleState::InCombat => PageMode::BattleOnly, // Only battle page when in combat -
            // TEMPORARILY DISABLED
            BattleState::InCombat => PageMode::Normal(2), // TEMPORARY: Use normal 2-page mode during battle
            BattleState::Normal => PageMode::Normal(2) // Only inventory and bag pages when alive & not in battle
        }
    }
}
