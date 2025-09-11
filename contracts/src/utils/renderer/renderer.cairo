// SPDX-License-Identifier: MIT
//
// @title SVG Renderer for LS2 Battle Interface NFTs
// @notice Core rendering system that generates dynamic SVG-based battle interface metadata
// @dev Integrates with mock adventurer contracts to fetch data and create on-chain NFT metadata

use death_mountain::models::adventurer::adventurer::AdventurerVerbose;
use death_mountain::utils::renderer::encoding::bytes_base64_encode;
use death_mountain::utils::renderer::renderer_utils::{generate_details, generate_svg, generate_svg_with_page};
use death_mountain::utils::string::string_utils::u64_to_string;
use game_components_minigame::structs::GameDetail;

/// @title Renderer Trait - Core rendering interface for battle interface NFTs
/// @notice Defines the contract for rendering dynamic NFT metadata
/// @dev Implementations should generate complete Base64-encoded JSON metadata with embedded SVG
pub trait Renderer {
    fn create_metadata(token_id: u64, adventurer_verbose: AdventurerVerbose) -> ByteArray;
    fn create_page_metadata(token_id: u64, adventurer_verbose: AdventurerVerbose, page: u8) -> ByteArray;
    fn get_traits(adventurer_verbose: AdventurerVerbose) -> Span<GameDetail>;
    fn get_name() -> ByteArray;
    fn get_description() -> ByteArray;
    fn get_image(adventurer_verbose: AdventurerVerbose) -> ByteArray;
    fn get_page_image(adventurer_verbose: AdventurerVerbose, page: u8) -> ByteArray;
}


/// @notice Default implementation of the Renderer trait
/// @dev Fetches adventurer data from mock contract and generates SVG battle interface
pub impl RendererImpl of Renderer {
    fn create_metadata(token_id: u64, adventurer_verbose: AdventurerVerbose) -> ByteArray {
        // Generate SVG with dynamic stats and equipment
        let svg = generate_svg(adventurer_verbose);

        // Encode SVG to base64
        let svg_base64 = bytes_base64_encode(svg);

        // Create JSON metadata
        let mut json = "{\"name\":\"Adventurer #";
        json += u64_to_string(token_id);
        json +=
            "\",\"description\":\"Loot Survivor is a verifiably random, procedurally generated dungeon crawler. Explore the endless dungeons in pursuit of mythical loot while fighting for your life against vicious beasts and treacherous obstacles.\",\"image\":\"data:image/svg+xml;base64,";
        json += svg_base64.clone();
        json += "\"}";

        // Encode JSON to base64 and return as data URI
        let json_base64 = bytes_base64_encode(json.clone());
        let mut result: ByteArray = "data:application/json;base64,";
        result += json_base64;

        result
    }

    fn create_page_metadata(token_id: u64, adventurer_verbose: AdventurerVerbose, page: u8) -> ByteArray {
        // Generate SVG with dynamic stats and equipment for specific page
        let svg = generate_svg_with_page(adventurer_verbose, page);

        // Encode SVG to base64
        let svg_base64 = bytes_base64_encode(svg);

        // Create JSON metadata
        let mut json = "{\"name\":\"Adventurer #";
        json += u64_to_string(token_id);
        json +=
            "\",\"description\":\"Loot Survivor is a verifiably random, procedurally generated dungeon crawler. Explore the endless dungeons in pursuit of mythical loot while fighting for your life against vicious beasts and treacherous obstacles.\",\"image\":\"data:image/svg+xml;base64,";
        json += svg_base64.clone();
        json += "\"}";

        // Encode JSON to base64 and return as data URI
        let json_base64 = bytes_base64_encode(json.clone());
        let mut result: ByteArray = "data:application/json;base64,";
        result += json_base64;

        result
    }

    fn get_traits(adventurer_verbose: AdventurerVerbose) -> Span<GameDetail> {
        generate_details(adventurer_verbose)
    }

    fn get_name()-> ByteArray {
        "Adventurer"
    }

    fn get_description() -> ByteArray {
        "Loot Survivor is a verifiably random, procedurally generated dungeon crawler. Explore the endless dungeons in pursuit of mythical loot while fighting for your life against vicious beasts and treacherous obstacles."
    }

    fn get_image(adventurer_verbose: AdventurerVerbose) -> ByteArray {
        // Generate SVG with dynamic stats and equipment
        let svg = generate_svg(adventurer_verbose);

        // Encode SVG to base64
        let svg_base64 = bytes_base64_encode(svg);
        let image = "data:image/svg+xml;base64," + svg_base64;

        image
    }

    fn get_page_image(adventurer_verbose: AdventurerVerbose, page: u8) -> ByteArray {
        // Generate SVG with dynamic stats and equipment for specific page
        let svg = generate_svg_with_page(adventurer_verbose, page);

        // Encode SVG to base64
        let svg_base64 = bytes_base64_encode(svg);
        let image = "data:image/svg+xml;base64," + svg_base64;

        image
    }
}
