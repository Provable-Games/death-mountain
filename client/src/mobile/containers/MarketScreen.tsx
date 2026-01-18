import { MAX_BAG_SIZE, STARTING_HEALTH } from '@/constants/game';
import { useGameDirector } from '@/mobile/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { useMarketStore } from '@/stores/marketStore';
import { calculateLevel } from '@/utils/game';

import { ItemUtils, ItemType, slotIcons, typeIcons, Tier } from '@/utils/loot';
import { MarketItem, generateMarketItems, getCartItemPlacements, getTierOneArmorSetStats, potionPrice, STAT_FILTER_OPTIONS, type ArmorSetStatSummary, type StatDisplayName } from '@/utils/market';
import FilterListAltIcon from '@mui/icons-material/FilterListAlt';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import { Box, Button, IconButton, Modal, Paper, Slider, Tab, Tabs, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import JewelryTooltip from '@/components/JewelryTooltip';

// Combat advantages based on contract: combat.cairo
const getStrongAgainst = (type: string): string | null => {
  switch (type) {
    case 'Blade': return 'Cloth';
    case 'Magic': return 'Metal';
    case 'Bludgeon': return 'Hide';
    case 'Cloth': return 'Bludgeon';
    case 'Hide': return 'Magic';
    case 'Metal': return 'Blade';
    default: return null;
  }
};

const getWeakAgainst = (type: string): string | null => {
  switch (type) {
    case 'Blade': return 'Metal';
    case 'Magic': return 'Hide';
    case 'Bludgeon': return 'Cloth';
    case 'Cloth': return 'Blade';
    case 'Hide': return 'Bludgeon';
    case 'Metal': return 'Magic';
    default: return null;
  }
};

const getFairAgainst = (type: string): string | null => {
  switch (type) {
    case 'Blade': return 'Hide';
    case 'Magic': return 'Cloth';
    case 'Bludgeon': return 'Metal';
    case 'Cloth': return 'Magic';
    case 'Hide': return 'Blade';
    case 'Metal': return 'Bludgeon';
    default: return null;
  }
};

const isWeaponType = (type: string): boolean => {
  return type === 'Blade' || type === 'Magic' || type === 'Bludgeon';
};

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
        fontSize: '1rem',
        lineHeight: '1.5rem',
        width: '24px',
        height: '24px',
      }}
    >
      T{tier}
    </Box>
  </ToggleButton>
);

const STAT_ABBREVIATIONS: Record<StatDisplayName, string> = {
  Strength: 'STR',
  Vitality: 'VIT',
  Dexterity: 'DEX',
  Intelligence: 'INT',
  Wisdom: 'WIS',
  Charisma: 'CHA',
};

const SET_STATS_TABS = [ItemType.Cloth, ItemType.Hide, ItemType.Metal, 'Weapons', 'Rings'] as const;
type SetStatsTab = typeof SET_STATS_TABS[number];
type ArmorTab = Extract<SetStatsTab, ItemType.Cloth | ItemType.Hide | ItemType.Metal>;
const isArmorTab = (tab: SetStatsTab): tab is ArmorTab =>
  tab === ItemType.Cloth || tab === ItemType.Hide || tab === ItemType.Metal;
type GearTab = Extract<SetStatsTab, 'Weapons' | 'Rings'>;
const isGearTab = (tab: SetStatsTab): tab is GearTab =>
  tab === 'Weapons' || tab === 'Rings';

export default function MarketScreen() {
  const { adventurer, bag, marketItemIds } = useGameStore();
  const { executeGameAction } = useGameDirector();
  const {
    cart,
    slotFilter,
    typeFilter,
    tierFilter,
    statFilter,
    setSlotFilter,
    setTypeFilter,
    setTierFilter,
    setStatFilter,
    addToCart,
    removeFromCart,
    setPotions,
    showFilters,
    setShowFilters,
  } = useMarketStore();


  const [showSetStats, setShowSetStats] = useState(false);
  const [activeSetStatsTab, setActiveSetStatsTab] = useState<SetStatsTab>(ItemType.Cloth);

  const specialsUnlocked = Boolean(adventurer?.item_specials_seed);

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

  const marketItems = useMemo<MarketItem[]>(() => {
    if (!marketItemIds) return [];

    const items = generateMarketItems(
      marketItemIds,
      adventurer?.stats?.charisma || 0,
      adventurer?.item_specials_seed || 0
    );

    return items.sort((a, b) => {
      const isOwnedA = isItemOwned(a.id);
      const isOwnedB = isItemOwned(b.id);
      const canAffordA = (adventurer?.gold || 0) >= a.price;
      const canAffordB = (adventurer?.gold || 0) >= b.price;

      if (isOwnedA && !isOwnedB) return 1;
      if (!isOwnedA && isOwnedB) return -1;

      if (canAffordA && canAffordB) {
        if (a.price === b.price) {
          return a.tier - b.tier;
        }
        return b.price - a.price;
      } else if (canAffordA) {
        return -1;
      } else if (canAffordB) {
        return 1;
      } else {
        return b.price - a.price;
      }
    });
  }, [marketItemIds, adventurer?.gold, adventurer?.stats?.charisma, adventurer?.item_specials_seed, isItemOwned]);


  const handleBuyItem = (item: MarketItem) => {
    addToCart(item);
  };

  const handleBuyPotion = (value: number) => {
    setPotions(value);
  };

  const handleCheckout = () => {
    const { itemPlacements } = getCartItemPlacements(cart.items, adventurer ?? null);

    executeGameAction({
      type: 'buy_items',
      potions: cart.potions,
      itemPurchases: itemPlacements,
      remainingGold,
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

  const handleTierFilter = (_: React.MouseEvent<HTMLElement>, newTier: Tier | null) => {
    setTierFilter(newTier);
  };

  const handleStatFilter = (_: React.MouseEvent<HTMLElement>, newStat: string | null) => {
    setStatFilter(newStat);
  };

  const potionCost = potionPrice(calculateLevel(adventurer?.xp || 0), adventurer?.stats?.charisma || 0);
  const totalCost = cart.items.reduce((sum, item) => sum + item.price, 0) + (cart.potions * potionCost);
  const remainingGold = (adventurer?.gold || 0) - totalCost;
  const maxHealth = STARTING_HEALTH + (adventurer?.stats?.vitality || 0) * 15;
  const maxPotionsByHealth = Math.ceil((maxHealth - (adventurer?.health || 0)) / 10);
  const maxPotionsByGold = Math.floor((adventurer!.gold - cart.items.reduce((sum, item) => sum + item.price, 0)) / potionCost);
  const maxPotions = Math.min(maxPotionsByHealth, maxPotionsByGold);
  const inventoryFull = bag.length + cart.items.length >= MAX_BAG_SIZE;
  const marketAvailable = adventurer?.stat_upgrades_available! === 0;

  const filteredItems = marketItems.filter(item => {
    if (slotFilter && item.slot !== slotFilter) return false;
    if (typeFilter && item.type !== typeFilter) return false;
    if (tierFilter && item.tier !== tierFilter) return false;
    if (statFilter && (!item.futureStatTags.length || !item.futureStatTags.includes(statFilter))) return false;
    return true;
  });

  const setStatsSummaries = useMemo<ArmorSetStatSummary[]>(() => {
    if (!specialsUnlocked) {
      return [];
    }

    return getTierOneArmorSetStats(adventurer?.item_specials_seed || 0);
  }, [specialsUnlocked, adventurer?.item_specials_seed]);
  const armorSummaries = useMemo(
    () => setStatsSummaries.filter((summary) => summary.category === 'Armor'),
    [setStatsSummaries]
  );
  const armorSummariesByType = useMemo(
    () => armorSummaries.reduce((acc, summary) => {
      acc[summary.type as ArmorTab] = summary;
      return acc;
    }, {} as Partial<Record<ArmorTab, ArmorSetStatSummary>>),
    [armorSummaries]
  );
  const weaponSummary = useMemo(
    () => setStatsSummaries.find((summary) => summary.type === 'Weapons') ?? null,
    [setStatsSummaries]
  );
  const ringSummary = useMemo(
    () => setStatsSummaries.find((summary) => summary.type === 'Rings') ?? null,
    [setStatsSummaries]
  );

  const availableSetStatsTabs = useMemo(() => {
    const tabAvailability: Record<SetStatsTab, boolean> = {
      [ItemType.Cloth]: Boolean(armorSummariesByType[ItemType.Cloth]?.items.length),
      [ItemType.Hide]: Boolean(armorSummariesByType[ItemType.Hide]?.items.length),
      [ItemType.Metal]: Boolean(armorSummariesByType[ItemType.Metal]?.items.length),
      Weapons: Boolean(weaponSummary && weaponSummary.items.length > 0),
      Rings: Boolean(ringSummary && ringSummary.items.length > 0),
    };

    return SET_STATS_TABS.filter((tab) => tabAvailability[tab]);
  }, [armorSummariesByType, weaponSummary, ringSummary]);

  useEffect(() => {
    if (!availableSetStatsTabs.length) {
      if (activeSetStatsTab !== SET_STATS_TABS[0]) {
        setActiveSetStatsTab(SET_STATS_TABS[0]);
      }
      return;
    }

    if (!availableSetStatsTabs.includes(activeSetStatsTab)) {
      setActiveSetStatsTab(availableSetStatsTabs[0]);
    }
  }, [availableSetStatsTabs, activeSetStatsTab]);

  const renderSetStatsItem = (item: ArmorSetStatSummary['items'][number]) => {
    const hasItem = item.id > 0;
    const imageUrl = hasItem ? ItemUtils.getItemImage(item.id) : null;
    const tierColor = hasItem ? ItemUtils.getTierColor(ItemUtils.getItemTier(item.id)) : undefined;
    const statText = item.statBonus
      ? item.statBonus.replace(/\s+/g, ' ').toUpperCase()
      : '—';

    return (
      <Box key={`${item.slot}-${item.id}`} sx={styles.setStatsItemRow}>
        {hasItem && imageUrl ? (
          <Box sx={[styles.itemImageContainer, styles.setStatsItemImageContainer]}>
            <Box
              sx={[styles.itemGlow, styles.setStatsItemGlow, tierColor ? { backgroundColor: tierColor } : {}]}
            />
            <Box
              component="img"
              src={imageUrl}
              alt={item.slot}
              sx={[styles.itemImage, styles.setStatsItemImage]}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Box>
        ) : (
          <Typography sx={styles.setStatsItemSlot}>{item.slot}</Typography>
        )}
        <Typography sx={styles.setStatsItemBonus}>{statText}</Typography>
      </Box>
    );
  };

  const formatStatTotal = (stat: StatDisplayName, value: number) => {
    if (value === 0) {
      return '—';
    }
    const prefix = value > 0 ? `+${value}` : `${value}`;
    return `${prefix} ${STAT_ABBREVIATIONS[stat]}`;
  };

  const activeArmorSummary = isArmorTab(activeSetStatsTab)
    ? armorSummariesByType[activeSetStatsTab] ?? null
    : null;
  const activeGearSummary = isGearTab(activeSetStatsTab)
    ? activeSetStatsTab === 'Weapons'
      ? (weaponSummary ?? null)
      : (ringSummary ?? null)
    : null;

  return (
    <Box sx={styles.container}>
      {/* Top Bar */}
      {marketAvailable && <Box sx={styles.topBar}>
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
          onClick={handleCheckout}
          disabled={(cart.potions === 0 && cart.items.length === 0)}
          sx={styles.cartButton}
        >
          Purchase ({cart.potions + cart.items.length})
        </Button>
      </Box>}

      {!marketAvailable && <Box sx={[styles.topBar, { justifyContent: 'center' }]}>
        <Typography fontWeight={600}>
          Market Opens After Stat Selection
        </Typography>
      </Box>}

      {specialsUnlocked && (
        <Modal
          open={showSetStats}
          onClose={() => setShowSetStats(false)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={styles.setStatsModal}>
            <Box sx={styles.setStatsHeader}>
              <Typography sx={styles.setStatsTitle}>Level 15+ Bonus Stats</Typography>
              <Button onClick={() => setShowSetStats(false)} sx={styles.setStatsCloseButton}>x</Button>
            </Box>
            {setStatsSummaries.length === 0 ? (
              <Typography sx={styles.setStatsEmpty}>No armor stats available.</Typography>
            ) : (
              <>
                <Tabs
                  value={activeSetStatsTab}
                  onChange={(_, value) => setActiveSetStatsTab(value as SetStatsTab)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={styles.setStatsTabs}
                >
                  {SET_STATS_TABS.map((tab) => {
                    const disabled = !availableSetStatsTabs.includes(tab);
                    return (
                      <Tab
                        key={tab}
                        value={tab}
                        label={tab.toUpperCase()}
                        sx={styles.setStatsTab}
                        disabled={disabled}
                      />
                    );
                  })}
                </Tabs>
                <Box sx={styles.setStatsContent}>
                  {isArmorTab(activeSetStatsTab) ? (
                    activeArmorSummary && activeArmorSummary.items.length > 0 ? (
                      <Box sx={styles.armorColumns}>
                        <Box sx={styles.armorColumn}>
                          <Box sx={styles.armorItems}>
                            {activeArmorSummary.items.map(renderSetStatsItem)}
                          </Box>
                          <Box sx={styles.armorTotals}>
                            {STAT_FILTER_OPTIONS.map((stat) => (
                              <Typography key={`${activeSetStatsTab}-${stat}`} sx={styles.armorTotalValue}>
                                {formatStatTotal(stat, activeArmorSummary.totals[stat])}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Typography sx={styles.setStatsEmpty}>No armor stats available.</Typography>
                    )
                  ) : isGearTab(activeSetStatsTab) ? (
                    activeGearSummary && activeGearSummary.items.length > 0 ? (
                      <Box sx={styles.armorColumns}>
                        <Box sx={styles.armorColumn}>
                          <Box sx={styles.armorItems}>
                            {activeGearSummary.items.map(renderSetStatsItem)}
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Typography sx={styles.setStatsEmpty}>
                        {activeSetStatsTab === 'Weapons' ? 'No weapons available.' : 'No rings available.'}
                      </Typography>
                    )
                  ) : (
                    <Typography sx={styles.setStatsEmpty}>No stats available.</Typography>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Modal>
      )}

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
                {marketAvailable && <Slider
                  value={cart.potions}
                  onChange={(_, value) => handleBuyPotion(value as number)}
                  min={0}
                  max={maxPotions}
                  sx={styles.potionSlider}
                />}
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

            {specialsUnlocked && (
              <Box sx={styles.filterGroup}>
                <ToggleButtonGroup
                  value={statFilter}
                  exclusive
                  onChange={handleStatFilter}
                  aria-label="item stat"
                  sx={styles.filterButtons}
                >
                  <ToggleButton
                    value=""
                    onClick={(e) => { e.preventDefault(); setShowSetStats(true); }}
                    aria-label="Show level 15 armor set stats"
                  >
                    <KeyboardDoubleArrowUpIcon sx={{ fontSize: 24, color: '#EDCF33' }} />
                  </ToggleButton>
                  {STAT_FILTER_OPTIONS.map((stat) => (
                    <ToggleButton key={stat} value={stat} aria-label={stat}>
                      <Box sx={styles.statFilterLabel}>{STAT_ABBREVIATIONS[stat]}</Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}
          </Box>
        )}

        {/* Items Grid */}
        <Box sx={styles.itemsGrid}>
          {filteredItems.map((item, index) => {
            const canAfford = remainingGold >= item.price;
            const inCart = cart.items.some(cartItem => cartItem.id === item.id);
            const isOwned = isItemOwned(item.id);
            const shouldGrayOut = (!canAfford && !isOwned && !inCart) || isOwned;
            const isLeftColumn = index % 2 === 0;
            const tooltipPlacement = isLeftColumn ? 'right' : 'left';
            return (
              <Paper
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
                  {/* Combat effectiveness badge - left side */}
                  {getStrongAgainst(item.type) && (
                    <Tooltip
                      placement={tooltipPlacement}
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
                          sx: { bgcolor: 'transparent', border: 'none', p: 0 },
                        },
                      }}
                      title={
                        <Box sx={styles.combatTooltipContainer}>
                          <Typography sx={styles.combatTooltipTitle}>
                            {item.type}
                          </Typography>
                          <Box sx={styles.combatTooltipDivider} />
                          <Box sx={styles.combatTooltipSection}>
                            <Box sx={styles.combatTooltipRow}>
                              <Box component="img" src={typeIcons[getStrongAgainst(item.type) as keyof typeof typeIcons]} sx={styles.combatTooltipIcon} />
                              <Typography sx={styles.combatTooltipStrong}>
                                Strong vs {getStrongAgainst(item.type)} ({isWeaponType(item.type) ? '150% dmg dealt' : '50% dmg received'})
                              </Typography>
                            </Box>
                            <Box sx={styles.combatTooltipRow}>
                              <Box component="img" src={typeIcons[getFairAgainst(item.type) as keyof typeof typeIcons]} sx={styles.combatTooltipIcon} />
                              <Typography sx={styles.combatTooltipFair}>
                                Neutral vs {getFairAgainst(item.type)} ({isWeaponType(item.type) ? '100% dmg dealt' : '100% dmg received'})
                              </Typography>
                            </Box>
                            <Box sx={styles.combatTooltipRow}>
                              <Box component="img" src={typeIcons[getWeakAgainst(item.type) as keyof typeof typeIcons]} sx={styles.combatTooltipIcon} />
                              <Typography sx={styles.combatTooltipWeak}>
                                Weak vs {getWeakAgainst(item.type)} ({isWeaponType(item.type) ? '50% dmg dealt' : '150% dmg received'})
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      }
                    >
                      <Box sx={styles.itemCombatBadge}>
                        <Box sx={styles.itemStrongIndicator}>
                          <Box component="img" src={typeIcons[getStrongAgainst(item.type) as keyof typeof typeIcons]} alt="strong" sx={styles.itemCombatIcon} />
                        </Box>
                        <Box sx={styles.itemFairIndicator}>
                          <Box component="img" src={typeIcons[getFairAgainst(item.type) as keyof typeof typeIcons]} alt="fair" sx={styles.itemCombatIcon} />
                        </Box>
                        <Box sx={styles.itemWeakIndicator}>
                          <Box component="img" src={typeIcons[getWeakAgainst(item.type) as keyof typeof typeIcons]} alt="weak" sx={styles.itemCombatIcon} />
                        </Box>
                      </Box>
                    </Tooltip>
                  )}
                  {/* Jewelry tooltip - top left */}
                  {(item.type === 'Ring' || item.type === 'Necklace') && (
                    <Box sx={styles.itemJewelryBadge}>
                      <JewelryTooltip itemId={item.id} placement={tooltipPlacement} />
                    </Box>
                  )}
                  {/* Tier badge - top right */}
                  <Box sx={styles.itemTierBadge} style={{ backgroundColor: ItemUtils.getTierColor(item.tier) }}>
                    <Typography sx={styles.itemTierText}>T{item.tier}</Typography>
                  </Box>
                  {/* Slot badge - bottom right */}
                  <Box sx={styles.itemSlotBadge}>
                    <Box
                      component="img"
                      src={slotIcons[item.slot as keyof typeof slotIcons]}
                      alt={item.slot}
                      sx={styles.itemSlotIcon}
                    />
                  </Box>
                </Box>

                <Box sx={styles.itemInfo}>
                  <Box sx={styles.itemHeader}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Typography sx={styles.itemName}>{item.name}</Typography>
                      {item.type !== 'Ring' && item.type !== 'Necklace' && (
                        <JewelryTooltip itemId={item.id} placement={tooltipPlacement} />
                      )}
                    </Box>
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

                  {item.futureStatBonus && (
                    <Box sx={styles.itemBonusRow}>
                      <Typography sx={styles.itemBonusValue}>
                        {item.futureStatBonus}
                      </Typography>
                    </Box>
                  )}

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
                      {marketAvailable && <Button
                        variant="contained"
                        onClick={() => cart.items.some(cartItem => cartItem.id === item.id) ? handleRemoveItem(item) : handleBuyItem(item)}
                        disabled={!cart.items.some(cartItem => cartItem.id === item.id) && (remainingGold < item.price || isItemOwned(item.id) || inventoryFull)}
                        sx={{
                          ...styles.buyButton,
                          ...(cart.items.some(cartItem => cartItem.id === item.id) && {
                            background: 'rgba(128, 255, 0, 0.2)',
                            color: 'rgba(128, 255, 0, 0.8)',
                          })
                        }}
                        size="small"
                      >
                        {cart.items.some(cartItem => cartItem.id === item.id) ? 'Undo' : isItemOwned(item.id) ? 'Owned' : inventoryFull ? 'Bag Full' : 'Buy'}
                      </Button>}
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
    width: '110px',
    '&:disabled': {
      background: 'rgba(128, 255, 0, 0.1)',
      color: 'rgba(128, 255, 0, 0.5)',
    },
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
  itemBonusRow: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(128, 255, 0, 0.05)',
    border: '1px solid rgba(128, 255, 0, 0.08)',
    borderRadius: '4px',
    padding: '4px',
    gap: '2px',
  },
  itemBonusValue: {
    color: '#80FF00',
    fontSize: '0.7rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  statFilterLabel: {
    fontFamily: 'VT323, monospace',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    color: '#EDCF33',
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
      color: 'rgba(128, 255, 0, 1)',
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
    flexDirection: 'row',
    gap: '8px',
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
      padding: '5px',
      minWidth: '32px',
      '&.Mui-selected': {
        color: '#111111',
        backgroundColor: 'rgba(128, 255, 0, 0.3)',
      },
    },
  },
  statFilterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    width: '100%',
  },
  statFilterButtons: {
    flex: 1,
  },
  filterToggleButton: {
    width: 44,
    minWidth: 44,
    alignSelf: 'stretch',
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
  setStatsButton: {
    minWidth: '36px',
    height: '36px',
    borderColor: 'rgba(128, 255, 0, 0.4)',
    color: '#80FF00',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      borderColor: 'rgba(128, 255, 0, 0.6)',
      background: 'rgba(128, 255, 0, 0.1)',
    },
  },
  setStatsModal: {
    background: 'rgba(17, 17, 17, 0.98)',
    borderRadius: '10px',
    padding: '18px',
    width: 'min(82vw, 380px)',
    maxHeight: '80dvh',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  setStatsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setStatsTitle: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '1.2rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  setStatsCloseButton: {
    minWidth: '32px',
    height: '32px',
    padding: 0,
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.9)',
    '&:hover': {
      color: '#80FF00',
    },
  },
  setStatsEmpty: {
    color: 'rgba(128, 255, 0, 0.8)',
    fontFamily: 'VT323, monospace',
    textAlign: 'center',
  },
  setStatsTabs: {
    borderBottom: '1px solid rgba(128, 255, 0, 0.2)',
    minHeight: '40px',
    '& .MuiTabs-flexContainer': {
      justifyContent: 'flex-start',
      marginLeft: 0,
    },
    '& .MuiTabs-indicator': {
      backgroundColor: '#80FF00',
      height: '3px',
    },
    '& .MuiTabs-scroller': {
      marginLeft: '0 !important',
    },
    '& .MuiTabs-scrollButtons': {
      color: '#FFFFFF',
    },
    '& .MuiTabs-scrollButtons.Mui-disabled': {
      opacity: 0.35,
      color: '#FFFFFF',
    },
  },
  setStatsTab: {
    minHeight: '40px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'VT323, monospace',
    letterSpacing: '0.08em',
    fontSize: '0.95rem',
    padding: '0 12px',
    '&.Mui-selected': {
      color: '#80FF00',
    },
    '&.Mui-disabled': {
      color: 'rgba(255, 255, 255, 0.3)',
    },
  },
  setStatsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
    minHeight: '320px',
  },
  armorColumns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  armorColumn: {
    border: '1px solid rgba(128, 255, 0, 0.25)',
    borderRadius: '6px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  armorItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  armorTotals: {
    borderTop: '1px solid rgba(128, 255, 0, 0.2)',
    paddingTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: 'auto',
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  armorTotalValue: {
    color: '#EDCF33',
    fontFamily: 'VT323, monospace',
    fontSize: '0.95rem',
    fontWeight: 'bold',
  },
  setStatsPanel: {
    border: '1px solid rgba(128, 255, 0, 0.25)',
    borderRadius: '6px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  setStatsSectionTitle: {
    color: '#EDCF33',
    fontFamily: 'VT323, monospace',
    fontSize: '1rem',
    letterSpacing: '0.08em',
  },
  setStatsItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  setStatsItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  setStatsItemImageContainer: {
    width: '40px',
    height: '40px',
    minWidth: '40px',
  },
  setStatsItemGlow: {
    opacity: 0.25,
  },
  setStatsItemImage: {
    padding: '3px',
  },
  setStatsItemSlot: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'VT323, monospace',
    fontSize: '0.95rem',
    flex: 1,
  },
  setStatsItemBonus: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: '68px',
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  setStatsTotals: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    borderTop: '1px solid rgba(128, 255, 0, 0.2)',
    paddingTop: '8px',
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
  setStatsTotalValue: {
    color: '#EDCF33',
    fontFamily: 'VT323, monospace',
    fontSize: '0.95rem',
    fontWeight: 'bold',
  },
  itemUnaffordable: {
    opacity: 0.5,
  },
  itemStatBonus: {
    color: '#d7c529',
    fontSize: '0.75rem',
    fontFamily: 'VT323, monospace',
    fontWeight: '600',
    marginTop: '2px',
    background: 'rgba(215, 197, 41, 0.1)',
    border: '1px solid rgba(215, 197, 41, 0.3)',
    borderRadius: '4px',
    padding: '2px 6px',
  },
  // Combat badge styles
  itemCombatBadge: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    bottom: '4px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '2px',
    zIndex: 3,
  },
  itemStrongIndicator: {
    padding: '2px',
    borderRadius: '3px',
    background: 'rgba(34, 90, 34, 0.85)',
    border: '1px solid rgba(80, 180, 80, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemFairIndicator: {
    padding: '2px',
    borderRadius: '3px',
    background: 'rgba(90, 80, 34, 0.85)',
    border: '1px solid rgba(180, 160, 80, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemWeakIndicator: {
    padding: '2px',
    borderRadius: '3px',
    background: 'rgba(90, 34, 34, 0.85)',
    border: '1px solid rgba(180, 80, 80, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCombatIcon: {
    width: 14,
    height: 14,
    filter: 'brightness(0) invert(1)',
    opacity: 0.95,
  },
  itemJewelryBadge: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    zIndex: 3,
  },
  itemSlotBadge: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    padding: '3px',
    borderRadius: '3px',
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  itemSlotIcon: {
    width: 14,
    height: 14,
    filter: 'invert(0.9) sepia(0.3) saturate(0.5)',
    opacity: 0.9,
  },
  // Combat tooltip styles
  combatTooltipContainer: {
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    padding: '10px',
    minWidth: '180px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  combatTooltipTitle: {
    color: '#d0c98d',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  combatTooltipDivider: {
    height: '1px',
    backgroundColor: '#d7c529',
    opacity: 0.2,
    margin: '8px 0',
  },
  combatTooltipSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  combatTooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  combatTooltipIcon: {
    width: 18,
    height: 18,
    filter: 'brightness(0) invert(0.85)',
  },
  combatTooltipStrong: {
    color: 'rgba(80, 180, 80, 0.9)',
    fontSize: '0.7rem',
  },
  combatTooltipFair: {
    color: 'rgba(180, 160, 80, 0.9)',
    fontSize: '0.7rem',
  },
  combatTooltipWeak: {
    color: 'rgba(180, 80, 80, 0.9)',
    fontSize: '0.7rem',
  },
};
