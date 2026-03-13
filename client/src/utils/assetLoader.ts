interface AssetLoaderOptions {
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export const preloadAssets = async (assets: string[], options: AssetLoaderOptions = {}) => {
  const { onProgress, onComplete } = options;
  const total = assets.length;
  let loaded = 0;

  const loadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (onProgress) {
          onProgress(loaded / total);
        }
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  try {
    await Promise.all(assets.map(loadImage));
    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    console.error('Error preloading assets:', error);
  }
};

export function prefetchStream(uid: string) {
  if (!uid) return;

  const manifest = `https://customer-z4845v01tb3yh1uw.cloudflarestream.com/${uid}/manifest/video.m3u8`;
  fetch(manifest, { mode: 'no-cors', credentials: 'omit', priority: 'low' });
}

// List of game assets to preload
export const gameAssets = [
  '/images/adventurer.png',
  '/images/beast.png',
  '/images/game.png',
  '/images/inventory.png',
  '/images/market.png',
  // Loot items
  '/images/loot/pendant.png',
  '/images/loot/necklace.png',
  '/images/loot/amulet.png',
  '/images/loot/silver_ring.png',
  '/images/loot/bronze_ring.png',
  '/images/loot/platinum_ring.png',
  '/images/loot/titanium_ring.png',
  '/images/loot/gold_ring.png',
  '/images/loot/ghost_wand.png',
  '/images/loot/grave_wand.png',
  '/images/loot/bone_wand.png',
  '/images/loot/wand.png',
  '/images/loot/grimoire.png',
  '/images/loot/chronicle.png',
  '/images/loot/tome.png',
  '/images/loot/book.png',
  '/images/loot/divine_robe.png',
  '/images/loot/silk_robe.png',
  '/images/loot/linen_robe.png',
  '/images/loot/robe.png',
  '/images/loot/shirt.png',
  '/images/loot/crown.png',
  '/images/loot/divine_hood.png',
  '/images/loot/silk_hood.png',
  '/images/loot/linen_hood.png',
  '/images/loot/hood.png',
  '/images/loot/brightsilk_sash.png',
  '/images/loot/silk_sash.png',
  '/images/loot/wool_sash.png',
  '/images/loot/linen_sash.png',
  '/images/loot/sash.png',
  '/images/loot/divine_slippers.png',
  '/images/loot/silk_slippers.png',
  '/images/loot/wool_shoes.png',
  '/images/loot/linen_shoes.png',
  '/images/loot/shoes.png',
  '/images/loot/divine_gloves.png',
  '/images/loot/silk_gloves.png',
  '/images/loot/wool_gloves.png',
  '/images/loot/linen_gloves.png',
  '/images/loot/gloves.png',
  '/images/loot/katana.png',
  '/images/loot/falchion.png',
  '/images/loot/scimitar.png',
  '/images/loot/long_sword.png',
  '/images/loot/short_sword.png',
  '/images/loot/demon_husk.png',
  '/images/loot/dragonskin_armor.png',
  '/images/loot/studded_leather_armor.png',
  '/images/loot/hard_leather_armor.png',
  '/images/loot/leather_armor.png',
  '/images/loot/demon_crown.png',
  '/images/loot/dragons_crown.png',
  '/images/loot/war_cap.png',
  '/images/loot/leather_cap.png',
  '/images/loot/cap.png',
  '/images/loot/demonhide_belt.png',
  '/images/loot/dragonskin_belt.png',
  '/images/loot/studded_leather_belt.png',
  '/images/loot/hard_leather_belt.png',
  '/images/loot/leather_belt.png',
  '/images/loot/demonhide_boots.png',
  '/images/loot/dragonskin_boots.png',
  '/images/loot/studded_leather_boots.png',
  '/images/loot/hard_leather_boots.png',
  '/images/loot/leather_boots.png',
  '/images/loot/demons_hands.png',
  '/images/loot/dragonskin_gloves.png',
  '/images/loot/studded_leather_gloves.png',
  '/images/loot/hard_leather_gloves.png',
  '/images/loot/leather_gloves.png',
  '/images/loot/warhammer.png',
  '/images/loot/quarterstaff.png',
  '/images/loot/maul.png',
  '/images/loot/mace.png',
  '/images/loot/club.png',
  '/images/loot/holy_chestplate.png',
  '/images/loot/ornate_chestplate.png',
  '/images/loot/plate_mail.png',
  '/images/loot/chain_mail.png',
  '/images/loot/ring_mail.png',
  '/images/loot/ancient_helm.png',
  '/images/loot/ornate_helm.png',
  '/images/loot/great_helm.png',
  '/images/loot/full_helm.png',
  '/images/loot/helm.png',
  '/images/loot/ornate_belt.png',
  '/images/loot/war_belt.png',
  '/images/loot/plated_belt.png',
  '/images/loot/mesh_belt.png',
  '/images/loot/heavy_belt.png',
  '/images/loot/holy_greaves.png',
  '/images/loot/ornate_greaves.png',
  '/images/loot/greaves.png',
  '/images/loot/chain_boots.png',
  '/images/loot/heavy_boots.png',
  '/images/loot/holy_gauntlets.png',
  '/images/loot/ornate_gauntlets.png',
  '/images/loot/gauntlets.png',
  '/images/loot/chain_gloves.png',
  '/images/loot/heavy_gloves.png',
  // Add more assets as needed
];