// SPDX-License-Identifier: MIT
//
// @title Battle Message Generator
// @notice Functions for generating dynamic battle messages
// @dev Provides contextual battle messages based on game state and actions
// @author Built for the Loot Survivor ecosystem

use death_mountain::models::adventurer::adventurer::AdventurerVerbose;
use death_mountain::utils::string::string_utils::u64_to_string;

/// @notice Generate battle message based on adventurer state
/// @dev Creates contextual battle message based on health, beast, and combat state
/// @param adventurer The adventurer data to analyze
/// @return Battle message string appropriate for current state
pub fn generate_battle_message(adventurer: AdventurerVerbose) -> ByteArray {
    // Check if adventurer is dead
    if adventurer.health == 0 {
        return generate_death_message();
    }

    // Check if in active combat with beast
    if adventurer.beast_health > 0 {
        return generate_combat_message(adventurer);
    }

    // Default exploration message
    generate_exploration_message()
}

/// @notice Generate combat-specific battle message
/// @dev Creates message for active combat scenarios with damage and actions
/// @param adventurer The adventurer data with active beast combat
/// @return Combat-specific battle message
fn generate_combat_message(adventurer: AdventurerVerbose) -> ByteArray {
    let mut message = "BATTLE IN PROGRESS...";

    message
}

/// @notice Generate death message
/// @dev Creates message for when adventurer has died
/// @return Death-specific battle message
fn generate_death_message() -> ByteArray {
    "YOU HAVE FALLEN IN BATTLE!"
}

/// @notice Generate exploration message
/// @dev Creates message for peaceful exploration state
/// @return Exploration-specific message
fn generate_exploration_message() -> ByteArray {
    "BATTLE IN PROGRESS..."
}

/// @notice Generate victory message
/// @dev Creates message for defeating a beast
/// @param beast_name Name of the defeated beast
/// @param xp_gained Experience points gained from victory
/// @return Victory message with details
pub fn generate_victory_message(beast_name: ByteArray, xp_gained: u64) -> ByteArray {
    let mut message = "";
    message += "DEFEATED ";
    message += beast_name;
    message += "! GAINED ";
    message += u64_to_string(xp_gained);
    message += " XP!";
    message
}

/// @notice Generate critical hit message
/// @dev Creates message for critical hit scenarios
/// @param damage_dealt Damage dealt by the critical hit
/// @return Critical hit message
pub fn generate_critical_hit_message(damage_dealt: u64) -> ByteArray {
    let mut message = "";
    message += "CRITICAL HIT! ";
    message += u64_to_string(damage_dealt);
    message += " DAMAGE!";
    message
}

/// @notice Generate level up message
/// @dev Creates message for level up events
/// @param new_level The new level reached
/// @return Level up celebration message
pub fn generate_level_up_message(new_level: u64) -> ByteArray {
    let mut message = "";
    message += "LEVEL UP! NOW LEVEL ";
    message += u64_to_string(new_level);
    message += "!";
    message
}

/// @notice Generate item found message
/// @dev Creates message for item discovery
/// @param item_name Name of the found item
/// @return Item discovery message
pub fn generate_item_found_message(item_name: ByteArray) -> ByteArray {
    let mut message = "";
    message += "FOUND ";
    message += item_name;
    message += "!";
    message
}

/// @notice Generate flee message
/// @dev Creates message for fleeing from combat
/// @return Flee attempt message
pub fn generate_flee_message() -> ByteArray {
    "YOU ATTEMPT TO FLEE!"
}

/// @notice Generate heal message
/// @dev Creates message for healing actions
/// @param health_restored Amount of health restored
/// @return Healing action message
pub fn generate_heal_message(health_restored: u64) -> ByteArray {
    let mut message = "";
    message += "RESTORED ";
    message += u64_to_string(health_restored);
    message += " HEALTH!";
    message
}

/// @notice Get contextual message color based on message type
/// @dev Returns appropriate color theme for different message types
/// @param message The message to analyze
/// @return Color hex code for the message
pub fn get_message_color(message: ByteArray) -> ByteArray {
    // Simple message color logic based on message length and common patterns
    if message.len() > 15 {
        // Longer messages are typically combat/damage
        "#E89446" // Orange for general messages
    } else if message.len() < 8 {
        // Short messages are typically simple status
        "#78E846" // Green for simple status
    } else {
        "#E89446" // Default orange
    }
}
