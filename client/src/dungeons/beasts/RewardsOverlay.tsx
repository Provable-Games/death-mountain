import { useController } from '@/contexts/controller';
import { OPENING_TIME, useStatistics } from '@/contexts/Statistics';
import { useSystemCalls } from '@/dojo/useSystemCalls';
import { useGameStore } from '@/stores/gameStore';
import { formatRewardNumber } from '@/utils/utils';
import { keyframes } from '@emotion/react';
import { Box, Button, Link, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RewardsOverlayProps {
  gameId: number;
  adventurerLevel: number;
  onClose: () => void;
}

export default function RewardsOverlay({ gameId, adventurerLevel, onClose }: RewardsOverlayProps) {
  const { claimSurvivorTokens } = useSystemCalls();
  const { tokenBalances } = useController();
  const { remainingSurvivorTokens, fetchRewardTokensClaimed } = useStatistics();
  const { metadata } = useGameStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentBalance] = useState(Number(tokenBalances.SURVIVOR || 0));
  const [rewardAmount, setRewardAmount] = useState(0);
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  const [animatedDungeonTotal, setAnimatedDungeonTotal] = useState(remainingSurvivorTokens);
  const [animatedWalletBalance, setAnimatedWalletBalance] = useState(Number(tokenBalances.SURVIVOR || 0));
  const [showMovingToken, setShowMovingToken] = useState(false);

  const mintedAt = Math.floor((metadata?.minted_at || Date.now()) / 1000);
  let levelMultiplier;

  if (mintedAt < OPENING_TIME + 1209600) {
    levelMultiplier = 1;
  } else if (mintedAt < OPENING_TIME + 1209600 + 1209600) {
    levelMultiplier = 4;
  } else {
    levelMultiplier = 2;
  }

  // Calculate reward based on level with multiplier
  useEffect(() => {
    setRewardAmount(Math.min(50, adventurerLevel) * levelMultiplier);
  }, [adventurerLevel]);

  const handleClaimReward = async () => {
    if (!gameId) return;

    claimSurvivorTokens(gameId);

    setIsAnimating(true);
    setShowMovingToken(true);
    animateVaultCountdown();

    // Phase 3: Start wallet countup when token reaches wallet
    setTimeout(() => {
      setShowMovingToken(false);
      animateWalletCountup();
    }, 1500);

    // Phase 4: Show success state
    setTimeout(() => {
      setIsAnimating(false);
      setShowRewardDetails(true);
    }, 2700);
  };

  const handleContinue = () => {
    fetchRewardTokensClaimed();
    onClose();
  };

  const animateVaultCountdown = () => {
    const startDungeonTotal = remainingSurvivorTokens || 0;
    const endDungeonTotal = (remainingSurvivorTokens || 0) - rewardAmount;
    const duration = 1000;
    const startTime = Date.now();

    const updateVault = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear animation without easing
      const newDungeonTotal = Math.floor(startDungeonTotal + (endDungeonTotal - startDungeonTotal) * progress);
      setAnimatedDungeonTotal(newDungeonTotal);

      if (progress < 1) {
        requestAnimationFrame(updateVault);
      }
    };

    updateVault();
  };

  const animateWalletCountup = () => {
    const startWalletBalance = currentBalance;
    const endWalletBalance = currentBalance + rewardAmount;
    const duration = 1000;
    const startTime = Date.now();

    const updateWallet = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear animation without easing
      const newWalletBalance = Math.floor(startWalletBalance + (endWalletBalance - startWalletBalance) * progress);
      setAnimatedWalletBalance(newWalletBalance);

      if (progress < 1) {
        requestAnimationFrame(updateWallet);
      }
    };

    updateWallet();
  };


  return (
    <Box sx={styles.container}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/start.png')` }]} />

      <Box sx={styles.content}>
        <Typography variant="h2" fontWeight="bold">
          YOU'VE EARNED SURVIVOR TOKENS!
        </Typography>

        <Box sx={styles.statsContainer} mt={1}>
          <Box sx={styles.statCard}>
            <Typography sx={styles.statLabel}>Your Level</Typography>
            <Typography sx={styles.statValue}>{adventurerLevel}</Typography>
          </Box>

          <Box sx={styles.statCard}>
            <Typography sx={styles.statLabel}>Tokens Earned</Typography>
            <Typography sx={styles.statValue}>{formatRewardNumber(rewardAmount)}</Typography>
          </Box>
        </Box>

        <AnimatePresence>
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '20px',
              background: 'rgba(24, 40, 24, 0.9)',
              borderRadius: '12px',
              border: '2px solid #083e22',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            <Box sx={styles.walletTokens}>
              <Box sx={styles.iconContainer}>
                <Typography sx={styles.transferLabel}>Dungeon Vault</Typography>
              </Box>
              <Box sx={styles.tokenSlot}>
                <motion.img
                  src="/images/vault.png"
                  alt="Survivor Token"
                  height={64}
                />
              </Box>
              <Typography sx={styles.tokenCount}>
                {animatedDungeonTotal?.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={styles.transferPath}>
              {showMovingToken ? (
                <motion.img
                  src="/images/survivor_token.png"
                  alt="Moving Token"
                  height={48}
                  style={{
                    position: 'absolute',
                    zIndex: 10,
                    left: -35,
                  }}
                  initial={{ x: 0, y: 0, scale: 1 }}
                  animate={{
                    x: 280,
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                />
              ) : !isAnimating ? (
                showRewardDetails ? (
                  <Box sx={styles.successContainer}>
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        delay: 0.2
                      }}
                    >
                      <Typography sx={styles.rewardClaimedText}>
                        Reward Claimed!
                      </Typography>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        ease: "easeOut",
                        delay: 0.6
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleContinue}
                        sx={{
                          background: '#d0c98d',
                          border: '2px solid rgba(208, 201, 141, 0.5)',
                          borderRadius: '8px',
                          padding: '12px 20px',
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          textTransform: 'none',
                          minWidth: '160px',
                          color: '#2c3e2c',
                          textAlign: 'center',
                          justifyContent: 'center',
                          marginTop: 2,
                        }}
                      >
                        Play Again
                      </Button>
                    </motion.div>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClaimReward}
                    sx={{
                      animation: `${buttonGlow} 1.5s ease-in-out infinite`,
                      background: '#d0c98d',
                      border: '2px solid rgba(208, 201, 141, 0.5)',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      textTransform: 'none',
                      minWidth: '160px',
                      color: '#2c3e2c',
                      textAlign: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Claim Tokens
                  </Button>
                )
              ) : null}
            </Box>

            <Box sx={styles.walletTokens}>
              <Box sx={styles.iconContainer}>
                <Typography sx={styles.transferLabel}>Your Wallet</Typography>
              </Box>
              <Box sx={styles.tokenSlot}>
                <motion.img
                  src="/images/inventory.png"
                  alt="Survivor Token"
                  height={80}
                  style={{ filter: 'hue-rotate(40deg) saturate(1.5) brightness(1.15) contrast(1.2)' }}
                />
              </Box>
              <Typography sx={styles.tokenCount}>
                {animatedWalletBalance.toLocaleString()}
              </Typography>
            </Box>
          </motion.div>
        </AnimatePresence>

        <Box sx={styles.messageContainer}>
          <Typography sx={styles.message}>
            Each SURVIVOR token is part of an onchain loop: as players engage, the system buys back tokens into the treasury, strengthening the ecosystem SURVIVOR holders govern.
          </Typography>
          <Link
            href="#"
            sx={styles.learnMoreLink}
            onClick={(e) => {
              e.preventDefault();
              window.open('https://docs.provable.games/lootsurvivor/token', '_blank');
            }}
          >
            Learn more about Survivor Tokens
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

const tokenGlow = keyframes`
  0%, 100% { filter: brightness(1) drop-shadow(0 0 5px rgba(208, 201, 141, 0.2)); }
  50% { filter: brightness(1.05) drop-shadow(0 0 8px rgba(208, 201, 141, 0.3)); }
`;

const multiplierPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const buttonGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 8px rgba(208, 201, 141, 0.3), 0 0 10px rgba(208, 201, 141, 0.2);
    border-color: rgba(208, 201, 141, 0.5);
  }
  50% { 
    box-shadow: 0 0 12px rgba(208, 201, 141, 0.5), 0 0 20px rgba(208, 201, 141, 0.3);
    border-color: rgba(208, 201, 141, 0.7);
  }
`;

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#000',
  },
  content: {
    width: '580px',
    padding: '24px',
    boxSizing: 'border-box',
    border: '2px solid #083e22',
    borderRadius: '12px',
    background: 'rgba(24, 40, 24, 0.55)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  title: {
    color: '#d0c98d',
    fontWeight: 'bold',
    textShadow: '0 0 8px rgba(208, 201, 141, 0.3)',
    textAlign: 'center',
    fontSize: '2.2rem',
    fontFamily: 'Cinzel, Georgia, serif',
    background: 'linear-gradient(45deg, #d0c98d, #e8d5a3, #d0c98d)',
    backgroundSize: '200% 200%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    boxSizing: 'border-box',
    gap: 1,
    background: 'rgba(24, 40, 24, 0.9)',
    borderRadius: '12px',
    border: '2px solid #083e22',
    minWidth: '210px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
  },
  statLabel: {
    color: '#d0c98d',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  statValue: {
    color: '#d0c98d',
    fontSize: '1.5rem',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 'bold',
  },
  rewardDetailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '20px',
    background: 'rgba(24, 40, 24, 0.8)',
    borderRadius: '12px',
    border: '2px solid #083e22',
    width: '100%',
  },
  tokenDisplay: {
    animation: `${tokenGlow} 2s ease-in-out infinite`,
  },
  claimingMessage: {
    color: '#d0c98d',
    fontSize: '1.1rem',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
  },
  balanceInfo: {
    textAlign: 'center',
    marginTop: 2,
  },
  balanceLabel: {
    color: '#d0c98d',
    fontSize: '0.9rem',
    fontFamily: 'Cinzel, Georgia, serif',
    opacity: 0.8,
    marginBottom: 0.5,
  },
  balanceValue: {
    color: '#d0c98d',
    fontSize: '2rem',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, transparent, #d0c98d, transparent)',
    backgroundSize: '200% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '20px',
    boxSizing: 'border-box',
    background: 'rgba(24, 40, 24, 0.8)',
    borderRadius: '12px',
    border: '2px solid #083e22',
    width: '100%',
  },
  message: {
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  buttonContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  continueButton: {
    border: '2px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(24, 40, 24, 1)',
    minWidth: '250px',
    height: '48px',
    justifyContent: 'center',
    borderRadius: '8px',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 600,
    fontSize: '1.1rem',
    color: '#d0c98d',
    letterSpacing: '1px',
    '&:hover': {
      border: '2px solid rgba(34, 60, 34, 1)',
      background: 'rgba(34, 60, 34, 1)',
    },
    '&:disabled': {
      opacity: 0.5,
    },
  },
  multiplierContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.5,
  },
  multiplierText: {
    animation: `${multiplierPulse} 2s ease-in-out infinite`,
  },
  multiplierBadge: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    boxShadow: '0 0 5px rgba(255, 107, 53, 0.3)',
  },
  balanceContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
    marginTop: 2,
  },
  balanceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    background: 'rgba(8, 62, 34, 0.8)',
    borderRadius: '8px',
    border: '1px solid #083e22',
    minWidth: '200px',
  },
  rewardHighlight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(208, 201, 141, 0.1), rgba(255, 215, 0, 0.1))',
    borderRadius: '12px',
    border: '2px solid #d0c98d',
    width: '100%',
    marginTop: 2,
  },
  rewardTitle: {
    color: '#d0c98d',
    fontSize: '1.1rem',
    fontFamily: 'Cinzel, Georgia, serif',
    marginBottom: 1,
  },
  rewardAmount: {
    color: '#ffd700',
    fontSize: '1.8rem',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 'bold',
    textShadow: '0 0 5px rgba(255, 215, 0, 0.3)',
  },
  tokenTransferContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '20px',
    background: 'rgba(24, 40, 24, 0.9)',
    borderRadius: '12px',
    border: '2px solid #083e22',
    marginTop: 2,
    position: 'relative',
  },
  walletTokens: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '125px',
  },
  transferLabel: {
    color: '#d0c98d',
    fontSize: '0.9rem',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 'bold',
  },
  transferArrow: {
    fontSize: '2rem',
    color: '#d0c98d',
    textShadow: '0 0 5px rgba(208, 201, 141, 0.3)',
  },
  tokenCount: {
    color: '#d0c98d',
    fontSize: '1rem',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 'bold',
  },
  animatedNumber: {
    color: '#ffd700',
    fontSize: '1.2rem',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 'bold',
    textShadow: '0 0 5px rgba(255, 215, 0, 0.3)',
    transition: 'all 0.1s ease-out',
  },
  tokenSlot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px',
    minWidth: '60px',
  },
  transferPath: {
    position: 'relative',
    flex: 1,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.5,
  },
  vaultIcon: {
    fontSize: '1.5rem',
    filter: 'drop-shadow(0 0 5px rgba(255, 107, 53, 0.4))',
  },
  walletIcon: {
    fontSize: '1.5rem',
    filter: 'drop-shadow(0 0 5px rgba(208, 201, 141, 0.4))',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  rewardClaimedText: {
    color: '#d7c529',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  learnMoreLink: {
    fontSize: '0.9rem',
    color: 'rgba(208, 201, 141, 0.6)',
    textAlign: 'center',
    textDecoration: 'underline !important',
    fontStyle: 'italic',
    cursor: 'pointer',
    '&:hover': {
      color: 'rgba(208, 201, 141, 0.8)',
    },
  },
};