// SPDX-License-Identifier: MIT
//
// @title Page Type Definitions - Multi-Page NFT System
// @notice Core data structures for managing multi-page SVG NFT rendering
// @dev Defines page types, battle states, and animation configurations

#[derive(Copy, Drop, PartialEq, Serde, Debug)]
pub enum PageType {
    Inventory, // Page 0: Current inventory page (green theme) - current implementation
    ItemBag, // Page 1: Item Bag contents (orange theme) - displays adventurer's bag items
    Battle, // Page 2: Battle-specific interface (red theme) - only shown during combat
    Death // Page 3: Death page (grey theme) - only shown when health == 0
}

#[derive(Copy, Drop, PartialEq, Serde, Debug)]
pub enum BattleState {
    Dead, // Adventurer health == 0
    InCombat, // Beast health > 0
    Normal // Normal exploration state
}

#[derive(Copy, Drop, PartialEq, Serde, Debug)]
pub enum PageMode {
    BattleOnly,
    DeathOnly,
    Normal: u8 // Normal cycling with page count
}

#[derive(Copy, Drop, PartialEq, Serde, Debug)]
pub struct PageConfig {
    pub page_type: PageType,
    pub transition_duration: u16,
    pub auto_advance: bool,
}

pub impl PageConfigDefault of Default<PageConfig> {
    fn default() -> PageConfig {
        PageConfig {
            page_type: PageType::Inventory, transition_duration: 500, // 0.5 seconds in milliseconds
            auto_advance: true,
        }
    }
}
