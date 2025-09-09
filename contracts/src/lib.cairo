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
    pub mod objectives {
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
    pub mod game_data;
    pub mod loot;
    pub mod market;
    pub mod objectives;
    pub mod obstacle;
    pub mod renderer;
}

pub mod utils {
    pub mod loot;
    pub mod renderer {
        pub mod pages {
            pub mod battle;
            pub mod battle_layout;
            pub mod battle_messages;
            pub mod battle_sprites;
            pub mod death;
            pub mod inventory;
            pub mod item_bag;
            pub mod page_generators;
        }

        pub mod encoding;
        pub mod renderer;
        pub mod renderer_utils;

        pub mod components {
            pub mod headers;
            pub mod icons;
            pub mod theme;
            pub mod ui_components;
        }
        pub mod core {
            pub mod math_utils;
            pub mod svg_builder;
            pub mod text_utils;
        }
        pub mod equipment {
            pub mod badges;
            pub mod names;
            pub mod positioning;
            pub mod slots;
        }
        pub mod bag {
            pub mod bag_renderer;
            pub mod bag_utils;
        }
    }
    pub mod string {
        pub mod string_utils;
    }

    #[cfg(test)]
    pub mod setup_denshokan;
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
    pub mod settings;
}
