import { MAX_STAT_VALUE } from '@/constants/game';
import { useStatChanges } from '@/hooks/useStatChanges';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { ability_based_percentage, calculateLevel } from '@/utils/game';
import { suggestBestCombatGear } from '@/utils/gearSuggestion';
import { ItemUtils } from '@/utils/loot';
import { potionPrice } from '@/utils/market';
import { Box, Button, Tooltip, Typography, keyframes } from '@mui/material';
import { useState, useMemo } from 'react';

// CSS Keyframes for stat change animations
const statIncrease = keyframes`
  0% { transform: scale(1); color: #d0c98d; text-shadow: 0 0 0px transparent; font-weight: normal; }
  10% { transform: scale(1.3); color: #00FF00; text-shadow: 0 0 14px rgba(0, 255, 0, 1); font-weight: bold; }
  50% { transform: scale(1.15); color: #00FF00; text-shadow: 0 0 10px rgba(0, 255, 0, 0.7); font-weight: bold; }
  100% { transform: scale(1); color: #d0c98d; text-shadow: 0 0 0px transparent; font-weight: normal; }
`;

const statDecrease = keyframes`
  0% { transform: scale(1); color: #d0c98d; text-shadow: 0 0 0px transparent; font-weight: normal; }
  10% { transform: scale(1.3); color: #ef5350; text-shadow: 0 0 14px rgba(239, 83, 80, 1); font-weight: bold; }
  50% { transform: scale(1.15); color: #ef5350; text-shadow: 0 0 10px rgba(239, 83, 80, 0.7); font-weight: bold; }
  100% { transform: scale(1); color: #d0c98d; text-shadow: 0 0 0px transparent; font-weight: normal; }
`;

const STAT_DESCRIPTIONS = {
  strength: "Increases attack damage.",
  dexterity: "Increases chance of fleeing Beasts.",
  vitality: "Increases your maximum health.",
  intelligence: "Increases chance of dodging Obstacles.",
  wisdom: "Increases chance of avoiding Beast ambush.",
  charisma: "Provides discounts on the marketplace.",
  luck: "Increases chance of critical hits. Based on the total level of all your equipped and bagged jewelry."
} as const;

export default function AdventurerStats() {
  const { advancedMode } = useUIStore();
  const { adventurer, bag, beast, selectedStats, setSelectedStats, applyGearSuggestion } = useGameStore();
  const [suggestInProgress, setSuggestInProgress] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState<string | null>(null);

  const equippedItemStats = useMemo(() => {
    return ItemUtils.getEquippedItemStats(adventurer!, bag);
  }, [adventurer, bag]);

  // Track stat changes from equipment for animation
  const { changes: statChanges, version: statChangeVersion } = useStatChanges(adventurer?.stats);

  const totalSelected = Object.values(selectedStats).reduce((a, b) => a + b, 0);
  const pointsRemaining = adventurer!.stat_upgrades_available - totalSelected;

  const handleStatIncrement = (stat: keyof typeof STAT_DESCRIPTIONS) => {
    if (pointsRemaining > 0 && (selectedStats[stat] + adventurer!.stats[stat]) < (MAX_STAT_VALUE + equippedItemStats[stat])) {
      setSelectedStats({
        ...selectedStats,
        [stat]: selectedStats[stat] + 1
      });
    }
  };

  const handleStatDecrement = (stat: keyof typeof STAT_DESCRIPTIONS) => {
    if (selectedStats[stat] > 0) {
      setSelectedStats({
        ...selectedStats,
        [stat]: selectedStats[stat] - 1
      });
    }
  };

  const handleSuggestGear = async () => {
    if (!adventurer || !bag || !beast) {
      return;
    }

    setSuggestInProgress(true);
    setSuggestMessage(null);

    try {
      const suggestion = await suggestBestCombatGear(adventurer, bag, beast);

      if (!suggestion) {
        setSuggestMessage('Best gear already equipped');
        setTimeout(() => setSuggestMessage(null), 4000);
        return;
      }

      applyGearSuggestion({ adventurer: suggestion.adventurer, bag: suggestion.bag });
      setSuggestMessage('Gear equipped');
      setTimeout(() => setSuggestMessage(null), 4000);
    } catch (error) {
      console.error('Failed to suggest combat gear', error);
      setSuggestMessage('Unable to suggest gear');
      setTimeout(() => setSuggestMessage(null), 4000);
    } finally {
      setSuggestInProgress(false);
    }
  };

  function STAT_TITLE(stat: string) {
    if (stat === 'intelligence') {
      return 'Intellect';
    }

    if (stat === "luck") {
      return 'Crit Chance';
    }

    return stat.charAt(0).toUpperCase() + stat.slice(1);
  }

  function STAT_HELPER_TEXT(stat: string, currentValue: number) {
    const level = calculateLevel(adventurer!.xp);

    if (stat === 'strength') {
      return `+${currentValue * 10}% damage`;
    } else if (stat === 'dexterity') {
      return `${ability_based_percentage(adventurer!.xp, currentValue)}% chance`;
    } else if (stat === 'vitality') {
      return `+${currentValue * 15} Health`;
    } else if (stat === 'intelligence') {
      return `${ability_based_percentage(adventurer!.xp, currentValue)}% chance`;
    } else if (stat === 'wisdom') {
      return `${ability_based_percentage(adventurer!.xp, currentValue)}% chance`;
    } else if (stat === 'charisma') {
      return advancedMode ? `Potions: ${potionPrice(level, currentValue)} gold`
        : (
          <Box>
            <Typography sx={styles.tooltipValue}>Potion cost: {potionPrice(level, currentValue)} Gold</Typography>
            <Typography sx={styles.tooltipValue}>Item discount: {currentValue} Gold</Typography>
          </Box>
        );
    } else if (stat === 'luck') {
      return `${currentValue}% chance of critical hits`;
    }
    return null;
  }

  const renderAdvancedStatsView = () => (
    <>
      <Box sx={styles.statGrid}>
        {['strength', 'dexterity', 'vitality', 'intelligence', 'wisdom', 'charisma'].map((stat) => {
          const totalStatValue = adventurer?.stats?.[stat as keyof typeof STAT_DESCRIPTIONS]! + selectedStats[stat as keyof typeof STAT_DESCRIPTIONS]!;
          const effectText = STAT_HELPER_TEXT(stat, totalStatValue);

          return (
            <Box sx={styles.statRow} key={stat}>
              <Box sx={styles.statInfo}>
                <Typography sx={styles.statLabel}>{STAT_TITLE(stat)}</Typography>
                {effectText && (
                  <Typography sx={styles.statEffect}>{effectText}</Typography>
                )}
              </Box>
              <Box sx={styles.statControls}>
                {adventurer?.stat_upgrades_available! > 0 && stat !== 'luck' && <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStatDecrement(stat as keyof typeof STAT_DESCRIPTIONS)}
                  disabled={selectedStats[stat as keyof typeof STAT_DESCRIPTIONS] === 0}
                  sx={styles.controlButton}
                >
                  -
                </Button>}

                <Typography sx={styles.statValue}>
                  <Box
                    component="span"
                    key={`adv-${stat}-${statChangeVersion}`}
                    sx={{
                      display: 'inline-block',
                      color: selectedStats[stat as keyof typeof STAT_DESCRIPTIONS] > 0 ? '#4caf50' : '#d0c98d',
                      ...(statChanges[stat as keyof typeof STAT_DESCRIPTIONS] === 'increase' && {
                        animation: `${statIncrease} 1.5s ease-out`,
                      }),
                      ...(statChanges[stat as keyof typeof STAT_DESCRIPTIONS] === 'decrease' && {
                        animation: `${statDecrease} 1.5s ease-out`,
                      }),
                    }}
                  >
                    {totalStatValue}
                  </Box>
                </Typography>

                {adventurer?.stat_upgrades_available! > 0 && stat !== 'luck' && <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStatIncrement(stat as keyof typeof STAT_DESCRIPTIONS)}
                  disabled={(adventurer!.stats[stat as keyof typeof STAT_DESCRIPTIONS] + selectedStats[stat as keyof typeof STAT_DESCRIPTIONS]) >= (MAX_STAT_VALUE + equippedItemStats[stat as keyof typeof STAT_DESCRIPTIONS])}
                  sx={styles.controlButton}
                >
                  +
                </Button>}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0.5 }}>
        {adventurer?.stat_upgrades_available! > 0 &&
          <Typography color="secondary" >{pointsRemaining} remaining</Typography>
        }
      </Box>
    </>
  );

  const renderStatsView = () => (
    <>
      {Object.entries(STAT_DESCRIPTIONS).filter(([stat]) => (adventurer!.stat_upgrades_available! > 0 ? stat !== 'luck' : true)).map(([stat, description]) => (
        <Box sx={styles.statRow} key={stat}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip
              title={
                <Box sx={styles.tooltipContainer}>
                  <Box sx={styles.tooltipTypeRow}>
                    <Typography sx={styles.tooltipTypeText}>
                      {STAT_TITLE(stat)}
                    </Typography>
                    <Typography sx={styles.tooltipTypeText}>
                      {adventurer?.stats?.[stat as keyof typeof STAT_DESCRIPTIONS]! + selectedStats[stat as keyof typeof STAT_DESCRIPTIONS]!}
                    </Typography>
                  </Box>
                  <Box sx={styles.sectionDivider} />
                  <Box sx={styles.tooltipSection}>
                    <Typography sx={styles.tooltipDescription}>
                      {description}
                    </Typography>
                    <Box sx={styles.tooltipRow}>
                      <Typography sx={styles.tooltipLabel}>Current Effect:</Typography>
                      <Typography sx={styles.tooltipValue}>
                        {STAT_HELPER_TEXT(stat, adventurer?.stats?.[stat as keyof typeof STAT_DESCRIPTIONS]! + selectedStats[stat as keyof typeof STAT_DESCRIPTIONS]!)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              }
              arrow
              placement="right"
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'preventOverflow',
                      enabled: true,
                      options: { rootBoundary: 'viewport' },
                    },
                  ],
                },
                tooltip: {
                  sx: {
                    bgcolor: 'transparent',
                    border: 'none',
                  },
                },
              }}
            >
              <Box sx={styles.infoIcon}>i</Box>
            </Tooltip>
            <Typography sx={styles.statLabel}>{STAT_TITLE(stat)}</Typography>
          </Box>
          <Box sx={styles.statControls}>
            {adventurer?.stat_upgrades_available! > 0 && stat !== 'luck' && <Button
              variant="contained"
              size="small"
              onClick={() => handleStatDecrement(stat as keyof typeof STAT_DESCRIPTIONS)}
              disabled={selectedStats[stat as keyof typeof STAT_DESCRIPTIONS] === 0}
              sx={styles.controlButton}
            >
              -
            </Button>}

            <Typography sx={{
              width: '18px',
              textAlign: 'center',
              pt: '1px',
            }}>
              <Box
                component="span"
                key={`${stat}-${statChangeVersion}`}
                sx={{
                  display: 'inline-block',
                  color: selectedStats[stat as keyof typeof STAT_DESCRIPTIONS] > 0 ? '#4caf50' : '#d0c98d',
                  ...(statChanges[stat as keyof typeof STAT_DESCRIPTIONS] === 'increase' && {
                    animation: `${statIncrease} 1.5s ease-out`,
                  }),
                  ...(statChanges[stat as keyof typeof STAT_DESCRIPTIONS] === 'decrease' && {
                    animation: `${statDecrease} 1.5s ease-out`,
                  }),
                }}
              >
                {adventurer?.stats?.[stat as keyof typeof STAT_DESCRIPTIONS]! + selectedStats[stat as keyof typeof STAT_DESCRIPTIONS]!}
              </Box>
            </Typography>

            {adventurer?.stat_upgrades_available! > 0 && stat !== 'luck' && <Button
              variant="contained"
              size="small"
              onClick={() => handleStatIncrement(stat as keyof typeof STAT_DESCRIPTIONS)}
              disabled={(adventurer!.stats[stat as keyof typeof STAT_DESCRIPTIONS] + selectedStats[stat as keyof typeof STAT_DESCRIPTIONS]) >= (MAX_STAT_VALUE + equippedItemStats[stat as keyof typeof STAT_DESCRIPTIONS])}
              sx={styles.controlButton}
            >
              +
            </Button>}
          </Box>
        </Box>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0.5 }}>
        {adventurer?.stat_upgrades_available! > 0 &&
          <Typography color="secondary" >{pointsRemaining} remaining</Typography>
        }
      </Box>
    </>
  );

  return (
    <>
      <Box sx={{
        ...styles.statsPanel,
        ...(adventurer?.stat_upgrades_available! > 0 && pointsRemaining > 0 && styles.statsPanelHighlighted),
        ...(adventurer?.stat_upgrades_available! > 0 && pointsRemaining === 0 && styles.statsPanelBorderOnly)
      }}>
        {adventurer?.stat_upgrades_available! > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={styles.selectStatsText}>
              Select Stats
            </Typography>
          </Box>
        )}
        {advancedMode ? renderAdvancedStatsView() : renderStatsView()}
        
        {/* Suggest Optimal Gear Button - shown during combat */}
        {advancedMode && beast && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mt: 1 }}>
            {suggestMessage && (
              <Typography sx={styles.suggestMessage}>
                {suggestMessage}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleSuggestGear}
              sx={styles.suggestButton}
              disabled={suggestInProgress}
            >
              <Typography sx={styles.suggestButtonText}>
                {suggestInProgress ? 'Suggesting...' : 'Suggest Optimal Gear'}
              </Typography>
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
}

const styles = {
  statsPanel: {
    flex: 1,
    background: 'rgba(24, 40, 24, 0.95)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    padding: '10px 8px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    boxShadow: '0 0 8px #000a',
    transition: 'all 0.3s ease-in-out',
  },
  statsPanelHighlighted: {
    border: '1px solid #d7c529',
    boxShadow: '0 0 12px rgba(215, 197, 41, 0.4), 0 0 8px #000a',
    background: 'rgba(24, 40, 24, 0.98)',
    animation: 'containerPulse 2s ease-in-out infinite',
    '@keyframes containerPulse': {
      '0%': {
        boxShadow: '0 0 12px rgba(215, 197, 41, 0.4), 0 0 8px #000a',
      },
      '50%': {
        boxShadow: '0 0 20px rgba(215, 197, 41, 0.6), 0 0 8px #000a',
      },
      '100%': {
        boxShadow: '0 0 12px rgba(215, 197, 41, 0.4), 0 0 8px #000a',
      },
    },
  },
  statsPanelBorderOnly: {
    border: '1px solid #d7c529',
    boxShadow: '0 0 8px #000a',
    background: 'rgba(24, 40, 24, 0.98)',
  },
  dropdown: {
    minWidth: '120px',
  },
  selectStatsText: {
    color: '#d7c529',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },

  select: {
    color: '#d0c98d',
    fontSize: '14px',
    fontWeight: '500',
    '& .MuiSelect-select': {
      padding: '2px 8px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#083e22',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d0c98d',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d0c98d',
    },
  },
  menuPaper: {
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '1px solid #083e22',
    '& .MuiMenuItem-root': {
      color: '#d0c98d',
      '&:hover': {
        backgroundColor: 'rgba(8, 62, 34, 0.5)',
      },
      '&.Mui-selected': {
        backgroundColor: 'rgba(8, 62, 34, 0.8)',
      },
    },
  },
  statsTitle: {
    fontWeight: '500',
    fontSize: 16,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(12, 24, 14, 0.9)',
    borderRadius: '6px',
    padding: '6px 8px',
    border: '1px solid rgba(8, 62, 34, 0.6)',
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '500',
    pt: '1px'
  },
  infoIcon: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '1px solid #d0c98d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#d0c98d',
    cursor: 'help',
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    padding: '10px',
    zIndex: 1000,
    minWidth: '250px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  tooltipTypeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    padding: '2px 0',
  },
  tooltipTypeText: {
    color: '#d0c98d',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  tooltipSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '4px 0',
  },
  tooltipDescription: {
    fontSize: '13px',
  },
  tooltipRow: {
    display: 'flex',
    flexDirection: 'column',
  },
  tooltipLabel: {
    color: '#d7c529',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tooltipValue: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sectionDivider: {
    height: '1px',
    backgroundColor: '#d7c529',
    opacity: 0.2,
    margin: '8px 0 4px',
  },
  statControls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    marginLeft: 'auto',
  },
  controlButton: {
    minWidth: '20px',
    height: '20px',
    padding: '0',
    background: 'rgba(215, 197, 41, 0.2)',
    color: '#d7c529',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
    borderRadius: '3px',
    border: '1px solid rgba(215, 197, 41, 0.4)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      background: 'rgba(215, 197, 41, 0.3)',
      border: '1px solid rgba(215, 197, 41, 0.6)',
      transform: 'scale(1.05)',
    },
    '&:disabled': {
      background: 'rgba(0, 0, 0, 0.1)',
      color: 'rgba(255, 255, 255, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transform: 'none',
    },
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    columnGap: 0,
    rowGap: '6px',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flexGrow: 1,
    minWidth: 0,
  },
  statEffect: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 1.2,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  },
  statValue: {
    width: '26px',
    textAlign: 'center',
    fontSize: '14px',
    pt: '1px',
    flexShrink: 0,
  },
  advancedStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 0.5,
    border: '2px solid rgba(8, 62, 34, 0.85)',
    borderRadius: '6px',
    padding: '8px',
    background: 'rgba(18, 30, 18, 0.92)',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.5)',
  },
  suggestButton: {
    width: '100%',
    background: 'rgba(28, 40, 60, 0.95)',
    borderRadius: '6px',
    border: '2px solid #5a7ac4',
    padding: '6px 12px',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    '&:hover': {
      background: 'rgba(36, 50, 80, 1)',
      borderColor: '#7090e0',
    },
    '&:disabled': {
      background: 'rgba(28, 40, 60, 0.5)',
      borderColor: 'rgba(90, 122, 196, 0.4)',
    },
  },
  suggestButtonText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#90b0f0',
    textTransform: 'none',
  },
  suggestMessage: {
    fontSize: '11px',
    color: 'rgba(208, 201, 141, 0.8)',
    textAlign: 'center',
  },
}; 