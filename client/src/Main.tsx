import { createRoot } from "react-dom/client";

import App from "./App.tsx";

// Dojo related imports
import { init } from "@dojoengine/sdk";
import { DojoSdkProvider } from "@dojoengine/sdk/react";
import { MetagameProvider } from "@/contexts/metagame.tsx";
import {
  DynamicConnectorProvider,
  useDynamicConnector,
} from "@/contexts/starknet.tsx";
import { createDojoConfig } from "@dojoengine/core";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
import { PostHogProvider } from "posthog-js/react";

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2025-05-24" as const,
};

function DojoApp() {
  const { currentNetworkConfig } = useDynamicConnector();
  const [sdk, setSdk] = useState<any>(null);

  useEffect(() => {
    async function initializeSdk() {
      try {
        const initializedSdk = await init({
          client: {
            toriiUrl: currentNetworkConfig.toriiUrl,
            worldAddress: currentNetworkConfig.manifest.world.address,
          },
          domain: {
            name: "Loot Survivor",
            version: "1.0",
            chainId: currentNetworkConfig.chainId,
            revision: "1",
          },
        });
        setSdk(initializedSdk);
      } catch (error) {
        console.error("Failed to initialize SDK:", error);
      }
    }

    if (currentNetworkConfig) {
      initializeSdk();
    }
  }, [currentNetworkConfig]);

  return (
    <DojoSdkProvider
      sdk={sdk}
      dojoConfig={createDojoConfig(currentNetworkConfig)}
      clientFn={() => {}}
    >
      <MetagameProvider>
        <App />
      </MetagameProvider>
    </DojoSdkProvider>
  );
}

async function main() {
  createRoot(document.getElementById("root")!).render(
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={options}
    >
      <DynamicConnectorProvider>
        <Analytics />
        <DojoApp />
      </DynamicConnectorProvider>
    </PostHogProvider>
  );
}

main().catch((error) => {
  console.error("Failed to initialize the application:", error);
});
