import { useGameDirector } from "@/desktop/contexts/GameDirector";
import { useSound } from "@/desktop/contexts/Sound";
import { useGameStore } from "@/stores/gameStore";
import { streamIds } from "@/utils/cloudflare";
import { transitionVideos } from "@/utils/events";
import { Stream, StreamPlayerApi } from "@cloudflare/stream-react";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDesktopHotkey } from '@/desktop/hooks/useDesktopHotkey';
import HotkeyHint from '@/desktop/components/HotkeyHint';

const CUSTOMER_CODE = import.meta.env.VITE_PUBLIC_CLOUDFLARE_ID;

export default function VideoPlayer() {
  const { videoQueue, setVideoQueue } = useGameDirector();
  const { setShowOverlay } = useGameStore();
  const { hasInteracted, muted, volume } = useSound();

  const playerRef = useRef<StreamPlayerApi | undefined>(undefined);
  const [videoReady, setVideoReady] = useState(false);
  const [nextVideoReady, setNextVideoReady] = useState(false);

  const currentVideo = videoQueue[0];
  const isExploreVideo = currentVideo === streamIds.explore;
  // Only expose the skip binding for the follow-up animation (beast/event reveal).
  const isSkippableVideo = Boolean(currentVideo && !isExploreVideo);
  const skipHotkeyOptions = useMemo(() => ({
    enabled: isSkippableVideo,
    preventDefault: true,
  }), [isSkippableVideo]);

  // Drive the on-screen badge: dim it for the opener, light it once the skip is permitted.
  const skipHintVariant = isExploreVideo ? 'loading' : (isSkippableVideo ? 'active' : 'hidden');

  const handleEnded = useCallback(() => {
    if (!currentVideo) {
      return;
    }

    if (currentVideo === streamIds.explore && !nextVideoReady) {
      return;
    }

    const isLastVideo = !transitionVideos.includes(currentVideo) && videoQueue.length === 1;
    setShowOverlay(isLastVideo);
    setVideoReady(false);

    const delay = isLastVideo ? 500 : 0;
    setTimeout(() => {
      setVideoQueue(videoQueue.slice(1));
      setNextVideoReady(false);
    }, delay);
  }, [currentVideo, nextVideoReady, setShowOverlay, setVideoQueue, videoQueue]);

  useEffect(() => {
    if (videoQueue[0] === streamIds.explore && nextVideoReady) {
      handleEnded();
    }
  }, [handleEnded, nextVideoReady, videoQueue]);

  // Allow players to skip queued cinematics once the skippable clip is active; Enter intentionally remains disabled here.
  useDesktopHotkey('q', () => {
    if (!isSkippableVideo) {
      return;
    }

    const playerApi = playerRef.current as unknown as { pause?: () => void } | undefined;
    if (playerApi?.pause) {
      try {
        playerApi.pause();
      } catch {
        // ignore if pause is unsupported
      }
    }

    handleEnded();
  }, skipHotkeyOptions);

  function videoText() {
    if (videoQueue[0] === streamIds.explore) {
      return "Exploring"
    } else if (videoQueue[0] === streamIds.level_up) {
      return "Level Up"
    } else if (videoQueue[0] === streamIds.specials_unlocked) {
      return "Item Specials Unlocked"
    }

    return ""
  }

  // Only surface the skip hint during the second, skippable animation.
  const canShowSkipHint = skipHintVariant !== 'hidden';

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={videoQueue[0]}
          initial={false}
          animate={{ opacity: videoReady ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: videoQueue[0] ? 1000 : 0 }}
        >
          {videoQueue[0] && (
            <>
              <Stream
                className="videoContainer"
                src={videoQueue[0]}
                customerCode={CUSTOMER_CODE}
                streamRef={playerRef}
                loop={videoQueue[0] === streamIds.explore && !nextVideoReady}
                autoplay
                preload="auto"
                controls={false}
                muted={!hasInteracted || muted}
                volume={volume}
                onEnded={handleEnded}
                onCanPlayThrough={() => setVideoReady(true)}
              />

              <Box sx={styles.loadingText}>
                <Typography sx={{ fontSize: '24px', fontWeight: '600' }}>{videoText()}</Typography>
              </Box>
              {canShowSkipHint && (
                <Box sx={[
                  styles.skipHint,
                  skipHintVariant === 'loading' && styles.skipHintDisabled,
                ]}>
                  <Typography sx={styles.skipText}>
                    Skip <HotkeyHint keys={'Q'} />
                  </Typography>
                </Box>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {videoQueue[1] && (
        <Stream
          key={videoQueue[1]}
          className="videoContainer-hidden"
          src={videoQueue[1]}
          customerCode={CUSTOMER_CODE}
          preload="auto"
          autoplay
          controls={false}
          muted={true}
          onCanPlayThrough={() => setNextVideoReady(true)}
        />
      )}
    </>
  );
}

const styles = {
  loadingText: {
    position: 'absolute',
    zIndex: 1001,
    bottom: '20px',
    right: '20px',
    textAlign: 'center',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
    animation: 'blink 2.5s infinite',
    '@keyframes blink': {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.3 },
      '100%': { opacity: 1 }
    }
  },
  skipHint: {
    position: 'absolute',
    top: '32px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(24, 40, 24, 0.85)',
    border: '2px solid #083e22',
    borderRadius: '20px',
    padding: '6px 16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
    zIndex: 1001,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease-in-out, border-color 0.2s ease-in-out',
  },
  skipHintDisabled: {
    // Keep the badge visible during the intro clip without hinting the action is available yet.
    opacity: 0.45,
    borderColor: 'rgba(8, 62, 34, 0.5)',
  },
  skipText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: '0.9rem',
    letterSpacing: '1px',
    color: '#d7c529',
    textTransform: 'uppercase',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
  },
};
