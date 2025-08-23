
import { useSound } from '@/contexts/Sound';
import { useUIStore } from '@/stores/uiStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, Button, IconButton, Slider, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const { setUseMobileClient } = useUIStore();
  const { volume, setVolume, muted, setMuted } = useSound();

  const handleSwitchToMobile = () => {
    setUseMobileClient(true);
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setVolume((newValue as number) / 100);
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%' }}
    >
      <Box sx={styles.settingsHeader}>
        <Button
          variant="text"
          onClick={onBack}
          sx={styles.backButton}
          startIcon={<ArrowBackIcon />}
        >
          Settings
        </Button>
      </Box>

      <Box sx={styles.settingsContainer}>
        {/* Sound Settings */}
        <Box sx={styles.settingSection}>
          <Typography sx={styles.sectionTitle} color="primary">
            Sound
          </Typography>

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

        {/* Client Settings */}
        <Box sx={styles.settingSection}>
          <Typography sx={styles.sectionTitle} color="primary">
            Client
          </Typography>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<PhoneAndroidIcon sx={styles.icon} />}
            onClick={handleSwitchToMobile}
            sx={styles.mobileButton}
          >
            Switch to Mobile Client
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
}

const styles = {
  settingsHeader: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    mb: 1,
  },
  backButton: {
    minWidth: 'auto',
    px: 1,
  },
  settingsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  settingSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
  },
  settingItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(24, 40, 24, 0.3)',
    border: '1px solid rgba(8, 62, 34, 0.5)',
    borderRadius: '6px',
  },
  settingLabel: {
    display: 'flex',
    alignItems: 'center',
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
  switch: {
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#d0c98d',
      '&:hover': {
        backgroundColor: 'rgba(208, 201, 141, 0.08)',
      },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: '#d0c98d',
    },
  },
  mobileButton: {
    borderColor: '#d0c98d',
    color: '#d0c98d',
    '&:hover': {
      borderColor: '#d0c98d',
      backgroundColor: 'rgba(208, 201, 141, 0.1)',
    },
  },
  icon: {
    mr: 1,
  },
}; 