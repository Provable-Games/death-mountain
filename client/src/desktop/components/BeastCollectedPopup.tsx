import { Box, Typography, Paper, IconButton, Divider } from '@mui/material';
import beastImg from '../assets/images/beast.png';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';
import React from 'react';
import { motion } from 'framer-motion';

export interface BeastCollectedPopupProps {
  onClose: () => void;
  beast?: {
    name: string;
    power: number;
    rank: number;
    tier: number;
    level: number;
    type: string;
  };
}

const statIcons = {
  power: <FlashOnIcon sx={{ color: '#ffb74d', fontSize: 28 }} />,
  rank: <EmojiEventsIcon sx={{ color: '#ffe082', fontSize: 24 }} />,
  tier: <MilitaryTechIcon sx={{ color: '#ffd54f', fontSize: 24 }} />,
  level: <TrendingUpIcon sx={{ color: '#fff59d', fontSize: 24 }} />,
  type: <CategoryIcon sx={{ color: '#bdbdbd', fontSize: 24 }} />,
};

export default function BeastCollectedPopup({ onClose, beast }: BeastCollectedPopupProps) {
  const displayBeast = beast;

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
          <Box sx={styles.imageWrap}>
            <Box
              component="img"
              src={beastImg}
              alt="Beast"
              sx={styles.image}
            />
          </Box>
          <Typography sx={styles.name}>{displayBeast?.name}</Typography>
          <Divider sx={styles.divider} />
          <Box sx={styles.statsGrid}>
            <Box sx={styles.topRow}>
              <Box sx={styles.statBadgeMain}>
                {statIcons.power}
                <Typography sx={styles.statLabelMain}>Power</Typography>
                <Typography sx={styles.statValueMain}>{displayBeast?.power}</Typography>
              </Box>
              <Box sx={styles.statBadgeMain}>
                {statIcons.rank}
                <Typography sx={styles.statLabelMain}>Rank</Typography>
                <Typography sx={styles.statValueMain}>{displayBeast?.rank}</Typography>
              </Box>
            </Box>
            <Box sx={styles.bottomRow}>
              <Box sx={styles.statBadge}><Typography sx={styles.statLabel}>Tier</Typography><Typography sx={styles.statValue}>{displayBeast?.tier}</Typography></Box>
              <Box sx={styles.statBadge}><Typography sx={styles.statLabel}>Level</Typography><Typography sx={styles.statValue}>{displayBeast?.level}</Typography></Box>
              <Box sx={styles.statBadge}><Typography sx={styles.statLabel}>Type</Typography><Typography sx={styles.statValue}>{displayBeast?.type}</Typography></Box>
            </Box>
          </Box>
          <Divider sx={styles.divider} />
          <Typography sx={styles.collected}>Beast Collected!</Typography>
        </Paper>
      </motion.div>
    </Box>
  );
}

const styles = {
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
    minWidth: 370,
    maxWidth: 440,
    p: 4,
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
    mt: -2,
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(255, 224, 130, 0.06) 0%, rgba(255, 224, 130, 0.01) 100%)',
    border: '1.5px solid rgba(255, 224, 130, 0.18)',
    boxShadow: '0 0 12px 0 #ffe08222',
  },
  image: {
    width: 90,
    height: 90,
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 8px #ffe08233)',
    borderRadius: '50%',
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
  statBadgeMain: {
    gridColumn: '1',
    gridRow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(90deg, #ffe08222 0%, #ffb74d22 100%)',
    border: '1.5px solid #ffb74d',
    borderRadius: 3,
    px: 3,
    py: 1.5,
    boxShadow: '0 2px 8px #ffb74d22',
    minWidth: 120,
  },
  statLabelMain: {
    color: '#ffb74d',
    fontWeight: 700,
    fontSize: 15,
    mt: 0.5,
    mb: 0.5,
    letterSpacing: 0.5,
    textShadow: '0 1px 2px #232526',
  },
  statValueMain: {
    color: '#ffe082',
    fontWeight: 800,
    fontSize: 22,
    textShadow: '0 1px 4px #232526',
  },
  statBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(90deg, #232526 0%, #35373a 100%)',
    border: '1.5px solid rgba(255, 224, 130, 0.13)',
    borderRadius: 3,
    px: 2,
    py: 1,
    minWidth: 80,
  },
  statLabel: {
    color: '#ffe082',
    fontWeight: 600,
    fontSize: 13,
    mt: 0.5,
    mb: 0.5,
    letterSpacing: 0.3,
    textShadow: '0 1px 2px #232526',
  },
  statValue: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    textShadow: '0 1px 2px #232526',
  },
  collected: {
    mt: 1,
    color: '#ffe082',
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: 1,
    textShadow: '0 1px 4px #232526',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
  },
}; 