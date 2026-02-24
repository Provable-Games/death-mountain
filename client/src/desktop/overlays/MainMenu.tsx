import PaymentOptionsModal from "@/components/PaymentOptionsModal";
import SwapProgressTracker from "@/components/SwapProgressTracker";
import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import discordIcon from "@/desktop/assets/images/discord.png";
import GamesList from "@/desktop/components/GamesList";
import Settings from "@/desktop/components/Settings";
import { OPENING_TIME } from "@/contexts/Statistics";
import { useDungeon } from "@/dojo/useDungeon";
import { ChainId } from "@/utils/networkConfig";
import { useResponsiveScale } from "@/desktop/hooks/useResponsiveScale";
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
import Typography from "@mui/material/Typography";
import { useAccount } from "@starknet-react/core";
import { AnimatePresence } from "framer-motion";
import { useGameTokens } from "metagame-sdk/sql";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addAddressPadding } from "starknet";
import PriceIndicator from "../../components/PriceIndicator";
import Leaderboard from "../components/Leaderboard";
import WalletConnect from "../components/WalletConnect";
import ActivePlayers from "./ActivePlayers";

export default function MainMenu() {
  const navigate = useNavigate();
  const { account } = useAccount();
  const { login } = useController();
  const dungeon = useDungeon();
  const { currentNetworkConfig } = useDynamicConnector();
  const { scalePx, contentOffset } = useResponsiveScale();
  const [showGames, setShowGames] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isDungeonOpen, setIsDungeonOpen] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (dungeon.id !== "survivor") {
      setIsDungeonOpen(true);
      setShowBoost(false);
      setTimeRemaining(0);
      return;
    }

    const checkDungeonOpen = () => {
      const now = Math.floor(Date.now() / 1000);
      setIsDungeonOpen(now >= OPENING_TIME);

      // Check if 4x boost is active (second 2-week period)
      const boostStartTime = OPENING_TIME + 1209600;
      const boostEndTime = boostStartTime + 1209600;
      const isInBoostPeriod = now >= boostStartTime && now < boostEndTime;
      setShowBoost(isInBoostPeriod);

      if (isInBoostPeriod) {
        setTimeRemaining(boostEndTime - now);
      } else {
        setTimeRemaining(0);
      }
    };

    checkDungeonOpen();
  }, [dungeon.id]);

  const handleMainButtonClick = () => {
    if (dungeon.externalLink) {
      window.open(dungeon.externalLink, "_blank");
      return;
    }

    if (dungeon.network === ChainId.WP_PG_SLOT) {
      navigate(`/${dungeon.id}/play`);
      return;
    }

    if (!account) {
      login();
      return;
    }

    setShowPaymentOptions(true);
  };

  const handleShowGames = () => {
    if (
      currentNetworkConfig.chainId === ChainId.SN_MAIN &&
      !account
    ) {
      login();
      return;
    }

    setShowGames(true);
  };

  const isEnterDungeonEnabled = import.meta.env.VITE_ENABLE_ENTER_DUNGEON === 'true';
  const disableGameButtons =
    dungeon.status !== "online" || (dungeon.id === "survivor" && !isDungeonOpen);
  const disableEnterDungeon = disableGameButtons || !isEnterDungeonEnabled;
  const DungeonRewards = dungeon.rewards;

  const { games: unfilteredGames, refetch } = useGameTokens({
    owner: account?.address || "0x0",
    sortBy: "minted_at",
    sortOrder: "desc",
    gameOver: false,
    mintedByAddress: dungeon.address ? addAddressPadding(dungeon.address) : "0",
    includeMetadata: false,
    limit: 1000,
  });

  // Refetch games periodically to keep count updated
  useEffect(() => {
    const interval = setInterval(() => {
      refetch?.();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const gamesCount = useMemo(() => {
    if (!unfilteredGames) return 0;

    const now = Date.now();

    return unfilteredGames.filter(game => {
      const expiresAt = (game?.lifecycle?.end ?? 0) * 1000;
      const isExpired = expiresAt !== 0 && expiresAt < now;

      return !isExpired;
    }).length;
  }, [unfilteredGames]);

  const formatTimeRemaining = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return 'Less than 1h';
    }
  };
  // Responsive sizes
  const containerWidth = scalePx(370);
  const containerTop = scalePx(30);
  const edgeOffset = scalePx(40);
  const rewardsWidth = scalePx(530);

  return (
    <>
      <Box sx={{
        ...styles.container,
        left: contentOffset + edgeOffset,
        top: containerTop,
        width: containerWidth,
      }}>
        <AnimatePresence mode="wait">
          {showGames && (
            <GamesList onBack={() => setShowGames(false)} />
          )}
          {showLeaderboard && (
            <Leaderboard onBack={() => setShowLeaderboard(false)} />
          )}
          {showSettings && <Settings onBack={() => setShowSettings(false)} />}

          {!showGames && !showSettings && !showLeaderboard && (
            <>
              <Box sx={styles.headerBox}>
                <Typography sx={styles.gameTitle}>LOOT SURVIVOR 2</Typography>
                <Typography color="secondary" sx={styles.modeTitle}>
                  {dungeon.name}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleMainButtonClick}
                disabled={disableEnterDungeon}
                sx={disableEnterDungeon ? styles.mainCTAButtonDisabled : styles.mainCTAButton}
              >
                <TokenIcon sx={{ fontSize: 20, mr: 1, color: disableEnterDungeon ? "rgba(0,0,0,0.3)" : "#111" }} />
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    color: disableEnterDungeon ? "rgba(0,0,0,0.3)" : "#111",
                  }}
                >
                  {dungeon.mainButtonText}
                </Typography>
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleShowGames}
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
                  {gamesCount > 0 && (
                    <Typography color="secondary" fontWeight={500}>
                      {gamesCount} NEW
                    </Typography>
                  )}
                </Box>
              </Button>

              {dungeon.includePractice && (
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => navigate(`/${dungeon.id}/play?mode=practice`)}
                  sx={{ pl: 1, height: "36px" }}
                >
                  <img
                    src="/images/practice.png"
                    alt="practice"
                    style={{ width: 20, height: 20 }}
                  />
                  <Typography
                    sx={{
                      ml: 1,
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      color: "#d0c98d",
                    }}
                  >
                    Practice for Free
                  </Typography>
                </Button>
              )}

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

              {dungeon.ticketAddress && <PriceIndicator />}

              <SwapProgressTracker />

              <Box sx={styles.bottom}>
                {showBoost && dungeon.id === "survivor" && (
                  <Box sx={styles.boostIndicator}>
                    <Typography sx={styles.boostText}>
                      🔥 4x Survivor Token Rewards
                    </Typography>
                    <Typography sx={styles.countdownText}>
                      {formatTimeRemaining(timeRemaining)} remaining
                    </Typography>
                  </Box>
                )}

                {!dungeon.hideController ? <WalletConnect /> : null}

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
      </Box>

      {showPaymentOptions && (
        <PaymentOptionsModal
          open={showPaymentOptions}
          onClose={() => setShowPaymentOptions(false)}
        />
      )}

      {DungeonRewards ? <Box sx={[styles.rewardsContainer, {
        right: contentOffset + edgeOffset,
        top: containerTop,
        width: rewardsWidth,
      }]}>
        <DungeonRewards />
      </Box> : null}

      <ActivePlayers />
    </>
  );
}

const styles = {
  container: {
    position: "absolute",
    // top, width, minHeight set dynamically via useResponsiveScale
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

  mainCTAButton: {
    pl: 1,
    height: "36px",
    backgroundColor: "#80FF00",
    animation: "greenGlow 2s ease-in-out infinite",
    "@keyframes greenGlow": {
      "0%, 100%": {
        boxShadow: "0 0 4px rgba(128, 255, 0, 0.3)",
      },
      "50%": {
        boxShadow: "0 0 12px rgba(128, 255, 0, 0.5)",
      },
    },
    "&:hover": {
      backgroundColor: "#90FF20",
      boxShadow: "0 0 14px rgba(128, 255, 0, 0.5)",
    },
  },
  mainCTAButtonDisabled: {
    pl: 1,
    height: "36px",
    backgroundColor: "rgba(208, 201, 141, 0.12)",
  },
  rewardsContainer: {
    position: "absolute",
    // top, width set dynamically via useResponsiveScale
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
