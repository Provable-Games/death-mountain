import { useCallback, useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { addAddressPadding } from 'starknet';
import { useDynamicConnector } from '@/contexts/starknet';
import { useDungeon } from '@/dojo/useDungeon';
import { useFollowStore } from '@/stores/followStore';
import { useController } from '@/contexts/controller';

const POLL_INTERVAL = 30000; // 30 seconds

interface NewGameEvent {
  token_id: number;
  owner: string;
  player_name: string;
  minted_at: string;
}

export function useFollowedPlayerNotifications() {
  const { currentNetworkConfig } = useDynamicConnector();
  const { address } = useController();
  const dungeon = useDungeon();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { followedPlayers, getFollowedAddresses } = useFollowStore();

  // Track the last seen game timestamp to avoid duplicate notifications
  const lastSeenTimestampRef = useRef<number>(Date.now());
  const isPollingRef = useRef<boolean>(false);

  const watchGame = useCallback((gameId: number) => {
    navigate(`/${dungeon.id}/watch?id=${gameId}`);
  }, [navigate, dungeon.id]);

  const checkForNewGames = useCallback(async () => {
    if (isPollingRef.current) return;

    const followedAddresses = getFollowedAddresses();
    if (followedAddresses.length === 0) return;
    if (!address) return; // Don't poll if not logged in

    isPollingRef.current = true;

    try {
      // Build SQL query to check for new games from followed players
      const ownersList = followedAddresses
        .map((addr) => `"${addAddressPadding(addr)}"`)
        .join(',');

      // Query for recently minted games by followed players
      const url = `${currentNetworkConfig.toriiUrl}/sql?query=
        SELECT token_id, owner, player_name, minted_at
        FROM "relayer_0_0_1-TokenMetadataUpdate"
        WHERE owner IN (${ownersList})
        ORDER BY minted_at DESC
        LIMIT 10`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch new games:', response.statusText);
        return;
      }

      const data: NewGameEvent[] = await response.json();

      // Find games that were minted after our last check
      const newGames = data.filter((game) => {
        const mintedAt = new Date(game.minted_at).getTime();
        return mintedAt > lastSeenTimestampRef.current;
      });

      // Show notifications for new games
      for (const game of newGames) {
        const normalizedOwner = addAddressPadding(game.owner).toLowerCase();
        const followedPlayer = followedPlayers[normalizedOwner];
        const playerName = followedPlayer?.name || game.player_name || 'A followed player';

        enqueueSnackbar(`${playerName} just started a new game!`, {
          variant: 'info',
          autoHideDuration: 8000,
          action: (
            <Button
              size="small"
              color="inherit"
              onClick={() => watchGame(game.token_id)}
            >
              Watch
            </Button>
          ),
        });
      }

      // Update the last seen timestamp
      if (data.length > 0) {
        const latestMintedAt = Math.max(
          ...data.map((game) => new Date(game.minted_at).getTime())
        );
        lastSeenTimestampRef.current = Math.max(lastSeenTimestampRef.current, latestMintedAt);
      }
    } catch (error) {
      console.error('Error checking for new games:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [
    getFollowedAddresses,
    address,
    currentNetworkConfig.toriiUrl,
    followedPlayers,
    enqueueSnackbar,
    watchGame,
  ]);

  useEffect(() => {
    // Reset timestamp when component mounts to avoid stale notifications
    lastSeenTimestampRef.current = Date.now();

    // Only start polling if user is logged in and following someone
    const followedAddresses = getFollowedAddresses();
    if (!address || followedAddresses.length === 0) {
      return;
    }

    // Initial check after a short delay
    const initialTimeout = setTimeout(() => {
      checkForNewGames();
    }, 5000);

    // Set up polling interval
    const pollInterval = setInterval(() => {
      checkForNewGames();
    }, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(pollInterval);
    };
  }, [address, checkForNewGames, getFollowedAddresses]);

  return { checkForNewGames };
}
