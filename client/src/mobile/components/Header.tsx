import { useDungeon } from '@/dojo/useDungeon';
import { useGameStore } from '@/stores/gameStore';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, IconButton } from '@mui/material';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import ActivePlayers from './ActivePlayers';
import SettingsMenu from './HeaderMenu';
import WalletConnect from './WalletConnect';

function Header() {
  const { gameId, adventurer } = useGameStore();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const dungeon = useDungeon();
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  if (gameId && adventurer && isMobile) return null;

  return (
    <Box sx={styles.header}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ActivePlayers />
      </Box>


      <Box sx={styles.headerButtons}>
        {!dungeon.hideController ? <WalletConnect /> : null}

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
    width: '140px'
  },
  headerButtons: {
    display: 'flex',
    height: '36px',
    alignItems: 'center',
    gap: 2
  }
};