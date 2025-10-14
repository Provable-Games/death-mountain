import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { useStatistics } from "@/contexts/Statistics";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { calculateLevel } from "@/utils/game";
import { ChainId, getNetworkConfig, NetworkConfig } from "@/utils/networkConfig";
import { Box } from "@mui/material";
import { useAccount } from "@starknet-react/core";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import BeastScreen from "../containers/BeastScreen";
import BeastSlainScreen from "../containers/BeastSlainScreen";
import CharacterScreen from "../containers/CharacterScreen";
import DeathScreen from "../containers/DeathScreen";
import ExploreScreen from "../containers/ExploreScreen";
import LoadingContainer from "../containers/LoadingScreen";
import MarketScreen from "../containers/MarketScreen";
import QuestCompletedScreen from "../containers/QuestCompletedScreen";
import RewardsScreen from "../containers/RewardsScreen";
import SettingsScreen from "../containers/SettingsScreen";
import StatSelectionScreen from "../containers/StatSelectionScreen";
import { useGameDirector } from "../contexts/GameDirector";

export default function GamePage() {
  const navigate = useNavigate();
  const { setCurrentNetworkConfig, currentNetworkConfig } = useDynamicConnector();
  const { mintGame } = useSystemCalls();
  const { spectating } = useGameDirector();
  const { remainingSurvivorTokens } = useStatistics();
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
    exitGame,
    setGameId,
    beast,
    showBeastRewards,
    quest,
  } = useGameStore();


  const [activeNavItem, setActiveNavItem] = useState<
    "GAME" | "CHARACTER" | "MARKET" | "SETTINGS"
  >("GAME");

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showRewards, setShowRewards] = useState(currentNetworkConfig.chainId !== ChainId.WP_PG_SLOT);

  const [searchParams] = useSearchParams();
  const game_id = Number(searchParams.get("id"));
  const settings_id = Number(searchParams.get("settingsId"));
  const mode = searchParams.get("mode");

  async function mint() {
    setLoadingProgress(45);
    let tokenId = await mintGame(playerName, settings_id);
    navigate(
      `/survivor/play?id=${tokenId}${mode === "practice" ? "&mode=practice" : ""
      }`,
      { replace: true }
    );
  }

  useEffect(() => {
    if (!account && gameId && adventurer) {
      navigate("/survivor");
    }
  }, [account]);

  useEffect(() => {
    if (mode === "practice" && currentNetworkConfig.chainId !== ChainId.WP_PG_SLOT) {
      setCurrentNetworkConfig(getNetworkConfig(ChainId.WP_PG_SLOT) as NetworkConfig);
      return;
    }

    if (spectating) {
      setLoadingProgress(99);
      setGameId(game_id);
      return;
    }

    if (mode !== "entering" && currentNetworkConfig.chainId !== ChainId.WP_PG_SLOT && game_id === 0) {
      setCurrentNetworkConfig(getNetworkConfig(ChainId.WP_PG_SLOT) as NetworkConfig);
      return;
    }

    if (isPending) return;

    if (mode === "entering") {
      setLoadingProgress(45);
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
      setLoadingProgress(99);
      setGameId(game_id);
    } else if (game_id === 0) {
      mint();
    }
  }, [game_id, controllerAddress, isPending, account, currentNetworkConfig.chainId]);

  useEffect(() => {
    setActiveNavItem("GAME");
  }, [adventurer?.stat_upgrades_available, adventurer?.beast_health]);

  useEffect(() => {
    return () => {
      exitGame();
    };
  }, []);

  const handleRewardsClose = () => {
    setShowRewards(false);
  };

  const isLoading = !gameId || !adventurer;
  const isDead = adventurer && adventurer.health === 0;
  const isBeastDefeated = showBeastRewards && adventurer?.beast_health === 0;
  const isQuestCompleted = quest && adventurer && adventurer.xp >= quest.targetScore;

  return (
    <Box className="container" sx={styles.container}>
      {isLoading ? (
        <LoadingContainer loadingProgress={loadingProgress} />
      ) : isDead && !spectating && showRewards && remainingSurvivorTokens !== null && remainingSurvivorTokens > 0 && adventurer?.xp! >= 9 ? (
        <RewardsScreen
          gameId={gameId!}
          adventurerLevel={calculateLevel(adventurer?.xp!)}
          onClose={handleRewardsClose}
        />
      ) : isDead ? (
        <DeathScreen />
      ) : isQuestCompleted ? (
        <QuestCompletedScreen />
      ) : isBeastDefeated ? (
        <BeastSlainScreen />
      ) : (
        <>
          {adventurer.beast_health > 0 && beast && <BeastScreen />}
          {adventurer.stat_upgrades_available > 0 && <StatSelectionScreen />}
          {adventurer.beast_health === 0 &&
            adventurer.stat_upgrades_available === 0 && <ExploreScreen />}
        </>
      )}

      {activeNavItem === "CHARACTER" && <CharacterScreen />}
      {activeNavItem === "MARKET" && <MarketScreen />}
      {activeNavItem === "SETTINGS" && <SettingsScreen />}

      {!isLoading && (
        <BottomNav
          activeNavItem={activeNavItem}
          setActiveNavItem={setActiveNavItem}
        />
      )}
    </Box>
  );
}

const styles = {
  container: {
    width: "450px",
    maxWidth: "100vw",
    height: isMobile ? "100dvh" : "calc(100dvh - 50px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    margin: "0 auto",
    gap: 2,
    position: "relative",
  },
};
