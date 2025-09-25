// SPDX-License-Identifier: BUSL-1.1

use death_mountain::models::adventurer::stats::Stats;
use death_mountain::models::game::GameState;
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

    // ------ Game State ------
    fn get_game_state(self: @T, adventurer_id: u64) -> GameState;
}


#[dojo::contract]
mod game_systems {
    use core::panic_with_felt252;
    use death_mountain::constants::adventurer::{
        ITEM_MAX_GREATNESS, ITEM_XP_MULTIPLIER_BEASTS, ITEM_XP_MULTIPLIER_OBSTACLES, MAX_GREATNESS_STAT_BONUS,
        POTION_HEALTH_AMOUNT, STARTING_HEALTH, XP_FOR_DISCOVERIES,
    };
    use death_mountain::constants::beast::BeastSettings::BEAST_SPECIAL_NAME_LEVEL_UNLOCK;
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier};
    use death_mountain::constants::discovery::DiscoveryEnums::{DiscoveryType, ExploreResult};
    use death_mountain::constants::game::{MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID, STARTER_BEAST_ATTACK_DAMAGE, messages};
    use death_mountain::constants::loot::SUFFIX_UNLOCK_GREATNESS;
    use death_mountain::constants::world::DEFAULT_NS;
    use death_mountain::libs::game::{GameLibs, ImplGameLibs};
    use death_mountain::models::adventurer::adventurer::{Adventurer, IAdventurer, ImplAdventurer};
    use death_mountain::models::adventurer::bag::{Bag, ImplBag};
    use death_mountain::models::adventurer::equipment::ImplEquipment;
    use death_mountain::models::adventurer::item::{ImplItem, Item};
    use death_mountain::models::adventurer::stats::{ImplStats, Stats};
    use death_mountain::models::beast::{Beast, IBeast, ImplBeast};
    use death_mountain::models::combat::{CombatSpec, ImplCombat, SpecialPowers};
    use death_mountain::models::game::{
        AdventurerEntropy, AdventurerPacked, AttackEvent, BagPacked, BeastEvent, BuyItemsEvent, DefeatedBeastEvent,
        DiscoveryEvent, FledBeastEvent, GameEvent, GameEventDetails, GameSettings, GameState, ItemEvent, LevelUpEvent,
        MarketItemsEvent, ObstacleEvent, StatUpgradeEvent, StatsMode,
    };
    use death_mountain::models::market::{ImplMarket, ItemPurchase};
    use death_mountain::models::obstacle::{IObstacle, ImplObstacle};
    use death_mountain::systems::adventurer::contracts::IAdventurerSystemsDispatcherTrait;
    use death_mountain::systems::beast::contracts::IBeastSystemsDispatcherTrait;
    use death_mountain::systems::loot::contracts::ILootSystemsDispatcherTrait;
    use death_mountain::systems::settings::contracts::{ISettingsSystemsDispatcher, ISettingsSystemsDispatcherTrait};
    use death_mountain::utils::vrf::VRFImpl;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};
    use game_components_minigame::libs::{assert_token_ownership, post_action, pre_action};
    use starknet::{ContractAddress, get_tx_info};
    use super::VRF_ENABLED;

    // ------------------------------------------ //
    // ------------ Helper Functions ------------ //
    // ------------------------------------------ //

    fn _init_game_context(world: WorldStorage) -> GameLibs {
        ImplGameLibs::new(world)
    }

    fn _emit_lvl_events(
        ref world: WorldStorage,
        adventurer_id: u64,
        action_count: u16,
        level: u8,
        market_seed: u64,
        game_libs: GameLibs,
        market_size: u8,
    ) {
        _emit_game_event(ref world, adventurer_id, action_count, GameEventDetails::level_up(LevelUpEvent { level }));
        _emit_game_event(
            ref world,
            adventurer_id,
            action_count,
            GameEventDetails::market_items(
                MarketItemsEvent {
                    items: game_libs.adventurer.get_market(adventurer_id, market_seed, market_size).span(),
                },
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

            let token_address = _get_token_address(world);
            assert_token_ownership(token_address, adventurer_id);
            pre_action(token_address, adventurer_id);

            _assert_game_not_started(world, adventurer_id);

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
                            is_collectable: false,
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
                let mut adventurer = game_libs.adventurer.add_stat_boosts(game_settings.adventurer, game_settings.bag);
                adventurer.increment_action_count();

                let (beast_seed, market_seed) = _get_random_seed(
                    adventurer_id,
                    adventurer,
                    game_settings.game_seed,
                    game_settings.game_seed_until_xp,
                    game_settings.vrf_address,
                );

                _emit_lvl_events(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    adventurer.get_level(),
                    market_seed,
                    game_libs,
                    game_settings.market_size,
                );

                if game_settings.in_battle {
                    let (beast, _, _) = _get_beast(adventurer, beast_seed, game_libs);
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
                                is_collectable: false,
                            },
                        ),
                    );
                }

                _save_seed(ref world, adventurer_id, market_seed, 0);
                _save_bag(ref world, adventurer_id, adventurer.action_count, game_settings.bag, game_libs);
                _save_adventurer(ref world, ref adventurer, game_settings.bag, adventurer_id, game_libs);
            }
            post_action(token_address, adventurer_id)
        }

        fn explore(ref self: ContractState, adventurer_id: u64, till_beast: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = _get_token_address(world);
            assert_token_ownership(token_address, adventurer_id);
            pre_action(token_address, adventurer_id);

            let game_libs = _init_game_context(world);
            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();
            let orig_adv = adventurer.clone();
            _assert_not_dead(orig_adv);
            assert(orig_adv.stat_upgrades_available == 0, messages::STAT_UPGRADES_AVAILABLE);
            _assert_not_in_battle(orig_adv);
            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);
            let (explore_seed, market_seed) = _get_random_seed(
                adventurer_id,
                adventurer,
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
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    adventurer.get_level(),
                    market_seed,
                    game_libs,
                    game_settings.market_size,
                );
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);

            post_action(token_address, adventurer_id);
        }

        fn attack(ref self: ContractState, adventurer_id: u64, to_the_death: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = _get_token_address(world);
            assert_token_ownership(token_address, adventurer_id);
            pre_action(token_address, adventurer_id);

            let game_libs = _init_game_context(world);

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
            let (beast, beast_seed, beast_level_rnd) = _get_beast(adventurer, adventurer_entropy.beast_seed, game_libs);

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
                adventurer,
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
                adventurer_id,
            );

            _emit_events(ref world, adventurer_id, adventurer.action_count, game_events);

            if (orig_adv.get_level() < adventurer.get_level()) {
                _save_seed(ref world, adventurer_id, market_seed, 0);
                _emit_lvl_events(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    adventurer.get_level(),
                    market_seed,
                    game_libs,
                    game_settings.market_size,
                );
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);

            post_action(token_address, adventurer_id);
        }

        fn flee(ref self: ContractState, adventurer_id: u64, to_the_death: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = _get_token_address(world);
            assert_token_ownership(token_address, adventurer_id);
            pre_action(token_address, adventurer_id);

            let game_libs = _init_game_context(world);

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
            let (beast, beast_seed, _) = _get_beast(adventurer, adventurer_entropy.beast_seed, game_libs);

            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            let (flee_seed, market_seed) = _get_random_seed(
                adventurer_id,
                adventurer,
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
                adventurer_id,
            );

            _emit_events(ref world, adventurer_id, adventurer.action_count, game_events);

            if (orig_adv.get_level() < adventurer.get_level()) {
                _save_seed(ref world, adventurer_id, market_seed, 0);
                _emit_lvl_events(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    adventurer.get_level(),
                    market_seed,
                    game_libs,
                    game_settings.market_size,
                );
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);

            post_action(token_address, adventurer_id);
        }

        fn equip(ref self: ContractState, adventurer_id: u64, items: Array<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = _get_token_address(world);
            assert_token_ownership(token_address, adventurer_id);
            pre_action(token_address, adventurer_id);

            let game_libs = _init_game_context(world);

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
                let (beast, beast_seed, _) = _get_beast(adventurer, adventurer_entropy.beast_seed, game_libs);

                let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

                let (seed, _) = _get_random_seed(
                    adventurer_id,
                    adventurer,
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
                    adventurer_id,
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

            post_action(token_address, adventurer_id);
        }

        fn drop(ref self: ContractState, adventurer_id: u64, items: Array<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = _get_token_address(world);
            assert_token_ownership(token_address, adventurer_id);
            pre_action(token_address, adventurer_id);

            let game_libs = _init_game_context(world);

            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            // assert action is valid (ownership of item is handled in internal function when we
            // iterate over items)
            _assert_not_dead(adventurer);
            _assert_not_in_battle(adventurer);
            assert(items.len() != 0, messages::NO_ITEMS);
            _assert_not_starter_beast(adventurer, messages::CANT_DROP_DURING_STARTER_BEAST);

            // drop items
            _drop(ref adventurer, ref bag, items.clone(), game_libs, adventurer_id);

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

            post_action(token_address, adventurer_id);
        }

        fn buy_items(ref self: ContractState, adventurer_id: u64, potions: u8, items: Array<ItemPurchase>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = _get_token_address(world);
            assert_token_ownership(token_address, adventurer_id);
            pre_action(token_address, adventurer_id);

            let game_libs = _init_game_context(world);

            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            _assert_not_dead(adventurer);
            _assert_not_in_battle(adventurer);
            assert(adventurer.stat_upgrades_available == 0, messages::MARKET_CLOSED);

            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            // if the player is buying items, process purchases
            let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
            if (items.len() != 0) {
                _buy_items(
                    adventurer_id,
                    adventurer_entropy.market_seed,
                    ref adventurer,
                    ref bag,
                    items.clone(),
                    game_libs,
                    game_settings.market_size,
                );
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

            post_action(token_address, adventurer_id);
        }

        fn select_stat_upgrades(ref self: ContractState, adventurer_id: u64, stat_upgrades: Stats) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = _get_token_address(world);
            assert_token_ownership(token_address, adventurer_id);
            pre_action(token_address, adventurer_id);

            let game_libs = _init_game_context(world);

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

            post_action(token_address, adventurer_id);
        }

        fn get_game_state(self: @ContractState, adventurer_id: u64) -> GameState {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game_libs = _init_game_context(world);

            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);
            let adventurer_entropy: AdventurerEntropy = game_libs.adventurer.get_adventurer_entropy(adventurer_id);
            let market = game_libs
                .adventurer
                .get_market(adventurer_id, adventurer_entropy.market_seed, game_settings.market_size)
                .span();
            let (beast, _, _) = _get_beast(adventurer, adventurer_entropy.beast_seed, game_libs);

            let is_collectable = if beast.combat_spec.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK.into() {
                game_libs
                    .beast
                    .is_beast_collectable(
                        adventurer_id,
                        ImplBeast::get_beast_hash(
                            beast.id, beast.combat_spec.specials.special2, beast.combat_spec.specials.special3,
                        ),
                    )
            } else {
                false
            };

            let beast_event = BeastEvent {
                id: beast.id,
                seed: adventurer_entropy.beast_seed,
                health: beast.starting_health,
                level: beast.combat_spec.level,
                specials: beast.combat_spec.specials,
                is_collectable,
            };

            GameState { adventurer, bag, beast: beast_event, market }
        }
    }

    fn reveal_starting_stats(ref adventurer: Adventurer, seed: u64, game_libs: GameLibs) {
        // reveal and apply starting stats
        adventurer.stats = game_libs.adventurer.generate_starting_stats(seed);

        // increase adventurer's health for any vitality they received
        adventurer.health += adventurer.stats.get_max_health() - STARTING_HEALTH.into();
    }

    fn _get_beast(adventurer: Adventurer, beast_seed: u64, game_libs: GameLibs) -> (Beast, u32, u16) {
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
        item_specials_rnd: u16,
        level_seed: u64,
        game_libs: GameLibs,
        adventurer_id: u64,
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

        // if beast beast level is above collectible threshold
        if beast.combat_spec.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK.into() {
            let adventurer_entropy: AdventurerEntropy = game_libs.adventurer.get_adventurer_entropy(adventurer_id);
            game_libs
                .beast
                .add_collectable(
                    adventurer_entropy.beast_seed,
                    beast.id,
                    beast.combat_spec.level,
                    beast.starting_health,
                    beast.combat_spec.specials.special2,
                    beast.combat_spec.specials.special3,
                    adventurer_id,
                );
        }
    }

    fn _get_game_settings(world: WorldStorage, game_id: u64) -> GameSettings {
        let (settings_systems_address, _) = world.dns(@"settings_systems").unwrap();
        let settings_systems = ISettingsSystemsDispatcher { contract_address: settings_systems_address };
        settings_systems.game_settings(game_id)
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
                    adventurer_id,
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

                let is_collectable = if beast.combat_spec.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK.into() {
                    game_libs
                        .beast
                        .is_beast_collectable(
                            adventurer_id,
                            ImplBeast::get_beast_hash(
                                beast.id, beast.combat_spec.specials.special2, beast.combat_spec.specials.special3,
                            ),
                        )
                } else {
                    false
                };

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
                            is_collectable,
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
                let inventory_full = bag.is_full() && slot_free == false;

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
        adventurer_id: u64,
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
                    ref adventurer,
                    beast,
                    seed,
                    crit_hit_rnd,
                    dmg_location_rnd,
                    is_ambush,
                    game_libs,
                    game_settings,
                    adventurer_id,
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
        damage_taken = ImplCombat::apply_damage_reduction(damage_taken, game_settings.base_damage_reduction);

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
            damage_taken = ImplCombat::apply_damage_reduction(damage_taken, damage_reduction);
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
        adventurer_id: u64,
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
                ref adventurer, ref game_events, beast, item_specials_seed, level_seed, game_libs, adventurer_id,
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
                adventurer_id,
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
                    adventurer_id,
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
        adventurer_id: u64,
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
        let critical_hit_chance = ImplBeast::get_critical_hit_chance(adventurer.get_level(), is_ambush);

        // process beast attack
        let (combat_result, _jewlery_armor_bonus) = adventurer
            .defend(beast, armor, armor_specials, armor_details, critical_hit_rnd, critical_hit_chance);
        let mut damage_taken = combat_result.total_damage;

        // apply base damage reduction to ambush attacks
        if is_ambush {
            damage_taken = ImplCombat::apply_damage_reduction(damage_taken, game_settings.base_damage_reduction);
        }

        if is_ambush && game_settings.stats_mode == StatsMode::Reduction {
            let damage_reduction = ImplCombat::ability_based_damage_reduction(
                adventurer.get_level(), adventurer.stats.wisdom,
            );
            damage_taken = ImplCombat::apply_damage_reduction(damage_taken, damage_reduction);
        }

        // deduct damage taken from adventurer's health
        adventurer.decrease_health(damage_taken);

        if adventurer.health == 0 {
            game_libs
                .beast
                .add_kill(
                    ImplBeast::get_beast_hash(
                        beast.id, beast.combat_spec.specials.special2, beast.combat_spec.specials.special3,
                    ),
                    adventurer_id,
                );
        }

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
        adventurer_id: u64,
    ) {
        battle_count = ImplAdventurer::increment_battle_action_count(battle_count);

        // get randomness for flee and ambush
        let (flee_rnd, _, beast_crit_hit_rnd, attack_location_rnd) = game_libs
            .adventurer
            .get_battle_randomness(adventurer.xp, battle_count, flee_seed);

        // attempt to flee
        let fled = ImplBeast::attempt_flee(adventurer.get_level(), adventurer.stats.dexterity, flee_rnd);

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
                adventurer_id,
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
                    adventurer_id,
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

    fn _drop(ref adventurer: Adventurer, ref bag: Bag, items: Array<u8>, game_libs: GameLibs, adventurer_id: u64) {
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
            let item_suffix = game_libs.loot.get_suffix(item_id, adventurer.item_specials_seed);

            // if item is equipped
            if adventurer.equipment.is_equipped(item_id) {
                // get it from adventurer equipment
                item = adventurer.equipment.get_item(item_id);

                // if the item was providing a stat boosts
                if item.get_greatness() >= SUFFIX_UNLOCK_GREATNESS {
                    adventurer.stats.remove_suffix_boost(item_suffix);
                }

                // drop the item
                adventurer.equipment.drop(item_id);
            } else {
                // if item is not equipped, check if it's in bag
                let (item_in_bag, _) = game_libs.adventurer.bag_contains(bag, item_id);
                if item_in_bag {
                    item = bag.get_item(item_id);
                    let (new_bag, _) = game_libs.adventurer.remove_item_from_bag(bag, item_id);
                    bag = new_bag;
                } else {
                    panic_with_felt252('Item not owned by adventurer');
                }
            }

            if item.get_greatness() >= SUFFIX_UNLOCK_GREATNESS {
                adventurer.stats.remove_bag_boost(item_suffix);
            }

            let max_health = adventurer.stats.get_max_health();
            if adventurer.health > max_health {
                adventurer.health = max_health;
            }

            game_libs.adventurer.record_item_drop(adventurer_id, item);

            i += 1;
        };
    }

    fn _buy_items(
        adventurer_id: u64,
        market_seed: u64,
        ref adventurer: Adventurer,
        ref bag: Bag,
        items_to_purchase: Array<ItemPurchase>,
        game_libs: GameLibs,
        market_size: u8,
    ) {
        // get adventurer entropy
        let market_inventory = game_libs.adventurer.get_market(adventurer_id, market_seed, market_size);

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

    fn _get_token_address(world: WorldStorage) -> ContractAddress {
        let (game_token_systems_address, _) = world.dns(@"game_token_systems").unwrap();
        let minigame_dispatcher = IMinigameDispatcher { contract_address: game_token_systems_address };
        minigame_dispatcher.token_address()
    }

    fn _get_random_seed(
        adventurer_id: u64,
        adventurer: Adventurer,
        game_seed: u64,
        game_seed_until_xp: u16,
        vrf_address: ContractAddress,
    ) -> (u64, u64) {
        let mut seed: felt252 = 0;

        if game_seed != 0 && (game_seed_until_xp == 0 || game_seed_until_xp > adventurer.xp) {
            seed = ImplAdventurer::get_simple_entropy(adventurer.xp, game_seed);
        } else if VRF_ENABLED
            && (get_tx_info().unbox().chain_id == MAINNET_CHAIN_ID
                || get_tx_info().unbox().chain_id == SEPOLIA_CHAIN_ID) {
            let entropy = if adventurer.in_battle() {
                ImplAdventurer::get_battle_entropy(adventurer.xp, adventurer_id, adventurer.action_count)
            } else {
                ImplAdventurer::get_simple_entropy(adventurer.xp, adventurer_id)
            };
            seed = VRFImpl::seed(vrf_address, entropy);
        } else {
            seed = ImplAdventurer::get_simple_entropy(adventurer.xp, adventurer_id);
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

#[cfg(test)]
mod tests {
    use death_mountain::constants::adventurer::{BASE_POTION_PRICE, POTION_HEALTH_AMOUNT};
    use death_mountain::constants::beast::BeastSettings;
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier, Type};
    use death_mountain::constants::loot::ItemId;
    use death_mountain::constants::world::DEFAULT_NS;
    use death_mountain::libs::game::{GameLibs, ImplGameLibs};
    use death_mountain::models::adventurer::adventurer::{Adventurer, IAdventurer, ImplAdventurer};
    use death_mountain::models::adventurer::bag::{Bag, ImplBag};
    use death_mountain::models::adventurer::equipment::{Equipment};
    use death_mountain::models::adventurer::item::{Item};
    use death_mountain::models::adventurer::stats::{IStat, ImplStats, Stats};
    use death_mountain::models::game::{
        AdventurerEntropy, AdventurerPacked, BagPacked, e_GameEvent, m_AdventurerEntropy, m_AdventurerPacked,
        m_BagPacked, m_GameSettings, m_GameSettingsMetadata, m_SettingsCounter,
    };
    use death_mountain::models::game_data::m_DroppedItem;
    use death_mountain::models::market::ItemPurchase;
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait, adventurer_systems};
    use death_mountain::systems::beast::contracts::beast_systems;
    use death_mountain::systems::game::contracts::{IGameSystemsDispatcher, IGameSystemsDispatcherTrait, game_systems};
    use death_mountain::systems::game_token::contracts::game_token_systems;
    use death_mountain::systems::loot::contracts::{ILootSystemsDispatcherTrait, loot_systems};
    use death_mountain::systems::objectives::contracts::objectives_systems;
    use death_mountain::systems::renderer::contracts::renderer_systems;
    use death_mountain::systems::settings::contracts::settings_systems;
    use dojo::model::{ModelStorage, ModelStorageTest};
    use dojo::world::{IWorldDispatcherTrait, WorldStorage, WorldStorageTrait};
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait, spawn_test_world,
    };
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};
    use game_components_token::interface::{IMinigameTokenMixinDispatcher};
    use openzeppelin_token::erc721::interface::{IERC721MetadataDispatcher, IERC721MetadataDispatcherTrait};
    use starknet::{ContractAddress, contract_address_const};

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: DEFAULT_NS(),
            resources: [
                TestResource::Model(m_AdventurerPacked::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_BagPacked::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_AdventurerEntropy::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_SettingsCounter::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameSettings::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameSettingsMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_DroppedItem::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Contract(game_systems::TEST_CLASS_HASH),
                TestResource::Contract(loot_systems::TEST_CLASS_HASH),
                TestResource::Contract(renderer_systems::TEST_CLASS_HASH),
                TestResource::Contract(adventurer_systems::TEST_CLASS_HASH),
                TestResource::Contract(beast_systems::TEST_CLASS_HASH),
                TestResource::Contract(settings_systems::TEST_CLASS_HASH),
                TestResource::Contract(objectives_systems::TEST_CLASS_HASH),
                TestResource::Contract(game_token_systems::TEST_CLASS_HASH),
                TestResource::Event(e_GameEvent::TEST_CLASS_HASH.try_into().unwrap()),
            ]
                .span(),
        };
        ndef
    }

    fn contract_defs(denshokan_address: ContractAddress) -> Span<ContractDef> {
        let mut game_token_init_calldata: Array<felt252> = array![];
        game_token_init_calldata.append(contract_address_const::<'player1'>().into()); // creator_address
        game_token_init_calldata.append(denshokan_address.into()); // denshokan_address
        game_token_init_calldata.append(1); // Option::None for renderer address
        [
            ContractDefTrait::new(@DEFAULT_NS(), @"game_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"loot_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"renderer_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"adventurer_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"beast_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"game_token_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span())
                .with_init_calldata(game_token_init_calldata.span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"settings_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
            ContractDefTrait::new(@DEFAULT_NS(), @"objectives_systems")
                .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
        ]
            .span()
    }

    fn deploy_dungeon() -> (WorldStorage, IGameSystemsDispatcher, GameLibs, IMinigameTokenMixinDispatcher) {
        let denshokan_contracts = death_mountain::utils::setup_denshokan::setup();

        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs(denshokan_contracts.denshokan.contract_address));

        world.dispatcher.grant_owner(dojo::utils::bytearray_hash(@DEFAULT_NS()), contract_address_const::<'player1'>());

        starknet::testing::set_contract_address(contract_address_const::<'player1'>());
        starknet::testing::set_account_contract_address(contract_address_const::<'player1'>());
        starknet::testing::set_block_timestamp(300000);

        let (contract_address, _) = world.dns(@"game_systems").unwrap();
        let game_systems_dispatcher = IGameSystemsDispatcher { contract_address: contract_address };

        let game_libs = ImplGameLibs::new(world);
        (world, game_systems_dispatcher, game_libs, denshokan_contracts.denshokan)
    }

    fn new_game(world: WorldStorage, game: IGameSystemsDispatcher) -> u64 {
        let (contract_address, _) = world.dns(@"game_token_systems").unwrap();
        let minigame_dispatcher = IMinigameDispatcher { contract_address };

        let adventurer_id = minigame_dispatcher
            .mint_game(
                Option::Some('player1'), // player_name
                Option::Some(0), // settings_id
                Option::None, // start
                Option::None, // end
                Option::None, // objective_ids
                Option::None, // context
                Option::None, // client_url
                Option::None, // renderer_address
                contract_address_const::<'player1'>(), // to
                false // soulbound
            );

        game.start_game(adventurer_id, ItemId::Wand);

        adventurer_id
    }

    #[test]
    fn test_new_game() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // load player assets
        let (mut adventurer, _) = game_libs.adventurer.load_assets(adventurer_id);

        assert(adventurer.xp == 0, 'should start with 0 xp');
        assert(adventurer.equipment.weapon.id == ItemId::Wand, 'wrong starting weapon');
        assert(adventurer.beast_health == BeastSettings::STARTER_BEAST_HEALTH.into(), 'wrong starter beast health ');
    }

    #[test]
    #[should_panic(expected: ('Action not allowed in battle', 'ENTRYPOINT_FAILED'))]
    fn no_explore_during_battle() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // try to explore before defeating start beast
        game.explore(adventurer_id, true);
    }

    #[test]
    fn defeat_starter_beast() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // attack beast
        game.attack(adventurer_id, false);

        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        assert(adventurer.beast_health == 0, 'beast should be dead');
        assert(adventurer.get_level() == 2, 'should be level 2');
        assert(adventurer.stat_upgrades_available == 1, 'should have 1 stat available');
        assert(adventurer.stats.count_total_stats() > 0, 'should have starting stats');
    }

    #[test]
    #[should_panic(expected: ('Cant flee starter beast', 'ENTRYPOINT_FAILED'))]
    fn cant_flee_starter_beast() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // immediately attempt to flee starter beast
        // which is not allowed and should result in a panic 'Cant flee starter beast'
        game.flee(adventurer_id, false);
    }

    #[test]
    #[should_panic(expected: ('Not in battle', 'ENTRYPOINT_FAILED'))]
    fn cant_attack_outside_battle() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, true);
        // attack dead beast
        game.attack(adventurer_id, true);
    }

    #[test]
    #[should_panic(expected: ('Not in battle', 'ENTRYPOINT_FAILED'))]
    fn cant_flee_outside_battle() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);
        game.flee(adventurer_id, false);
    }

    #[test]
    fn game_flow() { // adventurer_id 1 with simple entropy
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // attack starter beast
        game.attack(adventurer_id, false);

        let stat_upgrades = Stats {
            strength: 0, dexterity: 1, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0,
        };
        game.select_stat_upgrades(adventurer_id, stat_upgrades.clone());

        // go exploring
        game.explore(adventurer_id, true);

        // upgrade
        game.select_stat_upgrades(adventurer_id, stat_upgrades.clone());

        // go exploring
        game.explore(adventurer_id, true);

        // upgrade
        game.select_stat_upgrades(adventurer_id, stat_upgrades.clone());

        // go exploring
        game.explore(adventurer_id, true);

        // verify we found a beast
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        assert(adventurer.beast_health != 0, 'should have found a beast');

        // flee from beast
        game.flee(adventurer_id, true);
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        assert(adventurer.beast_health == 0 || adventurer.health == 0, 'flee or die');
    }

    #[test]
    #[should_panic(expected: ('Stat upgrade available', 'ENTRYPOINT_FAILED'))]
    fn explore_not_allowed_with_avail_stat_upgrade() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // get updated adventurer
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // assert adventurer is now level 2 and has 1 stat upgrade available
        assert(adventurer.get_level() == 2, 'advntr should be lvl 2');
        assert(adventurer.stat_upgrades_available == 1, 'advntr should have 1 stat avl');

        // verify adventurer is unable to explore with stat upgrade available
        // this test is annotated to expect a panic so if it doesn't, this test will fail
        game.explore(adventurer_id, true);
    }

    #[test]
    #[should_panic(expected: ('Action not allowed in battle', 'ENTRYPOINT_FAILED'))]
    fn buy_items_during_battle() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Market is closed', 'ENTRYPOINT_FAILED'))]
    fn buy_items_with_stat_upgrades() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // get entropy
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);

        // get valid item from market
        let market_items = game_libs.adventurer.get_market(adventurer_id, adventurer_entropy.market_seed, 25);
        let item_id = *market_items.at(0);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });
        // should panic with message 'Market is closed'
        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Item already owned', 'ENTRYPOINT_FAILED'))]
    fn buy_duplicate_item_equipped() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_id, adventurer_entropy.market_seed, 25);

        // get first item on the market
        let item_id = *market_items.at(3);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });
        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });

        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Item already owned', 'ENTRYPOINT_FAILED'))]
    fn buy_duplicate_item_bagged() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_id, adventurer_entropy.market_seed, 25);

        // try to buy same item but equip one and put one in bag
        let item_id = *market_items.at(0);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });

        // should throw 'Item already owned' panic
        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Market item does not exist', 'ENTRYPOINT_FAILED'))]
    fn buy_item_not_on_market() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: 255, equip: false });

        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    fn buy_and_bag_item() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_id, adventurer_entropy.market_seed, 25);

        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: *market_items.at(0), equip: false });

        game.buy_items(adventurer_id, 0, shopping_cart);

        let (_, bag) = game_libs.adventurer.load_assets(adventurer_id);
        assert(bag.item_1.id == *market_items.at(0), 'item should be in bag');
    }

    #[test]
    fn buy_items() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_id, adventurer_entropy.market_seed, 25);

        let mut purchased_weapon: u8 = 0;
        let mut purchased_chest: u8 = 0;
        let mut purchased_waist: u8 = 0;
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        let mut i: u32 = 0;
        loop {
            if i == market_items.len() {
                break ();
            }
            let market_item_id = *market_items.at(i);
            let market_item_tier = game_libs.loot.get_tier(market_item_id);

            if (market_item_tier != Tier::T5 && market_item_tier != Tier::T4) {
                i += 1;
                continue;
            }

            let market_item_slot = game_libs.loot.get_slot(market_item_id);

            // if the item is a weapon and we haven't purchased a weapon yet
            // and the item is a tier 4 or 5 item
            // repeat this for everything
            if (market_item_slot == Slot::Weapon && purchased_weapon == 0 && market_item_id != 12) {
                shopping_cart.append(ItemPurchase { item_id: market_item_id, equip: true });
                purchased_weapon = market_item_id;
            } else if (market_item_slot == Slot::Chest && purchased_chest == 0) {
                shopping_cart.append(ItemPurchase { item_id: market_item_id, equip: true });
                purchased_chest = market_item_id;
            } else if (market_item_slot == Slot::Waist && purchased_waist == 0) {
                shopping_cart.append(ItemPurchase { item_id: market_item_id, equip: false });
                purchased_waist = market_item_id;
            }
            i += 1;
        };

        // verify we have at least two items in shopping cart
        let shopping_cart_length = shopping_cart.len();
        assert(shopping_cart_length > 1, 'need more items to buy');

        // buy items in shopping cart
        game.buy_items(adventurer_id, 0, shopping_cart.clone());

        // get updated adventurer and bag state
        let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);

        let mut buy_and_equip_tested = false;
        let mut buy_and_bagged_tested = false;

        // iterate over the items we bought
        let mut i: u32 = 0;
        loop {
            if i == shopping_cart.len() {
                break ();
            }
            let item_purchase = *shopping_cart.at(i);

            // if the item was purchased with equip flag set to true
            if item_purchase.equip {
                // assert it's equipped
                assert(adventurer.equipment.is_equipped(item_purchase.item_id), 'item not equipped');
                buy_and_equip_tested = true;
            } else {
                // if equip was false, verify item is in bag
                let (contains, _) = game_libs.adventurer.bag_contains(bag, item_purchase.item_id);
                assert(contains, 'item not in bag');
                buy_and_bagged_tested = true;
            }
            i += 1;
        };

        assert(buy_and_equip_tested, 'did not test buy and equip');
        assert(buy_and_bagged_tested, 'did not test buy and bag');
    }

    #[test]
    #[should_panic(expected: ('Item not in bag', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn equip_not_in_bag() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // initialize an array of items to equip that contains an item not in bag
        let mut items_to_equip = ArrayTrait::<u8>::new();
        items_to_equip.append(1);

        // try to equip the item which is not in bag
        // this should result in a panic 'Item not in bag' which is
        // annotated in the test
        game.equip(adventurer_id, items_to_equip);
    }

    #[test]
    #[should_panic(expected: ('Too many items', 'ENTRYPOINT_FAILED'))]
    fn equip_too_many_items() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // initialize an array of 9 items (too many to equip)
        let mut items_to_equip = ArrayTrait::<u8>::new();
        items_to_equip.append(1);
        items_to_equip.append(2);
        items_to_equip.append(3);
        items_to_equip.append(4);
        items_to_equip.append(5);
        items_to_equip.append(6);
        items_to_equip.append(7);
        items_to_equip.append(8);
        items_to_equip.append(9);

        // try to equip the 9 items
        // this should result in a panic 'Too many items' which is
        // annotated in the test
        game.equip(adventurer_id, items_to_equip);
    }

    #[test]
    fn equip() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_id, adventurer_entropy.market_seed, 25);

        let mut purchased_weapon: u8 = 0;
        let mut purchased_chest: u8 = 0;
        let mut purchased_head: u8 = 0;
        let mut purchased_waist: u8 = 0;
        let mut purchased_foot: u8 = 0;
        let mut purchased_hand: u8 = 0;
        let mut purchased_items = ArrayTrait::<u8>::new();
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        let mut i: u32 = 0;
        loop {
            if i == market_items.len() {
                break ();
            }
            let item_id = *market_items.at(i);
            let item_slot = game_libs.loot.get_slot(item_id);
            let item_tier = game_libs.loot.get_tier(item_id);

            // if the item is a weapon and we haven't purchased a weapon yet
            // and the item is a tier 4 or 5 item
            // repeat this for everything
            if (item_slot == Slot::Weapon
                && item_tier == Tier::T5
                && purchased_weapon == 0
                && item_id != ItemId::Wand) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_weapon = item_id;
            } else if (item_slot == Slot::Chest && item_tier == Tier::T5 && purchased_chest == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_chest = item_id;
            } else if (item_slot == Slot::Head && item_tier == Tier::T5 && purchased_head == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_head = item_id;
            } else if (item_slot == Slot::Waist && item_tier == Tier::T5 && purchased_waist == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_waist = item_id;
            } else if (item_slot == Slot::Foot && item_tier == Tier::T5 && purchased_foot == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_foot = item_id;
            } else if (item_slot == Slot::Hand && item_tier == Tier::T5 && purchased_hand == 0) {
                purchased_items.append(item_id);
                shopping_cart.append(ItemPurchase { item_id: item_id, equip: false });
                purchased_hand = item_id;
            }
            i += 1;
        };

        let purchased_items_span = purchased_items.span();

        // verify we have at least 2 items in our shopping cart
        assert(shopping_cart.len() >= 2, 'insufficient item purchase');
        // buy items
        game.buy_items(adventurer_id, 0, shopping_cart);

        // get bag from storage
        let (_, bag) = game_libs.adventurer.load_assets(adventurer_id);

        let mut items_to_equip = ArrayTrait::<u8>::new();
        // iterate over the items we bought
        let mut i: u32 = 0;
        loop {
            if i == purchased_items_span.len() {
                break ();
            }
            // verify they are all in our bag
            let (contains, _) = game_libs.adventurer.bag_contains(bag, *purchased_items_span.at(i));
            assert(contains, 'item should be in bag');
            items_to_equip.append(*purchased_items_span.at(i));
            i += 1;
        };

        // equip all of the items we bought
        game.equip(adventurer_id, items_to_equip.clone());

        // get update bag from storage
        let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);

        // iterate over the items we equipped
        let mut i: u32 = 0;
        loop {
            if i == items_to_equip.len() {
                break ();
            }
            let (contains, _) = game_libs.adventurer.bag_contains(bag, *purchased_items_span.at(i));
            // verify they are no longer in bag
            assert(!contains, 'item should not be in bag');
            // and equipped on the adventurer
            assert(adventurer.equipment.is_equipped(*purchased_items_span.at(i)), 'item should be equipped1');
            i += 1;
        };
    }

    #[test]
    fn buy_potions() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get updated adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // store original adventurer health and gold before buying potion
        let adventurer_health_pre_potion = adventurer.health;
        let adventurer_gold_pre_potion = adventurer.gold;

        // buy potions
        let number_of_potions = 1;
        let shopping_cart = ArrayTrait::<ItemPurchase>::new();
        game.buy_items(adventurer_id, number_of_potions, shopping_cart);

        // get updated adventurer stat
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        // verify potion increased health by POTION_HEALTH_AMOUNT or adventurer health is full
        assert(
            adventurer.health == adventurer_health_pre_potion
                + (POTION_HEALTH_AMOUNT.into() * number_of_potions.into()),
            'potion did not give health',
        );

        // verify potion cost reduced adventurers gold balance
        assert(adventurer.gold < adventurer_gold_pre_potion, 'potion cost is wrong');
    }

    #[test]
    #[should_panic(expected: ('Health already full', 'ENTRYPOINT_FAILED'))]
    fn buy_potions_exceed_max_health() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get updated adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // get number of potions required to reach full health
        let potions_to_full_health: u8 = (POTION_HEALTH_AMOUNT.into()
            / (adventurer.stats.get_max_health() - adventurer.health))
            .try_into()
            .unwrap();

        // attempt to buy one more potion than is required to reach full health
        // this should result in a panic 'Health already full'
        // this test is annotated to expect that panic
        let shopping_cart = ArrayTrait::<ItemPurchase>::new();
        let potions = potions_to_full_health + 1;
        game.buy_items(adventurer_id, potions, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Market is closed', 'ENTRYPOINT_FAILED'))]
    fn cant_buy_potion_with_stat_upgrade() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // upgrade adventurer
        let shopping_cart = ArrayTrait::<ItemPurchase>::new();
        let potions = 1;
        game.buy_items(adventurer_id, potions, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Action not allowed in battle', 'ENTRYPOINT_FAILED'))]
    fn cant_buy_potion_during_battle() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // attempt to immediately buy health before clearing starter beast
        // this should result in contract throwing a panic 'Action not allowed in battle'
        // This test is annotated to expect that panic
        let shopping_cart = ArrayTrait::<ItemPurchase>::new();
        let potions = 1;
        game.buy_items(adventurer_id, potions, shopping_cart);
    }

    #[test]
    fn get_potion_price_underflow() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        let potion_price = adventurer.charisma_adjusted_potion_price();
        let adventurer_level = adventurer.get_level();
        assert(potion_price == BASE_POTION_PRICE.into() * adventurer_level.into(), 'wrong lvl1 potion price');

        // defeat starter beast and advance to level 2
        game.attack(adventurer_id, true);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        // get level 2 potion price
        let potion_price = adventurer.charisma_adjusted_potion_price();
        let adventurer_level = adventurer.get_level();

        // verify potion price
        assert(
            potion_price == (BASE_POTION_PRICE.into() * adventurer_level.into()) - adventurer.stats.charisma.into(),
            'wrong lvl2 potion price',
        );
    }

    #[test]
    fn drop_item() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };
        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_id, adventurer_entropy.market_seed, 25);

        // get first item on the market
        let purchased_item_id = *market_items.at(0);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: purchased_item_id, equip: false });

        // buy first item on market and bag it
        game.buy_items(adventurer_id, 0, shopping_cart);

        // get bag state
        let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);

        // assert adventurer has starting weapon equipped
        assert(adventurer.equipment.weapon.id != 0, 'adventurer should have weapon');
        // assert bag has the purchased item
        let (contains, _) = game_libs.adventurer.bag_contains(bag, purchased_item_id);
        assert(contains, 'item should be in bag');

        // create drop list consisting of adventurers equipped weapon and purchased item that is in
        // bag
        let mut drop_list = ArrayTrait::<u8>::new();
        drop_list.append(adventurer.equipment.weapon.id);
        drop_list.append(purchased_item_id);

        // call contract drop
        game.drop(adventurer_id, drop_list);

        let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);

        // assert adventurer has no weapon equipped
        assert(adventurer.equipment.weapon.id == 0, 'weapon id should be 0');
        assert(adventurer.equipment.weapon.xp == 0, 'weapon should have no xp');

        // assert bag does not have the purchased item
        let (contains, _) = game_libs.adventurer.bag_contains(bag, purchased_item_id);
        assert(!contains, 'item should not be in bag');
    }

    #[test]
    fn drop_item_removes_bag_boost_and_caps_health() {
        let (mut world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);

        let adventurer_packed: AdventurerPacked = world.read_model(adventurer_id);
        let mut stored_adventurer = ImplAdventurer::unpack(adventurer_packed.packed);
        let bag_packed: BagPacked = world.read_model(adventurer_id);
        let mut stored_bag = ImplBag::unpack(bag_packed.packed);

        let suffix_unlock: u8 = death_mountain::constants::loot::SUFFIX_UNLOCK_GREATNESS;
        let suffix_unlock_xp: u16 = (suffix_unlock * suffix_unlock).into();

        let mut candidate_item_id: u8 = 1;
        let mut selected_item_id: u8 = 0;
        let mut selected_suffix: u8 = 0;
        loop {
            if candidate_item_id == 102 {
                break ();
            }

            let suffix = game_libs.loot.get_suffix(candidate_item_id, stored_adventurer.item_specials_seed);
            if suffix == death_mountain::constants::loot::ItemSuffix::of_Giant
                || suffix == death_mountain::constants::loot::ItemSuffix::of_Perfection
                || suffix == death_mountain::constants::loot::ItemSuffix::of_Protection
                || suffix == death_mountain::constants::loot::ItemSuffix::of_Fury {
                selected_item_id = candidate_item_id;
                selected_suffix = suffix;
                break ();
            }

            candidate_item_id += 1;
        };

        assert(selected_item_id != 0, 'expected vitality suffix');

        stored_bag.item_1 = Item { id: selected_item_id, xp: suffix_unlock_xp };
        stored_bag.mutated = false;

        stored_adventurer.stat_upgrades_available = 0;
        stored_adventurer.beast_health = 0;

        let base_stats = stored_adventurer.stats;
        let mut boosted_stats = base_stats;
        boosted_stats.apply_bag_boost(selected_suffix);
        assert(boosted_stats.vitality > base_stats.vitality, 'setup should boost vitality');

        let boosted_max_health = boosted_stats.get_max_health();
        stored_adventurer.health = boosted_max_health;

        let packed_adventurer = game_libs.adventurer.pack_adventurer(stored_adventurer);
        world.write_model_test(@AdventurerPacked { adventurer_id, packed: packed_adventurer });
        let packed_bag = game_libs.adventurer.pack_bag(stored_bag);
        world.write_model_test(@BagPacked { adventurer_id, packed: packed_bag });

        let (adventurer_before_drop, _) = game_libs.adventurer.load_assets(adventurer_id);
        assert(adventurer_before_drop.stats.vitality == boosted_stats.vitality, 'pre-drop stats mismatch');
        assert(adventurer_before_drop.health == boosted_max_health, 'pre-drop health mismatch');

        let mut items_to_drop = ArrayTrait::<u8>::new();
        items_to_drop.append(selected_item_id);
        game.drop(adventurer_id, items_to_drop);

        let (adventurer_after_drop, bag_after_drop) = game_libs.adventurer.load_assets(adventurer_id);
        let (owns_item, _) = game_libs.adventurer.bag_contains(bag_after_drop, selected_item_id);
        assert(!owns_item, 'item should be removed');
        assert(adventurer_after_drop.stats.vitality == base_stats.vitality, 'bag boost still applied');

        let base_max_health = base_stats.get_max_health();
        assert(adventurer_after_drop.health == base_max_health, 'health not capped');
        assert(adventurer_after_drop.stats.get_max_health() == base_max_health, 'max health mismatch');
    }


    #[test]
    fn upgrade_stats() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // get adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        let original_charisma = adventurer.stats.charisma;

        // call upgrade_stats with stat upgrades
        // TODO: test with more than one which is challenging
        // because we need a multi-level or G20 stat unlocks
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };
        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        // get update adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // assert charisma was increased
        assert(adventurer.stats.charisma == original_charisma + 1, 'charisma not increased');
        // assert stat point was used
        assert(adventurer.stat_upgrades_available == 0, 'should have used stat point');
    }

    #[test]
    #[should_panic(expected: ('insufficient stat upgrades', 'ENTRYPOINT_FAILED'))]
    fn upgrade_stats_not_enough_points() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // try to upgrade charisma x2 with only 1 stat available
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 2, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);
    }

    #[test]
    fn upgrade_adventurer() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast to get access to market
        game.attack(adventurer_id, false);

        // get original adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);
        let original_charisma = adventurer.stats.charisma;
        let original_health = adventurer.health;

        // buy a potion
        let potions = 1;

        // get items from market
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_id, adventurer_entropy.market_seed, 25);

        // buy two items
        let mut items_to_purchase = ArrayTrait::<ItemPurchase>::new();
        let purchase_and_equip = ItemPurchase { item_id: *market_items.at(19), equip: true };
        let purchase_and_not_equip = ItemPurchase { item_id: *market_items.at(20), equip: false };
        items_to_purchase.append(purchase_and_equip);
        items_to_purchase.append(purchase_and_not_equip);

        // stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        // call upgrade
        game.select_stat_upgrades(adventurer_id, stat_upgrades);
        game.buy_items(adventurer_id, potions, items_to_purchase);

        // get updated adventurer state
        let adventurer = game_libs.adventurer.get_adventurer(adventurer_id);

        // assert health was increased by one potion
        assert(adventurer.health == original_health + POTION_HEALTH_AMOUNT.into(), 'health not increased');
        // assert charisma was increased
        assert(adventurer.stats.charisma == original_charisma + 1, 'charisma not increased');
        // assert stat point was used
        assert(adventurer.stat_upgrades_available == 0, 'should have used stat point');
        // assert adventurer has the purchased items
        assert(adventurer.equipment.is_equipped(purchase_and_equip.item_id), 'purchase should be equipped');
        assert(!adventurer.equipment.is_equipped(purchase_and_not_equip.item_id), 'purchase should not be equipped');
    }

    #[test]
    #[should_panic(expected: ('Action not allowed in battle', 'ENTRYPOINT_FAILED'))]
    fn no_dropping_starter_weapon_during_starter_beast() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // try to drop starter weapon during starter beast battle
        let mut drop_items = array![ItemId::Wand];
        game.drop(adventurer_id, drop_items);
    }

    #[test]
    fn drop_starter_item_after_starter_beast() {
        let (world, game, _, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast
        game.attack(adventurer_id, false);

        // try to drop starter weapon
        let mut drop_items = array![ItemId::Wand];
        game.drop(adventurer_id, drop_items);
    }

    #[test]
    fn item_level_up() {
        let (mut world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);

        let (mut adventurer, _) = game_libs.adventurer.load_assets(adventurer_id);

        assert(adventurer.equipment.weapon.xp == 8, 'xp not set correctly');
        assert(adventurer.stat_upgrades_available == 1, 'wrong stats available');
    }

    #[test]
    fn denshokan_token_uri() {
        let (mut world, game, game_libs, denshokan) = deploy_dungeon();
        let adventurer_id = new_game(world, game);
        let denshokan_erc721_dispatcher = IERC721MetadataDispatcher { contract_address: denshokan.contract_address };
        let adventurer = Adventurer {
            health: 72,
            xp: 100,
            stats: Stats { strength: 3, dexterity: 2, vitality: 0, intelligence: 1, wisdom: 5, charisma: 3, luck: 2 },
            gold: 40,
            equipment: Equipment {
                weapon: Item { id: 13, xp: 0 },
                chest: Item { id: 0, xp: 0 },
                head: Item { id: 0, xp: 0 },
                waist: Item { id: 61, xp: 0 },
                foot: Item { id: 0, xp: 0 },
                hand: Item { id: 0, xp: 0 },
                neck: Item { id: 0, xp: 0 },
                ring: Item { id: 0, xp: 0 },
            },
            beast_health: 0,
            stat_upgrades_available: 0,
            item_specials_seed: 0,
            action_count: 0,
        };
        let packed_adventurer = game_libs.adventurer.pack_adventurer(adventurer);
        world.write_model_test(@AdventurerPacked { adventurer_id, packed: packed_adventurer });
        let bag = Bag {
            item_1: Item { id: 91, xp: 0 },
            item_2: Item { id: 31, xp: 0 },
            item_3: Item { id: 76, xp: 0 },
            item_4: Item { id: 0, xp: 0 },
            item_5: Item { id: 0, xp: 0 },
            item_6: Item { id: 0, xp: 0 },
            item_7: Item { id: 0, xp: 0 },
            item_8: Item { id: 0, xp: 0 },
            item_9: Item { id: 0, xp: 0 },
            item_10: Item { id: 0, xp: 0 },
            item_11: Item { id: 0, xp: 0 },
            item_12: Item { id: 0, xp: 0 },
            item_13: Item { id: 0, xp: 0 },
            item_14: Item { id: 0, xp: 0 },
            item_15: Item { id: 0, xp: 0 },
            mutated: false,
        };
        let packed_bag = game_libs.adventurer.pack_bag(bag);
        world.write_model_test(@BagPacked { adventurer_id, packed: packed_bag });
        let token_uri = denshokan_erc721_dispatcher.token_uri(1);
        println!("Token URI: {}", token_uri);
    }

    #[test]
    fn test_get_adventurer_verbose() {
        let (mut world, _, game_libs, _) = deploy_dungeon();
        let adventurer_id = 1;

        // Create a test adventurer with specific equipment and stats
        let test_adventurer = Adventurer {
            health: 100,
            xp: 1500,
            gold: 250,
            beast_health: 0,
            stat_upgrades_available: 2,
            stats: Stats {
                strength: 5, dexterity: 8, vitality: 6, intelligence: 12, wisdom: 10, charisma: 15, luck: 3,
            },
            equipment: Equipment {
                weapon: Item { id: ItemId::Wand, xp: 100 },
                chest: Item { id: ItemId::DivineRobe, xp: 50 },
                head: Item { id: ItemId::Crown, xp: 75 },
                waist: Item { id: ItemId::DemonhideBelt, xp: 30 },
                foot: Item { id: ItemId::LeatherBoots, xp: 20 },
                hand: Item { id: ItemId::LeatherGloves, xp: 15 },
                neck: Item { id: ItemId::Amulet, xp: 40 },
                ring: Item { id: ItemId::GoldRing, xp: 60 },
            },
            item_specials_seed: 12345,
            action_count: 150,
        };

        // Create a test bag with various items
        let test_bag = Bag {
            item_1: Item { id: ItemId::Falchion, xp: 80 },
            item_2: Item { id: ItemId::GhostWand, xp: 120 },
            item_3: Item { id: ItemId::Grimoire, xp: 200 },
            item_4: Item { id: ItemId::SilkRobe, xp: 45 },
            item_5: Item { id: ItemId::LinenGloves, xp: 10 },
            item_6: Item { id: 0, xp: 0 }, // Empty slot
            item_7: Item { id: 0, xp: 0 }, // Empty slot
            item_8: Item { id: 0, xp: 0 }, // Empty slot
            item_9: Item { id: 0, xp: 0 }, // Empty slot
            item_10: Item { id: 0, xp: 0 }, // Empty slot
            item_11: Item { id: 0, xp: 0 }, // Empty slot
            item_12: Item { id: 0, xp: 0 }, // Empty slot
            item_13: Item { id: 0, xp: 0 }, // Empty slot
            item_14: Item { id: 0, xp: 0 }, // Empty slot
            item_15: Item { id: 0, xp: 0 }, // Empty slot
            mutated: false,
        };

        // Stage the adventurer data
        let packed_adventurer = game_libs.adventurer.pack_adventurer(test_adventurer);
        world.write_model_test(@AdventurerPacked { adventurer_id, packed: packed_adventurer });

        // Stage the bag data
        let packed_bag = game_libs.adventurer.pack_bag(test_bag);
        world.write_model_test(@BagPacked { adventurer_id, packed: packed_bag });

        // Now call get_adventurer_verbose and verify the response
        let adventurer_verbose = game_libs.adventurer.get_adventurer_verbose(adventurer_id);

        // Verify basic adventurer data
        assert!(adventurer_verbose.xp == 1500, "incorrect xp. expected 1500, actual {:?}", adventurer_verbose.xp);
        assert!(adventurer_verbose.level == 38, "incorrect level. expected 38, actual {:?}", adventurer_verbose.level);
        assert!(adventurer_verbose.gold == 250, "incorrect gold. expected 250, actual {:?}", adventurer_verbose.gold);
        assert!(
            adventurer_verbose.health == 100, "incorrect health. expected 100, actual {:?}", adventurer_verbose.health,
        );
        assert!(
            adventurer_verbose.beast_health == 0,
            "incorrect beast health. expected 0, actual {:?}",
            adventurer_verbose.beast_health,
        );
        assert!(
            adventurer_verbose.stat_upgrades_available == 2,
            "incorrect stat upgrades. expected 2, actual {:?}",
            adventurer_verbose.stat_upgrades_available,
        );
        // Note: name is fetched from game_token_systems, not testing it here

        // Verify stats
        assert!(
            adventurer_verbose.stats.strength == 5,
            "incorrect strength. expected 5, actual {:?}",
            adventurer_verbose.stats.strength,
        );
        assert!(
            adventurer_verbose.stats.dexterity == 8,
            "incorrect dexterity. expected 8, actual {:?}",
            adventurer_verbose.stats.dexterity,
        );
        assert!(
            adventurer_verbose.stats.vitality == 6,
            "incorrect vitality. expected 6, actual {:?}",
            adventurer_verbose.stats.vitality,
        );
        assert!(
            adventurer_verbose.stats.intelligence == 12,
            "incorrect intelligence. expected 12, actual {:?}",
            adventurer_verbose.stats.intelligence,
        );
        assert!(
            adventurer_verbose.stats.wisdom == 10,
            "incorrect wisdom. expected 10, actual {:?}",
            adventurer_verbose.stats.wisdom,
        );
        assert!(
            adventurer_verbose.stats.charisma == 15,
            "incorrect charisma. expected 15, actual {:?}",
            adventurer_verbose.stats.charisma,
        );
        // Note: luck is always 0 in the packed/unpacked stats (by design)
        assert!(
            adventurer_verbose.stats.luck == 0,
            "luck should be 0. expected 0, actual {:?}",
            adventurer_verbose.stats.luck,
        );

        // Verify equipment verbose data
        assert!(
            adventurer_verbose.equipment.weapon.id == ItemId::Wand,
            "wrong weapon id. expected {:?}, actual {:?}",
            ItemId::Wand,
            adventurer_verbose.equipment.weapon.id,
        );
        assert!(
            adventurer_verbose.equipment.weapon.name == 'Wand',
            "wrong weapon name. expected {:?}, actual {:?}",
            'Wand',
            adventurer_verbose.equipment.weapon.name,
        );
        assert!(
            adventurer_verbose.equipment.weapon.xp == 100,
            "wrong weapon xp. expected 100, actual {:?}",
            adventurer_verbose.equipment.weapon.xp,
        );
        assert(adventurer_verbose.equipment.weapon.tier == Tier::T5, 'wrong weapon tier');
        assert(adventurer_verbose.equipment.weapon.item_type == Type::Magic_or_Cloth, 'wrong weapon type');
        assert(adventurer_verbose.equipment.weapon.slot == Slot::Weapon, 'wrong weapon slot');

        assert!(
            adventurer_verbose.equipment.chest.id == ItemId::DivineRobe,
            "wrong chest id. expected {:?}, actual {:?}",
            ItemId::DivineRobe,
            adventurer_verbose.equipment.chest.id,
        );
        assert!(
            adventurer_verbose.equipment.chest.xp == 50,
            "wrong chest xp. expected 50, actual {:?}",
            adventurer_verbose.equipment.chest.xp,
        );
        assert!(
            adventurer_verbose.equipment.chest.name == 'Divine Robe',
            "wrong chest name. expected {:?}, actual {:?}",
            'Divine Robe',
            adventurer_verbose.equipment.chest.name,
        );
        assert(adventurer_verbose.equipment.chest.tier == Tier::T1, 'wrong chest tier');
        assert(adventurer_verbose.equipment.chest.item_type == Type::Magic_or_Cloth, 'wrong chest type');
        assert(adventurer_verbose.equipment.chest.slot == Slot::Chest, 'wrong chest slot');

        assert!(
            adventurer_verbose.equipment.head.id == ItemId::Crown,
            "wrong head id. expected {:?}, actual {:?}",
            ItemId::Crown,
            adventurer_verbose.equipment.head.id,
        );
        assert!(
            adventurer_verbose.equipment.head.xp == 75,
            "wrong head xp. expected 75, actual {:?}",
            adventurer_verbose.equipment.head.xp,
        );
        assert!(
            adventurer_verbose.equipment.head.name == 'Crown',
            "wrong head name. expected {:?}, actual {:?}",
            'Crown',
            adventurer_verbose.equipment.head.name,
        );
        assert(adventurer_verbose.equipment.head.tier == Tier::T1, 'wrong head tier');
        assert(adventurer_verbose.equipment.head.item_type == Type::Magic_or_Cloth, 'wrong head type');
        assert(adventurer_verbose.equipment.head.slot == Slot::Head, 'wrong head slot');

        assert!(
            adventurer_verbose.equipment.waist.id == ItemId::DemonhideBelt,
            "wrong waist id. expected {:?}, actual {:?}",
            ItemId::DemonhideBelt,
            adventurer_verbose.equipment.waist.id,
        );
        assert!(
            adventurer_verbose.equipment.waist.xp == 30,
            "wrong waist xp. expected 30, actual {:?}",
            adventurer_verbose.equipment.waist.xp,
        );
        assert!(
            adventurer_verbose.equipment.waist.name == 'Demonhide Belt',
            "wrong waist name. expected {:?}, actual {:?}",
            'Demonhide Belt',
            adventurer_verbose.equipment.waist.name,
        );
        assert(adventurer_verbose.equipment.waist.tier == Tier::T1, 'wrong waist tier');
        assert(adventurer_verbose.equipment.waist.item_type == Type::Blade_or_Hide, 'wrong waist type');
        assert(adventurer_verbose.equipment.waist.slot == Slot::Waist, 'wrong waist slot');

        assert!(
            adventurer_verbose.equipment.foot.id == ItemId::LeatherBoots,
            "wrong foot id. expected {:?}, actual {:?}",
            ItemId::LeatherBoots,
            adventurer_verbose.equipment.foot.id,
        );
        assert!(
            adventurer_verbose.equipment.foot.xp == 20,
            "wrong foot xp. expected 20, actual {:?}",
            adventurer_verbose.equipment.foot.xp,
        );
        assert!(
            adventurer_verbose.equipment.foot.name == 'Leather Boots',
            "wrong foot name. expected {:?}, actual {:?}",
            'Leather Boots',
            adventurer_verbose.equipment.foot.name,
        );
        assert(adventurer_verbose.equipment.foot.tier == Tier::T5, 'wrong foot tier');
        assert(adventurer_verbose.equipment.foot.item_type == Type::Blade_or_Hide, 'wrong foot type');
        assert(adventurer_verbose.equipment.foot.slot == Slot::Foot, 'wrong foot slot');

        assert!(
            adventurer_verbose.equipment.hand.id == ItemId::LeatherGloves,
            "wrong hand id. expected {:?}, actual {:?}",
            ItemId::LeatherGloves,
            adventurer_verbose.equipment.hand.id,
        );
        assert!(
            adventurer_verbose.equipment.hand.xp == 15,
            "wrong hand xp. expected 15, actual {:?}",
            adventurer_verbose.equipment.hand.xp,
        );
        assert!(
            adventurer_verbose.equipment.hand.name == 'Leather Gloves',
            "wrong hand name. expected {:?}, actual {:?}",
            'Leather Gloves',
            adventurer_verbose.equipment.hand.name,
        );
        assert(adventurer_verbose.equipment.hand.tier == Tier::T5, 'wrong hand tier');
        assert(adventurer_verbose.equipment.hand.item_type == Type::Blade_or_Hide, 'wrong hand type');
        assert(adventurer_verbose.equipment.hand.slot == Slot::Hand, 'wrong hand slot');

        assert!(
            adventurer_verbose.equipment.ring.id == ItemId::GoldRing,
            "wrong ring id. expected {:?}, actual {:?}",
            ItemId::GoldRing,
            adventurer_verbose.equipment.ring.id,
        );
        assert!(
            adventurer_verbose.equipment.ring.xp == 60,
            "wrong ring xp. expected 60, actual {:?}",
            adventurer_verbose.equipment.ring.xp,
        );
        assert!(
            adventurer_verbose.equipment.ring.name == 'Gold Ring',
            "wrong ring name. expected {:?}, actual {:?}",
            'Gold Ring',
            adventurer_verbose.equipment.ring.name,
        );
        assert(adventurer_verbose.equipment.ring.tier == Tier::T1, 'wrong ring tier');
        assert(adventurer_verbose.equipment.ring.item_type == Type::Ring, 'wrong ring type');
        assert(adventurer_verbose.equipment.ring.slot == Slot::Ring, 'wrong ring slot');

        assert!(
            adventurer_verbose.equipment.neck.id == ItemId::Amulet,
            "wrong neck id. expected {:?}, actual {:?}",
            ItemId::Amulet,
            adventurer_verbose.equipment.neck.id,
        );
        assert!(
            adventurer_verbose.equipment.neck.xp == 40,
            "wrong neck xp. expected 40, actual {:?}",
            adventurer_verbose.equipment.neck.xp,
        );
        assert!(
            adventurer_verbose.equipment.neck.name == 'Amulet',
            "wrong neck name. expected {:?}, actual {:?}",
            'Amulet',
            adventurer_verbose.equipment.neck.name,
        );
        assert(adventurer_verbose.equipment.neck.tier == Tier::T1, 'wrong neck tier');
        assert(adventurer_verbose.equipment.neck.item_type == Type::Necklace, 'wrong neck type');
        assert(adventurer_verbose.equipment.neck.slot == Slot::Neck, 'wrong neck slot');

        // Verify bag verbose data
        assert!(
            adventurer_verbose.bag.item_1.id == ItemId::Falchion,
            "wrong bag item 1 id. expected {:?}, actual {:?}",
            ItemId::Falchion,
            adventurer_verbose.bag.item_1.id,
        );
        assert!(
            adventurer_verbose.bag.item_1.xp == 80,
            "wrong bag item 1 xp. expected 80, actual {:?}",
            adventurer_verbose.bag.item_1.xp,
        );
        assert!(
            adventurer_verbose.bag.item_1.name == 'Falchion',
            "wrong bag item 1 name. expected {:?}, actual {:?}",
            'Falchion',
            adventurer_verbose.bag.item_1.name,
        );
        assert(adventurer_verbose.bag.item_1.tier == Tier::T2, 'wrong bag item 1 tier');
        assert(adventurer_verbose.bag.item_1.item_type == Type::Blade_or_Hide, 'wrong bag item 1 type');
        assert(adventurer_verbose.bag.item_1.slot == Slot::Weapon, 'wrong bag item 1 slot');

        assert!(
            adventurer_verbose.bag.item_2.id == ItemId::GhostWand,
            "wrong bag item 2 id. expected {:?}, actual {:?}",
            ItemId::GhostWand,
            adventurer_verbose.bag.item_2.id,
        );
        assert!(
            adventurer_verbose.bag.item_2.xp == 120,
            "wrong bag item 2 xp. expected 120, actual {:?}",
            adventurer_verbose.bag.item_2.xp,
        );
        assert!(
            adventurer_verbose.bag.item_2.name == 'Ghost Wand',
            "wrong bag item 2 name. expected {:?}, actual {:?}",
            'Ghost Wand',
            adventurer_verbose.bag.item_2.name,
        );
        assert(adventurer_verbose.bag.item_2.tier == Tier::T1, 'wrong bag item 2 tier');
        assert(adventurer_verbose.bag.item_2.item_type == Type::Magic_or_Cloth, 'wrong bag item 2 type');
        assert(adventurer_verbose.bag.item_2.slot == Slot::Weapon, 'wrong bag item 2 slot');

        assert!(
            adventurer_verbose.bag.item_3.id == ItemId::Grimoire,
            "wrong bag item 3 id. expected {:?}, actual {:?}",
            ItemId::Grimoire,
            adventurer_verbose.bag.item_3.id,
        );
        assert!(
            adventurer_verbose.bag.item_3.xp == 200,
            "wrong bag item 3 xp. expected 200, actual {:?}",
            adventurer_verbose.bag.item_3.xp,
        );
        assert!(
            adventurer_verbose.bag.item_3.name == 'Grimoire',
            "wrong bag item 3 name. expected {:?}, actual {:?}",
            'Grimoire',
            adventurer_verbose.bag.item_3.name,
        );
        assert(adventurer_verbose.bag.item_3.tier == Tier::T1, 'wrong bag item 3 tier');
        assert(adventurer_verbose.bag.item_3.item_type == Type::Magic_or_Cloth, 'wrong bag item 3 type');
        assert(adventurer_verbose.bag.item_3.slot == Slot::Weapon, 'wrong bag item 3 slot');

        assert!(
            adventurer_verbose.bag.item_4.id == ItemId::SilkRobe,
            "wrong bag item 4 id. expected {:?}, actual {:?}",
            ItemId::SilkRobe,
            adventurer_verbose.bag.item_4.id,
        );
        assert!(
            adventurer_verbose.bag.item_4.xp == 45,
            "wrong bag item 4 xp. expected 45, actual {:?}",
            adventurer_verbose.bag.item_4.xp,
        );
        assert!(
            adventurer_verbose.bag.item_4.name == 'Silk Robe',
            "wrong bag item 4 name. expected {:?}, actual {:?}",
            'Silk Robe',
            adventurer_verbose.bag.item_4.name,
        );
        assert(adventurer_verbose.bag.item_4.tier == Tier::T2, 'wrong bag item 4 tier');
        assert(adventurer_verbose.bag.item_4.item_type == Type::Magic_or_Cloth, 'wrong bag item 4 type');
        assert(adventurer_verbose.bag.item_4.slot == Slot::Chest, 'wrong bag item 4 slot');

        assert!(
            adventurer_verbose.bag.item_5.id == ItemId::LinenGloves,
            "wrong bag item 5 id. expected {:?}, actual {:?}",
            ItemId::LinenGloves,
            adventurer_verbose.bag.item_5.id,
        );
        assert!(
            adventurer_verbose.bag.item_5.xp == 10,
            "wrong bag item 5 xp. expected 10, actual {:?}",
            adventurer_verbose.bag.item_5.xp,
        );
        assert!(
            adventurer_verbose.bag.item_5.name == 'Linen Gloves',
            "wrong bag item 5 name. expected {:?}, actual {:?}",
            'Linen Gloves',
            adventurer_verbose.bag.item_5.name,
        );
        assert(adventurer_verbose.bag.item_5.tier == Tier::T4, 'wrong bag item 5 tier');
        assert(adventurer_verbose.bag.item_5.item_type == Type::Magic_or_Cloth, 'wrong bag item 5 type');
        assert(adventurer_verbose.bag.item_5.slot == Slot::Hand, 'wrong bag item 5 slot');

        assert!(
            adventurer_verbose.bag.item_6.id == 0,
            "wrong bag item 6 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_6.id,
        );
        assert!(
            adventurer_verbose.bag.item_6.xp == 0,
            "wrong bag item 6 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_6.xp,
        );
        assert!(
            adventurer_verbose.bag.item_6.name == 0,
            "wrong bag item 6 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_6.name,
        );
        assert(adventurer_verbose.bag.item_6.tier == Tier::None, 'wrong bag item 6 tier');
        assert(adventurer_verbose.bag.item_6.item_type == Type::None, 'wrong bag item 6 type');
        assert(adventurer_verbose.bag.item_6.slot == Slot::None, 'wrong bag item 6 slot');

        assert!(
            adventurer_verbose.bag.item_7.id == 0,
            "wrong bag item 7 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_7.id,
        );
        assert!(
            adventurer_verbose.bag.item_7.xp == 0,
            "wrong bag item 7 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_7.xp,
        );
        assert!(
            adventurer_verbose.bag.item_7.name == 0,
            "wrong bag item 7 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_7.name,
        );
        assert(adventurer_verbose.bag.item_7.tier == Tier::None, 'wrong bag item 7 tier');
        assert(adventurer_verbose.bag.item_7.item_type == Type::None, 'wrong bag item 7 type');
        assert(adventurer_verbose.bag.item_7.slot == Slot::None, 'wrong bag item 7 slot');

        assert!(
            adventurer_verbose.bag.item_8.id == 0,
            "wrong bag item 8 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_8.id,
        );
        assert!(
            adventurer_verbose.bag.item_8.xp == 0,
            "wrong bag item 8 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_8.xp,
        );
        assert!(
            adventurer_verbose.bag.item_8.name == 0,
            "wrong bag item 8 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_8.name,
        );
        assert(adventurer_verbose.bag.item_8.tier == Tier::None, 'wrong bag item 8 tier');
        assert(adventurer_verbose.bag.item_8.item_type == Type::None, 'wrong bag item 8 type');
        assert(adventurer_verbose.bag.item_8.slot == Slot::None, 'wrong bag item 8 slot');

        assert!(
            adventurer_verbose.bag.item_9.id == 0,
            "wrong bag item 9 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_9.id,
        );
        assert!(
            adventurer_verbose.bag.item_9.xp == 0,
            "wrong bag item 9 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_9.xp,
        );
        assert!(
            adventurer_verbose.bag.item_9.name == 0,
            "wrong bag item 9 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_9.name,
        );
        assert(adventurer_verbose.bag.item_9.tier == Tier::None, 'wrong bag item 9 tier');
        assert(adventurer_verbose.bag.item_9.item_type == Type::None, 'wrong bag item 9 type');
        assert(adventurer_verbose.bag.item_9.slot == Slot::None, 'wrong bag item 9 slot');

        assert!(
            adventurer_verbose.bag.item_10.id == 0,
            "wrong bag item 10 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_10.id,
        );
        assert!(
            adventurer_verbose.bag.item_10.xp == 0,
            "wrong bag item 10 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_10.xp,
        );
        assert!(
            adventurer_verbose.bag.item_10.name == 0,
            "wrong bag item 10 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_10.name,
        );
        assert(adventurer_verbose.bag.item_10.tier == Tier::None, 'wrong bag item 10 tier');
        assert(adventurer_verbose.bag.item_10.item_type == Type::None, 'wrong bag item 10 type');
        assert(adventurer_verbose.bag.item_10.slot == Slot::None, 'wrong bag item 10 slot');

        assert!(
            adventurer_verbose.bag.item_11.id == 0,
            "wrong bag item 11 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_11.id,
        );
        assert!(
            adventurer_verbose.bag.item_11.xp == 0,
            "wrong bag item 11 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_11.xp,
        );
        assert!(
            adventurer_verbose.bag.item_11.name == 0,
            "wrong bag item 11 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_11.name,
        );
        assert(adventurer_verbose.bag.item_11.tier == Tier::None, 'wrong bag item 11 tier');
        assert(adventurer_verbose.bag.item_11.item_type == Type::None, 'wrong bag item 11 type');
        assert(adventurer_verbose.bag.item_11.slot == Slot::None, 'wrong bag item 11 slot');

        assert!(
            adventurer_verbose.bag.item_12.id == 0,
            "wrong bag item 12 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_12.id,
        );
        assert!(
            adventurer_verbose.bag.item_12.xp == 0,
            "wrong bag item 12 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_12.xp,
        );
        assert!(
            adventurer_verbose.bag.item_12.name == 0,
            "wrong bag item 12 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_12.name,
        );
        assert(adventurer_verbose.bag.item_12.tier == Tier::None, 'wrong bag item 12 tier');
        assert(adventurer_verbose.bag.item_12.item_type == Type::None, 'wrong bag item 12 type');
        assert(adventurer_verbose.bag.item_12.slot == Slot::None, 'wrong bag item 12 slot');

        assert!(
            adventurer_verbose.bag.item_13.id == 0,
            "wrong bag item 13 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_13.id,
        );
        assert!(
            adventurer_verbose.bag.item_13.xp == 0,
            "wrong bag item 13 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_13.xp,
        );
        assert!(
            adventurer_verbose.bag.item_13.name == 0,
            "wrong bag item 13 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_13.name,
        );
        assert(adventurer_verbose.bag.item_13.tier == Tier::None, 'wrong bag item 13 tier');
        assert(adventurer_verbose.bag.item_13.item_type == Type::None, 'wrong bag item 13 type');
        assert(adventurer_verbose.bag.item_13.slot == Slot::None, 'wrong bag item 13 slot');

        assert!(
            adventurer_verbose.bag.item_14.id == 0,
            "wrong bag item 14 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_14.id,
        );
        assert!(
            adventurer_verbose.bag.item_14.xp == 0,
            "wrong bag item 14 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_14.xp,
        );
        assert!(
            adventurer_verbose.bag.item_14.name == 0,
            "wrong bag item 14 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_14.name,
        );
        assert(adventurer_verbose.bag.item_14.tier == Tier::None, 'wrong bag item 14 tier');
        assert(adventurer_verbose.bag.item_14.item_type == Type::None, 'wrong bag item 14 type');
        assert(adventurer_verbose.bag.item_14.slot == Slot::None, 'wrong bag item 14 slot');

        assert!(
            adventurer_verbose.bag.item_15.id == 0,
            "wrong bag item 15 id. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_15.id,
        );
        assert!(
            adventurer_verbose.bag.item_15.xp == 0,
            "wrong bag item 15 xp. expected 0, actual {:?}",
            adventurer_verbose.bag.item_15.xp,
        );
        assert!(
            adventurer_verbose.bag.item_15.name == 0,
            "wrong bag item 15 name. expected {:?}, actual {:?}",
            0,
            adventurer_verbose.bag.item_15.name,
        );
        assert(adventurer_verbose.bag.item_15.tier == Tier::None, 'wrong bag item 15 tier');
        assert(adventurer_verbose.bag.item_15.item_type == Type::None, 'wrong bag item 15 type');
        assert(adventurer_verbose.bag.item_15.slot == Slot::None, 'wrong bag item 15 slot');
    }

    #[test]
    fn verbose_adventurer_packed_adventurer() {
        let (mut world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);

        let (adventurer, _) = game_libs.adventurer.load_assets(adventurer_id);
        let manual_packed_adventurer: felt252 = ImplAdventurer::pack(adventurer);

        let adventurer_packed_adventurer: felt252 = game_libs.adventurer.get_adventurer_packed(adventurer_id);
        assert!(
            adventurer_packed_adventurer == manual_packed_adventurer,
            "get_adventurer_packed_adventurer view function does not match manual pack. Expected: {:?}, Actual: {:?}",
            manual_packed_adventurer,
            adventurer_packed_adventurer,
        );

        let adventurer_verbose = game_libs.adventurer.get_adventurer_verbose(adventurer_id);
        assert!(
            adventurer_verbose.packed_adventurer == manual_packed_adventurer,
            "get_adventurer_verbose view function does not match get_adventurer_packed_adventurer view function. Expected: {:?}, Actual: {:?}",
            manual_packed_adventurer,
            adventurer_verbose.packed_adventurer,
        );
    }

    #[test]
    fn verbose_bag_packed_bag() {
        let (world, game, game_libs, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);

        let (_, bag) = game_libs.adventurer.load_assets(adventurer_id);
        let manual_packed_bag: felt252 = ImplBag::pack(bag);

        let bag_packed_bag: felt252 = game_libs.adventurer.get_bag_packed(adventurer_id);
        assert!(
            bag_packed_bag == manual_packed_bag,
            "get_bag_packed_bag view function does not match manual pack. Expected: {:?}, Actual: {:?}",
            manual_packed_bag,
            bag_packed_bag,
        );

        let adventurer_verbose = game_libs.adventurer.get_adventurer_verbose(adventurer_id);
        assert!(
            adventurer_verbose.packed_bag == manual_packed_bag,
            "get_adventurer_verbose view function does not match get_bag_packed_bag view function. Expected: {:?}, Actual: {:?}",
            manual_packed_bag,
            adventurer_verbose.packed_bag,
        );
    }
}
