import { OPENING_TIME, useStatistics } from '@/contexts/Statistics';
import { useSystemCalls } from '@/dojo/useSystemCalls';
import { useGameStore } from '@/stores/gameStore';
import { screenVariants } from '@/utils/animations';
import { formatRewardNumber } from '@/utils/utils';
import { Box, Button, Link, Typography, keyframes } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RewardsScreenProps {
  gameId: number;
  adventurerLevel: number;
  onClose: () => void;
}

export default function RewardsScreen({ gameId, adventurerLevel, onClose }: RewardsScreenProps) {
  const { claimSurvivorTokens } = useSystemCalls();
  const { fetchRewardTokensClaimed } = useStatistics();
  const { metadata } = useGameStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [countdown, setCountdown] = useState(-1);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [isClaimed, setIsClaimed] = useState(false);

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
    setIsClaiming(true);
    setCountdown(rewardAmount);

    // Start smooth countdown animation using requestAnimationFrame
    const startCount = rewardAmount;
    const endCount = 0;
    // Dynamic duration: base 800ms + 20ms per token, capped at 2000ms for snappy feel
    const duration = Math.min(800 + (rewardAmount * 20), 2000);
    const startTime = Date.now();

    const updateCountdown = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear animation without easing
      const newCount = Math.floor(startCount + (endCount - startCount) * progress);
      setCountdown(newCount);

      if (progress < 1) {
        requestAnimationFrame(updateCountdown);
      } else {
        setIsClaiming(false);
        setIsClaimed(true);
      }
    };

    updateCountdown();
  };

  const handleContinue = () => {
    fetchRewardTokensClaimed();
    onClose();
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
        <Typography sx={styles.title}>
          You've Earned Survivor Tokens!
        </Typography>

        <Box sx={styles.statsContainer}>
          {isClaimed ? (
            <Box sx={styles.claimedCard}>
              <Typography sx={styles.claimedLabel} color="secondary">Tokens Claimed</Typography>
              <Typography sx={styles.claimedValue}>🎉</Typography>
            </Box>
          ) : (
            <Box sx={styles.statCard}>
              <Typography sx={styles.statLabel}>Tokens Earned</Typography>
              <Typography sx={styles.statValue}>
                {isClaiming ? formatRewardNumber(countdown) : formatRewardNumber(rewardAmount)}
              </Typography>
            </Box>
          )}
        </Box>

        <motion.img
          src="/images/survivor_token.png"
          alt="Survivor Token"
          style={styles.tokenImage}
          animate={{
            scale: isClaiming ? [1, 1.1, 1] : 1,
            rotate: isClaiming ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            duration: 0.5,
            repeat: isClaiming ? Infinity : 0,
            ease: "easeInOut"
          }}
        />

        <Box sx={styles.buttonContainer}>
          {countdown === 0 ? (
            <Button
              variant="contained"
              onClick={handleContinue}
              sx={styles.continueButton}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleClaimReward}
              sx={styles.continueButton}
              disabled={isClaiming}
            >
              {isClaiming ? 'Claiming...' : 'Claim Tokens'}
            </Button>
          )}
        </Box>

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
    </motion.div>
  );
}

const tokenGlow = keyframes`
  0%, 100% { 
    filter: brightness(1) drop-shadow(0 0 8px rgba(128, 255, 0, 0.3));
  }
  50% { 
    filter: brightness(1.1) drop-shadow(0 0 12px rgba(128, 255, 0, 0.5));
  }
`;

const styles = {
  container: {
    width: "100%",
    height: "calc(100dvh - 50px)",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(17, 17, 17, 0.95)",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: "#80FF00",
    fontWeight: "bold",
    textShadow: "0 0 10px rgba(128, 255, 0, 0.3)",
    textAlign: "center",
    fontSize: "2rem",
    lineHeight: "2.0rem",
  },
  statsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: 2,
    width: "100%",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px",
    gap: 1,
    background: "rgba(128, 255, 0, 0.1)",
    borderRadius: "12px",
    border: "1px solid rgba(128, 255, 0, 0.2)",
    minWidth: "200px",
  },
  statLabel: {
    color: "rgba(128, 255, 0, 0.7)",
    fontSize: "1.1rem",
    fontFamily: "VT323, monospace",
  },
  statValue: {
    color: "#80FF00",
    fontSize: "2rem",
    fontFamily: "VT323, monospace",
    fontWeight: "bold",
    minHeight: "2.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  claimedCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px",
    gap: 1,
    background: "rgba(128, 255, 0, 0.15)",
    borderRadius: "12px",
    border: "1px solid rgba(128, 255, 0, 0.3)",
    minWidth: "200px",
  },
  claimedLabel: {
    fontSize: "1.1rem",
    fontFamily: "VT323, monospace",
  },
  claimedValue: {
    color: "#80FF00",
    fontSize: "2.1rem",
    fontWeight: "bold",
    minHeight: "2.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "rgba(128, 255, 0, 0.1)",
    borderRadius: "50%",
    border: "1px solid rgba(128, 255, 0, 0.2)",
    animation: `${tokenGlow} 2s ease-in-out infinite`,
  },
  tokenImage: {
    width: "120px",
    height: "120px",
  },
  message: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "1.1rem",
    fontFamily: "VT323, monospace",
    textAlign: "center",
    lineHeight: 1.5,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  claimButton: {
    flex: 1,
    background: 'linear-gradient(135deg, #ffe082 0%, #ffb300 100%)',
    color: '#1a1a1a',
    fontSize: "1.3rem",
    fontWeight: "bold",
    height: "48px",
    borderRadius: "8px",
    boxShadow: '0 0 20px rgba(255, 224, 130, 0.3)',
    '&:hover': {
      background: 'linear-gradient(135deg, #ffb300 0%, #ff8800 100%)',
      boxShadow: '0 0 30px rgba(255, 224, 130, 0.6)',
    },
    animation: 'pulse 2s ease-in-out infinite',
    '@keyframes pulse': {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.02)' },
    },
  },
  claimingButton: {
    flex: 1,
    background: "rgba(128, 255, 0, 0.15)",
    color: "#80FF00",
    fontSize: "1.2rem",
    fontWeight: "bold",
    height: "42px",
    borderRadius: "6px",
    border: "1px solid rgba(128, 255, 0, 0.2)",
  },
  continueButton: {
    width: '250px',
    fontSize: "1.2rem",
    fontWeight: "bold",
    height: "42px",
    background: "rgba(128, 255, 0, 0.15)",
    color: "#80FF00",
    borderRadius: "6px",
    border: "1px solid rgba(128, 255, 0, 0.2)",
    "&:hover": {
      background: "rgba(128, 255, 0, 0.25)",
    },
    "&:disabled": {
      background: "rgba(128, 255, 0, 0.08)",
      color: "rgba(128, 255, 0, 0.5)",
      border: "1px solid rgba(128, 255, 0, 0.1)",
      cursor: "not-allowed",
      "&:hover": {
        background: "rgba(128, 255, 0, 0.08)",
      },
    },
  },
  learnMoreLink: {
    fontSize: "0.9rem",
    color: "rgba(128, 255, 0, 0.6)",
    textAlign: "center",
    textDecoration: "underline !important",
    fontStyle: "italic",
    cursor: "pointer",
    fontFamily: "VT323, monospace",
    "&:hover": {
      color: "rgba(128, 255, 0, 0.8)",
    },
  },
};