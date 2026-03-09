const base = import.meta.env.BASE_URL;

export function assetUrl(path: string): string {
  // Remove leading slash if present, then prepend base URL
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
