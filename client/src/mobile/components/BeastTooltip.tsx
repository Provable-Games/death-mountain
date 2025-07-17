import {
  beastTypeIcons, getArmorType, getArmorTypeStrength, getArmorTypeWeakness,
  getAttackType, getWeaponTypeStrength, getWeaponTypeWeakness
} from '@/utils/beast';
import { typeIcons } from '@/utils/loot';
import { Box, Tooltip, Typography } from '@mui/material';

interface BeastTooltipProps {
  beastType: string;
  beastId: number;
}

export default function BeastTooltip({ beastType, beastId }: BeastTooltipProps) {
  const attackType = getAttackType(beastId);
  const armorType = getArmorType(beastId);

  return (
    <Tooltip
      placement="bottom"
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'transparent',
            border: 'none',
          },
        },
      }}
      title={
        <Box sx={styles.tooltipContainer}>
          <Typography sx={styles.tooltipTitle}>
            {beastType}
          </Typography>

          <Box sx={styles.sectionDivider} />

          {/* Weapon Section */}
          <Box sx={styles.tooltipSection}>
            <Box sx={styles.tooltipTypeRow}>
              <Box
                component="img"
                src={typeIcons[attackType as keyof typeof typeIcons]}
                alt={attackType}
                sx={styles.tooltipTypeIcon}
              />
              <Typography sx={styles.tooltipTypeText}>{attackType} Attack</Typography>
            </Box>
            <Box sx={styles.tooltipRow}>
              <Typography sx={styles.tooltipLabel}>Strong Against:</Typography>
              <Box sx={styles.tooltipTypeRow}>
                <Box
                  component="img"
                  src={typeIcons[getWeaponTypeStrength(attackType) as keyof typeof typeIcons]}
                  alt={'icon'}
                  sx={styles.tooltipTypeIcon}
                />
                <Typography sx={styles.tooltipTypeText}>
                  {getWeaponTypeStrength(attackType)} Armor
                </Typography>
                <Typography sx={styles.tooltipPercentage}>150% DMG</Typography>
              </Box>
            </Box>
            <Box sx={styles.tooltipRow}>
              <Typography sx={styles.tooltipLabel}>Weak Against:</Typography>
              <Box sx={styles.tooltipTypeRow}>
                <Box
                  component="img"
                  src={typeIcons[getWeaponTypeWeakness(attackType) as keyof typeof typeIcons]}
                  alt={'icon'}
                  sx={styles.tooltipTypeIcon}
                />
                <Typography sx={styles.tooltipTypeText}>
                  {getWeaponTypeWeakness(attackType)} Armor
                </Typography>
                <Typography sx={styles.tooltipPercentage}>50% DMG</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={styles.sectionDivider} />

          {/* Armor Section */}
          <Box sx={styles.tooltipSection}>
            <Box sx={styles.tooltipTypeRow}>
              <Box
                component="img"
                src={typeIcons[armorType as keyof typeof typeIcons]}
                alt={armorType}
                sx={styles.tooltipTypeIcon}
              />
              <Typography sx={styles.tooltipTypeText}>{armorType} Armor</Typography>
            </Box>
            <Box sx={styles.tooltipRow}>
              <Typography sx={styles.tooltipLabel}>Strong Against:</Typography>
              <Box sx={styles.tooltipTypeRow}>
                <Box
                  component="img"
                  src={typeIcons[getArmorTypeStrength(armorType) as keyof typeof typeIcons]}
                  alt={getArmorTypeStrength(armorType)}
                  sx={styles.tooltipTypeIcon}
                />
                <Typography sx={styles.tooltipTypeText}>
                  {getArmorTypeStrength(armorType)} Weapons
                </Typography>
                <Typography sx={styles.tooltipPercentage}>50% DMG</Typography>
              </Box>
            </Box>

            <Box sx={styles.tooltipRow}>
              <Typography sx={styles.tooltipLabel}>Weak Against:</Typography>
              <Box sx={styles.tooltipTypeRow}>
                <Box
                  component="img"
                  src={typeIcons[getArmorTypeWeakness(armorType) as keyof typeof typeIcons]}
                  alt={getArmorTypeWeakness(armorType)}
                  sx={styles.tooltipTypeIcon}
                />
                <Typography sx={styles.tooltipTypeText}>
                  {getArmorTypeWeakness(armorType)} Weapons
                </Typography>
                <Typography sx={styles.tooltipPercentage}>150% DMG</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      }
    >
      <Box sx={styles.typeContainer}>
        <Box
          component="img"
          src={beastTypeIcons[beastType as keyof typeof beastTypeIcons]}
          alt={beastType}
          sx={styles.typeIcon}
        />
      </Box>
    </Tooltip>
  );
}

const styles = {
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '1px solid rgba(128, 255, 0, 0.3)',
    borderRadius: '8px',
    padding: '10px',
    zIndex: 1000,
    minWidth: '200px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  tooltipTitle: {
    fontSize: '1.2rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  tooltipSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '4px 0',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  tooltipRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tooltipTypeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 0',
  },
  tooltipTypeIcon: {
    width: '16px',
    height: '16px',
    filter: 'invert(1) sepia(1) saturate(3000%) hue-rotate(50deg) brightness(1.1)',
  },
  tooltipTypeText: {
    color: '#80FF00',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  tooltipLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tooltipPercentage: {
    color: '#80FF00',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    marginLeft: 'auto',
    paddingLeft: '8px',
    borderLeft: '1px solid rgba(128, 255, 0, 0.2)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(128, 255, 0, 0.2)',
    margin: '4px 0',
  },
  sectionDivider: {
    height: '1px',
    backgroundColor: 'rgba(128, 255, 0, 0.3)',
    margin: '8px 0 4px',
  },
  typeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  typeIcon: {
    width: '18px',
    height: '18px',
    filter: 'invert(1) sepia(1) saturate(3000%) hue-rotate(50deg) brightness(1.1)',
  },
}; 