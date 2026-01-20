import { useSound } from '@/desktop/contexts/Sound';
import { useUIStore } from '@/stores/uiStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, Button, Checkbox, Divider, FormControlLabel, IconButton, MenuItem, Select, Slider, Switch, Typography } from '@mui/material';
import { NETWORKS } from '@/utils/networkConfig';
import { motion } from 'framer-motion';

interface SettingsProps {
  onBack?: () => void;
  showExitGame?: boolean;
  onExitGame?: () => void;
  showHeader?: boolean;
}

export default function Settings({ onBack, showExitGame = false, onExitGame, showHeader = true }: SettingsProps) {
  const {
    setUseMobileClient,
    skipAllAnimations,
    setSkipAllAnimations,
    skipIntroOutro,
    setSkipIntroOutro,
    fastBattle,
    setFastBattle,
    skipFirstBattle,
    setSkipFirstBattle,
    showUntilBeastToggle,
    setShowUntilBeastToggle,
    advancedMode,
    defaultPaymentToken,
    setDefaultPaymentToken,
  } = useUIStore();

  // Filter payment tokens to exclude special tokens (TICKET, USDC.e Bridged)
  const paymentTokenOptions = NETWORKS.SN_MAIN.paymentTokens.filter(
    (token: any) => token.name !== 'TICKET' && token.name !== 'USDC.e Bridged'
  );
  const { volume, setVolume, muted, setMuted, musicVolume, setMusicVolume, musicMuted, setMusicMuted } = useSound();

  const handleSwitchToMobile = () => {
    setUseMobileClient(true);
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setVolume((newValue as number) / 100);
  };

  const handleMusicVolumeChange = (_: Event, newValue: number | number[]) => {
    setMusicVolume((newValue as number) / 100);
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
      {showHeader && (
        <Box sx={styles.settingsHeader}>
          {onBack ? (
            <Button
              variant="text"
              onClick={onBack}
              sx={styles.backButton}
              startIcon={<ArrowBackIcon />}
            >
              Settings
            </Button>
          ) : (
            <Typography sx={styles.headerTitle}>Settings</Typography>
          )}
        </Box>
      )}

      <Box sx={styles.settingsContainer}>
        {/* Sound Settings */}
        <Box sx={styles.settingSection}>
          <Typography sx={styles.sectionTitle}>Sound</Typography>

          <Box sx={styles.soundControl}>
            <Typography width="45px">Sfx</Typography>

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


          <Box sx={styles.soundControl}>
            <Typography width="45px">Music</Typography>

            <IconButton
              size="small"
              onClick={() => setMusicMuted(!musicMuted)}
              sx={{ color: !musicMuted ? '#d0c98d' : '#666', padding: '4px' }}
            >
              {musicMuted ? (
                <VolumeOffIcon sx={{ fontSize: 22 }} />
              ) : (
                <VolumeUpIcon sx={{ fontSize: 22 }} />
              )}
            </IconButton>
            <Slider
              value={Math.round(musicVolume * 100)}
              onChange={handleMusicVolumeChange}
              disabled={musicMuted}
              aria-labelledby="volume-slider"
              valueLabelDisplay="auto"
              step={1}
              min={0}
              max={100}
              sx={styles.volumeSlider}
            />
            <Typography sx={{ color: '#d0c98d', fontSize: '12px', minWidth: '35px', textAlign: 'right' }}>
              {Math.round(musicVolume * 100)}%
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Advanced Section - Always enabled, toggle disabled */}
        <Box sx={styles.settingSection}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={[styles.sectionTitle]}>Advanced Mode</Typography>
            <Switch
              checked={advancedMode}
              disabled={true}
              sx={styles.switch}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Animations Section */}
        <Box sx={styles.settingSection}>
          <Typography sx={[styles.sectionTitle]}>Animations</Typography>
          <Box sx={styles.animationsControl}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={skipIntroOutro}
                  onChange={(e) => setSkipIntroOutro(e.target.checked)}
                  sx={styles.checkbox}
                />
              }
              label="Skip intro and outro"
              sx={styles.checkboxLabel}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={skipAllAnimations}
                  onChange={(e) => setSkipAllAnimations(e.target.checked)}
                  sx={styles.checkbox}
                />
              }
              label="Skip all animations"
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
              label="Skip combat delay"
              sx={styles.checkboxLabel}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Game Section */}
        <Box sx={styles.settingSection}>
          <Typography sx={[styles.sectionTitle]}>Game</Typography>
          <Box sx={styles.animationsControl}>
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
                  checked={showUntilBeastToggle}
                  onChange={(e) => setShowUntilBeastToggle(e.target.checked)}
                  sx={styles.checkbox}
                />
              }
              label='Show "until beast" toggle'
              sx={styles.checkboxLabel}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Payment Section */}
        <Box sx={styles.settingSection}>
          <Typography sx={styles.sectionTitle}>Payment</Typography>
          <Box sx={styles.paymentControl}>
            <Typography sx={{ fontSize: '14px', color: '#d0c98d' }}>Default Token</Typography>
            <Select
              value={defaultPaymentToken}
              onChange={(e) => setDefaultPaymentToken(e.target.value)}
              size="small"
              sx={styles.tokenSelect}
            >
              {paymentTokenOptions.map((token: any) => (
                <MenuItem key={token.name} value={token.name}>
                  {token.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

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

        {showExitGame && onExitGame && (
          <>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <Box sx={styles.settingSection}>
              <Button
                variant="contained"
                fullWidth
                onClick={onExitGame}
                sx={styles.exitGameButton}
              >
                Exit Game
              </Button>
            </Box>
          </>
        )}
      </Box>
    </motion.div >
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
  headerTitle: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  settingsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
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
    gap: 1,
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
    '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.5,
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
  exitGameButton: {
    background: 'rgba(255, 0, 0, 0.15)',
    border: '2px solid rgba(255, 0, 0, 0.3)',
    color: '#FF6B6B',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 500,
    fontSize: '0.8rem',
    letterSpacing: '0.5px',
    transition: 'all 0.2s',
    '&:hover': {
      background: 'rgba(255, 0, 0, 0.25)',
      border: '2px solid rgba(255, 0, 0, 0.4)',
    },
  },
  icon: {
    mr: 1,
  },
  animationsControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0.75,
  },
  checkbox: {
    color: '#d0c98d',
    '&.Mui-checked': {
      color: '#d0c98d',
    },
    '&:hover': {
      backgroundColor: 'rgba(208, 201, 141, 0.08)',
    },
  },
  checkboxLabel: {
    color: '#d0c98d',
    fontSize: '0.8rem',
    fontFamily: 'Cinzel, Georgia, serif',
    mb: -1.5,
    '& .MuiFormControlLabel-label': {
      fontWeight: 500,
    },
  },
  paymentControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    background: 'rgba(24, 40, 24, 0.3)',
    border: '1px solid rgba(8, 62, 34, 0.5)',
    borderRadius: '6px',
  },
  tokenSelect: {
    minWidth: 120,
    color: '#d0c98d',
    fontSize: '14px',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(208, 201, 141, 0.3)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(208, 201, 141, 0.5)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d0c98d',
    },
    '& .MuiSelect-icon': {
      color: '#d0c98d',
    },
  },
};
