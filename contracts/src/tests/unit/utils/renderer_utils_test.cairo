// SPDX-License-Identifier: MIT

#[cfg(test)]
mod tests {
    use death_mountain::constants::beast::BeastSettings;
    use death_mountain::models::adventurer::adventurer::{Adventurer, ImplAdventurer};
    use death_mountain::models::adventurer::bag::{Bag, ImplBag};
    use death_mountain::models::adventurer::equipment::{Equipment};
    use death_mountain::models::adventurer::item::{ImplItem, Item};
    use death_mountain::models::adventurer::stats::{ImplStats, Stats};
    use death_mountain::utils::renderer::renderer_utils::create_metadata;


    #[test]
    fn metadata() {
        let adventurer = Adventurer {
            health: 1023,
            xp: 10000,
            stats: Stats {
                strength: 10, dexterity: 50, vitality: 50, intelligence: 50, wisdom: 50, charisma: 50, luck: 100,
            },
            gold: 1023,
            equipment: Equipment {
                weapon: Item { id: 42, xp: 400 },
                chest: Item { id: 49, xp: 400 },
                head: Item { id: 53, xp: 400 },
                waist: Item { id: 59, xp: 400 },
                foot: Item { id: 64, xp: 400 },
                hand: Item { id: 69, xp: 400 },
                neck: Item { id: 1, xp: 400 },
                ring: Item { id: 7, xp: 400 },
            },
            beast_health: BeastSettings::STARTER_BEAST_HEALTH.into(),
            stat_upgrades_available: 0,
            item_specials_seed: 0,
            action_count: 0,
        };

        let bag = Bag {
            item_1: Item { id: 8, xp: 400 },
            item_2: Item { id: 40, xp: 400 },
            item_3: Item { id: 57, xp: 400 },
            item_4: Item { id: 83, xp: 400 },
            item_5: Item { id: 12, xp: 400 },
            item_6: Item { id: 77, xp: 400 },
            item_7: Item { id: 68, xp: 400 },
            item_8: Item { id: 100, xp: 400 },
            item_9: Item { id: 94, xp: 400 },
            item_10: Item { id: 54, xp: 400 },
            item_11: Item { id: 87, xp: 400 },
            item_12: Item { id: 81, xp: 400 },
            item_13: Item { id: 30, xp: 400 },
            item_14: Item { id: 11, xp: 400 },
            item_15: Item { id: 29, xp: 400 },
            mutated: false,
        };

        let current_1 = create_metadata(1000000, adventurer, 'thisisareallyreallyreallongname', bag);

        let current_2 = create_metadata(1000000, adventurer, 'thisisareallyreallyreallongname', bag);

        let current_3 = create_metadata(1000000, adventurer, 'thisisareallyreallyreallongname', bag);

        let historical_1 = create_metadata(1000000, adventurer, 'thisisareallyreallyreallongname', bag);

        let historical_2 = create_metadata(1000000, adventurer, 'thisisareallyreallyreallongname', bag);

        let historical_3 = create_metadata(1000000, adventurer, 'thisisareallyreallyreallongname', bag);

        let plain = create_metadata(1000000, adventurer, 'thisisareallyreallyreallongname', bag);

        println!("Current 1: {}", current_1);
        println!("Current 2: {}", current_2);
        println!("Current 3: {}", current_3);
        println!("Historical 1: {}", historical_1);
        println!("Historical 2: {}", historical_2);
        println!("Historical 3: {}", historical_3);
        println!("Plain: {}", plain);
    }
}
