import { ChainId, getNetworkConfig, NetworkConfig, NETWORKS } from "@/utils/networkConfig";
import { stringToFelt } from "@/utils/utils";
import ControllerConnector from "@cartridge/connector/controller";
import { mainnet, sepolia } from "@starknet-react/chains";
import { jsonRpcProvider, StarknetConfig, voyager } from "@starknet-react/core";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";

interface DynamicConnectorContext {
  setCurrentNetworkConfig: (network: NetworkConfig) => void;
  currentNetworkConfig: NetworkConfig;
  dojoConfig: {
    manifest: any;
    rpcUrl: string;
    toriiUrl: string;
    namespace: string;
    chainId: string;
    slot: string;
  };
}

const DynamicConnectorContext = createContext<DynamicConnectorContext | null>(null);

const initialNetworkKey = import.meta.env.VITE_PUBLIC_DEFAULT_CHAIN || ChainId.SN_MAIN;
const initialConfig = getNetworkConfig(initialNetworkKey);
const allChains = Object.values(NETWORKS).map(network => ({
  rpcUrl: network.rpcUrl
}));

const cartridgeController = typeof window !== "undefined" ? new ControllerConnector({
  policies: initialConfig.policies,
  namespace: initialConfig.namespace,
  slot: initialConfig.slot,
  preset: initialConfig.preset,
  chains: allChains,
  defaultChainId: stringToFelt(initialConfig.chainId).toString(),
  tokens: initialConfig.tokens,
}) : null;

export function DynamicConnectorProvider({ children }: PropsWithChildren) {

  const [currentNetworkConfig, setCurrentNetworkConfig] = useState<NetworkConfig>(initialConfig);

  // Create dynamic dojoConfig based on current network
  const dojoConfig = useMemo(() => {
    const network = NETWORKS[currentNetworkConfig.chainId as keyof typeof NETWORKS];
    if (!network) {
      throw new Error(`Network configuration not found for: ${currentNetworkConfig.chainId}`);
    }

    return {
      manifest: network.manifest,
      rpcUrl: network.rpcUrl,
      toriiUrl: network.torii,
      namespace: network.namespace,
      chainId: network.chainId,
      slot: network.slot,
    };
  }, [currentNetworkConfig.chainId]);


  const rpc = useCallback(() => {
    return { nodeUrl: currentNetworkConfig.chains[0].rpcUrl };
  }, [currentNetworkConfig.chains]);

  return (
    <DynamicConnectorContext.Provider value={{
      setCurrentNetworkConfig,
      currentNetworkConfig,
      dojoConfig
    }}>
      <StarknetConfig
        chains={[mainnet, sepolia]}
        provider={jsonRpcProvider({ rpc })}
        connectors={[cartridgeController as any]}
        explorer={voyager}
        autoConnect={true}
      >
        {children}
      </StarknetConfig>
    </DynamicConnectorContext.Provider>
  );
}

export function useDynamicConnector() {
  const context = useContext(DynamicConnectorContext);
  if (!context) {
    throw new Error('useDynamicConnector must be used within a DynamicConnectorProvider');
  }
  return context;
}

// Convenience hook to get just the dojoConfig
export function useDojoConfig() {
  const { dojoConfig } = useDynamicConnector();
  return dojoConfig;
}
