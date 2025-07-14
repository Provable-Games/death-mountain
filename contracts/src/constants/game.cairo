// SPDX-License-Identifier: MIT

pub const MINIMUM_DAMAGE_FROM_BEASTS: u8 = 2;
pub const MAINNET_CHAIN_ID: felt252 = 0x534e5f4d41494e;
pub const SEPOLIA_CHAIN_ID: felt252 = 0x534e5f5345504f4c4941;
pub const KATANA_CHAIN_ID: felt252 = 0x4b4154414e41;
pub const MINIMUM_SCORE_FOR_PAYOUTS: u16 = 64;
pub const MINIMUM_SCORE_FOR_DEATH_RANK: u16 = 100;
pub const SECONDS_IN_DAY: u32 = 86400;
pub const TARGET_PRICE_USD_CENTS: u16 = 300;
pub const VRF_COST_PER_GAME: u32 = 50000000; // $0.50 with 8 decimals
pub const PRAGMA_PUBLISH_DELAY: u8 = 0;
pub const PRAGMA_NUM_WORDS: u8 = 1;
pub const GAME_EXPIRY_DAYS: u8 = 10;
pub const STARTER_BEAST_ATTACK_DAMAGE: u16 = 10;
pub const DAO_CONTRACT_REWARD_ADVENTURER: u8 = 2;
pub const PG_CONTRACT_REWARD_ADVENTURER: u8 = 3;

pub mod messages {
    pub const NOT_ENOUGH_GOLD: felt252 = 'Not enough gold';
    pub const ITEM_DOES_NOT_EXIST: felt252 = 'Market item does not exist';
    pub const MARKET_CLOSED: felt252 = 'Market is closed';
    pub const ITEM_NOT_IN_BAG: felt252 = 'Item not in bag';
    pub const INVALID_STARTING_WEAPON: felt252 = 'Invalid starting weapon';
    pub const STAT_POINT_NOT_AVAILABLE: felt252 = 'Stat point not available';
    pub const NOT_IN_BATTLE: felt252 = 'Not in battle';
    pub const ACTION_NOT_ALLOWED_DURING_BATTLE: felt252 = 'Action not allowed in battle';
    pub const CANT_FLEE_STARTER_BEAST: felt252 = 'Cant flee starter beast';
    pub const CANT_DROP_DURING_STARTER_BEAST: felt252 = 'Cant drop during starter beast';
    pub const STAT_UPGRADES_AVAILABLE: felt252 = 'Stat upgrade available';
    pub const BLOCK_NUMBER_ERROR: felt252 = 'Too soon update';
    pub const DEAD_ADVENTURER: felt252 = 'Adventurer is dead';
    pub const ADVENTURER_IS_ALIVE: felt252 = 'Adventurer is still alive';
    pub const HEALTH_FULL: felt252 = 'Health already full';
    pub const ADVENTURER_NOT_EXPIRED: felt252 = 'Adventurer not expired';
    pub const GAME_EXPIRED: felt252 = 'Game has expired';
    pub const ONE_EXPLORE_PER_BLOCK: felt252 = 'One explore per block';
    pub const INSUFFICIENT_STAT_UPGRADES: felt252 = 'insufficient stat upgrades';
    pub const TOO_MANY_ITEMS: felt252 = 'Too many items';
    pub const ITEM_ALREADY_OWNED: felt252 = 'Item already owned';
    pub const ADVENTURER_DOESNT_OWN_ITEM: felt252 = 'Adventurer doesnt own item';
    pub const ZERO_DEXTERITY: felt252 = 'Cant flee, no dexterity';
    pub const WRONG_NUM_STARTING_STATS: felt252 = 'Wrong starting stat count';
    pub const MUST_USE_ALL_STATS: felt252 = 'Must use all stats';
    pub const NO_ITEMS: felt252 = 'Must provide item ids';
    pub const NON_ZERO_STARTING_LUCK: felt252 = 'Luck must be zero';
    pub const RATE_LIMIT_EXCEEDED: felt252 = 'rate limit exceeded';
    pub const NOT_ON_LEADERBOARD: felt252 = 'Not on leaderboard';
    pub const TIME_NOT_REACHED: felt252 = 'Time not reached';
    pub const CANNOT_PLAY_WITH_TOKEN: felt252 = 'Token already used today';
    pub const MA_PERIOD_LESS_THAN_WEEK: felt252 = 'MA period too small';
    pub const TERMINAL_TIME_REACHED: felt252 = 'terminal time reached';
    pub const STARTING_ENTROPY_ALREADY_SET: felt252 = 'starting entropy already set';
    pub const STARTING_ENTROPY_ZERO: felt252 = 'block hash should not be zero';
    pub const GAME_ALREADY_STARTED: felt252 = 'game already started';
    pub const STARTING_ENTROPY_IS_VALID: felt252 = 'starting entropy is valid';
    pub const VALID_BLOCK_HASH_UNAVAILABLE: felt252 = 'valid hash not yet available';
    pub const LEVEL_SEED_NOT_SET: felt252 = 'level seed not set';
    pub const WAITING_FOR_ITEM_SPECIALS: felt252 = 'waiting for item specials';
    pub const FETCHING_ETH_PRICE_ERROR: felt252 = 'error fetching eth price';
    pub const OBITUARY_ALREADY_SET: felt252 = 'obituary already set';
    pub const OBITUARY_WINDOW_CLOSED: felt252 = 'obituary window closed';
    pub const INVALID_ITEM_ID: felt252 = 'invalid item id';
    pub const LAUNCH_TOURNAMENT_ENDED: felt252 = 'launch tournament has ended';
    pub const COLLECTION_NOT_ELIGIBLE: felt252 = 'nft collection not eligible';
    pub const NOT_TOKEN_OWNER: felt252 = 'not token owner';
    pub const TOKEN_ALREADY_REGISTERED: felt252 = 'token already registered';
    pub const ITEM_SPECIALS_UNAVAILABLE: felt252 = 'item specials unavailable';
    pub const TOURNAMENT_STILL_ACTIVE: felt252 = 'tournament still active';
    pub const TOURNAMENT_WINNER_ALREADY_SET: felt252 = 'tournament already settled';
    pub const FREE_GAME_UNAVAILABLE: felt252 = 'free game not yet available';
    pub const NOT_PARTICIPATED_IN_TOURNAMENT: felt252 = 'not tournament participant';
    pub const COLLECTION_OUT_OF_GAMES: felt252 = 'collection out of games';
    pub const GAME_NOT_LIVE: felt252 = 'game not live';
}

#[derive(Drop, Copy)]
pub struct Rewards {
    pub BIBLIO: u128,
    pub PG: u128,
    pub CLIENT_PROVIDER: u128,
    pub FIRST_PLACE: u128,
    pub SECOND_PLACE: u128,
    pub THIRD_PLACE: u128,
}

pub mod REWARD_DISTRIBUTIONS_BP {
    pub const CLIENT_PROVIDER: u128 = 270;
    pub const FIRST_PLACE: u128 = 270;
    pub const SECOND_PLACE: u128 = 160;
    pub const THIRD_PLACE: u128 = 100;
    pub const CREATOR: u128 = 200;
}
