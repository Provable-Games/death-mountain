// SPDX-License-Identifier: UNLICENSED

use core::option::Option;
use starknet::{ContractAddress, testing, contract_address_const};
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo_cairo_test::{
    spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    WorldStorageTestTrait,
};

use denshokan::constants::DEFAULT_NS;
use game_components_denshokan::interface::{IDenshokanDispatcher};

use denshokan::models::denshokan::{
    m_GameMetadata, m_GameRegistry, m_GameRegistryId, m_GameCounter, m_MinterRegistry,
    m_MinterRegistryId, m_MinterCounter, m_TokenMetadata, m_TokenCounter, m_TokenPlayerName,
    m_TokenObjective,
};

// use denshokan::tests::utils;

// Test constants
const OWNER: felt252 = 'OWNER';
const PLAYER: felt252 = 'PLAYER';
const GAME_CREATOR: felt252 = 'GAME_CREATOR';
const GAME_NAME: felt252 = 'TestGame';
const DEVELOPER: felt252 = 'TestDev';
const PUBLISHER: felt252 = 'TestPub';
const GENRE: felt252 = 'Action';
const PLAYER_NAME: felt252 = 'TestPlayer';

fn OWNER_ADDR() -> ContractAddress {
    contract_address_const::<OWNER>()
}

fn PLAYER_ADDR() -> ContractAddress {
    contract_address_const::<PLAYER>()
}

fn GAME_CREATOR_ADDR() -> ContractAddress {
    contract_address_const::<GAME_CREATOR>()
}

#[derive(Drop)]
pub struct TestContracts {
    pub world: WorldStorage,
    pub denshokan: IDenshokanDispatcher,
}

//
// Setup
//

fn setup_uninitialized() -> WorldStorage {
    testing::set_block_number(1);
    testing::set_block_timestamp(1000);

    let ndef = NamespaceDef {
        namespace: DEFAULT_NS(),
        resources: [
            // Denshokan models
            TestResource::Model(m_GameMetadata::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_GameRegistry::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_GameRegistryId::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_GameCounter::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_MinterRegistry::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_MinterRegistryId::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_MinterCounter::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_TokenMetadata::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_TokenCounter::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_TokenPlayerName::TEST_CLASS_HASH.try_into().unwrap()),
            TestResource::Model(m_TokenObjective::TEST_CLASS_HASH.try_into().unwrap()),
            // Events
            TestResource::Event(
                denshokan::denshokan::denshokan::e_Owners::TEST_CLASS_HASH.try_into().unwrap(),
            ),
            TestResource::Event(
                denshokan::denshokan::denshokan::e_ScoreUpdate::TEST_CLASS_HASH.try_into().unwrap(),
            ),
            TestResource::Event(
                denshokan::denshokan::denshokan::e_ObjectiveData::TEST_CLASS_HASH
                    .try_into()
                    .unwrap(),
            ),
            TestResource::Event(
                denshokan::denshokan::denshokan::e_SettingsData::TEST_CLASS_HASH
                    .try_into()
                    .unwrap(),
            ),
            TestResource::Event(
                denshokan::denshokan::denshokan::e_TokenContextData::TEST_CLASS_HASH
                    .try_into()
                    .unwrap(),
            ),
            // Contracts
            TestResource::Contract(denshokan::denshokan::denshokan::TEST_CLASS_HASH),
        ]
            .span(),
    };

    let mut contract_defs: Array<ContractDef> = array![
        ContractDefTrait::new(@DEFAULT_NS(), @"denshokan")
            .with_writer_of([dojo::utils::bytearray_hash(@DEFAULT_NS())].span()),
    ];

    let mut world: WorldStorage = spawn_test_world([ndef].span());
    world.sync_perms_and_inits(contract_defs.span());

    world
}

pub fn setup() -> TestContracts {
    let mut world = setup_uninitialized();

    let denshokan_address = match world.dns(@"denshokan") {
        Option::Some((address, _)) => address,
        Option::None => panic!("Denshokan contract not found in world DNS"),
    };

    let denshokan = IDenshokanDispatcher { contract_address: denshokan_address };

    TestContracts { world, denshokan }
}