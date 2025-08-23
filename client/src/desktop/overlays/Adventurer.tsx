import { STARTING_HEALTH } from '@/constants/game';
import { useGameStore } from '@/stores/gameStore';
import { useMarketStore } from '@/stores/marketStore';
import { CombatStats } from '@/types/game';
import { calculateLevel, calculateProgress } from '@/utils/game';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function Adventurer({ combatStats }: { combatStats?: CombatStats }) {
  const { adventurer, metadata, battleEvent, setShowInventory, showInventory, beast } = useGameStore();
  const { cart } = useMarketStore();

  const [health, setHealth] = useState(adventurer!.health);

  useEffect(() => {
    if (battleEvent && battleEvent.type === "beast_attack") {
      setHealth(prev => Math.max(0, prev - battleEvent?.attack?.damage!));
    }
  }, [battleEvent]);

  useEffect(() => {
    if (!beast) {
      setHealth(adventurer!.health);
    }
  }, [adventurer?.health]);

  const maxHealth = STARTING_HEALTH + (adventurer!.stats.vitality * 15);
  const healthPercent = (health / maxHealth) * 100;
  const potionHealth = cart.potions * 10;
  const previewHealth = Math.min(health + potionHealth, maxHealth);
  const previewHealthPercent = (previewHealth / maxHealth) * 100;
  const previewProtection = combatStats?.bestProtection || 0;
  const previewProtectionPercent = Math.min(100, previewProtection);
  const previewAttack = combatStats?.bestDamage || 0;
  const previewAttackPercent = Math.min(100, Math.floor(previewAttack / (beast?.health || 1) * 100));

  return (
    <>
      {/* Portrait */}
      <Box
        sx={{ ...styles.portraitWrapper, cursor: 'pointer' }}
        onClick={() => setShowInventory(!showInventory)}
      >
        <img src="/images/adventurer.png" alt="Adventurer" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
        <Box sx={styles.levelCircle}>
          <Typography variant="body2" sx={styles.levelText}>
            {calculateLevel(adventurer?.xp || 0)}
          </Typography>
        </Box>
      </Box>

      {/* Health Bar */}
      <Box sx={styles.healthBarContainer}>
        {/* Adventurer Name */}
        {!beast && <Typography
          variant="h6"
          sx={{ ml: 4, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', height: '26px', lineHeight: '24px' }}
        >
          {metadata?.player_name || 'Adventurer'}
        </Typography>}
        {/* HP Info */}
        <Box sx={{ ml: beast ? '42px' : '32px', display: 'flex', flexDirection: 'column', height: beast ? '100%' : 'initial', justifyContent: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            {beast && <Box sx={styles.healthIconContainer}>
              <span style={styles.heartIcon}>❤️</span>
            </Box>}
            <LinearProgress
              variant="determinate"
              value={healthPercent}
              sx={styles.adventurerHealthBar}
            />
            {cart.potions > 0 && (
              <LinearProgress
                variant="determinate"
                value={previewHealthPercent}
                sx={styles.previewHealthBar}
              />
            )}
            <Typography
              variant="body2"
              sx={styles.healthOverlayText}
            >
              {previewHealth}/{maxHealth}
            </Typography>
          </Box>
          {/* XP Bar */}
          <Box sx={{ mt: 1, position: 'relative' }}>
            {beast && combatStats ? (
              <>
                {/* Attack Bar */}
                <Box sx={{ position: 'relative', mb: 0.5 }}>
                  <Box sx={styles.iconContainer}>
                    <span style={styles.swordIcon}>⚔️</span>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.floor(combatStats.baseDamage / beast.health * 100))}
                    sx={styles.attackBar}
                  />
                  {previewAttack > combatStats.baseDamage && (
                    <LinearProgress
                      variant="determinate"
                      value={previewAttackPercent}
                      sx={styles.previewAttackBar}
                    />
                  )}
                </Box>
                {/* Defense Bar */}
                <Box sx={{ position: 'relative' }}>
                  <Box sx={styles.iconContainer}>
                    <span style={styles.shieldIcon}>🛡️</span>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={combatStats.protection}
                    sx={styles.defenseBar}
                  />
                  {previewProtection > combatStats.protection && (
                    <LinearProgress
                      variant="determinate"
                      value={previewProtectionPercent}
                      sx={styles.previewDefenseBar}
                    />
                  )}
                </Box>
              </>
            ) : (
              <>
                <LinearProgress
                  variant="determinate"
                  value={adventurer?.stat_upgrades_available! > 0 ? 100 : calculateProgress(adventurer?.xp || 1)}
                  sx={styles.xpBar}
                />
                <Typography
                  variant="body2"
                  sx={styles.xpOverlayText}
                >
                  {adventurer?.stat_upgrades_available! > 0 ? 'LEVEL UP' : 'XP'}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}

const styles = {
  portraitWrapper: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(24, 40, 24, 1)',
    border: '3px solid #083e22',
    boxShadow: '0 0 8px rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  healthBarContainer: {
    position: 'absolute',
    top: 30,
    left: '80px',
    width: '300px',
    height: '72px',
    padding: '4px 8px',
    background: 'rgba(24, 40, 24, 0.55)',
    border: '2px solid #083e22',
    borderRadius: '12px',
    boxSizing: 'border-box',
    backdropFilter: 'blur(8px)',
  },
  adventurerHealthBar: {
    height: '14px',
    borderRadius: '6px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#4CAF50',
      boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)',
    },
  },
  previewHealthBar: {
    height: '14px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    '& .MuiLinearProgress-bar': {
      backgroundColor: 'rgba(76, 175, 80, 0.3)',
      boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)',
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
  xpBar: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#9C27B0',
      boxShadow: '0 0 8px rgba(156, 39, 176, 0.5)',
    },
  },
  xpOverlayText: {
    position: 'absolute',
    top: 0,
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
    fontSize: '0.75rem',
  },
  levelCircle: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #083e22',
    zIndex: 1,
  },
  levelText: {
    fontWeight: 'bold',
    fontSize: '14px',
    lineHeight: '5px',
  },
  attackBar: {
    height: '12px',
    borderRadius: '5px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#FF8C00', // darker golden color for power
      boxShadow: '0 0 8px rgba(184, 134, 11, 0.5)',
    },
  },
  defenseBar: {
    height: '12px',
    borderRadius: '5px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#C0C0C0',
      boxShadow: '0 0 8px rgba(192, 192, 192, 0.5)',
    },
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    left: -16,
    width: '12px',
    height: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  swordIcon: {
    fontSize: '12px',
  },
  shieldIcon: {
    fontSize: '12px',
  },
  healthIconContainer: {
    position: 'absolute',
    top: 0,
    left: -16,
    width: '14px',
    height: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heartIcon: {
    fontSize: '12px',
  },
  previewDefenseBar: {
    height: '12px',
    borderRadius: '5px',
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    '& .MuiLinearProgress-bar': {
      backgroundColor: 'rgba(192, 192, 192, 0.3)',
    },
  },
  previewAttackBar: {
    height: '12px',
    borderRadius: '5px',
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    '& .MuiLinearProgress-bar': {
      backgroundColor: 'rgba(255, 140, 0, 0.3)',
    },
  },
}; 