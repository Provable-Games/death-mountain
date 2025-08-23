import { useGameDirector } from "@/desktop/contexts/GameDirector";
import { useSound } from "@/contexts/Sound";
import { useGameStore } from "@/stores/gameStore";
import { streamIds } from "@/utils/cloudflare";
import { transitionVideos } from "@/utils/events";
import { Stream, StreamPlayerApi } from "@cloudflare/stream-react";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";

const CUSTOMER_CODE = import.meta.env.VITE_PUBLIC_CLOUDFLARE_ID;

export default function VideoPlayer() {
  const { videoQueue, setVideoQueue } = useGameDirector();
  const { setShowOverlay } = useGameStore();
  const { hasInteracted, muted, volume } = useSound();

  const playerRef = useRef<StreamPlayerApi | undefined>(undefined);
  const [videoReady, setVideoReady] = useState(false);
  const [nextVideoReady, setNextVideoReady] = useState(false);

  const handleEnded = () => {
    if (videoQueue[0] === streamIds.explore && !nextVideoReady) {
      return;
    }

    let isLastVideo = !transitionVideos.includes(videoQueue[0]) && videoQueue.length === 1;
    setShowOverlay(isLastVideo);
    setVideoReady(false);

    setTimeout(() => {
      setVideoQueue(videoQueue.slice(1));
      setNextVideoReady(false);
    }, !isLastVideo ? 0 : 500);
  }

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
  }
};