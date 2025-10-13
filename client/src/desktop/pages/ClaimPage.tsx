import { useStarknetApi } from '@/api/starknet';
import { useController } from "@/contexts/controller";
import { NETWORKS } from "@/utils/networkConfig";
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useAccount } from '@starknet-react/core';
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
      login();
      return;
    }

    const adventurerIds = gamesData.filter((game) => game.score >= 9).map((game) => game.token_id);

    if (adventurerIds.length === 0) {
      setEligibleAdventurers([]);
      setLoading(false);
      return;
    }

    // Filter out already claimed IDs from localStorage
    const claimedIds = getClaimedIds();
    const idsToCheck = adventurerIds.filter(id => !claimedIds.includes(id));

    if (idsToCheck.length === 0) {
      // All adventurers have already claimed rewards
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
    } catch (error) {
      console.error("Error checking unclaimed rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUnclaimedRewards();
  }, [gamesData, gamesLoading, isPending, controllerAddress]);

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
    <Box sx={styles.container}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/start.png')` }]} />
      <Box sx={styles.content}>
        {claimSuccess ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={styles.title}>Success!</Typography>
            <Typography sx={styles.text} mb={3}>
              Successfully claimed rewards for {totalClaimed} adventurer{totalClaimed !== 1 ? 's' : ''}.
            </Typography>
            <Button
              onClick={() => navigate('/survivor')}
              variant="contained"
              color="primary"
              sx={{
                width: 'auto',
                px: 3,
                py: 1
              }}
            >
              <Typography sx={styles.buttonText}>
                Back to Main Menu
              </Typography>
            </Button>
          </Box>
        ) : loading || gamesLoading ? (
          <Typography sx={styles.text}>Checking for unclaimed rewards...</Typography>
        ) : (
          <Box>
            <Typography sx={styles.title}>Unclaimed Rewards</Typography>
            {eligibleAdventurers.length === 0 ? (
              <Typography sx={styles.text}>
                You have no adventurers with unclaimed rewards.
              </Typography>
            ) : (
              <Box>
                <Typography sx={styles.text} mb={3}>
                  You have {eligibleAdventurers.length} adventurer{eligibleAdventurers.length !== 1 ? 's' : ''} who hasn't claimed rewards.
                </Typography>
                <Button
                  onClick={claimAll}
                  variant="contained"
                  color="primary"
                  disabled={claiming}
                  startIcon={claiming && <CircularProgress size={16} color="inherit" />}
                  sx={{
                    width: 'auto',
                    px: 3,
                    py: 1
                  }}
                >
                  <Typography sx={styles.buttonText}>
                    {claiming ? 'Claiming...' : 'Claim All'}
                  </Typography>
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100dvw',
    height: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
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
    opacity: 0.5,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 2,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#ffffff',
  },
  text: {
    fontSize: '16px',
    color: '#ffffff',
  },
  buttonText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 600,
    color: '#000',
    textAlign: 'center',
  },
};