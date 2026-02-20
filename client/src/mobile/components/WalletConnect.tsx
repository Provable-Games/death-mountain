import { useController } from '@/contexts/controller';
import {ellipseAddress, isNative} from '@/utils/utils';
import { Capacitor } from '@capacitor/core';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Button, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { useAccount } from '@starknet-react/core';
import {useMemo, useState} from 'react';

function WalletConnect() {
  const { isPending, playerName, login, logout, openProfile } = useController();
  const { account, address } = useAccount();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const checkIsNative = useMemo(() => isNative(), []);

  const handleLoggedInClick = (e: React.MouseEvent<HTMLElement>) => {
    if (checkIsNative) {
      setMenuAnchor(e.currentTarget);
    } else {
      openProfile();
    }
  };

  return (
    <>
      {account && address
        ? (
          <>
            <Button
              loading={!playerName}
              onClick={handleLoggedInClick}
              startIcon={<SportsEsportsIcon />}
              color='primary'
              variant='contained'
              size='small'
              sx={{ minWidth: '100px' }}
            >
              {playerName ? playerName : ellipseAddress(address, 4, 4)}
            </Button>
            {checkIsNative && (
              <Menu
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={() => setMenuAnchor(null)}
                slotProps={{ paper: { sx: { padding: '0 !important' } } }}
              >
                <MenuItem dense sx={{ display: 'flex', justifyContent: 'space-between' }} onClick={() => { address && navigator.clipboard.writeText(address); setMenuAnchor(null); }}>
                  {address && ellipseAddress(address, 6, 4)}
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: 'flex-end' }}>
                    <ContentCopyIcon fontSize="small" />
                  </ListItemIcon>
                </MenuItem>
                <MenuItem dense sx={{ py: 0.75 }} onClick={() => { logout(); setMenuAnchor(null); }}>Log out</MenuItem>
              </Menu>
            )}
          </>
        )
        : <Button
          loading={isPending}
          variant='contained'
          color='secondary'
          onClick={() => login()}
          size='small'
          startIcon={<SportsEsportsIcon />}
          sx={{ minWidth: '100px' }}
        >
          Log In
        </Button>
      }
    </>
  );
}

export default WalletConnect
