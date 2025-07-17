// SPDX-License-Identifier: MIT

use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcher};
use death_mountain::systems::beast::contracts::{IBeastSystemsDispatcher};
use death_mountain::systems::loot::contracts::{ILootSystemsDispatcher};
use death_mountain::systems::renderer::contracts::{IRendererSystemsDispatcher};
use dojo::world::{WorldStorage, WorldStorageTrait};

#[derive(Copy, Drop)]
pub struct GameLibs {
    pub loot: ILootSystemsDispatcher,
    pub renderer: IRendererSystemsDispatcher,
    pub adventurer: IAdventurerSystemsDispatcher,
    pub beast: IBeastSystemsDispatcher,
}

#[generate_trait]
pub impl ImplGameLibs of IGameLib {
    fn new(world: WorldStorage) -> GameLibs {
        let (loot_systems_address, _) = world.dns(@"loot_systems").unwrap();
        let (renderer_systems_address, _) = world.dns(@"renderer_systems").unwrap();
        let (adventurer_systems_address, _) = world.dns(@"adventurer_systems").unwrap();
        let (beast_systems_address, _) = world.dns(@"beast_systems").unwrap();

        GameLibs {
            loot: ILootSystemsDispatcher { contract_address: loot_systems_address },
            renderer: IRendererSystemsDispatcher { contract_address: renderer_systems_address },
            adventurer: IAdventurerSystemsDispatcher { contract_address: adventurer_systems_address },
            beast: IBeastSystemsDispatcher { contract_address: beast_systems_address },
        }
    }
}
