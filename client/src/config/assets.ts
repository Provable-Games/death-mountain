// Centralized CDN configuration for game assets

export const ASSETS_CONFIG = {
  // Base URL from environment or fallback to local
  cdnBase: import.meta.env.VITE_PUBLIC_CDN_URL || '',

  // Asset paths
  paths: {
    battleScenes: '/images/battle_scenes',
    beasts: '/images/beasts',
  },
};

/**
 * Construct full asset URL with CDN base if configured
 */
export const getAssetUrl = (path: string): string => {
  const base = ASSETS_CONFIG.cdnBase;
  // Ensure no double slashes
  if (base && path.startsWith('/')) {
    return `${base}${path}`;
  }
  return base ? `${base}/${path}` : path;
};

/**
 * Get battle scene background image URL
 */
export const getBattleSceneUrl = (beastName: string, isJackpot = false): string => {
  const filename = isJackpot
    ? `jackpot_${beastName.toLowerCase()}`
    : beastName.toLowerCase();
  return getAssetUrl(`${ASSETS_CONFIG.paths.battleScenes}/${filename}.png`);
};

/**
 * Get beast image URL by name
 */
export const getBeastImageUrl = (name: string): string => {
  return getAssetUrl(
    `${ASSETS_CONFIG.paths.beasts}/${name.replace(' ', '_').toLowerCase()}.png`
  );
};
