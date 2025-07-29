import { ReactNode, useState, useEffect } from "react";
import { useNetwork } from "@starknet-react/core";
import {
  initMetagame,
  MetagameProvider as MetagameSDKProvider,
} from "metagame-sdk";
// import { feltToString } from "@/lib/utils";
// import { ChainId, CHAINS } from "@/dojo/setup/networks";
// import { manifests } from "@/dojo/setup/config";
import { useDynamicConnector } from "@/contexts/starknet.tsx";

export const MetagameProvider = ({ children }: { children: ReactNode }) => {
  const [metagameClient, setMetagameClient] = useState<any>(undefined);
  const { chain } = useNetwork();
  const { dojoConfig } = useDynamicConnector();

  useEffect(() => {
    if (!dojoConfig) {
      console.error(`No config found for chain ID: ${chain.id}`);
      setMetagameClient(undefined);
      return;
    }

    // Initialize Metagame SDK
    initMetagame({
      toriiUrl: dojoConfig.toriiUrl!,
      worldAddress: dojoConfig.manifest.world.address,
    })
      .then(setMetagameClient)
      .catch((error) => {
        console.error(
          `Failed to initialize Metagame SDK for chain ${chain.id}:`,
          error
        );
        setMetagameClient(undefined);
      });
  }, [chain]);

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
