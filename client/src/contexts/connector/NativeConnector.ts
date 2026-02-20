import {Connector, InjectedConnector} from "@starknet-react/core";
import {SessionOptions} from "@cartridge/controller/session";
import NativeProvider from "@/contexts/connector/NativeProvider.ts";

export default class NativeConnector extends InjectedConnector {

    public controller: NativeProvider;

    constructor(options: SessionOptions) {
        const controller = new NativeProvider(options);

        super({
            options: {
                id: controller.id,
                name: controller.name,
            },
        });

        this.controller = controller;
    }

    async disconnect() {
        await this.controller.disconnect();
        try {
            await super.disconnect();
        } catch {
            // Best-effort: disconnect should not throw if the injected wallet isn't available.
        }
    }

    username() {
        return this.controller.username();
    }

    static fromConnectors(connectors: Connector[]): NativeConnector {
        const connector = connectors.find((c) => c.id === "controller_session");
        if (!connector) {
            throw new Error("Session connector not found");
        }
        return connector as NativeConnector;
    }
}