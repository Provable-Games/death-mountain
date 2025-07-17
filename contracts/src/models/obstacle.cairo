// SPDX-License-Identifier: MIT

use death_mountain::constants::combat::CombatEnums::{Tier, Type};
use death_mountain::constants::obstacle::{ObstacleId, ObstacleSettings};
use death_mountain::models::combat::{CombatSpec, ImplCombat};

#[derive(Drop, Copy)]
pub struct Obstacle {
    pub id: u8,
    pub combat_spec: CombatSpec,
}

#[generate_trait]
pub impl ImplObstacle of IObstacle {
    /// @notice returns a random obstacle id based on the provided seed
    /// @param rnd: u32 - random value used to determine obstacle id
    /// @return u8 - the obstacle id
    fn get_random_id(seed: u32) -> u8 {
        let obstacle_id = (seed % ObstacleId::MAX_ID.into()) + 1;
        obstacle_id.try_into().unwrap()
    }

    /// @notice returns the tier of the obstacle based on the provided obstacle id
    /// @param id: u8 - the obstacle id
    /// @return u8 - the obstacle tier
    fn get_tier(id: u8) -> Tier {
        if Self::is_t1(id) {
            Tier::T1
        } else if Self::is_t2(id) {
            Tier::T2
        } else if Self::is_t3(id) {
            Tier::T3
        } else if Self::is_t4(id) {
            Tier::T4
        } else {
            Tier::T5
        }
    }


    fn is_t1(id: u8) -> bool {
        (id >= 1 && id < 6) || (id >= 26 && id < 31) || (id >= 51 && id < 56)
    }

    fn is_t2(id: u8) -> bool {
        (id >= 6 && id < 11) || (id >= 31 && id < 36) || (id >= 56 && id < 61)
    }

    fn is_t3(id: u8) -> bool {
        (id >= 11 && id < 16) || (id >= 36 && id < 41) || (id >= 61 && id < 66)
    }

    fn is_t4(id: u8) -> bool {
        (id >= 16 && id < 21) || (id >= 41 && id < 46) || (id >= 66 && id < 71)
    }

    // @notice returns the type of the obstacle based on the provided obstacle id
    // @param id: u8 - the obstacle id
    // @return u8 - the obstacle type
    fn get_type(id: u8) -> Type {
        if id < ObstacleId::PendulumBlades {
            Type::Magic_or_Cloth
        } else if id < ObstacleId::CollapsingCeiling {
            Type::Blade_or_Hide
        } else {
            Type::Bludgeon_or_Metal
        }
    }

    // @notice get_xp_reward returns the xp reward from encountering the obstacle
    // @param obstacle: Obstacle - the obstacle
    // @param adventurer_level: u8 - the level of adventurer
    // @return u16 - the xp reward
    fn get_xp_reward(self: Obstacle, adventurer_level: u8) -> u16 {
        let xp_reward = self.combat_spec.get_base_reward(adventurer_level);
        if (xp_reward < ObstacleSettings::MINIMUM_XP_REWARD) {
            ObstacleSettings::MINIMUM_XP_REWARD
        } else {
            xp_reward
        }
    }
}
// ---------------------------

