import { useGameDirector } from '@/mobile/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { getEventIcon, getEventTitle } from '@/utils/events';
import { Box, Button, Typography, keyframes } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import AdventurerInfo from '../components/AdventurerInfo';
import BeastCollectedPopup from '@/components/BeastCollectedPopup';

export default function ExploreScreen() {
  const { executeGameAction, actionFailed } = useGameDirector();
  const { exploreLog, collectable, collectableTokenURI, setCollectable } = useGameStore();

  const [untilBeast, setUntilBeast] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Function to scroll to top
  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    scrollToTop();
    setIsExploring(false);
  }, [exploreLog, actionFailed]);

  const handleExplore = async () => {
    setIsExploring(true);
    executeGameAction({ type: 'explore', untilBeast });
  };

  return (
    <Box sx={styles.container}>
      {/* Main Content */}
      <Box sx={styles.mainContent}>
        {/* XP Progress Section */}
        <Box sx={styles.characterInfo}>
          <AdventurerInfo />
        </Box>

        {/* Event History */}
        <Box sx={styles.section}>
          <Box sx={styles.sectionHeader}>
            <Typography sx={styles.sectionTitle}>Explorer Log</Typography>
          </Box>

          <Box sx={styles.encountersList} ref={listRef}>
            {exploreLog.map((event, index) => (
              <Box
                key={`${exploreLog.length - index}`}
                sx={{
                  ...styles.encounter,
                  animation: `${fadeIn} 0.5s ease-in-out`,
                }}
              >
                <Box sx={styles.encounterIcon}>
                  <img src={getEventIcon(event)} alt={'encounter'} style={{ width: '100%', height: '100%' }} />
                </Box>

                <Box sx={styles.encounterDetails}>
                  <Typography sx={styles.encounterTitle}>{getEventTitle(event)}</Typography>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {typeof event.xp_reward === 'number' && event.xp_reward > 0 && (
                      <Typography sx={styles.encounterXP}>+{event.xp_reward} XP</Typography>
                    )}

                    {event.type === 'obstacle' && (
                      <Typography sx={styles.encounterXP}>
                        {event.obstacle?.dodged ? '' : `-${event.obstacle?.damage} Health ${event.obstacle?.critical_hit ? 'critical hit!' : ''}`}
                      </Typography>
                    )}

                    {typeof event.gold_reward === 'number' && event.gold_reward > 0 && (
                      <Typography sx={styles.encounterXP}>
                        +{event.gold_reward} Gold
                      </Typography>
                    )}

                    {event.type === 'discovery' && event.discovery?.type && (
                      <>
                        {event.discovery.type === 'Gold' && (
                          <Typography sx={styles.encounterXP}>
                            +{event.discovery.amount} Gold
                          </Typography>
                        )}
                        {event.discovery.type === 'Health' && (
                          <Typography sx={styles.encounterXP}>
                            +{event.discovery.amount} Health
                          </Typography>
                        )}
                      </>
                    )}

                    {event.type === 'stat_upgrade' && event.stats && (
                      <Typography sx={styles.encounterXP}>
                        {Object.entries(event.stats)
                          .filter(([_, value]) => typeof value === 'number' && value > 0)
                          .map(([stat, value]) => `+${value} ${stat.slice(0, 3).toUpperCase()}`)
                          .join(', ')}
                      </Typography>
                    )}

                    {event.type === 'level_up' && event.level && (
                      <Typography sx={styles.encounterXP}>
                        Reached Level {event.level}
                      </Typography>
                    )}

                    {event.type === 'buy_items' && typeof event.potions === 'number' && event.potions > 0 && (
                      <Typography sx={styles.encounterXP}>
                        {`+${event.potions} Potions`}
                      </Typography>
                    )}

                    {event.items_purchased && event.items_purchased.length > 0 && (
                      <Typography sx={styles.encounterXP}>
                        +{event.items_purchased.length} Items
                      </Typography>
                    )}

                    {event.items && event.items.length > 0 && (
                      <Typography sx={styles.encounterXP}>
                        {event.items.length} items
                      </Typography>
                    )}

                    {event.type === 'beast' && (
                      <Typography sx={styles.encounterXP}>
                        Level {event.beast?.level} Power {event.beast?.tier! * event.beast?.level!}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Stats and Controls */}
        <Box textAlign="center">
          {/* Explore Controls */}
          <Button
            variant="contained"
            onClick={handleExplore}
            disabled={isExploring}
            sx={styles.exploreButton}
          >
            {isExploring
              ? <Box display={'flex'} alignItems={'baseline'}>
                <Typography variant={'h4'} lineHeight={'16px'}>
                  EXPLORING
                </Typography>
                <div className='dotLoader green' />
              </Box>
              : <Typography variant={'h4'} lineHeight={'16px'}>
                EXPLORE
              </Typography>
            }
          </Button>
        </Box>
      </Box>

      {collectable && collectableTokenURI && (
        <BeastCollectedPopup
          onClose={() => setCollectable(null)}
          tokenURI={collectableTokenURI}
        />
      )}
    </Box>
  );
}

const fadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  xpSection: {
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    padding: '16px',
  },
  levelInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  levelText: {
    color: '#EDCF33',
    fontFamily: 'VT323, monospace',
    fontSize: '1rem',
  },
  xpText: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '1.1rem',
  },
  nextLevelText: {
    color: 'rgba(237, 207, 51, 0.7)',
    fontFamily: 'VT323, monospace',
    fontSize: '1.1rem',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  progressBar: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '& .MuiLinearProgress-bar': {
      background: 'linear-gradient(90deg, #80FF00, #9dff33)',
      borderRadius: '4px',
    },
  },
  xpToNext: {
    color: 'rgba(237, 207, 51, 0.7)',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  section: {
    padding: 1,
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    height: '24px',
  },
  sectionTitle: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '1.2rem',
    lineHeight: '24px',
  },
  encountersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    pr: 1,
    maxHeight: '300px',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(128, 255, 0, 0.1)',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(128, 255, 0, 0.3)',
      borderRadius: '3px',
    },
  },
  encounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
  encounterIcon: {
    fontSize: '1.5rem',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encounterDetails: {
    flex: 1,
  },
  encounterTitle: {
    color: 'rgba(128, 255, 0, 0.9)',
    fontFamily: 'VT323, monospace',
    fontSize: '1rem',
  },
  encounterXP: {
    color: '#EDCF33',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
  },
  bottomSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statsContainer: {
    display: 'flex',
    gap: 2,
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    padding: '16px',
  },
  statItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  statLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.85rem',
    fontFamily: 'VT323, monospace',
    lineHeight: 1,
  },
  healthContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  healthBar: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#80FF00',
    },
  },
  healthValue: {
    color: '#80FF00',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  goldValue: {
    color: '#EDCF33',
    fontSize: '1.2rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  controlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    padding: '16px',
  },
  exploreButton: {
    width: '100%',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    height: '42px',
    background: 'rgba(128, 255, 0, 0.15)',
    color: '#80FF00',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    marginBottom: '8px',
    '&:disabled': {
      background: 'rgba(128, 255, 0, 0.1)',
      color: 'rgba(128, 255, 0, 0.5)',
      border: '1px solid rgba(128, 255, 0, 0.1)',
    },
  },
  switch: {
    '& .MuiSwitch-thumb': {
      backgroundColor: '#80FF00',
    },
    '& .MuiSwitch-track': {
      backgroundColor: 'rgba(128, 255, 0, 0.3)',
    },
  },
  switchLabel: {
    color: 'rgba(128, 255, 0, 0.8)',
    fontFamily: 'VT323, monospace',
    fontSize: '1rem',
  },
  characterInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
};