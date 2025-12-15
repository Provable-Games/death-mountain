import {
  JACKPOT_AMOUNT,
  totalCollectableBeasts,
  useStatistics
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

export default function BeastModeRewards() {
  const { strkPrice } = useStatistics();
  const { useMobileClient } = useUIStore();
  const { remainingSurvivorTokens, collectedBeasts } = useStatistics();
  const beastsRemaining = totalCollectableBeasts - collectedBeasts;
  const BEAST_ENTITLEMENTS_ORIGINAL = 931500;

  return (
    <>
      {!(isMobile || useMobileClient) && (
        <Box sx={styles.header}>
          <Typography sx={styles.title}>DUNGEON REWARDS</Typography>
          <Box sx={styles.divider} />
        </Box>
      )}

      <Box sx={styles.rewardSection}>
        <Box sx={styles.headerRow}>
          <img src="/images/survivor_token.png" alt="beast" height={52} />
          <Typography sx={styles.rewardTitle}>Survivor Tokens</Typography>
        </Box>

        {/* Beast Entitlements Section */}
        <Box sx={styles.subsection}>
          <Typography sx={styles.subsectionTitle}>Beast Entitlements</Typography>
          {remainingSurvivorTokens !== null ? (
            <>
              <Box sx={[styles.progressContainer, { mt: 0 }]}>
                <Box sx={styles.progressBar}>
                  <LinearProgress
                    variant="determinate"
                    value={(remainingSurvivorTokens / BEAST_ENTITLEMENTS_ORIGINAL) * 100}
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
                    {formatRewardNumber(BEAST_ENTITLEMENTS_ORIGINAL)}
                  </Typography>
                </Box>
              </Box>

              {remainingSurvivorTokens !== null && (
                <Typography sx={styles.remainingText}>
                  {remainingSurvivorTokens.toLocaleString()} tokens remaining
                </Typography>
              )}
            </>
          ) : (
            <Skeleton
              variant="rectangular"
              sx={{ height: 18, borderRadius: 4 }}
            />
          )}
        </Box>

        {/* Death Rewards Section */}
        <Box sx={[styles.subsection, { opacity: 0.8 }]} mt={1}>
          <Typography sx={styles.subsectionTitle}>Death Rewards</Typography>
          <Box sx={[styles.progressContainer, { mt: 0 }]}>
            <Box sx={styles.progressBar}>
              <LinearProgress
                variant="determinate"
                value={100}
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
              <Typography sx={styles.progressText}>100% Claimed</Typography>
            </Box>
          </Box>
        </Box>

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
        <Box sx={styles.headerRow}>
          <img src="/images/beast.png" alt="beast" height={54} />
          <Typography sx={styles.rewardTitle}>Collectable Beast</Typography>
        </Box>
        <Typography sx={styles.rewardSubtitle}>
          Defeat beasts to collect NFTs & Survivor Tokens
        </Typography>

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
          <Box sx={{ position: "relative" }}>
            <img src="/images/jackpot_dragon.png" alt="beast" height={80} />
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 16,
                "&::before, &::after": {
                  content: '""',
                  position: "absolute",
                  backgroundColor: "red",
                  transformOrigin: "center",
                },
                "&::before": {
                  top: "40%",
                  left: 0,
                  right: 0,
                  height: 2,
                  transform: "rotate(45deg)",
                },
                "&::after": {
                  top: "40%",
                  left: 0,
                  right: 0,
                  height: 2,
                  transform: "rotate(-45deg)",
                },
              }}
            />
            <Typography fontWeight={500} fontSize={13} sx={{ opacity: 0.5 }}>
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
              Each beast holds a bounty valued at ~${Math.round(Number(strkPrice || 0) * JACKPOT_AMOUNT).toLocaleString()}!
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
    mb: 1.5,
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
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    mb: 0.5,
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
    letterSpacing: 0.3,
    lineHeight: 1.2,
    opacity: 0.95,
    mb: '2px',
  },
  progressContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
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
  subsection: {
  },
  subsectionTitle: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "text.primary",
    letterSpacing: 0.3,
    opacity: 0.9,
  },
};
