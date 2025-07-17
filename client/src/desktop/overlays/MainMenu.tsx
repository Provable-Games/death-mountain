import { useController } from '@/contexts/controller';
import discordIcon from '@/desktop/assets/images/discord.png';
import AdventurersList from '@/desktop/components/AdventurersList';
import Settings from '@/desktop/components/Settings';
import Network from '@/desktop/components/Network';
import WalletConnect from '@/desktop/components/WalletConnect';
import { getMenuLeftOffset } from '@/utils/utils';
import CameraIcon from '@mui/icons-material/Camera';
import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import XIcon from '@mui/icons-material/X';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MainMenu() {
  const navigate = useNavigate();
  const { address, isPending, playAsGuest } = useController();
  const [showAdventurers, setShowAdventurers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [left, setLeft] = useState(getMenuLeftOffset());

  useEffect(() => {
    function handleResize() {
      setLeft(getMenuLeftOffset());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartGame = () => {
    navigate(`/survivor/play`);
  };

  return (
    <Box sx={{ ...styles.container, left: `${left + 32}px` }}>
      <AnimatePresence mode="wait">
        {showAdventurers && <AdventurersList onBack={() => setShowAdventurers(false)} />}
        {showSettings && <Settings onBack={() => setShowSettings(false)} />}

        {!showAdventurers && !showSettings && (
          <>
            <Typography sx={styles.title}>
              LOOT<br />SURVIVOR 2
            </Typography>

            <Button
              disabled={!address}
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<CameraIcon sx={styles.icon} />}
              onClick={handleStartGame}
            >
              Play Now
            </Button>

            <Button
              disabled={!address}
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<ShieldOutlinedIcon sx={styles.icon} />}
              onClick={() => setShowAdventurers(true)}
            >
              My Adventurers
            </Button>

            <Divider sx={{ width: '100%', my: 0.5 }} />

            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<SettingsOutlinedIcon sx={styles.icon} />}
              onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>

            <Box sx={styles.bottom}>
              <Network />
              <WalletConnect />

              {/* {!address && (
                <>
                  <Box sx={styles.orDivider}>
                    <Divider sx={{ flex: 1 }} />
                    <Typography sx={styles.orText}>or</Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    sx={{ textAlign: 'center', justifyContent: 'center', height: '36px' }}
                    onClick={() => {
                      playAsGuest();
                    }}
                  >
                    <Typography sx={{ fontSize: '0.8rem' }}>Play as Guest</Typography>
                  </Button>
                </>
              )} */}

              <Box sx={styles.bottomRow}>
                <Typography sx={styles.alphaVersion}>
                  ALPHA VERSION 0.0.1
                </Typography>
                <Box sx={styles.socialButtons}>
                  <IconButton size="small" sx={styles.socialButton} onClick={() => window.open('https://x.com/lootsurvivor', '_blank')}>
                    <XIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton size="small" sx={styles.socialButton} onClick={() => window.open('https://discord.com/channels/884211910222970891/1249816798971560117', '_blank')}>
                    <img src={discordIcon} alt="Discord" style={{ width: 20, height: 20 }} />
                  </IconButton>
                  <IconButton size="small" sx={styles.socialButton} onClick={() => window.open('https://github.com/provable-games/loot-survivor-2', '_blank')}>
                    <GitHubIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 32,
    width: 310,
    minHeight: 600,
    bgcolor: 'rgba(24, 40, 24, 0.55)',
    border: '2px solid #083e22',
    borderRadius: '12px',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    px: 2,
    py: 2,
    zIndex: 10,
    gap: 1,
  },
  title: {
    fontSize: '2.4rem',
    textAlign: 'center',
    mb: 3,
    mt: 2,
    fontWeight: 400,
    letterSpacing: 1,
    lineHeight: 1.1,
  },
  icon: {
    mr: 1,
  },
  bottom: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    mt: 'auto',
    gap: 1,
    width: '100%',
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  socialButtons: {
    display: 'flex',
    gap: 0.5,
  },
  socialButton: {
    color: '#d0c98d',
    opacity: 0.8,
    '&:hover': {
      opacity: 1,
    },
    padding: '4px',
  },
  alphaVersion: {
    fontSize: '0.7rem',
    opacity: 0.8,
    letterSpacing: 1,
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  orText: {
    margin: '0 1rem',
    fontSize: '0.8rem',
    opacity: 0.8,
    textAlign: 'center',
  },
};