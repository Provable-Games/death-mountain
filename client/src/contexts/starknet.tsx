import {
  getDefaultChainId,
  getNetworkConfig,
  NetworkConfig,
} from "@/utils/networkConfig";
import { stringToFelt } from "@/utils/utils";
import ControllerConnector from "@cartridge/connector/controller";
import { mainnet, sepolia } from "@starknet-react/chains";
import { jsonRpcProvider, StarknetConfig, voyager } from "@starknet-react/core";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState
} from "react";

interface DynamicConnectorContext {
  setCurrentNetworkConfig: (network: NetworkConfig) => void;
  currentNetworkConfig: NetworkConfig;
}

const DynamicConnectorContext = createContext<DynamicConnectorContext | null>(
  null
);

// Resolve network from VITE_NETWORK env var (defaults to mainnet)
const defaultChainId = getDefaultChainId();
const controllerConfig = getNetworkConfig(defaultChainId);

const cartridgeController =
  typeof window !== "undefined"
    ? new ControllerConnector({
      policies: controllerConfig.policies,
      shouldOverridePresetPolicies: true,
      namespace: controllerConfig.namespace,
      slot: controllerConfig.slot,
      preset: controllerConfig.preset,
      chains: controllerConfig.chains,
      defaultChainId: stringToFelt(controllerConfig.chainId).toString(),
    })
    : null;

// Pick the matching starknet-react chain definition
const starknetChain = defaultChainId === "SN_SEPOLIA" ? sepolia : mainnet;

// Only auto-connect on mainnet — on other networks, force a fresh connection
// to avoid restoring a stale mainnet session from the Controller iframe.
const shouldAutoConnect = defaultChainId === "SN_MAIN";

export function DynamicConnectorProvider({ children }: PropsWithChildren) {
  const [currentNetworkConfig, setCurrentNetworkConfig] =
    useState<NetworkConfig>(controllerConfig);

  const rpc = useCallback(() => {
    return { nodeUrl: controllerConfig.chains[0].rpcUrl };
  }, []);

  return (
    <DynamicConnectorContext.Provider
      value={{
        setCurrentNetworkConfig,
        currentNetworkConfig,
      }}
    >
      <StarknetConfig
        chains={[starknetChain]}
        provider={jsonRpcProvider({ rpc })}
        connectors={[cartridgeController as any]}
        explorer={voyager}
        autoConnect={shouldAutoConnect}
      >
        {children}
      </StarknetConfig>
    </DynamicConnectorContext.Provider>
  );
}

export function useDynamicConnector() {
  const context = useContext(DynamicConnectorContext);
  if (!context) {
    throw new Error(
      "useDynamicConnector must be used within a DynamicConnectorProvider"
    );
  }
  return context;
}
