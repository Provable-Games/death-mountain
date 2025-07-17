import { ChainId, getNetworkConfig, NetworkConfig, NETWORKS, translateName } from "@/utils/networkConfig";
import { stringToFelt } from "@/utils/utils";
import { ControllerConnector } from "@cartridge/connector";
import { mainnet, sepolia } from "@starknet-react/chains";
import { jsonRpcProvider, StarknetConfig, voyager } from "@starknet-react/core";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useRef, useState } from "react";

// Helper function to clean up Cartridge iframes
function cleanupCartridgeIframes() {
  try {
    const iframes = document.querySelectorAll('iframe[src*="cartridge"], iframe[src*="keychain"], iframe[src*="profile"]');
    iframes.forEach(iframe => iframe.remove());

    const containers = document.querySelectorAll('[data-cartridge], .cartridge-container');
    containers.forEach(container => container.remove());
  } catch (error) {
    console.error('Error cleaning up Cartridge iframes:', error);
  }
}

const NETWORK_STORAGE_KEY = 'loot-survivor-last-network';

function useDynamicControllerConnector(networkConfig: NetworkConfig) {
  const previousConnectorRef = useRef<ControllerConnector | null>(null);

  return useMemo(() => {
    // Clean up any existing Cartridge iframes first
    cleanupCartridgeIframes();

    // Clean up previous connector reference
    if (previousConnectorRef.current) {
      previousConnectorRef.current = null;
    }

    // Get all available networks for the connector
    const allChains = Object.values(NETWORKS).map(network => ({
      rpcUrl: network.rpcUrl
    }));

    // Create connector
    let connector: ControllerConnector;
    try {
      connector = new ControllerConnector({
        policies: networkConfig.policies,
        namespace: networkConfig.namespace,
        slot: networkConfig.slot,
        preset: networkConfig.preset,
        chains: allChains,
        defaultChainId: stringToFelt(networkConfig.chainId).toString(),
        tokens: networkConfig.tokens,
      });

      // Try to manually create the iframe if it doesn't exist in DOM
      const keychainIframe = (connector as any).controller?.iframes?.keychain;
      if (keychainIframe && keychainIframe.iframe && !document.contains(keychainIframe.iframe)) {
        try {
          if (keychainIframe.container && document.contains(keychainIframe.container)) {
            keychainIframe.container.appendChild(keychainIframe.iframe);
          } else if (keychainIframe.container) {
            document.body.appendChild(keychainIframe.container);
          } else {
            document.body.appendChild(keychainIframe.iframe);
          }
        } catch (error) {
          console.error('Error manually appending iframe:', error);
        }
      }

    } catch (error) {
      console.error('Error creating ControllerConnector:', error);
      throw error;
    }

    // Store reference for next cleanup
    previousConnectorRef.current = connector;

    return connector;
  }, [networkConfig]);
}

interface DynamicConnectorContext {
  currentNetworkConfig: NetworkConfig;
  switchToNetwork: (networkKey: ChainId) => void;
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

export function DynamicConnectorProvider({ children }: PropsWithChildren) {
  const defaultNetworkKey = import.meta.env.VITE_PUBLIC_DEFAULT_CHAIN || ChainId.SN_MAIN;

  // Get the saved network or fall back to default
  const getInitialNetwork = (): ChainId => {
    // First, check URL parameters
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const networkParam = urlParams.get('network');
      if (networkParam && translateName(networkParam)) {
        return translateName(networkParam) as ChainId;
      }
    } catch (error) {
      console.warn('Failed to read network from URL parameters:', error);
    }

    // Second, check localStorage
    try {
      const savedNetwork = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (savedNetwork && Object.values(ChainId).includes(savedNetwork as ChainId)) {
        return savedNetwork as ChainId;
      }
    } catch (error) {
      console.warn('Failed to read saved network from localStorage:', error);
    }

    return defaultNetworkKey as ChainId;
  };

  const initialNetworkKey = getInitialNetwork();
  const initialConfig = getNetworkConfig(initialNetworkKey);

  if (!initialConfig) {
    throw new Error(`No configuration found for network: ${initialNetworkKey}`);
  }

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

  const switchToNetwork = useCallback(async (networkKey: ChainId) => {
    const networkConfig = getNetworkConfig(networkKey);
    if (networkConfig) {
      setCurrentNetworkConfig(networkConfig);

      // Save the chosen network to localStorage
      try {
        localStorage.setItem(NETWORK_STORAGE_KEY, networkKey);
      } catch (error) {
        console.warn('Failed to save network preference to localStorage:', error);
      }
    } else {
      console.warn(`No configuration found for network: ${networkKey}`);
    }
  }, []);

  const connector = useDynamicControllerConnector(currentNetworkConfig);

  const rpc = useCallback(() => {
    return { nodeUrl: currentNetworkConfig.chains[0].rpcUrl };
  }, [currentNetworkConfig.chains]);

  return (
    <DynamicConnectorContext.Provider value={{
      currentNetworkConfig,
      switchToNetwork,
      dojoConfig
    }}>
      <StarknetConfig
        chains={[mainnet, sepolia]}
        provider={jsonRpcProvider({ rpc })}
        connectors={[connector]}
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
