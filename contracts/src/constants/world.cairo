// SPDX-License-Identifier: MIT

const MAINNET_CHAIN_ID: felt252 = 0x534e5f4d41494e;
const SEPOLIA_CHAIN_ID: felt252 = 0x534e5f5345504f4c4941;
const KATANA_CHAIN_ID: felt252 = 0x4b4154414e41;

pub const VERSION: felt252 = '0.0.1';

pub fn DEFAULT_NS() -> ByteArray {
    "ls_0_0_3"
}

pub fn SCORE_MODEL() -> ByteArray {
    "Game"
}

pub fn SCORE_ATTRIBUTE() -> ByteArray {
    "xp"
}

pub fn SETTINGS_MODEL() -> ByteArray {
    "GameSettings"
}

pub mod DEFAULT_SETTINGS {}
