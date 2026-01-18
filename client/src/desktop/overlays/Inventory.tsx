import { BEAST_MIN_DAMAGE } from '@/constants/beast';
import AdventurerStats from '@/desktop/components/AdventurerStats';
import ItemTooltip from '@/desktop/components/ItemTooltip';
import { useGameDirector } from '@/desktop/contexts/GameDirector';
import { useGearPresets } from '@/hooks/useGearPresets';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { Item } from '@/types/game';
import { calculateAttackDamage, calculateBeastDamage, calculateCombatStats, calculateLevel } from '@/utils/game';
import { GearPreset } from '@/utils/gearPresets';
import { ItemUtils } from '@/utils/loot';
import { keyframes } from '@emotion/react';
import { DeleteOutline, Star } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

type EquipmentSlot = 'weapon' | 'chest' | 'head' | 'waist' | 'foot' | 'hand' | 'neck' | 'ring';

const equipmentSlots = [
  { key: 'head' as EquipmentSlot, label: 'Head', style: { top: '8px', left: '50%', transform: 'translate(-50%, 0)' }, icon: '/images/types/head.svg' },
  { key: 'chest' as EquipmentSlot, label: 'Chest', style: { top: '68px', left: '50%', transform: 'translate(-50%, 0)' }, icon: '/images/types/chest.svg' },
  { key: 'waist' as EquipmentSlot, label: 'Waist', style: { top: '128px', left: '50%', transform: 'translate(-50%, 0)' }, icon: '/images/types/waist.svg' },
  { key: 'foot' as EquipmentSlot, label: 'Feet', style: { top: '188px', left: '50%', transform: 'translate(-50%, 0)' }, icon: '/images/types/foot.svg' },
  { key: 'hand' as EquipmentSlot, label: 'Hands', style: { top: '98px', left: '8px' }, icon: '/images/types/hand.svg' },
  { key: 'ring' as EquipmentSlot, label: 'Ring', style: { top: '98px', right: '8px' }, icon: '/images/types/ring.svg' },
  { key: 'weapon' as EquipmentSlot, label: 'Weapon', style: { top: '158px', left: '8px' }, icon: '/images/types/weapon.svg' },
  { key: 'neck' as EquipmentSlot, label: 'Neck', style: { top: '38px', right: '8px' }, icon: '/images/types/neck.svg' },
];

interface InventoryOverlayProps {
  disabledEquip?: boolean;
}

function CharacterEquipment({ isDropMode, itemsToDrop, onItemClick, newItems, onItemHover, disabledEquip }: {
  isDropMode: boolean,
  itemsToDrop: number[],
  onItemClick: (item: any) => void,
  newItems: number[],
  onItemHover: (itemId: number) => void,
  disabledEquip?: boolean;
}) {
  const { adventurer, beast, bag, equipGearPreset } = useGameStore();
  const { advancedMode } = useUIStore();
  const { presets } = useGearPresets(adventurer ?? null, bag, advancedMode);
  const isPresetDisabled = isDropMode || !!disabledEquip;

  const handlePresetClick = (preset: GearPreset) => {
    if (isPresetDisabled || !presets[preset].hasChanges) {
      return;
    }

    equipGearPreset(preset);
  };

  return (
    <Box sx={[styles.equipmentPanel, { height: advancedMode ? '315px' : '250px' }]}>
      <Box sx={styles.characterPortraitWrapper}>
        <img src={'/images/adventurer.png'} alt="adventurer" style={{ ...styles.characterPortrait, objectFit: 'contain', position: 'absolute', left: '50%', top: '30%', transform: 'translate(-50%, -30%)', zIndex: 1, filter: 'drop-shadow(0 0 8px #000a)' }} />
        {equipmentSlots.map(slot => {
          const item = adventurer?.equipment[slot.key];
          const metadata = item ? ItemUtils.getMetadata(item.id) : null;
          const isSelected = item?.id ? itemsToDrop.includes(item.id) : false;
          const highlight = item?.id ? (isDropMode && itemsToDrop.length === 0) : false;
          const isNew = item?.id ? newItems.includes(item.id) : false;
          const tier = item?.id ? ItemUtils.getItemTier(item.id) : null;
          const tierColor = tier ? ItemUtils.getTierColor(tier) : undefined;
          const level = item?.id ? calculateLevel(item.xp) : 0;
          const isNameMatch = item?.id && beast ? ItemUtils.isNameMatch(item.id, level, adventurer!.item_specials_seed, beast) : false;
          const isArmorSlot = ['head', 'chest', 'foot', 'hand', 'waist'].includes(slot.key);
          const isWeaponSlot = slot.key === 'weapon';
          const isNameMatchDanger = isNameMatch && isArmorSlot;
          const isNameMatchPower = isNameMatch && isWeaponSlot;
          const hasSpecials = level >= 15;
          const hasGoldSpecials = level >= 20;

          // Calculate damage values
          let damage = 0;
          let damageTaken = 0;
          let critDamage = 0;
          let critDamageTaken = 0;
          if (beast) {
            const beastPower = beast.level * (6 - beast.tier);
            if (isArmorSlot && beast.health > 4) {
              // For armor slots, show damage taken (always negative)
              if (item && item.id !== 0) {
                const damageResult = calculateBeastDamage(beast, adventurer!, item);
                damageTaken = damageResult.baseDamage;
                critDamageTaken = damageResult.criticalDamage;
              } else {
                // For empty armor slots, show beast power * 1.5
                damageTaken = Math.max(BEAST_MIN_DAMAGE, Math.floor(beastPower * 1.5));
                critDamageTaken = Math.floor(damageTaken * 2);
              }
            } else if (isWeaponSlot) {
              // For weapon slots, show damage dealt (always positive)
              if (item && item.id !== 0) {
                const damageResult = calculateAttackDamage(item, adventurer!, beast);
                damage = damageResult.baseDamage;
                critDamage = damageResult.criticalDamage;
              }
            }
          }

          return (
            <Tooltip
              key={slot.key}
              title={item?.id ? (
                <ItemTooltip item={item} itemSpecialsSeed={adventurer?.item_specials_seed || 0} style={styles.tooltipContainer} />
              ) : (
                !item?.id && (
                  beast && isArmorSlot ? (
                    <Box sx={styles.tooltipContainer}>
                      <Box sx={styles.emptySlotTooltipHeader}>
                        <Typography sx={styles.emptySlotTooltipTitle}>
                          Empty {slot.label} Slot
                        </Typography>
                      </Box>
                      <Box sx={styles.emptySlotTooltipDivider} />
                      <Box sx={styles.emptySlotTooltipDamageContainer}>
                        <Typography sx={styles.emptySlotTooltipDamageText}>
                          -{Math.floor((6 - beast.tier) * beast.level * 1.5)} health (Base)
                        </Typography>
                        <Typography sx={styles.emptySlotTooltipDamageText}>
                          -{Math.floor((6 - beast.tier) * beast.level * 1.5 * 2)} health (Critical)
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={styles.tooltipContainer}>
                      <Typography sx={styles.emptySlotTooltipTitle}>
                        Empty {slot.label} Slot
                      </Typography>
                    </Box>
                  )
                )
              )}
              placement="auto-end"
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
              <Box
                sx={[
                  styles.equipmentSlot,
                  ...(isSelected ? [styles.selectedItem] : []),
                  ...(highlight ? [styles.highlight] : []),
                  ...(isNew ? [styles.newItem] : []),
                  ...(!isDropMode ? [styles.nonInteractive] : []),
                  ...(isNameMatchDanger ? [styles.nameMatchDangerSlot] : []),
                  ...(isNameMatchPower ? [styles.nameMatchPowerSlot] : [])
                ]}
                style={{ ...slot.style, position: 'absolute' }}
                onClick={() => isDropMode && item?.id && onItemClick(item)}
                onMouseEnter={() => item?.id && onItemHover(item.id)}
              >
                {item?.id && metadata ? (
                  <Box sx={styles.itemImageContainer}>
                    <Box
                      sx={[
                        styles.itemGlow,
                        { backgroundColor: tierColor }
                      ]}
                    />
                    {(isNameMatchDanger || isNameMatchPower) && (
                      <Box
                        sx={[
                          styles.nameMatchGlow,
                          isNameMatchDanger ? styles.nameMatchDangerGlow : styles.nameMatchPowerGlow
                        ]}
                      />
                    )}
                    <img
                      src={metadata.imageUrl}
                      alt={metadata.name}
                      style={{ ...styles.equipmentIcon, position: 'relative' }}
                    />
                    {hasSpecials && (
                      <Box sx={[styles.starOverlay, hasGoldSpecials ? styles.goldStarOverlay : styles.silverStarOverlay]}>
                        <Star sx={[styles.starIcon, hasGoldSpecials ? styles.goldStarIcon : styles.silverStarIcon]} />
                      </Box>
                    )}
                    {/* Damage Indicator Overlay */}
                    {(damage > 0 || damageTaken > 0) && (
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
                    )}
                    {/* Level Label */}
                    <Box sx={styles.levelLabel}>
                      {level}
                    </Box>
                    {/* Crit Damage Indicator (Advanced Mode) */}
                    {advancedMode && (critDamage > 0 || critDamageTaken > 0) && (
                      <Box sx={[
                        styles.critDamageIndicator,
                        isArmorSlot ? styles.critDamageIndicatorRed : styles.critDamageIndicatorGreen
                      ]}>
                        <Typography sx={[
                          styles.damageIndicatorText,
                          isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                        ]}>
                          {isArmorSlot ? `-${critDamageTaken}` : `+${critDamage}`}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={styles.emptySlot} title={slot.label}>
                    <img src={slot.icon} alt={slot.label} style={{ width: 26, height: 26, opacity: 0.5 }} />
                    {/* Damage Indicator Overlay for Empty Slots */}
                    {(damage > 0 || damageTaken > 0) && (
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
                    )}
                    {/* Crit Damage Indicator for Empty Slots (Advanced Mode) */}
                    {advancedMode && (critDamage > 0 || critDamageTaken > 0) && (
                      <Box sx={[
                        styles.critDamageIndicator,
                        isArmorSlot ? styles.critDamageIndicatorRed : styles.critDamageIndicatorGreen
                      ]}>
                        <Typography sx={[
                          styles.damageIndicatorText,
                          isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                        ]}>
                          {isArmorSlot ? `-${critDamageTaken}` : `+${critDamage}`}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      {advancedMode && (
        <>
          <Box sx={styles.presetHeader}>
            <Typography>Equip preset</Typography>
          </Box>
          <Box sx={styles.presetContainer}>
            {([
              { label: 'CLOTH', key: 'cloth' },
              { label: 'HIDE', key: 'hide' },
              { label: 'METAL', key: 'metal' },
            ] as Array<{ label: string; key: GearPreset }>).map((preset) => (
              <Button
                key={preset.key}
                variant="outlined"
                sx={styles.presetButton}
                onClick={() => handlePresetClick(preset.key)}
                disabled={isPresetDisabled || !presets[preset.key].hasChanges}
              >
                {preset.label}
              </Button>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

function InventoryBag({ isDropMode, itemsToDrop, onItemClick, onDropModeToggle, newItems, onItemHover }: {
  isDropMode: boolean,
  itemsToDrop: number[],
  onItemClick: (item: any) => void,
  onDropModeToggle: () => void,
  newItems: number[],
  onItemHover: (itemId: number) => void
}) {
  const { bag, adventurer, beast } = useGameStore();
  const { advancedMode } = useUIStore();

  // Calculate combat stats to get bestItems for defense highlighting
  const combatStats = beast ? calculateCombatStats(adventurer!, bag, beast) : null;
  const bestItemIds = combatStats?.bestItems.map((item: Item) => item.id) || [];

  return (
    <Box sx={styles.bagPanel}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="h6">Bag ({bag?.length || 0}/{15})</Typography>
        <Typography variant="h6" color="secondary">{adventurer?.gold || 0} gold</Typography>
      </Box>

      <Box sx={styles.bagGrid}>
        {bag?.map((item) => {
          const metadata = ItemUtils.getMetadata(item.id);
          const isSelected = itemsToDrop.includes(item.id);
          const highlight = isDropMode && itemsToDrop.length === 0;
          const isNew = newItems.includes(item.id);
          const tier = ItemUtils.getItemTier(item.id);
          const tierColor = ItemUtils.getTierColor(tier);
          const level = calculateLevel(item.xp);
          const isNameMatch = beast ? ItemUtils.isNameMatch(item.id, level, adventurer!.item_specials_seed, beast) : false;
          const isArmorSlot = ['head', 'chest', 'foot', 'hand', 'waist'].includes(ItemUtils.getItemSlot(item.id).toLowerCase());
          const isWeaponSlot = ItemUtils.getItemSlot(item.id).toLowerCase() === 'weapon';
          const isNameMatchDanger = isNameMatch && isArmorSlot;
          const isNameMatchPower = isNameMatch && isWeaponSlot;
          const isDefenseItem = bestItemIds.includes(item.id);
          const hasSpecials = level >= 15;
          const hasGoldSpecials = level >= 20;

          // Calculate damage values for bag items
          let damage = 0;
          let damageTaken = 0;
          let critDamage = 0;
          let critDamageTaken = 0;
          if (beast) {
            if (isArmorSlot) {
              const damageResult = calculateBeastDamage(beast, adventurer!, item);
              damageTaken = damageResult.baseDamage;
              critDamageTaken = damageResult.criticalDamage;
            } else if (isWeaponSlot) {
              const damageResult = calculateAttackDamage(item, adventurer!, beast);
              damage = damageResult.baseDamage;
              critDamage = damageResult.criticalDamage;
            }
          }

          return (
            <Tooltip
              key={item.id}
              title={<ItemTooltip item={item} itemSpecialsSeed={adventurer?.item_specials_seed || 0} style={styles.tooltipContainer} />}
              placement="auto-end"
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
              <Box
                sx={[
                  styles.bagSlot,
                  ...(isSelected ? [styles.selectedItem] : []),
                  ...(highlight ? [styles.highlight] : []),
                  ...(isNew ? [styles.newItem] : []),
                  ...(isNameMatchDanger ? [styles.nameMatchDangerSlot] : []),
                  ...(isNameMatchPower ? [styles.nameMatchPowerSlot] : []),
                  ...(isDefenseItem ? [styles.defenseItemSlot] : [])
                ]}
                onClick={() => onItemClick(item)}
                onMouseEnter={() => onItemHover(item.id)}
              >
                <Box sx={styles.itemImageContainer}>
                  <Box
                    sx={[
                      styles.itemGlow,
                      { backgroundColor: tierColor }
                    ]}
                  />
                  {(isNameMatchDanger || isNameMatchPower) && (
                    <Box
                      sx={[
                        styles.nameMatchGlow,
                        isNameMatchDanger ? styles.nameMatchDangerGlow : styles.nameMatchPowerGlow
                      ]}
                    />
                  )}
                  <img
                    src={metadata.imageUrl}
                    alt={metadata.name}
                    style={{ ...styles.bagIcon, position: 'relative' }}
                  />
                  {hasSpecials && (
                    <Box sx={[styles.starOverlay, hasGoldSpecials ? styles.goldStarOverlay : styles.silverStarOverlay]}>
                      <Star sx={[styles.starIcon, hasGoldSpecials ? styles.goldStarIcon : styles.silverStarIcon]} />
                    </Box>
                  )}
                  {/* Damage Indicator Overlay for Bag Items */}
                  {(damage > 0 || damageTaken > 0) && (
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
                  )}
                  {/* Level Label */}
                  <Box sx={styles.levelLabel}>
                    {level}
                  </Box>
                  {/* Crit Damage Indicator (Advanced Mode) */}
                  {advancedMode && (critDamage > 0 || critDamageTaken > 0) && (
                    <Box sx={[
                      styles.critDamageIndicator,
                      isArmorSlot ? styles.critDamageIndicatorRed : styles.critDamageIndicatorGreen
                    ]}>
                      <Typography sx={[
                        styles.damageIndicatorText,
                        isArmorSlot ? styles.damageIndicatorTextRed : styles.damageIndicatorTextGreen
                      ]}>
                        {isArmorSlot ? `-${critDamageTaken}` : `+${critDamage}`}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Tooltip>
          );
        })}
        {Array(15 - (bag?.length || 0)).fill(null).map((_, idx) => (
          <Box key={`empty-${idx}`} sx={styles.bagSlot}>
            <Box sx={styles.emptySlot}></Box>
          </Box>
        ))}
        {(!isDropMode && !beast) && (
          <Box
            sx={styles.dropButtonSlot}
            onClick={onDropModeToggle}
          >
            <DeleteOutline sx={styles.dropIcon} />
            <Typography sx={styles.dropText}>drop</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function InventoryOverlay({ disabledEquip }: InventoryOverlayProps) {
  const { advancedMode } = useUIStore();
  const { executeGameAction, actionFailed } = useGameDirector();
  const { adventurer, bag, showInventory, setShowInventory } = useGameStore();
  const { equipItem, newInventoryItems, setNewInventoryItems } = useGameStore();
  const [isDropMode, setIsDropMode] = useState(false);
  const [itemsToDrop, setItemsToDrop] = useState<number[]>([]);
  const [dropInProgress, setDropInProgress] = useState(false);
  const [newItems, setNewItems] = useState<number[]>([]);

  // Update newItems when newInventoryItems changes and clear newInventoryItems
  useEffect(() => {
    if (newInventoryItems.length > 0) {
      setNewItems([...newInventoryItems]);
      setNewInventoryItems([]);
    }
  }, [newInventoryItems]);

  useEffect(() => {
    if (dropInProgress) {
      setDropInProgress(false);
      setIsDropMode(false);
      setItemsToDrop([]);
    }
  }, [adventurer?.equipment, bag, actionFailed]);

  const handleItemClick = useCallback((item: any) => {
    if (disabledEquip) {
      return;
    }

    if (isDropMode) {
      setItemsToDrop(prev => {
        if (prev.includes(item.id)) {
          return prev.filter(id => id !== item.id);
        } else {
          return [...prev, item.id];
        }
      });
    } else {
      equipItem(item);
    }
  }, [isDropMode, equipItem, disabledEquip]);

  const handleConfirmDrop = () => {
    setDropInProgress(true);
    executeGameAction({
      type: 'drop',
      items: itemsToDrop,
    });
  };

  const handleCancelDrop = () => {
    setIsDropMode(false);
    setItemsToDrop([]);
  };

  const handleItemHover = useCallback((itemId: number) => {
    if (newItems.includes(itemId)) {
      setNewItems((prev: number[]) => prev.filter((id: number) => id !== itemId));
    }
  }, [newItems]);

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', bottom: 24, left: 24, zIndex: 100 }}>
        <Box sx={[styles.buttonWrapper, advancedMode && styles.advancedButtonWrapper]} onClick={() => setShowInventory(!showInventory)}>
          <img src={'/images/inventory.png'} alt="Inventory" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'hue-rotate(40deg) saturate(1.5) brightness(1.15) contrast(1.2)' }} />
        </Box>
        {!advancedMode && <Typography sx={styles.inventoryLabel}>Inventory</Typography>}
      </Box>
      {showInventory && (
        <>
          {/* Inventory popup */}
          <Box sx={[styles.popup, advancedMode && styles.advancedPopup]}>
            <Box sx={styles.inventoryRoot}>
              {/* Left: Equipment */}
              <CharacterEquipment
                isDropMode={isDropMode}
                itemsToDrop={itemsToDrop}
                onItemClick={handleItemClick}
                newItems={newItems}
                onItemHover={handleItemHover}
                disabledEquip={disabledEquip}
              />
              {/* Right: Stats */}
              <AdventurerStats />
            </Box>

            {/* Bottom: Bag */}
            <InventoryBag
              isDropMode={isDropMode}
              itemsToDrop={itemsToDrop}
              onItemClick={handleItemClick}
              onDropModeToggle={() => setIsDropMode(true)}
              newItems={newItems}
              onItemHover={handleItemHover}
            />

            {/* Drop Mode Controls */}
            {isDropMode && (
              <Box sx={styles.dropControls}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCancelDrop}
                  sx={styles.cancelDropButton}
                  disabled={dropInProgress}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirmDrop}
                  sx={styles.dropControlButton}
                  disabled={dropInProgress || itemsToDrop.length === 0}
                >
                  {dropInProgress
                    ? <Box display={'flex'} alignItems={'baseline'}>
                      <Typography>
                        Dropping items
                      </Typography>
                      <div className='dotLoader yellow' />
                    </Box>
                    : <Typography>
                      Confirm
                    </Typography>
                  }
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}
    </>
  );
}

const pulseRed = keyframes`
  0% {
    box-shadow: 0 0 16px rgba(248, 27, 27, 0.8), 0 0 24px rgba(248, 27, 27, 0.4);
    background-color: rgba(248, 27, 27, 0.15);
  }
  50% {
    box-shadow: 0 0 24px rgba(248, 27, 27, 1), 0 0 36px rgba(248, 27, 27, 0.6);
    background-color: rgba(248, 27, 27, 0.25);
  }
  100% {
    box-shadow: 0 0 16px rgba(248, 27, 27, 0.8), 0 0 24px rgba(248, 27, 27, 0.4);
    background-color: rgba(248, 27, 27, 0.15);
  }
`;

const pulseGreen = keyframes`
  0% {
    box-shadow: 0 0 16px rgba(128, 255, 0, 0.8), 0 0 24px rgba(128, 255, 0, 0.4);
    background-color: rgba(128, 255, 0, 0.15);
  }
  50% {
    box-shadow: 0 0 24px rgba(128, 255, 0, 1), 0 0 36px rgba(128, 255, 0, 0.6);
    background-color: rgba(128, 255, 0, 0.25);
  }
  100% {
    box-shadow: 0 0 16px rgba(128, 255, 0, 0.8), 0 0 24px rgba(128, 255, 0, 0.4);
    background-color: rgba(128, 255, 0, 0.15);
  }
`;


const styles = {
  buttonWrapper: {
    width: 64,
    height: 64,
    background: 'rgba(24, 40, 24, 1)',
    border: '2px solid rgb(49 96 60)',
    boxShadow: '0 0 8px #000a',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      background: 'rgba(34, 50, 34, 0.85)',
    },
  },
  advancedButtonWrapper: {
    width: 56,
    height: 56,
  },
  inventoryLabel: {
    color: '#e6d28a',
    textShadow: '0 2px 4px #000, 0 0 8px #3a5a2a',
    letterSpacing: 1,
    marginTop: 0.5,
    userSelect: 'none',
    textAlign: 'center',
  },
  popup: {
    position: 'absolute',
    top: '120px',
    left: '24px',
    width: '440px',
    maxHeight: '90vh',
    background: 'rgba(24, 40, 24, 0.55)',
    border: '2px solid #083e22',
    borderRadius: '10px',
    boxShadow: '0 8px 32px 8px #000b',
    backdropFilter: 'blur(8px)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 1.5,
    overflow: 'hidden',
  },
  advancedPopup: {
    boxShadow: '0 2px 12px 2px #000b',
  },
  inventoryRoot: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    mb: 1,
    gap: 1
  },
  equipmentPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: 'rgba(24, 40, 24, 0.95)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    boxShadow: '0 0 8px #000a',
    padding: 1,
  },
  characterPortraitWrapper: {
    position: 'relative',
    width: 200,
    height: 250,
    margin: '0 auto',
    background: 'rgba(20, 20, 20, 0.7)',
    borderRadius: '8px',
  },
  characterPortrait: {
    width: 100,
    height: 140,
  },
  equipmentSlot: {
    width: 50,
    height: 50,
    background: 'rgba(24, 40, 24, 0.95)',
    border: '2px solid #083e22',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 4px #000a',
    zIndex: 2,
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'absolute',
  },
  itemImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    filter: 'blur(8px)',
    opacity: 0.4,
    zIndex: 1,
  },
  equipmentIcon: {
    width: 42,
    height: 42,
    zIndex: 2,
  },
  emptySlot: {
    width: 40,
    height: 40,
    border: '1.5px dashed #666',
    borderRadius: 0,
    background: 'rgba(80,80,80,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagPanel: {
    width: '100%',
    background: 'rgba(24, 40, 24, 0.98)',
    border: '2px solid #083e22',
    padding: '8px',
    boxShadow: '0 0 8px #000a',
    boxSizing: 'border-box',
    borderRadius: '8px',
  },
  bagGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 0.5,
  },
  bagSlot: {
    width: 44,
    height: 44,
    background: 'rgba(24, 40, 24, 0.95)',
    border: '2px solid #083e22',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 4px #000a',
    cursor: 'pointer',
    overflow: 'hidden'
  },
  bagIcon: {
    width: 40,
    height: 40,
    zIndex: 2,
  },
  dropButtonSlot: {
    width: 48,
    height: 48,
    background: 'rgba(255, 0, 0, 0.1)',
    border: '2px solid rgba(255, 0, 0, 0.2)',
    boxShadow: '0 0 4px #000a',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255, 0, 0, 0.2)',
    },
  },
  dropIcon: {
    width: 16,
    height: 16,
    color: 'rgba(255, 0, 0, 0.7)',
  },
  dropText: {
    fontSize: '0.7rem',
    color: 'rgba(255, 0, 0, 0.7)',
    lineHeight: 1,
    mt: 0.5,
  },
  dropControls: {
    display: 'flex',
    gap: 1,
    mt: 1,
  },
  cancelDropButton: {
    flex: 1,
    justifyContent: 'center',
    fontSize: '0.9rem',
    background: 'rgba(255, 0, 0, 0.1)',
    color: '#FF0000',
    '&:disabled': {
      background: 'rgba(255, 0, 0, 0.05)',
      color: 'rgba(255, 0, 0, 0.3)',
    },
  },
  dropControlButton: {
    flex: 1,
    justifyContent: 'center',
    fontSize: '0.9rem',
    background: 'rgba(128, 255, 0, 0.15)',
    color: '#80FF00',
    '&:disabled': {
      background: 'rgba(128, 255, 0, 0.1)',
      color: 'rgba(128, 255, 0, 0.5)',
    },
  },
  selectedItem: {
    border: '2px solid #FF0000',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
    },
  },
  highlight: {
    border: '2px solid #80FF00',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.15)',
    },
  },
  nonInteractive: {
    cursor: 'default',
    '&:hover': {
      cursor: 'pointer',
    },
  },
  tooltipContainer: {
    position: 'absolute' as const,
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    padding: '10px',
    zIndex: 1000,
    minWidth: '220px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  newItem: {
    border: '2px solid #80FF00',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.15)',
    },
  },
  strongItemSlot: {
    border: '2px solid #80FF00',
    boxShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
  },
  weakItemSlot: {
    border: '2px solid rgb(248, 27, 27)',
    boxShadow: '0 0 8px rgba(255, 68, 68, 0.3)',
  },
  nameMatchDangerSlot: {
    animation: `${pulseRed} 1.2s infinite`,
    border: '2px solid rgb(248, 27, 27)',
    boxShadow: '0 0 16px rgba(248, 27, 27, 0.8), 0 0 24px rgba(248, 27, 27, 0.4)',
    zIndex: 10,
  },
  nameMatchPowerSlot: {
    animation: `${pulseGreen} 1.2s infinite`,
    border: '2px solid #80FF00',
    boxShadow: '0 0 16px rgba(128, 255, 0, 0.8), 0 0 24px rgba(128, 255, 0, 0.4)',
    zIndex: 10,
  },
  defenseItemSlot: {
    border: '2px solid rgba(128, 255, 0, 0.4)',
    boxShadow: '0 0 6px rgba(128, 255, 0, 0.2)',
  },
  starOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 10,
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '50%',
    padding: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silverStarOverlay: {
    background: 'rgba(0, 0, 0, 0.9)',
  },
  goldStarOverlay: {
    background: 'rgba(0, 0, 0, 0.9)',
  },
  starIcon: {
    width: 10,
    height: 10,
  },
  silverStarIcon: {
    color: '#E5E5E5',
    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))',
  },
  goldStarIcon: {
    color: '#FFD700',
    filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.8))',
  },
  nameMatchGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120%',
    height: '120%',
    filter: 'blur(12px)',
    opacity: 0.6,
    zIndex: 1,
    animation: 'pulse 1.2s infinite',
  },
  nameMatchDangerGlow: {
    backgroundColor: 'rgba(248, 27, 27, 0.8)',
  },
  nameMatchPowerGlow: {
    backgroundColor: 'rgba(128, 255, 0, 0.8)',
  },
  emptySlotTooltipHeader: {
    marginBottom: '8px',
  },
  emptySlotTooltipTitle: {
    color: '#d0c98d',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  emptySlotTooltipDivider: {
    height: '1px',
    backgroundColor: '#d7c529',
    opacity: 0.2,
    margin: '8px 0',
  },
  emptySlotTooltipDamageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.2)',
  },
  emptySlotTooltipDamageText: {
    color: '#ff4444',
    fontSize: '0.85rem',
  },
  damageIndicator: {
    position: 'absolute',
    top: '1px',
    right: '1px',
    minWidth: '18px',
    height: '12px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(2px)',
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
  levelLabel: {
    position: 'absolute',
    bottom: '1px',
    left: '1px',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    fontFamily: 'VT323, monospace',
    padding: '1px 3px',
    borderRadius: '2px',
    lineHeight: 1,
    zIndex: 20,
    minWidth: '14px',
    textAlign: 'center',
  },
  critDamageIndicator: {
    position: 'absolute',
    bottom: '1px',
    right: '1px',
    minWidth: '18px',
    height: '12px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(2px)',
  },
  critDamageIndicatorRed: {
    background: 'linear-gradient(135deg, rgba(180, 40, 40, 0.95) 0%, rgba(140, 20, 20, 0.95) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(180, 40, 40, 0.3)',
  },
  critDamageIndicatorGreen: {
    background: 'linear-gradient(135deg, rgba(40, 180, 40, 0.95) 0%, rgba(20, 140, 20, 0.95) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 8px rgba(40, 180, 40, 0.3)',
  },
  presetHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginTop: 1,
  },
  presetContainer: {
    display: 'flex',
    width: '200px',
    gap: 0.5,
    marginTop: 0.5,
  },
  presetButton: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    height: '34px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};
