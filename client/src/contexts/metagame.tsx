import {
  initMetagame,
  MetagameProvider as MetagameSDKProvider,
} from "metagame-sdk";
import { ReactNode, useEffect, useState } from "react";
import { useDynamicConnector } from "@/contexts/starknet.tsx";

export const MetagameProvider = ({ children }: { children: ReactNode }) => {
  const [metagameClient, setMetagameClient] = useState<any>(undefined);
  const [initFailed, setInitFailed] = useState(false);
  const { currentNetworkConfig } = useDynamicConnector();

  useEffect(() => {
    if (!currentNetworkConfig) {
      setMetagameClient(undefined);
      return;
    }

    setInitFailed(false);

    // Initialize Metagame SDK
    initMetagame({
      toriiUrl: currentNetworkConfig.toriiUrl!,
      worldAddress: currentNetworkConfig.manifest.world.address,
    })
      .then(setMetagameClient)
      .catch((error) => {
        console.error(
          `Failed to initialize Metagame SDK for chain ${currentNetworkConfig.chainId}:`,
          error
        );
        setMetagameClient(undefined);
        setInitFailed(true);
      });
  }, [currentNetworkConfig]);

  // If init failed (e.g. no Torii), render children anyway so the app is usable
  // for flows that don't need indexed data (payments, swaps, etc.)
  if (initFailed) {
    return <>{children}</>;
  }

  if (!metagameClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Initializing Metagame SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <MetagameSDKProvider metagameClient={metagameClient}>
      {children}
    </MetagameSDKProvider>
  );
};
