import BeastTooltip from '@/desktop/components/BeastTooltip';
import { useGameStore } from '@/stores/gameStore';
import { beastPowerPercent, getCollectableTraits } from '@/utils/beast';
import { calculateLevel } from '@/utils/game';
import { beastNameSize } from '@/utils/utils';
import { Box, LinearProgress, Typography, keyframes } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const pulseGold = keyframes`
  0% {
    box-shadow: 0 0 8px rgba(237, 207, 51, 0.4);
  }
  50% {
    box-shadow: 0 0 15px rgba(237, 207, 51, 0.6);
  }
  100% {
    box-shadow: 0 0 8px rgba(237, 207, 51, 0.4);
  }
`;

export default function Beast() {
  const { adventurer, beast, battleEvent, setShowInventory } = useGameStore();
  const [beastHealth, setBeastHealth] = useState(adventurer!.beast_health);

  const beastPower = Number(beast!.level) * (6 - Number(beast!.tier));
  const collectable = beast ? beast!.isCollectable : false;
  const collectableTraits = collectable ? getCollectableTraits(beast!.seed) : null;

  useEffect(() => {
    if (battleEvent && battleEvent.type === "attack") {
      setBeastHealth(prev => Math.max(0, prev - battleEvent?.attack?.damage!));
    }
  }, [battleEvent]);

  useEffect(() => {
    setShowInventory(true);
  }, []);

  return (
    <>
      {/* Beast Portrait */}
      <Box sx={collectable ? styles.collectablePortraitWrapper : styles.portraitWrapper}>
        {collectable ? <Box sx={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%', borderRadius: '50%' }}>
          <img src={`/images/beast_portraits/${beast!.baseName.toLowerCase()}.svg`}
            alt="Beast" style={{
              width: '64px',
              height: '64px',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }} />

          {/* Shiny Effect */}
          {collectableTraits?.shiny && (
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '200%',
                height: '100%',
                borderRadius: '20%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 5,
              }}
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 1,
              }}
            />
          )}
        </Box> : <img src="/images/beast.png" alt="Beast" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />}

        <Box sx={[styles.beastLevelCircle, { left: -4 }, collectable && styles.collectableLevelCircle]}>
          <BeastTooltip beastType={beast!.type} beastId={beast!.id} />
        </Box>

        <Box sx={[styles.beastLevelCircle, { right: -4 }, collectable && styles.collectableLevelCircle]}>
          <Typography variant="body2" sx={styles.levelText}>
            {beast?.level || 0}
          </Typography>
        </Box>
      </Box>

      {/* Collectable Indicator */}
      {collectable && (
        <Box sx={styles.collectableIndicator}>
          <Typography sx={styles.collectableText}>
            Defeat this beast to collect it
          </Typography>
        </Box>
      )}

      {/* Beast Health Bar */}
      <Box sx={collectable ? styles.collectableHealthBarContainer : styles.healthBarContainer}>
        <Typography
          variant="h6"
          sx={{ mr: 4, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: beastNameSize(beast?.name || ''), height: '26px', lineHeight: '24px' }}
        >
          {beast?.name || 'Beast'}
        </Typography>
        <Box sx={{ mr: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={(beastHealth / beast!.health) * 100}
              sx={styles.beastHealthBar}
            />
            <Typography
              variant="body2"
              sx={styles.healthOverlayText}
            >
              {beastHealth}/{beast!.health}
            </Typography>
          </Box>
          {/* Power Bar */}
          <Box sx={{ mt: 0.5, position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={beastPowerPercent(calculateLevel(adventurer!.xp), beastPower)}
              sx={styles.powerBar}
            />
            <Typography
              variant="body2"
              sx={styles.powerOverlayText}
            >
              Power: {beastPower}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Collectable Indicator */}
      {collectable && (
        <Box sx={styles.collectableIndicator}>
          <Typography sx={styles.collectableText}>
            Defeat this beast to collect it
          </Typography>
        </Box>
      )}
    </>
  );
}

const styles = {
  portraitWrapper: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 1)',
    border: '3px solid #083e22',
    boxShadow: '0 0 8px rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  collectablePortraitWrapper: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 1)',
    border: '3px solid #EDCF33',
    boxShadow: '0 0 8px rgba(0,0,0,0.6)',
    zIndex: 100,
    animation: `${pulseGold} 2s infinite ease-in-out`,
  },
  healthBarContainer: {
    position: 'absolute',
    top: 30,
    right: '80px',
    width: '300px',
    height: '72px',
    padding: '4px 8px',
    background: 'rgba(24, 40, 24, 0.55)',
    border: '2px solid #083e22',
    borderRadius: '12px',
    boxSizing: 'border-box',
    backdropFilter: 'blur(8px)',
  },
  collectableHealthBarContainer: {
    position: 'absolute',
    top: 30,
    right: '80px',
    width: '300px',
    height: '72px',
    padding: '4px 8px',
    background: 'rgba(24, 40, 24, 0.55)',
    border: '2px solid #EDCF33',
    borderRadius: '12px',
    boxSizing: 'border-box',
    backdropFilter: 'blur(8px)',
    animation: `${pulseGold} 2s infinite ease-in-out`,
  },
  beastHealthBar: {
    height: '14px',
    borderRadius: '6px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#FF0000',
      boxShadow: '0 0 8px rgba(255, 0, 0, 0.5)',
    },
  },
  healthOverlayText: {
    position: 'absolute',
    top: 1,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    textShadow: '0 0 4px #000',
    pointerEvents: 'none',
  },
  levelText: {
    fontWeight: 'bold',
    fontSize: '13px',
    lineHeight: '5px',
  },
  beastLevelCircle: {
    position: 'absolute',
    bottom: -4,
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #083e22',
    zIndex: 150,
  },
  collectableLevelCircle: {
    border: '2px solid #EDCF33',
    animation: `${pulseGold} 2s infinite ease-in-out`,
  },
  powerBar: {
    height: '12px',
    borderRadius: '5px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#d7c529', // darker golden color for power
      boxShadow: '0 0 8px rgba(184, 134, 11, 0.5)',
    },
  },
  powerOverlayText: {
    position: 'absolute',
    top: 0.5,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    textShadow: '0 0 3px #000',
    pointerEvents: 'none',
    fontSize: '0.70rem',
  },
  collectableIndicator: {
    position: 'absolute',
    top: 110,
    right: '80px',
    width: '300px',
    textAlign: 'center',
  },
  collectableText: {
    color: '#EDCF33',
    fontSize: '0.75rem',
    textAlign: 'center',
    textShadow: '0 0 8px rgba(237, 207, 51, 0.3)',
    lineHeight: '1.1',
  },
}; 