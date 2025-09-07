import { Box, Divider, LinearProgress, Typography, Link } from "@mui/material";
import { motion } from "framer-motion";

interface DungeonRewardsProps {
  totalSurvivorTokens?: number;
  remainingSurvivorTokens?: number;
  totalCollectableBeasts?: number;
  remainingCollectableBeasts?: number;
}


function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export default function DungeonRewards({
  totalSurvivorTokens = 2000000,
  remainingSurvivorTokens = 1845678,
  totalCollectableBeasts = 93150,
  remainingCollectableBeasts = 87234
}: DungeonRewardsProps) {
  const tokenPercentage = (remainingSurvivorTokens / totalSurvivorTokens) * 100;
  const beastPercentage = (remainingCollectableBeasts / totalCollectableBeasts) * 100;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <Box sx={styles.container}>
        <Box sx={styles.header}>
          <Typography sx={styles.title}>DUNGEON REWARDS</Typography>
          <Box sx={styles.divider} />
        </Box>

        <Box sx={styles.rewardSection}>
          <Box mb={0.5}>
            <img src="/images/survivor_token.png" alt="beast" height={52} style={{ opacity: 0.8 }} />
          </Box>

          <Box sx={styles.rewardHeader}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={styles.rewardTitle}>Survivor Tokens</Typography>
              <Typography sx={styles.rewardSubtitle}>Earn by playing games</Typography>
            </Box>
          </Box>

          <Box sx={styles.progressContainer}>
            <Box sx={styles.progressBar}>
              <LinearProgress
                variant="determinate"
                value={tokenPercentage}
                sx={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  '& .MuiLinearProgress-bar': {
                    background: '#ffe082',
                    borderRadius: 6,
                  },
                }}
              />
            </Box>
            <Box sx={styles.progressOverlay}>
              <Typography sx={styles.progressText}>
                {formatNumber(remainingSurvivorTokens)} / {formatNumber(totalSurvivorTokens)}
              </Typography>
            </Box>
          </Box>

          <Typography sx={styles.remainingText}>
            {remainingSurvivorTokens.toLocaleString()} tokens remaining
          </Typography>

          <Link
            href="#"
            sx={styles.learnMoreLink}
            onClick={(e) => {
              e.preventDefault();
              window.open('https://docs.provable.games/lootsurvivor/survivor-token', '_blank');
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
              <Typography sx={styles.rewardTitle}>Collectable Beasts</Typography>
              <Typography sx={styles.rewardSubtitle}>Defeat beasts to collect NFTs</Typography>
            </Box>
          </Box>

          <Box sx={styles.progressContainer}>
            <Box sx={styles.progressBar}>
              <LinearProgress
                variant="determinate"
                value={beastPercentage}
                sx={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  '& .MuiLinearProgress-bar': {
                    background: '#ffe082',
                    borderRadius: 6,
                  },
                }}
              />
            </Box>
            <Box sx={styles.progressOverlay}>
              <Typography sx={styles.progressText}>
                {formatNumber(remainingCollectableBeasts)} / {formatNumber(totalCollectableBeasts)}
              </Typography>
            </Box>
          </Box>

          <Typography sx={styles.remainingText}>
            {remainingCollectableBeasts.toLocaleString()} beast remaining
          </Typography>

          <Link
            href="#"
            sx={styles.learnMoreLink}
            onClick={(e) => {
              e.preventDefault();
              window.open('https://docs.provable.games/lootsurvivor/beasts/collectibles', '_blank');
            }}
          >
            Learn more about Collectable Beasts
          </Link>
        </Box>
      </Box>
    </motion.div>
  );
}

const styles = {
  container: {
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
  progressBar: {
    width: '100%',
    height: 20,
    borderRadius: 6,
    border: '2px solid #d0c98d50',
    background: '#16281a',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    '& .MuiLinearProgress-bar': {
      background: '#ffe082',
      borderRadius: 6,
    },
  },
  header: {
    textAlign: 'center',
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
    width: '80%',
    height: 2,
    background: 'linear-gradient(90deg, transparent, #d7c529, transparent)',
    margin: '0 auto',
  },
  rewardSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
  },
  rewardHeader: {
    display: 'flex',
    justifyContent: 'center',
    gap: 1,
    mb: 1,
  },
  rewardTitle: {
    fontSize: "1rem",
    fontWeight: 500,
    color: "rgba(208, 201, 141, 1)",
    letterSpacing: 0.3,
  },
  rewardSubtitle: {
    fontSize: "0.8rem",
    color: "#d7c529",
    letterSpacing: 0.5,
    opacity: 0.95,
  },
  progressContainer: {
    position: 'relative',
    mb: 0.5
  },
  progressOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  progressText: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#16281a',
    textShadow: '0 0 2px rgba(255, 255, 255, 0.3)',
    letterSpacing: 0.3,
  },
  remainingText: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'rgba(208, 201, 141, 0.8)',
    textAlign: 'center',
  },
  learnMoreLink: {
    mt: 0.5,
    fontSize: '0.8rem',
    color: 'rgba(208, 201, 141, 0.6)',
    textAlign: 'center',
    textDecoration: 'underline !important',
    fontStyle: 'italic',
    cursor: 'pointer',
    '&:hover': {
      color: 'rgba(208, 201, 141, 0.8)',
    },
  },
  footer: {
    textAlign: 'center',
    mt: 2,
    pt: 2,
    borderTop: '1px solid rgba(208, 201, 141, 0.2)',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'rgba(208, 201, 141, 0.6)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};