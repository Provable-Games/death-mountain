import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import BeastsCollected from "@/components/BeastsCollected";
import PriceIndicator from "@/components/PriceIndicator";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Divider, Typography } from "@mui/material";
import { useAccount } from "@starknet-react/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameTokensList from "../components/GameTokensList";
import PaymentOptionsModal from "@/components/PaymentOptionsModal";
import Leaderboard from "../components/Leaderboard";
import { ChainId } from "@/utils/networkConfig";
import { NetworkConfig, getNetworkConfig } from "@/utils/networkConfig";
import DungeonRewards from "@/dungeons/beasts/DungeonRewards";

export default function LandingPage() {
  const { account } = useAccount();
  const { login } = useController();
  const { currentNetworkConfig, setCurrentNetworkConfig } = useDynamicConnector();
  const navigate = useNavigate();
  const [showAdventurers, setShowAdventurers] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDungeonRewards, setShowDungeonRewards] = useState(false);

  const handleStartGame = () => {
    if (currentNetworkConfig.chainId === import.meta.env.VITE_PUBLIC_CHAIN) {
      if (!account) {
        login();
        return;
      }

      setShowPaymentOptions(true);
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
      setCurrentNetworkConfig(getNetworkConfig(ChainId.WP_PG_SLOT) as NetworkConfig);
    } else {
      setCurrentNetworkConfig(getNetworkConfig(ChainId.SN_MAIN) as NetworkConfig);
    }
  };

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

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleStartGame}
                startIcon={
                  <img
                    src={"/images/mobile/dice.png"}
                    alt="dice"
                    height="20px"
                  />
                }
              >
                <Typography variant="h5" color="#111111">
                  {currentNetworkConfig.name === "Beast Mode" ? 'Buy Game' : 'Start Game'}
                </Typography>
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                onClick={handleShowAdventurers}
                sx={{ height: "36px", mt: 1 }}
              >
                <Typography variant="h5" color="#111111">
                  My Games
                </Typography>
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
                  {currentNetworkConfig.name === "Beast Mode" ? 'Practice for Free' : 'Play for Real'}
                </Typography>
              </Button>

              <Divider
                sx={{ width: "100%", my: 0.5 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                onClick={() => setShowLeaderboard(true)}
                sx={{ height: "36px", mt: 1 }}
              >
                <Typography variant="h5" color="#111111">
                  Leaderboard
                </Typography>
              </Button>

              {currentNetworkConfig.name === "Beast Mode" && <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                onClick={() => setShowDungeonRewards(true)}
                sx={{ height: "36px", mt: 1, mb: 2 }}
              >
                <Typography variant="h5" color="#111111">
                  Dungeon Rewards
                </Typography>
              </Button>}

              {currentNetworkConfig.name === "Beast Mode" && <PriceIndicator />}
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
              </Box>
              <DungeonRewards />
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
