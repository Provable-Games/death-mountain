import { useUIStore } from '@/stores/uiStore';
import { fadeVariant } from "@/utils/animations";
import AddIcon from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
import { Box, Button, CircularProgress, Dialog, Divider, TextField, Typography } from '@mui/material';
import { useAccount } from '@starknet-react/core';
import { motion } from "framer-motion";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, useGameSettings } from '@/dojo/useGameSettings';
import { useDungeon } from '@/dojo/useDungeon';

function CustomizeGameList() {
  const navigate = useNavigate();
  const dungeon = useDungeon();
  const { account } = useAccount();
  const { getRecommendedSettings, getSettingsList } = useGameSettings();
  const {
    isGameSettingsListOpen,
    setGameSettingsListOpen,
    setGameSettingsDialogOpen,
    setGameSettingsEdit,
    setSelectedSettingsId
  } = useUIStore();

  const [selectedSettings, setSelectedSettings] = useState<Settings>();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('recommended');
  const [settingsList, setSettingsList] = useState<Settings[]>([]);
  const [search, setSearch] = useState('');

  async function fetchSettings() {
    if (tab === 'search' && !search) {
      setSettingsList([]);
      return;
    }

    setLoading(true);

    if (tab === 'recommended') {
      const settings = await getRecommendedSettings();
      setSettingsList(settings ?? []);
    } else if (tab === 'my') {
      const settings = await getSettingsList(account?.address ?? null, null);
      setSettingsList(settings ?? []);
    } else {
      const settings = await getSettingsList(null, search ? [parseInt(search)] : null);
      setSettingsList(settings ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (settingsList.length > 0) {
      setSelectedSettings(settingsList[0]);
    }
  }, [settingsList]);

  useEffect(() => {
    if (isGameSettingsListOpen) {
      fetchSettings();
    }
  }, [isGameSettingsListOpen, tab, search]);

  const startNewGame = async () => {
    navigate(`/${dungeon.id}/play?settingsId=${selectedSettings?.settings_id}`)
    setGameSettingsListOpen(false);
  };

  const handleViewSettings = () => {
    if (selectedSettings) {
      setSelectedSettingsId(selectedSettings.settings_id);
      setGameSettingsEdit(false);
      setGameSettingsDialogOpen(true);
    }
  };

  const handleCreateSettings = () => {
    setGameSettingsEdit(true);
    setGameSettingsDialogOpen(true);
  };

  function renderSettingsOverview(settings: Settings) {
    return (
      <Box
        sx={[
          styles.settingsContainer,
          { opacity: selectedSettings?.settings_id === settings.settings_id ? 1 : 0.8 }
        ]}
        border={selectedSettings?.settings_id === settings.settings_id ? '1px solid #80FF00' : '1px solid rgba(255, 255, 255, 0.3)'}
        onClick={() => setSelectedSettings(settings)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography color='primary' variant='h6'>
            {settings.name}
          </Typography>

          <Typography color='secondary' variant='h6'>
            #{settings.settings_id}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Dialog
      open={isGameSettingsListOpen}
      onClose={() => setGameSettingsListOpen(false)}
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
          <Box sx={styles.container}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant='h4' color='primary' textAlign='center'>
                Game Settings
              </Typography>

              <Button
                variant='outlined'
                color='secondary'
                size='small'
                onClick={handleCreateSettings}
                sx={{ width: '140px' }}
                startIcon={<AddIcon />}
              >
                Create Settings
              </Button>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            <Box sx={styles.settingsListContainer}>
              <Box sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 1
              }}>
                <Button
                  variant='outlined'
                  size='small'
                  fullWidth
                  sx={{
                    opacity: tab === 'recommended' ? 1 : 0.6,
                    flex: 1
                  }}
                  color={'primary'}
                  onClick={() => setTab('recommended')}
                >
                  Recommended
                </Button>

                <Button
                  variant='outlined'
                  size='small'
                  fullWidth
                  sx={{
                    opacity: tab === 'my' ? 1 : 0.6,
                    flex: 1
                  }}
                  color={'primary'}
                  onClick={() => setTab('my')}
                >
                  My Settings
                </Button>

                <Button
                  variant='outlined'
                  size='small'
                  fullWidth
                  sx={{
                    opacity: tab === 'search' ? 1 : 0.6,
                    flex: 1
                  }}
                  color={'primary'}
                  onClick={() => setTab('search')}
                >
                  Search
                </Button>
              </Box>

              <Box sx={{
                width: '100%',
                height: '340px',
                overflowY: 'auto',
                pr: 0.5
              }}>
                {tab === 'search' && (
                  <Box mb={2}>
                    <TextField
                      type='text'
                      placeholder="Enter settings id"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      fullWidth
                      size='medium'
                      sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    />
                  </Box>
                )}

                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                )}

                {!loading && React.Children.toArray(
                  settingsList.map(settings => renderSettingsOverview(settings))
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant='outlined'
                color='primary'
                size='large'
                onClick={handleViewSettings}
                disabled={!selectedSettings}
                sx={{ width: '160px' }}
              >
                View Settings
              </Button>

              <LoadingButton
                variant='contained'
                color='primary'
                size='large'
                disabled={!selectedSettings}
                onClick={startNewGame}
                sx={{ width: '160px' }}
              >
                Play
              </LoadingButton>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Dialog>
  );
}

const styles = {
  dialogContainer: {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    p: 2,
    width: '400px',
    maxWidth: '100%',
    overflow: 'hidden'
  },
  container: {
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    height: '100%'
  },
  logoContainer: {
    width: '100%',
    mb: 2
  },
  settingsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '5px',
    px: 2,
    py: 1.5,
    cursor: 'pointer',
    boxSizing: 'border-box',
    mb: 1,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  },
  settingsListContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    flex: 1,
    minHeight: 0
  }
};

export default CustomizeGameList;
