import { MAX_BAG_SIZE } from '@/constants/game';
import { Item } from '@/types/game';
import { fadeVariant } from '@/utils/animations';
import { ItemUtils, slotIcons, Tier, typeIcons } from '@/utils/loot';
import { generateMarketItems } from '@/utils/market';
import { Box, Button, Dialog, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ItemListProps {
  isBag: boolean;
  bag: Item[];
  updateBag: (itemIds: number[]) => void;
  handleItemSelect: (itemId: number) => void;
  open: boolean;
  onClose: () => void;
  selectedSlot: string | null;
}

const items = generateMarketItems(Array.from({ length: 101 }, (_, i) => i + 1), 0);

export default function ItemList({ isBag, bag, updateBag, handleItemSelect, open, onClose, selectedSlot }: ItemListProps) {
  const [updatedBag, setUpdatedBag] = useState<number[]>(bag.map(item => item.id));
  const [slotFilter, setSlotFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<Tier | null>(null);

  const handleSlotFilter = (_: React.MouseEvent<HTMLElement>, newSlot: string | null) => {
    setSlotFilter(newSlot);
  };

  const handleTypeFilter = (_: React.MouseEvent<HTMLElement>, newType: string | null) => {
    setTypeFilter(newType);
  };

  const handleTierFilter = (_: React.MouseEvent<HTMLElement>, newTier: Tier | null) => {
    setTierFilter(newTier);
  };

  const handleAddItem = (item: number) => {
    setUpdatedBag(prev => [...prev, item]);
  };

  const handleRemoveItem = (item: number) => {
    setUpdatedBag(prev => prev.filter(bagItem => bagItem !== item));
  };

  useEffect(() => {
    setSlotFilter(selectedSlot);
  }, [selectedSlot]);


  const filteredItems = items.filter(item => {
    if (slotFilter && item.slot !== slotFilter) return false;
    if (typeFilter && item.type !== typeFilter) return false;
    if (tierFilter && item.tier !== tierFilter) return false;
    return true;
  });


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            background: 'rgba(0, 0, 0, 1)',
            border: '1px solid #80FF00',
            maxWidth: '100dvw',
            borderRadius: '5px',
            margin: '4px'
          }
        }
      }}
    >

      <Box sx={styles.dialogContainer}>
        <motion.div variants={fadeVariant} exit='exit' animate='enter'>
          <Box sx={styles.container}>
            {isBag && (
              <Box sx={styles.bagContainer}>
                <Box sx={styles.bagHeader}>
                  <Typography sx={styles.bagTitle}>Bag ({updatedBag.length}/{MAX_BAG_SIZE})</Typography>
                  <Box sx={styles.bagActions}>
                    <Button
                      variant='contained'
                      size='small'
                      onClick={() => setUpdatedBag([])}
                      sx={styles.clearButton}
                    >
                      Clear
                    </Button>
                    <Button
                      variant='contained'
                      color='primary'
                      size='small'
                      sx={{ width: '100px' }}
                      onClick={() => {
                        updateBag(updatedBag);
                        onClose();
                      }}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            <Box sx={styles.filtersContainer}>
              <Box sx={styles.filterGroup}>
                <ToggleButtonGroup
                  value={slotFilter}
                  exclusive
                  onChange={handleSlotFilter}
                  aria-label="item slot"
                  sx={styles.filterButtons}
                  disabled={Boolean(selectedSlot)}
                >
                  {Object.keys(slotIcons).map((slot) => renderSlotToggleButton(slot as keyof typeof slotIcons))}
                </ToggleButtonGroup>
              </Box>

              <Box sx={styles.filterGroup}>
                <ToggleButtonGroup
                  value={typeFilter}
                  exclusive
                  onChange={handleTypeFilter}
                  aria-label="item type"
                  sx={styles.filterButtons}
                >
                  {Object.keys(typeIcons).filter(type => ['Cloth', 'Hide', 'Metal'].includes(type)).map((type) => renderTypeToggleButton(type as keyof typeof typeIcons))}
                </ToggleButtonGroup>

                <ToggleButtonGroup
                  value={tierFilter}
                  exclusive
                  onChange={handleTierFilter}
                  aria-label="item tier"
                  sx={styles.filterButtons}
                >
                  {Object.values(Tier)
                    .filter(tier => typeof tier === 'number' && tier > 0)
                    .map((tier) => renderTierToggleButton(tier as Tier))}
                </ToggleButtonGroup>
              </Box>
            </Box>

            {/* Items Grid */}
            <Box sx={styles.itemsGrid}>
              {filteredItems.map((item) => {
                return (
                  <Paper
                    key={item.id}
                    sx={styles.itemCard}
                  >
                    <Box sx={styles.itemImageContainer}>
                      <Box
                        component="img"
                        src={item.imageUrl}
                        alt={item.name}
                        sx={styles.itemImage}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <Box sx={styles.itemTierBadge} style={{ backgroundColor: ItemUtils.getTierColor(item.tier) }}>
                        <Typography sx={styles.itemTierText}>T{item.tier}</Typography>
                      </Box>
                    </Box>

                    <Box sx={styles.itemInfo}>
                      <Box sx={styles.itemHeader}>
                        <Typography sx={styles.itemName}>{item.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {item.type in typeIcons && (
                            <Box
                              component="img"
                              src={typeIcons[item.type as keyof typeof typeIcons]}
                              alt={item.type}
                              sx={{
                                width: 16,
                                height: 16,
                                filter: 'invert(1) sepia(1) saturate(3000%) hue-rotate(50deg) brightness(0.8)',
                                opacity: 0.9,
                              }}
                            />
                          )}
                          <Typography sx={styles.itemType}>
                            {item.type}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={styles.itemFooter}>
                        <Button
                          variant="contained"
                          onClick={() => !isBag ? handleItemSelect(item.id) : updatedBag.includes(item.id) ? handleRemoveItem(item.id) : handleAddItem(item.id)}
                          disabled={updatedBag.length >= MAX_BAG_SIZE || (!isBag && updatedBag.includes(item.id))}
                          sx={{
                            ...styles.buyButton,
                            ...(updatedBag.includes(item.id) && {
                              background: 'rgba(128, 255, 0, 0.2)',
                              color: 'rgba(128, 255, 0, 0.8)',
                            })
                          }}
                          size="small"
                        >
                          {!isBag ? 'Select' : updatedBag.includes(item.id) ? 'Undo' : 'Add'}
                        </Button>

                        {updatedBag.some(bagItem => bagItem === item.id) && (
                          <Typography sx={{
                            color: 'rgba(255, 165, 0, 0.7)',
                            fontSize: '0.9rem',
                            fontFamily: 'VT323, monospace',
                          }}>
                            In Bag
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Dialog>
  );
}

const renderSlotToggleButton = (slot: keyof typeof slotIcons) => (
  <ToggleButton key={slot} value={slot} aria-label={slot}>
    <Box
      component="img"
      src={slotIcons[slot]}
      alt={slot}
      sx={{
        width: 24,
        height: 24,
        filter: 'invert(1) sepia(1) saturate(3000%) hue-rotate(50deg) brightness(1.1)',
        opacity: 0.9,
      }}
    />
  </ToggleButton>
);

const renderTypeToggleButton = (type: keyof typeof typeIcons) => (
  <ToggleButton key={type} value={type} aria-label={type}>
    <Box
      component="img"
      src={typeIcons[type]}
      alt={type}
      sx={{
        width: 24,
        height: 24,
        filter: 'invert(1) sepia(1) saturate(3000%) hue-rotate(50deg) brightness(1.1)',
        opacity: 0.9,
      }}
    />
  </ToggleButton>
);

const renderTierToggleButton = (tier: Tier) => (
  <ToggleButton key={tier} value={tier} aria-label={`Tier ${tier}`}>
    <Box
      sx={{
        color: ItemUtils.getTierColor(tier),
        fontWeight: 'bold',
        fontSize: '1.1rem',
        lineHeight: '1.5rem',
        width: '24px',
        height: '24px',
      }}
    >
      T{tier}
    </Box>
  </ToggleButton>
);

const styles = {
  dialogContainer: {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    p: '16px 10px',
    width: '400px',
    maxWidth: '100%',
    minHeight: '80vh',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  container: {
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    position: 'relative',
  },
  bagContainer: {
    padding: '12px',
    background: 'rgba(128, 255, 0, 0.05)',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    borderRadius: '8px',
  },
  bagHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
  },
  bagActions: {
    display: 'flex',
    gap: '8px'
  },
  clearButton: {
    width: '80px',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    color: 'rgba(255, 0, 0, 0.8)',
    '&:hover': {
      backgroundColor: 'rgba(255, 0, 0, 0.3)',
    }
  },
  bagTitle: {
    color: '#80FF00',
    fontSize: '1.2rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold'
  },
  filtersContainer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    gap: '6px',
  },
  filterGroup: {
    display: 'flex',
    gap: '3px',
  },
  filterLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
  },
  filterButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0 auto',
    gap: '4px',
    '& .MuiToggleButton-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      borderColor: 'rgba(128, 255, 0, 0.2)',
      padding: '8px',
      minWidth: '32px',
      '&.Mui-selected': {
        color: '#111111',
        backgroundColor: 'rgba(128, 255, 0, 0.3)',
      },
    },
  },
  filterToggleButton: {
    width: 36,
    height: 36,
    minWidth: 36,
    padding: 0,
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 165, 0, 0.3)',
    color: 'rgba(255, 165, 0, 0.8)',
    transition: 'all 0.2s ease',
    borderRadius: '6px',
    '&:hover': {
      background: 'rgba(255, 165, 0, 0.1)',
      borderColor: 'rgba(255, 165, 0, 0.3)',
      color: 'rgba(255, 165, 0, 0.8)',
    },
  },
  filterToggleButtonActive: {
    background: 'rgba(255, 165, 0, 0.15)',
    borderColor: 'rgba(255, 165, 0, 0.4)',
    color: '#FFA500',
    '&:hover': {
      background: 'rgba(255, 165, 0, 0.2)',
    },
  },
  itemsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    pr: '1px',
    alignContent: 'start',
    maxHeight: 'calc(90vh - 200px)',
    overflowY: 'auto',
  },
  itemCard: {
    background: 'rgba(128, 255, 0, 0.05)',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    borderRadius: '8px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    height: 'fit-content',
    '&:hover': {
      boxShadow: '0 1px 3px rgba(128, 255, 0, 0.1)',
    },
  },
  itemImageContainer: {
    position: 'relative',
    width: '100%',
    height: '80px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  itemTierBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    padding: '2px 4px 0',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTierText: {
    color: '#111111',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemName: {
    color: '#80FF00',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemType: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  itemPrice: {
    color: '#EDCF33',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  buyButton: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#111111',
    fontFamily: 'VT323, monospace',
    height: '32px',
    minWidth: '60px',
    '&:disabled': {
      background: 'rgba(128, 255, 0, 0.1)',
      color: 'rgba(128, 255, 0, 0.5)',
    },
  },
};
