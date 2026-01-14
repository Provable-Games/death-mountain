import { useSound } from '@/mobile/contexts/Sound';
import { useController } from '@/contexts/controller';
import { useUIStore } from '@/stores/uiStore';
import { ellipseAddress } from '@/utils/utils';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MusicOffIcon from '@mui/icons-material/MusicOff';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Button, Checkbox, FormControlLabel, Slider, Switch, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDungeon } from '@/dojo/useDungeon';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const dungeon = useDungeon();
  const { muted, setMuted, volume, setVolume } = useSound();
  const { account, address, playerName, login, openProfile } = useController();
  const {
    skipFirstBattle,
    setSkipFirstBattle,
    fastBattle,
    setFastBattle,
    advancedMode,
    setAdvancedMode,
  } = useUIStore();

  const handleExitGame = () => {
    navigate(`/${dungeon.id}`);
  };

  const handleCopyGameLink = async () => {
    try {
      const currentUrl = window.location.href;
      const watchUrl = currentUrl.replace('/play', '/watch');
      await navigator.clipboard.writeText(watchUrl);
      // You could add a toast notification here if you have one
    } catch (err) {
      console.error('Failed to copy link:', err);
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
              onClick={() => setMuted(!muted)}
            >
              {!muted ?
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

      {/* Advanced Mode Section */}
      <Box sx={styles.section}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={styles.sectionTitle}>Enable Advanced Mode</Typography>
            <Typography sx={{ fontSize: '12px', color: 'rgba(128, 255, 0, 0.7)' }}>
              Advanced features and simulations
            </Typography>
          </Box>
          <Switch
            checked={advancedMode}
            onChange={(e) => setAdvancedMode(e.target.checked)}
            sx={styles.switch}
          />
        </Box>
      </Box>

      {/* Game Settings Section */}
      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography sx={styles.sectionTitle}>Game Settings</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={skipFirstBattle}
                onChange={(e) => setSkipFirstBattle(e.target.checked)}
                sx={styles.checkbox}
              />
            }
            label="Skip first battle"
            sx={styles.checkboxLabel}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={fastBattle}
                onChange={(e) => setFastBattle(e.target.checked)}
                sx={styles.checkbox}
              />
            }
            label="Skip Combat Delay"
            sx={styles.checkboxLabel}
          />
        </Box>
      </Box>

      {/* Actions Section */}
      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography sx={styles.sectionTitle}>Actions</Typography>
        </Box>

        <Box sx={styles.settingItem}>
          <Button
            variant="contained"
            onClick={handleCopyGameLink}
            startIcon={<ContentCopyIcon />}
            sx={styles.copyButton}
            fullWidth
          >
            Copy Game Link
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
    paddingBottom: '70px',
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
  copyButton: {
    width: '100%',
    backgroundColor: 'rgba(128, 255, 0, 0.15)',
    color: '#80FF00',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.25)',
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
  switch: {
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#80FF00',
      '&:hover': {
        backgroundColor: 'rgba(128, 255, 0, 0.08)',
      },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: '#80FF00',
    },
  },
  checkbox: {
    color: '#80FF00',
    '&.Mui-checked': {
      color: '#80FF00',
    },
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.08)',
    },
  },
  checkboxLabel: {
    color: '#80FF00',
    '& .MuiFormControlLabel-label': {
      fontFamily: 'VT323, monospace',
    },
  },
}; 