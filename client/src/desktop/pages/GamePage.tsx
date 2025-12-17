import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import VideoPlayer from "@/desktop/components/VideoPlayer";
import { useGameDirector } from "@/desktop/contexts/GameDirector";
import CombatOverlay from "@/desktop/overlays/Combat";
import DeathOverlay from "@/desktop/overlays/Death";
import ExploreOverlay from "@/desktop/overlays/Explore";
import LoadingOverlay from "@/desktop/overlays/Loading";
import { useDungeon } from "@/dojo/useDungeon";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { useUIStore } from "@/stores/uiStore";
import { streamIds } from "@/utils/cloudflare";
import { ChainId, getNetworkConfig, NetworkConfig } from "@/utils/networkConfig";
import { getMenuLeftOffset } from "@/utils/utils";
import { Box } from "@mui/material";
import { useAccount } from "@starknet-react/core";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
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
  const { setCurrentNetworkConfig, currentNetworkConfig } = useDynamicConnector();
  const { mintGame } = useSystemCalls();

  const {
    account,
    playerName,
    login,
    isPending,
  } = useController();
  const { address: controllerAddress } = useAccount();
  const {
    gameId,
    adventurer,
    spectating,
    exitGame,
    setGameId,
    beast,
    showOverlay,
    setShowOverlay,
  } = useGameStore();
  const { skipIntroOutro } = useUIStore();
  const { setVideoQueue, actionFailed } = useGameDirector();
  const [padding, setPadding] = useState(getMenuLeftOffset());
  const dungeon = useDungeon();
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
    if (mode === "practice" && currentNetworkConfig.chainId !== ChainId.WP_PG_SLOT) {
      return;
    }

    if (spectating && game_id) {
      setGameId(game_id);
      return;
    }

    if (mode !== "entering" && game_id === 0 && currentNetworkConfig.chainId !== ChainId.WP_PG_SLOT) {
      if (dungeon.includePractice) {
        navigate(`/${dungeon.id}/play?mode=practice`, { replace: true })
      } else {
        navigate(`/${dungeon.id}`, { replace: true })
      }

      return;
    }

    if (isPending) return;

    if (mode === "entering") {
      if (!skipIntroOutro) {
        setVideoQueue([streamIds.start]);
      }
      return;
    }

    if (!controllerAddress && currentNetworkConfig.chainId !== ChainId.WP_PG_SLOT) {
      login();
      return;
    }

    if (!account) {
      return;
    }

    if (game_id) {
      setGameId(game_id);
    } else if (game_id === 0) {
      mint();
    }
  }, [game_id, controllerAddress, isPending, account, currentNetworkConfig.chainId, mode]);

  useEffect(() => {
    return () => {
      exitGame();
    };
  }, []);

  async function mint() {
    if (!skipIntroOutro) {
      setVideoQueue([streamIds.start]);
    }

    let tokenId = await mintGame(playerName, settings_id);
    navigate(
      `/${dungeon.id}/play?id=${tokenId}${mode === "practice" ? "&mode=practice" : ""}`,
      { replace: true }
    );

    if (!skipIntroOutro) {
      setShowOverlay(false);
    }
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
