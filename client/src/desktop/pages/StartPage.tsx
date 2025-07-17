import MainMenu from '@/desktop/overlays/MainMenu';
import { gameAssets, prefetchStream, preloadAssets } from '@/utils/assetLoader';
import { streamIds } from '@/utils/cloudflare';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function LandingPage() {
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
        <MainMenu />
      </motion.div>
    </>
  );
}

const styles = {
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  walletContainer: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    zIndex: 2,
  },
  playButton: {
    fontSize: '1.4rem',
    padding: '8px 3rem',
    borderRadius: '1rem',
    boxShadow: 3,
  },
  title: {
    color: '#1aff5c',
    fontWeight: 'bold',
    textShadow: '0 2px 8px #003311',
    marginBottom: '2.5rem',
    textAlign: 'center',
    letterSpacing: '0.08em',
    fontSize: { xs: '2.2rem', sm: '3rem', md: '3.5rem' },
    lineHeight: 1.1,
  },
};