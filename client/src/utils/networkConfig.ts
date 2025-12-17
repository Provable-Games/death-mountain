import manifest_mainnet from "../../manifest_mainnet.json";
import manifest_slot from "../../manifest_slot.json";

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
        name: "USDC",
        address:
          "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
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
