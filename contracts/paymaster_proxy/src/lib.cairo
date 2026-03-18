// SPDX-License-Identifier: MIT

use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
pub enum SwapKind {
    Multihop,
    MultiMultihop,
}

#[derive(Copy, Drop, Serde)]
pub struct ProxyConfig {
    pub usdc: ContractAddress,
    pub strk: ContractAddress,
    pub ticket: ContractAddress,
    pub dungeon: ContractAddress,
    pub router: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
pub struct GoldenPassData {
    pub address: ContractAddress,
    pub token_id: u128,
}

#[derive(Copy, Drop, Serde)]
pub enum DungeonPayment {
    Ticket,
    GoldenPass: GoldenPassData,
}

#[starknet::interface]
pub trait IERC20Minimal<TState> {
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
pub trait IDungeonEntry<TState> {
    fn buy_game(
        ref self: TState, payment: DungeonPayment, player_name: Option<felt252>, to: ContractAddress, soulbound: bool,
    ) -> u64;
}

#[starknet::interface]
pub trait IUsdcGameProxy<TState> {
    fn buy_game_with_usdc(
        ref self: TState,
        max_usdc_in: u256,
        reserve_usdc_in: u256,
        reserve_strk_min_out: u256,
        reserve_swap_kind: SwapKind,
        reserve_swap_calldata: Span<felt252>,
        game_count: u32,
        player_name: Option<felt252>,
        recipient: ContractAddress,
        ticket_swap_kind: SwapKind,
        ticket_swap_calldata: Span<felt252>,
    );
    fn config(self: @TState) -> ProxyConfig;
    fn required_ticket_amount(self: @TState, game_count: u32) -> u256;
}

#[starknet::contract]
pub mod usdc_game_proxy {
    use core::array::ArrayTrait;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::syscalls::call_contract_syscall;
    use starknet::{ContractAddress, SyscallResultTrait, get_caller_address, get_contract_address};
    use super::{
        DungeonPayment, IDungeonEntryDispatcher, IDungeonEntryDispatcherTrait, IERC20MinimalDispatcher,
        IERC20MinimalDispatcherTrait, IUsdcGameProxy, ProxyConfig, SwapKind,
    };

    const MAX_GAMES_PER_CALL: u32 = 50;
    const ONE_TICKET_LOW: u128 = 1000000000000000000;

    #[storage]
    struct Storage {
        usdc: ContractAddress,
        strk: ContractAddress,
        ticket: ContractAddress,
        dungeon: ContractAddress,
        router: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        usdc: ContractAddress,
        strk: ContractAddress,
        ticket: ContractAddress,
        dungeon: ContractAddress,
        router: ContractAddress,
    ) {
        self.usdc.write(usdc);
        self.strk.write(strk);
        self.ticket.write(ticket);
        self.dungeon.write(dungeon);
        self.router.write(router);
    }

    #[abi(embed_v0)]
    impl UsdcGameProxyImpl of IUsdcGameProxy<ContractState> {
        fn buy_game_with_usdc(
            ref self: ContractState,
            max_usdc_in: u256,
            reserve_usdc_in: u256,
            reserve_strk_min_out: u256,
            reserve_swap_kind: SwapKind,
            reserve_swap_calldata: Span<felt252>,
            game_count: u32,
            player_name: Option<felt252>,
            recipient: ContractAddress,
            ticket_swap_kind: SwapKind,
            ticket_swap_calldata: Span<felt252>,
        ) {
            assert(game_count > 0, 'bad game count');
            assert(game_count <= MAX_GAMES_PER_CALL, 'too many games');
            assert(!u256_is_zero(max_usdc_in), 'bad usdc in');
            assert(u256_gte(max_usdc_in, reserve_usdc_in), 'reserve too high');

            let config = load_config(@self);
            let caller = get_caller_address();
            let proxy = get_contract_address();

            let usdc = IERC20MinimalDispatcher { contract_address: config.usdc };
            let strk = IERC20MinimalDispatcher { contract_address: config.strk };
            let ticket = IERC20MinimalDispatcher { contract_address: config.ticket };
            let dungeon = IDungeonEntryDispatcher { contract_address: config.dungeon };

            let usdc_balance_before = usdc.balance_of(proxy);
            let strk_balance_before = strk.balance_of(proxy);
            let ticket_balance_before = ticket.balance_of(proxy);

            assert(usdc.transfer_from(caller, proxy, max_usdc_in), 'usdc pull failed');

            if !u256_is_zero(reserve_usdc_in) {
                assert(!u256_is_zero(reserve_strk_min_out), 'bad strk min');
                assert_swap_targets_token(reserve_swap_kind, reserve_swap_calldata, config.strk);

                assert(usdc.transfer(config.router, reserve_usdc_in), 'reserve transfer');
                execute_router_swap(config.router, reserve_swap_kind, reserve_swap_calldata);
                router_clear_minimum(config.router, config.strk, reserve_strk_min_out);
                router_clear(config.router, config.usdc);
            }

            let remaining_usdc = usdc.balance_of(proxy);
            assert(!u256_is_zero(remaining_usdc), 'no usdc left');

            let required_tickets = compute_required_ticket_amount(game_count);
            assert_swap_targets_token(ticket_swap_kind, ticket_swap_calldata, config.ticket);

            assert(usdc.transfer(config.router, remaining_usdc), 'ticket transfer');
            execute_router_swap(config.router, ticket_swap_kind, ticket_swap_calldata);
            router_clear_minimum(config.router, config.ticket, required_tickets);
            router_clear(config.router, config.usdc);

            let ticket_balance = ticket.balance_of(proxy);
            let swapped_tickets = u256_positive_delta(ticket_balance, ticket_balance_before);

            assert(u256_gte(swapped_tickets, required_tickets), 'few tickets');
            assert(ticket.approve(config.dungeon, required_tickets), 'ticket approve');

            let mut remaining_games = game_count;
            while remaining_games > 0 {
                dungeon.buy_game(DungeonPayment::Ticket, player_name.clone(), recipient, false);
                remaining_games -= 1;
            };

            refund_positive_delta(config.usdc, caller, usdc_balance_before, usdc.balance_of(proxy));
            refund_positive_delta(config.strk, caller, strk_balance_before, strk.balance_of(proxy));
            refund_positive_delta(config.ticket, caller, ticket_balance_before, ticket.balance_of(proxy));
        }

        fn config(self: @ContractState) -> ProxyConfig {
            load_config(self)
        }

        fn required_ticket_amount(self: @ContractState, game_count: u32) -> u256 {
            compute_required_ticket_amount(game_count)
        }
    }

    fn load_config(self: @ContractState) -> ProxyConfig {
        ProxyConfig {
            usdc: self.usdc.read(),
            strk: self.strk.read(),
            ticket: self.ticket.read(),
            dungeon: self.dungeon.read(),
            router: self.router.read(),
        }
    }

    fn compute_required_ticket_amount(game_count: u32) -> u256 {
        let ticket_count_low: u128 = game_count.into();
        u256 { low: ticket_count_low * ONE_TICKET_LOW, high: 0 }
    }

    fn execute_router_swap(router: ContractAddress, swap_kind: SwapKind, swap_calldata: Span<felt252>) {
        let selector = match swap_kind {
            SwapKind::Multihop => selector!("multihop_swap"),
            SwapKind::MultiMultihop => selector!("multi_multihop_swap"),
        };

        call_contract_syscall(router, selector, swap_calldata).unwrap_syscall();
    }

    fn router_clear(router: ContractAddress, token: ContractAddress) {
        let mut calldata = array![];
        calldata.append(token.into());
        call_contract_syscall(router, selector!("clear"), calldata.span()).unwrap_syscall();
    }

    fn router_clear_minimum(router: ContractAddress, token: ContractAddress, minimum: u256) {
        let mut calldata = array![];
        calldata.append(token.into());
        calldata.append(minimum.low.into());
        calldata.append(minimum.high.into());
        call_contract_syscall(router, selector!("clear_minimum"), calldata.span()).unwrap_syscall();
    }

    fn refund_positive_delta(
        token_address: ContractAddress, recipient: ContractAddress, balance_before: u256, balance_after: u256,
    ) {
        if !u256_gt(balance_after, balance_before) {
            return;
        }

        let refund_amount = u256_positive_delta(balance_after, balance_before);
        let token = IERC20MinimalDispatcher { contract_address: token_address };
        assert(token.transfer(recipient, refund_amount), 'refund failed');
    }

    fn assert_swap_targets_token(swap_kind: SwapKind, swap_calldata: Span<felt252>, token: ContractAddress) {
        let token_felt: felt252 = token.into();

        match swap_kind {
            SwapKind::Multihop => {
                assert(swap_calldata.len() >= 4, 'bad swap data');

                let route_len: usize = (*swap_calldata.at(0)).try_into().unwrap();
                assert(route_len > 0, 'empty route');

                let token_index = 1 + route_len * 8;
                let expected_len = token_index + 3;

                assert(swap_calldata.len() == expected_len, 'bad swap data');
                assert(*swap_calldata.at(token_index) == token_felt, 'bad out token');
                assert(*swap_calldata.at(expected_len - 1) == 1, 'bad swap flag');
            },
            SwapKind::MultiMultihop => {
                assert(swap_calldata.len() >= 5, 'bad swap data');

                let split_count: usize = (*swap_calldata.at(0)).try_into().unwrap();
                assert(split_count > 0, 'empty splits');

                let mut offset = 1;
                let mut split_index = 0;

                while split_index < split_count {
                    assert(offset < swap_calldata.len(), 'bad swap data');

                    let route_len: usize = (*swap_calldata.at(offset)).try_into().unwrap();
                    assert(route_len > 0, 'empty route');

                    let token_index = offset + 1 + route_len * 8;
                    let next_offset = token_index + 3;

                    assert(next_offset <= swap_calldata.len(), 'bad swap data');
                    assert(*swap_calldata.at(token_index) == token_felt, 'bad out token');
                    assert(*swap_calldata.at(next_offset - 1) == 1, 'bad swap flag');

                    offset = next_offset;
                    split_index += 1;
                };

                assert(offset == swap_calldata.len(), 'bad swap data');
            },
        }
    }

    fn u256_is_zero(value: u256) -> bool {
        value.low == 0 && value.high == 0
    }

    fn u256_gt(lhs: u256, rhs: u256) -> bool {
        if lhs.high != rhs.high {
            lhs.high > rhs.high
        } else {
            lhs.low > rhs.low
        }
    }

    fn u256_gte(lhs: u256, rhs: u256) -> bool {
        if lhs.high != rhs.high {
            lhs.high > rhs.high
        } else {
            lhs.low >= rhs.low
        }
    }

    fn u256_sub(lhs: u256, rhs: u256) -> u256 {
        if lhs.low >= rhs.low {
            u256 { low: lhs.low - rhs.low, high: lhs.high - rhs.high }
        } else {
            u256 {
                low: lhs.low + (0xffffffffffffffffffffffffffffffff_u128 - rhs.low) + 1_u128,
                high: lhs.high - rhs.high - 1_u128,
            }
        }
    }

    fn u256_zero() -> u256 {
        u256 { low: 0, high: 0 }
    }

    fn u256_positive_delta(after: u256, before: u256) -> u256 {
        if u256_gt(after, before) {
            u256_sub(after, before)
        } else {
            u256_zero()
        }
    }
}
