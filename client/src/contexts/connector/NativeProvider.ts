import SessionProvider from "@cartridge/controller/session";

export default class NativeProvider extends SessionProvider {

    async openProfile(tab: string = "inventory"): Promise<void> {
        const account = await this.probe();
        if (!account) return;
        const username = await this.username();
        if (!username) return;

        const params = new URLSearchParams();
        params.set("redirect_uri", this._redirectUrl);
        params.set("public_key", this._publicKey);
        params.set("redirect_query_name", "startapp");
        const qs = params.toString();
        const path = `/account/${encodeURIComponent(username)}/${tab}?${qs}`;
        window.open(`${this._keychainUrl}${path}`, "_blank");
    }


    async openStarterPack(id: string | number): Promise<void> {
        // Not supported
    }
}