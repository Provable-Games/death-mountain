// SPDX-License-Identifier: MIT

use death_mountain::models::adventurer::adventurer::Adventurer;
use death_mountain::models::adventurer::bag::Bag;
use death_mountain::models::game::{GameSettings, StatsMode};
use starknet::ContractAddress;

#[starknet::interface]
pub trait ISettingsSystems<T> {
    fn add_settings(
        ref self: T,
        vrf_address: ContractAddress,
        name: felt252,
        description: ByteArray,
        adventurer: Adventurer,
        bag: Bag,
        game_seed: u64,
        game_seed_until_xp: u16,
        in_battle: bool,
        stats_mode: StatsMode,
        base_damage_reduction: u8,
    ) -> u32;
    fn setting_details(self: @T, settings_id: u32) -> GameSettings;
    fn game_settings(self: @T, game_id: u64) -> GameSettings;
    fn settings_count(self: @T) -> u32;
}

#[dojo::contract]
mod settings_systems {
    use death_mountain::constants::world::{DEFAULT_NS, VERSION};
    use death_mountain::libs::settings::generate_settings_array;
    use death_mountain::models::adventurer::adventurer::Adventurer;
    use death_mountain::models::adventurer::bag::Bag;
    use death_mountain::models::game::{GameSettings, GameSettingsMetadata, SettingsCounter, StatsMode};

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::extensions::settings::interface::{IMinigameSettings};
    use game_components_minigame::extensions::settings::settings::SettingsComponent;
    use game_components_minigame::extensions::settings::structs::{GameSetting, GameSettingDetails};

    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};

    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ContractAddress;
    use super::ISettingsSystems;

    component!(path: SettingsComponent, storage: settings, event: SettingsEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    impl SettingsInternalImpl = SettingsComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        settings: SettingsComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SettingsEvent: SettingsComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    fn dojo_init(ref self: ContractState) {
        self.settings.initializer();
    }

    #[abi(embed_v0)]
    impl GameSettingsImpl of IMinigameSettings<ContractState> {
        fn settings_exist(self: @ContractState, settings_id: u32) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            settings.adventurer.health != 0
        }
        fn settings(self: @ContractState, settings_id: u32) -> GameSettingDetails {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            let settings_details: GameSettingsMetadata = world.read_model(settings_id);
            let settings: Span<GameSetting> = generate_settings_array(settings);
            GameSettingDetails {
                name: format!("{}", settings_details.name), description: settings_details.description, settings,
            }
        }
    }

    #[abi(embed_v0)]
    impl SettingsSystemsImpl of ISettingsSystems<ContractState> {
        fn add_settings(
            ref self: ContractState,
            vrf_address: ContractAddress,
            name: felt252,
            description: ByteArray,
            adventurer: Adventurer,
            bag: Bag,
            game_seed: u64,
            game_seed_until_xp: u16,
            in_battle: bool,
            stats_mode: StatsMode,
            base_damage_reduction: u8,
        ) -> u32 {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            // increment settings counter
            let mut settings_count: SettingsCounter = world.read_model(VERSION);
            settings_count.count += 1;
            let game_settings = GameSettings {
                settings_id: settings_count.count,
                vrf_address,
                adventurer,
                bag,
                game_seed,
                game_seed_until_xp,
                in_battle,
                stats_mode,
                base_damage_reduction,
            };
            world.write_model(@game_settings);
            world
                .write_model(
                    @GameSettingsMetadata {
                        settings_id: settings_count.count,
                        name,
                        description: description.clone(),
                        created_by: starknet::get_caller_address(),
                        created_at: starknet::get_block_timestamp(),
                    },
                );
            world.write_model(@settings_count);

            let settings: Span<GameSetting> = generate_settings_array(game_settings);

            let (game_systems_address, _) = world.dns(@"game_systems").unwrap();
            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_systems_address };
            let minigame_token_address = minigame_dispatcher.token_address();
            self
                .settings
                .create_settings(
                    settings_count.count, format!("{}", name), description.clone(), settings, minigame_token_address,
                );

            settings_count.count
        }

        fn setting_details(self: @ContractState, settings_id: u32) -> GameSettings {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            settings
        }

        fn game_settings(self: @ContractState, game_id: u64) -> GameSettings {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let (game_token_systems_address, _) = world.dns(@"game_token_systems").unwrap();
            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_token_systems_address };
            let minigame_token_address = minigame_dispatcher.token_address();
            let settings_id = self.settings.get_settings_id(game_id, minigame_token_address);
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
