import { getContractByName } from "@dojoengine/core";
import manifest_sepolia from "../../manifest_sepolia.json";
import manifest_slot from "../../manifest_slot.json";
import { Tokens } from "@cartridge/controller";

export interface NetworkConfig {
  chainId: ChainId;
  name: string;
  status: string;
  namespace: string;
  slot: string;
  preset: string;
  policies: Array<{
    target: string;
    method: string;
  }>;
  vrf: boolean;
  chains: Array<{
    rpcUrl: string;
  }>;
  tokens: Tokens;
}

export enum ChainId {
  WP_PG_SLOT = "WP_PG_SLOT",
  SN_MAIN = "SN_MAIN",
  SN_SEPOLIA = "SN_SEPOLIA",
}

export const NETWORKS = {
  SN_MAIN: {
    chainId: ChainId.SN_MAIN,
    name: "Mainnet",
    status: "offline",
    namespace: "ls_0_0_1",
    slot: "pg-mainnet",
    rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet",
    torii: "https://api.cartridge.gg/x/pg-mainnet/torii",
    tokens: {
      erc20: [],
    },
    manifest: manifest_sepolia,
    vrf: true,
  },
  SN_SEPOLIA: {
    chainId: ChainId.SN_SEPOLIA,
    name: "Sepolia",
    status: "offline",
    namespace: "ls_0_0_1",
    slot: "pg-sepolia",
    rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    torii: "https://api.cartridge.gg/x/pg-sepolia/torii",
    tokens: {
      erc20: [],
    },
    manifest: manifest_sepolia,
    vrf: true,
  },
  WP_PG_SLOT: {
    chainId: ChainId.WP_PG_SLOT,
    name: "Katana",
    status: "online",
    namespace: "ls_0_0_3",
    slot: "pg-slot",
    rpcUrl: "https://api.cartridge.gg/x/pg-slot-2/katana",
    torii: "https://api.cartridge.gg/x/pg-slot-2/torii",
    tokens: {
      erc20: [],
    },
    manifest: manifest_slot,
    vrf: false,
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
  const policies = [
    {
      target: game_token_systems,
      method: "mint",
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
  ];

  return {
    chainId: network.chainId,
    name: network.name,
    status: network.status,
    namespace: network.namespace,
    slot: network.slot,
    preset: "loot-survivor",
    vrf: network.vrf,
    policies,
    chains: [{ rpcUrl: network.rpcUrl }],
    tokens: network.tokens,
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
