import { MAX_STAT_VALUE } from '@/constants/game';
import { useGameDirector } from '@/mobile/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { Stats } from '@/types/game';
import { screenVariants } from '@/utils/animations';
import { ability_based_damage_reduction, ability_based_percentage, calculateLevel } from '@/utils/game';
import { ItemUtils } from '@/utils/loot';
import { potionPrice } from '@/utils/market';
import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

const STAT_DESCRIPTIONS = {
  strength: "Increases attack damage.",
  dexterity: "Increases chance of fleeing Beasts.",
  vitality: "Increases your maximum health.",
  intelligence: "Increases chance of dodging Obstacles.",
  wisdom: "Increases chance of avoiding Beast ambush.",
  charisma: "Provides discounts on the marketplace."
};

const STAT_DESCRIPTIONS_REDUCTION = {
  ...STAT_DESCRIPTIONS,
  intelligence: "Reduces damage taken by Obstacles.",
  wisdom: "Reduces damage taken by Beast ambush.",
};

const STAT_ICONS = {
  strength: '/images/types/Strength.svg',
  dexterity: '/images/types/Dexterity.svg',
  vitality: '/images/types/Vitality.svg',
  intelligence: '/images/types/Intelligence.svg',
  wisdom: '/images/types/Wisdom.svg',
  charisma: '/images/types/Charisma.svg',
  luck: '/images/types/Luck.svg',
};

export default function StatSelectionScreen() {
  const { adventurer, gameSettings, bag } = useGameStore();
  const { executeGameAction } = useGameDirector();

  const [selectedStats, setSelectedStats] = useState<Stats>({
    strength: 0,
    dexterity: 0,
    vitality: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
    luck: 0
  });

  const equippedItemStats = useMemo(() => {
    return ItemUtils.getEquippedItemStats(adventurer!, bag);
  }, [adventurer, bag]);

  const handleStatIncrement = (stat: keyof Stats) => {
    if (pointsRemaining > 0 && (selectedStats[stat] + adventurer!.stats[stat]) < (MAX_STAT_VALUE + equippedItemStats[stat])) {
      setSelectedStats(prev => ({
        ...prev,
        [stat]: prev[stat] + 1
      }));
    }
  };

  const handleStatDecrement = (stat: keyof Stats) => {
    if (selectedStats[stat] > 0) {
      setSelectedStats(prev => ({
        ...prev,
        [stat]: prev[stat] - 1
      }));
    }
  };

  const handleSelectStats = async () => {
    executeGameAction({ type: 'select_stat_upgrades', statUpgrades: selectedStats });
  };

  const totalSelected = Object.values(selectedStats).reduce((a, b) => a + b, 0);
  const pointsRemaining = adventurer!.stat_upgrades_available - totalSelected;

  function STAT_HELPER_TEXT(stat: keyof Stats) {
    const level = calculateLevel(adventurer!.xp);

    if (stat === 'strength') {
      if (selectedStats[stat] === 0) return null;
      return `+${selectedStats.strength * 10}% damage`;
    } else if (stat === 'dexterity') {
      let currentDexterity = adventurer!.stats.dexterity;
      let newDexterity = currentDexterity + selectedStats.dexterity;
      if (selectedStats[stat] === 0) return `${ability_based_percentage(adventurer!.xp, currentDexterity)}% chance of fleeing`;
      return `${ability_based_percentage(adventurer!.xp, currentDexterity)}% → ${ability_based_percentage(adventurer!.xp, newDexterity)}%`;
    } else if (stat === 'vitality') {
      let newVitality = selectedStats.vitality;
      if (selectedStats[stat] === 0) return null;
      return `+${newVitality * 15} Health`;
    } else if (stat === 'intelligence') {
      let currentIntelligence = adventurer!.stats.intelligence;
      let newIntelligence = currentIntelligence + selectedStats.intelligence;

      if (gameSettings?.stats_mode === 'Reduction') {
        if (selectedStats[stat] === 0) return `${ability_based_damage_reduction(adventurer!.xp, currentIntelligence)}% damage reduction`;
        return `${ability_based_damage_reduction(adventurer!.xp, currentIntelligence)}% → ${ability_based_damage_reduction(adventurer!.xp, newIntelligence)}%`;
      }

      if (selectedStats[stat] === 0) return `${ability_based_percentage(adventurer!.xp, currentIntelligence)}% chance of avoiding obstacles`;
      return `${ability_based_percentage(adventurer!.xp, currentIntelligence)}% → ${ability_based_percentage(adventurer!.xp, newIntelligence)}%`;
    } else if (stat === 'wisdom') {
      let currentWisdom = adventurer!.stats.wisdom;
      let newWisdom = currentWisdom + selectedStats.wisdom;

      if (gameSettings?.stats_mode === 'Reduction') {
        if (selectedStats[stat] === 0) return `${ability_based_damage_reduction(adventurer!.xp, currentWisdom)}% damage reduction`;
        return `${ability_based_damage_reduction(adventurer!.xp, currentWisdom)}% → ${ability_based_damage_reduction(adventurer!.xp, newWisdom)}%`;
      }

      if (selectedStats[stat] === 0) return `${ability_based_percentage(adventurer!.xp, currentWisdom)}% chance of avoiding ambush`;
      return `${ability_based_percentage(adventurer!.xp, currentWisdom)}% → ${ability_based_percentage(adventurer!.xp, newWisdom)}%`;
    } else if (stat === 'charisma') {
      let currentCharisma = adventurer!.stats.charisma;
      let newCharisma = currentCharisma + selectedStats.charisma;
      return <Box>
        <Typography sx={{ lineHeight: '1.1', opacity: 0.6 }}>Potion cost: {potionPrice(level, newCharisma)} Gold</Typography>
        <Typography sx={{ lineHeight: '1.1', opacity: 0.6 }}>Item discount: {newCharisma} Gold</Typography>
      </Box>
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={screenVariants}
      style={styles.container}
    >
      <Box sx={styles.content}>
        <Typography variant="h4" sx={styles.title}>
          Select Stat Upgrades
        </Typography>

        <Box sx={styles.pointsContainer}>
          <Typography sx={styles.pointsText}>
            Points Remaining: {pointsRemaining}
          </Typography>
        </Box>

        <Box sx={styles.statsGrid}>
          {Object.entries(gameSettings?.stats_mode === 'Reduction' ? STAT_DESCRIPTIONS_REDUCTION : STAT_DESCRIPTIONS).map(([stat, description]) => (
            <Box key={stat} sx={styles.statCard}>
              <Box sx={styles.statHeader}>
                <Box sx={styles.statTitleContainer}>
                  <img
                    src={STAT_ICONS[stat as keyof typeof STAT_ICONS]}
                    alt={`${stat} icon`}
                    style={{
                      width: '16px',
                      height: '16px',
                      marginRight: '8px',
                      filter: 'brightness(0) saturate(100%) invert(84%) sepia(29%) saturate(1012%) hue-rotate(60deg) brightness(103%) contrast(101%)'
                    }}
                  />
                  <Typography sx={styles.statName}>
                    {stat === 'intelligence' ? 'Intellect' : stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {(adventurer!.stats[stat as keyof Stats] + selectedStats[stat as keyof Stats]) >= (MAX_STAT_VALUE + equippedItemStats[stat as keyof Stats]) && (
                    <Typography sx={styles.maxValueIndicator}>
                      (MAX)
                    </Typography>
                  )}

                  <Typography sx={styles.currentValue}>
                    {adventurer!.stats[stat as keyof Stats] + selectedStats[stat as keyof Stats]}
                  </Typography>
                </Box>
              </Box>

              <Typography sx={styles.statDescription}>
                {description}
              </Typography>

              <Box sx={styles.statHelperText}>
                {STAT_HELPER_TEXT(stat as keyof Stats)}
              </Box>

              <Box sx={styles.statControls}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStatDecrement(stat as keyof Stats)}
                  sx={styles.controlButton}
                >
                  -
                </Button>
                <Typography sx={styles.selectedValue}>
                  {selectedStats[stat as keyof Stats]}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStatIncrement(stat as keyof Stats)}
                  disabled={(adventurer!.stats[stat as keyof Stats] + selectedStats[stat as keyof Stats]) >= (MAX_STAT_VALUE + equippedItemStats[stat as keyof Stats])}
                  sx={styles.controlButton}
                >
                  +
                </Button>
              </Box>
            </Box>
          ))}
        </Box>

        <Button
          variant="contained"
          onClick={handleSelectStats}
          disabled={pointsRemaining !== 0}
          sx={styles.selectButton}
        >
          <Typography variant={'h4'} lineHeight={'16px'}>
            Select Stats
          </Typography>
        </Button>
      </Box>
    </motion.div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column' as const,
    overflowY: 'auto' as const,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  title: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
    textAlign: 'center',
    fontSize: '1.5rem',
  },
  pointsContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '6px 12px',
    background: 'rgba(237, 207, 51, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(237, 207, 51, 0.2)',
  },
  pointsText: {
    color: '#EDCF33',
    fontSize: '1.1rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    flex: 1,
    maxWidth: '500px',
    margin: '0 auto',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '8px',
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.08), rgba(128, 255, 0, 0.03))',
    borderRadius: '10px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(128, 255, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
    backdropFilter: 'blur(8px)',
    maxWidth: '41dvw'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '6px',
    borderBottom: '1px solid rgba(128, 255, 0, 0.15)',
  },
  statTitleContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  statName: {
    color: '#80FF00',
    fontSize: '1rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    textShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
  },
  currentValue: {
    color: 'rgba(128, 255, 0, 0.9)',
    fontSize: '0.95rem',
    fontFamily: 'VT323, monospace',
    background: 'rgba(128, 255, 0, 0.15)',
    padding: '2px 8px',
    borderRadius: '4px',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  maxValueIndicator: {
    color: '#EDCF33',
    fontSize: '1rem',
    fontFamily: 'VT323, monospace',
    marginRight: '4px',
    opacity: 0.9,
  },
  statDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '0.95rem',
    fontFamily: 'VT323, monospace',
    lineHeight: '1.2',
    minHeight: '38px',
    px: '8px',
    py: '4px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  statHelperText: {
    color: 'rgba(128, 255, 0, 0.6)',
    fontSize: '0.95rem',
    fontFamily: 'VT323, monospace',
    lineHeight: '1.0',
    marginBottom: '6px',
    textAlign: 'center',
    minHeight: '30px',
  },
  statControls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: 'auto',
  },
  controlButton: {
    minWidth: '28px',
    height: '28px',
    padding: '0',
    background: 'rgba(0, 0, 0, 0.2)',
    color: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: '300',
    borderRadius: '4px',
    '&:disabled': {
      background: 'rgba(0, 0, 0, 0.1)',
      color: 'rgba(255, 255, 255, 0.3)',
    },
  },
  selectedValue: {
    color: '#80FF00',
    fontSize: '1.2rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    minWidth: '32px',
    textAlign: 'center',
    padding: '0 4px',
  },
  selectButton: {
    width: '100%',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    height: '42px',
    background: 'rgba(128, 255, 0, 0.15)',
    color: '#80FF00',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    marginBottom: '60px',
    '&:disabled': {
      background: 'rgba(128, 255, 0, 0.1)',
      color: 'rgba(128, 255, 0, 0.5)',
      border: '1px solid rgba(128, 255, 0, 0.1)',
    },
  },
}; 