import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import BeastsCollected from "@/components/BeastsCollected";
import PriceIndicator from "@/components/PriceIndicator";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { useAccount } from "@starknet-react/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameTokensList from "../components/GameTokensList";
import PaymentOptionsModal from "@/components/PaymentOptionsModal";

export default function LandingPage() {
  const { account } = useAccount();
  const { login } = useController();
  const { currentNetworkConfig } = useDynamicConnector();
  const navigate = useNavigate();
  const [showAdventurers, setShowAdventurers] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

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

  return (
    <>
      <Box sx={styles.container}>
        <Box
          className="container"
          sx={{
            width: "100%",
            gap: 2,
            textAlign: "center",
            height: "375px",
            position: "relative",
          }}
        >
          {!showAdventurers && (
            <>
              <Box sx={styles.headerBox}>
                <Typography sx={styles.gameTitle}>LOOT SURVIVOR 2</Typography>
                <Typography color="secondary" sx={styles.modeTitle}>
                  {currentNetworkConfig.name}
                </Typography>
              </Box>

              {currentNetworkConfig.name === "Beast Mode" && <PriceIndicator />}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleStartGame}
                sx={{ mt: 1 }}
                startIcon={
                  <img
                    src={"/images/mobile/dice.png"}
                    alt="dice"
                    height="20px"
                  />
                }
              >
                <Typography variant="h5" color="#111111">
                  New Game
                </Typography>
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                onClick={handleShowAdventurers}
                sx={{ height: "36px", mt: 1, mb: 1 }}
              >
                <Typography variant="h5" color="#111111">
                  My Adventurers
                </Typography>
              </Button>

              <Box sx={styles.bottom}>
                {currentNetworkConfig.name === "Beast Mode" && (
                  <BeastsCollected />
                )}
              </Box>
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
                      My Adventurers
                    </Typography>
                  </Button>
                </Box>
              </Box>

              <GameTokensList />
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
