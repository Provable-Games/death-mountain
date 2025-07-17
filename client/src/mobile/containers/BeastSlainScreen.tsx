import { BEAST_NAMES } from '@/constants/beast';
import { useGameStore } from '@/stores/gameStore';
import { screenVariants } from '@/utils/animations';
import { calculateLevel, calculateNextLevelXP, calculateProgress } from '@/utils/game';
import { ItemUtils, slotIcons } from '@/utils/loot';
import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const numberVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const progressVariants = {
  hidden: { width: 0 },
  visible: {
    width: "100%",
    transition: {
      duration: 1,
      ease: "easeOut",
      delay: 0.5
    }
  }
};

const xpBarVariants = {
  hidden: { width: 0 },
  visible: (width: number) => ({
    width: `${width}%`,
    transition: {
      duration: 1,
      ease: 'easeOut',
      delay: 0.5,
    },
  }),
};

export default function BeastSlainScreen() {
  const { adventurer, exploreLog, setShowBeastRewards } = useGameStore();
  const [showContinue, setShowContinue] = useState(false);
  const [showLevelUpText, setShowLevelUpText] = useState(false);

  const defeatedBeastEvent = exploreLog.find(event => event.type === 'defeated_beast');
  const previousLevel = calculateLevel(adventurer!.xp - (defeatedBeastEvent?.xp_reward || 0));
  const currentLevel = calculateLevel(adventurer!.xp);
  const leveledUp = currentLevel > previousLevel;

  const itemXpReward = (defeatedBeastEvent?.xp_reward || 0) * 2;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContinue(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (leveledUp) {
      setShowLevelUpText(false);
      const timer = setTimeout(() => setShowLevelUpText(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowLevelUpText(false);
    }
  }, [leveledUp]);

  const handleContinue = () => {
    setShowBeastRewards(false);
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={screenVariants}
      style={styles.container}
    >
      <Box sx={styles.content}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h2" sx={styles.title}>
            {BEAST_NAMES[defeatedBeastEvent?.beast_id || 0]} Defeated!
          </Typography>
        </motion.div>

        <Box sx={styles.rewardsContainer}>
          {/* Main Rewards Section */}
          <motion.div
            custom={0}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Box sx={styles.mainRewardsCard}>
              <Typography sx={styles.sectionTitle}>Adventurer</Typography>
              <Box sx={styles.adventurerHeader}>
                <Box sx={styles.adventurerImageContainer}>
                  <Box
                    component="img"
                    src={'/images/mobile/adventurer.png'}
                    alt="Adventurer"
                    sx={styles.adventurerImage}
                  />
                </Box>
                <Box sx={styles.adventurerInfo}>
                  <Box sx={styles.rewardsGrid}>
                    {/* XP Reward */}
                    <Box sx={[styles.rewardItem, !defeatedBeastEvent?.gold_reward && styles.centeredReward]}>
                      <Typography sx={styles.rewardLabel}>XP Gained</Typography>
                      <motion.div
                        variants={numberVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Typography sx={styles.rewardValue}>+{defeatedBeastEvent?.xp_reward}</Typography>
                      </motion.div>
                    </Box>

                    {/* Gold Reward */}
                    {defeatedBeastEvent?.gold_reward !== null && defeatedBeastEvent?.gold_reward !== undefined && defeatedBeastEvent.gold_reward > 0 && (
                      <Box sx={styles.rewardItem}>
                        <Typography sx={styles.rewardLabel}>Gold Gained</Typography>
                        <motion.div
                          variants={numberVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Typography sx={styles.rewardValue}>+{defeatedBeastEvent.gold_reward}</Typography>

                            <Box
                              component="img"
                              src={'/images/mobile/gold.png'}
                              alt="Gold"
                              sx={{ width: '20px', height: '20px', mr: '2px' }}
                            />
                          </Box>
                        </motion.div>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ width: '100%', mt: 1.5 }}>
                <Box sx={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(128, 255, 0, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid rgba(128, 255, 0, 0.1)',
                }}>
                  <motion.div
                    custom={leveledUp ? 100 : Math.max(0, Math.min(100, (calculateProgress(adventurer!.xp))))}
                    initial="hidden"
                    animate="visible"
                    variants={xpBarVariants}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #80FF00 0%, #9dff33 100%)',
                      borderRadius: '4px',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '2px', px: 0.5 }}>
                  <Typography sx={{ color: '#80FF00', fontFamily: 'VT323, monospace', fontSize: '0.9rem' }}>{adventurer!.xp} XP</Typography>
                  {leveledUp ? (
                    showLevelUpText && (
                      <Typography sx={{ color: 'rgba(237, 207, 51, 0.7)', fontFamily: 'VT323, monospace', fontSize: '0.9rem' }}>
                        Level Up!
                      </Typography>
                    )
                  ) : (
                    <Typography sx={{ color: 'rgba(237, 207, 51, 0.7)', fontFamily: 'VT323, monospace', fontSize: '0.9rem' }}>
                      {calculateNextLevelXP(currentLevel) - adventurer!.xp} to next level
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </motion.div>

          {/* Item XP Section */}
          <motion.div
            custom={1}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Box sx={styles.itemsCard}>
              <Typography sx={styles.sectionTitle}>Equipped Items</Typography>
              <Box sx={styles.itemsGrid}>
                {Object.entries(slotIcons).map(([slot, icon], index) => {
                  const equippedItem = adventurer?.equipment[slot.toLowerCase() as keyof typeof adventurer.equipment];
                  if (!equippedItem || equippedItem.id === 0) return null;

                  return (
                    <Box key={slot} sx={styles.itemSlot}>
                      <Box sx={styles.itemImageContainer}>
                        <Box
                          component="img"
                          src={ItemUtils.getItemImage(equippedItem.id)}
                          alt={ItemUtils.getItemName(equippedItem.id)}
                          sx={styles.itemImage}
                        />
                      </Box>
                      <Box sx={styles.itemXpContainer}>
                        <Typography sx={styles.itemXpLabel}>+{itemXpReward} xp</Typography>
                        <Box sx={styles.itemXpBarContainer}>
                          <Box sx={styles.itemXpBarBackground}>
                            <motion.div
                              initial="hidden"
                              animate="visible"
                              variants={progressVariants}
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #80FF00 0%, #9dff33 100%)',
                                borderRadius: '2px',
                                width: `${Math.min(100, calculateProgress(equippedItem.xp))}%`,
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </motion.div>
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContinue ? 1 : 0, y: showContinue ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="contained"
            onClick={handleContinue}
            sx={styles.continueButton}
          >
            Continue
          </Button>
        </motion.div>
      </Box>
    </motion.div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(17, 17, 17, 0.95)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    maxWidth: '500px',
    pt: '20px',
    margin: '0 auto',
  },
  title: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
    textAlign: 'center',
    fontFamily: 'VT323, monospace',
  },
  rewardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    maxWidth: '500px',
  },
  mainRewardsCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 16px',
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.08), rgba(128, 255, 0, 0.03))',
    borderRadius: '12px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(128, 255, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
    backdropFilter: 'blur(8px)',
  },
  adventurerHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  adventurerImageContainer: {
    width: '72px',
    height: '72px',
    background: 'rgba(0,0,0,0.15)',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(128,255,0,0.15)',
    boxShadow: '0 2px 8px rgba(128,255,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adventurerImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  adventurerInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  adventurerLabel: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '8px',
    textShadow: '0 0 8px rgba(128,255,0,0.2)',
  },
  rewardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 1,
  },
  rewardItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.5,
    position: 'relative',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    height: '48px',
  },
  centeredReward: {
    gridColumn: '1 / -1',
  },
  rewardLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '1.0rem',
    fontFamily: 'VT323, monospace',
    marginBottom: '2px',
  },
  rewardValue: {
    color: '#80FF00',
    fontSize: '1.4rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
    textShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
  },
  levelUpBadge: {
    display: 'flex',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, rgba(237, 207, 51, 0.9), rgba(237, 207, 51, 0.8))',
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(237, 207, 51, 0.2)',
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(237, 207, 51, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
    marginTop: '8px',
  },
  levelUpText: {
    color: '#111111',
    fontSize: '1.1rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  itemsCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 16px',
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.08), rgba(128, 255, 0, 0.03))',
    borderRadius: '12px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(128, 255, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
    backdropFilter: 'blur(8px)',
  },
  sectionTitle: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '1.1rem',
    fontFamily: 'VT323, monospace',
    marginBottom: '12px',
    textAlign: 'center',
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 2,
  },
  itemSlot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.5,
  },
  itemImageContainer: {
    width: '48px',
    height: '48px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  itemXpContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    width: '100%',
  },
  itemXpLabel: {
    color: '#80FF00',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
    textShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
  },
  itemXpBarContainer: {
    width: '100%',
    height: '4px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '2px',
    overflow: 'hidden',
    border: '1px solid rgba(128, 255, 0, 0.1)',
  },
  itemXpBarBackground: {
    width: '100%',
    height: '100%',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '2px',
  },
  continueButton: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.15), rgba(128, 255, 0, 0.1))',
    borderRadius: '12px',
    color: '#80FF00',
    padding: '6px 40px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(128, 255, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
    '&:hover': {
      background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.2), rgba(128, 255, 0, 0.15))',
    },
  },
};
