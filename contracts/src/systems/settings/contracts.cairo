use death_mountain::models::adventurer::adventurer::Adventurer;
use death_mountain::models::adventurer::bag::Bag;
use death_mountain::models::game::GameSettings;
use game_components_minigame::models::settings::GameSetting;

#[starknet::interface]
pub trait ISettingsSystems<T> {
    fn add_settings(
        ref self: T,
        name: felt252,
        adventurer: Adventurer,
        bag: Bag,
        game_seed: u64,
        game_seed_until_xp: u16,
        in_battle: bool,
    ) -> (u32, Span<GameSetting>);
    fn setting_details(self: @T, settings_id: u32) -> GameSettings;
    fn game_settings(self: @T, game_id: u64) -> GameSettings;
    fn settings_count(self: @T) -> u32;
}

#[dojo::contract]
mod settings_systems {
    use death_mountain::constants::world::{DEFAULT_NS, VERSION};
    use death_mountain::models::adventurer::adventurer::Adventurer;
    use death_mountain::models::adventurer::bag::Bag;
    use death_mountain::models::game::{GameSettings, GameSettingsMetadata, SettingsCounter};
    use death_mountain::systems::game_token::contracts::{IGameTokenSystemsDispatcher, IGameTokenSystemsDispatcherTrait};
    use game_components_minigame::models::settings::GameSetting;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use super::ISettingsSystems;

    #[abi(embed_v0)]
    impl SettingsSystemsImpl of ISettingsSystems<ContractState> {
        fn add_settings(
            ref self: ContractState,
            name: felt252,
            adventurer: Adventurer,
            bag: Bag,
            game_seed: u64,
            game_seed_until_xp: u16,
            in_battle: bool,
        ) -> (u32, Span<GameSetting>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            // increment settings counter
            let mut settings_count: SettingsCounter = world.read_model(VERSION);
            settings_count.count += 1;

            world
                .write_model(
                    @GameSettings {
                        settings_id: settings_count.count, adventurer, bag, game_seed, game_seed_until_xp, in_battle,
                    },
                );
            world
                .write_model(
                    @GameSettingsMetadata {
                        settings_id: settings_count.count,
                        name,
                        created_by: starknet::get_caller_address(),
                        created_at: starknet::get_block_timestamp(),
                    },
                );
            world.write_model(@settings_count);

            let settings: Span<GameSetting> = array![
                GameSetting {
                    name: "Starting Health",
                    value: format!("{}", adventurer.health),
                },
            ].span();

            (settings_count.count, settings)
        }

        fn setting_details(self: @ContractState, settings_id: u32) -> GameSettings {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            settings
        }

        fn game_settings(self: @ContractState, game_id: u64) -> GameSettings {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let (game_token_address, _) = world.dns(@"game_token_systems").unwrap();
            let game_token = IGameTokenSystemsDispatcher{contract_address: game_token_address};
            let settings_id = game_token.settings_id(game_id);
            let game_settings: GameSettings = world.read_model(settings_id);
            game_settings
        }

        fn settings_count(self: @ContractState) -> u32 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings_count: SettingsCounter = world.read_model(VERSION);
            settings_count.count
        }
    }
}
