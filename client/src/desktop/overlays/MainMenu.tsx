import PaymentOptionsModal from "@/components/PaymentOptionsModal";
import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { OPENING_TIME } from "@/contexts/Statistics";
import discordIcon from "@/desktop/assets/images/discord.png";
import AdventurersList from "@/desktop/components/AdventurersList";
import Settings from "@/desktop/components/Settings";
import DungeonRewards from "@/dungeons/beasts/DungeonRewards";
import {
  ChainId,
  getNetworkConfig,
  NetworkConfig,
} from "@/utils/networkConfig";
import { getMenuLeftOffset } from "@/utils/utils";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import GitHubIcon from "@mui/icons-material/GitHub";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TokenIcon from "@mui/icons-material/Token";
import XIcon from "@mui/icons-material/X";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useAccount } from "@starknet-react/core";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PriceIndicator from "../../components/PriceIndicator";
import Leaderboard from "../components/Leaderboard";
import WalletConnect from "../components/WalletConnect";
import StatisticsModal from "./StatisticsModal";

export default function MainMenu() {
  const navigate = useNavigate();
  const { account } = useAccount();
  const { login } = useController();
  const { currentNetworkConfig, setCurrentNetworkConfig } =
    useDynamicConnector();
  const [showAdventurers, setShowAdventurers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [left, setLeft] = useState(getMenuLeftOffset());
  const [isDungeonOpen, setIsDungeonOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setLeft(getMenuLeftOffset());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const checkDungeonOpen = () => {
      const now = Math.floor(Date.now() / 1000);
      setIsDungeonOpen(now >= OPENING_TIME);
    };

    checkDungeonOpen();
  }, []);

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

  return (
    <>
      <Box sx={{ ...styles.container, left: `${left + 32}px` }}>
        <AnimatePresence mode="wait">
          {showAdventurers && (
            <AdventurersList onBack={() => setShowAdventurers(false)} />
          )}
          {showLeaderboard && (
            <Leaderboard onBack={() => setShowLeaderboard(false)} />
          )}
          {showSettings && <Settings onBack={() => setShowSettings(false)} />}

          {!showAdventurers && !showSettings && !showLeaderboard && (
            <>
              <Box sx={styles.headerBox}>
                <Typography sx={styles.gameTitle}>LOOT SURVIVOR 2</Typography>
                <Typography color="secondary" sx={styles.modeTitle}>
                  {currentNetworkConfig.name}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleStartGame}
                disabled={disableGameButtons}
                sx={{
                  px: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: "36px",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TokenIcon sx={{ fontSize: 20, mr: 1 }} />
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      color: disableGameButtons
                        ? "rgba(208, 201, 141, 0.3)"
                        : "#d0c98d",
                    }}
                  >
                    {currentNetworkConfig.name === "Beast Mode"
                      ? "Buy Game"
                      : "Start Game"}
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleShowAdventurers}
                disabled={disableGameButtons}
                sx={{ pl: 1, height: "36px" }}
              >
                <ShieldOutlinedIcon sx={{ fontSize: 20, mr: 1 }} />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      color: disableGameButtons
                        ? "rgba(208, 201, 141, 0.3)"
                        : "#d0c98d",
                    }}
                  >
                    My Games
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={switchMode}
                sx={{ pl: 1, height: "36px" }}
              >
                {currentNetworkConfig.name === "Beast Mode" ? (
                  <img
                    src="/images/practice.png"
                    alt="practice"
                    style={{ width: 20, height: 20 }}
                  />
                ) : (
                  <AttachMoneyIcon sx={{ fontSize: 20 }} />
                )}
                <Typography
                  sx={{
                    ml: 1,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    letterSpacing: 0.5,
                    color: "#d0c98d",
                  }}
                >
                  {currentNetworkConfig.name === "Beast Mode"
                    ? "Practice for Free"
                    : "Play for Real"}
                </Typography>
              </Button>

              <Divider sx={{ width: "100%", my: 0.5 }} />

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => setShowLeaderboard(true)}
                sx={{ pl: 1, height: "36px" }}
              >
                <LeaderboardIcon sx={{ fontSize: 20, mr: 1 }} />
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    letterSpacing: 0.5,
                    color: "#d0c98d",
                  }}
                >
                  Leaderboard
                </Typography>
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => setShowSettings(true)}
                sx={{ pl: 1, height: "36px" }}
              >
                <SettingsOutlinedIcon sx={{ fontSize: 20, mr: 1 }} />
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    color: "#d0c98d",
                    fontWeight: 500,
                    letterSpacing: 0.5,
                  }}
                >
                  Settings
                </Typography>
              </Button>

              {/* <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => setShowStats(true)}
                sx={{ px: 1, height: '36px' }}
                disabled={true}
              >
                <BarChartIcon sx={{ fontSize: 20, mr: 1 }} />
                <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.3)', fontWeight: 500, letterSpacing: 0.5 }}>
                  Statistics
                </Typography>
              </Button> */}

              {currentNetworkConfig.name === "Beast Mode" && (
                <>
                  <PriceIndicator />

                  <Link
                    href="#"
                    sx={styles.learnMoreLink}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(
                        "https://docs.provable.games/lootsurvivor/dungeon-tickets",
                        "_blank"
                      );
                    }}
                  >
                    Learn more about Dungeon Tickets
                  </Link>
                </>
              )}

              <Box sx={styles.bottom}>
                <WalletConnect />

                <Box sx={styles.bottomRow}>
                  <Typography sx={styles.alphaVersion}>
                    Provable Games
                  </Typography>
                  <Box sx={styles.socialButtons}>
                    <IconButton
                      size="small"
                      sx={styles.socialButton}
                      onClick={() =>
                        window.open(
                          "https://docs.provable.games/lootsurvivor",
                          "_blank"
                        )
                      }
                    >
                      <MenuBookIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={styles.socialButton}
                      onClick={() =>
                        window.open("https://x.com/LootSurvivor", "_blank")
                      }
                    >
                      <XIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={styles.socialButton}
                      onClick={() =>
                        window.open("https://discord.gg/DQa4z9jXnY", "_blank")
                      }
                    >
                      <img
                        src={discordIcon}
                        alt="Discord"
                        style={{ width: 20, height: 20 }}
                      />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={styles.socialButton}
                      onClick={() =>
                        window.open(
                          "https://github.com/provable-games/death-mountain",
                          "_blank"
                        )
                      }
                    >
                      <GitHubIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </AnimatePresence>
        <StatisticsModal open={showStats} onClose={() => setShowStats(false)} />
      </Box>

      {showPaymentOptions && (
        <PaymentOptionsModal
          open={showPaymentOptions}
          onClose={() => setShowPaymentOptions(false)}
        />
      )}

      <Box sx={[styles.rewardsContainer, { right: `${left + 32}px` }]}>
        <DungeonRewards />
      </Box>
    </>
  );
}

const styles = {
  container: {
    position: "absolute",
    top: 32,
    width: 310,
    minHeight: 600,
    bgcolor: "rgba(24, 40, 24, 0.55)",
    border: "2px solid #083e22",
    borderRadius: "12px",
    backdropFilter: "blur(8px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    px: 2,
    py: 1,
    zIndex: 10,
    gap: 1,
  },
  rewardsContainer: {
    position: "absolute",
    top: 32,
    width: 300,
    bgcolor: "rgba(24, 40, 24, 0.6)",
    border: "1px solid rgba(208, 201, 141, 0.3)",
    borderRadius: "10px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    p: 2.5,
    zIndex: 10,
  },
  headerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    mt: 2,
    mb: 0.5,
  },
  gameTitle: {
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 1.1,
    mb: 0.5,
  },
  modeTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 1.1,
    mb: 0.5,
  },
  modeDescription: {
    fontSize: "1.1rem",
    fontWeight: 400,
    color: "#b6ffb6",
    fontStyle: "italic",
    letterSpacing: 0.5,
    textAlign: "center",
    textShadow: "0 1px 2px #0f0",
    mb: 1,
  },
  icon: {
    mr: 1,
  },
  bottom: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    mt: "auto",
    gap: 0.5,
    width: "100%",
  },
  bottomRow: {
    mt: 0.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "99%",
    mr: -1,
  },
  socialButtons: {
    display: "flex",
    gap: 0.5,
  },
  socialButton: {
    color: "#d0c98d",
    opacity: 0.8,
    "&:hover": {
      opacity: 1,
    },
    padding: "4px",
  },
  alphaVersion: {
    fontSize: "0.7rem",
    opacity: 0.8,
    letterSpacing: 1,
  },
  orDivider: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  orText: {
    margin: "0 1rem",
    fontSize: "0.8rem",
    opacity: 0.8,
    textAlign: "center",
  },
  launchCampaign: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    mb: 2,
    p: 1.5,
    bgcolor: "rgba(8, 62, 34, 0.3)",
    border: "1px solid rgba(208, 201, 141, 0.2)",
    borderRadius: "8px",
    width: "100%",
    boxSizing: "border-box",
  },
  campaignHeadline: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#d0c98d",
    letterSpacing: 0.5,
    mb: 0.5,
  },
  campaignDescription: {
    fontSize: "0.75rem",
    color: "rgba(208, 201, 141, 0.8)",
    letterSpacing: 0.3,
    mb: 1,
    lineHeight: 1.3,
  },
  eligibilityLink: {
    fontSize: "0.8rem",
    color: "#b6ffb6",
    textDecoration: "underline !important",
    fontWeight: 500,
    letterSpacing: 0.3,
    cursor: "pointer",
    "&:hover": {
      textDecoration: "underline !important",
      color: "#d0ffd0",
    },
  },
  learnMoreLink: {
    fontSize: "0.9rem",
    color: "rgba(208, 201, 141, 0.6)",
    textDecoration: "underline !important",
    cursor: "pointer",
    "&:hover": {
      color: "rgba(208, 201, 141, 0.8)",
    },
  },
  boostIndicator: {
    background:
      "linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.2))",
    border: "1px solid #4caf50",
    borderRadius: "8px",
    padding: "5px 10px",
    marginBottom: "4px",
    textAlign: "center",
    width: "100%",
    boxSizing: "border-box",
  },
  boostText: {
    fontSize: "0.8rem",
    fontWeight: "bold",
    color: "#4caf50",
    textShadow: "0 0 5px rgba(76, 175, 80, 0.5)",
    letterSpacing: "0.3px",
  },
  countdownText: {
    fontSize: "0.7rem",
    fontWeight: "600",
    color: "#8bc34a",
    textShadow: "0 0 3px rgba(139, 195, 74, 0.4)",
    letterSpacing: "0.2px",
  },
};
