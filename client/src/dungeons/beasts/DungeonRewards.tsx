import {
  JACKPOT_AMOUNT,
  totalCollectableBeasts,
  totalSurvivorTokens,
  useStatistics,
} from "@/contexts/Statistics";
import { useUIStore } from "@/stores/uiStore";
import { formatRewardNumber } from "@/utils/utils";
import {
  Box,
  Divider,
  LinearProgress,
  Link,
  Skeleton,
  Typography,
} from "@mui/material";
import { isMobile } from "react-device-detect";

export default function DungeonRewards() {
  const { strkPrice } = useStatistics();
  const { useMobileClient } = useUIStore();
  const { remainingSurvivorTokens, collectedBeasts } = useStatistics();
  const beastsRemaining = totalCollectableBeasts - collectedBeasts;

  return (
    <>
      {!(isMobile || useMobileClient) && (
        <Box sx={styles.header}>
          <Typography sx={styles.title}>DUNGEON REWARDS</Typography>
          <Box sx={styles.divider} />
        </Box>
      )}

      <Box sx={styles.rewardSection}>
        <Box mb={0.5}>
          <img src="/images/survivor_token.png" alt="beast" height={52} />
        </Box>

        <Box sx={styles.rewardHeader}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={styles.rewardTitle}>Survivor Tokens</Typography>
            <Typography sx={styles.rewardSubtitle}>
              Earn by playing games
            </Typography>
          </Box>
        </Box>

        {remainingSurvivorTokens !== null ? (
          <Box sx={styles.progressContainer}>
            <Box sx={styles.progressBar}>
              <LinearProgress
                variant="determinate"
                value={(remainingSurvivorTokens / totalSurvivorTokens) * 100}
                sx={{
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  "& .MuiLinearProgress-bar": {
                    background: "#656217",
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
            <Box sx={styles.progressOverlay}>
              <Typography sx={styles.progressText}>
                {formatRewardNumber(remainingSurvivorTokens)} /{" "}
                {formatRewardNumber(totalSurvivorTokens)}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Skeleton
            variant="rectangular"
            sx={{ height: 18, borderRadius: 4 }}
          />
        )}

        {remainingSurvivorTokens !== null && (
          <Typography sx={styles.remainingText}>
            {remainingSurvivorTokens.toLocaleString()} tokens remaining
          </Typography>
        )}

        <Link
          href="#"
          sx={styles.learnMoreLink}
          onClick={(e) => {
            e.preventDefault();
            window.open(
              "https://docs.provable.games/lootsurvivor/token",
              "_blank"
            );
          }}
        >
          Learn more about Survivor Tokens
        </Link>
      </Box>

      <Divider sx={{ width: "100%", my: 1.5 }} />

      <Box sx={styles.rewardSection}>
        <Box>
          <img src="/images/beast.png" alt="beast" height={64} />
        </Box>

        <Box sx={styles.rewardHeader}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={styles.rewardTitle}>Collectable Beast</Typography>
            <Typography sx={styles.rewardSubtitle}>
              Defeat beasts to collect NFTs
            </Typography>
          </Box>
        </Box>

        {beastsRemaining > 0 ? (
          <Box sx={styles.progressContainer}>
            <Box sx={styles.progressBar}>
              <LinearProgress
                variant="determinate"
                value={(beastsRemaining / totalCollectableBeasts) * 100}
                sx={{
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  "& .MuiLinearProgress-bar": {
                    background: "#656217",
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
            <Box sx={styles.progressOverlay}>
              <Typography sx={styles.progressText}>
                {formatRewardNumber(beastsRemaining)} /{" "}
                {totalCollectableBeasts.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Skeleton
            variant="rectangular"
            sx={{ height: 18, borderRadius: 4 }}
          />
        )}

        {beastsRemaining > 0 && (
          <Typography sx={styles.remainingText}>
            {beastsRemaining.toLocaleString()} beast remaining
          </Typography>
        )}

        <Link
          href="#"
          sx={styles.learnMoreLink}
          onClick={(e) => {
            e.preventDefault();
            window.open(
              "https://docs.provable.games/lootsurvivor/beasts/collectibles",
              "_blank"
            );
          }}
        >
          Learn more about Collectable Beasts
        </Link>
      </Box>

      <Divider sx={{ width: "100%", my: 1.5 }} />

      <Box sx={styles.rewardSection}>
        <Typography sx={[styles.rewardTitle, { color: "#d7c529" }]} mb={1}>
          Wanted Beasts
        </Typography>

        <Box mb={0.5} display="flex" justifyContent="space-between">
          <Box>
            <img src="/images/jackpot_balrog.png" alt="beast" height={80} />
            <Typography fontWeight={500} fontSize={13}>
              "Torment Bane" Balrog
            </Typography>
          </Box>
          <Box>
            <img src="/images/jackpot_warlock.png" alt="beast" height={80} />
            <Typography fontWeight={500} fontSize={13}>
              "Pain Whisper" Warlock
            </Typography>
          </Box>
          <Box>
            <img src="/images/jackpot_dragon.png" alt="beast" height={80} />
            <Typography fontWeight={500} fontSize={13}>
              "Demon Grasp" Dragon
            </Typography>
          </Box>
        </Box>

        <Box sx={styles.rewardHeader}>
          <Box sx={{ flex: 1 }}>
            <Typography
              fontWeight={500}
              color="secondary"
              mt={0.5}
              letterSpacing={0.2}
            >
              Each beast holds a bounty valued at ~$
              {Math.round(
                Number(strkPrice || 0) * JACKPOT_AMOUNT
              ).toLocaleString()}
              !
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}

const styles = {
  progressBar: {
    width: "95%",
    maxWidth: "80dvw",
    height: 18,
    borderRadius: 4,
    border: "1px solid #656217",
    background: "#16281a",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    "& .MuiLinearProgress-bar": {
      background: "#ffe082",
      borderRadius: 4,
    },
  },
  header: {
    textAlign: "center",
    mb: 2,
  },
  title: {
    fontSize: "1.2rem",
    fontWeight: 700,
    letterSpacing: 0.5,
    color: "#d7c529",
    mb: 1,
  },
  divider: {
    width: "80%",
    height: 2,
    background: "linear-gradient(90deg, transparent, #d7c529, transparent)",
    margin: "0 auto",
  },
  rewardSection: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "center",
    width: "100%",
  },
  rewardHeader: {
    display: "flex",
    justifyContent: "center",
    gap: 1,
  },
  rewardTitle: {
    fontSize: "1rem",
    fontWeight: 500,
    color: "text.primary",
    letterSpacing: 0.3,
  },
  rewardSubtitle: {
    fontSize: "0.8rem",
    color: "#d7c529",
    letterSpacing: 0.5,
    opacity: 0.95,
  },
  progressContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    mt: 1,
    mb: 0.5,
  },
  progressOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  progressText: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  remainingText: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "text.primary",
    opacity: 0.8,
    textAlign: "center",
  },
  learnMoreLink: {
    mt: 0.5,
    fontSize: "0.8rem",
    color: "rgba(208, 201, 141, 0.6)",
    textAlign: "center",
    textDecoration: "underline !important",
    fontStyle: "italic",
    cursor: "pointer",
    "&:hover": {
      color: "rgba(208, 201, 141, 0.8)",
    },
  },
  footer: {
    textAlign: "center",
    mt: 2,
    pt: 2,
    borderTop: "1px solid rgba(208, 201, 141, 0.2)",
  },
  footerText: {
    fontSize: "0.75rem",
    color: "rgba(208, 201, 141, 0.6)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
};
