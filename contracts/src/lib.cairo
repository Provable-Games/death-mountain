// SPDX-License-Identifier: UNLICENSED

pub mod systems {
    pub mod game {
        pub mod contracts;
    }
    pub mod loot {
        pub mod contracts;
    }
    pub mod renderer {
        pub mod contracts;
    }
    pub mod adventurer {
        pub mod contracts;
    }
    pub mod beast {
        pub mod contracts;
    }
    pub mod game_token {
        pub mod contracts;
    }
    pub mod settings {
        pub mod contracts;
    }
}

pub mod models {
    pub mod adventurer {
        pub mod adventurer;
        pub mod bag;
        pub mod equipment;
        pub mod item;
        pub mod stats;
    }
    pub mod beast;
    pub mod combat;
    pub mod game;
    pub mod loot;
    pub mod market;
    pub mod obstacle;
}

pub mod utils {
    pub mod loot;
    pub mod renderer {
        pub mod encoding;
        pub mod renderer_utils;
    }
    pub mod vrf;
}

pub mod constants {
    pub mod adventurer;
    pub mod beast;
    pub mod combat;
    pub mod discovery;
    pub mod game;
    pub mod loot;
    pub mod market;
    pub mod obstacle;
    pub mod world;
}

pub mod libs {
    pub mod game;
}

#[cfg(test)]
mod tests {
    mod unit {
        mod models {
            mod obstacle_test;
            mod market_test;
            mod beast_test;
        }
        mod utils {
            mod renderer_utils_test;
            mod loot_test;
        }
    }
}
