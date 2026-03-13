import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Paper, Typography, Link } from '@mui/material';
import { motion } from 'framer-motion';
import { extractImageFromTokenURI } from '@/utils/utils';
import { useController } from '@/contexts/controller';
import { Beast } from '@/types/game';
import { JACKPOT_AMOUNT, useStatistics } from '@/contexts/Statistics';
import { JACKPOT_BEASTS } from '@/constants/beast';

export interface BeastCollectedPopupProps {
  onClose: () => void;
  tokenURI: string;
  beast: Beast;
}

export default function BeastCollectedPopup({ onClose, tokenURI, beast }: BeastCollectedPopupProps) {
  const imageSrc = extractImageFromTokenURI(tokenURI);
  const { openProfile } = useController();
  const { strkPrice } = useStatistics();

  const isJackpot = JACKPOT_BEASTS.includes(beast?.name!);

  const getSurvivorTokens = (tier: number): number => {
    switch (tier) {
      case 1: return 14;
      case 2: return 12;
      case 3: return 10;
      case 4: return 8;
      case 5: return 6;
      default: return 0;
    }
  };

  return (
    <Box sx={styles.overlay}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper elevation={24} sx={styles.card}>
          <IconButton onClick={onClose} sx={styles.closeBtn} aria-label="Close" size="small">
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>
          <Typography sx={styles.collected}>Beast Collected!</Typography>
          <Box sx={isJackpot ? styles.jackpotContainer : styles.survivorTokensContainer}>
            {!isJackpot && <>
              <Box
                component="img"
                src="/images/survivor_token.png"
                alt="Survivor Token"
                sx={styles.tokenImage}
              />
              <Typography sx={styles.survivorTokens}>
                +{getSurvivorTokens(beast.tier)} Survivor Tokens
              </Typography>
            </>}
            {isJackpot && <>
              <Typography sx={styles.jackpotText}>
                {strkPrice ? `+$${Math.round(Number(strkPrice || 0) * JACKPOT_AMOUNT).toLocaleString()} Bounty!` : 'Bounty!'}
              </Typography>
            </>}
          </Box>
          <Box sx={styles.imageWrap}>
            {imageSrc ? (
              <Box
                component="img"
                src={imageSrc}
                alt="Beast"
                sx={styles.image}
              />
            ) : (
              <Box sx={styles.fallbackImage}>
                <Typography sx={styles.fallbackText}>Image Unavailable</Typography>
              </Box>
            )}
          </Box>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openProfile();
            }}
            sx={styles.walletLink}
          >
            View Beast in Wallet
          </Link>
        </Paper>
      </motion.div>
    </Box>
  );
}

const styles = {
  '@keyframes jackpotGlow': {
    '0%': {
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 215, 0, 0.5)',
    },
    '100%': {
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 215, 0, 0.8), 0 0 24px rgba(255, 193, 7, 0.6)',
    },
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    bgcolor: 'rgba(0,0,0,0.80)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 370,
    maxWidth: '98dvw',
    p: 4,
    boxSizing: 'border-box',
    borderRadius: 4,
    background: 'repeating-linear-gradient(135deg, #181818 0px, #181818 8px, #1a1a1a 16px, #181818 24px)',
    border: '2px solid rgba(255, 224, 130, 0.25)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 224, 130, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 224, 130, 0.5) 50%, transparent 100%)',
    },
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    color: '#ffe082',
    background: 'rgba(255, 224, 130, 0.08)',
    border: '1.5px solid rgba(255, 224, 130, 0.18)',
    boxShadow: 'none',
    zIndex: 2,
    '&:hover': {
      background: 'rgba(255, 224, 130, 0.18)',
      transform: 'scale(1.1)',
    },
    transition: 'all 0.2s ease',
  },
  imageWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mb: 2,
    width: 250,
    height: 350,
  },
  image: {
    width: 250,
    height: 350,
    objectFit: 'contain',
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: '#ffe082',
    textShadow: '0 1px 4px #232526',
    mb: 1,
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    my: 2,
    borderColor: 'rgba(255, 224, 130, 0.18)',
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    alignItems: 'center',
    mb: 1,
  },
  topRow: {
    display: 'flex',
    gap: 2,
    width: '100%',
    justifyContent: 'center',
  },
  bottomRow: {
    display: 'flex',
    gap: 2,
    width: '100%',
    justifyContent: 'center',
  },
  collected: {
    mb: 1.5,
    color: '#ffe082',
    fontWeight: 700,
    fontSize: 24,
    letterSpacing: 1,
    textShadow: '0 1px 4px #232526',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
  },
  survivorTokensContainer: {
    mb: 1.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    background: 'rgba(76, 175, 80, 0.1)',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    borderRadius: 2,
    padding: '6px 12px',
  },
  tokenImage: {
    width: 24,
    height: 24,
    objectFit: 'contain',
  },
  survivorTokens: {
    color: '#4caf50',
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: 0.5,
    textShadow: '0 1px 3px #232526',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
    margin: 0,
  },
  jackpotContainer: {
    mb: 1.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 193, 7, 0.15) 50%, rgba(255, 152, 0, 0.2) 100%)',
    border: '2px solid rgba(255, 215, 0, 0.6)',
    borderRadius: 3,
    padding: '8px 16px',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
      borderRadius: 3,
      pointerEvents: 'none',
    },
  },
  jackpotText: {
    color: '#ffd700',
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: 1,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 215, 0, 0.5)',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
    margin: 0,
    background: 'linear-gradient(45deg, #ffd700, #ffed4e, #ffd700)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'jackpotGlow 2s ease-in-out infinite alternate',
  },
  fallbackImage: {
    width: 250,
    height: 350,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 224, 130, 0.1)',
    border: '1px dashed rgba(255, 224, 130, 0.3)',
    borderRadius: 2,
  },
  fallbackText: {
    color: '#ffe082',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  walletLink: {
    mt: 2,
    color: '#ffe082',
    fontSize: 16,
    fontWeight: 600,
    textAlign: 'center',
    cursor: 'pointer',
    padding: '12px 24px',
    background: 'rgba(255, 224, 130, 0.1)',
    border: '2px solid rgba(255, 224, 130, 0.3)',
    borderRadius: 2,
    '&:hover': {
      color: '#ffd54f',
      background: 'rgba(255, 224, 130, 0.2)',
      borderColor: 'rgba(255, 224, 130, 0.5)',
    },
  },
}; 