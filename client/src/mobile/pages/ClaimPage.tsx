import { useStarknetApi } from '@/api/starknet';
import { useController } from "@/contexts/controller";
import { NETWORKS } from "@/utils/networkConfig";
import { screenVariants } from '@/utils/animations';
import { Box, Button, CircularProgress, Typography, keyframes } from '@mui/material';
import { useAccount } from '@starknet-react/core';
import { motion } from 'framer-motion';
import { useGameTokens as useMetagameTokens } from "metagame-sdk/sql";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addAddressPadding } from "starknet";

export default function ClaimPage() {
  const { login, isPending } = useController();
  const { address: controllerAddress, account } = useAccount();
  const navigate = useNavigate();

  const { getUnclaimedAdventurerRewards } = useStarknetApi();
  const DUNGEON_ADDRESS = NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS].dungeon;

  const { games: gamesData, loading: gamesLoading } = useMetagameTokens({
    mintedByAddress: addAddressPadding(NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS].dungeon),
    gameOver: true,
    owner: controllerAddress || "0x0",
    limit: 10000,
  });

  const [loading, setLoading] = useState(true);
  const [eligibleAdventurers, setEligibleAdventurers] = useState<number[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [unclaimedCount, setUnclaimedCount] = useState(0);

  // Get claimed IDs from localStorage for this address
  const getClaimedIds = (): number[] => {
    if (!controllerAddress) return [];
    const key = `claimedRewards_${controllerAddress}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  };

  // Save claimed IDs to localStorage
  const saveClaimedIds = (ids: number[]) => {
    if (!controllerAddress) return;
    const key = `claimedRewards_${controllerAddress}`;
    const existing = getClaimedIds();
    const combined = [...new Set([...existing, ...ids])];
    localStorage.setItem(key, JSON.stringify(combined));
  };

  const checkUnclaimedRewards = async () => {
    if (!gamesData || gamesLoading || isPending) return;

    if (!controllerAddress) {
      setLoading(false);
      return;
    }

    const adventurerIds = gamesData.filter((game) => game.score >= 9).map((game) => game.token_id);

    if (adventurerIds.length === 0) {
      setUnclaimedCount(0);
      setEligibleAdventurers([]);
      setLoading(false);
      return;
    }

    // Filter out already claimed IDs from localStorage
    const claimedIds = getClaimedIds();
    const idsToCheck = adventurerIds.filter(id => !claimedIds.includes(id));

    if (idsToCheck.length === 0) {
      // All adventurers have already claimed rewards
      setUnclaimedCount(0);
      setEligibleAdventurers([]);
      setLoading(false);
      return;
    }

    try {
      const unclaimedRewards = await getUnclaimedAdventurerRewards(idsToCheck);

      const unclaimedIds = idsToCheck.filter((_, index) => {
        const result = unclaimedRewards[index]?.result;
        return result && result[0] === "0x0";
      });

      // Save all checked IDs (both claimed and unclaimed) to localStorage
      // This prevents us from checking them again in future visits
      const alreadyClaimedIds = idsToCheck.filter((_, index) => {
        const result = unclaimedRewards[index]?.result;
        return result && result[0] !== "0x0";
      });

      if (alreadyClaimedIds.length > 0) {
        saveClaimedIds(alreadyClaimedIds);
      }
      
      setEligibleAdventurers(unclaimedIds);
      setUnclaimedCount(unclaimedIds.length);
    } catch (error) {
      console.error("Error checking unclaimed rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUnclaimedRewards();
  }, [gamesData, gamesLoading]);

  const claimAll = async () => {
    if (!account || eligibleAdventurers.length === 0) return;

    setClaiming(true);
    const BATCH_SIZE = 50;
    let claimedCount = 0;
    const successfullyClaimed: number[] = [];

    try {
      // Process in batches of 50
      for (let i = 0; i < eligibleAdventurers.length; i += BATCH_SIZE) {
        const batch = eligibleAdventurers.slice(i, i + BATCH_SIZE);
        const calls = batch.map((gameId) => ({
          contractAddress: DUNGEON_ADDRESS,
          entrypoint: "claim_reward_token",
          calldata: [gameId],
        }));

        try {
          const tx = await account.execute(calls);
          await account.waitForTransaction(tx.transaction_hash);
          claimedCount += batch.length;
          successfullyClaimed.push(...batch);
        } catch (error) {
          console.error(`Error claiming batch:`, error);
        }
      }

      // Save successfully claimed IDs to localStorage
      if (successfullyClaimed.length > 0) {
        saveClaimedIds(successfullyClaimed);
      }

      setTotalClaimed(claimedCount);
      setClaimSuccess(true);
    } catch (error) {
      console.error("Error claiming rewards:", error);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={screenVariants}
      style={styles.container}
    >
      {!controllerAddress ? (
        <Box sx={styles.content}>
          <Typography sx={styles.title}>Connect Wallet</Typography>
          <Typography sx={styles.subtitle}>
            Connect your wallet to check for unclaimed rewards
          </Typography>
          <Box sx={styles.buttonContainer}>
            <Button
              onClick={login}
              variant="contained"
              sx={styles.loginButton}
              fullWidth
            >
              Log In
            </Button>
          </Box>
        </Box>
      ) : claimSuccess ? (
        <Box sx={styles.content}>
          <Box sx={styles.successIcon}>🎉</Box>
          <Typography sx={styles.title}>Success!</Typography>
          <Box sx={styles.statsContainer}>
            <Box sx={styles.statCard}>
              <Typography sx={styles.statLabel}>Rewards Claimed</Typography>
              <Typography sx={styles.statValue}>{totalClaimed}</Typography>
            </Box>
          </Box>
          <Box sx={styles.buttonContainer}>
            <Button
              onClick={() => navigate('/survivor')}
              variant="contained"
              sx={styles.continueButton}
            >
              Back to Main Menu
            </Button>
          </Box>
        </Box>
      ) : loading || gamesLoading ? (
        <Box sx={styles.content}>
          <CircularProgress size={60} sx={{ color: '#80FF00', mb: 3 }} />
          <Typography sx={styles.loadingText}>
            Checking for unclaimed rewards<span className='dotLoader white' />
          </Typography>
        </Box>
      ) : (
        <Box sx={styles.content}>
          <Typography sx={styles.title}>
            Unclaimed Rewards
          </Typography>
          
          {unclaimedCount === 0 ? (
            <>
              <Typography sx={styles.emptyText}>
                You have no adventurers with unclaimed rewards.
              </Typography>
              <Box sx={styles.buttonContainer}>
                <Button
                  onClick={() => navigate('/survivor')}
                  variant="outlined"
                  sx={styles.backButton}
                >
                  Back to Menu
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box sx={styles.statsContainer}>
                <Box sx={styles.statCard}>
                  <Typography sx={styles.statLabel}>Unclaimed Adventurers</Typography>
                  <Typography sx={styles.statValue}>{unclaimedCount}</Typography>
                </Box>
              </Box>
              
              <Typography sx={styles.infoText}>
                Claim rewards for all eligible adventurers at once
              </Typography>

              <Box sx={styles.buttonContainer}>
                <Button
                  onClick={claimAll}
                  variant="contained"
                  sx={styles.claimButton}
                  disabled={claiming}
                  fullWidth
                >
                  {claiming ? (
                    <>
                      <CircularProgress size={20} sx={{ color: 'inherit', mr: 1 }} />
                      Claiming...
                    </>
                  ) : (
                    'Claim All Rewards'
                  )}
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}
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
    padding: '20px',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 3,
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    color: "#80FF00",
    fontWeight: "bold",
    textShadow: "0 0 10px rgba(128, 255, 0, 0.3)",
    textAlign: "center" as const,
    fontSize: "2rem",
    lineHeight: "2.2rem",
    fontFamily: "VT323, monospace",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "1.1rem",
    fontFamily: "VT323, monospace",
    textAlign: "center" as const,
    lineHeight: 1.5,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "1.2rem",
    fontFamily: "VT323, monospace",
    display: 'flex',
    alignItems: 'baseline',
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "1.2rem",
    fontFamily: "VT323, monospace",
    textAlign: "center" as const,
    marginBottom: 2,
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "1rem",
    fontFamily: "VT323, monospace",
    textAlign: "center" as const,
    marginBottom: 1,
  },
  statsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: 2,
    width: "100%",
  },
  statCard: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "16px 24px",
    gap: 1,
    background: "rgba(128, 255, 0, 0.1)",
    borderRadius: "12px",
    border: "1px solid rgba(128, 255, 0, 0.2)",
    minWidth: "220px",
  },
  statLabel: {
    color: "rgba(128, 255, 0, 0.7)",
    fontSize: "1.1rem",
    fontFamily: "VT323, monospace",
  },
  statValue: {
    color: "#80FF00",
    fontSize: "2.5rem",
    fontFamily: "VT323, monospace",
    fontWeight: "bold",
    minHeight: "2.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: 1,
    animation: `${tokenGlow} 2s ease-in-out infinite`,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    marginTop: 2,
  },
  claimButton: {
    background: 'linear-gradient(135deg, #80FF00 0%, #66DD00 100%)',
    color: '#1a1a1a',
    fontSize: "1.3rem",
    fontWeight: "bold",
    height: "48px",
    borderRadius: "8px",
    boxShadow: '0 0 20px rgba(128, 255, 0, 0.3)',
    fontFamily: "VT323, monospace",
    '&:hover': {
      background: 'linear-gradient(135deg, #66DD00 0%, #55CC00 100%)',
      boxShadow: '0 0 30px rgba(128, 255, 0, 0.5)',
    },
    '&:disabled': {
      background: "rgba(128, 255, 0, 0.08)",
      color: "rgba(128, 255, 0, 0.5)",
      border: "1px solid rgba(128, 255, 0, 0.1)",
      cursor: "not-allowed",
      '&:hover': {
        background: "rgba(128, 255, 0, 0.08)",
      },
    },
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
    fontFamily: "VT323, monospace",
    "&:hover": {
      background: "rgba(128, 255, 0, 0.25)",
    },
  },
  loginButton: {
    background: 'linear-gradient(135deg, #ffe082 0%, #ffb300 100%)',
    color: '#1a1a1a',
    fontSize: "1.3rem",
    fontWeight: "bold",
    height: "48px",
    borderRadius: "8px",
    boxShadow: '0 0 20px rgba(255, 224, 130, 0.3)',
    fontFamily: "VT323, monospace",
    '&:hover': {
      background: 'linear-gradient(135deg, #ffb300 0%, #ff8800 100%)',
      boxShadow: '0 0 30px rgba(255, 224, 130, 0.6)',
    },
  },
  backButton: {
    width: '200px',
    fontSize: "1.2rem",
    fontWeight: "bold",
    height: "42px",
    color: "#80FF00",
    borderRadius: "6px",
    border: "1px solid rgba(128, 255, 0, 0.3)",
    fontFamily: "VT323, monospace",
    "&:hover": {
      background: "rgba(128, 255, 0, 0.08)",
      border: "1px solid rgba(128, 255, 0, 0.5)",
    },
  },
};