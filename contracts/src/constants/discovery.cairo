// SPDX-License-Identifier: MIT

pub mod DiscoveryEnums {
    #[derive(Copy, Drop, Serde, PartialEq)]
    pub enum ExploreResult {
        Beast,
        Obstacle,
        Discovery,
    }

    #[derive(Introspect, Copy, Drop, Serde, PartialEq)]
    pub enum DiscoveryType {
        Gold: u16,
        Health: u16,
        Loot: u8,
    }
}
