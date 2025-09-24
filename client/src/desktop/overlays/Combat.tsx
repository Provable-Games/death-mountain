import AnimatedText from '@/desktop/components/AnimatedText';
import { useGameDirector } from '@/desktop/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { ability_based_percentage, calculateAttackDamage, calculateCombatStats, getNewItemsEquipped } from '@/utils/game';
import { Box, Button, Checkbox, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import Adventurer from './Adventurer';
import Beast from './Beast';
import InventoryOverlay from './Inventory';
import SettingsOverlay from './Settings';
import TipsOverlay from './Tips';
import { JACKPOT_BEASTS } from '@/constants/beast';
import { useDynamicConnector } from '@/contexts/starknet';
import { useDesktopHotkey } from '@/desktop/hooks/useDesktopHotkey';
import { HotkeyHint } from '@/desktop/components/HotkeyHint';

const attackMessage = "Attacking";
const fleeMessage = "Attempting to flee";
const equipMessage = "Equipping items";

export default function CombatOverlay() {
  const { executeGameAction, actionFailed, spectating, setSkipCombat, skipCombat, showSkipCombat } = useGameDirector();
  const { currentNetworkConfig } = useDynamicConnector();
  const { adventurer, adventurerState, beast, battleEvent, bag, undoEquipment } = useGameStore();

  const [untilDeath, setUntilDeath] = useState(false);
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
      if (battleEvent.type === "attack") {
        setCombatLog(`You attacked ${beast!.baseName} for ${battleEvent.attack?.damage} damage ${battleEvent.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`);
      }

      else if (battleEvent.type === "beast_attack") {
        setCombatLog(`${beast!.baseName} attacked your ${battleEvent.attack?.location} for ${battleEvent.attack?.damage} damage ${battleEvent.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`);
        setEquipInProgress(false);
        if (!untilDeath) {
          setAttackInProgress(false);
          setFleeInProgress(false);
        }
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

    if ([fleeMessage, attackMessage, equipMessage].includes(combatLog)) {
      setCombatLog("");
    }
  }, [actionFailed]);

  const handleAttack = () => {
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

  const handleSkipCombat = () => {
    setSkipCombat(true);
  };

  const fleePercentage = ability_based_percentage(adventurer!.xp, adventurer!.stats.dexterity);
  const combatStats = calculateCombatStats(adventurer!, bag, beast);

  const hasNewItemsEquipped = useMemo(() => {
    if (!adventurer?.equipment || !adventurerState?.equipment) return false;
    return getNewItemsEquipped(adventurer.equipment, adventurerState.equipment).length > 0;
  }, [adventurer?.equipment]);

  const isJackpot = useMemo(() => {
    return currentNetworkConfig.beasts && JACKPOT_BEASTS.includes(beast?.name!);
  }, [beast]);

  const hasAdventurer = Boolean(adventurer);
  const hasBeast = Boolean(beast);
  const adventurerDexterity = adventurer?.stats.dexterity ?? 0;

  const canAttack = !spectating && !hasNewItemsEquipped && hasAdventurer && hasBeast && !attackInProgress && !fleeInProgress && !equipInProgress;
  const canFlee = !spectating && !hasNewItemsEquipped && hasAdventurer && hasBeast && adventurerDexterity > 0 && !fleeInProgress && !attackInProgress && !equipInProgress;

  const attackHotkeyOptions = useMemo(() => ({
    enabled: canAttack,
    preventDefault: true,
  }), [canAttack]);

  const fleeHotkeyOptions = useMemo(() => ({
    enabled: canFlee,
    preventDefault: true,
  }), [canFlee]);

  // Equip/Undo are only available when newly equipped items exist and we are not already processing.
  const equipHotkeyOptions = useMemo(() => ({
    enabled: hasNewItemsEquipped && !equipInProgress && !spectating,
    preventDefault: true,
  }), [hasNewItemsEquipped, equipInProgress, spectating]);

  const undoHotkeyOptions = useMemo(() => ({
    enabled: hasNewItemsEquipped && !equipInProgress && !spectating,
    preventDefault: true,
  }), [hasNewItemsEquipped, equipInProgress, spectating]);

  // 'a' queues an attack whenever the on-screen button is available.
  useDesktopHotkey('a', () => {
    handleAttack();
  }, attackHotkeyOptions);

  // 'f' attempts to flee using the same gating as the flee button.
  useDesktopHotkey('f', () => {
    handleFlee();
  }, fleeHotkeyOptions);

  // 'e' equips items when there are new items pending.
  useDesktopHotkey('e', () => {
    if (!hasNewItemsEquipped || equipInProgress) return;
    handleEquipItems();
  }, equipHotkeyOptions);

  // 'u' undoes pending equipment changes.
  useDesktopHotkey('u', () => {
    if (!hasNewItemsEquipped || equipInProgress) return;
    undoEquipment();
  }, undoHotkeyOptions);

  return (
    <Box sx={[styles.container, spectating && styles.spectating]}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/battle_scenes/${isJackpot ? `jackpot_${beast!.baseName.toLowerCase()}` : beast!.baseName.toLowerCase()}.png')` }]} />

      {/* Adventurer */}
      <Adventurer combatStats={combatStats} />

      {/* Beast */}
      <Beast />

      {/* Combat Log */}
      <Box sx={styles.middleSection}>
        <Box sx={styles.combatLogContainer}>
          <AnimatedText text={combatLog} />
          {(combatLog === fleeMessage || combatLog === attackMessage || combatLog === equipMessage)
            && <div className='dotLoader yellow' style={{ marginTop: '6px' }} />}
        </Box>
      </Box>

      {/* Skip Animations Toggle */}
      {showSkipCombat && untilDeath && <Box sx={styles.skipContainer}>
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
                    EQUIP <HotkeyHint keys={'E'} />
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
                    UNDO <HotkeyHint keys={'U'} />
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
                    ATTACK <HotkeyHint keys={'A'} />
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
                    FLEE <HotkeyHint keys={'F'} />
                  </Typography>
                  <Typography sx={styles.buttonHelperText}>
                    {adventurer!.stats.dexterity === 0 ? 'No Dexterity' : `${fleePercentage}% chance`}
                  </Typography>
                </Box>
              </Button>
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
                size="medium"
                sx={styles.deathCheckbox}
              />
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
};
