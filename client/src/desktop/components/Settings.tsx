import { Box, Button, Typography, Switch, FormControlLabel } from '@mui/material';
import { motion } from 'framer-motion';
import { useSound } from '@/contexts/Sound';
import { useUIStore } from '@/stores/uiStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const { playing, setPlaying, volume, setVolume } = useSound();
  const { useMobileClient, setUseMobileClient } = useUIStore();

  const handleSwitchToMobile = () => {
    setUseMobileClient(true);
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
        {/* <Box sx={styles.settingSection}>
          <Typography sx={styles.sectionTitle} color="primary">
            Sound
          </Typography>
          
          <Box sx={styles.settingItem}>
            <Box sx={styles.settingLabel}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {playing ? (
                  <VolumeUpIcon sx={{ fontSize: 20, color: '#d0c98d' }} />
                ) : (
                  <VolumeOffIcon sx={{ fontSize: 20, color: '#d0c98d' }} />
                )}
                <Typography color="primary" sx={{ fontSize: '14px' }}>
                  SFX & Music
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={playing}
              onChange={(e) => setPlaying(e.target.checked)}
              sx={styles.switch}
            />
          </Box>
        </Box> */}

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