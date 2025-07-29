import { useDojoConfig } from "@/contexts/starknet";
import { useController } from "@/contexts/controller";
import VideoPlayer from "@/desktop/components/VideoPlayer";
import { useGameDirector } from "@/desktop/contexts/GameDirector";
import CombatOverlay from "@/desktop/overlays/Combat";
import DeathOverlay from "@/desktop/overlays/Death";
import ExploreOverlay from "@/desktop/overlays/Explore";
import LoadingOverlay from "@/desktop/overlays/Loading";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { streamIds } from "@/utils/cloudflare";
import { ChainId } from "@/utils/networkConfig";
import { getMenuLeftOffset } from "@/utils/utils";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Box } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useReducer, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface AnimatedOverlayProps {
  children: React.ReactNode;
  overlayKey: string;
}

const AnimatedOverlay = ({ children, overlayKey }: AnimatedOverlayProps) => (
  <motion.div
    key={overlayKey}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export default function GamePage() {
  const navigate = useNavigate();
  const { sdk } = useDojoSDK();
  const dojoConfig = useDojoConfig();
  const { mintGame } = useSystemCalls();
  const {
    account,
    address,
    playerName,
    login,
    isPending,
    startPractice,
    endPractice,
  } = useController();
  const {
    gameId,
    adventurer,
    exitGame,
    setGameId,
    beast,
    showOverlay,
    setShowOverlay,
  } = useGameStore();
  const { subscription, setVideoQueue, actionFailed } = useGameDirector();
  const [padding, setPadding] = useState(getMenuLeftOffset());
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);

  const [searchParams] = useSearchParams();
  const game_id = Number(searchParams.get("id"));
  const settings_id = Number(searchParams.get("settingsId"));
  const mode = searchParams.get("mode");

  useEffect(() => {
    setShowOverlay(true);
    setVideoQueue([]);
  }, [actionFailed]);

  useEffect(() => {
    function handleResize() {
      setPadding(getMenuLeftOffset());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!account && gameId && adventurer) {
      navigate("/survivor");
    }
  }, [account]);

  useEffect(() => {
    if (!sdk || isPending) return;

    if (!address && mode !== "practice") return login();

    if (mode === "practice" && dojoConfig.chainId !== ChainId.WP_PG_SLOT) {
      startPractice();
      return;
    }

    if (!account) {
      forceUpdate();
      return;
    }

    if (game_id) {
      setGameId(game_id);
    } else if (game_id === 0) {
      mint();
    }
  }, [game_id, address, isPending, sdk, update, dojoConfig.chainId]);

  useEffect(() => {
    return () => {
      if (subscription) {
        try {
          subscription.cancel();
        } catch (error) {}
      }

      endPractice();
      exitGame();
    };
  }, []);

  async function mint() {
    setVideoQueue([streamIds.start]);
    let tokenId = await mintGame(account, playerName, settings_id);
    navigate(
      `/survivor/play?id=${tokenId}${
        mode === "practice" ? "&mode=practice" : ""
      }`,
      { replace: true }
    );
    setShowOverlay(false);
  }

  const isLoading = !gameId || !adventurer;

  return (
    <Box sx={styles.container}>
      {!showOverlay && (
        <Box
          className="imageContainer"
          sx={{ backgroundImage: `url('/images/game.png')`, zIndex: 0 }}
        />
      )}

      <VideoPlayer />

      {showOverlay && (
        <Box sx={{ ...styles.overlay, px: `${padding}px` }}>
          {isLoading ? (
            <LoadingOverlay />
          ) : (
            <AnimatePresence mode="wait">
              {adventurer && adventurer.health === 0 && (
                <AnimatedOverlay overlayKey="death">
                  <DeathOverlay />
                </AnimatedOverlay>
              )}
              {adventurer &&
                adventurer.health > 0 &&
                adventurer.beast_health > 0 &&
                beast && (
                  <AnimatedOverlay overlayKey="combat">
                    <CombatOverlay />
                  </AnimatedOverlay>
                )}
              {adventurer &&
                adventurer.health > 0 &&
                adventurer.beast_health === 0 && (
                  <AnimatedOverlay overlayKey="explore">
                    <ExploreOverlay />
                  </AnimatedOverlay>
                )}
            </AnimatePresence>
          )}
        </Box>
      )}
    </Box>
  );
}

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100dvw",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    margin: 0,
    gap: 2,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100dvw",
    height: "100dvh",
    zIndex: 99,
    boxSizing: "border-box",
  },
};
