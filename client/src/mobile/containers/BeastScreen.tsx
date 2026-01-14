import { BEAST_MIN_DAMAGE, JACKPOT_BEASTS } from '@/constants/beast';
import { STARTING_HEALTH } from '@/constants/game';
import { useDynamicConnector } from '@/contexts/starknet';
import { useGameDirector } from '@/mobile/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { Item } from '@/types/game';
import { screenVariants } from '@/utils/animations';
import { getBeastImageById, getCollectableTraits, collectableImage } from '@/utils/beast';
import { defaultSimulationResult, simulateCombatOutcomes } from '@/utils/combatSimulation';
import { ability_based_percentage, calculateAttackDamage, calculateBeastDamage, calculateCombatStats, calculateGoldReward, calculateLevel, getNewItemsEquipped } from '@/utils/game';
import { ItemUtils, slotIcons } from '@/utils/loot';
import { suggestBestCombatGear } from '@/utils/gearSuggestion';
import { Box, Button, Checkbox, LinearProgress, Typography, keyframes } from '@mui/material';
import { motion } from 'framer-motion';
import { useLottie } from 'lottie-react';
import { useEffect, useMemo, useState } from 'react';
import strikeAnim from "../assets/animations/strike.json";
import AnimatedText from '../components/AnimatedText';
import BeastTooltip from '../components/BeastTooltip';
import { useDungeon } from '@/dojo/useDungeon';
import { useGameTokens } from '@/dojo/useGameTokens';

const attackMessage = "Attacking";
const fleeMessage = "Attempting to flee";
const equipMessage = "Equipping items";

interface BeastScreenProps {
  setIsBattling: (value: boolean) => void;
}

export default function BeastScreen({ setIsBattling }: BeastScreenProps) {
  const dungeon = useDungeon();
  const { getBeastOwner } = useGameTokens();
  const { currentNetworkConfig } = useDynamicConnector();
  const { advancedMode, fastBattle } = useUIStore();
  const { executeGameAction, actionFailed, setSkipCombat, skipCombat, showSkipCombat } = useGameDirector();
  const { gameId, adventurer, adventurerState, beast, battleEvent, bag,
    equipItem, undoEquipment, setShowBeastRewards, applyGearSuggestion } = useGameStore();
  const [untilDeath, setUntilDeath] = useState(false);
  const [untilLastHit, setUntilLastHit] = useState(false);
  const [autoLastHitActive, setAutoLastHitActive] = useState(false);
  const [lastHitActionCount, setLastHitActionCount] = useState<number | null>(null);
  const [attackInProgress, setAttackInProgress] = useState(false);
  const [fleeInProgress, setFleeInProgress] = useState(false);
  const [equipInProgress, setEquipInProgress] = useState(false);
  const [suggestInProgress, setSuggestInProgress] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [combatLog, setCombatLog] = useState("");
  const [health, setHealth] = useState(adventurer!.health);
  const [beastHealth, setBeastHealth] = useState(adventurer!.beast_health);
  const [simulationResult, setSimulationResult] = useState(defaultSimulationResult);
  const [simulationActionCount, setSimulationActionCount] = useState<number | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  const hasNewItemsEquipped = useMemo(() => {
    if (!adventurer?.equipment || !adventurerState?.equipment) return false;
    return getNewItemsEquipped(adventurer.equipment, adventurerState.equipment).length > 0;
  }, [adventurer?.equipment, adventurerState?.equipment]);

  const fleePercentage = ability_based_percentage(adventurer!.xp, adventurer!.stats.dexterity);
  const beastPower = Number(beast!.level) * (6 - Number(beast!.tier));
  const maxHealth = STARTING_HEALTH + (adventurer!.stats.vitality * 15);
  const collectable = beast ? beast!.isCollectable : false;
  const collectableTraits = collectable ? getCollectableTraits(beast!.seed) : null;
  const isJackpot = currentNetworkConfig.beasts && JACKPOT_BEASTS.includes(beast?.name!);
  const combatStats = beast ? calculateCombatStats(adventurer!, bag, beast) : null;
  const combatControlsDisabled = attackInProgress || fleeInProgress || equipInProgress || suggestInProgress;
  const isFinalRound = advancedMode && simulationResult.hasOutcome && simulationResult.maxRounds <= 1;

  const bestItemIds = combatStats?.bestItems.map((item: Item) => item.id) || [];
  const formatNumber = (value: number) => value.toLocaleString();
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Notify parent when battle actions are in progress
  useEffect(() => {
    setIsBattling(attackInProgress || fleeInProgress || equipInProgress);
  }, [attackInProgress, fleeInProgress, equipInProgress]);

  // Reset battle state when component unmounts
  useEffect(() => {
    return () => {
      setIsBattling(false);
    };
  }, []);

  useEffect(() => {
    setOwnerName(null);
    if (beast && beast.specialPrefix && dungeon.id === "survivor" && !collectable) {
      getBeastOwner(beast).then((name: string | null) => setOwnerName(name));
    }
  }, [beast, dungeon.id, collectable]);

  const strike = useLottie({
    animationData: strikeAnim,
    loop: false,
    autoplay: false,
    style: { position: 'absolute', width: '60%', height: '60%', top: '20%', right: '20%' },
    onComplete: () => {
      setBeastHealth(prev => Math.max(0, prev - battleEvent?.attack?.damage!));
      strike.stop();
    }
  });

  const beastStrike = useLottie({
    animationData: strikeAnim,
    loop: false,
    autoplay: false,
    style: { position: 'absolute', width: '60%', height: '60%', top: '30%', right: '20%' },
    onComplete: () => {
      setHealth(prev => Math.max(0, prev - battleEvent?.attack?.damage!));
      beastStrike.stop();
    }
  });

  useEffect(() => {
    if (adventurer?.xp === 0) {
      setCombatLog(beast!.baseName + " ambushed you for 10 damage!");
    }
  }, []);

  useEffect(() => {
    if (battleEvent && !skipCombat) {
      if (battleEvent.type === "attack") {
        strike.play();
        if (!fastBattle) {
          setCombatLog(`You attacked ${beast!.baseName} for ${battleEvent.attack?.damage} damage ${battleEvent.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`);
        }
      }

      else if (battleEvent.type === "beast_attack") {
        beastStrike.play();
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

  // Until last hit auto-attack effect (advancedMode only)
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

    if (!simulationResult.hasOutcome) {
      return;
    }

    if (isFinalRound) {
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
      setAttackInProgress(false);
      return;
    }

    if (lastHitActionCount !== null && adventurer.action_count <= lastHitActionCount) {
      return;
    }

    if (simulationActionCount === null || simulationActionCount !== adventurer.action_count) {
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
    simulationResult.maxRounds,
    isFinalRound,
    executeGameAction,
    adventurer?.action_count,
    beast?.id,
  ]);

  // Reset untilLastHit state when toggled off
  useEffect(() => {
    if (!untilLastHit && autoLastHitActive) {
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
      setAttackInProgress(false);
    }
  }, [untilLastHit, autoLastHitActive]);

  // Reset untilLastHit when final round is reached
  useEffect(() => {
    if (isFinalRound && untilLastHit) {
      setUntilLastHit(false);
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
    }
  }, [isFinalRound, untilLastHit]);

  // Combat simulation effect (advancedMode only)
  useEffect(() => {
    if (!advancedMode) {
      setSimulationResult(defaultSimulationResult);
      setSimulationActionCount(null);
      return;
    }

    let cancelled = false;

    if (!adventurer || !beast) {
      setSimulationResult(defaultSimulationResult);
      setSimulationActionCount(null);
      return () => {
        cancelled = true;
      };
    }

    const runSimulation = async () => {
      const result = await simulateCombatOutcomes(adventurer, beast, {
        initialBeastStrike: hasNewItemsEquipped,
      });

      if (!cancelled) {
        setSimulationResult(result);
        setSimulationActionCount(adventurer.action_count);
      }
    };

    void runSimulation();

    return () => {
      cancelled = true;
    };
  }, [
    advancedMode,
    adventurer?.health,
    adventurer?.xp,
    adventurer?.item_specials_seed,
    adventurer?.stats.strength,
    adventurer?.stats.luck,
    adventurer?.equipment.weapon.id,
    adventurer?.equipment.weapon.xp,
    adventurer?.equipment.chest.id,
    adventurer?.equipment.chest.xp,
    adventurer?.equipment.head.id,
    adventurer?.equipment.head.xp,
    adventurer?.equipment.waist.id,
    adventurer?.equipment.waist.xp,
    adventurer?.equipment.hand.id,
    adventurer?.equipment.hand.xp,
    adventurer?.equipment.foot.id,
    adventurer?.equipment.foot.xp,
    adventurer?.equipment.neck.id,
    adventurer?.equipment.neck.xp,
    adventurer?.equipment.ring.id,
    adventurer?.equipment.ring.xp,
    adventurer?.beast_health,
    beast?.health,
    beast?.level,
    beast?.tier,
    beast?.specialPrefix,
    beast?.specialSuffix,
    hasNewItemsEquipped,
  ]);

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

    setShowBeastRewards(true);
    setAttackInProgress(true);
    setCombatLog(attackMessage);

    // Advanced mode: handle untilLastHit
    if (advancedMode && untilLastHit && !isFinalRound) {
      setAutoLastHitActive(true);
      setLastHitActionCount(adventurer.action_count);
    } else {
      setAutoLastHitActive(false);
      setLastHitActionCount(null);
    }

    const fightToDeath = untilDeath && !untilLastHit;
    executeGameAction({ type: 'attack', untilDeath: fightToDeath });
  };

  const handleFlee = () => {
    localStorage.removeItem('collectable_beast');
    setAutoLastHitActive(false);
    setLastHitActionCount(null);
    setShowBeastRewards(false);
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

  const handleSuggestGear = async () => {
    if (!adventurer || !bag || !beast) {
      return;
    }

    setSuggestInProgress(true);

    try {
      const suggestion = await suggestBestCombatGear(adventurer, bag, beast);

      if (!suggestion) {
        setCombatLog('Best gear already equipped.');
        return;
      }

      applyGearSuggestion({ adventurer: suggestion.adventurer, bag: suggestion.bag });
      setCombatLog('Suggested combat gear equipped.');
    } catch (error) {
      console.error('Failed to suggest combat gear', error);
      setCombatLog('Unable to suggest gear right now.');
    } finally {
      setSuggestInProgress(false);
    }
  };

  const handleEquipItems = () => {
    setShowBeastRewards(false);
    setEquipInProgress(true);
    setCombatLog(equipMessage);
    executeGameAction({ type: 'equip' });
  };

  const handleSkipCombat = () => {
    setSkipCombat(true);
  };

  const getOffsetY = (isWeapon: boolean, isNameMatch: boolean, level: number, specialSeed: number) => {
    let offset = 230;

    if (isWeapon) {
      offset += 17;
    }

    if (isNameMatch) {
      offset += 30;
    }

    if (level >= 15 || (specialSeed !== 0)) {
      offset += 30;
    }

    return offset;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={screenVariants}
      style={styles.container}
    >
      <Box sx={styles.battleContainer}>
        {/* Top Section - Beast */}
        <Box sx={styles.topSection}>
          <Box sx={styles.beastInfo}>
            <Box sx={styles.beastHeader}>
              <Typography
                variant={beast!.name.length > 28 ? "h5" : "h4"}
                sx={[
                  styles.beastName,
                  collectable && {
                    animation: `${pulseTextGlow} 2s infinite`,
                  }
                ]}
              >
                {beast!.name}
              </Typography>
              <Box sx={styles.beastType}>
                <Box sx={styles.statBox}>
                  <BeastTooltip beastType={beast!.type} beastId={beast!.id} />
                </Box>
                <Box sx={styles.statBox}>
                  <Typography sx={styles.statLabel}>Power</Typography>
                  <Typography sx={styles.statValue}>{beastPower}</Typography>
                </Box>
                <Box sx={styles.levelBox}>
                  <Typography sx={styles.levelLabel}>Level</Typography>
                  <Typography sx={styles.levelValue}>{beast!.level}</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={styles.healthContainer} mt={2} mb={1}>
              <Box sx={styles.healthRow}>
                <Typography sx={styles.healthLabel}>Health</Typography>
                <Typography sx={styles.healthValue}>
                  {beastHealth}/{beast!.health}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(beastHealth / beast!.health) * 100}
                sx={styles.healthBar}
              />

              <Box sx={styles.traitIndicators} mt={1}>
                <Box sx={styles.traitBox}>
                  <Typography variant="body2" sx={styles.statValue}>
                    {calculateLevel(adventurer!.xp)}% Crit Chance
                  </Typography>
                </Box>
                <Box sx={styles.traitBox}>
                  <Box sx={styles.goldValueContainer}>
                    <Typography variant="body2" sx={styles.levelValue}>
                      {calculateGoldReward(beast!, adventurer!.equipment.ring)}
                    </Typography>
                    <img
                      src="/images/mobile/gold.png"
                      alt="Gold"
                      style={{ width: '11px', height: '11px', marginLeft: '2px', paddingBottom: '1px' }}
                    />
                  </Box>
                </Box>
              </Box>

            </Box>
          </Box>
          <Box sx={styles.beastImageContainer}>
            {collectable && isJackpot && (
              <Box sx={styles.toastContainer}>
                <Typography sx={styles.wantedBeastText}>
                  WANTED BEAST
                </Typography>
              </Box>
            )}

            <img
              src={collectable ? collectableImage(beast!.baseName, collectableTraits!) : getBeastImageById(beast!.id)}
              alt={beast!.name}
              style={{
                ...(collectable ? styles.collectableBeastImage : styles.beastImage),
              }}
            />
            {strike.View}

            {collectable && (
              <Box sx={styles.collectableContainer}>
                <Typography sx={styles.collectableText}>
                  {currentNetworkConfig.beasts ? "Collectable Beast" : ""}
                </Typography>
              </Box>
            )}

            {ownerName && (
              <Box sx={styles.collectableContainer}>
                <Typography sx={styles.ownerNameText}>
                  Owned by {ownerName}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Middle Section - Combat Log */}
        <Box sx={styles.middleSection}>
          <Box sx={styles.combatLogContainer}>
            <AnimatedText text={combatLog} />
            {(combatLog === fleeMessage || combatLog === attackMessage || combatLog === equipMessage) && <div className='dotLoader green' style={{ marginTop: '6px' }} />}
          </Box>
        </Box>

        {/* Bottom Section - Adventurer */}
        <Box sx={styles.bottomSection}>
          <Box sx={styles.adventurerStatusRow}>
            <Box sx={styles.adventurerImageContainerSmall}>
              <img
                src={'/images/mobile/adventurer.png'}
                alt="Adventurer"
                style={styles.adventurerImageSmall}
              />
              {beastStrike.View}
            </Box>

            <Box sx={styles.adventurerVitals}>
              <Box sx={styles.healthContainer}>
                <Box sx={styles.healthRow}>
                  <Typography sx={styles.healthLabel}>Health</Typography>
                  <Typography sx={styles.healthValue}>
                    {health}/{maxHealth}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(health / maxHealth) * 100}
                  sx={styles.healthBar}
                />
                <Box sx={styles.statsRow}>
                  <Box sx={styles.traitBox}>
                    <Typography variant="body2" sx={styles.statValue}>
                      {adventurer!.stats.luck}% Crit Chance
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {hasNewItemsEquipped && (
            <Box sx={styles.actionsContainer}>
              <Box sx={styles.actionButtonContainer}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleEquipItems}
                  sx={[styles.attackButton, { mb: '12px' }]}
                  disabled={equipInProgress}
                >
                  EQUIP
                </Button>
              </Box>

              <Box sx={styles.actionButtonContainer}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={undoEquipment}
                  sx={[styles.fleeButton, { mb: '12px' }]}
                  disabled={equipInProgress}
                >
                  UNDO
                </Button>
              </Box>
            </Box>
          )}

          {!hasNewItemsEquipped && (
            <Box sx={styles.actionsContainer}>
              <Box sx={styles.actionButtonContainer}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAttack}
                  sx={styles.attackButton}
                  disabled={combatControlsDisabled}
                >
                  ATTACK
                </Button>
                <Typography sx={styles.probabilityText}>
                  {`${calculateAttackDamage(adventurer!.equipment.weapon!, adventurer!, beast!).baseDamage} damage`}
                </Typography>
              </Box>

              {advancedMode && !showSkipCombat && (
                <Box sx={styles.actionButtonContainer}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSuggestGear}
                    sx={styles.suggestButton}
                    disabled={combatControlsDisabled}
                  >
                    SUGGEST
                  </Button>
                  <Typography sx={styles.probabilityText}>
                    best gear
                  </Typography>
                </Box>
              )}

              <Box sx={styles.actionButtonContainer}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleFlee}
                  sx={styles.fleeButton}
                  disabled={adventurer!.stats.dexterity === 0 || combatControlsDisabled}
                >
                  FLEE
                </Button>
                <Typography sx={styles.probabilityText}>
                  {adventurer!.stats.dexterity === 0 ? 'No Dex' : `${fleePercentage}% chance`}
                </Typography>
              </Box>

              {showSkipCombat && (untilDeath || autoLastHitActive) && (
                <Box sx={styles.actionButtonContainer}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSkipCombat}
                    sx={styles.fleeButton}
                    disabled={skipCombat}
                  >
                    SKIP
                  </Button>
                </Box>
              )}

              <Box sx={styles.deathCheckboxRow}>
                <Box
                  sx={styles.deathCheckboxContainer}
                  onClick={() => {
                    if (!combatControlsDisabled) {
                      toggleUntilDeath(!untilDeath);
                    }
                  }}
                >
                  <Checkbox
                    checked={untilDeath}
                    disabled={combatControlsDisabled}
                    onChange={(e) => toggleUntilDeath(e.target.checked)}
                    size="small"
                    sx={styles.deathCheckbox}
                  />
                  <Typography sx={styles.deathCheckboxLabel}>
                    until<br />death
                  </Typography>
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
                    <Checkbox
                      checked={untilLastHit}
                      disabled={combatControlsDisabled || isFinalRound}
                      onChange={(e) => toggleUntilLastHit(e.target.checked)}
                      size="small"
                      sx={styles.deathCheckbox}
                    />
                    <Typography sx={styles.deathCheckboxLabel}>
                      until<br />last hit
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Equipped Items Section */}
        <Box sx={styles.equippedItemsContainer}>
          <Box sx={styles.equippedItemsGrid}>
            {Object.entries(slotIcons).map(([slot, icon], index) => {
              const equippedItem = adventurer?.equipment[slot.toLowerCase() as keyof typeof adventurer.equipment];
              const level = calculateLevel(equippedItem!.xp);
              const isNameMatch = ItemUtils.isNameMatch(equippedItem!.id, level, adventurer!.item_specials_seed, beast!);
              const isArmorSlot = ['Head', 'Chest', 'Foot', 'Hand', 'Waist'].includes(slot);
              const isWeaponSlot = slot === 'Weapon';
              const isNameMatchDanger = isNameMatch && isArmorSlot;
              const isNameMatchPower = isNameMatch && isWeaponSlot;

              let damageTaken = 0;
              let damage = 0;
              let critDamageTaken = 0;
              let critDamage = 0;

              if (beast) {
                if (isArmorSlot && beast.health > 4) {
                  // For armor slots, show damage taken (always negative)
                  if (equippedItem && equippedItem.id !== 0) {
                    const damageSummary = calculateBeastDamage(beast, adventurer!, equippedItem);
                    damageTaken = damageSummary.baseDamage;
                    critDamageTaken = damageSummary.criticalDamage;
                  } else {
                    // For empty armor slots, show beast power * 1.5
                    const elementalDamage = Math.floor(beastPower * 1.5);
                    damageTaken = Math.max(BEAST_MIN_DAMAGE, elementalDamage);
                    critDamageTaken = Math.max(BEAST_MIN_DAMAGE, damageTaken + elementalDamage);
                  }
                } else if (isWeaponSlot) {
                  // For weapon slots, show damage dealt (always positive)
                  if (equippedItem && equippedItem.id !== 0) {
                    const attackSummary = calculateAttackDamage(equippedItem, adventurer!, beast);
                    damage = attackSummary.baseDamage;
                    critDamage = attackSummary.criticalDamage;
                  }
                }
              }

              const offsetY = getOffsetY(isWeaponSlot, (isNameMatchDanger || isNameMatchPower), level, adventurer!.item_specials_seed);

              return (
                <>
                  <Box
                    onClick={(e) => {
                      if (selectedSlot === slot) {
                        // Deselect if clicking the same slot
                        setSelectedSlot(null);
                        setSelectedItem(null);
                      } else {
                        // Select new slot
                        setSelectedSlot(slot);
                        setSelectedItem(equippedItem && equippedItem.id !== 0 ? equippedItem : null);
                      }
                      setMenuAnchor(e.currentTarget);
                    }}
                    sx={{
                      ...styles.equippedItemSlot,
                      ...(isNameMatchDanger && styles.nameMatchDangerSlot),
                      ...(isNameMatchPower && styles.nameMatchPowerSlot)
                    }}
                  >
                    {equippedItem && equippedItem.id !== 0 ? (
                      <Box sx={styles.equippedItemImageContainer}>
                        <Box
                          sx={[
                            styles.itemGlow,
                            { backgroundColor: ItemUtils.getTierColor(ItemUtils.getItemTier(equippedItem.id)) }
                          ]}
                        />
                        <Box
                          component="img"
                          src={ItemUtils.getItemImage(equippedItem.id)}
                          alt={ItemUtils.getItemName(equippedItem.id)}
                          sx={styles.equippedItemImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {/* Damage Indicator Overlay */}
                        {(damage > 0 || damageTaken > 0 || critDamage > 0 || critDamageTaken > 0) && (
                          advancedMode ? (
                            <>
                              {(isArmorSlot ? damageTaken > 0 : damage > 0) && (
                                <Box sx={[
                                  styles.damageIndicator,
                                  styles.damageIndicatorTop,
                                  isArmorSlot ? styles.damageIndicatorRed : styles.damageIndicatorGreen
                                ]}>
                                  <Typography sx={[
                                    styles.damageIndicatorText,
                                    isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                                  ]}>
                                    {isArmorSlot ? `-${damageTaken}` : `+${damage}`}
                                  </Typography>
                                </Box>
                              )}
                              {(isArmorSlot ? critDamageTaken > 0 : critDamage > 0) && (
                                <Box sx={[
                                  styles.damageIndicator,
                                  styles.damageIndicatorBottom,
                                  isArmorSlot ? styles.damageIndicatorCritRed : styles.damageIndicatorCritGreen
                                ]}>
                                  <Typography sx={[
                                    styles.damageIndicatorText,
                                    isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                                  ]}>
                                    {isArmorSlot ? `-${critDamageTaken}` : `+${critDamage}`}
                                  </Typography>
                                </Box>
                              )}
                            </>
                          ) : (
                            <Box sx={[
                              styles.damageIndicator,
                              isArmorSlot ? styles.damageIndicatorRed : styles.damageIndicatorGreen
                            ]}>
                              <Typography sx={[
                                styles.damageIndicatorText,
                                isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                              ]}>
                                {isArmorSlot ? `-${damageTaken}` : `+${damage}`}
                              </Typography>
                            </Box>
                          )
                        )}
                      </Box>
                    ) : (
                      <Box sx={styles.equippedItemSlotIcon}>
                        <Box
                          component="img"
                          src={icon}
                          alt={slot}
                          sx={{
                            width: 24,
                            height: 24,
                            filter: 'invert(1) sepia(1) saturate(3000%) hue-rotate(50deg) brightness(1.1)',
                            opacity: 0.3,
                          }}
                        />
                        {/* Damage Indicator Overlay for Empty Slots */}
                        {(damage > 0 || damageTaken > 0 || critDamage > 0 || critDamageTaken > 0) && (
                          advancedMode ? (
                            <>
                              {(isArmorSlot ? damageTaken > 0 : damage > 0) && (
                                <Box sx={[
                                  styles.damageIndicator,
                                  styles.damageIndicatorTop,
                                  isArmorSlot ? styles.damageIndicatorRed : styles.damageIndicatorGreen
                                ]}>
                                  <Typography sx={[
                                    styles.damageIndicatorText,
                                    isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                                  ]}>
                                    {isArmorSlot ? `-${damageTaken}` : `+${damage}`}
                                  </Typography>
                                </Box>
                              )}
                              {(isArmorSlot ? critDamageTaken > 0 : critDamage > 0) && (
                                <Box sx={[
                                  styles.damageIndicator,
                                  styles.damageIndicatorBottom,
                                  isArmorSlot ? styles.damageIndicatorCritRed : styles.damageIndicatorCritGreen
                                ]}>
                                  <Typography sx={[
                                    styles.damageIndicatorText,
                                    isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                                  ]}>
                                    {isArmorSlot ? `-${critDamageTaken}` : `+${critDamage}`}
                                  </Typography>
                                </Box>
                              )}
                            </>
                          ) : (
                            <Box sx={[
                              styles.damageIndicator,
                              isArmorSlot ? styles.damageIndicatorRed : styles.damageIndicatorGreen
                            ]}>
                              <Typography sx={[
                                styles.damageIndicatorText,
                                isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                              ]}>
                                {isArmorSlot ? `-${damageTaken}` : `+${damage}`}
                              </Typography>
                            </Box>
                          )
                        )}
                      </Box>
                    )}
                  </Box>
                </>
              );
            })}
          </Box>
        </Box>

        {/* Item Details Section */}
        {selectedSlot && (
          <Box sx={styles.itemDetailsContainer}>
            <Box sx={styles.itemDetailsContent}>
              {/* Left side - Item Information */}
              <Box sx={styles.itemInfoSection}>
                {selectedItem ? (
                  <Box>
                    {/* Full Item Name */}
                    <Typography sx={styles.itemName}>
                      {(() => {
                        const level = calculateLevel(selectedItem.xp);
                        const specials = ItemUtils.getSpecials(selectedItem.id, level, adventurer!.item_specials_seed);
                        const baseName = ItemUtils.getItemName(selectedItem.id);
                        const prefix = specials.prefix || '';
                        const suffix = specials.suffix || '';
                        return prefix ? `"${prefix} ${suffix}" ${baseName}` : baseName;
                      })()}
                    </Typography>

                    <Box sx={styles.itemStats}>
                      {ItemUtils.isWeapon(selectedItem.id) && (
                        <>
                          <Box sx={styles.compactInfoLine}>
                            <Typography sx={styles.infoValue}>
                              Deals {calculateAttackDamage(selectedItem, adventurer!, beast).baseDamage} damage (base)
                            </Typography>
                          </Box>
                          <Box sx={styles.compactInfoLine}>
                            <Typography sx={styles.infoValue}>
                              Deals {calculateAttackDamage(selectedItem, adventurer!, beast).criticalDamage} damage (critical)
                            </Typography>
                          </Box>
                        </>
                      )}

                      {!ItemUtils.isWeapon(selectedItem.id) && !ItemUtils.isRing(selectedItem.id) && !ItemUtils.isNecklace(selectedItem.id) && (
                        <>
                          <Box sx={styles.compactInfoLine}>
                            <Typography sx={styles.infoValue}>
                              -{calculateBeastDamage(beast!, adventurer!, selectedItem).baseDamage} Health (Base)
                            </Typography>
                          </Box>
                          <Box sx={styles.compactInfoLine}>
                            <Typography sx={styles.infoValue}>
                              -{calculateBeastDamage(beast!, adventurer!, selectedItem).criticalDamage} Health (Critical)
                            </Typography>
                          </Box>
                        </>
                      )}

                      {/* Show boost only if unlocked */}
                      {(() => {
                        const level = calculateLevel(selectedItem.xp);
                        const specials = ItemUtils.getSpecials(selectedItem.id, level, adventurer!.item_specials_seed);
                        const actualStatBonus = specials.special1 ? ItemUtils.getStatBonus(specials.special1) : null;

                        return actualStatBonus && (
                          <Box sx={styles.compactInfoLine}>
                            <Typography sx={styles.levelLabel}>Stats:</Typography>
                            <Typography sx={styles.levelValue}>
                              {actualStatBonus}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography sx={styles.emptySlotText}>
                      No item equipped
                    </Typography>

                    {/* Show damage for empty armor slots */}
                    {selectedSlot && ['Head', 'Chest', 'Foot', 'Hand', 'Waist'].includes(selectedSlot) && beast && beast.health > 4 && (
                      <Box sx={styles.itemStats}>
                        <Box sx={styles.compactInfoLine}>
                          <Typography sx={styles.infoValue}>
                            -{Math.max(BEAST_MIN_DAMAGE, Math.floor(beastPower * 1.5))} Health (Base)
                          </Typography>
                        </Box>
                        <Box sx={styles.compactInfoLine}>
                          <Typography sx={styles.infoValue}>
                            -{Math.max(BEAST_MIN_DAMAGE, Math.floor(beastPower * 1.5) * 2)} Health (Critical)
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Right side - Swappable Items Grid */}
              <Box sx={styles.availableItemsSection}>
                <Typography sx={styles.availableItemsTitle}>
                  Swap item:
                </Typography>
                <Box sx={styles.swapItemsGrid}>
                  {bag
                    .filter(item => ItemUtils.getItemSlot(item.id).toLowerCase() === selectedSlot?.toLowerCase())
                    .map((item, index) => {
                      const level = calculateLevel(item.xp);
                      const isNameMatch = ItemUtils.isNameMatch(item.id, level, adventurer!.item_specials_seed, beast!);
                      const isArmorSlot = ['Head', 'Chest', 'Foot', 'Hand', 'Waist'].includes(ItemUtils.getItemSlot(item.id));
                      const isWeaponSlot = ItemUtils.getItemSlot(item.id) === 'Weapon';
                      const isDefenseItem = bestItemIds.includes(item.id);

                      return (
                        <Box
                          onClick={() => {
                            equipItem(item);
                            // Keep the slot selected and show the newly equipped item's stats
                            setSelectedItem(item);
                          }}
                          sx={{
                            ...styles.swapMenuItem,
                            ...(isDefenseItem && styles.strongSwapMenuItem),
                            ...(isNameMatch && isArmorSlot && styles.nameMatchDangerSwapMenuItem),
                            ...(isNameMatch && isWeaponSlot && styles.nameMatchPowerSwapMenuItem)
                          }}
                        >
                          <Box sx={styles.swapMenuItemImageContainer}>
                            <Box
                              sx={[
                                styles.swapMenuItemGlow,
                                { backgroundColor: ItemUtils.getTierColor(ItemUtils.getItemTier(item.id)) }
                              ]}
                            />
                            <Box
                              component="img"
                              src={ItemUtils.getItemImage(item.id)}
                              alt={ItemUtils.getItemName(item.id)}
                              sx={styles.swapMenuItemImage}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {/* Damage Indicator Overlay for Swap Menu */}
                            {(() => {
                              let swapDamage = 0;
                              let swapDamageTaken = 0;
                              let swapCritDamage = 0;
                              let swapCritDamageTaken = 0;

                              if (beast) {
                                if (isArmorSlot) {
                                  const damageSummary = calculateBeastDamage(beast, adventurer!, item);
                                  swapDamageTaken = damageSummary.baseDamage;
                                  swapCritDamageTaken = damageSummary.criticalDamage;
                                } else if (isWeaponSlot) {
                                  const attackSummary = calculateAttackDamage(item, adventurer!, beast);
                                  swapDamage = attackSummary.baseDamage;
                                  swapCritDamage = attackSummary.criticalDamage;
                                }
                              }

                              const showBase = isArmorSlot ? swapDamageTaken > 0 : swapDamage > 0;
                              const showCrit = isArmorSlot ? swapCritDamageTaken > 0 : swapCritDamage > 0;

                              if (!showBase && !showCrit) {
                                return null;
                              }

                              if (advancedMode) {
                                return (
                                  <>
                                    {showBase && (
                                      <Box sx={[
                                        styles.damageIndicator,
                                        styles.damageIndicatorTop,
                                        isArmorSlot ? styles.damageIndicatorRed : styles.damageIndicatorGreen
                                      ]}>
                                        <Typography sx={[
                                          styles.damageIndicatorText,
                                          isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                                        ]}>
                                          {isArmorSlot ? `-${swapDamageTaken}` : `+${swapDamage}`}
                                        </Typography>
                                      </Box>
                                    )}
                                    {showCrit && (
                                      <Box sx={[
                                        styles.damageIndicator,
                                        styles.damageIndicatorBottom,
                                        isArmorSlot ? styles.damageIndicatorCritRed : styles.damageIndicatorCritGreen
                                      ]}>
                                        <Typography sx={[
                                          styles.damageIndicatorText,
                                          isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                                        ]}>
                                          {isArmorSlot ? `-${swapCritDamageTaken}` : `+${swapCritDamage}`}
                                        </Typography>
                                      </Box>
                                    )}
                                  </>
                                );
                              }

                              return (
                                <Box sx={[
                                  styles.damageIndicator,
                                  isArmorSlot ? styles.damageIndicatorRed : styles.damageIndicatorGreen
                                ]}>
                                  <Typography sx={[
                                    styles.damageIndicatorText,
                                    isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                                  ]}>
                                    {isArmorSlot ? `-${swapDamageTaken}` : `+${swapDamage}`}
                                  </Typography>
                                </Box>
                              );
                            })()}
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Fight Distribution Section (advancedMode only) */}
        {advancedMode && (
          <Box sx={styles.fightDistributionSection}>
            {simulationResult.hasOutcome ? (
              <>
                <Box sx={styles.distributionRow}>
                  <Box
                    sx={[
                      styles.distributionCard,
                      styles.tipCard,
                      simulationResult.winRate >= 100
                        ? styles.tipCardFight
                        : simulationResult.winRate < 10
                          ? styles.tipCardFlee
                          : styles.tipCardGamble,
                    ]}
                  >
                    <Typography sx={styles.distributionLabel}>Tip</Typography>
                    <Typography sx={styles.distributionValue}>
                      {simulationResult.winRate >= 100
                        ? "Fight"
                        : simulationResult.winRate < 10
                          ? "Flee"
                          : "Gamble"}
                    </Typography>
                  </Box>
                  <Box sx={[styles.distributionCard, styles.positiveCard]}>
                    <Typography sx={styles.distributionLabel}>Win %</Typography>
                    <Typography sx={styles.distributionValue}>
                      {formatPercent(simulationResult.winRate)}
                    </Typography>
                  </Box>
                  <Box sx={[styles.distributionCard, styles.warningCard]}>
                    <Typography sx={styles.distributionLabel}>
                      OTK Chance
                    </Typography>
                    <Typography sx={styles.distributionValue}>
                      {formatPercent(simulationResult.otkRate)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={styles.distributionRow}>
                  <Box sx={styles.distributionCard}>
                    <Typography sx={styles.distributionLabel}>Avg Rounds</Typography>
                    <Typography sx={styles.distributionValue}>
                      {formatNumber(simulationResult.modeRounds)}
                    </Typography>
                  </Box>
                  <Box sx={[styles.distributionCard, styles.positiveCard]}>
                    <Typography sx={styles.distributionLabel}>
                      Avg DMG Dealt
                    </Typography>
                    <Typography sx={styles.distributionValue}>
                      {formatNumber(simulationResult.modeDamageDealt)}
                    </Typography>
                  </Box>
                  <Box sx={[styles.distributionCard, styles.warningCard]}>
                    <Typography sx={styles.distributionLabel}>
                      Avg DMG Taken
                    </Typography>
                    <Typography sx={styles.distributionValue}>
                      {formatNumber(Math.round(simulationResult.modeDamageTaken))}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <Box />
            )}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}

const pulseRed = keyframes`
  0% {
    box-shadow: 0 0 12px rgba(248, 27, 27, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(248, 27, 27, 0.8);
  }
  100% {
    box-shadow: 0 0 12px rgba(248, 27, 27, 0.6);
  }
`;

const pulseGreen = keyframes`
  0% {
    box-shadow: 0 0 12px rgba(128, 255, 0, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(128, 255, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 12px rgba(128, 255, 0, 0.6);
  }
`;

const pulseTextGlow = keyframes`
  0% {
    text-shadow: 0 0 15px rgba(128, 255, 0, 0.6), 0 0 30px rgba(128, 255, 0, 0.3);
  }
  50% {
    text-shadow: 0 0 20px rgba(128, 255, 0, 0.8), 0 0 40px rgba(128, 255, 0, 0.5);
  }
  100% {
    text-shadow: 0 0 15px rgba(128, 255, 0, 0.6), 0 0 30px rgba(128, 255, 0, 0.3);
  }
`;

const elegantPulse = keyframes`
  0% {
    text-shadow: 0 0 5px rgba(237, 207, 51, 0.4), 0 0 30px rgba(237, 207, 51, 0.2);
  }
  50% {
    text-shadow: 0 0 8px rgba(237, 207, 51, 0.8), 0 0 50px rgba(237, 207, 51, 0.4);
  }
  100% {
    text-shadow: 0 0 5px rgba(237, 207, 51, 0.4), 0 0 30px rgba(237, 207, 51, 0.2);
  }
`;

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  battleContainer: {
    height: 'calc(100% - 65px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0 !important',
  },
  probabilityContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 3,
    borderRadius: '10px',
    mb: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    py: 1
  },
  probabilityBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
  probabilityLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.85rem',
    fontFamily: 'VT323, monospace',
  },
  probabilityValue: {
    color: '#80FF00',
    fontSize: '0.85rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  topSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 12px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    gap: 2
  },
  beastInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  beastHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  beastName: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
  },
  beastNameContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  traitIndicators: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  traitBox: {
    padding: '2px 6px',
    background: 'rgba(237, 207, 51, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(237, 207, 51, 0.3)',
  },
  traitText: {
    color: '#EDCF33',
    fontSize: '0.7rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: '1',
  },
  beastType: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  levelBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    p: '2px 6px',
    background: 'rgba(237, 207, 51, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(237, 207, 51, 0.2)',
    minWidth: '50px',
    gap: '1px'
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    p: '2px 6px',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    minWidth: '50px',
    gap: '1px'
  },
  levelLabel: {
    color: 'rgba(237, 207, 51, 0.7)',
    fontSize: '0.7rem',
    fontFamily: 'VT323, monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: '1',
  },
  statLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.7rem',
    fontFamily: 'VT323, monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: '1',
  },
  statValue: {
    color: '#80FF00',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    lineHeight: '1',
  },
  levelValue: {
    color: '#EDCF33',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    lineHeight: '1',
  },
  statsContainer: {
    display: 'flex',
    gap: '20px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  healthContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  healthValue: {
    color: '#80FF00',
    fontWeight: 'bold',
  },
  healthBar: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#80FF00',
    },
  },
  beastImageContainer: {
    width: '160px',
    height: '160px',
    maxWidth: '35vw',
    maxHeight: '35vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  beastImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
  },
  collectableBeastImage: {
    maxWidth: '80%',
    maxHeight: '80%',
    objectFit: 'contain' as const,
  },
  collectableText: {
    color: '#EDCF33',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    textAlign: 'center',
    marginTop: '4px',
    textShadow: '0 0 8px rgba(237, 207, 51, 0.5)',
    fontWeight: 'bold',
  },
  ownerNameText: {
    color: '#FFFFFF',
    fontSize: '0.8rem',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: '0.9',
  },
  middleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    my: '8px'
  },
  combatLogContainer: {
    width: '100%',
    minHeight: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    display: 'flex',
    gap: 1,
    width: '100%',
  },
  actionButtonContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    width: '100%',
  },
  attackButton: {
    width: '100%',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #80FF00 30%, #9dff33 90%)',
    borderRadius: '12px',
    color: '#111111',
  },
  fleeButton: {
    width: '100%',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #EDCF33 30%, #f5e066 90%)',
    borderRadius: '12px',
    color: '#111111',
  },
  suggestButton: {
    width: '100%',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #3380ff 30%, #66a3ff 90%)',
    borderRadius: '12px',
    color: '#111111',
  },
  deathCheckboxRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
  },
  deathCheckboxContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
    minWidth: '32px',
    cursor: 'pointer',
  },
  deathCheckboxLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.75rem',
    fontFamily: 'VT323, monospace',
    lineHeight: '0.9',
    textAlign: 'center',
  },
  deathCheckbox: {
    color: 'rgba(128, 255, 0, 0.7)',
    padding: '0',
    '&.Mui-checked': {
      color: '#80FF00',
    },
  },
  bottomSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  adventurerStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  adventurerVitals: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  adventurerImageContainerSmall: {
    width: '50px',
    height: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  adventurerImageSmall: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
    filter: 'drop-shadow(0 0 10px rgba(128, 255, 0, 0.3))',
  },
  adventurerInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  adventurerHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  playerName: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
  },
  rewardsContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '4px 8px',
    background: 'rgba(237, 207, 51, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(237, 207, 51, 0.2)',
    marginTop: '8px',
  },
  rewardText: {
    color: '#EDCF33',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  adventurerImageContainer: {
    width: '90px',
    height: '90px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  adventurerImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
    filter: 'drop-shadow(0 0 10px rgba(128, 255, 0, 0.3))',
  },
  statsRow: {
    display: 'flex',
    gap: '4px',
    mt: '2px',
    marginBottom: '8px',
  },
  healthRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
  },
  healthLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.875rem',
    lineHeight: '1',
    fontFamily: 'VT323, monospace',
  },
  probabilityText: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.85rem',
    fontFamily: 'VT323, monospace',
    textAlign: 'center',
  },
  beastPower: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
  equippedItemsContainer: {
    mt: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  equippedItemsTitle: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    textAlign: 'center',
  },
  equippedItemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '4px',
  },
  equippedItemSlot: {
    aspectRatio: '1',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative',
  },
  strongItemSlot: {
    border: '1px solid #80FF00',
    boxShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
  },
  weakItemSlot: {
    border: '1px solid rgb(248, 27, 27)',
    boxShadow: '0 0 8px rgba(255, 68, 68, 0.3)',
  },
  nameMatchDangerSlot: {
    animation: `${pulseRed} 1.5s infinite`,
    border: '2px solid rgb(248, 27, 27)',
    boxShadow: '0 0 12px rgba(248, 27, 27, 0.6)',
  },
  nameMatchPowerSlot: {
    animation: `${pulseGreen} 1.5s infinite`,
    border: '2px solid #80FF00',
    boxShadow: '0 0 12px rgba(128, 255, 0, 0.6)',
  },
  equippedItemSlotIcon: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equippedItemImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equippedItemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    position: 'relative',
    zIndex: 2,
  },
  itemGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    filter: 'blur(6px)',
    opacity: 0.4,
    zIndex: 1,
  },
  equippedItemTierBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    padding: '1px 3px 0',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedItemTierText: {
    color: '#111111',
    fontSize: '0.7rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  typeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  typeIcon: {
    width: '18px',
    height: '18px',
    filter: 'invert(1) sepia(1) saturate(3000%) hue-rotate(50deg) brightness(1.1)',
  },
  tooltipContainer: {
    padding: '8px',
    minWidth: '240px',
    background: 'rgba(0, 0, 0, 0.95)',
    border: '1px solid rgba(128, 255, 0, 0.3)',
    borderRadius: '6px',
    boxShadow: '0 0 20px rgba(128, 255, 0, 0.2)',
  },
  tooltipHeader: {
    borderBottom: '1px solid rgba(128, 255, 0, 0.3)',
    paddingBottom: '4px',
    marginBottom: '8px',
  },
  tooltipTitle: {
    color: '#80FF00',
    fontSize: '1rem',
    fontFamily: 'VT323, monospace',
    textAlign: 'center',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
  },
  tooltipSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '6px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '4px',
    marginBottom: '8px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  tooltipSectionTitle: {
    color: 'rgba(128, 255, 0, 0.9)',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '1px solid rgba(128, 255, 0, 0.2)',
    paddingBottom: '2px',
  },
  tooltipTypeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 6px',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '3px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
  tooltipTypeIcon: {
    width: '16px',
    height: '16px',
    filter: 'invert(1) sepia(1) saturate(3000%) hue-rotate(50deg) brightness(1.1)',
  },
  tooltipTypeText: {
    color: '#80FF00',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
  },
  tooltipStrengths: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tooltipWeaknesses: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tooltipLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.7rem',
    fontFamily: 'VT323, monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  swapMenu: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    border: '1px solid rgba(128, 255, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '8px',
    zIndex: 1000,
  },
  swapMenuTitle: {
    color: '#80FF00',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    textAlign: 'center',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  itemDetailsContainer: {
    mt: 0.5,
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  itemDetailsContent: {
    display: 'flex',
    gap: 2,
    p: 1,
    pt: 0.5,
    overflow: 'auto',
    flex: 1,
  },
  itemInfoSection: {
    flex: '0 0 auto',
    minWidth: '160px',
    pr: 1,
  },
  itemName: {
    color: '#80FF00',
    fontSize: '0.95rem',
    fontFamily: 'VT323, monospace',
    mb: 0.5,
    fontWeight: 'bold',
  },
  itemStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  compactInfoLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '3px',
    padding: '2px 6px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  availableItemsSection: {
    flex: '0 0 auto',
    minWidth: '120px',
  },
  availableItemsTitle: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    mb: 0.5,
  },
  swapItemsGrid: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.7rem',
    fontFamily: 'VT323, monospace',
    textTransform: 'uppercase',
    lineHeight: 1,
  },
  infoValue: {
    color: '#80FF00',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  emptySlotText: {
    color: 'rgba(128, 255, 0, 0.5)',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    mb: 0.5,
  },
  swapMenuItem: {
    aspectRatio: '1',
    backgroundColor: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '4px',
    padding: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '36px',
    width: '36px',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.1)',
    },
  },
  strongSwapMenuItem: {
    border: '1px solid #80FF00',
    boxShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
  },
  weakSwapMenuItem: {
    border: '1px solid rgb(248, 27, 27)',
    boxShadow: '0 0 8px rgba(255, 68, 68, 0.3)',
  },
  nameMatchDangerSwapMenuItem: {
    animation: `${pulseRed} 1.5s infinite`,
    border: '2px solid rgb(248, 27, 27)',
    boxShadow: '0 0 12px rgba(248, 27, 27, 0.6)',
  },
  nameMatchPowerSwapMenuItem: {
    animation: `${pulseGreen} 1.5s infinite`,
    border: '2px solid #80FF00',
    boxShadow: '0 0 12px rgba(128, 255, 0, 0.6)',
  },
  swapMenuItemImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapMenuItemGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    filter: 'blur(4px)',
    opacity: 0.4,
    zIndex: 1,
  },
  swapMenuItemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    position: 'relative',
    zIndex: 2,
  },
  damageIndicator: {
    position: 'absolute',
    right: '2px',
    minWidth: '18px',
    padding: '1px 4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(2px)',
  },
  damageIndicatorTop: {
    top: '2px',
  },
  damageIndicatorBottom: {
    bottom: '2px',
  },
  damageIndicatorRed: {
    background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(255, 68, 68, 0.3)',
  },
  damageIndicatorGreen: {
    background: 'linear-gradient(135deg, rgba(68, 255, 68, 0.95) 0%, rgba(38, 220, 38, 0.95) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(68, 255, 68, 0.3)',
  },
  damageIndicatorCritRed: {
    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(128, 0, 0, 0.95) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(220, 38, 38, 0.35)',
  },
  damageIndicatorCritGreen: {
    background: 'linear-gradient(135deg, rgba(38, 220, 38, 0.95) 0%, rgba(12, 128, 12, 0.95) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(38, 220, 38, 0.35)',
  },
  damageIndicatorText: {
    fontSize: '0.65rem',
    fontWeight: 'bold',
    fontFamily: 'VT323, monospace',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)',
    lineHeight: 1,
    letterSpacing: '0.5px',
  },
  damageIndicatorTextRed: {
    color: '#FFFFFF',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.9), 0 0 4px rgba(255, 255, 255, 0.3)',
  },
  damageIndicatorTextGreen: {
    color: '#FFFFFF',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.9), 0 0 4px rgba(255, 255, 255, 0.3)',
  },
  beastStatsContainer: {
    position: 'absolute',
    top: 106,
    right: '155px',
    width: '185px',
    display: 'flex',
    gap: '4px',
  },
  statContainer: {
    flex: 1,
    padding: '4px 4px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  goldValueContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectableContainer: {
    position: 'absolute',
    bottom: -5,
  },
  wantedBeastText: {
    color: '#EDCF33',
    fontSize: '0.95rem',
    fontWeight: '600',
    textAlign: 'center',
    textShadow: '0 0 8px rgba(237, 207, 51, 0.6), 0 0 16px rgba(237, 207, 51, 0.3)',
    lineHeight: '1.1',
    letterSpacing: '0.5px',
    animation: `${elegantPulse} 0.5s infinite`,
  },
  toastContainer: {
    display: 'flex',
    position: 'absolute',
    top: -5,
    zIndex: 1000,
  },
  fightDistributionSection: {
    mt: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px 12px 14px',
    borderRadius: '10px',
    background: 'rgba(128, 255, 0, 0.05)',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  distributionRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  distributionCard: {
    flex: 1,
    minWidth: '0',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(128, 255, 0, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  distributionLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.68rem',
    letterSpacing: '0.75px',
    textTransform: 'uppercase' as const,
    fontFamily: 'VT323, monospace',
  },
  distributionValue: {
    color: '#F4F6F8',
    fontFamily: 'VT323, monospace',
    fontSize: '1.35rem',
    letterSpacing: '0.5px',
    lineHeight: 1,
  },
  tipCard: {
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(128, 255, 0, 0.25)',
    background: 'linear-gradient(135deg, rgba(32, 48, 32, 0.85), rgba(12, 20, 12, 0.85))',
  },
  tipCardFight: {
    boxShadow: '0 0 18px rgba(128, 255, 0, 0.35)',
  },
  tipCardFlee: {
    borderColor: 'rgba(248, 27, 27, 0.45)',
    background: 'linear-gradient(135deg, rgba(60, 16, 16, 0.85), rgba(20, 4, 4, 0.85))',
    boxShadow: '0 0 18px rgba(248, 27, 27, 0.35)',
  },
  tipCardGamble: {
    borderColor: 'rgba(237, 207, 51, 0.45)',
    background: 'linear-gradient(135deg, rgba(48, 36, 8, 0.9), rgba(16, 12, 3, 0.85))',
    boxShadow: '0 0 18px rgba(237, 207, 51, 0.3)',
  },
  positiveCard: {
    borderColor: 'rgba(128, 255, 0, 0.35)',
    background: 'rgba(20, 36, 20, 0.9)',
  },
  warningCard: {
    borderColor: 'rgba(248, 27, 27, 0.4)',
    background: 'rgba(46, 12, 12, 0.85)',
  },
};