import { useDynamicConnector } from '@/contexts/starknet';
import { NETWORKS } from '@/utils/networkConfig';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import { useAccount, useDisconnect } from '@starknet-react/core';
import { useState } from 'react';

function Network() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { switchToNetwork, currentNetworkConfig } = useDynamicConnector();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNetworkSwitch = async (networkKey: keyof typeof NETWORKS) => {
    const network = NETWORKS[networkKey];

    // If connected, logout first to ensure clean state
    if (isConnected) {
      disconnect();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Always update our internal config
    switchToNetwork(network.chainId);

    handleClose();
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? '#4CAF50' : '#F44336';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      <Button
        variant="outlined"
        onClick={handleClick}
        fullWidth
        sx={{
          borderColor: '#d7c529',
          color: '#d7c529',
          '&:hover': {
            borderColor: '#b59f3b',
            backgroundColor: 'rgba(183, 159, 59, 0.1)'
          },
          height: '36px',
          textTransform: 'none',
          fontWeight: 500,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px'
        }}
      >
        {currentNetworkConfig.name}
        <FiberManualRecordIcon
          sx={{
            color: getStatusColor(currentNetworkConfig.status),
            fontSize: 12
          }}
        />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 310,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }
          }
        }}
      >
        {Object.entries(NETWORKS).map(([key, network]) => (
          <MenuItem
            key={network.name}
            onClick={() => handleNetworkSwitch(key as keyof typeof NETWORKS)}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              backgroundColor: key === currentNetworkConfig.chainId ? 'rgba(215, 197, 41, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: key === currentNetworkConfig.chainId ? 'rgba(215, 197, 41, 0.2)' : 'rgba(215, 197, 41, 0.05)',
              }
            }}
          >
            {network.name}
            <FiberManualRecordIcon
              sx={{
                color: getStatusColor(network.status || 'offline'),
                fontSize: 10
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default Network;
