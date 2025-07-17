import { useGameDirector } from '@/mobile/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { Item } from '@/types/game';
import { screenVariants } from '@/utils/animations';
import { getBeastImageById } from '@/utils/beast';
import { ability_based_percentage, calculateAttackDamage, calculateCombatStats, calculateLevel, getNewItemsEquipped } from '@/utils/game';
import { ItemUtils, slotIcons } from '@/utils/loot';
import { Box, Button, Checkbox, LinearProgress, Menu, Tooltip, Typography, keyframes } from '@mui/material';
import { motion } from 'framer-motion';
import { useLottie } from 'lottie-react';
import { useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import strikeAnim from "../assets/animations/strike.json";
import AnimatedText from '../components/AnimatedText';
import BeastTooltip from '../components/BeastTooltip';
import ItemTooltip from '../components/ItemTooltip';

const attackMessage = "Attacking";
const fleeMessage = "Attempting to flee";
const equipMessage = "Equipping items";

export default function BeastScreen() {
  const { executeGameAction, actionFailed } = useGameDirector();
  const { adventurer, adventurerState, beast, battleEvent, bag, gameSettings,
    equipItem, undoEquipment, setShowBeastRewards } = useGameStore();

  const [untilDeath, setUntilDeath] = useState(false);
  const [attackInProgress, setAttackInProgress] = useState(false);
  const [fleeInProgress, setFleeInProgress] = useState(false);
  const [equipInProgress, setEquipInProgress] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const [combatLog, setCombatLog] = useState("");
  const [health, setHealth] = useState(adventurer!.health);
  const [beastHealth, setBeastHealth] = useState(adventurer!.beast_health);

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

      if (!untilDeath) {
        setAttackInProgress(false);
        setFleeInProgress(false);
        setEquipInProgress(false);
      }
    }
  });

  useEffect(() => {
    if (adventurer?.xp === 0) {
      setCombatLog(beast!.baseName + " ambushed you for 10 damage!");
    }
  }, []);

  useEffect(() => {
    if (battleEvent) {
      if (battleEvent.type === "attack") {
        strike.play();
        setCombatLog(`You attacked ${beast!.baseName} for ${battleEvent.attack?.damage} damage ${battleEvent.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`);
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
  }, [actionFailed]);

  const handleAttack = () => {
    setShowBeastRewards(true);
    setAttackInProgress(true);
    setCombatLog(attackMessage);
    executeGameAction({ type: 'attack', untilDeath });
  };

  const handleFlee = () => {
    setFleeInProgress(true);
    setCombatLog(fleeMessage);
    executeGameAction({ type: 'flee', untilDeath });
  };

  const handleEquipItems = () => {
    setEquipInProgress(true);
    setCombatLog(equipMessage);
    executeGameAction({ type: 'equip' });
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

  const fleePercentage = ability_based_percentage(adventurer!.xp, adventurer!.stats.dexterity);
  const beastPower = Number(beast!.level) * (6 - Number(beast!.tier));
  const maxHealth = gameSettings?.adventurer.health! + (adventurer!.stats.vitality * 15);

  const hasNewItemsEquipped = useMemo(() => {
    if (!adventurer?.equipment || !adventurerState?.equipment) return false;
    return getNewItemsEquipped(adventurer.equipment, adventurerState.equipment).length > 0;
  }, [adventurer?.equipment]);

  const combatStats = beast ? calculateCombatStats(adventurer!, bag, beast) : null;
  const bestItemIds = combatStats?.bestItems.map((item: Item) => item.id) || [];

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
                sx={styles.beastName}
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
            </Box>
          </Box>
          <Box sx={styles.beastImageContainer}>
            <img
              src={getBeastImageById(beast!.id)}
              alt={beast!.name}
              style={{
                ...styles.beastImage,
              }}
            />
            {strike.View}
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
          <Box sx={styles.adventurerImageContainer}>
            <img
              src={'/images/mobile/adventurer.png'}
              alt="Adventurer"
              style={styles.adventurerImage}
            />
            {beastStrike.View}
          </Box>

          <Box sx={styles.adventurerInfo}>
            <Box sx={styles.adventurerHeader}>
              <Box sx={styles.healthContainer}>
                <Box sx={styles.statsRow}>
                </Box>
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
              </Box>
            </Box>

            {hasNewItemsEquipped && (
              <Box sx={styles.actionsContainer}>
                <Box sx={styles.actionButtonContainer}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleEquipItems}
                    sx={[styles.attackButton, { mb: '18px' }]}
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
                    sx={[styles.fleeButton, { mb: '18px' }]}
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
                    disabled={attackInProgress || fleeInProgress}
                  >
                    ATTACK
                  </Button>
                  <Typography sx={styles.probabilityText}>
                    {`${calculateAttackDamage(adventurer!.equipment.weapon!, adventurer!, beast!).baseDamage} damage`}
                  </Typography>
                </Box>
                <Box sx={styles.actionButtonContainer}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleFlee}
                    sx={styles.fleeButton}
                    disabled={adventurer!.stats.dexterity === 0 || fleeInProgress || attackInProgress}
                  >
                    FLEE
                  </Button>
                  <Typography sx={styles.probabilityText}>
                    {adventurer!.stats.dexterity === 0 ? 'No Dexterity' : `${fleePercentage}% chance`}
                  </Typography>
                </Box>
                <Box sx={styles.deathCheckboxContainer} onClick={() => {
                  if (!attackInProgress && !fleeInProgress && !equipInProgress) {
                    setUntilDeath(!untilDeath);
                  }
                }}>
                  <Typography sx={styles.deathCheckboxLabel}>
                    until<br />death
                  </Typography>
                  <Checkbox
                    checked={untilDeath}
                    disabled={attackInProgress || fleeInProgress || equipInProgress}
                    onChange={(e) => setUntilDeath(e.target.checked)}
                    size="small"
                    sx={styles.deathCheckbox}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Equipped Items Section */}
        <Box sx={styles.equippedItemsContainer}>
          <Box sx={styles.equippedItemsGrid}>
            {Object.entries(slotIcons).map(([slot, icon], index) => {
              const equippedItem = adventurer?.equipment[slot.toLowerCase() as keyof typeof adventurer.equipment];
              const level = calculateLevel(equippedItem!.xp);
              const isNameMatch = ItemUtils.isNameMatch(equippedItem!.id, level, adventurer!.item_specials_seed, beast!);
              const isArmorSlot = ['Head', 'Chest', 'Legs', 'Hands', 'Waist'].includes(slot);
              const isWeaponSlot = slot === 'Weapon';
              const isNameMatchDanger = isNameMatch && isArmorSlot;
              const isNameMatchPower = isNameMatch && isWeaponSlot;

              const offsetY = getOffsetY(isWeaponSlot, (isNameMatchDanger || isNameMatchPower), level, adventurer!.item_specials_seed);

              return (
                <Tooltip
                  title={equippedItem && equippedItem.id !== 0 ? <ItemTooltip itemSpecialsSeed={adventurer!.item_specials_seed} item={equippedItem} /> : null}
                  placement="top-start"
                  slotProps={{
                    popper: {
                      disablePortal: isMobile,
                      modifiers: [
                        {
                          name: 'preventOverflow',
                          enabled: true,
                          options: { rootBoundary: 'viewport' },
                        },
                        {
                          name: 'offset',
                          options: {
                            offset: [-(index * 30), offsetY], // [x, y] offset in pixels
                          },
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
                  <Box
                    key={slot}
                    onClick={(e) => {
                      setSelectedSlot(slot);
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
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>

          {/* Swap Menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => {
              setMenuAnchor(null);
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  backgroundColor: 'rgba(17, 17, 17, 1)',
                  border: '1px solid rgba(128, 255, 0, 0.1)',
                  borderRadius: '6px',
                  px: 1,
                  mt: 1,
                  minWidth: '40px',
                  minHeight: '40px',
                }
              }
            }}
          >
            <Box sx={styles.swapMenuGrid}>
              {bag
                .filter(item => ItemUtils.getItemSlot(item.id).toLowerCase() === selectedSlot?.toLowerCase())
                .map((item, index) => {
                  const level = calculateLevel(item.xp);
                  const isNameMatch = ItemUtils.isNameMatch(item.id, level, adventurer!.item_specials_seed, beast!);
                  const isArmorSlot = ['Head', 'Chest', 'Legs', 'Hands', 'Waist'].includes(ItemUtils.getItemSlot(item.id));
                  const isWeaponSlot = ItemUtils.getItemSlot(item.id) === 'Weapon';
                  const isDefenseItem = bestItemIds.includes(item.id);
                  const isNameMatchDanger = isNameMatch && isArmorSlot;
                  const isNameMatchPower = isNameMatch && isWeaponSlot;
                  const offsetY = getOffsetY(isWeaponSlot, (isNameMatchDanger || isNameMatchPower), level, adventurer!.item_specials_seed);

                  return (
                    <Tooltip
                      title={<ItemTooltip itemSpecialsSeed={adventurer!.item_specials_seed} item={item} />}
                      placement="top"
                      slotProps={{
                        popper: {
                          disablePortal: isMobile,
                          modifiers: [
                            {
                              name: 'preventOverflow',
                              enabled: true,
                              options: { rootBoundary: 'viewport' },
                            },
                            {
                              name: 'offset',
                              options: {
                                offset: [-(index * 30), offsetY], // [x, y] offset in pixels
                              },
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
                      <Box
                        key={item.id}
                        onClick={() => {
                          equipItem(item);
                          setMenuAnchor(null);
                          setSelectedSlot(null);
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
                        </Box>
                      </Box>
                    </Tooltip>
                  );
                })}
            </Box>
          </Menu>
        </Box>
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

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  battleContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0 !important',
    pt: '4px !important',
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
    padding: '12px 16px',
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
  middleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 20px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    my: '10px'
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
    mb: '2px'
  },
  actionButtonContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '12px 16px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    gap: 2
  },
  adventurerInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    width: '110px',
    height: '110px',
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
    mt: '8px',
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
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(248, 27, 27, 0.1)',
      borderRadius: '4px',
      zIndex: 1,
    }
  },
  nameMatchPowerSlot: {
    animation: `${pulseGreen} 1.5s infinite`,
    border: '2px solid #80FF00',
    boxShadow: '0 0 12px rgba(128, 255, 0, 0.6)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(128, 255, 0, 0.1)',
      borderRadius: '4px',
      zIndex: 1,
    }
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
  swapMenuGrid: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
  },
  swapMenuItem: {
    aspectRatio: '1',
    backgroundColor: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '4px',
    padding: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '40px',
    width: '40px',
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
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(248, 27, 27, 0.1)',
      borderRadius: '4px',
      zIndex: 1,
    }
  },
  nameMatchPowerSwapMenuItem: {
    animation: `${pulseGreen} 1.5s infinite`,
    border: '2px solid #80FF00',
    boxShadow: '0 0 12px rgba(128, 255, 0, 0.6)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(128, 255, 0, 0.1)',
      borderRadius: '4px',
      zIndex: 1,
    }
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
};