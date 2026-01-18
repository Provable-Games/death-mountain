import { useStarknetApi } from '@/api/starknet';
import { useGameDirector } from '@/desktop/contexts/GameDirector';
import { useDungeon } from '@/dojo/useDungeon';
import { useGameEvents } from '@/dojo/useGameEvents';
import { useGameStore } from '@/stores/gameStore';
import { useEntityModel } from '@/types/game';
import { ExplorerReplayEvents, processRawGameEvent } from '@/utils/events';
import { calculateLevel } from '@/utils/game';
import { useQueries } from '@/utils/queries';
import { useDojoSDK } from '@dojoengine/sdk/react';
import CloseIcon from '@mui/icons-material/Close';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VideocamIcon from '@mui/icons-material/Videocam';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, Slider, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GamePage from './GamePage';

export default function WatchPage() {
  const { sdk } = useDojoSDK();
  const dungeon = useDungeon();
  const navigate = useNavigate();
  const { getGameEvents } = useGameEvents();
  const { enqueueSnackbar } = useSnackbar()
  const { processEvent, setEventQueue } = useGameDirector();
  const { gameId, adventurer, popExploreLog, spectating, setSpectating } = useGameStore();
  const { getGameState } = useStarknetApi();

  const [replayEvents, setReplayEvents] = useState<any[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  const { gameEventsQuery } = useQueries();
  const { getEntityModel } = useEntityModel();
  const [subscription, setSubscription] = useState<any>(null);

  const [searchParams] = useSearchParams();
  const game_id = Number(searchParams.get('id'));
  const beast = searchParams.get('beast');

  useEffect(() => {
    if (game_id) {
      setSpectating(true);
      subscribeEvents(game_id);
    } else {
      setSpectating(false);
      navigate(`/${dungeon.id}`);
    }
  }, [game_id]);

  useEffect(() => {
    if (beast && replayEvents.length > 0) {
      let [prefix, suffix, name] = beast.toLowerCase().split(/[-_]/);
      let replayIndex = replayEvents.findIndex((event) => event.type === 'beast'
        && event.beast?.baseName.toLowerCase() === name && event.beast?.specialPrefix?.toLowerCase() === prefix && event.beast?.specialSuffix?.toLowerCase() === suffix);

      if (replayIndex !== -1) {
        let adventurerIndex = replayEvents.slice(replayIndex).findIndex((event) => event.type === 'adventurer');
        jumpToIndex(replayIndex + adventurerIndex);
      } else {
        processEvent(replayEvents[0], true)
        replayForward();
      }
    }
  }, [beast, replayEvents]);

  useEffect(() => {
    if (replayEvents.length > 0 && replayIndex === 0 && !beast) {
      processEvent(replayEvents[0], true)
      replayForward();
    }
  }, [replayEvents]);

  // Sync slider value with replayIndex
  useEffect(() => {
    setSliderValue(replayIndex);
  }, [replayIndex]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        try {
          subscription.cancel();
        } catch (error) { }
      }
    };
  }, [subscription]);

  // Build efficient mapping of event index to adventurer level
  const eventLevelMap = useMemo(() => {
    if (replayEvents.length === 0) return new Map<number, number>();

    const levelMap = new Map<number, number>();
    let lastKnownXP = 0;
    let hasAdventurerXP = false;

    // Single pass: for each event, track the last known adventurer XP
    for (let i = 0; i < replayEvents.length; i++) {
      const event = replayEvents[i];
      if (event.type === 'adventurer' && event.adventurer?.xp !== undefined) {
        lastKnownXP = event.adventurer.xp;
        hasAdventurerXP = true;
      }
      // Map this index to the level based on the last known XP
      // If we haven't seen any adventurer events yet, default to level 1
      levelMap.set(i, hasAdventurerXP ? calculateLevel(lastKnownXP) : 1);
    }

    return levelMap;
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
    const gameState = await getGameState(gameId!);

    if (!gameState) {
      enqueueSnackbar('Failed to load game', { variant: 'warning', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
      return navigate(`/${dungeon.id}`);
    }

    const events = await getGameEvents(gameId!);

    if (gameState.adventurer.health > 0) {
      if (subscription) {
        try {
          subscription.cancel();
        } catch (error) { }
      }

      const [_, sub] = await sdk.subscribeEventQuery({
        query: gameEventsQuery(gameId!),
        callback: ({ data, error }: { data?: any[]; error?: Error }) => {
          if (data && data.length > 0) {
            let events = data
              .filter((entity: any) =>
                Boolean(getEntityModel(entity, "GameEvent"))
              )
              .filter((entity: any) =>
                getEntityModel(entity, "GameEvent")?.adventurer_id === gameId
              )
              .map((entity: any) => processRawGameEvent(getEntityModel(entity, "GameEvent"), dungeon));

            setEventQueue((prev: any) => [...prev, ...events]);
          }
        },
      });

      events.forEach((event: any) => {
        processEvent(event, true);
      });

      setSubscription(sub);
    } else {
      setReplayEvents(events);
    }
  };

  const handleEndWatching = () => {
    setSpectating(false);
    navigate(`/${dungeon.id}`);
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

  const jumpToIndex = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= replayEvents.length) return;
    if (targetIndex === replayIndex) return;

    // Process events rapidly from current index to target index
    if (targetIndex > replayIndex) {
      // Move forward - process all events from current to target
      for (let i = replayIndex + 1; i <= targetIndex; i++) {
        processEvent(replayEvents[i], true);
      }
    } else {
      // Move backward - process events in reverse
      for (let i = replayIndex; i > targetIndex; i--) {
        const event = replayEvents[i];
        if (ExplorerReplayEvents.includes(event.type)) {
          popExploreLog();
        } else {
          processEvent(event, true);
        }
      }
    }

    setReplayIndex(targetIndex);
  }

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    // Update slider value for visual feedback while dragging
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setSliderValue(Math.round(value));
  }

  const handleSliderChangeCommitted = (_event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    // Only jump when user releases the slider
    const targetIndex = Array.isArray(newValue) ? newValue[0] : newValue;
    jumpToIndex(Math.max(1, Math.round(targetIndex)));
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

            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-evenly', gap: '8px' }}>
              <Button
                disabled={isPlaying}
                onClick={replayBackward}
                sx={styles.controlButton}
              >
                <SkipPreviousIcon />
              </Button>

              <Box sx={{ flex: 1, px: 1 }}>
                <Slider
                  value={sliderValue}
                  min={1}
                  max={Math.max(0, replayEvents.length - 1)}
                  onChange={handleSliderChange}
                  onChangeCommitted={handleSliderChangeCommitted}
                  disabled={isPlaying || replayEvents.length === 0}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => {
                    const level = eventLevelMap.get(value) || 1;
                    return `Lvl ${level}`;
                  }}
                  sx={styles.slider}
                  size="small"
                />
              </Box>

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
  slider: {
    color: 'rgba(128, 255, 0, 1)',
    '& .MuiSlider-thumb': {
      '&:hover, &.Mui-focusVisible': {
        boxShadow: '0 0 0 8px rgba(128, 255, 0, 0.16)',
      },
    },
    '& .MuiSlider-track': {
      backgroundColor: 'rgba(128, 255, 0, 1)',
    },
    '& .MuiSlider-rail': {
      backgroundColor: 'rgba(128, 255, 0, 0.3)',
    },
    '& .MuiSlider-valueLabel': {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'rgba(128, 255, 0, 1)',
      border: '1px solid rgba(128, 255, 0, 0.4)',
      fontSize: '0.75rem',
      '&::before': {
        borderTopColor: 'rgba(128, 255, 0, 0.4)',
      },
    },
    '&.Mui-disabled': {
      color: 'rgba(128, 255, 0, 0.5)',
      '& .MuiSlider-track': {
        backgroundColor: 'rgba(128, 255, 0, 0.5)',
      },
      '& .MuiSlider-rail': {
        backgroundColor: 'rgba(128, 255, 0, 0.2)',
      },
    },
  },
};