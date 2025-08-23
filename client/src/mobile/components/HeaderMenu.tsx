import { Box, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Typography, Slider } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SettingsIcon from '@mui/icons-material/Settings';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import XIcon from '@mui/icons-material/X';
import GitHubIcon from '@mui/icons-material/GitHub';
import ComputerIcon from '@mui/icons-material/Computer';
import { useSound } from '@/contexts/Sound';
import { useUIStore } from '@/stores/uiStore';
import { isDesktop } from 'react-device-detect';

interface HeaderMenuProps {
  anchorEl: HTMLElement | null;
  handleClose: () => void;
}

function HeaderMenu({ anchorEl, handleClose }: HeaderMenuProps) {
  const { playing, setPlaying, volume, setVolume } = useSound();
  const { setGameSettingsListOpen, setUseMobileClient } = useUIStore();

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setVolume((newValue as number) / 100);
  };

  const handleSwitchToDesktop = () => {
    setUseMobileClient(false);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: 260,
            mt: 0.5,
            background: 'rgba(17, 17, 17, 1)',
            border: '2px solid rgba(34, 34, 34, 1)',
            '& .MuiMenuItem-root': {
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)'
              }
            },
            '& .MuiListItemIcon-root': {
              color: 'white',
              minWidth: 40
            }
          }
        }
      }}
    >
      <Box px={2}>
        <Typography variant='h6'>
          Music
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              <VolumeUpIcon fontSize='medium' sx={{ color: '#80FF00' }} /> :
              <VolumeOffIcon fontSize='medium' sx={{ color: '#80FF00' }} />
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
            sx={{
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
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <MenuItem onClick={() => { setGameSettingsListOpen(true); handleClose() }}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" sx={{ color: '#80FF00' }} />
        </ListItemIcon>
        <ListItemText>
          <Typography variant="h6">Game Settings</Typography>
        </ListItemText>
      </MenuItem>

      {isDesktop && <MenuItem onClick={() => { handleSwitchToDesktop(); handleClose(); }}>
        <ListItemIcon>
          <ComputerIcon fontSize="small" sx={{ color: '#80FF00' }} />
        </ListItemIcon>
        <ListItemText>
          <Typography variant="h6">Switch to Desktop</Typography>
        </ListItemText>
      </MenuItem>}

      <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <MenuItem onClick={() => { window.open("https://discord.gg/DQa4z9jXnY", "_blank"); handleClose(); }}>
        <ListItemIcon>
          <SportsEsportsIcon fontSize="small" sx={{ color: '#80FF00' }} />
        </ListItemIcon>
        <ListItemText>
          <Typography variant="h6">Discord</Typography>
        </ListItemText>
      </MenuItem>

      <MenuItem onClick={() => { window.open("https://x.com/LootSurvivor", "_blank"); handleClose(); }}>
        <ListItemIcon>
          <XIcon fontSize="small" sx={{ color: '#80FF00' }} />
        </ListItemIcon>
        <ListItemText>
          <Typography variant="h6">Twitter</Typography>
        </ListItemText>
      </MenuItem>

      <MenuItem onClick={() => { window.open("https://github.com/provable-games/death-mountain", "_blank"); handleClose(); }}>
        <ListItemIcon>
          <GitHubIcon fontSize="small" sx={{ color: '#80FF00' }} />
        </ListItemIcon>
        <ListItemText>
          <Typography variant="h6">Github</Typography>
        </ListItemText>
      </MenuItem>
    </Menu>
  );
}

export default HeaderMenu; 