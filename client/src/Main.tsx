import { createRoot } from "react-dom/client";

import App from "./App.tsx";

// Dojo related imports
import { init } from "@dojoengine/sdk";
import { DojoSdkProvider } from "@dojoengine/sdk/react";
import { setupWorld } from "./generated/contracts.gen.ts";
import type { SchemaType } from "./generated/models.gen.ts";

import { DynamicConnectorProvider, useDynamicConnector } from "@/contexts/starknet.tsx";
import { createDojoConfig } from "@dojoengine/core";
import { useEffect, useState } from "react";
import "./index.css";

function DojoApp() {
  const { dojoConfig } = useDynamicConnector();
  const [sdk, setSdk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeSdk() {
      try {
        setLoading(true);
        const initializedSdk = await init<SchemaType>({
          client: {
            toriiUrl: dojoConfig.toriiUrl,
            worldAddress: dojoConfig.manifest.world.address,
          },
          domain: {
            name: "Loot Survivor",
            version: "1.0",
            chainId: dojoConfig.chainId,
            revision: "1",
          }
        });
        setSdk(initializedSdk);
      } catch (error) {
        console.error("Failed to initialize SDK:", error);
      } finally {
        setLoading(false);
      }
    }

    if (dojoConfig) {
      initializeSdk();
    }
  }, [dojoConfig]);

  if (loading || !sdk) {
    return <div>Loading...</div>;
  }

  return (
    <DojoSdkProvider sdk={sdk} dojoConfig={createDojoConfig(dojoConfig)} clientFn={setupWorld}>
      <App />
    </DojoSdkProvider>
  );
}

async function main() {
  createRoot(document.getElementById("root")!).render(
    <DynamicConnectorProvider>
      <DojoApp />
    </DynamicConnectorProvider>
  );
}

main().catch((error) => {
  console.error("Failed to initialize the application:", error);
});
