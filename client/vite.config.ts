import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
// mkcert is required — Cartridge Controller needs HTTPS for WebAuthn.
// On WSL + Windows browser: import the mkcert root CA into Windows cert store.
// See: mkcert -CAROOT to find the CA path, then import rootCA.pem into Windows.
export default defineConfig({
    plugins: [react(), wasm(), topLevelAwait(), mkcert()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
