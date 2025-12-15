import MainMenu from '@/desktop/overlays/MainMenu';
import Countdown from '@/desktop/overlays/Countdown';
import { gameAssets, prefetchStream, preloadAssets } from '@/utils/assetLoader';
import { streamIds } from '@/utils/cloudflare';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDungeon } from '@/dojo/useDungeon';
import NotFoundPage from './NotFoundPage';

export default function LandingPage() {
  const dungeon = useDungeon();
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Load landing page image
    const img = new Image();
    img.src = '/images/start.png';
    img.onload = () => {
      setImageLoaded(true);
      // Start preloading game assets after landing page is loaded
      preloadAssets(gameAssets);
      prefetchStream(streamIds.start);
    };
  }, []);

  if (!dungeon) {
    return <NotFoundPage />
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="imageContainer"
        style={{
          backgroundImage: `url('/images/start.png')`,
          backgroundColor: '#000', // Fallback color while loading
        }}
      >
        <Countdown />
        <MainMenu />
      </motion.div>
    </>
  );
}