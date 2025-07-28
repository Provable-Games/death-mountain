import { useGameDirector } from '@/desktop/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { useMarketStore } from '@/stores/marketStore';
import { calculateLevel } from '@/utils/game';
import { ItemUtils, slotIcons, typeIcons } from '@/utils/loot';
import { MarketItem, generateMarketItems, potionPrice } from '@/utils/market';
import FilterListAltIcon from '@mui/icons-material/FilterListAlt';
import { Box, Button, IconButton, Modal, Slider, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

const renderSlotToggleButton = (slot: keyof typeof slotIcons) => (
  <ToggleButton key={slot} value={slot} aria-label={slot}>
    <Box
      component="img"
      src={slotIcons[slot]}
      alt={slot}
      sx={{
        width: 24,
        height: 24,
        filter: 'invert(0.85) sepia(0.3) saturate(1.5) hue-rotate(5deg) brightness(0.8)',
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
        filter: 'invert(0.85) sepia(0.3) saturate(1.5) hue-rotate(5deg) brightness(0.8)',
        opacity: 0.9,
      }}
    />
  </ToggleButton>
);

export default function MarketOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const { adventurer, bag, marketItemIds, setShowInventory, setNewInventoryItems, newMarket, setNewMarket, gameSettings } = useGameStore();
  const { executeGameAction, actionFailed } = useGameDirector();
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
    clearCart,
  } = useMarketStore();

  const [showCart, setShowCart] = useState(false);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    setShowInventory(!isOpen);
    if (newMarket) {
      setNewMarket(false);
    }
  };

  useEffect(() => {
    if (inProgress) {
      if (cart.items.length > 0) {
        setNewInventoryItems(cart.items.map(item => item.id));
        setShowInventory(true);
      }

      setIsOpen(false);
      setShowCart(false);
      setInProgress(false);
    }

    clearCart();
  }, [marketItemIds, adventurer?.gold, adventurer?.stats?.charisma]);

  useEffect(() => {
    setInProgress(false);
  }, [actionFailed]);

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
  const maxHealth = gameSettings?.adventurer.health! + (adventurer?.stats?.vitality || 0) * 15;
  const maxPotionsByHealth = Math.ceil((maxHealth - (adventurer?.health || 0)) / 10);
  const maxPotionsByGold = Math.floor((adventurer!.gold - cart.items.reduce((sum, item) => sum + item.price, 0)) / potionCost);
  const maxPotions = Math.min(maxPotionsByHealth, maxPotionsByGold);

  const filteredItems = marketItems.filter(item => {
    if (slotFilter && item.slot !== slotFilter) return false;
    if (typeFilter && item.type !== typeFilter) return false;
    return true;
  });

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', bottom: 24, right: 24, zIndex: 100 }}>
        <Box sx={{
          ...styles.buttonWrapper,
          ...(newMarket && styles.buttonWrapperHighlighted)
        }} onClick={handleOpen}>
          <img src={'/images/market.png'} alt="Market" style={{ width: '90%', height: '90%', objectFit: 'contain', display: 'block', filter: 'hue-rotate(50deg) brightness(0.93) saturate(1.05)' }} />
          {newMarket && (
            <Box sx={styles.newIndicator}>!</Box>
          )}
        </Box>
        <Typography sx={styles.marketLabel}>Market</Typography>
      </Box>
      {isOpen && (
        <>
          {/* Market popup */}
          <Box sx={styles.popup}>
            {/* Top Bar */}
            <Box sx={styles.topBar}>
              <Box sx={styles.goldDisplay}>
                <Typography sx={styles.goldLabel} variant='h6'>Gold left:</Typography>
                <Typography sx={styles.goldValue} variant='h6'>{remainingGold}</Typography>
              </Box>
              <Button
                variant="outlined"
                sx={{ height: '34px', width: '120px', justifyContent: 'center' }}
                onClick={() => setShowCart(!showCart)}
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
              <Box sx={styles.cartModal}>
                <Button
                  onClick={() => {
                    setShowCart(false);
                    setInProgress(false);
                  }}
                  sx={styles.closeButton}
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

                {(adventurer?.stats?.charisma || 0) > 0 && <Box sx={styles.charismaDiscount}>
                  <Typography sx={styles.charismaLabel}>
                    Gold Saved from Charisma
                  </Typography>
                  <Typography sx={styles.charismaValue}>
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
                        <div className='dotLoader yellow' />
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
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', mb: '6px' }}>
                <Box sx={styles.potionsSection}>
                  <Box sx={styles.potionSliderContainer}>
                    <Box sx={styles.potionLeftSection}>
                      <Box component="img" src={'/images/health.png'} alt="Health Icon" sx={styles.potionImage} />
                      <Box sx={styles.potionInfo}>
                        <Typography>Potions</Typography>
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
                      {Object.keys(typeIcons).filter(type => ['Cloth', 'Hide', 'Metal']
                        .includes(type)).map((type) => renderTypeToggleButton(type as keyof typeof typeIcons))}
                    </ToggleButtonGroup>
                  </Box>
                </Box>
              )}

              {/* Items Grid */}
              <Box sx={styles.itemsGrid}>
                {filteredItems.map((item) => {
                  const canAfford = remainingGold >= item.price;
                  const inCart = cart.items.some(cartItem => cartItem.id === item.id);
                  const isOwned = isItemOwned(item.id);
                  const shouldGrayOut = (!canAfford && !isOwned && !inCart) || isOwned;
                  return (
                    <Box
                      key={item.id}
                      sx={[
                        styles.itemCard,
                        shouldGrayOut && styles.itemUnaffordable
                      ]}
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
                                sx={styles.typeIcon}
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
                            {inCart && (
                              <Typography sx={styles.inCartText}>
                                In Cart
                              </Typography>
                            )}
                            <Button
                              variant="outlined"
                              onClick={() => inCart ? handleRemoveItem(item) : handleBuyItem(item)}
                              disabled={!inCart && (remainingGold < item.price || isItemOwned(item.id))}
                              sx={{
                                height: '32px',
                                ...(inCart && {
                                  background: 'rgba(215, 197, 41, 0.2)',
                                  color: 'rgba(215, 197, 41, 0.8)',
                                })
                              }}
                              size="small"
                            >
                              <Typography textTransform={'none'}>
                                {inCart ? 'Undo' : isItemOwned(item.id) ? 'Owned' : 'Buy'}
                              </Typography>
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </>
      )}
    </>
  );
}

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
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      background: 'rgba(34, 50, 34, 0.85)',
    },
  },
  buttonWrapperHighlighted: {
    border: '2px solid #d7c529',
    boxShadow: '0 0 12px rgba(215, 197, 41, 0.4), 0 0 8px #000a',
    animation: 'marketPulse 2s ease-in-out infinite',
    '@keyframes marketPulse': {
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
  marketLabel: {
    color: '#e6d28a',
    textShadow: '0 2px 4px #000, 0 0 8px #3a5a2a',
    letterSpacing: 1,
    marginTop: 0.5,
    userSelect: 'none',
    textAlign: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    display: 'block',
  },
  popup: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    width: '390px',
    maxHeight: 'calc(100dvh - 170px)',
    maxWidth: '98dvw',
    background: 'rgba(24, 40, 24, 0.75)',
    border: '2px solid #083e22',
    borderRadius: '10px',
    backdropFilter: 'blur(8px)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 1,
    overflow: 'hidden',
    boxShadow: '0 0 8px #000a',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0 8px 4px',
    boxSizing: 'border-box',
    gap: '8px',
    borderBottom: '1px solid rgba(215, 198, 41, 0.2)',
  },
  goldDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  goldLabel: {
    color: '#d7c529',
  },
  goldValue: {
    color: '#d7c529',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    mt: 1,
    overflowY: 'auto',
  },
  potionsSection: {
    flex: 1,
  },
  potionSliderContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    background: 'rgba(24, 40, 24, 0.95)',
    borderRadius: '4px',
    border: '2px solid #083e22',
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
    width: 36,
    height: 36,
  },
  potionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  potionHelperText: {
    color: '#d0c98d',
    fontSize: '0.8rem',
  },
  potionControls: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '95%',
    ml: 1,
  },
  potionCost: {
    color: '#d7c529',
    fontSize: '0.9rem',
  },
  potionSlider: {
    color: '#d7c529',
    width: '95%',
    py: 1,
    ml: 1,
    '& .MuiSlider-thumb': {
      backgroundColor: '#d7c529',
      width: '14px',
      height: '14px',
      '&:hover, &.Mui-focusVisible, &.Mui-active': {
        boxShadow: '0 0 0 4px rgba(215, 197, 41, 0.16)',
      },
    },
    '& .MuiSlider-track': {
      backgroundColor: '#d7c529',
    },
    '& .MuiSlider-rail': {
      backgroundColor: 'rgba(215, 197, 41, 0.2)',
    },
  },
  itemsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    alignContent: 'start',
    minHeight: 0,
    overflowY: 'auto',
    boxShadow: '0 0 8px #000a',
    pr: '2px',
  },
  itemCard: {
    position: 'relative',
    background: 'rgba(24, 40, 24, 0.95)',
    borderRadius: '4px',
    border: '2px solid #083e22',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
  },
  itemImageContainer: {
    position: 'relative',
    width: '100%',
    height: '80px',
    background: 'rgba(20, 20, 20, 0.7)',
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
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  itemTierText: {
    color: '#111111',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  itemInfo: {
    pt: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  itemHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemName: {
    color: '#d0c98d',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemType: {
    color: '#d0c98d',
    fontSize: '0.8rem',
  },
  typeIcon: {
    width: 16,
    height: 16,
    filter: 'invert(0.85) sepia(0.3) saturate(1.5) hue-rotate(5deg) brightness(0.8)',
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  itemPrice: {
    color: '#d7c529',
  },
  inCartText: {
    color: 'rgba(255, 165, 0, 0.9)',
    fontSize: '12px',
    mt: '-18px'
  },
  cartModal: {
    background: 'rgba(24, 40, 24, 0.95)',
    borderRadius: '8px',
    padding: '16px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '80dvh',
    display: 'flex',
    flexDirection: 'column',
    border: '2px solid #083e22',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    minWidth: '32px',
    height: '32px',
    padding: 0,
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.9)',
    '&:hover': {
      color: '#d7c529',
    },
  },
  cartTitle: {
    color: '#d0c98d',
    fontSize: '1.2rem',
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
    background: 'rgba(20, 20, 20, 0.7)',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  cartItemName: {
    color: '#ffffff',
    fontSize: '1rem',
    flex: 1,
  },
  cartItemPrice: {
    color: '#d7c529',
    fontWeight: '500',
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
  charismaDiscount: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    pr: '12px',
    background: 'rgba(24, 40, 24, 0.95)',
    borderRadius: '4px',
    border: '2px solid #083e22',
    marginBottom: '4px',
  },
  charismaLabel: {
    color: '#d0c98d',
    fontSize: '0.8rem',
  },
  charismaValue: {
    color: '#d7c529',
    fontSize: '0.8rem',
  },
  cartTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    pr: '12px',
    background: 'rgba(24, 40, 24, 0.95)',
    borderRadius: '4px',
    border: '2px solid #083e22',
    marginBottom: '16px',
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: '1rem',
  },
  totalValue: {
    color: '#d7c529',
    fontSize: '15px',
    fontWeight: '600',
  },
  cartActions: {
    display: 'flex',
    gap: '8px',
  },
  checkoutButton: {
    flex: 1,
    fontSize: '1rem',
    py: '8px',
    fontWeight: 'bold',
    background: 'rgba(215, 197, 41, 0.3)',
    color: '#111111',
    justifyContent: 'center',
    '&:hover': {
      background: 'rgba(215, 197, 41, 0.4)',
    },
    '&:disabled': {
      background: 'rgba(215, 197, 41, 0.2)',
    },
  },
  filtersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '6px',
    padding: '8px',
    background: 'rgba(24, 40, 24, 0.95)',
    borderRadius: '4px',
    border: '2px solid #083e22',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  filterButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    '& .MuiToggleButton-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      borderColor: 'rgba(215, 197, 41, 0.2)',
      padding: '8px',
      minWidth: '32px',
      '&.Mui-selected': {
        color: '#111111',
        backgroundColor: 'rgba(215, 197, 41, 0.3)',
      },
    },
  },
  filterToggleButton: {
    width: 36,
    height: 36,
    minWidth: 36,
    padding: 0,
    background: 'rgba(24, 40, 24, 0.95)',
    border: '2px solid #083e22',
    color: '#d0c98d',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(215, 197, 41, 0.1)',
      borderColor: 'rgba(215, 197, 41, 0.3)',
      color: '#d7c529',
    },
  },
  filterToggleButtonActive: {
    background: 'rgba(215, 197, 41, 0.15)',
    borderColor: 'rgba(215, 197, 41, 0.4)',
    color: '#d7c529',
    '&:hover': {
      background: 'rgba(215, 197, 41, 0.2)',
    },
  },
  newIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    background: 'radial-gradient(circle, #d7c529 60%, #2d3c00 100%)',
    borderRadius: '50%',
    border: '2px solid #222',
    boxShadow: '0 0 8px #d7c529',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#222',
    fontWeight: 'bold',
    zIndex: 2
  },
  itemUnaffordable: {
    opacity: 0.5,
  },
};
