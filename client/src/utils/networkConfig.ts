import manifest_mainnet from "../../manifest_mainnet.json";
import manifest_slot from "../../manifest_slot.json";
import { ContractPolicies, ContractPolicy, SessionPolicies} from "@cartridge/presets";

export interface NetworkConfig {
  chainId: ChainId;
  namespace: string;
  manifest: any;
  slot: string;
  preset: string;
  policies:
  | Array<{
    target: string;
    method: string;
  }>
  | undefined;
  vrf: boolean;
  rpcUrl: string;
  toriiUrl: string;
  chains: Array<{
    rpcUrl: string;
  }>;
  tokens: any;
  denshokan: string;
  paymentTokens: any[];
  goldenToken: string;
  ekuboRouter: string;
  beasts: string;
  gameAddress: string;
}

export enum ChainId {
  WP_PG_SLOT = "WP_PG_SLOT",
  SN_MAIN = "SN_MAIN",
  SN_SEPOLIA = "SN_SEPOLIA",
}

export const NETWORKS = {
  SN_MAIN: {
    chainId: ChainId.SN_MAIN,
    namespace: "ls_0_0_9",
    slot: "pg-mainnet-10",
    rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet/rpc/v0_9",
    torii: "https://api.cartridge.gg/x/pg-mainnet-10/torii",
    tokens: {
      erc20: [
        "0x042dd777885ad2c116be96d4d634abc90a26a790ffb5871e037dd5ae7d2ec86b",
        "0x0452810188C4Cb3AEbD63711a3b445755BC0D6C4f27B923fDd99B1A118858136",
      ],
    },
    manifest: manifest_mainnet,
    vrf: true,
    denshokan:
      "0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd",
    gameAddress:
      "0x05e2dfbdc3c193de629e5beb116083b06bd944c1608c9c793351d5792ba29863",
    beasts:
      "0x046da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4",
    goldenToken:
      "0x027838dea749f41c6f8a44fcfa791788e6101080c1b3cd646a361f653ad10e2d",
    ekuboRouter:
      "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e",
    paymentTokens: [
      {
        name: "LORDS",
        address:
          "0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49",
        displayDecimals: 0,
      },
      {
        name: "ETH",
        address:
          "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        displayDecimals: 4,
      },
      {
        name: "STRK",
        address:
          "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
        displayDecimals: 2,
      },
      {
        name: "USDC.e Bridged",
        address:
          "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
        displayDecimals: 2,
        decimals: 6,
      },
      {
        name: "USDC",
        address:
          "0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb",
        displayDecimals: 2,
        decimals: 6,
      },
      {
        name: "TICKET",
        address:
          "0x0452810188C4Cb3AEbD63711a3b445755BC0D6C4f27B923fDd99B1A118858136",
        displayDecimals: 0,
      },
      {
        name: "SURVIVOR",
        address:
          "0x042DD777885AD2C116be96d4D634abC90A26A790ffB5871E037Dd5Ae7d2Ec86B",
        displayDecimals: 0,
      },
    ],
  },
  WP_PG_SLOT: {
    chainId: ChainId.WP_PG_SLOT,
    namespace: "ls_0_0_6",
    slot: "pg-slot-5",
    rpcUrl: "https://api.cartridge.gg/x/pg-slot-4/katana",
    torii: "https://api.cartridge.gg/x/pg-slot-5/torii",
    tokens: {
      erc20: [],
    },
    manifest: manifest_slot,
    vrf: false,
    paymentTokens: [],
    denshokan:
      "0x01d3950941c7cbb80160d2fd3f112bb9885244833e547b298dfed040ce1e140f",
    gameAddress:
      "0x056a32ac6baa3d3e2634d55e6f2ca07bfee4ab09c6c6f0b93d456b0a6da4c84c",
    goldenToken: "",
    ekuboRouter: "",
    beasts: "",
  },
};

export function getNetworkConfig(networkKey: ChainId): NetworkConfig {
  const network = NETWORKS[networkKey as keyof typeof NETWORKS];
  if (!network) throw new Error(`Network ${networkKey} not found`);

  const policies = undefined;

  return {
    chainId: network.chainId,
    namespace: network.namespace,
    manifest: network.manifest,
    slot: network.slot,
    preset: "loot-survivor",
    vrf: network.vrf,
    policies,
    rpcUrl: network.rpcUrl,
    toriiUrl: network.torii,
    chains: [{ rpcUrl: network.rpcUrl }],
    tokens: network.tokens,
    paymentTokens: network.paymentTokens,
    denshokan: network.denshokan,
    goldenToken: network.goldenToken,
    ekuboRouter: network.ekuboRouter,
    beasts: network.beasts,
    gameAddress: network.gameAddress,
  };
}

export function getNativePolicies(networkKey: ChainId): SessionPolicies {
  const network = NETWORKS[networkKey as keyof typeof NETWORKS];
  if (!network) throw new Error(`Network ${networkKey} not found`);

  const contractPolicies: ContractPolicies = {
    // Dungeon Ticket
    "0x0452810188c4cb3aebd63711a3b445755bc0d6c4f27b923fdd99b1a118858136": {
      methods: [
        {
          name: "Approve",
          entrypoint: "approve"
        }
      ]
    },
    // EKUBO
    "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e": {
      methods: [
        {
          name: "Multihop Swap",
          entrypoint: "multihop_swap",
        },
        {
          name: "Clear Minimum",
          entrypoint: "clear_minimum",
        },
        {
          name: "Clear",
          entrypoint: "clear",
        },
      ]
    },
    // LS2
    "0x00a67ef20b61a9846e1c82b411175e6ab167ea9f8632bd6c2091823c3629ec42": {
      methods: [
        {
          name: "Buy Game",
          entrypoint: "buy_game"
        }
      ]
    },

    // Rest of presets from "loot-survivor"
    "0x5e2dfbdc3c193de629e5beb116083b06bd944c1608c9c793351d5792ba29863": {
      description: "Token contract for Death Mountain utilising Denshokan",
      methods: [
        {
          name: "Mint Game Token",
          description: "Mints a new Death Mountain game token",
          entrypoint: "mint_game"
        }
      ]
    },
    "0x6f7c4350d6d5ee926b3ac4fa0c9c351055456e75c92227468d84232fc493a9c": {
      description: "Main game contract for Loot Survivor gameplay",
      methods: [
        {
          name: "Start Game",
          description: "Starts a new adventure in Loot Survivor",
          entrypoint: "start_game"
        },
        {
          name: "Explore",
          description: "Explore the dungeon",
          entrypoint: "explore"
        },
        {
          name: "Attack",
          description: "Attack enemies in combat",
          entrypoint: "attack"
        },
        {
          name: "Flee",
          description: "Attempt to flee from combat",
          entrypoint: "flee"
        },
        {
          name: "Buy Items",
          description: "Purchase items from the market",
          entrypoint: "buy_items"
        },
        {
          name: "Equip Item",
          description: "Equip an item from your inventory",
          entrypoint: "equip"
        },
        {
          name: "Drop Item",
          description: "Drop an item from your inventory",
          entrypoint: "drop"
        },
        {
          name: "Select Stat Upgrades",
          description: "Choose which stats to upgrade when leveling up",
          entrypoint: "select_stat_upgrades"
        }
      ]
    },
    "0xa67ef20b61a9846e1c82b411175e6ab167ea9f8632bd6c2091823c3629ec42": {
      description: "Special dungeon mode with beast NFT rewards and jackpot system",
      methods: [
        {
          name: "Buy Game",
          description: "Purchase access to Beast Mode Dungeon",
          entrypoint: "buy_game"
        },
        {
          name: "Claim Beast",
          description: "Claim your earned beast NFT",
          entrypoint: "claim_beast"
        },
        {
          name: "Claim Reward Token",
          description: "Claim your reward tokens",
          entrypoint: "claim_reward_token"
        },
        {
          name: "Claim Jackpot",
          description: "Claim the jackpot rewards",
          entrypoint: "claim_jackpot"
        }
      ]
    },
    "0x046da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4": {
      description: "beast NFT contract",
      methods: [
        {
          name: "Refresh Dungeon Stats",
          description: "Updates beast dungeon stats",
          entrypoint: "refresh_dungeon_stats"
        }
      ]
    },
    "0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f": {
      description: "Verifiable Random Function contract, allows randomness in the game",
      methods: [
        {
          name: "Request Random",
          description: "Allows requesting random numbers from the VRF provider",
          entrypoint: "request_random"
        }
      ]
    },
    "0x3299ace782ec54afcbf81e31e92d6146649b6c484173e41f4de529f6d504fe8": {
      description: "Contract for claiming free game tokens through eligibility verification",
      methods: [
        {
          name: "Verify and Forward",
          description: "Verify eligibility and claim free games",
          entrypoint: "verify_and_forward"
        }
      ]
    }
  }

  const policiesWithPayments = contractPolicies as Record<string, ContractPolicy>;
  network.paymentTokens.map((token) => {
    return {
      name: token.name,
      address: token.address
    }
  }).forEach((token) => {
    policiesWithPayments[token.address] = {
      methods: [
        {
          name: "Transfer",
          entrypoint: "transfer"
        }
      ],
      description: `Approve of transfer of ${token.name} tokens.`
    };
  });

  return {
    contracts: policiesWithPayments
  };
}

export function translateName(network: string): ChainId | null {
  network = network.toLowerCase();

  if (network === "mainnet") {
    return ChainId.SN_MAIN;
  } else if (network === "sepolia") {
    return ChainId.SN_SEPOLIA;
  } else if (network === "katana") {
    return ChainId.WP_PG_SLOT;
  }

  return null;
}
