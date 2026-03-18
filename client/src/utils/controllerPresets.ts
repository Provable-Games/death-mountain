export interface ControllerPolicy {
  target: string;
  method: string;
}

export type LocalControllerPresetName = "base" | "swap-paymaster";
export type ControllerNetworkKey = "WP_PG_SLOT" | "SN_MAIN" | "SN_SEPOLIA";

type NetworkPresetMap = Record<LocalControllerPresetName, ControllerPolicy[]>;

// Proxy contract address (mainnet)
const GAME_PROXY_MAINNET = "0x02f9adcc117bb608070d355bfc6387fd92f88aa9036f5e456bcb563ef2190d1c";

const MAINNET_PRESETS: NetworkPresetMap = {
  base: [
    { target: "0x0452810188c4cb3aebd63711a3b445755bc0d6c4f27b923fdd99b1a118858136", method: "approve" },
    { target: "0x00a67ef20b61a9846e1c82b411175e6ab167ea9f8632bd6c2091823c3629ec42", method: "buy_game" },
    // USDC approve for proxy + proxy entry point
    { target: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb", method: "approve" },
    { target: GAME_PROXY_MAINNET, method: "buy_game_with_usdc" },
  ],
  "swap-paymaster": [
    { target: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", method: "transfer" },
    { target: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb", method: "transfer" },
    { target: "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e", method: "clear" },
    { target: "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e", method: "clear_minimum" },
    { target: "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e", method: "multihop_swap" },
    { target: "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e", method: "multi_multihop_swap" },
  ],
};

const SEPOLIA_PRESETS: NetworkPresetMap = {
  base: [
    { target: "0x7ae26eecf0274aabb31677753ff3a4e15beec7268fa1b104f73ce3c89202831", method: "approve" },
    { target: "0x3012c0bab9e1fb18c36ef4ce02876e2070bf679be4178aa451b6e9d0904a34f", method: "buy_game" },
  ],
  "swap-paymaster": [
    { target: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", method: "transfer" },
    { target: "0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763", method: "clear" },
    { target: "0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763", method: "clear_minimum" },
    { target: "0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763", method: "multihop_swap" },
    { target: "0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763", method: "multi_multihop_swap" },
  ],
};

const PRESETS_BY_NETWORK: Partial<Record<ControllerNetworkKey, NetworkPresetMap>> = {
  SN_MAIN: MAINNET_PRESETS,
  SN_SEPOLIA: SEPOLIA_PRESETS,
};

export const DEFAULT_LOCAL_CONTROLLER_PRESETS: LocalControllerPresetName[] = [
  "base",
  "swap-paymaster",
];

export function getLocalControllerPolicies(
  networkKey: ControllerNetworkKey,
  presetNames: LocalControllerPresetName[] = DEFAULT_LOCAL_CONTROLLER_PRESETS
): ControllerPolicy[] {
  const networkPresets = PRESETS_BY_NETWORK[networkKey];
  if (!networkPresets) return [];

  const merged = presetNames.flatMap((presetName) => networkPresets[presetName] || []);
  const deduped = new Map<string, ControllerPolicy>();

  for (const policy of merged) {
    deduped.set(`${policy.target}:${policy.method}`, policy);
  }

  return Array.from(deduped.values());
}
