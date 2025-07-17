import { useGameStore } from '@/stores/gameStore';
import { useController } from '@/contexts/controller';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, IconButton } from '@mui/material';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import SettingsMenu from './HeaderMenu';
import Network from './Network';
import WalletConnect from './WalletConnect';

function Header() {
  const { gameId, adventurer } = useGameStore();
  const { address } = useController();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  if (gameId && adventurer && isMobile) return null;

  return (
    <Box sx={styles.header}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      </Box>


      <Box sx={styles.headerButtons}>
        <Box sx={styles.networkContainer}>
          <Network />
        </Box>

        {address && <WalletConnect />}

        <IconButton
          onClick={handleSettingsClick}
          sx={{ color: 'white' }}
        >
          <SettingsIcon />
        </IconButton>

        <SettingsMenu
          anchorEl={anchorEl}
          handleClose={handleSettingsClose}
        />

      </Box>
    </Box>
  );
}

export default Header

const styles = {
  header: {
    width: '100%',
    height: '50px',
    borderBottom: '2px solid rgba(17, 17, 17, 1)',
    background: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    px: '10px'
  },
  networkContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100px'
  },
  headerButtons: {
    display: 'flex',
    height: '36px',
    alignItems: 'center',
    gap: 2
  }
};