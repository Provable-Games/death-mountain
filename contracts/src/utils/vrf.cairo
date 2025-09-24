// SPDX-License-Identifier: MIT

use starknet::{ContractAddress, contract_address_const};

#[starknet::interface]
pub trait IVrfProvider<TContractState> {
    fn request_random(self: @TContractState, caller: ContractAddress, source: Source);
    fn consume_random(ref self: TContractState, source: Source) -> felt252;
}

#[derive(Drop, Copy, Clone, Serde)]
pub enum Source {
    Nonce: ContractAddress,
    Salt: felt252,
}

#[generate_trait]
pub impl VRFImpl of VRFTrait {
    fn cartridge_vrf_address() -> ContractAddress {
        contract_address_const::<0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f>()
    }

    fn seed(vrf_address: ContractAddress, seed: felt252) -> felt252 {
        let vrf_provider = IVrfProviderDispatcher { contract_address: vrf_address };
        let random_value: felt252 = vrf_provider.consume_random(Source::Salt(seed));
        return random_value;
    }
}
