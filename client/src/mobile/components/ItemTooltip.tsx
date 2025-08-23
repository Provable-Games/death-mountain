import { useGameStore } from '@/stores/gameStore';
import { Item } from '@/types/game';
import { calculateAttackDamage, calculateBeastDamage, calculateLevel, calculateNextLevelXP, calculateProgress } from '@/utils/game';
import { ItemUtils } from '@/utils/loot';
import { Box, LinearProgress, Typography } from '@mui/material';

interface ItemTooltipProps {
  item: Item;
  itemSpecialsSeed: number;
  style?: React.CSSProperties;
}

export default function ItemTooltip({ itemSpecialsSeed, item, style }: ItemTooltipProps) {
  const { adventurer, beast } = useGameStore();
  const level = calculateLevel(item.xp);
  const tier = ItemUtils.getItemTier(item.id);
  const type = ItemUtils.getItemType(item.id);
  const metadata = ItemUtils.getMetadata(item.id);
  const xpToNextLevel = calculateNextLevelXP(level, true);
  const specials = ItemUtils.getSpecials(item.id, level, itemSpecialsSeed);
  const specialName = specials.suffix ? `"${specials.prefix} ${specials.suffix}"` : null;

  // Calculate what specials would be unlocked at level 15 if itemSpecialsSeed is not 0
  const futureSpecials = itemSpecialsSeed !== 0 && level < 15 ? ItemUtils.getSpecials(item.id, 15, itemSpecialsSeed) : null;

  // Calculate damage if there's a beast and this is an armor or weapon item
  let damage = null;
  let damageTaken = null;
  let isNameMatch = false;

  if (beast) {
    isNameMatch = ItemUtils.isNameMatch(item.id, level, itemSpecialsSeed, beast);

    if (['Head', 'Chest', 'Foot', 'Hand', 'Waist'].includes(ItemUtils.getItemSlot(item.id))) {
      damageTaken = calculateBeastDamage(beast, adventurer!, item);
    } else if (ItemUtils.isWeapon(item.id)) {
      damage = calculateAttackDamage(item, adventurer!, beast);
    }
  }

  return (
    <Box sx={{ ...styles.tooltip, ...style }}>
      <Box sx={styles.header}>
        <Box>
          {specialName && (
            <Typography>
              {specialName}
            </Typography>
          )}

          <Typography sx={styles.itemName}>
            {metadata.name}
          </Typography>
        </Box>
        <Typography sx={{ ...styles.tier, backgroundColor: ItemUtils.getTierColor(tier), color: '#111111' }}>
          T{tier}
        </Typography>
      </Box>

      <Box sx={styles.divider} />

      <Box sx={styles.statsContainer}>
        <Box sx={styles.statRow}>
          <Typography variant="caption" sx={styles.statLabel}>Power</Typography>
          <Typography variant="caption" sx={styles.statValue}>{level * (6 - tier)}</Typography>
        </Box>
        <Box sx={styles.statRow}>
          <Typography variant="caption" sx={styles.statLabel}>Level</Typography>
          <Typography variant="caption" sx={styles.statValue}>{level}</Typography>
        </Box>
        <Box sx={styles.statRow}>
          <Typography variant="caption" sx={styles.statLabel}>Type</Typography>
          <Typography variant="caption" sx={styles.statValue}>{type}</Typography>
        </Box>
      </Box>

      <Box sx={styles.xpContainer}>
        <Box sx={styles.xpHeader}>
          <Typography variant="caption" sx={styles.xpLabel}>XP Progress</Typography>
          <Typography variant="caption" sx={styles.xpValue}>{item.xp}/{xpToNextLevel}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={calculateProgress(item.xp, true)}
          sx={styles.xpBar}
        />
      </Box>

      {(damage || damageTaken) && (
        <>
          <Box sx={styles.divider} />
          <Box sx={styles.damageContainer}>
            <Typography sx={[
              styles.damageValue,
              styles.damageText
            ]}>
              {damage && (
                <Box>
                  <Box fontSize="13px">Deals {damage.baseDamage} damage (base)</Box>
                  <Box fontSize="13px">Deals {damage.criticalDamage} damage (critical)</Box>
                </Box>
              )}
              {damageTaken && `-${damageTaken} health when hit`}
            </Typography>
          </Box>
        </>
      )}

      {specials.special1 && (
        <>
          <Box sx={styles.divider} />
          <Box sx={styles.specialContainer}>
            <Typography variant="caption" sx={styles.special}>
              {specials.special1}
            </Typography>

            <Typography variant="caption" sx={styles.special}>
              {ItemUtils.getStatBonus(specials.special1)}
            </Typography>
          </Box>
        </>
      )}

      {futureSpecials && futureSpecials.special1 && (
        <>
          <Box sx={styles.divider} />
          <Box sx={styles.futureSpecialContainer}>
            <Typography sx={styles.futureSpecialLabel}>
              Unlocks At 15
            </Typography>
            <Box sx={styles.futureSpecialContent}>
              <Typography sx={styles.futureSpecial}>
                {futureSpecials.special1}
              </Typography>

              <Typography sx={styles.futureSpecial}>
                {ItemUtils.getStatBonus(futureSpecials.special1)}
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {isNameMatch && (
        <>
          <Box sx={styles.divider} />
          <Box sx={{
            ...styles.nameMatchContainer,
            border: ItemUtils.isWeapon(item.id) 
              ? '1px solid rgba(0, 255, 0, 0.6)' 
              : '1px solid rgba(255, 0, 0, 0.6)',
            backgroundColor: ItemUtils.isWeapon(item.id) 
              ? 'rgba(0, 255, 0, 0.1)' 
              : 'rgba(255, 0, 0, 0.1)',
          }}>
            <Typography sx={{
              ...styles.nameMatchWarning,
              color: ItemUtils.isWeapon(item.id) ? '#00FF00' : '#FF4444',
            }}>
              Name matches beast!
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}

const styles = {
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(17, 17, 17, 1)',
    border: '1px solid rgba(128, 255, 0, 0.3)',
    borderRadius: '8px',
    padding: '10px',
    zIndex: 1000,
    minWidth: '200px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemName: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '1.0rem',
    fontWeight: 'bold',
    textShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
  },
  tier: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
    padding: '2px 6px',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '4px',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(128, 255, 0, 0.3), transparent)',
    margin: '8px 0',
  },
  statsContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '12px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
  },
  statValue: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
  },
  xpContainer: {
    marginBottom: '12px',
  },
  xpHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  xpLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
  },
  xpValue: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
  },
  xpBar: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#80FF00',
      boxShadow: '0 0 8px rgba(128, 255, 0, 0.5)',
    },
  },
  specialContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '4px',
  },
  special: {
    color: '#EDCF33',
    fontFamily: 'VT323, monospace',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  damageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
    borderColor: 'rgba(128, 255, 0, 0.2)',
  },
  damageWarning: {
    color: '#80FF00',
    fontWeight: '500',
    opacity: 0.8
  },
  damageValue: {
    color: '#80FF00',
  },
  damageText: {
    color: '#80FF00',
  },
  nameMatchContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid rgba(128, 255, 0, 0.3)',
    backgroundColor: 'rgba(128, 255, 0, 0.1)',
  },
  nameMatchWarning: {
    color: '#80FF00',
    fontWeight: '500',
    opacity: 0.8
  },
  futureSpecialContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  futureSpecialLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.8rem',
    fontWeight: '500',
    lineHeight: '1.0',
    opacity: 0.9,
  },
  futureSpecialContent: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  futureSpecial: {
    color: '#80FF00',
    fontSize: '0.8rem',
    opacity: 0.8,
  },
}; 