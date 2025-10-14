import { useGameDirector } from '@/desktop/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { useMarketStore } from '@/stores/marketStore';
import { streamIds } from '@/utils/cloudflare';
import { getEventTitle } from '@/utils/events';
import { ItemUtils } from '@/utils/loot';
import { Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import BeastCollectedPopup from '../../components/BeastCollectedPopup';
import Adventurer from './Adventurer';
import InventoryOverlay from './Inventory';
import MarketOverlay from './Market';
import TipsOverlay from './Tips';
import SettingsOverlay from './Settings';
import { useUIStore } from '@/stores/uiStore';
import { useSnackbar } from 'notistack';

export default function ExploreOverlay() {
  const { executeGameAction, actionFailed, setVideoQueue, spectating } = useGameDirector();
  const { exploreLog, adventurer, setShowOverlay, collectable, collectableTokenURI,
    setCollectable, selectedStats, setSelectedStats, claimInProgress } = useGameStore();
  const { cart, inProgress, setInProgress } = useMarketStore();
  const { skipAllAnimations } = useUIStore();
  const { enqueueSnackbar } = useSnackbar()

  const [isExploring, setIsExploring] = useState(false);
  const [isSelectingStats, setIsSelectingStats] = useState(false);

  useEffect(() => {
    setIsExploring(false);
    setIsSelectingStats(false);
    setInProgress(false);
    setSelectedStats({ strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0 });
  }, [adventurer!.action_count, actionFailed]);

  const handleExplore = async () => {
    if (!skipAllAnimations) {
      setShowOverlay(false);
      setVideoQueue([streamIds.explore]);
    } else {
      setIsExploring(true);
    }

    executeGameAction({ type: 'explore', untilBeast: false });
  };

  const handleSelectStats = async () => {
    setIsSelectingStats(true);
    executeGameAction({
      type: 'select_stat_upgrades',
      statUpgrades: selectedStats
    });
  };

  const handleCheckout = () => {
    setInProgress(true);

    let itemPurchases = cart.items.map(item => ({
      item_id: item.id,
      equip: adventurer?.equipment[ItemUtils.getItemSlot(item.id).toLowerCase() as keyof typeof adventurer.equipment]?.id === 0 ? true : false,
    }));

    executeGameAction({
      type: 'buy_items',
      potions: cart.potions,
      itemPurchases,
    });
  };

  const event = exploreLog[0];

  return (
    <Box sx={[styles.container, spectating && styles.spectating]}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/game.png')` }]} />

      {/* Adventurer Overlay */}
      <Adventurer />

      {/* Middle Section for Event Log */}
      <Box sx={styles.middleSection}>
        <Box sx={styles.eventLogContainer}>
          {event && <Box sx={styles.encounterDetails}>
            <Typography variant="h6">
              {getEventTitle(event)}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, textAlign: 'center', justifyContent: 'center' }}>
              {typeof event.xp_reward === 'number' && event.xp_reward > 0 && (
                <Typography color='secondary'>+{event.xp_reward} XP</Typography>
              )}

              {event.type === 'obstacle' && (
                <Typography color='secondary'>
                  {event.obstacle?.dodged ? '' : `-${event.obstacle?.damage} Health ${event.obstacle?.critical_hit ? 'critical hit!' : ''}`}
                </Typography>
              )}

              {typeof event.gold_reward === 'number' && event.gold_reward > 0 && (
                <Typography color='secondary'>
                  +{event.gold_reward} Gold
                </Typography>
              )}

              {event.type === 'discovery' && event.discovery?.type && (
                <>
                  {event.discovery.type === 'Gold' && (
                    <Typography color='secondary'>
                      +{event.discovery.amount} Gold
                    </Typography>
                  )}
                  {event.discovery.type === 'Health' && (
                    <Typography color='secondary'>
                      +{event.discovery.amount} Health
                    </Typography>
                  )}
                </>
              )}

              {event.type === 'stat_upgrade' && event.stats && (
                <Typography color='secondary'>
                  {Object.entries(event.stats)
                    .filter(([_, value]) => typeof value === 'number' && value > 0)
                    .map(([stat, value]) => `+${value} ${stat.slice(0, 3).toUpperCase()}`)
                    .join(', ')}
                </Typography>
              )}

              {event.type === 'level_up' && event.level && (
                <Typography color='secondary'>
                  Reached Level {event.level}
                </Typography>
              )}

              {event.type === 'buy_items' && typeof event.potions === 'number' && event.potions > 0 && (
                <Typography color='secondary'>
                  {`+${event.potions} Potions`}
                </Typography>
              )}

              {event.items_purchased && event.items_purchased.length > 0 && (
                <Typography color='secondary'>
                  +{event.items_purchased.length} Items
                </Typography>
              )}

              {event.items && event.items.length > 0 && (
                <Typography color='secondary'>
                  {event.items.length} items
                </Typography>
              )}

              {event.type === 'beast' && (
                <Typography color='secondary'>
                  Level {event.beast?.level} Power {event.beast?.tier! * event.beast?.level!}
                </Typography>
              )}
            </Box>
          </Box>}
        </Box>
      </Box>

      <InventoryOverlay disabledEquip={isExploring || isSelectingStats || inProgress} />
      <TipsOverlay />
      <SettingsOverlay />

      <MarketOverlay />

      {/* Bottom Buttons */}
      {!spectating && <Box sx={styles.buttonContainer}>
        {adventurer?.stat_upgrades_available! > 0 ? (
          <Button
            variant="contained"
            onClick={handleSelectStats}
            sx={{
              ...styles.exploreButton,
              ...(Object.values(selectedStats).reduce((a, b) => a + b, 0) === adventurer?.stat_upgrades_available && styles.selectStatsButtonHighlighted)
            }}
            disabled={isSelectingStats || Object.values(selectedStats).reduce((a, b) => a + b, 0) !== adventurer?.stat_upgrades_available}
          >
            {isSelectingStats
              ? <Box display={'flex'} alignItems={'baseline'}>
                <Typography sx={styles.buttonText}>Selecting Stats</Typography>
                <div className='dotLoader yellow' style={{ opacity: 0.5 }} />
              </Box>
              : <Typography sx={styles.buttonText}>Select Stats</Typography>
            }
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={cart.items.length > 0 || cart.potions > 0 ? handleCheckout : handleExplore}
            sx={styles.exploreButton}
            disabled={inProgress || isExploring}
          >
            {inProgress ? (
              <Box display={'flex'} alignItems={'baseline'}>
                <Typography sx={styles.buttonText}>Processing</Typography>
                <div className='dotLoader yellow' style={{ opacity: 0.5 }} />
              </Box>
            ) : isExploring ? (
              <Box display={'flex'} alignItems={'baseline'}>
                <Typography sx={styles.buttonText}>Exploring</Typography>
                <div className='dotLoader yellow' style={{ opacity: 0.5 }} />
              </Box>
            ) : (
              <Typography sx={styles.buttonText}>
                {cart.items.length > 0 || cart.potions > 0 ? 'BUY ITEMS' : 'EXPLORE'}
              </Typography>
            )}
          </Button>
        )}
      </Box>}

      {claimInProgress && (
        <Box sx={styles.toastContainer}>
          <Typography sx={styles.toastText}>Collecting Beast</Typography>
          <div className='dotLoader yellow' />
        </Box>
      )}

      {collectable && collectableTokenURI && (
        <BeastCollectedPopup
          onClose={() => setCollectable(null)}
          tokenURI={collectableTokenURI}
          beast={collectable}
        />
      )}
    </Box>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  spectating: {
    boxSizing: 'border-box',
    border: '1px solid rgba(128, 255, 0, 0.6)',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#000',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '16px',
  },
  exploreButton: {
    border: '2px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(24, 40, 24, 1)',
    minWidth: '250px',
    height: '48px',
    justifyContent: 'center',
    borderRadius: '8px',
    '&:hover': {
      border: '2px solid rgba(34, 60, 34, 1)',
      background: 'rgba(34, 60, 34, 1)',
    },
    '&:disabled': {
      background: 'rgba(24, 40, 24, 1)',
      borderColor: 'rgba(8, 62, 34, 0.5)',
      boxShadow: 'none',
      '& .MuiTypography-root': {
        opacity: 0.5,
      },
    },
  },
  buttonText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 600,
    fontSize: '1.1rem',
    color: '#d0c98d',
    letterSpacing: '1px',
    lineHeight: 1.6,
  },
  middleSection: {
    position: 'absolute',
    top: 30,
    left: '50%',
    width: '340px',
    padding: '6px 8px',
    border: '2px solid #083e22',
    borderRadius: '12px',
    background: 'rgba(24, 40, 24, 0.55)',
    backdropFilter: 'blur(8px)',
    transform: 'translateX(-50%)',
  },
  eventLogContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventLogText: {
    color: '#d0c98d',
    fontSize: '1rem',
    textAlign: 'center',
    width: '100%',
  },
  encounter: {
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
  encounterDetails: {
    flex: 1,
    textAlign: 'center',
  },
  selectStatsButtonHighlighted: {
    animation: 'buttonPulse 2s ease-in-out infinite',
    '@keyframes buttonPulse': {
      '0%': {
        boxShadow: '0 0 0 rgba(215, 197, 41, 0)',
      },
      '50%': {
        boxShadow: '0 0 10px rgba(215, 197, 41, 0.6)',
      },
      '100%': {
        boxShadow: '0 0 0 rgba(215, 197, 41, 0)',
      },
    },
  },
  toastContainer: {
    display: 'flex',
    alignItems: 'baseline',
    position: 'absolute',
    top: 98,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 20px',
    borderRadius: '8px',
    background: 'rgba(24, 40, 24, 0.9)',
    border: '1px solid #d0c98d80',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
  },
  toastText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#d0c98d',
    letterSpacing: '0.5px',
    margin: 0,
  },
};