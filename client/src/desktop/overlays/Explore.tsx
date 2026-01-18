import { useGameDirector } from '@/desktop/contexts/GameDirector';
import { useExplorationWorker } from '@/hooks/useExplorationWorker';
import { useGameStore } from '@/stores/gameStore';
import { useMarketStore } from '@/stores/marketStore';
import { useUIStore } from '@/stores/uiStore';
import { streamIds } from '@/utils/cloudflare';
import { getEventTitle } from '@/utils/events';
import { calculateLevel } from '@/utils/game';
import { ItemUtils, Tier } from '@/utils/loot';
import { potionPrice } from '@/utils/market';
import { Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import BeastCollectedPopup from '../../components/BeastCollectedPopup';
import Adventurer from './Adventurer';
import InventoryOverlay from './Inventory';
import MarketOverlay from './Market';
import SettingsOverlay from './Settings';
import TipsOverlay from './Tips';

export default function ExploreOverlay() {
  const { executeGameAction, actionFailed, setVideoQueue } = useGameDirector();
  const { exploreLog, adventurer, setShowOverlay, collectable, collectableTokenURI,
    setCollectable, selectedStats, setSelectedStats, claimInProgress, spectating, gameSettings } = useGameStore();
  const { cart } = useMarketStore();
  const { skipAllAnimations, advancedMode } = useUIStore();
  const [isExploring, setIsExploring] = useState(false);

  // Use Web Worker for lethal chance calculations (Monte Carlo, 100k samples)
  const { ambushLethalChance, trapLethalChance } = useExplorationWorker(
    adventurer ?? null,
    gameSettings ?? null,
  );

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }

    return `${value.toFixed(1)}%`;
  };

  useEffect(() => {
    setIsExploring(false);
  }, [adventurer!.action_count, actionFailed]);

  useEffect(() => {
    if (adventurer!.stat_upgrades_available === 0) {
      setSelectedStats({ strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0 });
    }
  }, [adventurer!.stat_upgrades_available]);

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
    executeGameAction({
      type: 'select_stat_upgrades',
      statUpgrades: selectedStats
    });
  };

  const handleCheckout = () => {
    const slotsToEquip = new Set<string>();
    let itemPurchases = cart.items.map(item => {
      const slot = ItemUtils.getItemSlot(item.id).toLowerCase();
      const slotEmpty = adventurer?.equipment[slot as keyof typeof adventurer.equipment]?.id === 0;
      const shouldEquip = (slotEmpty && !slotsToEquip.has(slot))
        || slot === 'weapon' && [Tier.T1, Tier.T2].includes(ItemUtils.getItemTier(item.id)) && ItemUtils.getItemTier(adventurer?.equipment.weapon.id!) === Tier.T5;

      if (shouldEquip) {
        slotsToEquip.add(slot);
      }
      return {
        item_id: item.id,
        equip: shouldEquip,
      };
    });

    const potionCost = potionPrice(calculateLevel(adventurer?.xp || 0), adventurer?.stats?.charisma || 0);
    const totalCost = cart.items.reduce((sum, item) => sum + item.price, 0) + (cart.potions * potionCost);
    const remainingGold = (adventurer?.gold || 0) - totalCost;

    executeGameAction({
      type: 'buy_items',
      potions: cart.potions,
      itemPurchases,
      remainingGold,
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

      <InventoryOverlay disabledEquip={isExploring} />
      <TipsOverlay />
      <SettingsOverlay />

      <MarketOverlay disabledPurchase={isExploring} />

      {/* Bottom Buttons */}
      {!spectating && <Box sx={[styles.buttonContainer, advancedMode && styles.advancedButtonContainer]}>
        {advancedMode && <Box sx={styles.lethalChancesContainer}>
          <Typography sx={styles.lethalChanceLabel}>
            Ambush Lethal Chance
            <Typography component="span" sx={styles.lethalChanceValue}>
              {formatPercent(ambushLethalChance)}
            </Typography>
          </Typography>
          <Typography sx={styles.lethalChanceLabel}>
            Trap Lethal Chance
            <Typography component="span" sx={styles.lethalChanceValue}>
              {formatPercent(trapLethalChance)}
            </Typography>
          </Typography>
        </Box>}

        {adventurer?.stat_upgrades_available! > 0 ? (
          <Button
            variant="contained"
            onClick={handleSelectStats}
            sx={{
              ...styles.exploreButton,
              ...(Object.values(selectedStats).reduce((a, b) => a + b, 0) === adventurer?.stat_upgrades_available && styles.selectStatsButtonHighlighted)
            }}
            disabled={Object.values(selectedStats).reduce((a, b) => a + b, 0) !== adventurer?.stat_upgrades_available}
          >
            <Typography sx={styles.buttonText}>Select Stats</Typography>
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={cart.items.length > 0 || cart.potions > 0 ? handleCheckout : handleExplore}
            sx={styles.exploreButton}
            disabled={isExploring}
          >
            {isExploring ? (
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
  lethalChancesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
  },
  lethalChanceLabel: {
    fontSize: '0.9rem',
    color: '#d0c98d',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  lethalChanceValue: {
    fontWeight: 600,
    color: '#ff6b6b',
  },
  advancedButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(8, 62, 34, 0.8)',
    background: 'rgba(24, 40, 24, 0.85)',
    backdropFilter: 'blur(8px)',
  },
};