import { useStarknetApi } from '@/api/starknet';
import { useGameDirector } from '@/desktop/contexts/GameDirector';
import { useGameStore } from '@/stores/gameStore';
import { useEntityModel } from '@/types/game';
import { ExplorerReplayEvents, processRawGameEvent } from '@/utils/events';
import { useQueries } from '@/utils/queries';
import { useDojoSDK } from '@dojoengine/sdk/react';
import CloseIcon from '@mui/icons-material/Close';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VideocamIcon from '@mui/icons-material/Videocam';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GamePage from './GamePage';

export default function WatchPage() {
  const { sdk } = useDojoSDK();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar()
  const { gameEventsQuery } = useQueries();
  const { getEntityModel } = useEntityModel();
  const { spectating, setSpectating, processEvent, setEventQueue, eventsProcessed, setEventsProcessed } = useGameDirector();
  const { gameId, adventurer, popExploreLog } = useGameStore();
  const { getGameState } = useStarknetApi();

  const [subscription, setSubscription] = useState<any>(null);
  const [replayEvents, setReplayEvents] = useState<any[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [searchParams] = useSearchParams();
  const game_id = Number(searchParams.get('id'));

  useEffect(() => {
    if (false) {
      setSpectating(true);
      subscribeEvents(game_id);
    } else {
      setSpectating(false);
      enqueueSnackbar('Replays currently not available', { variant: 'warning', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
      navigate('/survivor');
    }
  }, [game_id]);

  useEffect(() => {
    if (replayEvents.length > 0 && replayIndex === 0) {
      processEvent(replayEvents[0], true)
      replayForward();
    }
  }, [replayEvents]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPlaying) return; // Don't handle keyboard events while playing

      if (event.key === 'ArrowRight') {
        replayForward();
      } else if (event.key === 'ArrowLeft') {
        replayBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [replayIndex, isPlaying]); // Add dependencies

  const subscribeEvents = async (gameId: number) => {
    if (subscription) {
      try {
        subscription.cancel();
      } catch (error) { }
    }

    const [initialData, sub] = await sdk.subscribeEventQuery({
      query: gameEventsQuery(gameId),
      callback: ({ data, error }: { data?: any[]; error?: Error }) => {
        if (data && data.length > 0) {
          let events = data
            .filter((entity: any) =>
              Boolean(getEntityModel(entity, "GameEvent"))
            )
            .map((entity: any) => processRawGameEvent(getEntityModel(entity, "GameEvent")));

          setEventQueue((prev: any) => [...prev, ...events]);
        }
      },
    });

    let events = (initialData?.getItems() || [])
      .filter((entity: any) => Boolean(getEntityModel(entity, "GameEvent")))
      .map((entity: any) => processRawGameEvent(getEntityModel(entity, "GameEvent")))
      .sort((a, b) => a.action_count - b.action_count);

    const gameState = await getGameState(gameId!);

    if (!gameState || events.length === 0) {
      enqueueSnackbar('Failed to load game', { variant: 'warning', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
      return navigate("/survivor");
    }

    if (gameState.adventurer.health > 0) {
      events.forEach((event: any) => {
        processEvent(event, true);
      });
    } else {
      setReplayEvents(events);
    }

    setSubscription(sub);
  };

  const handleEndWatching = () => {
    setSpectating(false);
    navigate('/survivor');
  };

  const handlePlayPause = (play: boolean) => {
    if (play) {
      setEventQueue(replayEvents.slice(replayIndex));
    } else {
      setReplayIndex(prev => prev + eventsProcessed + 1);
      setEventQueue([]);
      setEventsProcessed(0);
    }

    setIsPlaying(play);
  };

  const replayForward = () => {
    if (replayIndex >= replayEvents.length - 1) return;

    let currentIndex = replayIndex + 1;
    while (currentIndex <= replayEvents.length - 1) {
      let currentEvent = replayEvents[currentIndex];
      processEvent(currentEvent, true);

      if (currentEvent.type === 'adventurer' && currentEvent.adventurer?.stat_upgrades_available === 0) {
        break;
      }

      if (currentEvent.type === 'attack' && replayEvents[currentIndex + 1]?.type !== 'adventurer') {
        break;
      }

      if (currentEvent.type === 'beast_attack' && replayEvents[currentIndex + 1]?.type !== 'adventurer') {
        break;
      }

      currentIndex++;
    }

    setReplayIndex(currentIndex);
  }

  const replayBackward = () => {
    if (replayIndex < 1) return;

    let currentIndex = replayIndex - 1;
    while (currentIndex > 0) {
      let event = replayEvents[currentIndex];
      if (ExplorerReplayEvents.includes(event.type)) {
        popExploreLog()
      } else {
        processEvent(event, true);
      }

      if (event.type === 'adventurer' && event.adventurer?.stat_upgrades_available === 0) {
        if (event.adventurer?.beast_health > 0) {
          if (replayEvents[currentIndex - 1]?.type === 'beast') {
            processEvent(replayEvents[currentIndex - 1], true);
          } else if (replayEvents[currentIndex - 1]?.type === 'ambush') {
            processEvent(replayEvents[currentIndex - 2], true);
          }
        }

        break;
      }

      currentIndex--;
    }

    setReplayIndex(currentIndex);
  }

  if (!spectating) return null;

  const isLoading = !gameId || !adventurer;

  return (
    <>
      {!isLoading && <Box sx={styles.overlay}>
        {replayEvents.length === 0 ? (
          <>
            <Box />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <VisibilityIcon sx={styles.visibilityIcon} />
              <Typography sx={styles.text}>
                spectating
              </Typography>
            </Box>

            <CloseIcon sx={styles.closeIcon} onClick={handleEndWatching} />
          </>
        ) : (
          <>
            <VideocamIcon sx={styles.theatersIcon} />

            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-evenly' }}>
              <Button
                disabled={isPlaying}
                onClick={replayBackward}
                sx={styles.controlButton}
              >
                <SkipPreviousIcon />
              </Button>

              {/* <Button
                onClick={() => handlePlayPause(!isPlaying)}
                sx={styles.controlButton}
              >
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </Button> */}

              <Button
                onClick={replayForward}
                disabled={isPlaying}
                sx={styles.controlButton}
              >
                <SkipNextIcon />
              </Button>
            </Box>

            <ExitToAppIcon sx={styles.closeIcon} onClick={handleEndWatching} />
          </>
        )}
      </Box>}

      {spectating && <GamePage />}
    </>
  );
}

const styles = {
  overlay: {
    height: '52px',
    width: '444px',
    maxWidth: 'calc(100dvw - 6px)',
    position: 'fixed',
    bottom: '0px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '0 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    zIndex: 1000,
    boxSizing: 'border-box',
    border: '2px solid rgba(128, 255, 0, 0.4)',
    borderBottom: 'none',
  },
  visibilityIcon: {
    color: 'rgba(128, 255, 0, 1)',
  },
  closeIcon: {
    cursor: 'pointer',
    color: '#FF0000',
    '&:hover': {
      color: 'rgba(255, 0, 0, 0.6)',
    },
  },
  text: {
    color: 'rgba(128, 255, 0, 1)',
    fontSize: '1.1rem',
  },
  controlButton: {
    color: 'rgba(128, 255, 0, 1)',
    fontSize: '12px',
    '&:disabled': {
      color: 'rgba(128, 255, 0, 0.5)',
    },
  },
  theatersIcon: {
    color: '#EDCF33',
  },
};