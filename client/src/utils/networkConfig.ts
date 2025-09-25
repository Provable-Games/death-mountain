import { getContractByName } from "@dojoengine/core";
import manifest_mainnet from "../../manifest_mainnet.json";
import manifest_sepolia from "../../manifest_sepolia.json";
import manifest_slot from "../../manifest_slot.json";

export interface NetworkConfig {
  chainId: ChainId;
  name: string;
  status: string;
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
  dungeon: string;
  dungeonTicket: string;
  beasts: string;
}

export enum ChainId {
  WP_PG_SLOT = "WP_PG_SLOT",
  SN_MAIN = "SN_MAIN",
  SN_SEPOLIA = "SN_SEPOLIA",
}

export const NETWORKS = {
  SN_MAIN: {
    chainId: ChainId.SN_MAIN,
    name: "Beast Mode",
    status: "online",
    namespace: "ls_0_0_9",
    slot: "pg-mainnet-5",
    rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet/rpc/v0_9",
    torii: "https://api.cartridge.gg/x/pg-mainnet-5/torii",
    tokens: {
      erc20: [
        "0x042dd777885ad2c116be96d4d634abc90a26a790ffb5871e037dd5ae7d2ec86b",
      ],
    },
    manifest: manifest_mainnet,
    vrf: true,
    denshokan:
      "0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd",
    dungeon:
      "0x00a67ef20b61a9846e1c82b411175e6ab167ea9f8632bd6c2091823c3629ec42",
    dungeonTicket:
      "0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49",
    beasts:
      "0x046da8955829adf2bda310099a0063451923f02e648cf25a1203aac6335cf0e4",
    goldenToken:
      "0x027838dea749f41c6f8a44fcfa791788e6101080c1b3cd646a361f653ad10e2d",
    ekuboRouter:
      "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e",
    paymentTokens: [
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
        name: "USDC",
        address:
          "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
        displayDecimals: 2,
        decimals: 6,
      },
      {
        name: "TICKET",
        address:
          "0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49",
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
  SN_SEPOLIA: {
    chainId: ChainId.SN_SEPOLIA,
    name: "Beast Mode",
    status: "online",
    namespace: "ls_0_0_6",
    slot: "pg-sepolia",
    rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia/rpc/v0_9",
    torii: "https://api.cartridge.gg/x/pg-sepolia/torii",
    tokens: {
      erc20: [],
    },
    manifest: manifest_sepolia,
    vrf: true,
    denshokan:
      "0x0610aba32da98547f9f65fe0195cc60c08f1ef6fa2f2a0fc03e35f1c29319fd3",
    dungeon:
      "0x02b481049177d5947b7ac5b40ae231c14af517c8cdc5506fb2529f064fc47edd",
    dungeonTicket:
      "0x025ff15ffd980fa811955d471abdf0d0db40f497a0d08e1fedd63545d1f7ab0d",
    beasts:
      "0x03d6e75fd8270a5098987713fa2c766a3edd0b03161ffeebe81b27dc48a3f335",
    goldenToken:
      "0x031d69dbf2f3057f8c52397d0054b43e6ee386eb6b3454fa66a3d2b770a5c2da",
    ekuboRouter:
      "0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763",
    paymentTokens: [
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
        name: "USDC",
        address:
          "0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080",
        displayDecimals: 2,
        decimals: 6,
      },
      {
        name: "TICKET",
        address:
          "0x025ff15ffd980fa811955d471abdf0d0db40f497a0d08e1fedd63545d1f7ab0d",
        displayDecimals: 0,
      },
    ],
  },
  WP_PG_SLOT: {
    chainId: ChainId.WP_PG_SLOT,
    name: "Practice Mode",
    status: "online",
    namespace: "ls_0_0_6",
    slot: "pg-slot-4",
    rpcUrl: "https://api.cartridge.gg/x/pg-slot-4/katana",
    torii: "https://api.cartridge.gg/x/pg-slot-4/torii",
    tokens: {
      erc20: [],
    },
    manifest: manifest_slot,
    vrf: false,
    paymentTokens: [],
    denshokan:
      "0x01d3950941c7cbb80160d2fd3f112bb9885244833e547b298dfed040ce1e140f",
    goldenToken: "",
    ekuboRouter: "",
    dungeon: "",
    dungeonTicket: "",
    beasts: "",
  },
};

export function getNetworkConfig(networkKey: ChainId): NetworkConfig {
  const network = NETWORKS[networkKey as keyof typeof NETWORKS];
  if (!network) throw new Error(`Network ${networkKey} not found`);

  const namespace = network.namespace;
  const manifest = network.manifest;

  // Get contract addresses from manifest
  const game_systems = getContractByName(
    manifest,
    namespace,
    "game_systems"
  )?.address;
  const game_token_systems = getContractByName(
    manifest,
    namespace,
    "game_token_systems"
  )?.address;
  const vrf_provider = import.meta.env.VITE_PUBLIC_VRF_PROVIDER_ADDRESS;

  // Base policies that are common across networks
  const policies =
    network.chainId === ChainId.SN_MAIN
      ? undefined
      : [
          {
            target:
              "0x025ff15ffd980fa811955d471abdf0d0db40f497a0d08e1fedd63545d1f7ab0d",
            method: "approve",
          },
          {
            target: game_token_systems,
            method: "mint_game",
          },
          {
            target: game_systems,
            method: "start_game",
          },
          {
            target: game_systems,
            method: "explore",
          },
          {
            target: game_systems,
            method: "attack",
          },
          {
            target: game_systems,
            method: "flee",
          },
          {
            target: game_systems,
            method: "buy_items",
          },
          {
            target: game_systems,
            method: "equip",
          },
          {
            target: game_systems,
            method: "drop",
          },
          {
            target: game_systems,
            method: "select_stat_upgrades",
          },
          {
            target: vrf_provider,
            method: "request_random",
          },
          {
            target: network.dungeon,
            method: "buy_game",
          },
          {
            target: network.dungeon,
            method: "claim_beast",
          },
          {
            target: network.dungeon,
            method: "claim_reward_token",
          },
          {
            target: network.dungeon,
            method: "claim_jackpot",
          },
        ];

  return {
    chainId: network.chainId,
    name: network.name,
    status: network.status,
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
    dungeon: network.dungeon,
    dungeonTicket: network.dungeonTicket,
    beasts: network.beasts,
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
