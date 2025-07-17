// SPDX-License-Identifier: BUSL-1.1

use death_mountain::models::adventurer::stats::Stats;
use death_mountain::models::market::ItemPurchase;

const VRF_ENABLED: bool = true;

#[starknet::interface]
pub trait IGameSystems<T> {
    // ------ Game Actions ------
    fn start_game(ref self: T, adventurer_id: u64, weapon: u8);
    fn explore(ref self: T, adventurer_id: u64, till_beast: bool);
    fn attack(ref self: T, adventurer_id: u64, to_the_death: bool);
    fn flee(ref self: T, adventurer_id: u64, to_the_death: bool);
    fn equip(ref self: T, adventurer_id: u64, items: Array<u8>);
    fn drop(ref self: T, adventurer_id: u64, items: Array<u8>);
    fn buy_items(ref self: T, adventurer_id: u64, potions: u8, items: Array<ItemPurchase>);
    fn select_stat_upgrades(ref self: T, adventurer_id: u64, stat_upgrades: Stats);
}


#[dojo::contract]
mod game_systems {
    use core::panic_with_felt252;
    use death_mountain::constants::adventurer::{
        ITEM_MAX_GREATNESS, ITEM_XP_MULTIPLIER_BEASTS, ITEM_XP_MULTIPLIER_OBSTACLES, MAX_GREATNESS_STAT_BONUS,
        POTION_HEALTH_AMOUNT, STARTING_HEALTH, XP_FOR_DISCOVERIES,
    };
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier};
    use death_mountain::constants::discovery::DiscoveryEnums::{DiscoveryType, ExploreResult};
    use death_mountain::constants::game::{MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, STARTER_BEAST_ATTACK_DAMAGE, messages};
    use death_mountain::constants::loot::{SUFFIX_UNLOCK_GREATNESS};
    use death_mountain::constants::world::{DEFAULT_NS};

    use death_mountain::libs::game::{GameLibs, ImplGameLibs};
    use death_mountain::models::adventurer::adventurer::{Adventurer, IAdventurer, ImplAdventurer};
    use death_mountain::models::adventurer::bag::{Bag};
    use death_mountain::models::adventurer::equipment::{ImplEquipment};
    use death_mountain::models::adventurer::item::{ImplItem, Item};
    use death_mountain::models::adventurer::stats::{ImplStats, Stats};
    use death_mountain::models::beast::{Beast, IBeast};
    use death_mountain::models::combat::{CombatSpec, ImplCombat, SpecialPowers};
    use death_mountain::models::game::{AdventurerEntropy, AdventurerPacked, BagPacked, GameSettings, StatsMode};
    use death_mountain::models::game::{
        AttackEvent, BeastEvent, BuyItemsEvent, DefeatedBeastEvent, DiscoveryEvent, FledBeastEvent, GameEvent,
        GameEventDetails, ItemEvent, LevelUpEvent, MarketItemsEvent, ObstacleEvent, StatUpgradeEvent,
    };
    use death_mountain::models::market::{ImplMarket, ItemPurchase};
    use death_mountain::models::obstacle::{IObstacle, ImplObstacle};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait};
    use death_mountain::systems::beast::contracts::{IBeastSystemsDispatcherTrait};
    use death_mountain::systems::loot::contracts::{ILootSystemsDispatcherTrait};
    use death_mountain::utils::vrf::VRFImpl;

    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};

    use openzeppelin_token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use starknet::ContractAddress;
    use starknet::{get_tx_info};
    use super::VRF_ENABLED;
    use tournaments::components::libs::lifecycle::{LifecycleAssertionsImpl, LifecycleAssertionsTrait};
    use tournaments::components::models::game::TokenMetadata;

    // ------------------------------------------ //
    // ------------ Helper Functions ------------ //
    // ------------------------------------------ //

    fn _init_game_context(world: WorldStorage, adventurer_id: u64) -> (TokenMetadata, GameLibs) {
        _assert_token_ownership(world, adventurer_id);
        let token_metadata: TokenMetadata = world.read_model(adventurer_id);
        token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());
        let game_libs = ImplGameLibs::new(world);
        (token_metadata, game_libs)
    }

    fn _emit_lvl_events(
        ref world: WorldStorage,
        adventurer_id: u64,
        action_count: u16,
        level: u8,
        market_seed: u64,
        game_libs: GameLibs,
    ) {
        _emit_game_event(ref world, adventurer_id, action_count, GameEventDetails::level_up(LevelUpEvent { level }));
        _emit_game_event(
            ref world,
            adventurer_id,
            action_count,
            GameEventDetails::market_items(
                MarketItemsEvent { items: game_libs.adventurer.get_market(market_seed).span() },
            ),
        );
    }

    fn _emit_events(
        ref world: WorldStorage, adventurer_id: u64, action_count: u16, mut game_events: Array<GameEventDetails>,
    ) {
        while (game_events.len() > 0) {
            let event = game_events.pop_front().unwrap();
            _emit_game_event(ref world, adventurer_id, action_count, event);
        }
    }

    // ------------------------------------------ //
    // ------------ Impl ------------------------ //
    // ------------------------------------------ //
    #[abi(embed_v0)]
    impl GameSystemsImpl of super::IGameSystems<ContractState> {
        fn start_game(ref self: ContractState, adventurer_id: u64, weapon: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            _assert_token_ownership(world, adventurer_id);
            _assert_game_not_started(world, adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            let game_libs = ImplGameLibs::new(world);

            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            // assert provided weapon
            _assert_valid_starter_weapon(weapon, game_libs);

            if (game_settings.adventurer.xp == 0) {
                // generate a new adventurer using the provided started weapon
                let mut adventurer = ImplAdventurer::new(weapon);
                adventurer.increment_action_count();

                // spoof a beast ambush by deducting health from the adventurer
                adventurer.decrease_health(STARTER_BEAST_ATTACK_DAMAGE);

                let beast = game_libs.beast.get_starter_beast(game_libs.loot.get_type(weapon));
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::beast(
                        BeastEvent {
                            id: beast.id,
                            seed: adventurer_id,
                            health: beast.starting_health,
                            level: beast.combat_spec.level,
                            specials: beast.combat_spec.specials,
                        },
                    ),
                );

                _save_seed(ref world, adventurer_id, 0, adventurer_id);
                _emit_game_event(
                    ref world, adventurer_id, adventurer.action_count, GameEventDetails::adventurer(adventurer),
                );
                let packed = game_libs.adventurer.pack_adventurer(adventurer);
                world.write_model(@AdventurerPacked { adventurer_id, packed });
            } else {
                let mut adventurer = game_settings.adventurer;
                adventurer.increment_action_count();

                let (beast_seed, market_seed) = _get_random_seed(
                    adventurer_id,
                    adventurer.xp,
                    game_settings.game_seed,
                    game_settings.game_seed_until_xp,
                    game_settings.vrf_address,
                );

                _emit_lvl_events(
                    ref world, adventurer_id, adventurer.action_count, adventurer.get_level(), market_seed, game_libs,
                );

                if game_settings.in_battle {
                    let (beast, _, _) = _get_beast(ref adventurer, beast_seed, game_libs);
                    adventurer.beast_health = beast.starting_health;

                    // save seed to get correct beast
                    _save_seed(ref world, adventurer_id, 0, beast_seed);

                    // emit beast event
                    _emit_game_event(
                        ref world,
                        adventurer_id,
                        adventurer.action_count,
                        GameEventDetails::beast(
                            BeastEvent {
                                id: beast.id,
                                seed: beast_seed,
                                health: beast.starting_health,
                                level: beast.combat_spec.level,
                                specials: beast.combat_spec.specials,
                            },
                        ),
                    );
                }

                _save_seed(ref world, adventurer_id, market_seed, 0);
                _save_bag(ref world, adventurer_id, adventurer.action_count, game_settings.bag, game_libs);
                _save_adventurer(ref world, ref adventurer, game_settings.bag, adventurer_id, game_libs);
            }
        }

        fn explore(ref self: ContractState, adventurer_id: u64, till_beast: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (_, game_libs) = _init_game_context(world, adventurer_id);
            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();
            let orig_adv = adventurer.clone();
            _assert_not_dead(orig_adv);
            assert(orig_adv.stat_upgrades_available == 0, messages::STAT_UPGRADES_AVAILABLE);
            _assert_not_in_battle(orig_adv);
            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);
            let (explore_seed, market_seed) = _get_random_seed(
                adventurer_id,
                adventurer.xp,
                game_settings.game_seed,
                game_settings.game_seed_until_xp,
                game_settings.vrf_address,
            );

            // go explore
            _explore(
                ref world, ref adventurer, ref bag, adventurer_id, explore_seed, till_beast, game_libs, game_settings,
            );

            if bag.mutated {
                _save_bag(ref world, adventurer_id, adventurer.action_count, bag, game_libs);
            }

            if (orig_adv.get_level() < adventurer.get_level()) {
                _save_seed(ref world, adventurer_id, market_seed, 0);
                _emit_lvl_events(
                    ref world, adventurer_id, adventurer.action_count, adventurer.get_level(), market_seed, game_libs,
                );
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        fn attack(ref self: ContractState, adventurer_id: u64, to_the_death: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (_, game_libs) = _init_game_context(world, adventurer_id);

            let (mut adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            let orig_adv = adventurer.clone();

            _assert_not_dead(orig_adv);
            _assert_in_battle(orig_adv);

            // get weapon specials
            let weapon_specials = game_libs
                .loot
                .get_specials(
                    adventurer.equipment.weapon.id,
                    adventurer.equipment.weapon.get_greatness(),
                    adventurer.item_specials_seed,
                );

            // get previous entropy to fetch correct beast
            let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);

            // get beast
            let (beast, beast_seed, beast_level_rnd) = _get_beast(
                ref adventurer, adventurer_entropy.beast_seed, game_libs,
            );

            // get weapon details
            let weapon = game_libs.loot.get_item(adventurer.equipment.weapon.id);
            let weapon_combat_spec = CombatSpec {
                tier: weapon.tier,
                item_type: weapon.item_type,
                level: adventurer.equipment.weapon.get_greatness().into(),
                specials: weapon_specials,
            };

            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            let (level_seed, market_seed) = _get_random_seed(
                adventurer_id,
                adventurer.xp,
                game_settings.game_seed,
                game_settings.game_seed_until_xp,
                game_settings.vrf_address,
            );

            let mut game_events: Array<GameEventDetails> = array![];
            let mut battle_count = adventurer.action_count;
            _attack(
                ref adventurer,
                ref game_events,
                ref battle_count,
                weapon_combat_spec,
                level_seed,
                beast,
                beast_seed,
                to_the_death,
                beast_level_rnd,
                game_libs,
                game_settings,
            );

            _emit_events(ref world, adventurer_id, adventurer.action_count, game_events);

            if (orig_adv.get_level() < adventurer.get_level()) {
                _save_seed(ref world, adventurer_id, market_seed, 0);
                _emit_lvl_events(
                    ref world, adventurer_id, adventurer.action_count, adventurer.get_level(), market_seed, game_libs,
                );
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        fn flee(ref self: ContractState, adventurer_id: u64, to_the_death: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (_, game_libs) = _init_game_context(world, adventurer_id);

            let (mut adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            let orig_adv = adventurer.clone();

            _assert_not_dead(orig_adv);
            _assert_in_battle(orig_adv);
            _assert_not_starter_beast(orig_adv, messages::CANT_FLEE_STARTER_BEAST);
            assert(orig_adv.stats.dexterity != 0, messages::ZERO_DEXTERITY);

            // get previous entropy to fetch correct beast
            let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);

            // get beast
            let (beast, beast_seed, _) = _get_beast(ref adventurer, adventurer_entropy.beast_seed, game_libs);

            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            let (flee_seed, market_seed) = _get_random_seed(
                adventurer_id,
                adventurer.xp,
                game_settings.game_seed,
                game_settings.game_seed_until_xp,
                game_settings.vrf_address,
            );

            // attempt to flee
            let mut game_events: Array<GameEventDetails> = array![];
            let mut battle_count = adventurer.action_count;
            _flee(
                ref adventurer,
                ref game_events,
                ref battle_count,
                flee_seed,
                beast_seed,
                beast,
                to_the_death,
                game_libs,
                game_settings,
            );

            _emit_events(ref world, adventurer_id, adventurer.action_count, game_events);

            if (orig_adv.get_level() < adventurer.get_level()) {
                _save_seed(ref world, adventurer_id, market_seed, 0);
                _emit_lvl_events(
                    ref world, adventurer_id, adventurer.action_count, adventurer.get_level(), market_seed, game_libs,
                );
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        fn equip(ref self: ContractState, adventurer_id: u64, items: Array<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (_, game_libs) = _init_game_context(world, adventurer_id);

            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            _assert_not_dead(adventurer);
            assert(items.len() != 0, messages::NO_ITEMS);
            assert(items.len() <= 8, messages::TOO_MANY_ITEMS);

            // equip items
            _equip_items(ref adventurer, ref bag, items.clone(), false, game_libs);

            // if the adventurer is equipping an item during battle, the beast will counter attack
            if (adventurer.in_battle()) {
                // get previous entropy to fetch correct beast
                let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);

                // get beast
                let (beast, beast_seed, _) = _get_beast(ref adventurer, adventurer_entropy.beast_seed, game_libs);

                let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

                let (seed, _) = _get_random_seed(
                    adventurer_id,
                    adventurer.xp,
                    game_settings.game_seed,
                    game_settings.game_seed_until_xp,
                    game_settings.vrf_address,
                );

                // get randomness for combat
                let (_, _, beast_crit_hit_rnd, attack_location_rnd) = game_libs
                    .adventurer
                    .get_battle_randomness(adventurer.xp, 0, seed);

                // process beast attack
                let beast_attack_details = _beast_attack(
                    ref adventurer,
                    beast,
                    beast_seed,
                    beast_crit_hit_rnd,
                    attack_location_rnd,
                    false,
                    game_libs,
                    game_settings,
                );

                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::beast_attack(beast_attack_details),
                );
            }

            _emit_game_event(
                ref world,
                adventurer_id,
                adventurer.action_count,
                GameEventDetails::equip(ItemEvent { items: items.span() }),
            );

            // if the bag was mutated, pack and save it
            if bag.mutated {
                _save_bag(ref world, adventurer_id, adventurer.action_count, bag, game_libs);
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        fn drop(ref self: ContractState, adventurer_id: u64, items: Array<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (_, game_libs) = _init_game_context(world, adventurer_id);

            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            // assert action is valid (ownership of item is handled in internal function when we
            // iterate over items)
            _assert_not_dead(adventurer);
            assert(items.len() != 0, messages::NO_ITEMS);
            _assert_not_starter_beast(adventurer, messages::CANT_DROP_DURING_STARTER_BEAST);

            // drop items
            _drop(ref adventurer, ref bag, items.clone(), game_libs);

            _emit_game_event(
                ref world,
                adventurer_id,
                adventurer.action_count,
                GameEventDetails::drop(ItemEvent { items: items.span() }),
            );

            // if the bag was mutated, save it
            if bag.mutated {
                _save_bag(ref world, adventurer_id, adventurer.action_count, bag, game_libs);
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        fn buy_items(ref self: ContractState, adventurer_id: u64, potions: u8, items: Array<ItemPurchase>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (_, game_libs) = _init_game_context(world, adventurer_id);

            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            _assert_not_dead(adventurer);
            _assert_not_in_battle(adventurer);
            assert(adventurer.stat_upgrades_available == 0, messages::MARKET_CLOSED);

            // if the player is buying items, process purchases
            let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
            if (items.len() != 0) {
                _buy_items(adventurer_entropy.market_seed, ref adventurer, ref bag, items.clone(), game_libs);
            }

            // if the player is buying potions as part of the upgrade, process purchase
            // @dev process potion purchase after items in case item purchases changes item stat
            // boosts
            if potions != 0 {
                let cost = adventurer.charisma_adjusted_potion_price() * potions.into();
                let health = POTION_HEALTH_AMOUNT.into() * potions.into();
                _assert_has_enough_gold(adventurer, cost);
                _assert_not_buying_excess_health(adventurer, health);
                adventurer.deduct_gold(cost);
                adventurer.increase_health(health);
            }

            if bag.mutated {
                _save_bag(ref world, adventurer_id, adventurer.action_count, bag, game_libs);
            }

            _emit_game_event(
                ref world,
                adventurer_id,
                adventurer.action_count,
                GameEventDetails::buy_items(BuyItemsEvent { potions: potions, items_purchased: items.span() }),
            );

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        fn select_stat_upgrades(ref self: ContractState, adventurer_id: u64, stat_upgrades: Stats) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (_, game_libs) = _init_game_context(world, adventurer_id);

            let (mut adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            let orig_adv = adventurer.clone();

            _assert_not_dead(orig_adv);
            _assert_not_in_battle(orig_adv);
            _assert_valid_stat_selection(orig_adv, stat_upgrades);

            // reset stat upgrades available
            adventurer.stat_upgrades_available = 0;

            // upgrade adventurer's stats
            adventurer.stats.apply_stats(stat_upgrades);

            // if adventurer upgraded vitality
            if stat_upgrades.vitality != 0 {
                // apply health boost
                adventurer.apply_vitality_health_boost(stat_upgrades.vitality);
            }

            _emit_game_event(
                ref world,
                adventurer_id,
                adventurer.action_count,
                GameEventDetails::stat_upgrade(StatUpgradeEvent { stats: stat_upgrades }),
            );

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }
    }

    fn reveal_starting_stats(ref adventurer: Adventurer, seed: u64, game_libs: GameLibs) {
        // reveal and apply starting stats
        adventurer.stats = game_libs.adventurer.generate_starting_stats(seed);

        // increase adventurer's health for any vitality they received
        adventurer.health += adventurer.stats.get_max_health() - STARTING_HEALTH.into();
    }

    fn _get_beast(ref adventurer: Adventurer, beast_seed: u64, game_libs: GameLibs) -> (Beast, u32, u16) {
        // generate xp based randomness seeds
        let (beast_seed, _, beast_health_rnd, beast_level_rnd, beast_specials1_rnd, beast_specials2_rnd, _, _) =
            game_libs
            .adventurer
            .get_randomness(adventurer.xp, beast_seed);

        // get beast based on entropy seeds
        let beast = game_libs
            .beast
            .get_beast(
                adventurer.get_level(),
                game_libs.loot.get_type(adventurer.equipment.weapon.id),
                beast_seed,
                beast_health_rnd,
                beast_level_rnd,
                beast_specials1_rnd,
                beast_specials2_rnd,
            );

        (beast, beast_seed, beast_level_rnd)
    }

    fn _process_beast_death(
        ref adventurer: Adventurer,
        ref game_events: Array<GameEventDetails>,
        beast: Beast,
        beast_seed: u32,
        damage_dealt: u16,
        critical_hit: bool,
        item_specials_rnd: u16,
        level_seed: u64,
        game_libs: GameLibs,
    ) {
        // zero out beast health
        adventurer.beast_health = 0;

        // get gold reward and increase adventurers gold
        let gold_earned = beast.get_gold_reward();
        let ring_bonus = adventurer.equipment.ring.jewelry_gold_bonus(gold_earned);
        adventurer.increase_gold(gold_earned + ring_bonus);

        // get xp reward and increase adventurers xp
        let xp_earned_adventurer = beast.get_xp_reward(adventurer.get_level());
        let (previous_level, new_level) = adventurer.increase_adventurer_xp(xp_earned_adventurer);

        // items use adventurer xp with an item multplier so they level faster than Adventurer
        let xp_earned_items = xp_earned_adventurer * ITEM_XP_MULTIPLIER_BEASTS.into();
        // assigning xp to items is more complex so we delegate to an internal function
        _grant_xp_to_equipped_items(ref adventurer, xp_earned_items, item_specials_rnd, game_libs);

        // Reveal starting stats if adventurer is on level 1
        if (previous_level == 1 && new_level == 2) {
            reveal_starting_stats(ref adventurer, level_seed, game_libs);
        }

        game_events
            .append(
                GameEventDetails::defeated_beast(
                    DefeatedBeastEvent {
                        beast_id: beast.id, gold_reward: gold_earned + ring_bonus, xp_reward: xp_earned_adventurer,
                    },
                ),
            );
        // // if beast beast level is above collectible threshold
    // if beast.combat_spec.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK.into() && _network_supports_vrf() {
    //     // mint beast to owner of the adventurer or controller delegate if set
    //     _mint_beast(@self, beast, get_caller_address());
    // }
    }

    // fn _mint_beast(self: @ContractState, beast: Beast, to_address: ContractAddress) {
    //     let beasts_dispatcher = self._beasts_dispatcher.read();

    //     let is_beast_minted = beasts_dispatcher
    //         .isMinted(beast.id, beast.combat_spec.specials.special2, beast.combat_spec.specials.special3);

    //     let beasts_minter = beasts_dispatcher.getMinter();

    //     if !is_beast_minted && beasts_minter == starknet::get_contract_address() {
    //         beasts_dispatcher
    //             .mint(
    //                 to_address,
    //                 beast.id,
    //                 beast.combat_spec.specials.special2,
    //                 beast.combat_spec.specials.special3,
    //                 beast.combat_spec.level,
    //                 beast.starting_health,
    //             );
    //     }
    // }

    fn _get_game_settings(world: WorldStorage, game_id: u64) -> GameSettings {
        let token_metadata: TokenMetadata = world.read_model(game_id);
        let game_settings: GameSettings = world.read_model(token_metadata.settings_id);
        game_settings
    }

    fn _explore(
        ref world: WorldStorage,
        ref adventurer: Adventurer,
        ref bag: Bag,
        adventurer_id: u64,
        explore_seed: u64,
        explore_till_beast: bool,
        game_libs: GameLibs,
        game_settings: GameSettings,
    ) {
        let (rnd1_u32, _, rnd3_u16, rnd4_u16, rnd5_u8, rnd6_u8, rnd7_u8, explore_rnd) = game_libs
            .adventurer
            .get_randomness(adventurer.xp, explore_seed);

        // go exploring
        let explore_result = ImplAdventurer::get_random_explore(explore_rnd);
        match explore_result {
            ExploreResult::Beast(()) => {
                let (beast, ambush_event) = _beast_encounter(
                    ref adventurer,
                    seed: rnd1_u32,
                    health_rnd: rnd3_u16,
                    level_rnd: rnd4_u16,
                    dmg_location_rnd: rnd5_u8,
                    crit_hit_rnd: rnd6_u8,
                    ambush_rnd: rnd7_u8,
                    specials1_rnd: rnd5_u8, // use same entropy for crit hit, initial attack location, and beast specials
                    specials2_rnd: rnd6_u8, // to create some fun organic lore for the beast special names
                    game_libs: game_libs,
                    game_settings: game_settings,
                );

                // save seed to get correct beast
                _save_seed(ref world, adventurer_id, 0, explore_seed);

                // emit beast event
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::beast(
                        BeastEvent {
                            id: beast.id,
                            seed: explore_seed,
                            health: beast.starting_health,
                            level: beast.combat_spec.level,
                            specials: beast.combat_spec.specials,
                        },
                    ),
                );

                // emit ambush event
                if (ambush_event.damage > 0) {
                    _emit_game_event(
                        ref world, adventurer_id, adventurer.action_count, GameEventDetails::ambush(ambush_event),
                    );
                }
            },
            ExploreResult::Obstacle(()) => {
                let obstacle_event = _obstacle_encounter(
                    ref adventurer,
                    seed: rnd1_u32,
                    level_rnd: rnd4_u16,
                    dmg_location_rnd: rnd5_u8,
                    crit_hit_rnd: rnd6_u8,
                    dodge_rnd: rnd7_u8,
                    item_specials_rnd: rnd3_u16,
                    game_libs: game_libs,
                    game_settings: game_settings,
                );
                _emit_game_event(
                    ref world, adventurer_id, adventurer.action_count, GameEventDetails::obstacle(obstacle_event),
                );
            },
            ExploreResult::Discovery(()) => {
                let discovery_event = _process_discovery(
                    ref adventurer,
                    ref bag,
                    discovery_type_rnd: rnd5_u8,
                    amount_rnd1: rnd6_u8,
                    amount_rnd2: rnd7_u8,
                    game_libs: game_libs,
                );
                _emit_game_event(
                    ref world, adventurer_id, adventurer.action_count, GameEventDetails::discovery(discovery_event),
                );
            },
        }

        // if explore_till_beast is true and adventurer can still explore
        if explore_till_beast && adventurer.can_explore() {
            // Keep exploring
            _explore(
                ref world,
                ref adventurer,
                ref bag,
                adventurer_id,
                explore_seed,
                explore_till_beast,
                game_libs,
                game_settings,
            );
        }
    }

    fn _process_discovery(
        ref adventurer: Adventurer,
        ref bag: Bag,
        discovery_type_rnd: u8,
        amount_rnd1: u8,
        amount_rnd2: u8,
        game_libs: GameLibs,
    ) -> DiscoveryEvent {
        // get discovery type
        let discovery_type = game_libs
            .adventurer
            .get_discovery(adventurer.get_level(), discovery_type_rnd, amount_rnd1, amount_rnd2);

        // Grant adventurer XP to progress entropy
        adventurer.increase_adventurer_xp(XP_FOR_DISCOVERIES.into());

        // handle discovery type
        match discovery_type {
            DiscoveryType::Gold(amount) => { adventurer.increase_gold(amount); },
            DiscoveryType::Health(amount) => { adventurer.increase_health(amount); },
            DiscoveryType::Loot(item_id) => {
                let (item_in_bag, _) = game_libs.adventurer.bag_contains(bag, item_id);

                let slot = game_libs.loot.get_slot(item_id);
                let slot_free = adventurer.equipment.is_slot_free_item_id(item_id, slot);

                // if the bag is full and the slot is not free
                let inventory_full = game_libs.adventurer.is_bag_full(bag) && slot_free == false;

                // if item is in adventurers bag, is equipped or inventory is full
                if item_in_bag || adventurer.equipment.is_equipped(item_id) || inventory_full {
                    // we replace item discovery with gold based on market value of the item
                    let mut amount = 0;
                    match game_libs.loot.get_tier(item_id) {
                        Tier::None(()) => panic_with_felt252('found invalid item'),
                        Tier::T1(()) => amount = 20,
                        Tier::T2(()) => amount = 16,
                        Tier::T3(()) => amount = 12,
                        Tier::T4(()) => amount = 8,
                        Tier::T5(()) => amount = 4,
                    }
                    adventurer.increase_gold(amount);
                    // if the item is not already owned or equipped and the adventurer has space for it
                } else {
                    let item = ImplItem::new(item_id);
                    if slot_free {
                        // equip the item
                        let slot = game_libs.loot.get_slot(item.id);
                        adventurer.equipment.equip(item, slot);
                    } else {
                        // otherwise toss it in bag
                        bag = game_libs.adventurer.add_item_to_bag(bag, item);
                    }
                }
            },
        }

        DiscoveryEvent { discovery_type, xp_reward: XP_FOR_DISCOVERIES.into() }
    }

    fn _beast_encounter(
        ref adventurer: Adventurer,
        seed: u32,
        health_rnd: u16,
        level_rnd: u16,
        dmg_location_rnd: u8,
        crit_hit_rnd: u8,
        ambush_rnd: u8,
        specials1_rnd: u8,
        specials2_rnd: u8,
        game_libs: GameLibs,
        game_settings: GameSettings,
    ) -> (Beast, AttackEvent) {
        let adventurer_level = adventurer.get_level();

        let beast = game_libs
            .beast
            .get_beast(
                adventurer.get_level(),
                game_libs.loot.get_type(adventurer.equipment.weapon.id),
                seed,
                health_rnd,
                level_rnd,
                specials1_rnd,
                specials2_rnd,
            );

        // init beast health on adventurer
        // @dev: this is only info about beast that we store onchain
        adventurer.beast_health = beast.starting_health;

        // check if beast ambushed adventurer
        let is_ambush = if game_settings.stats_mode == StatsMode::Dodge {
            ImplAdventurer::is_ambushed(adventurer_level, adventurer.stats.wisdom, ambush_rnd)
        } else {
            true
        };

        // if adventurer was ambushed
        let mut beast_attack_details = AttackEvent { damage: 0, location: Slot::None, critical_hit: false };
        if (is_ambush) {
            // process beast attack
            beast_attack_details =
                _beast_attack(
                    ref adventurer, beast, seed, crit_hit_rnd, dmg_location_rnd, is_ambush, game_libs, game_settings,
                );
        }

        (beast, beast_attack_details)
    }

    fn _obstacle_encounter(
        ref adventurer: Adventurer,
        seed: u32,
        level_rnd: u16,
        dmg_location_rnd: u8,
        crit_hit_rnd: u8,
        dodge_rnd: u8,
        item_specials_rnd: u16,
        game_libs: GameLibs,
        game_settings: GameSettings,
    ) -> ObstacleEvent {
        // get adventurer's level
        let adventurer_level = adventurer.get_level();

        // get random obstacle
        let obstacle = ImplAdventurer::get_random_obstacle(adventurer_level, seed, level_rnd);

        // get a random attack location for the obstacle
        let damage_slot = ImplAdventurer::get_attack_location(dmg_location_rnd);

        // get armor at the location being attacked
        let armor = adventurer.equipment.get_item_at_slot(damage_slot);
        let armor_details = game_libs.loot.get_item(armor.id);

        // get damage from obstalce
        let (combat_result, _) = adventurer.get_obstacle_damage(obstacle, armor, armor_details, crit_hit_rnd);

        // pull damage taken out of combat result for easy access
        let mut damage_taken = combat_result.total_damage;
        damage_taken = damage_taken * (100 - game_settings.base_damage_reduction).into() / 100;

        // get base xp reward for obstacle
        let base_reward = obstacle.get_xp_reward(adventurer_level);

        // get item xp reward for obstacle
        let item_xp_reward = base_reward * ITEM_XP_MULTIPLIER_OBSTACLES.into();

        // attempt to dodge obstacle
        let dodged = if game_settings.stats_mode == StatsMode::Dodge {
            ImplCombat::ability_based_avoid_threat(adventurer_level, adventurer.stats.intelligence, dodge_rnd)
        } else {
            false
        };

        if (game_settings.stats_mode == StatsMode::Reduction) {
            let damage_reduction = ImplCombat::ability_based_damage_reduction(
                adventurer_level, adventurer.stats.intelligence,
            );
            damage_taken = damage_taken * (100 - damage_reduction).into() / 100;
        }

        // create obstacle details for event
        let obstacle_details = ObstacleEvent {
            obstacle_id: obstacle.id,
            dodged,
            damage: damage_taken,
            location: damage_slot,
            critical_hit: combat_result.critical_hit_bonus > 0,
            xp_reward: base_reward,
        };

        // if adventurer did not dodge obstacle
        if (!dodged && damage_taken > 0) {
            // adventurer takes damage
            adventurer.decrease_health(damage_taken);
        }

        if (adventurer.health != 0) {
            // grant adventurer xp and get previous and new level
            adventurer.increase_adventurer_xp(base_reward);

            // grant items xp and get array of items that leveled up
            _grant_xp_to_equipped_items(ref adventurer, item_xp_reward, item_specials_rnd, game_libs);
        }

        obstacle_details
    }

    // @notice Grants XP to items currently equipped by an adventurer, and processes any level
    // ups.//
    // @dev This function does three main things:
    //   1. Iterates through each of the equipped items for the given adventurer.
    //   2. Increases the XP for the equipped item. If the item levels up, it processes the level up
    //   and updates the item.
    //   3. If any items have leveled up, emits an `ItemsLeveledUp` event.//
    // @param adventurer Reference to the adventurer's state.
    // @param xp_amount Amount of XP to grant to each equipped item.
    // @return Array of items that leveled up.
    fn _grant_xp_to_equipped_items(
        ref adventurer: Adventurer, xp_amount: u16, item_specials_rnd: u16, game_libs: GameLibs,
    ) {
        let equipped_items = adventurer.get_equipped_items();
        let mut item_index: u32 = 0;
        loop {
            if item_index == equipped_items.len() {
                break;
            }
            // get item
            let item = *equipped_items.at(item_index);

            // get item slot
            let item_slot = game_libs.loot.get_slot(item.id);

            // increase item xp and record previous and new level
            let (previous_level, new_level) = adventurer.equipment.increase_item_xp_at_slot(item_slot, xp_amount);

            // if item leveled up
            if new_level > previous_level {
                // process level up
                _process_item_level_up(
                    ref adventurer,
                    adventurer.equipment.get_item_at_slot(item_slot),
                    previous_level,
                    new_level,
                    item_specials_rnd,
                    game_libs,
                );
            }

            item_index += 1;
        };
    }

    fn _process_item_level_up(
        ref adventurer: Adventurer,
        item: Item,
        previous_level: u8,
        new_level: u8,
        item_specials_rnd: u16,
        game_libs: GameLibs,
    ) {
        // if item reached max greatness level
        if (new_level == ITEM_MAX_GREATNESS) {
            // adventurer receives a bonus stat upgrade point
            adventurer.increase_stat_upgrades_available(MAX_GREATNESS_STAT_BONUS);
        }

        // check if item unlocked specials as part of level up
        let (suffix_unlocked, prefixes_unlocked) = ImplAdventurer::unlocked_specials(previous_level, new_level);

        // get item specials seed
        let item_specials_seed = adventurer.item_specials_seed;
        let specials = if item_specials_seed != 0 {
            game_libs.loot.get_specials(item.id, item.get_greatness(), item_specials_seed)
        } else {
            SpecialPowers { special1: 0, special2: 0, special3: 0 }
        };

        // if specials were unlocked
        if (suffix_unlocked || prefixes_unlocked) {
            // check if we already have the vrf seed for the item specials
            if item_specials_seed != 0 {
                // if suffix was unlocked, apply stat boosts for suffix special to adventurer
                if suffix_unlocked {
                    // apply stat boosts for suffix special to adventurer
                    adventurer.stats.apply_suffix_boost(specials.special1);
                    adventurer.stats.apply_bag_boost(specials.special1);

                    // apply health boost for any vitality gained (one time event)
                    adventurer.apply_health_boost_from_vitality_unlock(specials);
                }
            } else {
                adventurer.item_specials_seed = item_specials_rnd;

                // get specials for the item
                let specials = game_libs
                    .loot
                    .get_specials(item.id, item.get_greatness(), adventurer.item_specials_seed);

                // if suffix was unlocked, apply stat boosts for suffix special to
                // adventurer
                if suffix_unlocked {
                    // apply stat boosts for suffix special to adventurer
                    adventurer.stats.apply_suffix_boost(specials.special1);
                    adventurer.stats.apply_bag_boost(specials.special1);

                    // apply health boost for any vitality gained (one time event)
                    adventurer.apply_health_boost_from_vitality_unlock(specials);
                }
            }
        }
    }


    fn _attack(
        ref adventurer: Adventurer,
        ref game_events: Array<GameEventDetails>,
        ref battle_count: u16,
        weapon_combat_spec: CombatSpec,
        level_seed: u64,
        beast: Beast,
        beast_seed: u32,
        fight_to_the_death: bool,
        item_specials_seed: u16,
        game_libs: GameLibs,
        game_settings: GameSettings,
    ) {
        battle_count = ImplAdventurer::increment_battle_action_count(battle_count);

        // get randomness for combat
        let (_, adventurer_crit_hit_rnd, beast_crit_hit_rnd, attack_location_rnd) = game_libs
            .adventurer
            .get_battle_randomness(adventurer.xp, battle_count, level_seed);

        // attack beast and get combat result that provides damage breakdown
        let combat_result = adventurer.attack(weapon_combat_spec, beast, adventurer_crit_hit_rnd);

        // provide critical hit as a boolean for events
        let is_critical_hit = combat_result.critical_hit_bonus > 0;

        game_events
            .append(
                GameEventDetails::attack(
                    AttackEvent {
                        damage: combat_result.total_damage, location: Slot::None, critical_hit: is_critical_hit,
                    },
                ),
            );

        // if the damage dealt exceeds the beasts health
        if (combat_result.total_damage >= adventurer.beast_health) {
            // process beast death
            _process_beast_death(
                ref adventurer,
                ref game_events,
                beast,
                beast_seed,
                combat_result.total_damage,
                is_critical_hit,
                item_specials_seed,
                level_seed,
                game_libs,
            );
        } else {
            // if beast survived the attack, deduct damage dealt
            adventurer.beast_health -= combat_result.total_damage;

            // process beast counter attack
            let _beast_attack_details = _beast_attack(
                ref adventurer,
                beast,
                beast_seed,
                beast_crit_hit_rnd,
                attack_location_rnd,
                false,
                game_libs,
                game_settings,
            );

            game_events.append(GameEventDetails::beast_attack(_beast_attack_details));

            // if adventurer is dead
            if (adventurer.health == 0) {
                return;
            }

            // if the adventurer is still alive and fighting to the death
            if fight_to_the_death {
                // attack again
                _attack(
                    ref adventurer,
                    ref game_events,
                    ref battle_count,
                    weapon_combat_spec,
                    level_seed,
                    beast,
                    beast_seed,
                    true,
                    item_specials_seed,
                    game_libs,
                    game_settings,
                );
            }
        }
    }

    fn _beast_attack(
        ref adventurer: Adventurer,
        beast: Beast,
        beast_seed: u32,
        critical_hit_rnd: u8,
        attack_location_rnd: u8,
        is_ambush: bool,
        game_libs: GameLibs,
        game_settings: GameSettings,
    ) -> AttackEvent {
        // beasts attack random location on adventurer
        let attack_location = ImplAdventurer::get_attack_location(attack_location_rnd);

        // get armor at attack location
        let armor = adventurer.equipment.get_item_at_slot(attack_location);

        // get armor specials
        let armor_specials = game_libs
            .loot
            .get_specials(armor.id, armor.get_greatness(), adventurer.item_specials_seed);
        let armor_details = game_libs.loot.get_item(armor.id);

        // get critical hit chance
        let critical_hit_chance = game_libs.beast.get_critical_hit_chance(adventurer.get_level(), is_ambush);

        // process beast attack
        let (combat_result, _jewlery_armor_bonus) = adventurer
            .defend(beast, armor, armor_specials, armor_details, critical_hit_rnd, critical_hit_chance);
        let mut damage_taken = combat_result.total_damage;

        // apply base damage reduction to ambush attacks
        if is_ambush {
            damage_taken = damage_taken * (100 - game_settings.base_damage_reduction).into() / 100;
        }

        if is_ambush && game_settings.stats_mode == StatsMode::Reduction {
            let damage_reduction = ImplCombat::ability_based_damage_reduction(
                adventurer.get_level(), adventurer.stats.wisdom,
            );
            damage_taken = damage_taken * (100 - damage_reduction).into() / 100;
        }

        // deduct damage taken from adventurer's health
        adventurer.decrease_health(damage_taken);

        AttackEvent {
            damage: damage_taken, location: attack_location, critical_hit: combat_result.critical_hit_bonus > 0,
        }
    }

    fn _flee(
        ref adventurer: Adventurer,
        ref game_events: Array<GameEventDetails>,
        ref battle_count: u16,
        flee_seed: u64,
        beast_seed: u32,
        beast: Beast,
        flee_to_the_death: bool,
        game_libs: GameLibs,
        game_settings: GameSettings,
    ) {
        battle_count = ImplAdventurer::increment_battle_action_count(battle_count);

        // get randomness for flee and ambush
        let (flee_rnd, _, beast_crit_hit_rnd, attack_location_rnd) = game_libs
            .adventurer
            .get_battle_randomness(adventurer.xp, battle_count, flee_seed);

        // attempt to flee
        let fled = game_libs.beast.attempt_flee(adventurer.get_level(), adventurer.stats.dexterity, flee_rnd);

        // if adventurer fled
        if (fled) {
            // set beast health to zero to denote adventurer is no longer in battle
            adventurer.beast_health = 0;

            // increment adventurer xp by one to change adventurer entropy state
            adventurer.increase_adventurer_xp(1);

            // Save battle events
            game_events.append(GameEventDetails::flee(true));
            game_events.append(GameEventDetails::fled_beast(FledBeastEvent { beast_id: beast.id, xp_reward: 1 }));
        } else {
            // if the flee attempt failed, beast counter attacks
            let _beast_attack_details = _beast_attack(
                ref adventurer,
                beast,
                beast_seed,
                beast_crit_hit_rnd,
                attack_location_rnd,
                false,
                game_libs,
                game_settings,
            );

            // Save battle events
            game_events.append(GameEventDetails::flee(false));
            game_events.append(GameEventDetails::beast_attack(_beast_attack_details));

            // if player is still alive and elected to flee till death
            if (flee_to_the_death && adventurer.health != 0) {
                // reattempt flee
                _flee(
                    ref adventurer,
                    ref game_events,
                    ref battle_count,
                    flee_seed,
                    beast_seed,
                    beast,
                    true,
                    game_libs,
                    game_settings,
                );
            }
        }
    }

    fn _equip_item(ref adventurer: Adventurer, ref bag: Bag, item: Item, game_libs: GameLibs) -> u8 {
        // get the item currently equipped to the slot the item is being equipped to
        let unequipping_item = adventurer.equipment.get_item_at_slot(game_libs.loot.get_slot(item.id));

        // if the item exists
        if unequipping_item.id != 0 {
            // put it into the adventurer's bag
            bag = game_libs.adventurer.add_item_to_bag(bag, unequipping_item);

            // if the item was providing a stat boosts, remove it
            if unequipping_item.get_greatness() >= SUFFIX_UNLOCK_GREATNESS {
                let item_suffix = game_libs.loot.get_suffix(unequipping_item.id, adventurer.item_specials_seed);
                adventurer.stats.remove_suffix_boost(item_suffix);
            }
        }

        // equip item
        let slot = game_libs.loot.get_slot(item.id);
        adventurer.equipment.equip(item, slot);

        // if item being equipped has stat boosts unlocked, apply it to adventurer
        if item.get_greatness() >= SUFFIX_UNLOCK_GREATNESS {
            _apply_item_stat_boost(ref adventurer, item, game_libs);
        }

        // return the item being unequipped for events
        unequipping_item.id
    }

    fn _equip_items(
        ref adventurer: Adventurer,
        ref bag: Bag,
        items_to_equip: Array<u8>,
        is_newly_purchased: bool,
        game_libs: GameLibs,
    ) {
        // get a clone of our items to equip to keep ownership for event
        let _equipped_items = items_to_equip.clone();

        // for each item we need to equip
        let mut i: u32 = 0;
        loop {
            if i == items_to_equip.len() {
                break ();
            }

            // get the item id
            let item_id = *items_to_equip.at(i);

            // assume we won't need to unequip an item to equip new one
            let mut unequipped_item_id: u8 = 0;

            // if item is newly purchased
            if is_newly_purchased {
                // assert adventurer does not already own the item
                _assert_item_not_owned(adventurer, bag, item_id.clone(), game_libs);

                // create new item, equip it, and record if we need unequipped an item
                let mut new_item = ImplItem::new(item_id);
                unequipped_item_id = _equip_item(ref adventurer, ref bag, new_item, game_libs);
            } else {
                // otherwise item is being equipped from bag
                // so remove it from bag, equip it, and record if we need to unequip an item
                let (new_bag, item) = game_libs.adventurer.remove_item_from_bag(bag, item_id);
                bag = new_bag;
                unequipped_item_id = _equip_item(ref adventurer, ref bag, item, game_libs);
            }

            i += 1;
        };
    }

    fn _drop(ref adventurer: Adventurer, ref bag: Bag, items: Array<u8>, game_libs: GameLibs) {
        // for each item
        let mut i: u32 = 0;
        loop {
            if i == items.len() {
                break ();
            }

            // init a blank item to use for dropped item storage
            let mut item = ImplItem::new(0);

            // get item id
            let item_id = *items.at(i);

            // if item is equipped
            if adventurer.equipment.is_equipped(item_id) {
                // get it from adventurer equipment
                item = adventurer.equipment.get_item(item_id);

                // if the item was providing a stat boosts
                if item.get_greatness() >= SUFFIX_UNLOCK_GREATNESS {
                    // remove it
                    let item_suffix = game_libs.loot.get_suffix(item.id, adventurer.item_specials_seed);
                    adventurer.stats.remove_suffix_boost(item_suffix);
                    adventurer.stats.remove_bag_boost(item_suffix);
                    let max_health = adventurer.stats.get_max_health();
                    if adventurer.health > max_health {
                        adventurer.health = max_health;
                    }
                }

                // drop the item
                adventurer.equipment.drop(item_id);
            } else {
                // if item is not equipped, it must be in the bag
                // but we double check and panic just in case
                let (item_in_bag, _) = game_libs.adventurer.bag_contains(bag, item_id);
                if item_in_bag {
                    // get item from the bag
                    item = game_libs.adventurer.get_bag_item(bag, item_id);

                    // remove item from the bag (sets mutated to true)
                    let (new_bag, _) = game_libs.adventurer.remove_item_from_bag(bag, item_id);
                    bag = new_bag;
                } else {
                    panic_with_felt252('Item not owned by adventurer');
                }
            }

            i += 1;
        };
    }

    fn _buy_items(
        market_seed: u64,
        ref adventurer: Adventurer,
        ref bag: Bag,
        items_to_purchase: Array<ItemPurchase>,
        game_libs: GameLibs,
    ) {
        // get adventurer entropy
        let market_inventory = game_libs.adventurer.get_market(market_seed);

        // mutable array for returning items that need to be equipped as part of this purchase
        let mut items_to_equip = ArrayTrait::<u8>::new();

        let mut item_number: u32 = 0;
        loop {
            if item_number == items_to_purchase.len() {
                break ();
            }

            // get the item
            let item = *items_to_purchase.at(item_number);

            // get a mutable reference to the inventory
            let mut inventory = market_inventory.span();

            // assert item is available on market
            assert(ImplMarket::is_item_available(ref inventory, item.item_id), messages::ITEM_DOES_NOT_EXIST);

            // buy it and store result in our purchases array for event
            _buy_item(ref adventurer, ref bag, item.item_id, game_libs);

            // if item is being equipped as part of the purchase
            if item.equip {
                // add it to our array of items to equip
                items_to_equip.append(item.item_id);
            } else {
                // if it's not being equipped, just add it to bag
                bag = game_libs.adventurer.add_new_item_to_bag(bag, item.item_id);
            }

            // increment counter
            item_number += 1;
        };

        // if we have items to equip as part of the purchase
        if (items_to_equip.len() != 0) {
            // equip them and record the items that were unequipped
            _equip_items(ref adventurer, ref bag, items_to_equip.clone(), true, game_libs);
        }
    }


    fn _buy_item(ref adventurer: Adventurer, ref bag: Bag, item_id: u8, game_libs: GameLibs) {
        // create an immutable copy of our adventurer to use for validation
        let orig_adv = adventurer;

        // assert adventurer does not already own the item
        _assert_item_not_owned(orig_adv, bag, item_id, game_libs);

        // assert item is valid
        assert(item_id > 0 && item_id <= 101, messages::INVALID_ITEM_ID);

        // get item from item id
        let item = game_libs.loot.get_item(item_id);

        // get item price
        let base_item_price = ImplMarket::get_price(item.tier);

        // get item price with charisma discount
        let charisma_adjusted_price = adventurer.stats.charisma_adjusted_item_price(base_item_price);

        // check adventurer has enough gold to buy the item
        _assert_has_enough_gold(orig_adv, charisma_adjusted_price);

        // deduct charisma adjusted cost of item from adventurer's gold balance
        adventurer.deduct_gold(charisma_adjusted_price);
    }

    // ------------------------------------------ //
    // ------------ Helper Functions ------------ //
    // ------------------------------------------ //

    fn _get_random_seed(
        adventurer_id: u64, adventurer_xp: u16, game_seed: u64, game_seed_until_xp: u16, vrf_address: ContractAddress,
    ) -> (u64, u64) {
        let mut seed: felt252 = 0;

        if game_seed != 0 && (game_seed_until_xp == 0 || game_seed_until_xp > adventurer_xp) {
            seed = ImplAdventurer::get_simple_entropy(adventurer_xp, game_seed);
        } else if VRF_ENABLED
            && (get_tx_info().unbox().chain_id == MAINNET_CHAIN_ID
                || get_tx_info().unbox().chain_id == SEPOLIA_CHAIN_ID) {
            seed = VRFImpl::seed(vrf_address);
        } else {
            seed = ImplAdventurer::get_simple_entropy(adventurer_xp, adventurer_id);
        }

        ImplAdventurer::felt_to_two_u64(seed)
    }


    fn _save_seed(ref world: WorldStorage, adventurer_id: u64, market_seed: u64, beast_seed: u64) {
        let mut adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        if market_seed != 0 {
            adventurer_entropy.market_seed = market_seed;
        }
        if beast_seed != 0 {
            adventurer_entropy.beast_seed = beast_seed;
        }
        world.write_model(@adventurer_entropy);
    }

    fn _save_adventurer(
        ref world: WorldStorage, ref adventurer: Adventurer, bag: Bag, adventurer_id: u64, game_libs: GameLibs,
    ) {
        _emit_game_event(ref world, adventurer_id, adventurer.action_count, GameEventDetails::adventurer(adventurer));
        adventurer = game_libs.adventurer.remove_stat_boosts(adventurer, bag);
        let packed = game_libs.adventurer.pack_adventurer(adventurer);
        world.write_model(@AdventurerPacked { adventurer_id, packed });
    }


    fn _save_bag(ref world: WorldStorage, adventurer_id: u64, action_count: u16, bag: Bag, game_libs: GameLibs) {
        _emit_game_event(ref world, adventurer_id, action_count, GameEventDetails::bag(bag));
        let packed = game_libs.adventurer.pack_bag(bag);
        world.write_model(@BagPacked { adventurer_id, packed });
    }

    fn _apply_item_stat_boost(ref adventurer: Adventurer, item: Item, game_libs: GameLibs) {
        let item_suffix = game_libs.loot.get_suffix(item.id, adventurer.item_specials_seed);
        adventurer.stats.apply_suffix_boost(item_suffix);
    }


    // ------------------------------------------ //
    // ------------ Assertions ------------------ //
    // ------------------------------------------ //

    fn _assert_in_battle(adventurer: Adventurer) {
        assert(adventurer.beast_health != 0, messages::NOT_IN_BATTLE);
    }
    fn _assert_not_in_battle(adventurer: Adventurer) {
        assert(adventurer.beast_health == 0, messages::ACTION_NOT_ALLOWED_DURING_BATTLE);
    }
    fn _assert_item_not_owned(adventurer: Adventurer, bag: Bag, item_id: u8, game_libs: GameLibs) {
        let (item_in_bag, _) = game_libs.adventurer.bag_contains(bag, item_id);
        assert(
            adventurer.equipment.is_equipped(item_id) == false && item_in_bag == false, messages::ITEM_ALREADY_OWNED,
        );
    }
    fn _assert_not_starter_beast(adventurer: Adventurer, message: felt252) {
        assert(adventurer.get_level() > 1, message);
    }
    fn _assert_not_dead(self: Adventurer) {
        assert(self.health != 0, messages::DEAD_ADVENTURER);
    }
    fn _assert_valid_starter_weapon(starting_weapon: u8, game_libs: GameLibs) {
        assert(game_libs.loot.is_starting_weapon(starting_weapon) == true, messages::INVALID_STARTING_WEAPON);
    }
    fn _assert_has_enough_gold(adventurer: Adventurer, cost: u16) {
        assert(adventurer.gold >= cost, messages::NOT_ENOUGH_GOLD);
    }
    fn _assert_not_buying_excess_health(adventurer: Adventurer, purchased_health: u16) {
        let adventurer_health_after_potions = adventurer.health + purchased_health;
        // assert adventurer is not buying more health than needed
        assert(
            adventurer_health_after_potions < adventurer.stats.get_max_health() + POTION_HEALTH_AMOUNT.into(),
            messages::HEALTH_FULL,
        );
    }
    fn _assert_stat_balance(stat_upgrades: Stats, stat_upgrades_available: u8) {
        let stat_upgrade_count = stat_upgrades.strength
            + stat_upgrades.dexterity
            + stat_upgrades.vitality
            + stat_upgrades.intelligence
            + stat_upgrades.wisdom
            + stat_upgrades.charisma;

        if stat_upgrades_available < stat_upgrade_count {
            panic_with_felt252(messages::INSUFFICIENT_STAT_UPGRADES);
        } else if stat_upgrades_available > stat_upgrade_count {
            panic_with_felt252(messages::MUST_USE_ALL_STATS);
        }
    }
    fn _assert_valid_stat_selection(adventurer: Adventurer, stat_upgrades: Stats) {
        assert(adventurer.stat_upgrades_available != 0, messages::MARKET_CLOSED);
        _assert_stat_balance(stat_upgrades, adventurer.stat_upgrades_available);
        assert(stat_upgrades.luck == 0, messages::NON_ZERO_STARTING_LUCK);
    }


    fn _assert_token_ownership(world: WorldStorage, token_id: u64) {
        let (contract_address, _) = world.dns(@"game_token_systems").unwrap();
        let game_token = IERC721Dispatcher { contract_address };
        assert(game_token.owner_of(token_id.into()) == starknet::get_caller_address(), 'Not Owner');
    }

    fn _assert_game_not_started(world: WorldStorage, adventurer_id: u64) {
        let game_libs = ImplGameLibs::new(world);
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        assert!(
            adventurer.xp == 0 && adventurer.health == 0,
            "Death Mountain: Adventurer {} has already started",
            adventurer_id,
        );
    }

    // ------------------------------------------ //
    // ------------ Emit events ----------------- //
    // ------------------------------------------ //
    fn _emit_game_event(ref world: WorldStorage, adventurer_id: u64, action_count: u16, event: GameEventDetails) {
        world.emit_event(@GameEvent { adventurer_id, action_count, details: event });
    }
}

