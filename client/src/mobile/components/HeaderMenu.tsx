import {
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
  Typography,
  Slider,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import XIcon from "@mui/icons-material/X";
import GitHubIcon from "@mui/icons-material/GitHub";
import ComputerIcon from "@mui/icons-material/Computer";
import CloseIcon from "@mui/icons-material/Close";
import { useSound } from "@/mobile/contexts/Sound";
import { useUIStore } from "@/stores/uiStore";
import { isDesktop } from "react-device-detect";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useState } from "react";

interface HeaderMenuProps {
  anchorEl: HTMLElement | null;
  handleClose: () => void;
}

function HeaderMenu({ anchorEl, handleClose }: HeaderMenuProps) {
  const { muted, setMuted, volume, setVolume } = useSound();
  const {
    setGameSettingsListOpen,
    setUseMobileClient,
    skipFirstBattle,
    setSkipFirstBattle,
    fastBattle,
    setFastBattle,
    advancedMode,
    setAdvancedMode,
  } = useUIStore();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setVolume((newValue as number) / 100);
  };

  const handleSwitchToDesktop = () => {
    setUseMobileClient(false);
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: 260,
              mt: 0.5,
              background: "rgba(17, 17, 17, 1)",
              border: "2px solid rgba(34, 34, 34, 1)",
              "& .MuiMenuItem-root": {
                color: "white",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.1)",
                },
              },
              "& .MuiListItemIcon-root": {
                color: "white",
                minWidth: 40,
              },
            },
          },
        }}
      >
        <Box px={2}>
          <Typography variant="h6">Music</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                "&:hover": { opacity: 0.8 },
              }}
              onClick={() => setMuted(!muted)}
            >
              {!muted ? (
                <VolumeUpIcon fontSize="medium" sx={{ color: "#80FF00" }} />
              ) : (
                <VolumeOffIcon fontSize="medium" sx={{ color: "#80FF00" }} />
              )}
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
                color: "#80FF00",
                "& .MuiSlider-thumb": {
                  backgroundColor: "#80FF00",
                },
                "& .MuiSlider-track": {
                  backgroundColor: "#80FF00",
                },
                "& .MuiSlider-rail": {
                  backgroundColor: "rgba(128, 255, 0, 0.2)",
                },
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 1, borderColor: "rgba(255, 255, 255, 0.1)" }} />

        <MenuItem
          onClick={() => {
            setSettingsOpen(true);
            handleClose();
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" sx={{ color: "#80FF00" }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="h6">Game Settings</Typography>
          </ListItemText>
        </MenuItem>

        {isDesktop && (
          <MenuItem
            onClick={() => {
              handleSwitchToDesktop();
              handleClose();
            }}
          >
            <ListItemIcon>
              <ComputerIcon fontSize="small" sx={{ color: "#80FF00" }} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="h6">Switch to Desktop</Typography>
            </ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            setGameSettingsListOpen(true);
            handleClose();
          }}
        >
          <ListItemIcon>
            <TuneIcon fontSize="small" sx={{ color: "#80FF00" }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="h6">Dungeon Editor</Typography>
          </ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1, borderColor: "rgba(255, 255, 255, 0.1)" }} />

        <MenuItem onClick={() => { window.open("https://docs.provable.games/lootsurvivor", "_blank"); handleClose(); }}>
          <ListItemIcon>
            <MenuBookIcon fontSize="small" sx={{ color: "#80FF00" }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="h6">Docs</Typography>
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { window.open("https://discord.gg/DQa4z9jXnY", "_blank"); handleClose(); }}>
          <ListItemIcon>
            <SportsEsportsIcon fontSize="small" sx={{ color: "#80FF00" }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="h6">Discord</Typography>
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { window.open("https://x.com/LootSurvivor", "_blank"); handleClose(); }}>
          <ListItemIcon>
            <XIcon fontSize="small" sx={{ color: "#80FF00" }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="h6">Twitter</Typography>
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { window.open("https://github.com/provable-games/death-mountain", "_blank"); handleClose(); }}>
          <ListItemIcon>
            <GitHubIcon fontSize="small" sx={{ color: "#80FF00" }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="h6">Github</Typography>
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Game Settings Modal */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(17, 17, 17, 1)",
            border: "2px solid rgba(34, 34, 34, 1)",
            color: "white",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Game Settings</Typography>
          <IconButton onClick={() => setSettingsOpen(false)} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Sound Section */}
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Sound</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                "&:hover": { opacity: 0.8 },
              }}
              onClick={() => setMuted(!muted)}
            >
              {!muted ? (
                <VolumeUpIcon fontSize="medium" sx={{ color: "#80FF00" }} />
              ) : (
                <VolumeOffIcon fontSize="medium" sx={{ color: "#80FF00" }} />
              )}
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
                color: "#80FF00",
                "& .MuiSlider-thumb": {
                  backgroundColor: "#80FF00",
                },
                "& .MuiSlider-track": {
                  backgroundColor: "#80FF00",
                },
                "& .MuiSlider-rail": {
                  backgroundColor: "rgba(128, 255, 0, 0.2)",
                },
              }}
            />
          </Box>

          <Divider sx={{ my: 1.5, borderColor: "rgba(255, 255, 255, 0.1)" }} />

          {/* Advanced Mode */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>Enable Advanced Mode</Typography>
              <Typography sx={{ fontSize: "12px", color: "rgba(128, 255, 0, 0.7)" }}>
                Advanced features and simulations
              </Typography>
            </Box>
            <Switch
              checked={advancedMode}
              onChange={(e) => setAdvancedMode(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#80FF00",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#80FF00",
                },
              }}
            />
          </Box>

          <Divider sx={{ my: 1.5, borderColor: "rgba(255, 255, 255, 0.1)" }} />

          {/* Game Section */}
          <Typography sx={{ fontWeight: 600 }}>Game</Typography>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={skipFirstBattle}
                  onChange={(e) => setSkipFirstBattle(e.target.checked)}
                  sx={{
                    color: "#80FF00",
                    "&.Mui-checked": { color: "#80FF00" },
                  }}
                />
              }
              label="Skip first battle"
              sx={{ color: "#80FF00" }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={fastBattle}
                  onChange={(e) => setFastBattle(e.target.checked)}
                  sx={{
                    color: "#80FF00",
                    "&.Mui-checked": { color: "#80FF00" },
                  }}
                />
              }
              label="Skip Combat Delay"
              sx={{ color: "#80FF00" }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HeaderMenu;
