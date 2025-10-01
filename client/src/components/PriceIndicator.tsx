import { useStatistics } from '@/contexts/Statistics';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';

// Price indicator component
export default function PriceIndicator() {
  const { gamePrice, gamePriceHistory, fetchGamePrice } = useStatistics();

  // Handle case where data is not available
  if (!gamePrice) {
    return (
      <Box sx={{
        width: '100%',
        border: '1px solid #d0c98d30',
        borderRadius: '5px',
        padding: '10px',
        background: 'rgba(24, 40, 24, 0.3)',
        boxSizing: 'border-box',
      }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: 0.5 }}>
          Game Price
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#808080', fontStyle: 'italic' }}>
          Loading price data...
        </Typography>
      </Box>
    );
  }

  // Convert string price to number
  const currentPrice = parseFloat(gamePrice);

  // Handle case where we have price but no history
  if (!gamePriceHistory || gamePriceHistory.length === 0) {
    return (
      <Box sx={{
        width: '100%',
        border: '1px solid #d0c98d30',
        borderRadius: '5px',
        padding: '10px',
        background: 'rgba(24, 40, 24, 0.3)',
        boxSizing: 'border-box',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: 0.5 }}>
              Game Price
            </Typography>
            <Tooltip
              title={
                <Box sx={styles.tooltipContainer}>
                  <Box sx={styles.tooltipTypeRow}>
                    <Typography sx={styles.tooltipTypeText}>
                      Game Price
                    </Typography>
                    <Typography sx={styles.tooltipTypeText}>
                      ${currentPrice.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={styles.sectionDivider} />
                  <Box sx={styles.tooltipSection}>
                    <Typography sx={styles.tooltipDescription}>
                      The cost to start a new game.
                    </Typography>

                    <Typography sx={styles.tooltipLabel} color="secondary">
                      Game Fee Distribution:
                    </Typography>

                    <Typography sx={styles.feeHighlightText}>
                      - 80% to survivor token holders
                    </Typography>

                    <Typography sx={styles.feeHighlightText}>
                      - 20% to veLords
                    </Typography>
                  </Box>
                </Box>
              }
              arrow
              placement="right"
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'preventOverflow',
                      enabled: true,
                      options: { rootBoundary: 'viewport' },
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
            >
              <Box sx={[styles.infoIcon, { borderColor: 'text.primary' }]}>i</Box>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip
              title={
                <Box sx={styles.smallTooltipContainer}>
                  <Typography sx={{ color: 'text.primary', fontSize: '0.8rem' }}>
                    Refresh price
                  </Typography>
                </Box>
              }
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'transparent',
                    border: 'none',
                  },
                },
              }}
            >
              <IconButton
                onClick={fetchGamePrice}
                sx={{
                  width: 20,
                  height: 20,
                  minWidth: 'unset',
                  padding: 0,
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <RefreshIcon sx={{
                  fontSize: '1rem',
                  transform: 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(90deg)',
                  },
                }} />
              </IconButton>
            </Tooltip>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              ${currentPrice.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Simple display without price bar when no history */}
        <Typography sx={{
          fontSize: '0.75rem',
          color: '#808080',
          fontStyle: 'italic',
        }}>
          Price history unavailable
        </Typography>
      </Box>
    );
  }

  // Find min and max from the history data
  const minPrice = Math.min(...gamePriceHistory.map(item => item.min));
  const maxPrice = Math.max(...gamePriceHistory.map(item => item.max));

  // Calculate position on the bar (0-100%)
  const pricePosition = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <Box sx={{
      width: '100%',
      border: '1px solid #d0c98d30',
      borderRadius: '5px',
      padding: '10px 10px 5px',
      background: 'rgba(24, 40, 24, 0.3)',
      boxSizing: 'border-box',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: 0.5 }}>
            Game Price
          </Typography>
          <Tooltip
            title={
              <Box sx={styles.tooltipContainer}>
                <Box sx={styles.tooltipTypeRow}>
                  <Typography sx={styles.tooltipTypeText}>
                    Game Price
                  </Typography>
                  <Typography sx={styles.tooltipTypeText}>
                    ${currentPrice.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={styles.sectionDivider} />
                <Box sx={styles.tooltipSection}>
                  <Typography sx={styles.tooltipDescription}>
                    The cost to start a new game.
                  </Typography>

                  <Typography sx={styles.tooltipLabel} color="secondary">
                    Current Status:
                  </Typography>

                  <Typography sx={styles.feeHighlightText}>
                    {pricePosition <= 5 ? '- Price is very low' :
                      pricePosition <= 20 ? '- Price is low' :
                        pricePosition <= 39 ? '- Price is slightly low' :
                          pricePosition <= 60 ? '- Price is average' :
                            pricePosition <= 80 ? '- Price is slightly high' :
                              pricePosition <= 95 ? '- Price is high' : '- Price is very high'}
                  </Typography>

                  <Typography sx={styles.tooltipLabel} color="secondary">
                    Game Fee Distribution:
                  </Typography>

                  <Typography sx={styles.feeHighlightText}>
                    - 80% to survivor token holders
                  </Typography>

                  <Typography sx={styles.feeHighlightText}>
                    - 20% to veLords
                  </Typography>
                </Box>
              </Box>
            }
            arrow
            placement="right"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'preventOverflow',
                    enabled: true,
                    options: { rootBoundary: 'viewport' },
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
          >
            <Box sx={[styles.infoIcon, { borderColor: 'text.primary' }]}>
              i
            </Box>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip
            title={
              <Box sx={styles.smallTooltipContainer}>
                <Typography sx={{ color: 'text.primary', fontSize: '0.8rem' }}>
                  Refresh price
                </Typography>
              </Box>
            }
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'transparent',
                  border: 'none',
                },
              },
            }}
          >
            <IconButton
              onClick={fetchGamePrice}
              sx={{
                width: 20,
                height: 20,
                minWidth: 'unset',
                padding: 0,
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Box sx={{
                fontSize: '16px',
                transform: 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'rotate(180deg)',
                },
              }}>
                ↻
              </Box>
            </IconButton>
          </Tooltip>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            ${currentPrice.toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {/* Price bar */}
      <Box sx={{
        width: '100%',
        height: 8,
        borderRadius: 4,
        my: 1,
        background: 'linear-gradient(90deg, #4caf50 0%, #ff9800 50%, #f44336 100%)',
        position: 'relative',
      }}>
        {/* Price indicator dot */}
        <Box sx={{
          position: 'absolute',
          left: `${Math.min(Math.max(pricePosition, 0), 100)}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#ffffff',
          border: '2px solid text.primary',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          zIndex: 2,
        }} />
      </Box>
    </Box>
  );
}

const styles = {
  infoIcon: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '1px solid #d0c98d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: 'text.primary',
    cursor: 'help',
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    padding: '10px',
    zIndex: 1000,
    minWidth: '250px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  tooltipTypeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    padding: '2px 0',
  },
  tooltipTypeText: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  tooltipSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '4px 0',
  },
  tooltipDescription: {
    letterSpacing: '0.3px',
    fontSize: '13px',
  },
  tooltipRow: {
    display: 'flex',
    flexDirection: 'column',
  },
  tooltipLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: '1.2',
    mt: 0.5,
  },
  tooltipValue: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sectionDivider: {
    height: '1px',
    backgroundColor: '#d7c529',
    opacity: 0.2,
    margin: '8px 0 4px',
  },
  feeHighlight: {
    backgroundColor: 'rgba(208, 201, 141, 0.15)',
    borderRadius: '6px',
    padding: '4px 8px',
    marginTop: '8px',
    border: '1px solid rgba(208, 201, 141, 0.3)',
  },
  feeHighlightText: {
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.3px',
    lineHeight: '1.0',
  },
  smallTooltipContainer: {
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '2px solid #083e22',
    borderRadius: '8px',
    padding: '6px 8px',
    minWidth: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
}; 