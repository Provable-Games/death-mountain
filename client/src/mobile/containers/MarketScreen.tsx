import { useGameDirector } from '@/mobile/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { useMarketStore } from '@/stores/marketStore';
import { calculateLevel } from '@/utils/game';
import { ItemUtils, slotIcons, typeIcons } from '@/utils/loot';
import { MarketItem, generateMarketItems, potionPrice } from '@/utils/market';
import FilterListAltIcon from '@mui/icons-material/FilterListAlt';
import { Box, Button, IconButton, Modal, Paper, Slider, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

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

export default function MarketScreen() {
  const { adventurer, bag, marketItemIds, gameSettings } = useGameStore();
  const { executeGameAction } = useGameDirector();
  const {
    cart,
    slotFilter,
    typeFilter,
    setSlotFilter,
    setTypeFilter,
    addToCart,
    removeFromCart,
    setPotions,
    inProgress,
    setInProgress,
    showFilters,
    setShowFilters,
  } = useMarketStore();

  const [showCart, setShowCart] = useState(false);

  // Function to check if an item is already owned (in equipment or bag)
  const isItemOwned = useCallback((itemId: number) => {
    if (!adventurer) return false;

    // Check equipment
    const equipmentItems = Object.values(adventurer.equipment);
    const equipped = equipmentItems.find(item => item.id === itemId);

    // Check bag
    const inBag = bag.find(item => item.id === itemId);

    return Boolean(inBag || equipped);
  }, [adventurer?.equipment, bag]);

  // Memoize market items to prevent unnecessary recalculations
  const marketItems = useMemo(() => {
    if (!marketItemIds) return [];

    const items = generateMarketItems(marketItemIds, adventurer?.stats?.charisma || 0);

    // Sort items by price and ownership status
    return items.sort((a, b) => {
      const isOwnedA = isItemOwned(a.id);
      const isOwnedB = isItemOwned(b.id);
      const canAffordA = (adventurer?.gold || 0) >= a.price;
      const canAffordB = (adventurer?.gold || 0) >= b.price;

      // First sort by ownership (owned items go to the end)
      if (isOwnedA && !isOwnedB) return 1;
      if (!isOwnedA && isOwnedB) return -1;

      // Then sort by affordability
      if (canAffordA && canAffordB) {
        return b.price - a.price; // Both affordable, sort by price
      } else if (canAffordA) {
        return -1; // A is affordable, B is not, A comes first
      } else if (canAffordB) {
        return 1; // B is affordable, A is not, B comes first
      } else {
        return b.price - a.price; // Both unaffordable, sort by price
      }
    });
  }, [marketItemIds, adventurer?.gold]);

  const handleBuyItem = (item: MarketItem) => {
    addToCart(item);
  };

  const handleBuyPotion = (value: number) => {
    setPotions(value);
  };

  const handleCheckout = () => {
    setInProgress(true);

    let itemPurchases = cart.items.map(item => ({
      item_id: item.id,
      equip: adventurer?.equipment[ItemUtils.getItemSlot(item.id).toLowerCase() as keyof typeof adventurer.equipment]?.id === 0 ? true : false,
    }));

    executeGameAction({
      type: 'buy_items',
      potions: cart.potions,
      itemPurchases,
    });
  };

  const handleRemoveItem = (itemToRemove: MarketItem) => {
    removeFromCart(itemToRemove);
  };

  const handleRemovePotion = () => {
    setPotions(0);
  };

  const handleSlotFilter = (_: React.MouseEvent<HTMLElement>, newSlot: string | null) => {
    setSlotFilter(newSlot);
  };

  const handleTypeFilter = (_: React.MouseEvent<HTMLElement>, newType: string | null) => {
    setTypeFilter(newType);
  };

  const potionCost = potionPrice(calculateLevel(adventurer?.xp || 0), adventurer?.stats?.charisma || 0);
  const totalCost = cart.items.reduce((sum, item) => sum + item.price, 0) + (cart.potions * potionCost);
  const remainingGold = (adventurer?.gold || 0) - totalCost;
  const maxHealth = gameSettings?.adventurer.health! + (adventurer!.stats.vitality * 15);
  const maxPotionsByHealth = Math.ceil((maxHealth - (adventurer?.health || 0)) / 10);
  const maxPotionsByGold = Math.floor((adventurer?.gold || 0) / potionCost);
  const maxPotions = Math.min(maxPotionsByHealth, maxPotionsByGold);

  const filteredItems = marketItems.filter(item => {
    if (slotFilter && item.slot !== slotFilter) return false;
    if (typeFilter && item.type !== typeFilter) return false;
    return true;
  });

  return (
    <Box sx={styles.container}>
      {/* Top Bar */}
      <Box sx={styles.topBar}>
        <Box sx={styles.healthDisplay}>
          <Typography sx={styles.healthLabel}>Health</Typography>
          <Typography sx={styles.healthValue}>
            {Math.min(adventurer?.health! + (cart.potions * 10), maxHealth)}/{maxHealth}
          </Typography>
        </Box>
        <Box sx={styles.goldDisplay}>
          <Typography sx={styles.goldLabel}>Gold</Typography>
          <Typography sx={styles.goldValue}>{remainingGold}</Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setShowCart(!showCart)}
          sx={styles.cartButton}
        >
          Cart ({cart.potions + cart.items.length})
        </Button>
      </Box>

      {/* Cart Modal */}
      <Modal
        open={showCart}
        onClose={() => {
          setShowCart(false);
          setInProgress(false);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{
          background: 'rgba(17, 17, 17, 1)',
          borderRadius: '5px',
          padding: '16px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '80dvh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(128, 255, 0, 0.1)',
          position: 'relative',
        }}>
          <Button
            onClick={() => {
              setShowCart(false);
              setInProgress(false);
            }}
            sx={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              minWidth: '32px',
              height: '32px',
              padding: 0,
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                color: '#80FF00',
              },
            }}
          >
            x
          </Button>
          <Typography sx={styles.cartTitle}>Market Cart</Typography>
          <Box sx={styles.cartItems}>
            {cart.potions > 0 && (
              <Box sx={styles.cartItem}>
                <Typography sx={styles.cartItemName}>Health Potion x{cart.potions}</Typography>
                <Typography sx={styles.cartItemPrice}>{potionCost * cart.potions} Gold</Typography>
                <Button
                  onClick={handleRemovePotion}
                  sx={styles.removeButton}
                >
                  x
                </Button>
              </Box>
            )}
            {cart.items.map((item, index) => (
              <Box key={index} sx={styles.cartItem}>
                <Typography sx={styles.cartItemName}>{item.name}</Typography>
                <Typography sx={styles.cartItemPrice}>{item.price} Gold</Typography>
                <Button
                  onClick={() => handleRemoveItem(item)}
                  sx={styles.removeButton}
                >
                  x
                </Button>
              </Box>
            ))}
          </Box>

          {(adventurer?.stats?.charisma || 0) > 0 && <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            pr: '12px',
            background: 'rgba(237, 207, 51, 0.1)',
            borderRadius: '4px',
            marginBottom: '8px',
          }}>
            <Typography sx={{
              color: 'rgba(237, 207, 51, 0.8)',
              fontSize: '0.9rem',
              fontFamily: 'VT323, monospace',
            }}>
              Gold Saved from Charisma
            </Typography>
            <Typography sx={{
              color: '#EDCF33',
              fontSize: '0.9rem',
              fontFamily: 'VT323, monospace',
              fontWeight: 'bold',
            }}>
              {Math.round(
                (potionPrice(calculateLevel(adventurer?.xp || 0), 0) * cart.potions) - (potionCost * cart.potions) +
                cart.items.reduce((total, item) => {
                  const maxDiscount = (6 - item.tier) * 4;
                  const charismaDiscount = Math.min(adventurer?.stats?.charisma || 0, maxDiscount);
                  return total + charismaDiscount;
                }, 0)
              )} Gold
            </Typography>
          </Box>}

          <Box sx={styles.cartTotal}>
            <Typography sx={styles.totalLabel}>Total</Typography>
            <Typography sx={styles.totalValue}>{totalCost} Gold</Typography>
          </Box>

          <Box sx={styles.cartActions}>
            <Button
              variant="contained"
              onClick={handleCheckout}
              disabled={inProgress || cart.potions === 0 && cart.items.length === 0 || remainingGold < 0}
              sx={styles.checkoutButton}
            >
              {inProgress
                ? <Box display={'flex'} alignItems={'baseline'}>
                  <Typography variant='h5'>
                    Processing
                  </Typography>
                  <div className='dotLoader green' />
                </Box>
                : <Typography variant='h5'>
                  Checkout
                </Typography>
              }
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Main Content */}
      <Box sx={styles.mainContent}>
        {/* Potions Section */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mb: 1 }}>
          <Box sx={styles.potionsSection}>
            <Box sx={styles.potionSliderContainer}>
              <Box sx={styles.potionLeftSection}>
                <Box component="img" src={'/images/health.png'} alt="Health Icon" sx={styles.potionImage} />
                <Box sx={styles.potionInfo}>
                  <Typography sx={styles.potionLabel}>Buy Potions</Typography>
                  <Typography sx={styles.potionHelperText}>+10 Health</Typography>
                </Box>
              </Box>
              <Box sx={styles.potionRightSection}>
                <Box sx={styles.potionControls}>
                  <Typography sx={styles.potionCost}>Cost: {potionCost} Gold</Typography>
                </Box>
                <Slider
                  value={cart.potions}
                  onChange={(_, value) => handleBuyPotion(value as number)}
                  min={0}
                  max={maxPotions}
                  sx={styles.potionSlider}
                />
              </Box>
            </Box>
          </Box>

          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              ...styles.filterToggleButton,
              ...(showFilters ? styles.filterToggleButtonActive : {})
            }}
          >
            <FilterListAltIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Filters */}
        {showFilters && (
          <Box sx={styles.filtersContainer}>
            <Box sx={styles.filterGroup}>
              <ToggleButtonGroup
                value={slotFilter}
                exclusive
                onChange={handleSlotFilter}
                aria-label="item slot"
                sx={styles.filterButtons}
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
            </Box>
          </Box>
        )}

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
                    sx={[
                      styles.itemGlow,
                      { backgroundColor: ItemUtils.getTierColor(item.tier) }
                    ]}
                  />
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
                            zIndex: 3,
                          }}
                        />
                      )}
                      <Typography sx={styles.itemType}>
                        {item.type}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={styles.itemFooter}>
                    <Typography sx={styles.itemPrice}>
                      {item.price} Gold
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {cart.items.some(cartItem => cartItem.id === item.id) && (
                        <Typography sx={{
                          color: 'rgba(255, 165, 0, 0.7)',
                          fontSize: '0.9rem',
                          fontFamily: 'VT323, monospace',
                          mt: '-18px'
                        }}>
                          In Cart
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => cart.items.some(cartItem => cartItem.id === item.id) ? handleRemoveItem(item) : handleBuyItem(item)}
                        disabled={!cart.items.some(cartItem => cartItem.id === item.id) && (remainingGold < item.price || isItemOwned(item.id))}
                        sx={{
                          ...styles.buyButton,
                          ...(cart.items.some(cartItem => cartItem.id === item.id) && {
                            background: 'rgba(128, 255, 0, 0.2)',
                            color: 'rgba(128, 255, 0, 0.8)',
                          })
                        }}
                        size="small"
                      >
                        {cart.items.some(cartItem => cartItem.id === item.id) ? 'Undo' : isItemOwned(item.id) ? 'Owned' : 'Buy'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            );
          })}
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
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderBottom: '1px solid rgba(128, 255, 0, 0.1)',
    gap: '8px',
    flexWrap: 'wrap',
  },
  healthDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(128, 255, 0, 0.05)',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  healthLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
  },
  healthValue: {
    color: '#80FF00',
    fontSize: '1.1rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  goldDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(237, 207, 51, 0.1)',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(237, 207, 51, 0.2)',
  },
  goldLabel: {
    color: 'rgba(237, 207, 51, 0.7)',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
  },
  goldValue: {
    color: '#EDCF33',
    fontSize: '1.1rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  cartButton: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#111111',
    fontFamily: 'VT323, monospace',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    pb: 1,
    overflowY: 'auto',
    mb: '60px'
  },
  potionsSection: {
    flex: 1,
  },
  potionSliderContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  potionLeftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  potionRightSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
    ml: '16px',
  },
  potionImage: {
    width: 42,
    height: 42,
  },
  potionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  potionLabel: {
    color: '#80FF00',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  potionHelperText: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
  },
  potionControls: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '95%',
    ml: 1,
  },
  potionCost: {
    color: '#EDCF33',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
  },
  potionCount: {
    color: '#80FF00',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
  },
  potionSlider: {
    color: '#80FF00',
    width: '95%',
    py: 1,
    ml: 1,
    '& .MuiSlider-thumb': {
      backgroundColor: '#80FF00',
      width: '14px',
      height: '14px',
      '&:hover, &.Mui-focusVisible, &.Mui-active': {
        boxShadow: '0 0 0 4px rgba(128, 255, 0, 0.16)',
      },
    },
    '& .MuiSlider-track': {
      backgroundColor: '#80FF00',
    },
    '& .MuiSlider-rail': {
      backgroundColor: 'rgba(128, 255, 0, 0.2)',
    },
  },
  itemsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    alignContent: 'start',
    minHeight: 0,
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
    filter: 'blur(8px)',
    opacity: 0.4,
    zIndex: 1,
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
    zIndex: 3,
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
  cartTitle: {
    color: '#80FF00',
    fontSize: '1.2rem',
    fontFamily: 'VT323, monospace',
    marginBottom: '16px',
    textAlign: 'center',
  },
  cartItems: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '16px',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 2px 8px 8px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  cartItemName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1rem',
    fontFamily: 'VT323, monospace',
    flex: 1,
  },
  cartItemPrice: {
    color: '#EDCF33',
    fontSize: '1rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    minWidth: '80px',
    textAlign: 'right',
  },
  removeButton: {
    padding: 0,
    minWidth: '24px',
    width: '24px',
    height: '24px',
    fontSize: '16px',
    ml: 1,
    color: '#FF4444',
  },
  cartTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    pr: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  totalLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1rem',
    fontFamily: 'VT323, monospace',
  },
  totalValue: {
    color: '#EDCF33',
    fontSize: '1.1rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  cartActions: {
    display: 'flex',
    gap: '8px',
  },
  clearButton: {
    flex: 1,
    fontSize: '0.9rem',
    fontWeight: 'bold',
    background: 'rgba(255, 0, 0, 0.1)',
    color: '#FF0000',
    fontFamily: 'VT323, monospace',
    '&:hover': {
      background: 'rgba(255, 0, 0, 0.2)',
    },
    '&:disabled': {
      background: 'rgba(255, 0, 0, 0.05)',
      color: 'rgba(255, 0, 0, 0.3)',
    },
  },
  checkoutButton: {
    flex: 1,
    fontSize: '1rem',
    py: '8px',
    fontWeight: 'bold',
    background: 'rgba(128, 255, 0, 0.3)',
    color: '#111111',
    fontFamily: 'VT323, monospace',
    '&:disabled': {
      background: 'rgba(128, 255, 0, 0.2)',
    },
  },
  filtersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: 1,
    padding: '8px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  filterLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
  },
  filterButtons: {
    display: 'flex',
    flexWrap: 'wrap',
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
};
