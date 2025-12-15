import { MAX_BAG_SIZE } from '@/constants/game';
import { Settings, useGameSettings } from '@/dojo/useGameSettings';
import { useSystemCalls } from '@/dojo/useSystemCalls';
import { useUIStore } from '@/stores/uiStore';
import { Beast, Equipment, GameSettingsData } from '@/types/game';
import { fadeVariant } from "@/utils/animations";
import { getBeastImageById } from '@/utils/beast';
import { calculateLevel } from '@/utils/game';
import { ItemUtils, slotIcons } from '@/utils/loot';
import { getBeastFromSeed, listAllEncounters } from '@/utils/processFutures';
import DiceIcon from '@mui/icons-material/Casino';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PreviewIcon from '@mui/icons-material/Preview';
import { Box, Button, Dialog, Divider, Input, LinearProgress, MenuItem, Select, TextField, Typography } from '@mui/material';
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EncountersDialog from './EncountersDialog';
import ItemList from './ItemList';
import { useDungeon } from '@/dojo/useDungeon';

const DEFAULT_SETTINGS: GameSettingsData = {
  vrf_address: '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  name: '',
  in_battle: false,
  game_seed: 0,
  game_seed_until_xp: 0,
  stats_mode: 'Dodge',
  base_damage_reduction: 50,
  market_size: 25,
  adventurer: {
    health: 100,
    xp: 1,
    gold: 40,
    beast_health: 0,
    stat_upgrades_available: 0,
    stats: {
      strength: 0,
      dexterity: 0,
      vitality: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
      luck: 2
    },
    equipment: {
      weapon: { id: 0, xp: 0 },
      chest: { id: 0, xp: 0 },
      head: { id: 0, xp: 0 },
      waist: { id: 0, xp: 0 },
      foot: { id: 0, xp: 0 },
      hand: { id: 0, xp: 0 },
      neck: { id: 0, xp: 0 },
      ring: { id: 0, xp: 0 }
    },
    item_specials_seed: 0,
    action_count: 0
  },
  bag: []
};

export default function GameSettings() {
  const navigate = useNavigate();
  const dungeon = useDungeon();
  const { createSettings } = useSystemCalls()
  const { getSettingsList } = useGameSettings();
  const { isGameSettingsDialogOpen, setGameSettingsDialogOpen, gameSettingsEdit, setGameSettingsListOpen,
    setGameSettingsEdit, setSelectedSettingsId, selectedSettingsId } = useUIStore();

  const [showError, setShowError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [gameSettings, setGameSettings] = useState<GameSettingsData>(DEFAULT_SETTINGS);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [beast, setBeast] = useState<Beast | null>(null);

  const [isBag, setIsBag] = useState(false);
  const [isItemListOpen, setIsItemListOpen] = useState(false);
  const [isEncountersDialogOpen, setIsEncountersDialogOpen] = useState(false);
  const [futureEncounters, setFutureEncounters] = useState<any[]>([]);

  useEffect(() => {
    if (selectedSettingsId !== null) {
      getSettingsList(null, [selectedSettingsId]).then((settings: Settings[]) => {
        setGameSettings(settings[0] ?? DEFAULT_SETTINGS)
      })
    }
  }, [selectedSettingsId])

  useEffect(() => {
    if (gameSettings.in_battle && gameSettings.game_seed !== 0 && gameSettings.adventurer.xp !== 0) {
      setBeast(getBeastFromSeed(gameSettings.adventurer.xp, gameSettings.game_seed));
    } else {
      setBeast(null);
    }
  }, [gameSettings.in_battle, gameSettings.adventurer.xp, gameSettings.game_seed]);

  const handlePlay = () => {
    navigate(`/${dungeon.id}/play?settingsId=${selectedSettingsId}`)
    setGameSettingsDialogOpen(false)
    setGameSettingsListOpen(false)
    setSelectedSettingsId(null)
  }

  const handleSave = async () => {
    if (!gameSettings.name || gameSettings.name.length > 31) {
      setShowError(true)
      return
    }

    setCreating(true)

    await createSettings(gameSettings)

    setGameSettingsDialogOpen(false)
    setCreating(false)
  };

  const editBag = () => {
    setIsItemListOpen(true);
    setIsBag(true);
  }

  const handleSlotClick = (slot: string) => {
    if (!gameSettingsEdit) return;
    setSelectedSlot(slot);
    setIsItemListOpen(true);
  };

  const handleItemSelect = (itemId: number) => {
    if (!selectedSlot) return;

    setGameSettings(prev => ({
      ...prev,
      adventurer: {
        ...prev.adventurer,
        equipment: {
          ...prev.adventurer.equipment,
          [selectedSlot.toLowerCase()]: { id: itemId, xp: 0 }
        }
      }
    }));

    setIsItemListOpen(false);
    setSelectedSlot(null);
  };

  const setEquippedItemXp = (slot: string, xp: number) => {
    xp = Math.max(0, Math.min(400, xp))

    setGameSettings(prev => ({
      ...prev,
      adventurer: {
        ...prev.adventurer,
        equipment: {
          ...prev.adventurer.equipment,
          [slot.toLowerCase()]: { id: prev.adventurer.equipment[slot.toLowerCase() as keyof Equipment].id, xp }
        }
      }
    }));
  }

  const setBagItemXp = (itemId: number, xp: number) => {
    xp = Math.max(0, Math.min(400, xp))

    setGameSettings(prev => ({
      ...prev,
      bag: prev.bag.map(item => item.id === itemId ? { ...item, xp } : { ...item })
    }));
  }

  const updateBag = (itemIds: number[]) => {
    setGameSettings(prev => ({
      ...prev,
      bag: itemIds.map(id => ({ id, xp: 0 }))
    }));
  };

  const handleViewEncounters = () => {
    if (gameSettings.game_seed !== 0) {
      const encounters = listAllEncounters(
        gameSettings.adventurer.xp,
        gameSettings.game_seed,
        calculateLevel(gameSettings.adventurer.xp),
        gameSettings.in_battle
      );
      setFutureEncounters(encounters);
      setIsEncountersDialogOpen(true);
    }
  };

  const renderSettingItem = (label: string, field: string, type: string, range?: [number, number]) => {
    const getValue = (path: string) => {
      const parts = path.split('.');
      let value: any = gameSettings;
      for (const part of parts) {
        value = value[part];
      }
      return value;
    };

    const setValue = (path: string, value: any) => {
      const parts = path.split('.');
      setGameSettings(prev => {
        const newSettings = { ...prev };
        let current: any = newSettings;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newSettings;
      });
    };

    if (type === 'boolean') {
      return (
        <Box sx={styles.settingContainer}>
          <Typography color='primary'>
            {label}
          </Typography>

          <Box
            sx={styles.settingValueContainer}
            onClick={() => {
              if (gameSettingsEdit) {
                const newValue = !getValue(field);
                setValue(field, newValue);
              }
            }}
          >
            <Typography color='primary' sx={{ cursor: gameSettingsEdit ? 'pointer' : 'default' }}>
              {getValue(field) ? 'Yes' : 'No'}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (type === 'select') {
      return (
        <Box sx={styles.settingContainer}>
          <Typography color='primary'>
            {label}
          </Typography>

          <Box sx={styles.settingValueContainer}>
            <Select
              value={getValue(field)}
              onChange={(e) => setValue(field, e.target.value)}
              disabled={!gameSettingsEdit}
              size='small'
              sx={{
                color: '#80FF00',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ffffff50',
                },
                '& .MuiSelect-select': {
                  padding: '4px 8px',
                  fontSize: '14px',
                },
                minWidth: '100px',
              }}
            >
              <MenuItem value={'Dodge'}>Dodge</MenuItem>
              <MenuItem value={'Reduction'}>Reduction</MenuItem>
            </Select>
          </Box>
        </Box>
      );
    }

    if (type === 'seed') {
      return (
        <Box sx={styles.settingContainer}>
          <Typography color='primary'>
            {label}
          </Typography>

          {field === 'game_seed' &&
            <Typography color='primary' sx={{ fontSize: '12px' }}>
              {gameSettings.game_seed_until_xp > 0 ? `(Until ${gameSettings.game_seed_until_xp} XP)` : `(No Limit)`}
            </Typography>
          }

          <Box sx={styles.settingValueContainer}>
            {field === 'game_seed' && getValue(field) !== 0 && (
              <Box mr={0.5} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={handleViewEncounters}>
                <PreviewIcon color='primary' fontSize='small' />
              </Box>
            )}

            <Input
              disableUnderline={true}
              sx={{ color: '#80FF00', width: '100px' }}
              inputProps={{
                style: {
                  textAlign: 'center',
                  border: '1px solid #ffffff50',
                  padding: '0',
                  fontSize: '14px'
                }
              }}
              value={getValue(field)}
              disabled={!gameSettingsEdit}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                if (newValue >= 0) {
                  setValue(field, newValue);
                }
              }}
            />

            <Box ml={0.5} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => {
              const newValue = Math.floor(Math.random() * 65534) + 1;
              setValue(field, newValue);
            }}>
              <DiceIcon color='primary' fontSize='small' />
            </Box>
          </Box>
        </Box>
      );
    }

    if (type === 'stats') {
      return (
        <Box sx={styles.statCard}>
          <Typography sx={styles.statLabel}>{label}</Typography>
          <Input
            disableUnderline={true}
            sx={{ color: '#80FF00' }}
            inputProps={{
              style: {
                textAlign: 'center',
                border: '1px solid #ffffff50',
                padding: '0',
                fontSize: '14px'
              }
            }}
            value={getValue(field)}
            disabled={!gameSettingsEdit}
            onChange={(e) => setValue(field, Number(e.target.value))}
            onBlur={() => {
              if (range) {
                const numValue = Number(getValue(field));
                setValue(field, Math.max(range[0], Math.min(range[1], numValue)));
              }
            }}
          />
        </Box>
      );
    }

    return (
      <Box sx={styles.settingContainer}>
        <Typography color='primary'>
          {label}
        </Typography>

        <Box sx={styles.settingValueContainer}>
          {label === 'XP' && (
            <Typography color='primary' sx={{ pr: '4px' }}>
              {`(lvl ${calculateLevel(getValue(field))})`}
            </Typography>
          )}

          <Input
            disableUnderline={true}
            sx={{ color: '#80FF00', width: type === 'seed' ? '150px' : '50px' }}
            inputProps={{
              style: {
                textAlign: 'center',
                border: '1px solid #ffffff50',
                padding: '0',
                fontSize: '14px'
              }
            }}
            value={getValue(field)}
            disabled={!gameSettingsEdit}
            onChange={(e) => setValue(field, Number(e.target.value))}
            onBlur={() => {
              if (range) {
                const numValue = Number(getValue(field));
                setValue(field, Math.max(range[0], Math.min(range[1], numValue)));
              }
            }}
          />

          {type === 'seed' &&
            <Box ml={0.5} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => {
              setValue(field, Math.floor(Math.random() * 65534) + 1)
            }}>
              <DiceIcon color='primary' fontSize='small' />
            </Box>
          }
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={isGameSettingsDialogOpen}
      onClose={() => setGameSettingsDialogOpen(false)}
      maxWidth='lg'
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
          <Box sx={styles.headerContainer}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {gameSettingsEdit ? (
                <TextField
                  value={gameSettings.name}
                  onChange={(e) => setGameSettings({ ...gameSettings, name: e.target.value })}
                  variant="outlined"
                  placeholder='Settings Name'
                  size='small'
                  sx={{ width: '200px' }}
                  error={showError}
                />
              ) : (
                <Typography
                  variant='h4'
                  color='primary'
                >
                  {gameSettings.name || 'Settings Name'}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!gameSettingsEdit && (
                <>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='small'
                    startIcon={<PlayArrowIcon color='primary' />}
                    onClick={handlePlay}
                    sx={{ height: '24px' }}
                  >
                    Play
                  </Button>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='small'
                    startIcon={<EditIcon color='primary' />}
                    onClick={() => setGameSettingsEdit(true)}
                    sx={{ height: '24px' }}
                  >
                    Edit
                  </Button>
                </>
              )}
              <Box onClick={() => setGameSettingsDialogOpen(false)} display='flex' alignItems='center'>
                <CloseIcon htmlColor='#FFF' sx={{ fontSize: '24px', cursor: 'pointer' }} />
              </Box>
            </Box>
          </Box>

          <Box sx={styles.contentContainer}>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

            <Box sx={styles.settingsGrid}>
              <Typography variant='h6' color='primary'>Adventurer</Typography>

              <Box sx={styles.settingsColumn}>
                {renderSettingItem('Health', 'adventurer.health', 'number', [1, 1024])}
                {renderSettingItem('XP', 'adventurer.xp', 'number', [1, 30000])}
                {renderSettingItem('Gold', 'adventurer.gold', 'number', [0, 512])}
                {renderSettingItem('Stat Upgrades', 'adventurer.stat_upgrades_available', 'number', [0, 16])}
              </Box>

              <Box sx={{ width: '100%', mt: 1 }}>
                {renderSettingItem('Item Seed', 'adventurer.item_specials_seed', 'seed')}
              </Box>
            </Box>

            <Box sx={styles.statsGrid}>
              <Typography variant='h6' color='primary' sx={{ gridColumn: '1 / -1' }}>Stats</Typography>
              {renderSettingItem('STR', 'adventurer.stats.strength', 'stats', [0, 31])}
              {renderSettingItem('DEX', 'adventurer.stats.dexterity', 'stats', [0, 31])}
              {renderSettingItem('VIT', 'adventurer.stats.vitality', 'stats', [0, 31])}
              {renderSettingItem('INT', 'adventurer.stats.intelligence', 'stats', [0, 31])}
              {renderSettingItem('WIS', 'adventurer.stats.wisdom', 'stats', [0, 31])}
              {renderSettingItem('CHA', 'adventurer.stats.charisma', 'stats', [0, 31])}
            </Box>

            <Box>
              <Box sx={styles.sectionHeader}>
                <Typography variant="h6">
                  Equipment
                </Typography>
              </Box>

              <Box sx={styles.equippedItemsContainer} mt={0.5}>
                <Box sx={styles.equippedItemsGrid}>
                  {Object.entries(slotIcons).map(([slot, icon]) => {
                    const equippedItem = gameSettings.adventurer.equipment[slot.toLowerCase() as keyof Equipment];
                    return (
                      <Box key={slot} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box
                          sx={{
                            ...styles.equippedItemSlot,
                            cursor: gameSettingsEdit ? 'pointer' : 'default',
                            '&:hover': gameSettingsEdit ? {
                              background: 'rgba(128, 255, 0, 0.1)',
                            } : {}
                          }}
                          onClick={() => handleSlotClick(slot)}
                        >
                          {equippedItem && equippedItem.id !== 0 ? (
                            <>
                              {ItemUtils.getMetadata(equippedItem.id) && (
                                <Box sx={styles.equippedItemImageContainer}>
                                  <Typography sx={styles.itemLevelText}>
                                    {calculateLevel(equippedItem.xp)}
                                  </Typography>

                                  <Box sx={styles.itemImageContainer}>
                                    <img
                                      src={ItemUtils.getMetadata(equippedItem.id).imageUrl}
                                      alt={ItemUtils.getMetadata(equippedItem.id).name}
                                      style={{
                                        height: '100%',
                                        width: '100%',
                                        objectFit: 'contain' as const,
                                      }}
                                    />
                                  </Box>

                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Typography sx={[styles.itemTypeText]} color={ItemUtils.getTierColor(ItemUtils.getItemTier(equippedItem.id))}>
                                      {ItemUtils.getItemType(equippedItem.id)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            </>
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

                        {equippedItem.id !== 0 && <Box sx={styles.itemLevelContainer}>
                          <Input
                            disableUnderline={true}
                            sx={{ color: '#80FF00' }}
                            inputProps={{
                              style: {
                                textAlign: 'center',
                                border: '1px solid #ffffff50',
                                padding: '0',
                                fontSize: '14px',
                              }
                            }}
                            value={equippedItem.xp}
                            onChange={(e) => setEquippedItemXp(slot, Number(e.target.value))}
                            disabled={!gameSettingsEdit}
                          />
                        </Box>}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', my: '4px' }} />

            <Box>
              <Box sx={styles.sectionHeader}>
                <Typography variant="h6">
                  Bag ({gameSettings.bag.length}/{MAX_BAG_SIZE})
                </Typography>

                {gameSettingsEdit && (
                  <Button variant='outlined' color='primary' size='small' startIcon={<EditIcon color='primary' fontSize='small' />}
                    onClick={editBag}>
                    Edit
                  </Button>
                )}
              </Box>

              {gameSettings.bag.length > 0 && <Box sx={styles.equippedItemsContainer} mt={1}>
                <Box sx={styles.equippedItemsGrid}>
                  {gameSettings.bag.length > 0 && gameSettings.bag.map((item) => (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }} key={item.id}>
                      <Box sx={styles.equippedItemSlot}>
                        {ItemUtils.getMetadata(item.id) && (
                          <Box sx={styles.equippedItemImageContainer}>
                            <Typography sx={styles.itemLevelText}>
                              {calculateLevel(item.xp)}
                            </Typography>

                            <Box sx={styles.itemImageContainer}>
                              <img
                                src={ItemUtils.getMetadata(item.id).imageUrl}
                                alt={ItemUtils.getMetadata(item.id).name}
                                style={{
                                  height: '100%',
                                  width: '100%',
                                  objectFit: 'contain' as const,
                                }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <Typography sx={[styles.itemTypeText]} color={ItemUtils.getTierColor(ItemUtils.getItemTier(item.id))}>
                                {ItemUtils.getItemType(item.id)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>

                      <Box sx={styles.itemLevelContainer}>
                        <Input
                          disableUnderline={true}
                          sx={{ color: '#80FF00' }}
                          inputProps={{
                            style: {
                              textAlign: 'center',
                              border: '1px solid #ffffff50',
                              padding: '0',
                              fontSize: '14px',
                            }
                          }}
                          value={item.xp}
                          onChange={(e) => setBagItemXp(item.id, Number(e.target.value))}
                          disabled={!gameSettingsEdit}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>}

              {gameSettings.bag.length === 0 && (
                <Typography color='primary' mt={1}>
                  No items in bag
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', my: 1 }} />

          <Box sx={styles.settingsGrid}>
            <Typography variant='h6' color='primary'>Game</Typography>

            <Box sx={{ width: '100%', mt: 1 }}>
              {renderSettingItem('In Battle', 'in_battle', 'boolean')}
            </Box>
            <Box sx={{ width: '100%', mt: 1 }}>
              {renderSettingItem('Game Seed', 'game_seed', 'seed')}
            </Box>
            <Box sx={{ width: '100%', mt: 1 }}>
              {renderSettingItem('Stats Mode', 'stats_mode', 'select')}
            </Box>
            <Box sx={{ width: '100%', mt: 1 }}>
              {renderSettingItem('Base Damage Reduction', 'base_damage_reduction', 'number', [0, 100])}
            </Box>
            <Box sx={{ width: '100%', mt: 1 }}>
              {renderSettingItem('Market Size', 'market_size', 'number', [0, 31])}
            </Box>

            {gameSettings.in_battle && beast !== null ? (
              <Box sx={styles.topSection} mt={1}>
                <Box sx={styles.beastInfo}>
                  <Box sx={styles.beastHeader}>
                    <Typography
                      variant={beast.name.length > 28 ? "h5" : "h4"}
                      sx={styles.beastName}
                    >
                      {beast.name}
                    </Typography>
                    <Box sx={styles.beastType}>
                      <Box sx={styles.statBox}>
                        <Typography sx={styles.statLabel}>Type</Typography>
                        <Typography sx={styles.statValue}>{beast.type}</Typography>
                      </Box>
                      <Box sx={styles.statBox}>
                        <Typography sx={styles.statLabel}>Power</Typography>
                        <Typography sx={styles.statValue}>{(6 - beast.tier) * beast.level}</Typography>
                      </Box>
                      <Box sx={styles.levelBox}>
                        <Typography sx={styles.levelLabel}>Level</Typography>
                        <Typography sx={styles.levelValue}>{beast.level}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={styles.healthContainer} mt={2} mb={1}>
                    <Box sx={styles.healthRow}>
                      <Typography sx={styles.healthLabel}>Health</Typography>
                      <Typography sx={styles.healthValue}>
                        {beast.health}/{beast.health}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={styles.healthBar}
                    />
                  </Box>
                </Box>
                <Box sx={styles.beastImageContainer}>
                  <img
                    src={getBeastImageById(beast.id)}
                    alt={beast.name}
                    style={styles.beastImage}
                  />
                </Box>
              </Box>
            ) : null}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', mt: 2 }} />

          {gameSettingsEdit && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant='outlined'
                color='primary'
                size='large'
                onClick={() => setGameSettingsDialogOpen(false)}
                sx={{ width: '160px' }}
              >
                Cancel
              </Button>

              <Button
                variant='contained'
                color='primary'
                size='large'
                onClick={handleSave}
                loading={creating}
                sx={{ width: '160px' }}
              >
                Create
              </Button>
            </Box>
          )}

          {/* Add ItemList Dialog */}
          <ItemList
            open={isItemListOpen}
            selectedSlot={selectedSlot}
            isBag={isBag}
            bag={gameSettings.bag}
            updateBag={updateBag}
            handleItemSelect={handleItemSelect}
            onClose={() => {
              setIsItemListOpen(false);
              setSelectedSlot(null);
              setIsBag(false);
            }}
          />

          {/* Replace the old encounters dialog with the new component */}
          <EncountersDialog
            open={isEncountersDialogOpen}
            onClose={() => setIsEncountersDialogOpen(false)}
            encounters={futureEncounters}
            gameSeedLimit={gameSettings.game_seed_until_xp}
            setGameSeedLimit={(limit) => setGameSettings(prev => ({ ...prev, game_seed_until_xp: limit }))}
          />

        </motion.div >
      </Box >
    </Dialog >
  );
}

const styles: Record<string, any> = {
  dialogContainer: {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    p: 2,
    pt: 0,
    width: '400px',
    maxWidth: '100%',
    minHeight: '80vh',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  headerContainer: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    background: 'rgba(0, 0, 0, 1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    pt: '12px',
  },
  contentContainer: {
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    position: 'relative',
    minHeight: 'auto'
  },
  settingsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  settingsColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    width: '100%',
  },
  settingContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 1,
    px: 1,
    minHeight: '38px',
    background: 'rgba(128, 255, 0, 0.1)',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    borderRadius: '4px',
  },
  settingValueContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '50px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(128, 255, 0, 0.1)',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    borderRadius: '4px',
    p: '6px',
    gap: '2px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '24px',
  },
  sectionTitle: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '1.2rem',
    lineHeight: '24px',
  },
  equippedItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
  equippedItemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '4px',
  },
  equippedItemSlot: {
    aspectRatio: '1',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative',
  },
  equippedItemSlotIcon: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equippedItemImageContainer: {
    width: '60%',
    height: '60%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    objectFit: 'contain',
  },
  itemImageContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    mt: '-2px',
  },
  itemTierBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: '2px',
    borderRadius: '4px',
  },
  itemLevelBadge: {
    left: 5,
  },
  itemLevelContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.2)',
    width: '100%',
    boxSizing: 'border-box'
  },
  itemLevelText: {
    position: 'absolute',
    top: 0,
    left: '1px',
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
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    pt: '2px',
    lineHeight: 1,
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
  bagItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px',
  },
  bagItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2px',
  },
  bagItemImageContainer: {
    width: '24px',
    height: '24px',
    objectFit: 'contain',
  },
  topSection: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    alignItems: 'flex-start',
    padding: '12px',
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
  healthContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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
    width: '130px',
    height: '130px',
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
};