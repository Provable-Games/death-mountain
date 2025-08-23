import { useController } from "@/contexts/controller";
import { useDojoConfig, useDynamicConnector } from "@/contexts/starknet";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameDirector } from "@/mobile/contexts/GameDirector";
import { useGameStore } from "@/stores/gameStore";
import { ChainId, getNetworkConfig, NetworkConfig } from "@/utils/networkConfig";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Box } from "@mui/material";
import { useAccount } from "@starknet-react/core";
import { useEffect, useReducer, useState } from "react";
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
import SettingsScreen from "../containers/SettingsScreen";
import StatSelectionScreen from "../containers/StatSelectionScreen";

export default function GamePage() {
  const navigate = useNavigate();
  const { sdk } = useDojoSDK();
  const { setCurrentNetworkConfig } = useDynamicConnector();
  const dojoConfig = useDojoConfig();
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
    exitGame,
    setGameId,
    beast,
    showBeastRewards,
    quest,
  } = useGameStore();
  const { subscription } = useGameDirector();

  const [activeNavItem, setActiveNavItem] = useState<
    "GAME" | "CHARACTER" | "MARKET" | "SETTINGS"
  >("GAME");

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);

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
    if (!sdk || isPending) return;

    if (mode === "entering") {
      setLoadingProgress(45);
      return;
    }

    if (mode === "real" && dojoConfig.chainId !== import.meta.env.VITE_PUBLIC_CHAIN) {
      setCurrentNetworkConfig(getNetworkConfig(import.meta.env.VITE_PUBLIC_CHAIN) as NetworkConfig);
      return;
    }

    if (!controllerAddress && mode === "real") {
      login();
      return;
    }

    if (mode === "practice" && dojoConfig.chainId !== ChainId.WP_PG_SLOT) {
      setCurrentNetworkConfig(getNetworkConfig(ChainId.WP_PG_SLOT) as NetworkConfig);
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
  }, [game_id, controllerAddress, isPending, sdk, account, dojoConfig.chainId]);

  useEffect(() => {
    setActiveNavItem("GAME");
  }, [adventurer?.stat_upgrades_available, adventurer?.beast_health]);

  useEffect(() => {
    return () => {
      if (subscription) {
        try {
          subscription.cancel();
        } catch (error) { }
      }

      exitGame();
    };
  }, []);

  const isLoading = !gameId || !adventurer;
  const isDead = adventurer && adventurer.health === 0;
  const isBeastDefeated = showBeastRewards && adventurer?.beast_health === 0;
  const isQuestCompleted =
    quest && adventurer && adventurer.xp >= quest.targetScore;

  return (
    <Box className="container" sx={styles.container}>
      {isLoading ? (
        <LoadingContainer loadingProgress={loadingProgress} />
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
