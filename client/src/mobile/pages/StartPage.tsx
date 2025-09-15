import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { OPENING_TIME } from "@/contexts/Statistics";
import BeastsCollected from "@/components/BeastsCollected";
import PriceIndicator from "@/components/PriceIndicator";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Box, Button, Divider, Typography } from "@mui/material";
import { useAccount } from "@starknet-react/core";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameTokensList from "../components/GameTokensList";
import CountdownMobile from "../components/CountdownMobile";
import PaymentOptionsModal from "@/components/PaymentOptionsModal";
import Leaderboard from "../components/Leaderboard";
import { ChainId } from "@/utils/networkConfig";
import { NetworkConfig, getNetworkConfig } from "@/utils/networkConfig";
import DungeonRewards from "@/dungeons/beasts/DungeonRewards";
import { addAddressPadding } from "starknet";
import { useGameTokens } from "metagame-sdk/sql";

export default function LandingPage() {
  const { account } = useAccount();
  const { login } = useController();
  const { currentNetworkConfig, setCurrentNetworkConfig } =
    useDynamicConnector();
  const navigate = useNavigate();
  const [showAdventurers, setShowAdventurers] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDungeonRewards, setShowDungeonRewards] = useState(false);
  const [isDungeonOpen, setIsDungeonOpen] = useState(false);

  useEffect(() => {
    const checkDungeonOpen = () => {
      const now = Math.floor(Date.now() / 1000);
      setIsDungeonOpen(now >= OPENING_TIME);
    };

    checkDungeonOpen();
    const interval = setInterval(checkDungeonOpen, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartGame = () => {
    if (currentNetworkConfig.chainId === import.meta.env.VITE_PUBLIC_CHAIN) {
      if (!account) {
        login();
        return;
      }

      navigate(`/survivor/play?mode=real`);
    } else {
      navigate(`/survivor/play`);
    }
  };

  const handleShowAdventurers = () => {
    if (
      currentNetworkConfig.chainId === import.meta.env.VITE_PUBLIC_CHAIN &&
      !account
    ) {
      login();
      return;
    }

    setShowAdventurers(true);
  };

  const switchMode = () => {
    if (currentNetworkConfig.name === "Beast Mode") {
      setCurrentNetworkConfig(
        getNetworkConfig(ChainId.WP_PG_SLOT) as NetworkConfig
      );
    } else {
      setCurrentNetworkConfig(
        getNetworkConfig(ChainId.SN_MAIN) as NetworkConfig
      );
    }
  };

  let disableGameButtons =
    !isDungeonOpen && currentNetworkConfig.name === "Beast Mode";

  const { games } = useGameTokens({
    owner: account?.address,
    limit: 101,
    sortBy: "minted_at",
    sortOrder: "desc",
    mintedByAddress: currentNetworkConfig.dungeon
      ? addAddressPadding(currentNetworkConfig.dungeon)
      : "0",
  });
  const gameCount = games.filter(
    (game: any) => !game.game_over && game.score === 0
  ).length;

  return (
    <>
      <Box sx={styles.container}>
        <Box
          className="container"
          sx={{
            width: "100%",
            gap: 2,
            textAlign: "center",
            height: "440px",
            position: "relative",
          }}
        >
          {!showAdventurers && !showLeaderboard && !showDungeonRewards && (
            <>
              <Box sx={styles.headerBox}>
                <Typography sx={styles.gameTitle}>LOOT SURVIVOR 2</Typography>
                <Typography color="secondary" sx={styles.modeTitle}>
                  {currentNetworkConfig.name}
                </Typography>
              </Box>

              {!isDungeonOpen && <CountdownMobile />}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleStartGame}
                disabled={disableGameButtons}
                startIcon={
                  <img
                    src={"/images/mobile/dice.png"}
                    alt="dice"
                    height="20px"
                    style={{ opacity: disableGameButtons ? 0.3 : 1 }}
                  />
                }
                sx={{
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(208, 201, 141, 0.12)",
                    color: "rgba(208, 201, 141, 0.4)",
                  },
                }}
              >
                <Typography
                  variant="h5"
                  color={
                    disableGameButtons ? "rgba(208, 201, 141, 0.4)" : "#111111"
                  }
                >
                  {currentNetworkConfig.name === "Beast Mode"
                    ? "Buy Game"
                    : "Start Game"}
                </Typography>
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                onClick={handleShowAdventurers}
                disabled={disableGameButtons}
                sx={{
                  height: "36px",
                  mt: 1,
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(208, 201, 141, 0.12)",
                    color: "rgba(208, 201, 141, 0.4)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: gameCount > 0 ? "space-between" : "center",
                    width: "100%",
                  }}
                >
                  {gameCount > 0 && (
                    <Typography
                      color="black"
                      fontWeight={500}
                      visibility={"hidden"}
                    >
                      {gameCount} NEW
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <SportsEsportsIcon
                      sx={{ opacity: disableGameButtons ? 0.4 : 1, mr: 1 }}
                    />
                    <Typography
                      variant="h5"
                      color={
                        disableGameButtons
                          ? "rgba(208, 201, 141, 0.4)"
                          : "#111111"
                      }
                    >
                      My Games
                    </Typography>
                  </Box>
                  {gameCount > 0 && (
                    <Typography variant="h5" color="black" fontWeight={500}>
                      {gameCount} NEW
                    </Typography>
                  )}
                </Box>
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                onClick={switchMode}
                sx={{ height: "36px", mt: 1, mb: 1 }}
              >
                <Typography variant="h5" color="#111111">
                  {currentNetworkConfig.name === "Beast Mode"
                    ? "Practice for Free"
                    : "Play for Real"}
                </Typography>
              </Button>

              <Divider sx={{ width: "100%", my: 0.5 }} />

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                onClick={() => setShowLeaderboard(true)}
                startIcon={<LeaderboardIcon />}
                sx={{ height: "36px", mt: 1 }}
              >
                <Typography variant="h5" color="#111111">
                  Leaderboard
                </Typography>
              </Button>

              {/* {currentNetworkConfig.name === "Beast Mode" && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  color="secondary"
                  onClick={() => setShowDungeonRewards(true)}
                  startIcon={<EmojiEventsIcon />}
                  sx={{ height: "36px", mt: 1, mb: 2 }}
                >
                  <Typography variant="h5" color="#111111">
                    Dungeon Rewards
                  </Typography>
                </Button>
              )} */}

              {/* {currentNetworkConfig.name === "Beast Mode" && <PriceIndicator />} */}
            </>
          )}

          {showAdventurers && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <Box sx={styles.adventurersHeader}>
                  <Button
                    variant="text"
                    size="large"
                    onClick={() => setShowAdventurers(false)}
                    sx={styles.backButton}
                    startIcon={
                      <ArrowBackIcon fontSize="large" sx={{ mr: 1 }} />
                    }
                  >
                    <Typography variant="h4" color="primary">
                      My Games
                    </Typography>
                  </Button>
                </Box>
              </Box>

              <GameTokensList />
            </>
          )}

          {showLeaderboard && (
            <Leaderboard onBack={() => setShowLeaderboard(false)} />
          )}

          {showDungeonRewards && (
            <>
              {/* <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <Box sx={styles.adventurersHeader}>
                  <Button
                    variant="text"
                    size="large"
                    onClick={() => setShowDungeonRewards(false)}
                    sx={styles.backButton}
                    startIcon={
                      <ArrowBackIcon fontSize="large" sx={{ mr: 1 }} />
                    }
                  >
                    <Typography variant="h4" color="primary">
                      Dungeon Rewards
                    </Typography>
                  </Button>
                </Box>
              </Box> */}

              {/* <Box
                sx={{ width: "100%", maxHeight: "365px", overflowY: "auto" }}
              >
                <DungeonRewards />
              </Box> */}
            </>
          )}
        </Box>
      </Box>

      {showPaymentOptions && (
        <PaymentOptionsModal
          open={showPaymentOptions}
          onClose={() => setShowPaymentOptions(false)}
        />
      )}
    </>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    height: "calc(100dvh - 120px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: "10px",
    margin: "0 auto",
    gap: 2,
  },
  headerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  adventurersHeader: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  backButton: {
    minWidth: "auto",
    px: 1,
  },
  gameTitle: {
    fontSize: "2rem",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 1.1,
  },
  modeTitle: {
    fontSize: "1.6rem",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 1.1,
    mb: 2,
  },
  logoContainer: {
    maxWidth: "100%",
    mb: 2,
  },
  orDivider: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    justifyContent: "center",
    margin: "10px 0",
  },
  orText: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.3)",
    margin: "0 10px",
  },
  bottom: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "calc(100% - 20px)",
    position: "absolute",
    bottom: 5,
  },
};
