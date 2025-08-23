import { ChainId, getNetworkConfig, NetworkConfig, NETWORKS } from "@/utils/networkConfig";
import { stringToFelt } from "@/utils/utils";
import ControllerConnector from "@cartridge/connector/controller";
import { sepolia } from "@starknet-react/chains";
import { jsonRpcProvider, StarknetConfig, voyager } from "@starknet-react/core";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { Contract } from "starknet";

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

const controllerConfig = getNetworkConfig(import.meta.env.VITE_PUBLIC_CHAIN);
const cartridgeController = typeof window !== "undefined" ? new ControllerConnector({
  policies: controllerConfig.policies,
  namespace: controllerConfig.namespace,
  slot: controllerConfig.slot,
  preset: controllerConfig.preset,
  chains: controllerConfig.chains,
  defaultChainId: stringToFelt(controllerConfig.chainId).toString(),
  tokens: controllerConfig.tokens,
}) : null;

export function DynamicConnectorProvider({ children }: PropsWithChildren) {
  const getInitialNetwork = (): NetworkConfig => {
    if (typeof window !== "undefined") {
      const savedNetwork = localStorage.getItem("lastSelectedNetwork");
      if (savedNetwork) {
        try {
          const chainId = savedNetwork as ChainId;
          if (Object.values(ChainId).includes(chainId)) {
            return getNetworkConfig(chainId);
          }
        } catch (error) {
          console.warn("Invalid saved network, using default:", error);
        }
      }
    }
    return getNetworkConfig(import.meta.env.VITE_PUBLIC_DEFAULT_CHAIN as ChainId);
  };

  const [currentNetworkConfig, setCurrentNetworkConfig] = useState<NetworkConfig>(getInitialNetwork);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastSelectedNetwork", currentNetworkConfig.chainId);
    }
  }, [currentNetworkConfig.chainId]);

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
    return { nodeUrl: controllerConfig.chains[0].rpcUrl };
  }, []);

  return (
    <DynamicConnectorContext.Provider value={{
      setCurrentNetworkConfig,
      currentNetworkConfig,
      dojoConfig
    }}>
      <StarknetConfig
        chains={[sepolia]}
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
