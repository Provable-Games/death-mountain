import { STARTING_HEALTH } from '@/constants/game';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { CombatStats, Equipment } from '@/types/game';
import { calculateLevel } from '@/utils/game';
import { ItemUtils, Tier } from '@/utils/loot';
import { potionPrice } from '@/utils/market';
import { Box, Checkbox, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useDesktopHotkey, useHotkeyToggle } from '@/desktop/hooks/useDesktopHotkey';

export default function TipsOverlay({ combatStats }: { combatStats?: CombatStats }) {
  const { adventurer, beast, gameSettings, newMarket } = useGameStore();
  const { showHotkeys, setShowHotkeys, toggleShowHotkeys } = useUIStore();

  const [showTips, setShowTips] = useState(() => {
    // Load initial state from localStorage, default to true if not set
    const saved = localStorage.getItem('tips-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [currentTip, setCurrentTip] = useState<string>('');

  const maxHealth = STARTING_HEALTH + (adventurer!.stats.vitality * 15);
  const potionCost = potionPrice(calculateLevel(adventurer?.xp || 0), adventurer?.stats?.charisma || 0);

  // Save to localStorage whenever showTips changes
  useEffect(() => {
    localStorage.setItem('tips-enabled', JSON.stringify(showTips));
  }, [showTips]);

  useEffect(() => {
    let tip = "";

    if (adventurer?.stat_upgrades_available! > 0) {
      if (adventurer?.stats.dexterity === 0) {
        tip = "Upgrade Dexterity to flee from dangerous beasts";
      } else if (adventurer?.stats.charisma! < 3) {
        tip = "Upgrade Charisma to get cheaper prices at the market";
      } else if (adventurer?.stats.charisma! < Math.floor(calculateLevel(adventurer?.xp!) / 2)) {
        tip = "Potions are expensive, upgrade Charisma to reduce costs";
      }
    } else if (adventurer?.beast_health === 0 && adventurer?.gold > 0) {
      if (adventurer?.health! < maxHealth * 0.6 && adventurer?.gold! >= potionCost) {
        tip = "Low health, buy healing potions from the market";
      } else if (ItemUtils.getItemTier(adventurer?.equipment.weapon.id) === Tier.T5 && newMarket) {
        tip = "You need a better weapon, check the market for upgrades";
      } else if (['chest', 'head', 'waist', 'foot', 'hand'].map(slot => adventurer?.equipment[slot as keyof Equipment]).some(item => !item?.id) && newMarket) {
        tip = "You have empty armor slots, buy armor from the market";
      }
    } else if (beast && adventurer?.beast_health! === beast.health && combatStats) {
      let power = Math.min(100, Math.floor(combatStats.baseDamage / beast.health * 100)) + combatStats.protection;
      let fullPower = Math.min(100, Math.floor(combatStats.baseDamage / beast.health * 100)) + combatStats.bestProtection;

      if (power >= 100) {
        tip = "You can defeat this beast, attack it!";
      } else if (power <= 50 && adventurer?.stats.dexterity! > 0) {
        tip = "This beast is too strong, try to flee";
      } else if (fullPower >= 100 && power <= 50) {
        tip = "Equip your best gear to defeat this beast";
      }
    }

    setCurrentTip(tip);
  }, [adventurer]);

  const tipsHotkeyOptions = useMemo(() => ({
    preventDefault: true,
  }), []);

  // Leave this listener always enabled so players can reveal hints even when hidden.
  const hotkeyToggleOptions = useMemo(() => ({
    preventDefault: true,
  }), []);

  // 't' flips the tips checkbox for quick keyboard access.
  useHotkeyToggle('t', setShowTips, tipsHotkeyOptions);

  // Keep the on-screen toggle independent of the keyboard shortcut.
  useDesktopHotkey('h', toggleShowHotkeys, hotkeyToggleOptions);
  // Previously this only worked while hints were visible:
  // useDesktopHotkey('h', () => setShowHotkeys((prev) => !prev), { enabled: showHotkeys });

  return (
    <>
      {/* Tips Toggle Button - positioned next to inventory */}
      <Box sx={styles.toggleStack}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleWrapper} onClick={() => setShowTips(!showTips)}>
            <Checkbox
              checked={showTips}
              onChange={(e) => setShowTips(e.target.checked)}
              size="large"
              sx={styles.tipsCheckbox}
            />
            <Typography sx={styles.toggleLabel}>
              {/* Surface the tips shortcut only when players opt into hotkey overlays. */}
              Tips
              {showHotkeys && (
                <>
                  <br />
                  <span className='hotkey-hint'>[T]</span>
                </>
              )}
            </Typography>
          </Box>
          {/* Clicking still toggles visibility so players can hide the overlay without the keyboard. */}
          <Box sx={styles.toggleWrapper} onClick={() => setShowHotkeys(!showHotkeys)}>
            <Checkbox
              checked={showHotkeys}
              onChange={(e) => setShowHotkeys(e.target.checked)}
              size="large"
              sx={styles.tipsCheckbox}
            />
            <Typography sx={styles.toggleLabel}>
              {/* Hide the [H] cue when hints are collapsed, but leave the keyboard toggle active. */}
              Hotkeys
              {showHotkeys && (
                <>
                  <br />
                  <span className='hotkey-hint'>[H]</span>
                </>
              )}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tips Display Box */}
      {showTips && currentTip && (
        <Box sx={styles.tipsBox}>
          <Typography sx={styles.tipsText}>
            {currentTip}
          </Typography>
        </Box>
      )}
    </>
  );
}

const styles = {
  toggleStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    left: 138,
    zIndex: 100,
    gap: 0.5,
  },
  toggleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  toggleWrapper: {
    width: 64,
    height: 64,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  tipsCheckbox: {
    color: 'rgba(208, 201, 141, 0.7)',
    padding: '0',
    '&.Mui-checked': {
      color: '#d0c98d',
    },
  },
  toggleLabel: {
    fontFamily: 'Cinzel, Georgia, serif',
    lineHeight: '1.3',
    textAlign: 'center',
    marginTop: '2px',
  },
  tipsBox: {
    position: 'absolute',
    bottom: 85,
    left: 135,
    width: '300px',
    maxWidth: '300px',
    background: 'rgba(24, 40, 24, 0.95)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    boxShadow: '0 4px 16px 4px #000b',
    backdropFilter: 'blur(8px)',
    zIndex: 1001,
    padding: 1.5,
    display: 'flex',
    flexDirection: 'column',
  },
  tipsText: {
    color: '#e6d28a',
    fontSize: '0.9rem',
    lineHeight: 1.4,
    textShadow: '0 1px 2px #000',
    userSelect: 'none',
  },
}; 
