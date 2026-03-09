import { assetUrl } from '@/utils/assetUrl';

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
  assetUrl('/images/adventurer.png'),
  assetUrl('/images/beast.png'),
  assetUrl('/images/game.png'),
  assetUrl('/images/inventory.png'),
  assetUrl('/images/market.png'),
  // Loot items
  assetUrl('/images/loot/pendant.png'),
  assetUrl('/images/loot/necklace.png'),
  assetUrl('/images/loot/amulet.png'),
  assetUrl('/images/loot/silver_ring.png'),
  assetUrl('/images/loot/bronze_ring.png'),
  assetUrl('/images/loot/platinum_ring.png'),
  assetUrl('/images/loot/titanium_ring.png'),
  assetUrl('/images/loot/gold_ring.png'),
  assetUrl('/images/loot/ghost_wand.png'),
  assetUrl('/images/loot/grave_wand.png'),
  assetUrl('/images/loot/bone_wand.png'),
  assetUrl('/images/loot/wand.png'),
  assetUrl('/images/loot/grimoire.png'),
  assetUrl('/images/loot/chronicle.png'),
  assetUrl('/images/loot/tome.png'),
  assetUrl('/images/loot/book.png'),
  assetUrl('/images/loot/divine_robe.png'),
  assetUrl('/images/loot/silk_robe.png'),
  assetUrl('/images/loot/linen_robe.png'),
  assetUrl('/images/loot/robe.png'),
  assetUrl('/images/loot/shirt.png'),
  assetUrl('/images/loot/crown.png'),
  assetUrl('/images/loot/divine_hood.png'),
  assetUrl('/images/loot/silk_hood.png'),
  assetUrl('/images/loot/linen_hood.png'),
  assetUrl('/images/loot/hood.png'),
  assetUrl('/images/loot/brightsilk_sash.png'),
  assetUrl('/images/loot/silk_sash.png'),
  assetUrl('/images/loot/wool_sash.png'),
  assetUrl('/images/loot/linen_sash.png'),
  assetUrl('/images/loot/sash.png'),
  assetUrl('/images/loot/divine_slippers.png'),
  assetUrl('/images/loot/silk_slippers.png'),
  assetUrl('/images/loot/wool_shoes.png'),
  assetUrl('/images/loot/linen_shoes.png'),
  assetUrl('/images/loot/shoes.png'),
  assetUrl('/images/loot/divine_gloves.png'),
  assetUrl('/images/loot/silk_gloves.png'),
  assetUrl('/images/loot/wool_gloves.png'),
  assetUrl('/images/loot/linen_gloves.png'),
  assetUrl('/images/loot/gloves.png'),
  assetUrl('/images/loot/katana.png'),
  assetUrl('/images/loot/falchion.png'),
  assetUrl('/images/loot/scimitar.png'),
  assetUrl('/images/loot/long_sword.png'),
  assetUrl('/images/loot/short_sword.png'),
  assetUrl('/images/loot/demon_husk.png'),
  assetUrl('/images/loot/dragonskin_armor.png'),
  assetUrl('/images/loot/studded_leather_armor.png'),
  assetUrl('/images/loot/hard_leather_armor.png'),
  assetUrl('/images/loot/leather_armor.png'),
  assetUrl('/images/loot/demon_crown.png'),
  assetUrl('/images/loot/dragons_crown.png'),
  assetUrl('/images/loot/war_cap.png'),
  assetUrl('/images/loot/leather_cap.png'),
  assetUrl('/images/loot/cap.png'),
  assetUrl('/images/loot/demonhide_belt.png'),
  assetUrl('/images/loot/dragonskin_belt.png'),
  assetUrl('/images/loot/studded_leather_belt.png'),
  assetUrl('/images/loot/hard_leather_belt.png'),
  assetUrl('/images/loot/leather_belt.png'),
  assetUrl('/images/loot/demonhide_boots.png'),
  assetUrl('/images/loot/dragonskin_boots.png'),
  assetUrl('/images/loot/studded_leather_boots.png'),
  assetUrl('/images/loot/hard_leather_boots.png'),
  assetUrl('/images/loot/leather_boots.png'),
  assetUrl('/images/loot/demons_hands.png'),
  assetUrl('/images/loot/dragonskin_gloves.png'),
  assetUrl('/images/loot/studded_leather_gloves.png'),
  assetUrl('/images/loot/hard_leather_gloves.png'),
  assetUrl('/images/loot/leather_gloves.png'),
  assetUrl('/images/loot/warhammer.png'),
  assetUrl('/images/loot/quarterstaff.png'),
  assetUrl('/images/loot/maul.png'),
  assetUrl('/images/loot/mace.png'),
  assetUrl('/images/loot/club.png'),
  assetUrl('/images/loot/holy_chestplate.png'),
  assetUrl('/images/loot/ornate_chestplate.png'),
  assetUrl('/images/loot/plate_mail.png'),
  assetUrl('/images/loot/chain_mail.png'),
  assetUrl('/images/loot/ring_mail.png'),
  assetUrl('/images/loot/ancient_helm.png'),
  assetUrl('/images/loot/ornate_helm.png'),
  assetUrl('/images/loot/great_helm.png'),
  assetUrl('/images/loot/full_helm.png'),
  assetUrl('/images/loot/helm.png'),
  assetUrl('/images/loot/ornate_belt.png'),
  assetUrl('/images/loot/war_belt.png'),
  assetUrl('/images/loot/plated_belt.png'),
  assetUrl('/images/loot/mesh_belt.png'),
  assetUrl('/images/loot/heavy_belt.png'),
  assetUrl('/images/loot/holy_greaves.png'),
  assetUrl('/images/loot/ornate_greaves.png'),
  assetUrl('/images/loot/greaves.png'),
  assetUrl('/images/loot/chain_boots.png'),
  assetUrl('/images/loot/heavy_boots.png'),
  assetUrl('/images/loot/holy_gauntlets.png'),
  assetUrl('/images/loot/ornate_gauntlets.png'),
  assetUrl('/images/loot/gauntlets.png'),
  assetUrl('/images/loot/chain_gloves.png'),
  assetUrl('/images/loot/heavy_gloves.png'),
  // Add more assets as needed
];