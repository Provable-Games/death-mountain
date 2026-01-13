import AnimatedText from '@/desktop/components/AnimatedText';
import { useGameDirector } from '@/desktop/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { useCombatSimulation } from '@/hooks/useCombatSimulation';
import { ability_based_percentage, calculateAttackDamage, calculateCombatStats, calculateLevel, getNewItemsEquipped } from '@/utils/game';
import { potionPrice } from '@/utils/market';
import { Box, Button, Checkbox, Tooltip, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';
import Adventurer from './Adventurer';
import Beast from './Beast';
import InventoryOverlay from './Inventory';
import SettingsOverlay from './Settings';
import TipsOverlay from './Tips';
import { JACKPOT_BEASTS, GOLD_MULTIPLIER, GOLD_REWARD_DIVISOR, MINIMUM_XP_REWARD } from '@/constants/beast';
import { useDynamicConnector } from '@/contexts/starknet';
import { useUIStore } from '@/stores/uiStore';

const attackMessage = "Attacking";
const fleeMessage = "Attempting to flee";
const equipMessage = "Equipping items";

const tipPulseFight = keyframes`
  0% {
    box-shadow: 0 0 6px rgba(132, 196, 148, 0.35), 0 0 0 rgba(132, 196, 148, 0.0);
  }
  50% {
    box-shadow: 0 0 12px rgba(132, 196, 148, 0.65), 0 0 22px rgba(132, 196, 148, 0.35);
  }
  100% {
    box-shadow: 0 0 6px rgba(132, 196, 148, 0.35), 0 0 0 rgba(132, 196, 148, 0.0);
  }
`;

const tipPulseFlee = keyframes`
  0% {
    box-shadow: 0 0 6px rgba(214, 120, 118, 0.35), 0 0 0 rgba(214, 120, 118, 0.0);
  }
  50% {
    box-shadow: 0 0 12px rgba(214, 120, 118, 0.7), 0 0 20px rgba(214, 120, 118, 0.4);
  }
  100% {
    box-shadow: 0 0 6px rgba(214, 120, 118, 0.35), 0 0 0 rgba(214, 120, 118, 0.0);
  }
`;

const tipPulseGamble = keyframes`
  0% {
    box-shadow: 0 0 6px rgba(208, 180, 120, 0.3), 0 0 0 rgba(208, 180, 120, 0.0);
  }
  50% {
    box-shadow: 0 0 12px rgba(208, 180, 120, 0.6), 0 0 18px rgba(208, 180, 120, 0.3);
  }
  100% {
    box-shadow: 0 0 6px rgba(208, 180, 120, 0.3), 0 0 0 rgba(208, 180, 120, 0.0);
  }
`;

export default function CombatOverlay() {
  const { executeGameAction, actionFailed, setSkipCombat, skipCombat, showSkipCombat } = useGameDirector();
  const { currentNetworkConfig } = useDynamicConnector();
  const { gameId, adventurer, adventurerState, beast, battleEvent, bag, undoEquipment, spectating } = useGameStore();
  const { fastBattle, advancedMode } = useUIStore();

  const [untilDeath, setUntilDeath] = useState(false);
  const [untilLastHit, setUntilLastHit] = useState(false);
  const [autoLastHitActive, setAutoLastHitActive] = useState(false);
  const [lastHitActionCount, setLastHitActionCount] = useState<number | null>(null);
  const [attackInProgress, setAttackInProgress] = useState(false);
  const [fleeInProgress, setFleeInProgress] = useState(false);
  const [equipInProgress, setEquipInProgress] = useState(false);
  const [combatLog, setCombatLog] = useState("");

  useEffect(() => {
    if (adventurer?.xp === 0) {
      setCombatLog(beast!.baseName + " ambushed you for 10 damage!");
    }
  }, []);

  useEffect(() => {
    if (battleEvent && !skipCombat) {
      if (battleEvent.type === "attack" && !fastBattle) {
        setCombatLog(`You attacked ${beast!.baseName} for ${battleEvent.attack?.damage} damage ${battleEvent.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`);
      }

      else if (battleEvent.type === "beast_attack") {
        setCombatLog(`${beast!.baseName} attacked your ${battleEvent.attack?.location} for ${battleEvent.attack?.damage} damage ${battleEvent.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`);
      }

      else if (battleEvent.type === "flee") {
        if (battleEvent.success) {
          setCombatLog(`You successfully fled`);
        } else {
          setCombatLog(`You failed to flee`);
        }
      }

      else if (battleEvent.type === "ambush") {
        setCombatLog(`${beast!.baseName} ambushed your ${battleEvent.attack?.location} for ${battleEvent.attack?.damage} damage ${battleEvent.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`);
      }
    }
  }, [battleEvent]);

  useEffect(() => {
    setAttackInProgress(false);
    setFleeInProgress(false);
    setEquipInProgress(false);
    setAutoLastHitActive(false);
    setLastHitActionCount(null);

    if ([fleeMessage, attackMessage, equipMessage].includes(combatLog)) {
      setCombatLog("");
    }
  }, [actionFailed]);

  useEffect(() => {
    setEquipInProgress(false);

    if (!untilDeath && !autoLastHitActive) {
      setAttackInProgress(false);
      setFleeInProgress(false);
    }
  }, [adventurer!.action_count, untilDeath, autoLastHitActive]);

  const handleAttack = () => {
    if (!adventurer) {
      return;
    }

    if (beast?.isCollectable) {
      localStorage.setItem('collectable_beast', JSON.stringify({
        gameId,
        id: beast.id,
        specialPrefix: beast.specialPrefix,
        specialSuffix: beast.specialSuffix,
        name: beast.name,
        tier: beast.tier,
      }));
    }

    setAttackInProgress(true);
    setCombatLog(attackMessage);

    if (advancedMode && untilLastHit && !isFinalRound) {
      setAutoLastHitActive(true);
      setLastHitActionCount(adventurer.action_count);
    } else {
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
    }

    const fightToDeath = untilDeath && !(advancedMode && untilLastHit);
    executeGameAction({ type: 'attack', untilDeath: fightToDeath });
  };

  const handleFlee = () => {
    localStorage.removeItem('collectable_beast');
    setAutoLastHitActive(false);
    setLastHitActionCount(null);
    setFleeInProgress(true);
    setCombatLog(fleeMessage);
    executeGameAction({ type: 'flee', untilDeath });
  };

  const toggleUntilDeath = (checked: boolean) => {
    if (checked) {
      setUntilLastHit(false);
    }
    setUntilDeath(checked);
  };

  const toggleUntilLastHit = (checked: boolean) => {
    if (checked) {
      setUntilDeath(false);
    }
    setUntilLastHit(checked);
  };

  const handleEquipItems = () => {
    setEquipInProgress(true);
    setCombatLog(equipMessage);
    executeGameAction({ type: 'equip' });
  };

  const handleSkipCombat = () => {
    setSkipCombat(true);
  };

  // Determine if new items are equipped (beast attacks first)
  const hasNewItemsEquipped = useMemo(() => {
    if (!adventurer?.equipment || !adventurerState?.equipment) return false;
    return getNewItemsEquipped(adventurer.equipment, adventurerState.equipment).length > 0;
  }, [adventurer?.equipment, adventurerState?.equipment]);

  // Use optimized combat simulation hook with debouncing and state hashing
  const { simulationResult, simulationActionCount } = useCombatSimulation(
    adventurer ?? null,
    beast ?? null,
    bag,
    { debounceMs: 150, initialBeastStrike: hasNewItemsEquipped }
  );

  const combatControlsDisabled = attackInProgress || fleeInProgress || equipInProgress;
  const isFinalRound = simulationResult.hasOutcome && simulationResult.maxRounds <= 1;

  // Auto last hit logic - continue attacking until final round (only in advanced mode)
  useEffect(() => {
    if (!advancedMode || !autoLastHitActive || !untilLastHit) {
      return;
    }

    if (!adventurer || !beast) {
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
      setAttackInProgress(false);
      return;
    }

    // Wait for simulation to be ready
    if (!simulationResult.hasOutcome) {
      return;
    }

    // Check if we've reached the final round - stop auto attacking
    if (isFinalRound) {
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
      setAttackInProgress(false);
      return;
    }

    // Stop if there's any chance of dying (winRate < 100%)
    if (simulationResult.winRate < 100) {
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
      setAttackInProgress(false);
      return;
    }

    // Wait for simulation to match current action count
    if (simulationActionCount === null || simulationActionCount !== adventurer.action_count) {
      return;
    }

    // Skip if we already processed this action count
    if (lastHitActionCount !== null && adventurer.action_count <= lastHitActionCount) {
      return;
    }

    setLastHitActionCount(adventurer.action_count);

    const continueAttacking = async () => {
      try {
        setAttackInProgress(true);
        setCombatLog(attackMessage);
        await executeGameAction({ type: 'attack', untilDeath: false });
      } catch (error) {
        console.error('Failed to continue last-hit attack', error);
        setAutoLastHitActive(false);
        setLastHitActionCount(null);
        setAttackInProgress(false);
      }
    };

    void continueAttacking();
  }, [
    advancedMode,
    autoLastHitActive,
    untilLastHit,
    simulationResult.hasOutcome,
    simulationResult.winRate,
    simulationResult.minRounds,
    simulationResult.maxRounds,
    isFinalRound,
    simulationActionCount,
    executeGameAction,
    adventurer?.action_count,
    beast?.id,
    lastHitActionCount,
  ]);

  // Stop auto last hit when checkbox is unchecked
  useEffect(() => {
    if (!untilLastHit && autoLastHitActive) {
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
      setAttackInProgress(false);
    }
  }, [untilLastHit, autoLastHitActive]);

  // Uncheck until last hit when it's the final round
  useEffect(() => {
    if (isFinalRound && untilLastHit) {
      setUntilLastHit(false);
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
    }
  }, [isFinalRound, untilLastHit]);

  // Reset until last hit when advanced mode is turned off
  useEffect(() => {
    if (!advancedMode && (untilLastHit || autoLastHitActive)) {
      setUntilLastHit(false);
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
    }
  }, [advancedMode, untilLastHit, autoLastHitActive]);

  const fleePercentage = ability_based_percentage(adventurer!.xp, adventurer!.stats.dexterity);
  const combatStats = calculateCombatStats(adventurer!, bag, beast);

  const formatNumber = (value: number) => value.toLocaleString();
  const formatRange = (minValue: number, maxValue: number) => {
    if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
      return '-';
    }

    if (minValue === maxValue) {
      return formatNumber(minValue);
    }

    return `${formatNumber(minValue)} - ${formatNumber(maxValue)}`;
  };
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const combatOverview = useMemo(() => {
    if (!adventurer || !beast) {
      return null;
    }

    const adventurerLevel = calculateLevel(adventurer.xp);
    const beastTier = Math.min(5, Math.max(1, Number(beast.tier)));

    const tierKey = `T${beastTier}` as keyof typeof GOLD_MULTIPLIER;
    const goldMultiplier = GOLD_MULTIPLIER[tierKey] ?? 1;
    const goldReward = Math.max(
      0,
      Math.floor((beast.level * goldMultiplier) / GOLD_REWARD_DIVISOR)
    );

    const rawXp = Math.floor(((6 - beastTier) * beast.level) / 2);
    const adjustedXp = Math.floor(
      rawXp * (100 - Math.min(adventurerLevel * 2, 95)) / 100
    );
    const xpReward = Math.max(MINIMUM_XP_REWARD, adjustedXp);

    return {
      goldReward,
      xpReward,
    };
  }, [
    adventurer?.xp,
    adventurer?.equipment.weapon.id,
    adventurer?.equipment.weapon.xp,
    beast,
  ]);

  const adventurerLevel = useMemo(() => {
    if (!adventurer) {
      return 0;
    }

    return calculateLevel(adventurer.xp);
  }, [adventurer?.xp]);

  const willLevelUp = useMemo(() => {
    if (!adventurer || !combatOverview) {
      return false;
    }

    const currentLevel = calculateLevel(adventurer.xp);
    const newLevel = calculateLevel(adventurer.xp + combatOverview.xpReward);
    return newLevel > currentLevel;
  }, [adventurer?.xp, combatOverview?.xpReward]);

  const potionCost = useMemo(() => {
    if (!adventurer) {
      return 0;
    }

    return potionPrice(adventurerLevel, adventurer.stats.charisma ?? 0);
  }, [adventurerLevel, adventurer?.stats.charisma]);

  const potionCoverage = useMemo(() => {
    if (!combatOverview) {
      return { potions: 0, coverage: 0 };
    }

    if (potionCost <= 0) {
      return { potions: Number.POSITIVE_INFINITY, coverage: Number.POSITIVE_INFINITY };
    }

    const potions = Math.floor(combatOverview.goldReward / potionCost);
    return {
      potions,
      coverage: potions * 10,
    };
  }, [combatOverview?.goldReward, potionCost]);

  const potentialHealthChange = useMemo(() => {
    if (!simulationResult.hasOutcome) {
      return 0;
    }

    const damageTaken = Math.max(0, simulationResult.modeDamageTaken);
    if (potionCoverage.coverage === Number.POSITIVE_INFINITY) {
      return Number.POSITIVE_INFINITY;
    }

    return potionCoverage.coverage - damageTaken;
  }, [simulationResult.hasOutcome, simulationResult.modeDamageTaken, potionCoverage.coverage]);

  const isPotentialHealthNegative = simulationResult.hasOutcome
    && Number.isFinite(potentialHealthChange)
    && potentialHealthChange < 0;
  const isPotentialHealthPositive = simulationResult.hasOutcome
    && (potentialHealthChange === Number.POSITIVE_INFINITY || potentialHealthChange > 0);
  const potentialHealthChangeText = (() => {
    if (!simulationResult.hasOutcome) {
      return '-';
    }

    if (!Number.isFinite(potentialHealthChange)) {
      return '∞';
    }

    const rounded = Math.round(potentialHealthChange);
    if (rounded === 0) {
      return '0';
    }

    const formatted = formatNumber(Math.abs(rounded));
    return `${rounded > 0 ? '+' : '-'}${formatted}`;
  })();

  const healthTileStyles = simulationResult.hasOutcome
    ? (isPotentialHealthNegative
      ? styles.outcomeTileHealthNegative
      : (isPotentialHealthPositive ? styles.outcomeTileHealthPositive : styles.outcomeTileHealthNeutral))
    : styles.outcomeTileHealthNeutral;

  const isJackpot = useMemo(() => {
    return currentNetworkConfig.beasts && JACKPOT_BEASTS.includes(beast?.name!);
  }, [beast]);

  return (
    <Box sx={[styles.container, spectating && styles.spectating]}>
      {beast?.baseName && <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/battle_scenes/${isJackpot ? `jackpot_${beast!.baseName.toLowerCase()}` : beast!.baseName.toLowerCase()}.png')` }]} />}

      {/* Adventurer */}
      <Adventurer combatStats={combatStats} />

      {/* Beast */}
      <Beast />

      {/* Combat Insights Panel - only shown in advanced mode */}
      {advancedMode && beast && combatOverview && (
        <Box sx={styles.insightsPanel}>
          <Typography sx={styles.insightsTitle}>Combat Insights</Typography>

          <Box sx={styles.insightsSection}>
            <Typography sx={styles.sectionTitle}>Fight Probabilities</Typography>
            {simulationResult.hasOutcome ? (
              <>
                <Box sx={styles.tilesRowThree}>
                  <Box
                    sx={[styles.infoTile, styles.tipTile,
                    simulationResult.winRate >= 100
                      ? styles.tipTileFight
                      : simulationResult.winRate < 10
                        ? styles.tipTileFlee
                        : styles.tipTileGamble
                    ]}
                  >
                    <Typography sx={styles.tileLabel}>Tip</Typography>
                    <Typography sx={styles.tileValue}>
                      {simulationResult.winRate >= 100 ? 'Fight' : simulationResult.winRate < 10 ? 'Flee' : 'Gamble'}
                    </Typography>
                  </Box>
                  <Box sx={[styles.infoTile, styles.fightTileWin]}>
                    <Typography sx={styles.tileLabel}>Win %</Typography>
                    <Typography sx={styles.tileValue}>{formatPercent(simulationResult.winRate)}</Typography>
                    <Typography sx={styles.tileSubValue}>
                      {`${formatNumber(Math.round(simulationResult.winRate))}/100`}
                    </Typography>
                  </Box>
                  <Box sx={[styles.infoTile, styles.fightTileLethal]}>
                    <Typography sx={styles.tileLabel}>OTK Chance</Typography>
                    <Typography sx={styles.tileValue}>{formatPercent(simulationResult.otkRate)}</Typography>
                    <Typography sx={styles.tileSubValue}>
                      {`${formatNumber(Math.round(simulationResult.otkRate))}/100`}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={styles.tilesRowThree}>
                  <Box sx={[styles.infoTile, styles.fightTileNeutral]}>
                    <Typography sx={styles.tileLabel}>Rounds</Typography>
                    <Typography sx={styles.tileValue}>{formatNumber(simulationResult.modeRounds)}</Typography>
                    <Typography sx={styles.tileSubValue}>
                      {formatRange(simulationResult.minRounds, simulationResult.maxRounds)}
                    </Typography>
                  </Box>
                  <Box sx={[styles.infoTile, styles.fightTileWin]}>
                    <Typography sx={styles.tileLabel}>DMG Dealt</Typography>
                    <Typography sx={styles.tileValue}>{formatNumber(simulationResult.modeDamageDealt)}</Typography>
                    <Typography sx={styles.tileSubValue}>
                      {formatRange(simulationResult.minDamageDealt, simulationResult.maxDamageDealt)}
                    </Typography>
                  </Box>
                  <Box sx={[styles.infoTile, styles.fightTileLethal]}>
                    <Typography sx={styles.tileLabel}>DMG Taken</Typography>
                    <Typography sx={styles.tileValue}>{formatNumber(Math.round(simulationResult.modeDamageTaken))}</Typography>
                    <Typography sx={styles.tileSubValue}>
                      {formatRange(simulationResult.minDamageTaken, simulationResult.maxDamageTaken)}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <Typography sx={styles.placeholderText}>Run a simulation to view probabilities</Typography>
            )}
          </Box>

          <Box sx={styles.sectionDivider} />

          <Box sx={styles.insightsSection}>
            <Typography sx={styles.sectionTitle}>Victory Outcome</Typography>
            <Box sx={styles.tilesRowThree}>
              <Box sx={[styles.infoTile, styles.outcomeTileXp]}>
                <Typography sx={styles.tileLabel}>XP</Typography>
                <Typography sx={styles.tileValue}>
                  +{formatNumber(combatOverview.xpReward)}
                  {willLevelUp && <span style={{ fontSize: '0.65rem', marginLeft: '8px', color: '#d0c98d' }}>LEVEL UP!</span>}
                </Typography>
              </Box>
              <Box sx={[styles.infoTile, styles.outcomeTileGold]}>
                <Typography sx={styles.tileLabel}>Gold</Typography>
                <Typography sx={styles.tileValue}>+{formatNumber(combatOverview.goldReward)}</Typography>
              </Box>
              <Tooltip
                title={
                  <Box sx={styles.tooltipContainer}>
                    <Typography sx={styles.tooltipTitle}>NET HP</Typography>
                    <Box sx={styles.tooltipDivider} />
                    <Typography sx={styles.tooltipText}>
                      Gold reward converted to potions, minus expected damage taken.
                    </Typography>
                    <Box sx={styles.tooltipExampleContainer}>
                      <Typography sx={styles.tooltipPositive}>
                        Positive = you gain HP overall
                      </Typography>
                      <Typography sx={styles.tooltipNegative}>
                        Negative = you lose HP overall
                      </Typography>
                    </Box>
                  </Box>
                }
                placement="top"
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
                <Box sx={[styles.infoTile, healthTileStyles, { cursor: 'help' }]}>
                  <Typography sx={styles.tileLabel}>Net HP</Typography>
                  <Typography sx={styles.tileValue}>
                    {simulationResult.hasOutcome
                      ? `${potentialHealthChangeText}`
                      : '-'}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      {/* Combat Log */}
      <Box sx={styles.middleSection}>
        <Box sx={styles.combatLogContainer}>
          <AnimatedText text={combatLog} />
          {(combatLog === fleeMessage || combatLog === attackMessage || combatLog === equipMessage)
            && <div className='dotLoader yellow' style={{ marginTop: '6px' }} />}
        </Box>
      </Box>

      {/* Skip Animations Toggle */}
      {showSkipCombat && (untilDeath || autoLastHitActive) && <Box sx={styles.skipContainer}>
        <Button
          variant="outlined"
          onClick={handleSkipCombat}
          sx={[
            styles.skipButton,
          ]}
          disabled={skipCombat}
        >
          <Typography fontWeight={600}>
            Skip
          </Typography>
          <Box sx={{ fontSize: '0.6rem' }}>
            ▶▶
          </Box>
        </Button>
      </Box>}

      <InventoryOverlay disabledEquip={attackInProgress || fleeInProgress || equipInProgress} />
      <TipsOverlay combatStats={combatStats} />
      <SettingsOverlay />

      {/* Combat Buttons */}
      {!spectating && <Box sx={styles.buttonContainer}>
        {hasNewItemsEquipped ? (
          <>
            <Box sx={styles.actionButtonContainer}>
              <Button
                variant="contained"
                onClick={handleEquipItems}
                sx={styles.attackButton}
                disabled={equipInProgress}
              >
                <Box sx={{ opacity: equipInProgress ? 0.5 : 1 }}>
                  <Typography sx={styles.buttonText}>
                    EQUIP
                  </Typography>
                </Box>
              </Button>
            </Box>

            <Box sx={styles.actionButtonContainer}>
              <Button
                variant="contained"
                onClick={undoEquipment}
                sx={styles.fleeButton}
                disabled={equipInProgress}
              >
                <Box sx={{ opacity: equipInProgress ? 0.5 : 1 }}>
                  <Typography sx={styles.buttonText}>
                    UNDO
                  </Typography>
                </Box>
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={styles.actionButtonContainer}>
              <Button
                variant="contained"
                onClick={handleAttack}
                sx={styles.attackButton}
                disabled={!adventurer || !beast || attackInProgress || fleeInProgress || equipInProgress}
              >
                <Box sx={{ opacity: !adventurer || !beast || attackInProgress || fleeInProgress || equipInProgress ? 0.5 : 1 }}>
                  <Typography sx={styles.buttonText}>
                    ATTACK
                  </Typography>

                  <Typography sx={styles.buttonHelperText}>
                    {`${calculateAttackDamage(adventurer!.equipment.weapon!, adventurer!, beast!).baseDamage} damage`}
                  </Typography>
                </Box>
              </Button>
            </Box>

            <Box sx={styles.actionButtonContainer}>
              <Button
                variant="contained"
                onClick={handleFlee}
                sx={styles.fleeButton}
                disabled={adventurer!.stats.dexterity === 0 || fleeInProgress || attackInProgress}
              >
                <Box sx={{ opacity: adventurer!.stats.dexterity === 0 || fleeInProgress || attackInProgress ? 0.5 : 1 }}>
                  <Typography sx={styles.buttonText}>
                    FLEE
                  </Typography>
                  <Typography sx={styles.buttonHelperText}>
                    {adventurer!.stats.dexterity === 0 ? 'No Dexterity' : `${fleePercentage}% chance`}
                  </Typography>
                </Box>
              </Button>
            </Box>

            <Box sx={styles.deathCheckboxRow}>
              <Box
                sx={styles.deathCheckboxContainer}
                onClick={() => {
                  if (!combatControlsDisabled) {
                    toggleUntilDeath(!untilDeath);
                  }
                }}
              >
                <Typography sx={styles.deathCheckboxLabel}>
                  until<br />death
                </Typography>
                <Checkbox
                  checked={untilDeath}
                  disabled={combatControlsDisabled}
                  onChange={(e) => toggleUntilDeath(e.target.checked)}
                  size="medium"
                  sx={styles.deathCheckbox}
                />
              </Box>

              {advancedMode && (
                <Box
                  sx={styles.deathCheckboxContainer}
                  onClick={() => {
                    if (!combatControlsDisabled && !isFinalRound) {
                      toggleUntilLastHit(!untilLastHit);
                    }
                  }}
                >
                  <Typography sx={styles.deathCheckboxLabel}>
                    until<br />last hit
                  </Typography>
                  <Checkbox
                    checked={untilLastHit}
                    disabled={combatControlsDisabled || isFinalRound}
                    onChange={(e) => toggleUntilLastHit(e.target.checked)}
                    size="medium"
                    sx={styles.deathCheckbox}
                  />
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>}
    </Box>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  spectating: {
    border: '1px solid rgba(128, 255, 0, 0.6)',
    boxSizing: 'border-box',
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
  middleSection: {
    position: 'absolute',
    top: 30,
    left: '50%',
    width: '340px',
    padding: '4px 8px',
    border: '2px solid #083e22',
    borderRadius: '12px',
    background: 'rgba(24, 40, 24, 0.55)',
    backdropFilter: 'blur(8px)',
    transform: 'translateX(-50%)',
  },
  combatLogContainer: {
    width: '100%',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
  },
  actionButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  attackButton: {
    border: '3px solid rgb(8, 62, 34)',
    background: 'rgba(24, 40, 24, 1)',
    width: '190px',
    height: '48px',
    justifyContent: 'center',
    borderRadius: '8px',
    '&:hover': {
      background: 'rgba(34, 60, 34, 1)',
    },
    '&:disabled': {
      background: 'rgba(24, 40, 24, 1)',
      borderColor: 'rgba(8, 62, 34, 0.5)',
    },
  },
  fleeButton: {
    width: '190px',
    height: '48px',
    justifyContent: 'center',
    background: 'rgba(60, 16, 16, 1)',
    borderRadius: '8px',
    border: '3px solid #6a1b1b',
    '&:hover': {
      background: 'rgba(90, 24, 24, 1)',
    },
    '&:disabled': {
      background: 'rgba(60, 16, 16, 1)',
      borderColor: 'rgba(106, 27, 27, 0.5)',
    },
  },
  buttonIcon: {
    fontSize: '2.2rem',
    color: '#FFD700',
    filter: 'drop-shadow(0 0 6px #FFD70088)',
    marginRight: '8px',
  },
  buttonText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 600,
    fontSize: '1rem',
    color: '#d0c98d',
    letterSpacing: '1px',
    lineHeight: 1.1,
  },
  buttonHelperText: {
    color: '#d0c98d',
    fontSize: '12px',
    opacity: 0.8,
    lineHeight: '12px',
    textTransform: 'none',
  },
  deathCheckboxRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '16px',
  },
  deathCheckboxContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '32px',
    cursor: 'pointer',
  },
  deathCheckboxLabel: {
    color: 'rgba(208, 201, 141, 0.7)',
    fontSize: '0.75rem',
    fontFamily: 'Cinzel, Georgia, serif',
    lineHeight: '0.9',
    textAlign: 'center',
  },
  deathCheckbox: {
    color: 'rgba(208, 201, 141, 0.7)',
    padding: '0',
    '&.Mui-checked': {
      color: '#d0c98d',
    },
  },
  skipContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    top: 90,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
  },
  skipButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '90px',
    height: '32px',
  },
  insightsPanel: {
    position: 'absolute',
    top: 142,
    right: 30,
    width: 360,
    padding: '12px 14px',
    border: '2px solid #083e22',
    borderRadius: '12px',
    background: 'rgba(24, 40, 24, 0.65)',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 80,
  },
  insightsTitle: {
    color: '#d0c98d',
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: '0.92rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    textAlign: 'center',
  },
  insightsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    color: '#d0c98d',
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.35px',
  },
  sectionDivider: {
    margin: '4px 0 2px',
    borderTop: '1px solid rgba(208, 201, 141, 0.2)',
  },
  tilesRowThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '6px',
  },
  infoTile: {
    borderRadius: '10px',
    padding: '7px 9px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    border: '1px solid rgba(120, 150, 130, 0.35)',
    background: 'rgba(16, 28, 20, 0.8)',
  },
  tileLabel: {
    color: 'rgba(208, 201, 141, 0.8)',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },
  tileValue: {
    color: '#ffffff',
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: '0.96rem',
    fontWeight: 600,
    lineHeight: 1.1,
  },
  tileSubValue: {
    color: 'rgba(208, 201, 141, 0.72)',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  fightTileWin: {
    background: 'linear-gradient(135deg, rgba(46, 110, 60, 0.78), rgba(18, 58, 32, 0.92))',
    border: '1px solid rgba(96, 186, 120, 0.6)',
    boxShadow: '0 0 10px rgba(96, 186, 120, 0.25)',
  },
  fightTileLethal: {
    background: 'linear-gradient(135deg, rgba(140, 46, 42, 0.78), rgba(78, 22, 18, 0.92))',
    border: '1px solid rgba(212, 102, 96, 0.6)',
    boxShadow: '0 0 10px rgba(212, 102, 96, 0.25)',
  },
  fightTileNeutral: {
    border: '1px solid rgba(168, 168, 168, 0.35)',
  },
  placeholderText: {
    color: 'rgba(208, 201, 141, 0.65)',
    fontSize: '0.72rem',
    textAlign: 'center',
    paddingTop: '4px',
  },
  outcomeTileXp: {
    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.55), rgba(102, 24, 118, 0.45))',
    border: '1px solid rgba(182, 88, 204, 0.7)',
    boxShadow: '0 0 10px rgba(156, 39, 176, 0.35)',
  },
  levelUpTile: {
    border: '1px solid rgba(128, 255, 0, 0.8)',
    boxShadow: '0 0 12px rgba(128, 255, 0, 0.5)',
  },
  levelUpIndicator: {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  outcomeTileGold: {
    background: 'linear-gradient(135deg, rgba(156, 118, 36, 0.65), rgba(86, 52, 12, 0.8))',
    border: '1px solid rgba(208, 180, 120, 0.7)',
    boxShadow: '0 0 10px rgba(208, 180, 120, 0.35)',
  },
  outcomeTileHealthPositive: {
    background: 'linear-gradient(135deg, rgba(46, 110, 60, 0.78), rgba(18, 58, 32, 0.92))',
    border: '1px solid rgba(96, 186, 120, 0.6)',
    boxShadow: '0 0 10px rgba(96, 186, 120, 0.25)',
  },
  outcomeTileHealthNegative: {
    background: 'linear-gradient(135deg, rgba(140, 46, 42, 0.78), rgba(78, 22, 18, 0.92))',
    border: '1px solid rgba(212, 102, 96, 0.6)',
    boxShadow: '0 0 10px rgba(212, 102, 96, 0.25)',
  },
  outcomeTileHealthNeutral: {
    border: '1px solid rgba(168, 168, 168, 0.35)',
  },
  tipTile: {
    position: 'relative',
    overflow: 'hidden',
  },
  tipTileFight: {
    border: '1px solid rgba(96, 186, 120, 0.7)',
    background: 'linear-gradient(135deg, rgba(46, 110, 60, 0.78), rgba(18, 58, 32, 0.92))',
    boxShadow: '0 0 12px rgba(96, 186, 120, 0.6)',
    animation: `${tipPulseFight} 1.6s ease-in-out infinite`,
  },
  tipTileFlee: {
    border: '1px solid rgba(212, 102, 96, 0.7)',
    background: 'linear-gradient(135deg, rgba(140, 46, 42, 0.78), rgba(78, 22, 18, 0.92))',
    boxShadow: '0 0 12px rgba(212, 102, 96, 0.6)',
    animation: `${tipPulseFlee} 1.6s ease-in-out infinite`,
  },
  tipTileGamble: {
    border: '1px solid rgba(208, 180, 120, 0.7)',
    background: 'linear-gradient(135deg, rgba(156, 118, 36, 0.65), rgba(86, 52, 12, 0.8))',
    boxShadow: '0 0 12px rgba(208, 180, 120, 0.55)',
    animation: `${tipPulseGamble} 1.6s ease-in-out infinite`,
  },
  tooltipContainer: {
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    padding: '10px',
    minWidth: '200px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  tooltipTitle: {
    color: '#d0c98d',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  tooltipDivider: {
    height: '1px',
    backgroundColor: '#d7c529',
    opacity: 0.2,
    margin: '8px 0',
  },
  tooltipText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '0.78rem',
    lineHeight: 1.4,
    marginBottom: '8px',
  },
  tooltipExampleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tooltipPositive: {
    color: '#60ba78',
    fontSize: '0.75rem',
  },
  tooltipNegative: {
    color: '#d46660',
    fontSize: '0.75rem',
  },
};