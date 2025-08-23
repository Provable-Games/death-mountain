import { useGameDirector } from '@/mobile/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { Item } from '@/types/game';
import { calculateLevel } from '@/utils/game';
import { ItemUtils, Tier, typeIcons } from '@/utils/loot';
import { Star } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { memo, useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import AdventurerInfo from '../components/AdventurerInfo';
import ItemTooltip from '../components/ItemTooltip';

type EquipmentSlot = 'weapon' | 'chest' | 'head' | 'waist' | 'foot' | 'hand' | 'neck' | 'ring';

// Memoized ItemSlot component
const ItemSlot = memo(({
  item,
  offset,
  itemSpecialsSeed,
  slot,
  isSelected,
  isNew,
  highlight,
  onItemClick,
  onItemHover
}: {
  item: Item | null,
  offset: number,
  itemSpecialsSeed: number,
  slot: string,
  isSelected: boolean,
  isNew: boolean,
  highlight: boolean,
  onItemClick: (item: Item) => void,
  onItemHover: (id: number) => void
}) => {
  const metadata = item ? ItemUtils.getMetadata(item.id) : null;
  const level = item ? calculateLevel(item.xp) : null;
  const xpProgress = item ? Math.min((item.xp / 400) * 100, 100) : 0;

  return (
    <Tooltip
      title={item?.id ? <ItemTooltip itemSpecialsSeed={itemSpecialsSeed} item={item} /> : null}
      placement="bottom"
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
                offset: [-offset, 0], // [x, y] offset in pixels
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
        sx={[styles.item, isSelected && styles.selectedItem, isNew && styles.newItem, highlight && styles.highlight]}
        onClick={() => item?.id && onItemClick(item)}
        onMouseEnter={() => item?.id && onItemHover(item.id)}
      >
        {item?.id && metadata ? (
          <>
            <Box sx={styles.itemLevelBadge}>
              <Typography sx={styles.itemLevelText}>{level}</Typography>
            </Box>
            <Box sx={styles.itemTierBadge}>
              <Box
                component="img"
                src={typeIcons[ItemUtils.getItemType(item.id) as keyof typeof typeIcons]}
                alt=""
                sx={{
                  width: 14,
                  height: 14,
                  filter: `brightness(0) saturate(100%) ${ItemUtils.getItemTier(item.id) === 1 ? 'invert(83%) sepia(30%) saturate(638%) hue-rotate(358deg) brightness(103%) contrast(107%)' :
                    ItemUtils.getItemTier(item.id) === 2 ? 'invert(43%) sepia(15%) saturate(1234%) hue-rotate(231deg) brightness(110%) contrast(87%)' :
                      ItemUtils.getItemTier(item.id) === 3 ? 'invert(24%) sepia(98%) saturate(1823%) hue-rotate(209deg) brightness(96%) contrast(101%)' :
                        ItemUtils.getItemTier(item.id) === 4 ? 'invert(48%) sepia(98%) saturate(1183%) hue-rotate(86deg) brightness(94%) contrast(101%)' :
                          'invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(90%)'}`,
                  opacity: 1,
                }}
              />
            </Box>
            <Box sx={styles.itemImageContainer}>
              <Box
                sx={[
                  styles.itemGlow,
                  { backgroundColor: ItemUtils.getTierColor(ItemUtils.getItemTier(item.id)) }
                ]}
              />
              <img
                src={metadata.imageUrl}
                alt={metadata.name}
                style={{
                  ...styles.itemImage,
                }}
              />
            </Box>
            <Box sx={styles.itemTypeContainer}>
              <Box sx={styles.xpBarContainer}>
                <Box sx={styles.xpBarBackground}>
                  <Box sx={{ ...styles.xpBarFill, width: `${xpProgress}%` }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Typography sx={styles.itemTypeText}>{ItemUtils.getItemSlot(item.id)}</Typography>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={styles.itemImageContainer}>
            <img src={'/images/mobile/empty_slot.png'} alt={`Empty ${slot}`} style={{ ...styles.itemImage, opacity: 0.5 }} />
            <Typography variant="body2" sx={styles.itemName}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
});

export default function CharacterScreen() {
  const { executeGameAction, actionFailed } = useGameDirector();
  const { adventurer, beast, bag, newInventoryItems, setNewInventoryItems, equipItem } = useGameStore();

  const [dropInProgress, setDropInProgress] = useState(false);
  const [isDropMode, setIsDropMode] = useState(false);
  const [itemsToDrop, setItemsToDrop] = useState<number[]>([]);
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

  const handleItemHover = useCallback((itemId: number) => {
    if (newItems.includes(itemId)) {
      setNewItems(prev => prev.filter(id => id !== itemId));
    }
  }, [newItems]);

  // Define fixed order for equipment slots
  const equipmentOrder: EquipmentSlot[] = ['head', 'chest', 'hand', 'waist', 'foot', 'weapon', 'ring', 'neck'];

  const handleItemClick = (item: Item, bag: boolean = false) => {
    if (isDropMode) {
      if (itemsToDrop.includes(item.id)) {
        setItemsToDrop(itemsToDrop.filter(id => id !== item.id));
      } else {
        setItemsToDrop([...itemsToDrop, item.id]);
      }
    } else if (bag) {
      equipItem(item);
    }
  };

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

  return (
    <Box sx={styles.container}>
      <Box sx={styles.characterContainer}>
        {/* Character Info Section */}
        <Box sx={styles.characterInfo}>
          <AdventurerInfo />

          {/* Equipment Section */}
          <Box sx={styles.section}>
            <Box sx={styles.sectionHeader}>
              <Typography variant="h6" sx={styles.sectionTitle}>Equipment ({Object.values(adventurer?.equipment || {}).filter(item => item.id !== 0).length || 0}/8)</Typography>
            </Box>

            <Box sx={styles.itemGrid}>
              {equipmentOrder.map((slot, index) => {
                const item = adventurer?.equipment[slot];
                const isSelected = item?.id ? itemsToDrop.includes(item.id) : false;
                const isNew = item?.id ? newItems.includes(item.id) : false;
                const highlight = item?.id ? (isDropMode && itemsToDrop.length === 0) : false;

                return (
                  <ItemSlot
                    key={slot}
                    offset={(index % 5) * 45}
                    itemSpecialsSeed={adventurer?.item_specials_seed || 0}
                    item={item || null}
                    slot={slot}
                    isSelected={isSelected}
                    isNew={isNew}
                    highlight={highlight}
                    onItemClick={handleItemClick}
                    onItemHover={handleItemHover}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Bag Section */}
          <Box sx={styles.section}>
            <Box sx={styles.sectionHeader}>
              <Typography variant="h6" sx={styles.sectionTitle}>Bag ({bag?.length || 0}/15)</Typography>
            </Box>
            <Box sx={styles.itemGrid}>
              {bag?.map((item, index) => {
                const isNew = newItems.includes(item.id);
                const tier = ItemUtils.getItemTier(item.id);
                const isSelected = itemsToDrop.includes(item.id);
                const highlight = isDropMode && itemsToDrop.length === 0;
                const isWeaponSlot = ItemUtils.getItemSlot(item.id).toLowerCase() === 'weapon';

                if (isNew && isWeaponSlot && [Tier.T1, Tier.T2, Tier.T3].includes(tier) && ItemUtils.getItemTier(adventurer?.equipment.weapon.id!) === Tier.T5) {
                  handleItemClick(item, true);
                }

                return (
                  <ItemSlot
                    key={item.id}
                    offset={(index % 5) * 45}
                    item={item}
                    itemSpecialsSeed={adventurer?.item_specials_seed || 0}
                    slot="bag"
                    isSelected={isSelected}
                    isNew={isNew}
                    highlight={highlight}
                    onItemClick={(item) => handleItemClick(item, true)}
                    onItemHover={handleItemHover}
                  />
                );
              })}
              {Array(15 - (bag?.length || 0)).fill(null).map((_, index) => (
                <Box key={`empty-${index}`} sx={[styles.item, { opacity: 0.5 }]}>
                  <Box sx={styles.itemImageContainer}>
                    <img src={'/images/mobile/empty_slot.png'} alt="Empty slot" style={styles.itemImage} />
                    <Typography variant="body2" sx={styles.itemName}>Empty</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Drop Mode Controls */}
          {!beast && <>
            {!isDropMode ? (
              <Button
                variant="contained"
                onClick={() => setIsDropMode(true)}
                sx={styles.dropButton}
              >
                Drop Items
              </Button>
            ) : (
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
                      <div className='dotLoader green' />
                    </Box>
                    : <Typography>
                      Confirm
                    </Typography>
                  }
                </Button>
              </Box>
            )}
          </>}
        </Box>
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(17, 17, 17, 1)',
    width: '100%',
    height: '100%',
    right: 0,
    bottom: 0,
    zIndex: 900,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  characterContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    boxSizing: 'border-box',
    width: '100%',
    mb: '75px'
  },
  characterInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
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
  levelContainer: {
    background: 'rgba(237, 207, 51, 0.1)',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(237, 207, 51, 0.2)',
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
  section: {
    padding: 1,
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    height: '24px',
  },
  sectionTitle: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '1.2rem',
    lineHeight: '24px',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '6px',
  },
  equipmentSlot: {
    aspectRatio: '1',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '4px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2px',
  },
  equippedItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    width: '100%',
    height: '100%',
  },
  itemImage: {
    width: '40px',
    height: '40px',
    position: 'relative' as const,
    zIndex: 2,
  },
  itemGlow: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -60%)',
    width: '72px',
    height: '40px',
    filter: 'blur(6px)',
    opacity: 0.5,
    zIndex: 1,
  },
  itemName: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.85rem',
    fontFamily: 'VT323, monospace',
    textAlign: 'center',
    lineHeight: 1,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    py: 0.5,
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    position: 'relative',
    cursor: 'pointer',
    minHeight: '55px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(128, 255, 0, 0.15)',
    },
  },
  bagGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '4px',
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
  itemImageContainer: {
    position: 'relative',
  },
  itemTierBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: '2px',
    borderRadius: '4px',
    zIndex: 3,
  },
  itemTierText: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: '0.7rem',
    fontFamily: 'VT323, monospace',
  },
  itemLevelBadge: {
    position: 'absolute',
    top: 0,
    left: 5,
    zIndex: 3,
  },
  itemLevelText: {
    color: '#EDCF33',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  itemTypeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    borderRadius: '0 0 6px 6px',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '2px 0',
  },
  itemTypeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    pt: '2px',
    lineHeight: 1,
  },
  dropButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    color: '#FF0000',
    '&:hover': {
      backgroundColor: 'rgba(255, 0, 0, 0.3)',
    },
  },
  dropControls: {
    display: 'flex',
    gap: 1,
  },
  cancelDropButton: {
    flex: 1,
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
  newItem: {
    border: '2px solid #80FF00',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.15)',
      '& .newItemBadge': {
        display: 'none',
      },
    },
  },
  newItemBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(128, 255, 0, 0.9)',
    padding: '2px 6px',
    borderRadius: '4px',
    zIndex: 2,
  },
  newItemText: {
    color: '#000',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  highlight: {
    border: '1px solid #80FF00',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.15)',
    },
  },
  xpBarContainer: {
    padding: '0 4px',
  },
  xpBarBackground: {
    height: '2px',
    backgroundColor: 'rgba(237, 207, 51, 0.2)',
    borderRadius: '1px',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#EDCF33',
    transition: 'width 0.3s ease',
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
    background: 'rgba(192, 192, 192, 0.9)',
  },
  goldStarOverlay: {
    background: 'rgba(255, 215, 0, 0.9)',
  },
  starIcon: {
    width: 12,
    height: 12,
  },
  silverStarIcon: {
    color: '#C0C0C0',
    filter: 'drop-shadow(0 0 2px rgba(192, 192, 192, 0.8))',
  },
  goldStarIcon: {
    color: '#FFD700',
    filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.8))',
  },
};
