use death_mountain::models::adventurer::stats::Stats;
use death_mountain::models::market::{ItemPurchase, ItemPurchaseV2};

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
    fn buy_items_v2(ref self: T, adventurer_id: u64, potions: u8, items: Array<ItemPurchaseV2>);
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
    use death_mountain::models::game::{AdventurerEntropy, AdventurerPacked, BagPacked, GameSettings};
    use death_mountain::models::game::{
        AttackEvent, BeastEvent, BuyItemsEvent, DefeatedBeastEvent, DiscoveryEvent, FledBeastEvent, GameEvent,
        GameEventDetails, ItemEvent, LevelUpEvent, MarketItemsEvent, ObstacleEvent, StatUpgradeEvent,
    };
    use death_mountain::models::market::{ImplMarket, ItemPurchase, ItemPurchaseV2};
    use death_mountain::models::obstacle::{IObstacle, ImplObstacle};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait};
    use death_mountain::systems::beast::contracts::{IBeastSystemsDispatcherTrait};
    use death_mountain::systems::loot::contracts::{ILootSystemsDispatcherTrait};
    use death_mountain::utils::cartridge::VRFImpl;

    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};

    use openzeppelin_token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use starknet::{get_tx_info};
    use super::VRF_ENABLED;
    use tournaments::components::libs::lifecycle::{LifecycleAssertionsImpl, LifecycleAssertionsTrait};
    use tournaments::components::models::game::TokenMetadata;

    // ------------------------------------------ //
    // ------------ Impl ------------------------ //
    // ------------------------------------------ //
    #[abi(embed_v0)]
    impl GameSystemsImpl of super::IGameSystems<ContractState> {
        /// @title Start Game
        ///
        /// @notice Starts a new game
        /// @dev Starts a new game with the provided weapon.
        fn start_game(ref self: ContractState, adventurer_id: u64, weapon: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            _validate_start_conditions(world, adventurer_id, @token_metadata);

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // get game settings
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

                _save_beast_seed(ref world, adventurer_id, adventurer_id);
                _save_adventurer_no_boosts(ref world, ref adventurer, adventurer_id, game_libs);
            } else {
                let mut adventurer = game_settings.adventurer;
                adventurer.increment_action_count();

                // get random seed
                let (beast_seed, market_seed) = _get_random_seed(
                    world, adventurer_id, adventurer.xp, game_settings.game_seed, game_settings.game_seed_until_xp,
                );

                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::level_up(LevelUpEvent { level: adventurer.get_level() }),
                );
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::market_items(
                        MarketItemsEvent { items: game_libs.adventurer.get_market(market_seed).span() },
                    ),
                );

                if game_settings.in_battle {
                    let (beast, _, _) = _get_beast(ref adventurer, beast_seed, game_libs);
                    adventurer.beast_health = beast.starting_health;

                    // save seed to get correct beast
                    _save_beast_seed(ref world, adventurer_id, beast_seed);

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

                _save_market_seed(ref world, adventurer_id, market_seed);
                _save_bag(ref world, adventurer_id, adventurer.action_count, game_settings.bag, game_libs);
                _save_adventurer(ref world, ref adventurer, game_settings.bag, adventurer_id, game_libs);
            }
        }

        /// @title Explore Function
        ///
        /// @notice Allows an adventurer to explore
        ///
        /// @param adventurer_id A u256 representing the ID of the adventurer.
        /// @param till_beast A boolean flag indicating if the exploration continues until
        /// encountering a beast.
        fn explore(ref self: ContractState, adventurer_id: u64, till_beast: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            _assert_token_ownership(world, adventurer_id);

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // load player assets
            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            // use an immutable adventurer for assertions
            let immutable_adventurer = adventurer.clone();

            // assert action is valid
            _assert_not_dead(immutable_adventurer);
            _assert_no_stat_upgrades_available(immutable_adventurer);
            _assert_not_in_battle(immutable_adventurer);

            // get game settings
            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            // get random seed
            let (explore_seed, market_seed) = _get_random_seed(
                world, adventurer_id, adventurer.xp, game_settings.game_seed, game_settings.game_seed_until_xp,
            );

            // go explore
            _explore(ref world, ref adventurer, ref bag, adventurer_id, explore_seed, till_beast, game_libs);

            if bag.mutated {
                _save_bag(ref world, adventurer_id, adventurer.action_count, bag, game_libs);
            }

            // rotate market seed if level up
            if (immutable_adventurer.get_level() < adventurer.get_level()) {
                _save_market_seed(ref world, adventurer_id, market_seed);
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::level_up(LevelUpEvent { level: adventurer.get_level() }),
                );
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::market_items(
                        MarketItemsEvent { items: game_libs.adventurer.get_market(market_seed).span() },
                    ),
                );
            }

            // save state
            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        /// @title Attack Function
        ///
        /// @notice Allows an adventurer to attack a beast
        ///
        /// @param adventurer_id A u256 representing the ID of the adventurer.
        /// @param to_the_death A boolean flag indicating if the attack should continue until either
        /// the adventurer or the beast is defeated.
        fn attack(ref self: ContractState, adventurer_id: u64, to_the_death: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            _assert_token_ownership(world, adventurer_id);

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // load player assets
            let (mut adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            // use an immutable adventurer for assertions
            let immutable_adventurer = adventurer.clone();

            // assert action is valid
            _assert_not_dead(immutable_adventurer);
            _assert_in_battle(immutable_adventurer);

            // get weapon specials
            let weapon_specials = game_libs
                .loot
                .get_specials(
                    adventurer.equipment.weapon.id,
                    adventurer.equipment.weapon.get_greatness(),
                    adventurer.item_specials_seed,
                );

            // get previous entropy to fetch correct beast
            let adventurer_entropy = _load_adventurer_entropy(world, adventurer_id);

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

            // get game settings
            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            let (level_seed, market_seed) = _get_random_seed(
                world, adventurer_id, adventurer.xp, game_settings.game_seed, game_settings.game_seed_until_xp,
            );

            let mut game_events: Array<GameEventDetails> = array![];
            let mut battle_count = 0;
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
            );

            // emit events
            let mut event_count = 0;
            while (game_events.len() > 0) {
                let event = game_events.pop_front().unwrap();
                match event {
                    GameEventDetails::defeated_beast(event) => {
                        _emit_game_event(
                            ref world, adventurer_id, adventurer.action_count, GameEventDetails::defeated_beast(event),
                        );
                    },
                    GameEventDetails::attack(event) => {
                        _emit_game_event(
                            ref world, adventurer_id, adventurer.action_count, GameEventDetails::attack(event),
                        );
                    },
                    GameEventDetails::beast_attack(event) => {
                        _emit_game_event(
                            ref world, adventurer_id, adventurer.action_count, GameEventDetails::beast_attack(event),
                        );
                    },
                    _ => {},
                }
                event_count += 1;
            };

            // rotate market seed if level up
            if (immutable_adventurer.get_level() < adventurer.get_level()) {
                _save_market_seed(ref world, adventurer_id, market_seed);
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::level_up(LevelUpEvent { level: adventurer.get_level() }),
                );
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::market_items(
                        MarketItemsEvent { items: game_libs.adventurer.get_market(market_seed).span() },
                    ),
                );
            }

            // save state
            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        /// @title Flee Function
        ///
        /// @notice Allows an adventurer to flee from a beast
        ///
        /// @param adventurer_id A u256 representing the unique ID of the adventurer.
        /// @param to_the_death A boolean flag indicating if the flee attempt should continue until
        /// either the adventurer escapes or is defeated.
        fn flee(ref self: ContractState, adventurer_id: u64, to_the_death: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            _assert_token_ownership(world, adventurer_id);

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // load player assets
            let (mut adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            // use an immutable adventurer for assertions
            let immutable_adventurer = adventurer.clone();

            // assert action is valid
            _assert_not_dead(immutable_adventurer);
            _assert_in_battle(immutable_adventurer);
            _assert_not_starter_beast(immutable_adventurer, messages::CANT_FLEE_STARTER_BEAST);
            _assert_dexterity_not_zero(immutable_adventurer);

            // get previous entropy to fetch correct beast
            let adventurer_entropy = _load_adventurer_entropy(world, adventurer_id);

            // get beast
            let (beast, beast_seed, _) = _get_beast(ref adventurer, adventurer_entropy.beast_seed, game_libs);

            // get game settings
            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            // get random seed
            let (flee_seed, market_seed) = _get_random_seed(
                world, adventurer_id, adventurer.xp, game_settings.game_seed, game_settings.game_seed_until_xp,
            );

            // attempt to flee
            let mut game_events: Array<GameEventDetails> = array![];
            let mut battle_count = 0;
            _flee(
                ref adventurer,
                ref game_events,
                ref battle_count,
                flee_seed,
                beast_seed,
                beast,
                to_the_death,
                game_libs,
            );

            // emit events
            while (game_events.len() > 0) {
                let event = game_events.pop_front().unwrap();
                match event {
                    GameEventDetails::fled_beast(event) => {
                        _emit_game_event(
                            ref world, adventurer_id, adventurer.action_count, GameEventDetails::fled_beast(event),
                        );
                    },
                    GameEventDetails::flee(event) => {
                        _emit_game_event(
                            ref world, adventurer_id, adventurer.action_count, GameEventDetails::flee(event),
                        );
                    },
                    GameEventDetails::beast_attack(event) => {
                        _emit_game_event(
                            ref world, adventurer_id, adventurer.action_count, GameEventDetails::beast_attack(event),
                        );
                    },
                    _ => {},
                }
            };

            // rotate market seed if level up
            if (immutable_adventurer.get_level() < adventurer.get_level()) {
                _save_market_seed(ref world, adventurer_id, market_seed);
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::level_up(LevelUpEvent { level: adventurer.get_level() }),
                );
                _emit_game_event(
                    ref world,
                    adventurer_id,
                    adventurer.action_count,
                    GameEventDetails::market_items(
                        MarketItemsEvent { items: game_libs.adventurer.get_market(market_seed).span() },
                    ),
                );
            }

            // save state
            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        /// @title Equip Function
        ///
        /// @notice Allows an adventurer to equip items from their bag
        /// @player Calling this during battle will result in a beast counter-attack
        ///
        /// @param adventurer_id A u256 representing the unique ID of the adventurer.
        /// @param items A u8 array representing the item IDs to equip.
        fn equip(ref self: ContractState, adventurer_id: u64, items: Array<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            _assert_token_ownership(world, adventurer_id);

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // load player assets
            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            // assert action is valid
            _assert_not_dead(adventurer);
            assert(items.len() != 0, messages::NO_ITEMS);
            assert(items.len() <= 8, messages::TOO_MANY_ITEMS);

            // equip items
            _equip_items(ref adventurer, ref bag, items.clone(), false, game_libs);

            // if the adventurer is equipping an item during battle, the beast will counter attack
            if (adventurer.in_battle()) {
                // get previous entropy to fetch correct beast
                let adventurer_entropy = _load_adventurer_entropy(world, adventurer_id);

                // get beast
                let (beast, beast_seed, _) = _get_beast(ref adventurer, adventurer_entropy.beast_seed, game_libs);

                // get game settings
                let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

                // get random seed
                let (seed, _) = _get_random_seed(
                    world, adventurer_id, adventurer.xp, game_settings.game_seed, game_settings.game_seed_until_xp,
                );

                // get randomness for combat
                let (_, _, beast_crit_hit_rnd, attack_location_rnd) = game_libs
                    .adventurer
                    .get_battle_randomness(adventurer.xp, 0, seed);

                // process beast attack
                let beast_attack_details = _beast_attack(
                    ref adventurer, beast, beast_seed, beast_crit_hit_rnd, attack_location_rnd, false, game_libs,
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

            // save state
            // if the bag was mutated, pack and save it
            if bag.mutated {
                _save_bag(ref world, adventurer_id, adventurer.action_count, bag, game_libs);
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        /// @title Drop Function
        ///
        /// @notice Allows an adventurer to drop equpped items or items from their bag
        ///
        /// @param adventurer_id A u256 representing the unique ID of the adventurer.
        /// @param items A u8 Array representing the IDs of the items to drop.
        fn drop(ref self: ContractState, adventurer_id: u64, items: Array<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            _assert_token_ownership(world, adventurer_id);

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // load player assets
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

            // save state
            // if the bag was mutated, save it
            if bag.mutated {
                _save_bag(ref world, adventurer_id, adventurer.action_count, bag, game_libs);
            }

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        /// @title Buy Items Function
        /// @notice Allows an adventurer to buy items from the market
        /// @param adventurer_id A u256 representing the unique ID of the adventurer.
        /// @param potions A u8 representing the number of potions to purchase
        /// @param items An array of ItemPurchase detailing the items the adventurer wishes to purchase
        fn buy_items(ref self: ContractState, adventurer_id: u64, potions: u8, items: Array<ItemPurchase>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            _assert_token_ownership(world, adventurer_id);

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // load player assets
            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            // assert action is valid
            _assert_not_dead(adventurer);
            _assert_not_in_battle(adventurer);
            _assert_not_selecting_stat_upgrades(adventurer.stat_upgrades_available);

            // if the player is buying items, process purchases
            let adventurer_entropy = _load_adventurer_entropy(world, adventurer_id);
            if (items.len() != 0) {
                _buy_items(adventurer_entropy.market_seed, ref adventurer, ref bag, items.clone(), game_libs);
            }

            // if the player is buying potions as part of the upgrade, process purchase
            // @dev process potion purchase after items in case item purchases changes item stat
            // boosts
            if potions != 0 {
                _buy_potions(ref adventurer, potions);
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

        /// @title Buy Items V2
        /// @notice Purchases items for the adventurer using item indices from item_set
        /// @param adventurer_id The unique ID of the adventurer
        /// @param potions The number of potions to purchase
        /// @param items An array of ItemPurchaseV2 with indices into the game's item_set
        fn buy_items_v2(ref self: ContractState, adventurer_id: u64, potions: u8, items: Array<ItemPurchaseV2>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            _assert_token_ownership(world, adventurer_id);

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // load player assets
            let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            // assert action is valid
            _assert_not_dead(adventurer);
            _assert_not_in_battle(adventurer);
            _assert_not_selecting_stat_upgrades(adventurer.stat_upgrades_available);

            // get game settings to access item_set
            let game_settings: GameSettings = _get_game_settings(world, adventurer_id);

            // if the player is buying items, process purchases
            let adventurer_entropy = _load_adventurer_entropy(world, adventurer_id);
            if (items.len() != 0) {
                _buy_items_v2(
                    game_settings.item_set.span(),
                    adventurer_entropy.market_seed, 
                    ref adventurer, 
                    ref bag, 
                    items.clone(), 
                    game_libs
                );
            }

            // if the player is buying potions as part of the upgrade, process purchase
            // @dev process potion purchase after items in case item purchases changes item stat
            // boosts
            if potions != 0 {
                _buy_potions(ref adventurer, potions);
            }

            if bag.mutated {
                _save_bag(ref world, adventurer_id, adventurer.action_count, bag, game_libs);
            }

            // Convert ItemPurchaseV2 to actual item IDs for event
            let mut actual_items = ArrayTrait::new();
            let mut i = 0;
            loop {
                if i >= items.len() {
                    break;
                }
                let item_purchase = *items.at(i);
                match ImplMarket::get_item_id_from_index(game_settings.item_set.span(), item_purchase.item_index) {
                    Option::Some(item_id) => {
                        actual_items.append(ItemPurchase { 
                            item_id: item_id.try_into().expect('Item ID > 127'), 
                            equip: item_purchase.equip 
                        });
                    },
                    Option::None(_) => panic!("Invalid item index"),
                };
                i += 1;
            };

            _emit_game_event(
                ref world,
                adventurer_id,
                adventurer.action_count,
                GameEventDetails::buy_items(BuyItemsEvent { potions: potions, items_purchased: actual_items.span() }),
            );

            _save_adventurer(ref world, ref adventurer, bag, adventurer_id, game_libs);
        }

        /// @title Upgrade Function
        ///
        /// @notice Allows an adventurer to upgrade their stats, purchase potions, and buy new
        /// items.
        ///
        /// @param adventurer_id A u256 representing the unique ID of the adventurer.
        /// @param potions A u8 representing the number of potions to purchase
        /// @param stat_upgrades A Stats struct detailing the upgrades the adventurer wants to apply
        /// to their stats.
        /// @param items An array of ItemPurchase detailing the items the adventurer wishes to
        /// purchase during the upgrade.
        fn select_stat_upgrades(ref self: ContractState, adventurer_id: u64, stat_upgrades: Stats) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            _assert_token_ownership(world, adventurer_id);

            let token_metadata: TokenMetadata = world.read_model(adventurer_id);
            token_metadata.lifecycle.assert_is_playable(adventurer_id, starknet::get_block_timestamp());

            // get game libaries
            let game_libs = ImplGameLibs::new(world);

            // load player assets
            let (mut adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);
            adventurer.increment_action_count();

            let immutable_adventurer = adventurer.clone();

            // assert action is valid
            _assert_not_dead(immutable_adventurer);
            _assert_not_in_battle(immutable_adventurer);
            _assert_valid_stat_selection(immutable_adventurer, stat_upgrades);

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

    /// @title Reveal Starting Stats
    /// @notice Reveals and applies starting stats to the adventurer.
    /// @param adventurer A reference to the Adventurer object.
    /// @param seed A u64 representing the seed for the adventurer.
    fn reveal_starting_stats(ref adventurer: Adventurer, seed: u64, game_libs: GameLibs) {
        // reveal and apply starting stats
        adventurer.stats = game_libs.adventurer.generate_starting_stats(seed);

        // increase adventurer's health for any vitality they received
        adventurer.health += adventurer.stats.get_max_health() - STARTING_HEALTH.into();
    }

    /// @title Get Beast
    /// @notice Gets a beast based on the adventurer's xp and beast seed.
    /// @dev This function is called when a beast is encountered.
    /// @param adventurer A reference to the adventurer.
    /// @param beast_seed A u64 representing the seed of the beast.
    /// @param game_libs A reference to the game libraries.
    /// @return A tuple containing the beast and the beast seed.
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

    /// @title Process Beast Death
    /// @notice Processes the death of a beast and emits an event.
    /// @dev This function is called when a beast is slain.
    /// @param adventurer A reference to the adventurer.
    /// @param beast A reference to the Beast object.
    /// @param beast_seed A u128 representing the seed of the beast.
    /// @param damage_dealt A u16 representing the damage dealt to the beast.
    /// @param critical_hit A boolean representing whether the attack was a critical hit.
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

    /// @title Mint Beast
    /// @notice Mints a beast and emits an event.
    /// @dev This function is called when a beast is slain.
    /// @param self A reference to the ContractState object.
    /// @param beast A reference to the Beast object.
    /// @param to_address A ContractAddress representing the address to mint the beast to.
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

    /// @title Explore
    /// @notice Allows the adventurer to explore the world and encounter beasts, obstacles, or
    /// discoveries.
    /// @dev This function is called when the adventurer explores the world.
    /// @param adventurer A reference to the adventurer.
    /// @param bag A reference to the bag.
    /// @param adventurer_id A u64 representing the unique ID of the adventurer.
    /// @param explore_seed A felt252 representing the entropy for the adventurer.
    /// @param explore_till_beast A bool representing whether to explore until a beast is
    /// encountered.
    /// @param game_libs A reference to the game libraries.
    fn _explore(
        ref world: WorldStorage,
        ref adventurer: Adventurer,
        ref bag: Bag,
        adventurer_id: u64,
        explore_seed: u64,
        explore_till_beast: bool,
        game_libs: GameLibs,
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
                );

                // save seed to get correct beast
                _save_beast_seed(ref world, adventurer_id, explore_seed);

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
            _explore(ref world, ref adventurer, ref bag, adventurer_id, explore_seed, explore_till_beast, game_libs);
        }
    }

    /// @title Process Discovery
    /// @notice Processes the discovery for the adventurer and emits an event.
    /// @dev This function is called when the adventurer discovers something.
    /// @param adventurer A reference to the adventurer.
    /// @param bag A reference to the bag.
    /// @param entropy A u128 representing the entropy for the adventurer.
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

    /// @title Beast Encounter
    /// @notice Handles the encounter with a beast and returns the battle details.
    /// @dev This function is called when the adventurer encounters a beast.
    /// @param adventurer A reference to the adventurer.
    /// @param seed A u32 representing the seed for the beast.
    /// @param beast_health_rnd A u32 representing the random health for the beast.
    /// @param beast_level_rnd A u32 representing the random level for the beast.
    /// @param beast_specials_rnd A u32 representing the random specials for the beast.
    /// @param ambush_rnd A u32 representing the random ambush for the beast.
    /// @param critical_hit_rnd A u32 representing the random critical hit for the beast.
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
        let is_ambush = ImplAdventurer::is_ambushed(adventurer_level, adventurer.stats.wisdom, ambush_rnd);

        // if adventurer was ambushed
        let mut beast_attack_details = _empty_attack_event();
        if (is_ambush) {
            // process beast attack
            beast_attack_details =
                _beast_attack(ref adventurer, beast, seed, crit_hit_rnd, dmg_location_rnd, is_ambush, game_libs);
        }

        (beast, beast_attack_details)
    }

    /// @title Obstacle Encounter
    /// @notice Handles the encounter with an obstacle and returns the battle details.
    /// @dev This function is called when the adventurer encounters an obstacle.
    /// @param adventurer A reference to the adventurer.
    /// @param seed A u32 representing the entropy for the adventurer.
    fn _obstacle_encounter(
        ref adventurer: Adventurer,
        seed: u32,
        level_rnd: u16,
        dmg_location_rnd: u8,
        crit_hit_rnd: u8,
        dodge_rnd: u8,
        item_specials_rnd: u16,
        game_libs: GameLibs,
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
        let damage_taken = combat_result.total_damage;

        // get base xp reward for obstacle
        let base_reward = obstacle.get_xp_reward(adventurer_level);

        // get item xp reward for obstacle
        let item_xp_reward = base_reward * ITEM_XP_MULTIPLIER_OBSTACLES.into();

        // attempt to dodge obstacle
        let dodged = ImplCombat::ability_based_avoid_threat(adventurer_level, adventurer.stats.intelligence, dodge_rnd);

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
        if (!dodged) {
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

    /// @title Process Item Level Up
    /// @notice Processes the level up for an item and returns the updated item.
    /// @dev This function is called when an item levels up.
    /// @param adventurer A reference to the adventurer.
    /// @param item A reference to the item.
    /// @param previous_level A u8 representing the previous level of the item.
    /// @param new_level A u8 representing the new level of the item.
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

    fn _network_supports_vrf() -> bool {
        let chain_id = get_tx_info().unbox().chain_id;
        VRF_ENABLED && (chain_id == MAINNET_CHAIN_ID || chain_id == SEPOLIA_CHAIN_ID)
    }

    /// @notice Executes an adventurer's attack on a beast and manages the consequences of the
    /// combat @dev This function covers the entire combat process between an adventurer and a
    /// beast, including generating randomness for combat, handling the aftermath of the attack, and
    /// any subsequent counter-attacks by the beast.
    /// @param adventurer The attacking adventurer
    /// @param weapon_combat_spec The combat specifications of the adventurer's weapon
    /// @param seed A random value tied to the adventurer to aid in determining certain random
    /// aspects of the combat @param beast The defending beast
    /// @param beast_seed The seed associated with the beast
    /// @param fight_to_the_death Flag to indicate whether the adventurer should continue attacking
    /// until either they or the beast is defeated
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
                ref adventurer, beast, beast_seed, beast_crit_hit_rnd, attack_location_rnd, false, game_libs,
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
                );
            }
        }
    }

    /// @title Beast Attack (Internal)
    /// @notice Handles attacks by a beast on an adventurer
    /// @dev This function determines a random attack location on the adventurer, retrieves armor
    /// and specials from that location, processes the beast attack, and deducts the damage from the
    /// adventurer's health.
    /// @param adventurer The adventurer being attacked
    /// @param beast The beast that is attacking
    /// @param beast_seed The seed associated with the beast
    /// @param critical_hit_rnd A random value used to determine whether a critical hit was made
    /// the seed, beast ID, combat specifications of the beast, total damage dealt, whether a
    /// critical hit was made, and the location of the attack on the adventurer.
    fn _beast_attack(
        ref adventurer: Adventurer,
        beast: Beast,
        beast_seed: u32,
        critical_hit_rnd: u8,
        attack_location_rnd: u8,
        is_ambush: bool,
        game_libs: GameLibs,
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
        let (mut combat_result, _jewlery_armor_bonus) = adventurer
            .defend(beast, armor, armor_specials, armor_details, critical_hit_rnd, critical_hit_chance);

        // reduce ambush damage by 50%
        if is_ambush {
            combat_result.total_damage = combat_result.total_damage / 2;
        }

        // deduct damage taken from adventurer's health
        adventurer.decrease_health(combat_result.total_damage);

        AttackEvent {
            damage: combat_result.total_damage,
            location: attack_location,
            critical_hit: combat_result.critical_hit_bonus > 0,
        }
    }

    /// @title Flee
    /// @notice Handles an attempt by the adventurer to flee from a battle with a beast.
    /// @dev This function is called when the adventurer attempts to flee from a battle with a
    /// beast.
    /// @param self A reference to the ContractState object.
    /// @param adventurer A reference to the adventurer.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @param level_seed A felt252 representing the entropy for the adventurer.
    /// @param beast_seed A u32 representing the seed for the beast.
    /// @param beast A reference to the beast that the adventurer is attempting to flee from.
    /// @param flee_to_the_death A bool representing whether to flee until death.
    fn _flee(
        ref adventurer: Adventurer,
        ref game_events: Array<GameEventDetails>,
        ref battle_count: u16,
        flee_seed: u64,
        beast_seed: u32,
        beast: Beast,
        flee_to_the_death: bool,
        game_libs: GameLibs,
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
                ref adventurer, beast, beast_seed, beast_crit_hit_rnd, attack_location_rnd, false, game_libs,
            );

            // Save battle events
            game_events.append(GameEventDetails::flee(false));
            game_events.append(GameEventDetails::beast_attack(_beast_attack_details));

            // if player is still alive and elected to flee till death
            if (flee_to_the_death && adventurer.health != 0) {
                // reattempt flee
                _flee(ref adventurer, ref game_events, ref battle_count, flee_seed, beast_seed, beast, true, game_libs);
            }
        }
    }

    /// @title Equip Item
    /// @notice Equips a specific item to the adventurer, and if there's an item already equipped in
    /// that slot, it's moved to the bag.
    /// @dev This function is called when an item is equipped to the adventurer.
    /// @param self A reference to the ContractState object.
    /// @param adventurer A reference to the adventurer.
    /// @param bag A reference to the bag.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @param item The primitive item to be equipped.
    /// @return The ID of the item that has been unequipped.
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

    /// @title Equip Items
    /// @notice Equips items to the adventurer and returns the items that were unequipped as a
    /// result.
    /// @dev This function is called when items are equipped to the adventurer.
    /// @param contract_state A reference to the ContractState object.
    /// @param adventurer A reference to the adventurer.
    /// @param bag A reference to the bag.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @param items_to_equip An array of u8 representing the items to be equipped.
    /// @param is_newly_purchased A bool representing whether the items are newly purchased.
    /// @return An array of u8 representing the items that were unequipped as a result of equipping
    /// the items.
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

    /// @title Drop Items
    /// @notice Drops multiple items from the adventurer's possessions, either from equipment or
    /// bag.
    /// @dev This function is called when items are dropped from the adventurer's possessions.
    /// @param adventurer A reference to the adventurer.
    /// @param bag A reference to the bag.
    /// @param items An array of u8 representing the items to be dropped.
    /// @return A tuple containing two boolean values. The first indicates if the adventurer was
    /// mutated, the second indicates if the bag was mutated.
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
                    _remove_dropped_item_stat_boost(ref adventurer, item, game_libs);
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

    /// @title Buy Items
    /// @notice Facilitates the purchase of multiple items and returns the items that were
    /// purchased, equipped, and unequipped.
    /// @dev This function is called when the adventurer purchases items.
    /// @param market_seed A felt252 representing the seed for the market.
    /// @param adventurer A reference to the adventurer.
    /// @param bag A reference to the bag.
    /// @param items_to_purchase An array of ItemPurchase representing the items to be purchased.
    /// @param game_libs A reference to the game libraries.
    /// @return A tuple containing three arrays: the first contains the items purchased, the second
    /// contains the items that were equipped as part of the purchase, and the third contains the
    /// items that were unequipped as a result of equipping the newly purchased items.
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

    /// @title Buy Items V2 (Internal)
    /// @notice Internal function to process item purchases using item indices
    /// @param item_set The game's item_set
    /// @param market_seed The market seed for randomization
    /// @param adventurer A reference to the adventurer
    /// @param bag A reference to the bag
    /// @param items_to_purchase Array of ItemPurchaseV2 to purchase
    /// @param game_libs A reference to the game libraries
    fn _buy_items_v2(
        item_set: Span<u64>,
        market_seed: u64,
        ref adventurer: Adventurer,
        ref bag: Bag,
        items_to_purchase: Array<ItemPurchaseV2>,
        game_libs: GameLibs,
    ) {
        // Get available item indices for this market
        let market_inventory = ImplMarket::get_available_item_indices(
            item_set,
            market_seed,
            ImplMarket::get_market_size()
        );

        // mutable array for returning items that need to be equipped as part of this purchase
        let mut items_to_equip = ArrayTrait::<u8>::new();

        let mut item_number: u32 = 0;
        loop {
            if item_number == items_to_purchase.len() {
                break ();
            }

            // get the item purchase
            let item_purchase = *items_to_purchase.at(item_number);

            // get a mutable reference to the inventory
            let mut inventory = market_inventory.span();

            // assert item index is available on market
            assert(ImplMarket::is_item_index_available(ref inventory, item_purchase.item_index), messages::ITEM_DOES_NOT_EXIST);

            // convert index to actual item ID
            let item_id = match ImplMarket::get_item_id_from_index(item_set, item_purchase.item_index) {
                Option::Some(id) => id.try_into().expect('Item ID > 127'),
                Option::None(_) => panic!("Invalid item index"),
            };

            // buy it and store result in our purchases array for event
            _buy_item(ref adventurer, ref bag, item_id, game_libs);

            // if item is being equipped as part of the purchase
            if item_purchase.equip {
                // add it to our array of items to equip
                items_to_equip.append(item_id);
            } else {
                // if it's not being equipped, just add it to bag
                bag = game_libs.adventurer.add_new_item_to_bag(bag, item_id);
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

    /// @title Buy Potions
    /// @notice Processes the purchase of potions for the adventurer and emits an event.
    /// @dev This function is called when the adventurer purchases potions.
    /// @param adventurer A reference to the adventurer.
    /// @param quantity A u8 representing the number of potions to buy.
    fn _buy_potions(ref adventurer: Adventurer, quantity: u8) {
        let cost = adventurer.charisma_adjusted_potion_price() * quantity.into();
        let health = POTION_HEALTH_AMOUNT.into() * quantity.into();

        // assert adventurer has enough gold to buy the potions
        _assert_has_enough_gold(adventurer, cost);

        // assert adventurer is not buying more health than they can use
        _assert_not_buying_excess_health(adventurer, health);

        // deduct cost of potions from adventurers gold balance
        adventurer.deduct_gold(cost);

        // add health to adventurer
        adventurer.increase_health(health);
    }

    /// @title Buy Item
    /// @notice Buys an item with the item price adjusted for adventurer's charisma.
    /// @dev This function is called when the adventurer buys an item.
    /// @param adventurer A reference to the adventurer.
    /// @param bag A reference to the bag.
    /// @param item_id A u8 representing the ID of the item to be purchased.
    fn _buy_item(ref adventurer: Adventurer, ref bag: Bag, item_id: u8, game_libs: GameLibs) {
        // create an immutable copy of our adventurer to use for validation
        let immutable_adventurer = adventurer;

        // assert adventurer does not already own the item
        _assert_item_not_owned(immutable_adventurer, bag, item_id, game_libs);

        // assert item is valid
        _assert_valid_item_id(item_id);

        // get item from item id
        let item = game_libs.loot.get_item(item_id);

        // get item price
        let base_item_price = ImplMarket::get_price(item.tier);

        // get item price with charisma discount
        let charisma_adjusted_price = adventurer.stats.charisma_adjusted_item_price(base_item_price);

        // check adventurer has enough gold to buy the item
        _assert_has_enough_gold(immutable_adventurer, charisma_adjusted_price);

        // deduct charisma adjusted cost of item from adventurer's gold balance
        adventurer.deduct_gold(charisma_adjusted_price);
    }

    // ------------------------------------------ //
    // ------------ Helper Functions ------------ //
    // ------------------------------------------ //

    /// @title Get Random Seed
    /// @notice Gets a random seed for the adventurer.
    /// @dev This function is called when a random seed is needed.
    /// @param world A reference to the WorldStorage object.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @param adventurer_xp A u16 representing the adventurer's XP.
    /// @return A felt252 representing the random seed.
    fn _get_random_seed(
        world: WorldStorage, adventurer_id: u64, adventurer_xp: u16, game_seed: u64, game_seed_until_xp: u16,
    ) -> (u64, u64) {
        let mut seed: felt252 = 0;

        if game_seed != 0 && (game_seed_until_xp == 0 || game_seed_until_xp > adventurer_xp) {
            seed = ImplAdventurer::get_simple_entropy(adventurer_xp, game_seed);
        } else if _network_supports_vrf() {
            seed = VRFImpl::seed();
        } else {
            seed = ImplAdventurer::get_simple_entropy(adventurer_xp, adventurer_id);
        }

        ImplAdventurer::felt_to_two_u64(seed)
    }

    fn _load_adventurer_entropy(world: WorldStorage, adventurer_id: u64) -> AdventurerEntropy {
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        adventurer_entropy
    }

    fn _save_market_seed(ref world: WorldStorage, adventurer_id: u64, market_seed: u64) {
        let mut adventurer_entropy = _load_adventurer_entropy(world, adventurer_id);
        adventurer_entropy.market_seed = market_seed;
        world.write_model(@adventurer_entropy);
    }

    fn _save_beast_seed(ref world: WorldStorage, adventurer_id: u64, beast_seed: u64) {
        let mut adventurer_entropy = _load_adventurer_entropy(world, adventurer_id);
        adventurer_entropy.beast_seed = beast_seed;
        world.write_model(@adventurer_entropy);
    }

    /// @title Save Adventurer
    /// @notice Saves the adventurer and returns the adventurer.
    /// @dev This function is called when the adventurer is saved.
    /// @param self A reference to the ContractState object.
    /// @param adventurer A reference to the adventurer.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @return The adventurer.
    fn _save_adventurer(
        ref world: WorldStorage, ref adventurer: Adventurer, bag: Bag, adventurer_id: u64, game_libs: GameLibs,
    ) {
        _emit_game_event(ref world, adventurer_id, adventurer.action_count, GameEventDetails::adventurer(adventurer));
        adventurer = game_libs.adventurer.remove_stat_boosts(adventurer, bag);
        let packed = game_libs.adventurer.pack_adventurer(adventurer);
        world.write_model(@AdventurerPacked { adventurer_id, packed });
    }

    /// @title Save Adventurer No Boosts
    /// @notice Saves the adventurer without boosts and returns the adventurer.
    /// @dev This function is called when the adventurer is saved without boosts.
    /// @param self A reference to the ContractState object.
    /// @param adventurer A reference to the adventurer.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @return The adventurer.
    fn _save_adventurer_no_boosts(
        ref world: WorldStorage, ref adventurer: Adventurer, adventurer_id: u64, game_libs: GameLibs,
    ) {
        _emit_game_event(ref world, adventurer_id, adventurer.action_count, GameEventDetails::adventurer(adventurer));
        let packed = game_libs.adventurer.pack_adventurer(adventurer);
        world.write_model(@AdventurerPacked { adventurer_id, packed });
    }

    /// @title Save Bag
    /// @notice Saves the bag and returns the bag.
    /// @dev This function is called when the bag is saved.
    /// @param self A reference to the ContractState object.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @param bag A reference to the bag.
    /// @param game_libs A reference to the game libraries.
    fn _save_bag(ref world: WorldStorage, adventurer_id: u64, action_count: u16, bag: Bag, game_libs: GameLibs) {
        _emit_game_event(ref world, adventurer_id, action_count, GameEventDetails::bag(bag));
        let packed = game_libs.adventurer.pack_bag(bag);
        world.write_model(@BagPacked { adventurer_id, packed });
    }

    /// @title Apply Item Stat Boost
    /// @notice Applies the item stat boost to the adventurer.
    /// @dev This function is called when the item stat boost is applied to the adventurer.
    /// @param self A reference to the ContractState object.
    /// @param adventurer A reference to the adventurer.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @param item A reference to the item.
    fn _apply_item_stat_boost(ref adventurer: Adventurer, item: Item, game_libs: GameLibs) {
        let item_suffix = game_libs.loot.get_suffix(item.id, adventurer.item_specials_seed);
        adventurer.stats.apply_suffix_boost(item_suffix);
    }

    /// @title Remove Item Stat Boost from Dropped Item
    /// @notice Removes the item stat boost from the adventurer.
    /// @dev This function is called when the item stat boost is removed from the adventurer.
    /// @param self A reference to the ContractState object.
    /// @param adventurer A reference to the adventurer.
    /// @param adventurer_id A felt252 representing the unique ID of the adventurer.
    /// @param item A reference to the item.
    fn _remove_dropped_item_stat_boost(ref adventurer: Adventurer, item: Item, game_libs: GameLibs) {
        let item_suffix = game_libs.loot.get_suffix(item.id, adventurer.item_specials_seed);
        adventurer.stats.remove_suffix_boost(item_suffix);
        adventurer.stats.remove_bag_boost(item_suffix);

        // if the adventurer's health is now above the max health due to a change in Vitality
        let max_health = adventurer.stats.get_max_health();
        if adventurer.health > max_health {
            // lower adventurer's health to max health
            adventurer.health = max_health;
        }
    }

    fn _empty_attack_event() -> AttackEvent {
        AttackEvent { damage: 0, location: Slot::None, critical_hit: false }
    }

    // ------------------------------------------ //
    // ------------ Assertions ------------------ //
    // ------------------------------------------ //

    fn _assert_in_battle(adventurer: Adventurer) {
        assert(adventurer.beast_health != 0, messages::NOT_IN_BATTLE);
    }
    fn _assert_dexterity_not_zero(adventurer: Adventurer) {
        assert(adventurer.stats.dexterity != 0, messages::ZERO_DEXTERITY);
    }
    fn _assert_not_in_battle(adventurer: Adventurer) {
        assert(adventurer.beast_health == 0, messages::ACTION_NOT_ALLOWED_DURING_BATTLE);
    }
    fn _assert_not_selecting_stat_upgrades(stat_upgrades_available: u8) {
        assert(stat_upgrades_available == 0, messages::MARKET_CLOSED);
    }
    fn _assert_upgrades_available(stat_upgrades_available: u8) {
        assert(stat_upgrades_available != 0, messages::MARKET_CLOSED);
    }
    fn _assert_item_not_owned(adventurer: Adventurer, bag: Bag, item_id: u8, game_libs: GameLibs) {
        let (item_in_bag, _) = game_libs.adventurer.bag_contains(bag, item_id);
        assert(
            adventurer.equipment.is_equipped(item_id) == false && item_in_bag == false, messages::ITEM_ALREADY_OWNED,
        );
    }
    fn _assert_valid_item_id(item_id: u8) {
        assert(item_id > 0 && item_id <= 101, messages::INVALID_ITEM_ID);
    }
    fn _assert_not_starter_beast(adventurer: Adventurer, message: felt252) {
        assert(adventurer.get_level() > 1, message);
    }
    fn _assert_no_stat_upgrades_available(adventurer: Adventurer) {
        assert(adventurer.stat_upgrades_available == 0, messages::STAT_UPGRADES_AVAILABLE);
    }
    fn _assert_not_dead(self: Adventurer) {
        assert(self.health != 0, messages::DEAD_ADVENTURER);
    }
    fn _assert_is_dead(self: Adventurer) {
        assert(self.health == 0, messages::ADVENTURER_IS_ALIVE);
    }
    fn _assert_valid_starter_weapon(starting_weapon: u8, game_libs: GameLibs) {
        assert(game_libs.loot.is_starting_weapon(starting_weapon) == true, messages::INVALID_STARTING_WEAPON);
    }
    fn _assert_zero_luck(stats: Stats) {
        assert(stats.luck == 0, messages::NON_ZERO_STARTING_LUCK);
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
        _assert_upgrades_available(adventurer.stat_upgrades_available);
        _assert_stat_balance(stat_upgrades, adventurer.stat_upgrades_available);
        _assert_zero_luck(stat_upgrades);
    }

    fn _validate_start_conditions(world: WorldStorage, token_id: u64, token_metadata: @TokenMetadata) {
        _assert_token_ownership(world, token_id);
        _assert_game_not_started(world, token_id);
        token_metadata.lifecycle.assert_is_playable(token_id, starknet::get_block_timestamp());
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

#[cfg(test)]
mod tests {
    use death_mountain::constants::adventurer::{BASE_POTION_PRICE, POTION_HEALTH_AMOUNT};
    use death_mountain::constants::beast::BeastSettings;
    use death_mountain::constants::combat::CombatEnums::{Slot, Tier};
    use death_mountain::constants::loot::{ItemId};

    use death_mountain::constants::world::DEFAULT_NS;

    use death_mountain::libs::game::{GameLibs, ImplGameLibs};
    use death_mountain::models::adventurer::adventurer::{IAdventurer, ImplAdventurer};
    use death_mountain::models::adventurer::stats::{IStat, Stats};
    use death_mountain::models::game::{AdventurerEntropy};
    use death_mountain::models::game::{
        e_GameEvent, m_AdventurerEntropy, m_AdventurerPacked, m_BagPacked, m_GameSettings, m_GameSettingsMetadata,
        m_SettingsCounter,
    };
    use death_mountain::models::market::{ItemPurchase};
    use death_mountain::systems::adventurer::contracts::{IAdventurerSystemsDispatcherTrait, adventurer_systems};
    use death_mountain::systems::beast::contracts::{beast_systems};
    use death_mountain::systems::game::contracts::{IGameSystemsDispatcher, IGameSystemsDispatcherTrait, game_systems};
    use death_mountain::systems::game_token::contracts::{game_token_systems};
    use death_mountain::systems::loot::contracts::{ILootSystemsDispatcherTrait, loot_systems};
    use death_mountain::systems::renderer::contracts::{renderer_systems};
    use dojo::model::{ModelStorage};
    use dojo::world::{IWorldDispatcherTrait, WorldStorage, WorldStorageTrait};
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait, spawn_test_world,
    };
    use starknet::{contract_address_const};
    use tournaments::components::interfaces::{IGameTokenDispatcher, IGameTokenDispatcherTrait};

    use tournaments::components::models::game::{
        m_GameCounter, m_GameMetadata, m_Score, m_Settings, m_SettingsDetails, m_TokenMetadata,
    };

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: DEFAULT_NS(),
            resources: [
                TestResource::Model(m_AdventurerPacked::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_BagPacked::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_AdventurerEntropy::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_TokenMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameCounter::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Score::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_Settings::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_SettingsDetails::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_SettingsCounter::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameSettings::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Model(m_GameSettingsMetadata::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Contract(game_systems::TEST_CLASS_HASH),
                TestResource::Contract(loot_systems::TEST_CLASS_HASH),
                TestResource::Contract(renderer_systems::TEST_CLASS_HASH),
                TestResource::Contract(adventurer_systems::TEST_CLASS_HASH),
                TestResource::Contract(beast_systems::TEST_CLASS_HASH),
                TestResource::Contract(game_token_systems::TEST_CLASS_HASH),
                TestResource::Event(e_GameEvent::TEST_CLASS_HASH.try_into().unwrap()),
            ]
                .span(),
        };
        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
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
                .with_init_calldata(array![contract_address_const::<'player1'>().into()].span()),
        ]
            .span()
    }

    fn deploy_dungeon() -> (dojo::world::WorldStorage, IGameSystemsDispatcher, GameLibs) {
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        world.dispatcher.grant_owner(dojo::utils::bytearray_hash(@DEFAULT_NS()), contract_address_const::<'player1'>());

        starknet::testing::set_contract_address(contract_address_const::<'player1'>());
        starknet::testing::set_account_contract_address(contract_address_const::<'player1'>());
        starknet::testing::set_block_timestamp(300000);

        let (contract_address, _) = world.dns(@"game_systems").unwrap();
        let game_systems_dispatcher = IGameSystemsDispatcher { contract_address: contract_address };

        let game_libs = ImplGameLibs::new(world);
        (world, game_systems_dispatcher, game_libs)
    }

    fn new_game(world: WorldStorage, game: IGameSystemsDispatcher) -> u64 {
        let (contract_address, _) = world.dns(@"game_token_systems").unwrap();
        let game_token_dispatcher = IGameTokenDispatcher { contract_address };

        let adventurer_id = game_token_dispatcher
            .mint('player1', 0, Option::None, Option::None, contract_address_const::<'player1'>());
        game.start_game(adventurer_id, ItemId::Wand);

        adventurer_id
    }

    #[test]
    fn test_new_game() {
        let (world, game, game_libs) = deploy_dungeon();
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
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // try to explore before defeating start beast
        game.explore(adventurer_id, true);
    }

    #[test]
    fn defeat_starter_beast() {
        let (world, game, game_libs) = deploy_dungeon();
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
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // immediately attempt to flee starter beast
        // which is not allowed and should result in a panic 'Cant flee starter beast'
        game.flee(adventurer_id, false);
    }

    #[test]
    #[should_panic(expected: ('Not in battle', 'ENTRYPOINT_FAILED'))]
    fn cant_attack_outside_battle() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, true);
        // attack dead beast
        game.attack(adventurer_id, true);
    }

    #[test]
    #[should_panic(expected: ('Not in battle', 'ENTRYPOINT_FAILED'))]
    fn cant_flee_outside_battle() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);
        game.flee(adventurer_id, false);
    }

    #[test]
    fn game_flow() { // adventurer_id 1 with simple entropy
        let (world, game, game_libs) = deploy_dungeon();
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
        let (world, game, game_libs) = deploy_dungeon();
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
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Market is closed', 'ENTRYPOINT_FAILED'))]
    fn buy_items_with_stat_upgrades() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // get entropy
        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);

        // get valid item from market
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);
        let item_id = *market_items.at(0);
        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();

        shopping_cart.append(ItemPurchase { item_id: item_id, equip: true });
        // should panic with message 'Market is closed'
        game.buy_items(adventurer_id, 0, shopping_cart);
    }

    #[test]
    #[should_panic(expected: ('Item already owned', 'ENTRYPOINT_FAILED'))]
    fn buy_duplicate_item_equipped() {
        let (world, game, game_libs) = deploy_dungeon();
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
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

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
        let (world, game, game_libs) = deploy_dungeon();
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
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

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
        let (world, game, _) = deploy_dungeon();
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
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

        let mut shopping_cart = ArrayTrait::<ItemPurchase>::new();
        shopping_cart.append(ItemPurchase { item_id: *market_items.at(0), equip: false });

        game.buy_items(adventurer_id, 0, shopping_cart);

        let (_, bag) = game_libs.adventurer.load_assets(adventurer_id);
        assert(bag.item_1.id == *market_items.at(0), 'item should be in bag');
    }

    #[test]
    fn buy_items() {
        let (world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // take out starter beast
        game.attack(adventurer_id, false);

        // select stat upgrades
        let stat_upgrades = Stats {
            strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 1, luck: 0,
        };

        game.select_stat_upgrades(adventurer_id, stat_upgrades);

        let adventurer_entropy: AdventurerEntropy = world.read_model(adventurer_id);
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

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
        let (world, game, _) = deploy_dungeon();
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
        let (world, game, _) = deploy_dungeon();
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
        let (world, game, game_libs) = deploy_dungeon();
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
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

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
        let (world, game, game_libs) = deploy_dungeon();
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
        let (world, game, game_libs) = deploy_dungeon();
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
        let (world, game, _) = deploy_dungeon();
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
        let (world, game, _) = deploy_dungeon();
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
        let (world, game, game_libs) = deploy_dungeon();
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
        let (world, game, game_libs) = deploy_dungeon();
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
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

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
    #[should_panic(expected: ('Cant drop during starter beast', 'ENTRYPOINT_FAILED'))]
    fn drop_on_starter_beast() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        let mut drop_list = ArrayTrait::<u8>::new();
        drop_list.append(255);

        // try to drop an item the adventurer doesn't own
        // this should result in a panic 'Item not owned by adventurer'
        // this test is annotated to expect that panic
        game.drop(adventurer_id, drop_list);
    }

    #[test]
    fn upgrade_stats() {
        let (world, game, game_libs) = deploy_dungeon();
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
        let (world, game, _) = deploy_dungeon();
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
        let (world, game, game_libs) = deploy_dungeon();
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
        let market_items = game_libs.adventurer.get_market(adventurer_entropy.market_seed);

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
    #[should_panic(expected: ('Cant drop during starter beast', 'ENTRYPOINT_FAILED'))]
    fn no_dropping_starter_weapon_during_starter_beast() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // try to drop starter weapon during starter beast battle
        let mut drop_items = array![ItemId::Wand];
        game.drop(adventurer_id, drop_items);
    }

    #[test]
    fn drop_starter_item_after_starter_beast() {
        let (world, game, _) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        // defeat starter beast
        game.attack(adventurer_id, false);

        // try to drop starter weapon
        let mut drop_items = array![ItemId::Wand];
        game.drop(adventurer_id, drop_items);
    }

    #[test]
    fn item_level_up() {
        let (mut world, game, game_libs) = deploy_dungeon();
        let adventurer_id = new_game(world, game);

        game.attack(adventurer_id, false);

        let (mut adventurer, _) = game_libs.adventurer.load_assets(adventurer_id);

        assert(adventurer.equipment.weapon.xp == 8, 'xp not set correctly');
        assert(adventurer.stat_upgrades_available == 1, 'wrong stats available');
    }
}
