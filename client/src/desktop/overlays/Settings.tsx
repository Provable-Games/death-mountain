import { useStarknetApi } from '@/api/starknet';
import { useSound } from '@/contexts/Sound';
import discordIcon from '@/desktop/assets/images/discord.png';
import { useGameStore } from '@/stores/gameStore';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import XIcon from '@mui/icons-material/X';
import { Box, Button, Divider, IconButton, Slider, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';

export default function SettingsOverlay() {
  const { gameId, showSettings, setShowSettings, setAdventurer } = useGameStore();
  const { volume, setVolume, muted, setMuted } = useSound();
  const { getAdventurer } = useStarknetApi();
  const navigate = useNavigate();
  const [unstuckLoading, setUnstuckLoading] = useState(false);

  const handleExitGame = () => {
    navigate('/');
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setVolume((newValue as number) / 100);
  };

  const handleUnstuck = async () => {
    setUnstuckLoading(true);

    try {
      const adventurer = await getAdventurer(gameId!);
      if (adventurer) {
        setAdventurer(adventurer);
      }
    } catch (error) {
      console.error('Failed to unstuck adventurer:', error);
    } finally {
      setUnstuckLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ position: 'absolute', bottom: 32, right: 120, zIndex: 100 }}>
        <Box sx={styles.buttonWrapper} onClick={() => setShowSettings(!showSettings)}>
          <SettingsIcon sx={{ fontSize: 26, color: '#d0c98d' }} />
        </Box>
      </Box>

      {showSettings && (
        <>
          {/* Settings popup */}
          <Box sx={styles.popup}>
            <Box sx={styles.header}>
              <Typography variant="h6" sx={{ color: '#d0c98d', fontFamily: 'Cinzel, Georgia, serif' }}>
                Settings
              </Typography>
              <IconButton
                onClick={() => setShowSettings(false)}
                sx={{ color: '#d0c98d', padding: '4px' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mt: '2px', mb: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            <Box sx={styles.content}>
              {/* Profile Section */}
              <Box sx={styles.section}>
                <Typography sx={styles.sectionTitle}>Profile</Typography>
                <WalletConnect />
              </Box>

              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Sound Control */}
              <Box sx={styles.section}>
                <Typography sx={styles.sectionTitle}>Sound</Typography>
                <Box sx={styles.soundControl}>
                  <IconButton
                    size="small"
                    onClick={() => setMuted(!muted)}
                    sx={{ color: !muted ? '#d0c98d' : '#666', padding: '4px' }}
                  >
                    {muted ? (
                      <VolumeOffIcon sx={{ fontSize: 22 }} />
                    ) : (
                      <VolumeUpIcon sx={{ fontSize: 22 }} />
                    )}
                  </IconButton>
                  <Slider
                    value={Math.round(volume * 100)}
                    onChange={handleVolumeChange}
                    disabled={muted}
                    aria-labelledby="volume-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    min={0}
                    max={100}
                    sx={styles.volumeSlider}
                  />
                  <Typography sx={{ color: '#d0c98d', fontSize: '12px', minWidth: '35px', textAlign: 'right' }}>
                    {Math.round(volume * 100)}%
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Game Section */}
              <Box sx={styles.section}>
                <Typography sx={styles.sectionTitle}>Game</Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleUnstuck}
                  disabled={unstuckLoading}
                  sx={styles.unstuckButton}
                >
                  Unstuck Adventurer
                </Button>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleExitGame}
                  sx={styles.exitGameButton}
                >
                  Exit Game
                </Button>
              </Box>

              {/* Social Links */}
              <Box sx={styles.section}>
                <Box sx={styles.socialButtons}>
                  <IconButton
                    size="small"
                    sx={styles.socialButton}
                    onClick={() => window.open('https://docs.lootsurvivor.io/', '_blank')}
                  >
                    <MenuBookIcon sx={{ fontSize: 24, color: '#d0c98d' }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    sx={styles.socialButton}
                    onClick={() => window.open('https://x.com/LootSurvivor', '_blank')}
                  >
                    <XIcon sx={{ fontSize: 24 }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    sx={styles.socialButton}
                    onClick={() => window.open('https://discord.gg/DQa4z9jXnY', '_blank')}
                  >
                    <img src={discordIcon} alt="Discord" style={{ width: 24, height: 24 }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    sx={styles.socialButton}
                    onClick={() => window.open('https://github.com/provable-games/death-mountain', '_blank')}
                  >
                    <GitHubIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Box>
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
    width: 42,
    height: 42,
    border: '2px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(24, 40, 24, 1)',
    boxShadow: '0 0 8px #000a',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      background: 'rgba(34, 50, 34, 0.85)',
    },
  },
  popup: {
    position: 'absolute',
    bottom: '95px',
    right: '5px',
    width: '300px',
    background: 'rgba(24, 40, 24, 1)',
    border: '2px solid #083e22',
    borderRadius: '10px',
    boxShadow: '0 8px 32px 8px #000b',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    padding: 1.5,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0.75,
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#d0c98d',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  settingItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    background: 'rgba(24, 40, 24, 0.3)',
    border: '1px solid rgba(8, 62, 34, 0.5)',
    borderRadius: '6px',
  },
  soundControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    padding: '6px 10px',
    background: 'rgba(24, 40, 24, 0.3)',
    border: '1px solid rgba(8, 62, 34, 0.5)',
    borderRadius: '6px',
  },
  volumeSlider: {
    flex: 1,
    color: '#d0c98d',
    height: 4,
    '& .MuiSlider-thumb': {
      backgroundColor: '#d0c98d',
      width: 14,
      height: 14,
      '&:hover': {
        boxShadow: '0 0 0 6px rgba(208, 201, 141, 0.16)',
      },
    },
    '& .MuiSlider-track': {
      backgroundColor: '#d0c98d',
      border: 'none',
    },
    '& .MuiSlider-rail': {
      backgroundColor: 'rgba(208, 201, 141, 0.2)',
    },
    '& .MuiSlider-valueLabel': {
      backgroundColor: '#d0c98d',
      color: '#1a1a1a',
      fontSize: '10px',
      fontWeight: 600,
    },
    '&.Mui-disabled': {
      '& .MuiSlider-track': {
        backgroundColor: '#666',
      },
      '& .MuiSlider-thumb': {
        backgroundColor: '#666',
      },
    },
  },
  profileButton: {
    background: 'transparent',
    border: '2px solid #d0c98d',
    color: '#d0c98d',
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: '0.9rem',
    letterSpacing: '0.5px',
    textTransform: 'none',
    '&:hover': {
      background: 'rgba(208, 201, 141, 0.1)',
      border: '2px solid #d0c98d',
    },
  },
  unstuckButton: {
    background: 'rgba(128, 255, 0, 0.15)',
    border: '2px solid rgba(128, 255, 0, 0.3)',
    color: '#80FF00',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 500,
    fontSize: '0.8rem',
    letterSpacing: '0.5px',
    transition: 'all 0.2s',
    '&:hover': {
      background: 'rgba(128, 255, 0, 0.25)',
      border: '2px solid rgba(128, 255, 0, 0.4)',
    },
    '&:disabled': {
      background: 'rgba(128, 255, 0, 0.1)',
      border: '2px solid rgba(128, 255, 0, 0.2)',
      color: 'rgba(128, 255, 0, 0.5)',
    },
  },
  exitGameButton: {
    background: 'rgba(255, 0, 0, 0.15)',
    border: '2px solid rgba(255, 0, 0, 0.3)',
    color: '#FF6B6B',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 500,
    fontSize: '0.85rem',
    letterSpacing: '0.5px',
    transition: 'all 0.2s',
    '&:hover': {
      background: 'rgba(255, 0, 0, 0.25)',
      border: '2px solid rgba(255, 0, 0, 0.4)',
    },
  },
  socialButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: 2,
  },
  socialButton: {
    color: '#d0c98d',
    opacity: 0.8,
    background: 'rgba(24, 40, 24, 0.3)',
    border: '1px solid rgba(8, 62, 34, 0.5)',
    '&:hover': {
      opacity: 1,
      background: 'rgba(24, 40, 24, 0.5)',
    },
    padding: '8px',
  },
};