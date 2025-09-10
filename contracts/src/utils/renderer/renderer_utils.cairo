// SPDX-License-Identifier: MIT
//
// @title Renderer Utilities - SVG Generation and Metadata Creation
// @notice Comprehensive utility functions for generating dynamic battle interface SVG
// @dev Modular SVG component system optimized for gas efficiency and visual excellence

use death_mountain::models::adventurer::adventurer::AdventurerVerbose;
use death_mountain::models::renderer::{BattleState, PageMode};

use death_mountain::utils::renderer::components::headers::{
    generate_animated_svg_footer, generate_dynamic_animated_svg_header, generate_svg_footer, generate_svg_header,
};
use death_mountain::utils::renderer::core::svg_builder::{
    generate_border_for_page, generate_sliding_container_end, generate_sliding_container_start,
};
use death_mountain::utils::renderer::encoding::{U256BytesUsedTraitImpl, bytes_base64_encode};
use death_mountain::utils::renderer::pages::page_generators::{
    // generate_battle_page_content, // TEMPORARILY DISABLED
    generate_death_page_content, generate_inventory_page_content, generate_item_bag_page_content, generate_page_content,
    generate_page_wrapper,
};
use game_components_minigame::structs::GameDetail;


pub fn generate_svg_with_page(adventurer: AdventurerVerbose, page: u8) -> ByteArray {
    let mut svg = "";

    svg += generate_svg_header();
    svg += generate_page_content(adventurer, page);
    svg += generate_border_for_page(page);
    svg += generate_svg_footer();

    svg
}


// Generate dynamic SVG that automatically handles all cases including animations based on
// adventurer's battle state
pub fn generate_svg(adventurer: AdventurerVerbose) -> ByteArray {
    let mut svg = "";

    let battle_state = if (adventurer.health == 0 && adventurer.xp > 0) {
        BattleState::Dead
    } else if adventurer.beast_health > 0 {
        BattleState::InCombat
    } else {
        BattleState::Normal
    };

    let page_mode = match battle_state {
        BattleState::Dead => PageMode::DeathOnly,
        // BattleState::InCombat => PageMode::BattleOnly, // Only battle page - TEMPORARILY DISABLED
        BattleState::InCombat => PageMode::Normal(2), // TEMPORARY: Use normal 2-page mode during battle
        BattleState::Normal => PageMode::Normal(2) // inventory, bag
    };

    let page_count = match page_mode {
        PageMode::BattleOnly => 2_u8, // TEMPORARILY DISABLED - now returns normal 2-page count
        PageMode::DeathOnly => 1_u8,
        PageMode::Normal(count) => count,
    };

    svg += generate_dynamic_animated_svg_header(page_count);

    match page_mode {
        PageMode::BattleOnly => {
            // TEMPORARILY DISABLED - battle mode now shows normal 2-page cycle instead
            if page_count > 1 {
                svg += generate_sliding_container_start();
            }

            let inventory_content = generate_inventory_page_content(adventurer.clone());
            let inventory_border = generate_border_for_page(0);
            svg += generate_page_wrapper(inventory_content, inventory_border);

            let item_bag_content = generate_item_bag_page_content(adventurer.clone());
            let item_bag_border = generate_border_for_page(1);
            svg += generate_page_wrapper(item_bag_content, item_bag_border);

            if page_count > 1 {
                svg += generate_sliding_container_end();
            }
        },
        PageMode::DeathOnly => {
            let death_content = generate_death_page_content(adventurer.clone());
            let death_border = generate_border_for_page(3);
            svg += generate_page_wrapper(death_content, death_border);
        },
        PageMode::Normal(_) => {
            // Show 2-page sliding cycle: Inventory <-> ItemBag
            if page_count > 1 {
                svg += generate_sliding_container_start();
            }

            let inventory_content = generate_inventory_page_content(adventurer.clone());
            let inventory_border = generate_border_for_page(0);
            svg += generate_page_wrapper(inventory_content, inventory_border);

            let item_bag_content = generate_item_bag_page_content(adventurer.clone());
            let item_bag_border = generate_border_for_page(1);
            svg += generate_page_wrapper(item_bag_content, item_bag_border);

            if page_count > 1 {
                svg += generate_sliding_container_end();
            }
        },
    }

    svg += generate_animated_svg_footer();

    format!("data:image/svg+xml;base64,{}", bytes_base64_encode(svg))
}

// @notice Helper function to encode item names using U256BytesUsedTraitImpl
// @param name The felt252 name to encode
// @return ByteArray containing the encoded name
pub fn encode_item_name(name: felt252) -> ByteArray {
    let mut encoded_name = Default::default();
    encoded_name.append_word(name, U256BytesUsedTraitImpl::bytes_used(name.into()).into());
    encoded_name
}

// @notice Generates adventurer details for the adventurer
// @param adventurer The adventurer
// @return The generated adventurer details
pub fn generate_details(adventurer: AdventurerVerbose) -> Span<GameDetail> {
    let xp = format!("{}", adventurer.xp);
    let level = format!("{}", adventurer.level);

    let health = format!("{}", adventurer.health);

    let gold = format!("{}", adventurer.gold);
    let str = if adventurer.level == 1 {
        "?"
    } else {
        format!("{}", adventurer.stats.strength)
    };
    let dex = if adventurer.level == 1 {
        "?"
    } else {
        format!("{}", adventurer.stats.dexterity)
    };
    let int = if adventurer.level == 1 {
        "?"
    } else {
        format!("{}", adventurer.stats.intelligence)
    };
    let vit = if adventurer.level == 1 {
        "?"
    } else {
        format!("{}", adventurer.stats.vitality)
    };
    let wis = if adventurer.level == 1 {
        "?"
    } else {
        format!("{}", adventurer.stats.wisdom)
    };
    let cha = if adventurer.level == 1 {
        "?"
    } else {
        format!("{}", adventurer.stats.charisma)
    };
    let luck = format!("{}", adventurer.stats.luck);
    let packed_adventurer = format!("{}", adventurer.packed_adventurer);
    let packed_bag = format!("{}", adventurer.packed_bag);

    let weapon_name = encode_item_name(adventurer.equipment.weapon.name);
    let chest_name = encode_item_name(adventurer.equipment.chest.name);
    let head_name = encode_item_name(adventurer.equipment.head.name);
    let waist_name = encode_item_name(adventurer.equipment.waist.name);
    let foot_name = encode_item_name(adventurer.equipment.foot.name);
    let hand_name = encode_item_name(adventurer.equipment.hand.name);
    let neck_name = encode_item_name(adventurer.equipment.neck.name);
    let ring_name = encode_item_name(adventurer.equipment.ring.name);

    array![
        GameDetail { name: "XP", value: xp },
        GameDetail { name: "Level", value: level },
        GameDetail { name: "Health", value: health },
        GameDetail { name: "Gold", value: gold },
        GameDetail { name: "Strength", value: str },
        GameDetail { name: "Dexterity", value: dex },
        GameDetail { name: "Intelligence", value: int },
        GameDetail { name: "Vitality", value: vit },
        GameDetail { name: "Wisdom", value: wis },
        GameDetail { name: "Charisma", value: cha },
        GameDetail { name: "Luck", value: luck },
        GameDetail { name: "Packed Adventurer", value: packed_adventurer },
        GameDetail { name: "Packed Bag", value: packed_bag },
        GameDetail { name: "Weapon", value: weapon_name },
        GameDetail { name: "Chest", value: chest_name },
        GameDetail { name: "Head", value: head_name },
        GameDetail { name: "Waist", value: waist_name },
        GameDetail { name: "Foot", value: foot_name },
        GameDetail { name: "Hand", value: hand_name },
        GameDetail { name: "Neck", value: neck_name },
        GameDetail { name: "Ring", value: ring_name },
    ]
        .span()
}
