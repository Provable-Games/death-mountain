import PaymentOptionsModal from "@/components/PaymentOptionsModal";
import PriceIndicator from "@/components/PriceIndicator";
import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import { ChainId } from "@/utils/networkConfig";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import SchoolIcon from "@mui/icons-material/School";
import ShareIcon from "@mui/icons-material/Share";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ReferralTab from "@/components/ReferralTab";

import { Box, Button, Divider, Typography } from "@mui/material";
import { useAccount } from "@starknet-react/core";
import { useGameTokens } from "metagame-sdk/sql";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addAddressPadding } from "starknet";
import GamesList from "../components/GamesList";
import Leaderboard from "../components/Leaderboard";

export default function LandingPage() {
  const dungeon = useDungeon();
  const { account } = useAccount();
  const { login } = useController();
  const { currentNetworkConfig } = useDynamicConnector();
  const navigate = useNavigate();
  const [showGames, setShowGames] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDungeonRewards, setShowDungeonRewards] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

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
  const disableGameButtons = dungeon.status !== "online";
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

  return (
    <>
      <Box sx={styles.container}>
        <Box
          className="container"
          sx={{
            width: "100%",
            gap: 2,
            textAlign: "center",
            minHeight: "440px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          {!showGames &&
            !showLeaderboard &&
            !showDungeonRewards &&
            !showReferral && (
            <>
              <Box sx={styles.headerBox}>
                <Typography sx={styles.gameTitle}>LOOT SURVIVOR 2</Typography>
                <Typography color="secondary" sx={styles.modeTitle}>
                  {dungeon.name}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleMainButtonClick}
                disabled={disableEnterDungeon}
                startIcon={
                  <img
                    src={"/images/mobile/dice.png"}
                    alt="dice"
                    height="20px"
                    style={{ opacity: disableEnterDungeon ? 0.3 : 1 }}
                  />
                }
                sx={{
                  background: disableEnterDungeon
                    ? "rgba(208, 201, 141, 0.12)"
                    : "linear-gradient(135deg, #80FF00 0%, #60DD00 100%)",
                  boxShadow: disableEnterDungeon
                    ? "none"
                    : "0 0 8px rgba(128, 255, 0, 0.25)",
                  animation: disableEnterDungeon ? "none" : "greenGlow 2s ease-in-out infinite",
                  "@keyframes greenGlow": {
                    "0%, 100%": {
                      boxShadow: "0 0 6px rgba(128, 255, 0, 0.2)",
                    },
                    "50%": {
                      boxShadow: "0 0 14px rgba(128, 255, 0, 0.4)",
                    },
                  },
                  "&:hover": {
                    background: "linear-gradient(135deg, #90FF20 0%, #80FF00 100%)",
                    boxShadow: "0 0 16px rgba(128, 255, 0, 0.45)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(208, 201, 141, 0.12)",
                    color: "rgba(208, 201, 141, 0.4)",
                  },
                }}
              >
                <Typography
                  variant="h5"
                  color={
                    disableEnterDungeon ? "rgba(208, 201, 141, 0.4)" : "#111111"
                  }
                  sx={{ fontWeight: 600 }}
                >
                  {dungeon.mainButtonText}
                </Typography>
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                color="secondary"
                onClick={handleShowGames}
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
                    justifyContent: "center",
                    width: "100%",
                    position: "relative",
                  }}
                >
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
                  {gamesCount > 0 && (
                    <Typography
                      variant="h6"
                      fontWeight={500}
                      sx={{
                        position: "absolute",
                        right: 8,
                        color: "#111111",
                      }}
                    >
                      {gamesCount} NEW
                    </Typography>
                  )}
                </Box>
              </Button>

              {dungeon.includePractice && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  color="secondary"
                  onClick={() => navigate(`/${dungeon.id}/play?mode=practice`)}
                  startIcon={<SchoolIcon />}
                  sx={{ height: "36px", mt: 1 }}
                >
                  <Typography variant="h5" color="#111111">
                    Practice for Free
                  </Typography>
                </Button>
              )}

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

              {dungeon.ticketAddress && (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    color="secondary"
                    onClick={() => setShowDungeonRewards(true)}
                    startIcon={<EmojiEventsIcon />}
                    sx={{ height: "36px", mt: 1 }}
                  >
                    <Typography variant="h5" color="#111111">
                      Dungeon Rewards
                    </Typography>
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    color="secondary"
                    onClick={() => setShowReferral(true)}
                    startIcon={<ShareIcon />}
                    sx={{ height: "36px", mt: 1, mb: 2 }}
                  >
                    <Typography variant="h5" color="#111111">
                      Refer & Earn
                    </Typography>
                  </Button>
                </>
              )}

              {dungeon.ticketAddress && <PriceIndicator />}
            </>
          )}

          {showGames && (
            <GamesList onBack={() => setShowGames(false)} />
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

              {DungeonRewards ? <Box
                sx={{ width: "100%", maxHeight: "400px", overflowY: "auto" }}
              >
                <DungeonRewards />
              </Box> : null}
            </>
          )}

          {showReferral && (
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
                    onClick={() => setShowReferral(false)}
                    sx={styles.backButton}
                    startIcon={
                      <ArrowBackIcon fontSize="large" sx={{ mr: 1 }} />
                    }
                  >
                    <Typography variant="h4" color="primary">
                      Refer & Earn
                    </Typography>
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{ width: "100%", maxHeight: "450px", overflowY: "auto" }}
              >
                <ReferralTab />
              </Box>
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
  launchCampaign: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    mt: 2,
    mb: 1,
    p: 1.5,
    bgcolor: "rgba(128, 255, 0, 0.1)",
    border: "1px solid rgba(237, 207, 51, 0.3)",
    borderRadius: "8px",
    width: "100%",
    boxSizing: "border-box",
  },
  campaignHeadline: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#EDCF33",
    letterSpacing: 0.5,
    mb: 0.5,
  },
  campaignDescription: {
    fontSize: "0.85rem",
    color: "rgba(237, 207, 51, 0.8)",
    letterSpacing: 0.3,
    mb: 1,
    lineHeight: 1.3,
  },
  eligibilityLink: {
    fontSize: "0.9rem",
    color: "#80FF00",
    textDecoration: "underline !important",
    fontWeight: 500,
    letterSpacing: 0.3,
    cursor: "pointer",
    "&:hover": {
      textDecoration: "underline !important",
      color: "#A0FF20",
    },
  },
};
