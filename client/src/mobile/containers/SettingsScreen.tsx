import { useStarknetApi } from '@/api/starknet';
import { useSound } from '@/contexts/Sound';
import { useController } from '@/contexts/controller';
import { useGameStore } from '@/stores/gameStore';
import { ellipseAddress } from '@/utils/utils';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MusicOffIcon from '@mui/icons-material/MusicOff';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Box, Button, Slider, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { gameId, setAdventurer } = useGameStore();
  const { playing, setPlaying, volume, setVolume } = useSound();
  const { account, address, playerName, login, openProfile } = useController();
  const { getAdventurer } = useStarknetApi();

  const handleExitGame = () => {
    navigate('/survivor');
  };

  const handleUnstuck = async () => {
    const adventurer = await getAdventurer(gameId!);

    if (adventurer) {
      setAdventurer(adventurer);
    }
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setVolume((newValue as number) / 100);
  };

  return (
    <Box sx={styles.container}>
      <Typography variant="h2" sx={styles.title}>
        Settings
      </Typography>

      {/* Profile Section */}
      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography sx={styles.sectionTitle}>Profile</Typography>
        </Box>
        <Box sx={styles.settingItem}>
          {account && address ? (
            <Button
              onClick={openProfile}
              startIcon={<SportsEsportsIcon />}
              sx={styles.profileButton}
              fullWidth
            >
              {playerName ? playerName : ellipseAddress(address, 4, 4)}
            </Button>
          ) : (
            <Button
              onClick={login}
              startIcon={<SportsEsportsIcon />}
              sx={styles.profileButton}
              fullWidth
            >
              Log In
            </Button>
          )}
        </Box>
      </Box>

      {/* Sound Section */}
      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography sx={styles.sectionTitle}>Sound</Typography>
        </Box>
        <Box sx={styles.settingItem}>
          <Box sx={styles.soundControl}>
            <Box
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                '&:hover': { opacity: 0.8 }
              }}
              onClick={() => setPlaying(!playing)}
            >
              {playing ?
                <MusicNoteIcon fontSize='medium' htmlColor='#80FF00' /> :
                <MusicOffIcon fontSize='medium' htmlColor='#80FF00' />
              }
            </Box>
            <Slider
              value={Math.round(volume * 100)}
              onChange={handleVolumeChange}
              aria-labelledby="volume-slider"
              valueLabelDisplay="auto"
              step={1}
              min={0}
              max={100}
              sx={styles.volumeSlider}
            />
          </Box>
        </Box>
      </Box>

      {/* Support Section */}
      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography sx={styles.sectionTitle}>Game</Typography>
        </Box>
        <Box sx={styles.settingItem}>
          <Button
            variant="contained"
            onClick={handleUnstuck}
            sx={styles.unstuckButton}
            fullWidth
          >
            UNSTUCK ADVENTURER
          </Button>
        </Box>

        <Box sx={styles.settingItem}>
          <Button
            variant="contained"
            onClick={handleExitGame}
            sx={styles.exitButton}
            fullWidth
          >
            Exit Game
          </Button>
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
    padding: '10px',
    boxSizing: 'border-box',
  },
  title: {
    textAlign: 'center',
    marginBottom: 2,
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
  },
  settingsContainer: {
    padding: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    borderRadius: '6px',
    maxWidth: '500px',
    width: '100%',
    boxSizing: 'border-box',
  },
  settingItem: {
    width: '100%',
    marginBottom: 1,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  soundControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  volumeSlider: {
    flex: 1,
    color: '#80FF00',
    '& .MuiSlider-thumb': {
      backgroundColor: '#80FF00',
    },
    '& .MuiSlider-track': {
      backgroundColor: '#80FF00',
    },
    '& .MuiSlider-rail': {
      backgroundColor: 'rgba(128, 255, 0, 0.2)',
    },
  },
  unstuckButton: {
    width: '100%',
    background: 'rgba(128, 255, 0, 0.15)',
    color: '#80FF00',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.25)',
    },
    '&:disabled': {
      background: 'rgba(128, 255, 0, 0.1)',
      color: 'rgba(128, 255, 0, 0.5)',
      border: '1px solid rgba(128, 255, 0, 0.1)',
    },
  },
  exitButton: {
    width: '100%',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    color: '#FF0000',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    '&:hover': {
      backgroundColor: 'rgba(255, 0, 0, 0.3)',
    },
  },
  section: {
    padding: 1.5,
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    marginBottom: '12px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
    height: '24px',
  },
  sectionTitle: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '1.2rem',
    lineHeight: '24px',
  },
  profileButton: {
    background: 'rgba(128, 255, 0, 0.15)',
    color: '#80FF00',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.25)',
    },
  },
}; 