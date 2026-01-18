import { ItemUtils } from '@/utils/loot';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, ClickAwayListener, IconButton, Popper, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

interface JewelryTooltipProps {
  itemId: number;
  placement?: 'left' | 'right';
  mobile?: boolean;
}

export default function JewelryTooltip({ itemId, placement = 'right', mobile = false }: JewelryTooltipProps) {
  const isJewelry = ItemUtils.isNecklace(itemId) || ItemUtils.isRing(itemId);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!isJewelry) return null;

  const itemName = ItemUtils.getItemName(itemId);

  const tooltipContent = (
    <Box sx={styles.tooltipContainer}>
      <Typography sx={styles.tooltipTitle}>
        {itemName}
      </Typography>

      <Box sx={styles.sectionDivider} />

      <Box sx={styles.tooltipSection}>
        <Typography sx={styles.tooltipText}>
          {ItemUtils.getJewelryEffect(itemId)}
        </Typography>
        <Typography sx={styles.tooltipHint}>
          All equipped and bagged jewelry increases your crit chance
        </Typography>
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
  // Offset: [skid (along edge), distance (away from anchor)]
  // For 'left' placement: positive skid moves down, positive distance moves more left
  // For 'right' placement: positive skid moves down, negative distance moves left
  const offset: [number, number] = placement === 'left' ? [15, 30] : [10, -10];

  return (
    <Tooltip
      placement={placement}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'preventOverflow',
              enabled: true,
              options: { rootBoundary: 'viewport' },
            },
            {
              name: 'offset',
              options: { offset },
            },
          ],
        },
        tooltip: {
          sx: {
            bgcolor: 'transparent',
            border: 'none',
          },
        },
      }}
      title={tooltipContent}
    >
      <IconButton
        size="small"
        sx={styles.helpIcon}
        disableRipple
      >
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
    zIndex: 1000,
    maxWidth: '150px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  tooltipTitle: {
    color: '#d0c98d',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    marginBottom: '8px',
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
    gap: '4px',
    padding: '4px 0',
  },
  tooltipText: {
    color: '#d0c98d',
    fontSize: '0.8rem',
    lineHeight: '1.4',
  },
  tooltipHint: {
    color: 'rgba(215, 197, 41, 0.7)',
    fontSize: '0.75rem',
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
