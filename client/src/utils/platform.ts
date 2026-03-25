const params = new URLSearchParams(window.location.search);

export function getAppHost(): string {
  const fromUrl = params.get("app_host");
  if (fromUrl) return fromUrl;
  return import.meta.env.VITE_PUBLIC_APP_HOST || "direct";
}

export function getPlatform(): string {
  if (params.has("app_host")) return "iframe";
  return import.meta.env.VITE_PUBLIC_PLATFORM || "web";
}
