import { useController } from "@/contexts/controller";
import { useStatChanges } from "@/hooks/useStatChanges";
import { useGameStore } from "@/stores/gameStore";
import { calculateLevel, calculateNextLevelXP, calculateProgress } from "@/utils/game";
import { LinearProgress, Typography, keyframes } from "@mui/material";

import { STARTING_HEALTH } from "@/constants/game";
import { Box } from "@mui/material";

// CSS Keyframes for stat change animations (mobile - green text)
const statIncreaseMobile = keyframes`
  0% { transform: scale(1); color: #80FF00; text-shadow: 0 0 0px transparent; }
  10% { transform: scale(1.3); color: #FFD700; text-shadow: 0 0 14px rgba(255, 215, 0, 1); }
  50% { transform: scale(1.15); color: #FFD700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.7); }
  100% { transform: scale(1); color: #80FF00; text-shadow: 0 0 0px transparent; }
`;

const statDecreaseMobile = keyframes`
  0% { transform: scale(1); color: #80FF00; text-shadow: 0 0 0px transparent; }
  10% { transform: scale(1.3); color: #ef5350; text-shadow: 0 0 14px rgba(239, 83, 80, 1); }
  50% { transform: scale(1.15); color: #ef5350; text-shadow: 0 0 10px rgba(239, 83, 80, 0.7); }
  100% { transform: scale(1); color: #80FF00; text-shadow: 0 0 0px transparent; }
`;

export default function AdventurerInfo() {
  const { openProfile, playerName } = useController();
  const { adventurer, metadata } = useGameStore();
  
  // Track stat changes from equipment for animation
  const { changes: statChanges, version: statChangeVersion } = useStatChanges(adventurer?.stats);
  
  // Calculate level using the proper function
  const level = calculateLevel(adventurer?.xp || 1);
  const progress = calculateProgress(adventurer?.xp || 1);
  const nextLevelXP = calculateNextLevelXP(level);
  const xpToNextLevel = nextLevelXP - (adventurer?.xp || 0);
  const maxHealth = STARTING_HEALTH + (adventurer!.stats.vitality * 15);

  return (
    <>
      <Box sx={styles.characterHeader}>
        <Box onClick={openProfile}>
          <Typography variant="h4" sx={styles.characterName}>
            {metadata?.player_name || playerName || 'Adventurer'}
          </Typography>
        </Box>
        <Box sx={styles.headerStats}>
          <Box sx={styles.goldContainer}>
            <Typography variant="body2" sx={styles.levelText}>
              {adventurer?.gold || 0} Gold
            </Typography>
          </Box>
          <Box sx={styles.goldContainer}>
            <Typography variant="body2" sx={styles.levelText}>
              Level {level}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Health and XP Bars */}
      <Box sx={styles.statsContainer}>
        <Box sx={styles.statItem}>
          <Typography variant="body2" sx={styles.statLabel}>Health</Typography>
          <LinearProgress
            variant="determinate"
            value={(adventurer?.health || 0) / maxHealth * 100}
            sx={styles.healthBar}
          />
          <Typography variant="body2" sx={styles.statValue}>
            {adventurer?.health || 0}/{maxHealth}
          </Typography>
        </Box>
        <Box sx={styles.statItem}>
          <Typography variant="body2" sx={styles.statLabel}>XP</Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={styles.xpBar}
          />
          <Box sx={styles.xpInfo}>
            <Typography variant="body2" sx={styles.statValue}>
              {adventurer?.xp || 0}
            </Typography>
            <Typography variant="body2" sx={styles.xpToNext}>
              {xpToNextLevel} to next level
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Box sx={styles.statsGrid}>
        <Box sx={styles.statCard}>
          <Typography sx={styles.statLabel}>STR</Typography>
          <Typography sx={styles.statValue}>
            <Box
              component="span"
              key={`str-${statChangeVersion}`}
              sx={{
                display: 'inline-block',
                ...(statChanges.strength === 'increase' && { animation: `${statIncreaseMobile} 1.5s ease-out` }),
                ...(statChanges.strength === 'decrease' && { animation: `${statDecreaseMobile} 1.5s ease-out` }),
              }}
            >
              {adventurer?.stats?.strength || 0}
            </Box>
          </Typography>
        </Box>
        <Box sx={styles.statCard}>
          <Typography sx={styles.statLabel}>DEX</Typography>
          <Typography sx={styles.statValue}>
            <Box
              component="span"
              key={`dex-${statChangeVersion}`}
              sx={{
                display: 'inline-block',
                ...(statChanges.dexterity === 'increase' && { animation: `${statIncreaseMobile} 1.5s ease-out` }),
                ...(statChanges.dexterity === 'decrease' && { animation: `${statDecreaseMobile} 1.5s ease-out` }),
              }}
            >
              {adventurer?.stats?.dexterity || 0}
            </Box>
          </Typography>
        </Box>
        <Box sx={styles.statCard}>
          <Typography sx={styles.statLabel}>VIT</Typography>
          <Typography sx={styles.statValue}>
            <Box
              component="span"
              key={`vit-${statChangeVersion}`}
              sx={{
                display: 'inline-block',
                ...(statChanges.vitality === 'increase' && { animation: `${statIncreaseMobile} 1.5s ease-out` }),
                ...(statChanges.vitality === 'decrease' && { animation: `${statDecreaseMobile} 1.5s ease-out` }),
              }}
            >
              {adventurer?.stats?.vitality || 0}
            </Box>
          </Typography>
        </Box>
        <Box sx={styles.statCard}>
          <Typography sx={styles.statLabel}>INT</Typography>
          <Typography sx={styles.statValue}>
            <Box
              component="span"
              key={`int-${statChangeVersion}`}
              sx={{
                display: 'inline-block',
                ...(statChanges.intelligence === 'increase' && { animation: `${statIncreaseMobile} 1.5s ease-out` }),
                ...(statChanges.intelligence === 'decrease' && { animation: `${statDecreaseMobile} 1.5s ease-out` }),
              }}
            >
              {adventurer?.stats?.intelligence || 0}
            </Box>
          </Typography>
        </Box>
        <Box sx={styles.statCard}>
          <Typography sx={styles.statLabel}>WIS</Typography>
          <Typography sx={styles.statValue}>
            <Box
              component="span"
              key={`wis-${statChangeVersion}`}
              sx={{
                display: 'inline-block',
                ...(statChanges.wisdom === 'increase' && { animation: `${statIncreaseMobile} 1.5s ease-out` }),
                ...(statChanges.wisdom === 'decrease' && { animation: `${statDecreaseMobile} 1.5s ease-out` }),
              }}
            >
              {adventurer?.stats?.wisdom || 0}
            </Box>
          </Typography>
        </Box>
        <Box sx={styles.statCard}>
          <Typography sx={styles.statLabel}>CHA</Typography>
          <Typography sx={styles.statValue}>
            <Box
              component="span"
              key={`cha-${statChangeVersion}`}
              sx={{
                display: 'inline-block',
                ...(statChanges.charisma === 'increase' && { animation: `${statIncreaseMobile} 1.5s ease-out` }),
                ...(statChanges.charisma === 'decrease' && { animation: `${statDecreaseMobile} 1.5s ease-out` }),
              }}
            >
              {adventurer?.stats?.charisma || 0}
            </Box>
          </Typography>
        </Box>
        <Box sx={styles.statCard}>
          <Typography sx={styles.statLabel}>LUCK</Typography>
          <Typography sx={styles.statValue}>
            <Box
              component="span"
              key={`luck-${statChangeVersion}`}
              sx={{
                display: 'inline-block',
                ...(statChanges.luck === 'increase' && { animation: `${statIncreaseMobile} 1.5s ease-out` }),
                ...(statChanges.luck === 'decrease' && { animation: `${statDecreaseMobile} 1.5s ease-out` }),
              }}
            >
              {adventurer?.stats?.luck || 0}
            </Box>
          </Typography>
        </Box>
      </Box>
    </>
  )
}

const styles = {
  characterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterName: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
  },
  levelText: {
    color: '#EDCF33',
    fontFamily: 'VT323, monospace',
  },
  statsContainer: {
    display: 'flex',
    gap: 2,
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
  statValue: {
    color: '#80FF00',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  healthBar: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#80FF00',
    },
  },
  xpBar: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(237, 207, 51, 0.1)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#EDCF33',
    },
  },
  xpInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  xpToNext: {
    color: 'rgba(237, 207, 51, 0.7)',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
  },
  goldContainer: {
    background: 'rgba(237, 207, 51, 0.1)',
    padding: '0 8px',
    borderRadius: '6px',
    border: '1px solid rgba(237, 207, 51, 0.2)',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
  },
  goldValue: {
    color: '#EDCF33',
    fontSize: '0.85rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    lineHeight: '24px',
  },
  headerStats: {
    display: 'flex',
    gap: '8px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '4px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '4px',
    py: '4px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
};
