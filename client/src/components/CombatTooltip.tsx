import { beastTypeIcons } from '@/utils/beast';
import { typeIcons } from '@/utils/loot';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, ClickAwayListener, IconButton, Popper, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

interface CombatTooltipProps {
  itemType: string;
  placement?: 'left' | 'right';
  mobile?: boolean;
}

// Combat advantages based on contract: combat.cairo and beast.cairo
// Beast types by ID range:
//   - IDs 0-25: Magic_or_Cloth type → Magical beasts (wear Cloth armor)
//   - IDs 26-50: Blade_or_Hide type → Hunter beasts (wear Hide armor)
//   - IDs 51-75: Bludgeon_or_Metal type → Brute beasts (wear Metal armor)
//
// Weapon effectiveness (from get_elemental_effectiveness):
//   - Magic: Strong vs Metal (Brute), Fair vs Cloth (Magical), Weak vs Hide (Hunter)
//   - Blade: Strong vs Cloth (Magical), Fair vs Hide (Hunter), Weak vs Metal (Brute)
//   - Bludgeon: Strong vs Hide (Hunter), Fair vs Metal (Brute), Weak vs Cloth (Magical)
//
// Armor effectiveness (inverse - armor resists weapon types used by beasts):
//   - Cloth: Strong vs Bludgeon (Brute attack), Fair vs Magic (Magical attack), Weak vs Blade (Hunter attack)
//   - Hide: Strong vs Magic (Magical attack), Fair vs Blade (Hunter attack), Weak vs Bludgeon (Brute attack)
//   - Metal: Strong vs Blade (Hunter attack), Fair vs Bludgeon (Brute attack), Weak vs Magic (Magical attack)

const getCombatInfo = (type: string): { strong: string; fair: string; weak: string; strongBeast: string; fairBeast: string; weakBeast: string } | null => {
  switch (type) {
    // Weapons
    case 'Blade': return { strong: 'Cloth', fair: 'Hide', weak: 'Metal', strongBeast: 'Magical', fairBeast: 'Hunter', weakBeast: 'Brute' };
    case 'Magic': return { strong: 'Metal', fair: 'Cloth', weak: 'Hide', strongBeast: 'Brute', fairBeast: 'Magical', weakBeast: 'Hunter' };
    case 'Bludgeon': return { strong: 'Hide', fair: 'Metal', weak: 'Cloth', strongBeast: 'Hunter', fairBeast: 'Brute', weakBeast: 'Magical' };
    // Armor (resists beast attack types)
    case 'Cloth': return { strong: 'Bludgeon', fair: 'Magic', weak: 'Blade', strongBeast: 'Brute', fairBeast: 'Magical', weakBeast: 'Hunter' };
    case 'Hide': return { strong: 'Magic', fair: 'Blade', weak: 'Bludgeon', strongBeast: 'Magical', fairBeast: 'Hunter', weakBeast: 'Brute' };
    case 'Metal': return { strong: 'Blade', fair: 'Bludgeon', weak: 'Magic', strongBeast: 'Hunter', fairBeast: 'Brute', weakBeast: 'Magical' };
    default: return null;
  }
};

const isWeaponType = (type: string): boolean => {
  return type === 'Blade' || type === 'Magic' || type === 'Bludgeon';
};

// Map beast type name to icon key
const getBeastIconKey = (beastType: string): keyof typeof beastTypeIcons => {
  switch (beastType) {
    case 'Magical': return 'Magic';
    case 'Hunter': return 'Hunter';
    case 'Brute': return 'Brute';
    default: return 'Magic';
  }
};

export default function CombatTooltip({ itemType, placement = 'left', mobile = false }: CombatTooltipProps) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const combatInfo = getCombatInfo(itemType);

  if (!combatInfo) return null;

  const isWeapon = isWeaponType(itemType);

  const tooltipContent = (
    <Box sx={styles.tooltipContainer}>
      <Typography sx={styles.tooltipTitle}>{itemType}</Typography>
      <Box sx={styles.sectionDivider} />
      <Box sx={styles.tooltipSection}>
        <Box sx={styles.tooltipRow}>
          <Box sx={styles.iconGroup}>
            <Box
              component="img"
              src={typeIcons[combatInfo.strong as keyof typeof typeIcons]}
              sx={styles.tooltipIcon}
            />
            <Box
              component="img"
              src={beastTypeIcons[getBeastIconKey(combatInfo.strongBeast)]}
              sx={styles.tooltipIcon}
            />
          </Box>
          <Typography sx={styles.tooltipStrong}>
            Strong vs {combatInfo.strongBeast} ({isWeapon ? '150%' : '50%'})
          </Typography>
        </Box>
        <Box sx={styles.tooltipRow}>
          <Box sx={styles.iconGroup}>
            <Box
              component="img"
              src={typeIcons[combatInfo.fair as keyof typeof typeIcons]}
              sx={styles.tooltipIcon}
            />
            <Box
              component="img"
              src={beastTypeIcons[getBeastIconKey(combatInfo.fairBeast)]}
              sx={styles.tooltipIcon}
            />
          </Box>
          <Typography sx={styles.tooltipFair}>
            Neutral vs {combatInfo.fairBeast} (100%)
          </Typography>
        </Box>
        <Box sx={styles.tooltipRow}>
          <Box sx={styles.iconGroup}>
            <Box
              component="img"
              src={typeIcons[combatInfo.weak as keyof typeof typeIcons]}
              sx={styles.tooltipIcon}
            />
            <Box
              component="img"
              src={beastTypeIcons[getBeastIconKey(combatInfo.weakBeast)]}
              sx={styles.tooltipIcon}
            />
          </Box>
          <Typography sx={styles.tooltipWeak}>
            Weak vs {combatInfo.weakBeast} ({isWeapon ? '50%' : '150%'})
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // Mobile: tap to show, tap anywhere to dismiss
  if (mobile) {
    return (
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <Box>
          <IconButton
            size="small"
            sx={styles.helpIcon}
            disableRipple
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
              setAnchorEl(e.currentTarget);
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Popper
            open={open}
            anchorEl={anchorEl}
            placement={placement}
            modifiers={[
              {
                name: 'preventOverflow',
                enabled: true,
                options: { rootBoundary: 'viewport', padding: 8 },
              },
              {
                name: 'offset',
                options: { offset: [0, 8] },
              },
            ]}
            sx={{ zIndex: 1300 }}
          >
            {tooltipContent}
          </Popper>
        </Box>
      </ClickAwayListener>
    );
  }

  // Desktop: hover tooltip
  return (
    <Tooltip
      placement={placement}
      slotProps={{
        tooltip: {
          sx: { bgcolor: 'transparent', border: 'none', p: 0 },
        },
      }}
      title={tooltipContent}
    >
      <IconButton size="small" sx={styles.helpIcon} disableRipple>
        <HelpOutlineIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
}

const styles = {
  tooltipContainer: {
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    padding: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  tooltipTitle: {
    color: '#d0c98d',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  sectionDivider: {
    height: '1px',
    backgroundColor: '#d7c529',
    opacity: 0.2,
    margin: '8px 0',
  },
  tooltipSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  tooltipIcon: {
    width: 16,
    height: 16,
    filter: 'brightness(0) invert(1)',
    opacity: 0.9,
  },
  tooltipStrong: {
    color: '#60ba78',
    fontSize: '0.8rem',
    lineHeight: '1.4',
  },
  tooltipFair: {
    color: '#d0c98d',
    fontSize: '0.8rem',
    lineHeight: '1.4',
  },
  tooltipWeak: {
    color: '#d46660',
    fontSize: '0.8rem',
    lineHeight: '1.4',
  },
  helpIcon: {
    padding: '2px',
    color: 'rgba(215, 197, 41, 0.8)',
    '&:hover': {
      color: 'rgba(215, 197, 41, 1)',
      backgroundColor: 'rgba(215, 197, 41, 0.1)',
    },
  },
};
