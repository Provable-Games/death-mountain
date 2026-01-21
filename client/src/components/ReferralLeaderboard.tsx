import { Box, CircularProgress, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  fetchLeaderboard,
  LeaderboardEntry,
  truncateAddress,
} from "@/utils/referral";

interface ReferralLeaderboardProps {
  maxEntries?: number;
}

export default function ReferralLeaderboard({
  maxEntries = 10,
}: ReferralLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data.slice(0, maxEntries));
      setError(null);
    } catch (err) {
      setError("Failed to load leaderboard");
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [maxEntries]);

  useEffect(() => {
    loadLeaderboard();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span style={{ fontSize: "1.1rem" }}>&#x1F947;</span>; // Gold medal
      case 2:
        return <span style={{ fontSize: "1.1rem" }}>&#x1F948;</span>; // Silver medal
      case 3:
        return <span style={{ fontSize: "1.1rem" }}>&#x1F949;</span>; // Bronze medal
      default:
        return (
          <Typography sx={styles.rankNumber}>{rank}</Typography>
        );
    }
  };

  const getPrize = (rank: number): string => {
    const prizes: Record<number, number> = {
      1: 25000,
      2: 15000,
      3: 9000,
      4: 6000,
      5: 4500,
      6: 3500,
      7: 2500,
      8: 1500,
      9: 1500,
      10: 1500,
    };
    const prize = prizes[rank];
    return prize ? prize.toLocaleString() : "—";
  };

  if (loading) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress size={24} sx={{ color: "#d7c529" }} />
        <Typography sx={styles.loadingText}>Loading leaderboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={styles.errorContainer}>
        <Typography sx={styles.errorText}>{error}</Typography>
      </Box>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Box sx={styles.emptyContainer}>
        <Typography sx={styles.emptyText}>
          No referrals yet. Be the first!
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Typography sx={styles.title}>REFERRAL LEADERBOARD</Typography>
      <Typography sx={styles.subtitle}>Refreshes every 30 minutes.</Typography>

      <Box sx={styles.headerRow}>
        <Typography sx={[styles.headerCell, { width: "40px" }]}>Rank</Typography>
        <Typography sx={[styles.headerCell, { width: "70px", textAlign: "center" }]}>
          Prize
        </Typography>
        <Typography sx={[styles.headerCell, { flex: 1 }]}>Referrer</Typography>
        <Typography sx={[styles.headerCell, { width: "60px", textAlign: "center" }]}>
          Refs
        </Typography>
        <Typography sx={[styles.headerCell, { width: "70px", textAlign: "right" }]}>
          Points
        </Typography>
      </Box>

      <Box sx={styles.scrollableList}>
      {leaderboard.map((entry) => (
        <Box
          key={entry.referrer_address}
          sx={[
            styles.row,
            entry.rank <= 3 && styles.topThreeRow,
          ]}
        >
          <Box sx={[styles.cell, { width: "40px", justifyContent: "center" }]}>
            {getTrophyIcon(entry.rank)}
          </Box>
          <Box sx={[styles.cell, { width: "70px", justifyContent: "center" }]}>
            <Typography sx={styles.prizeValue}>{getPrize(entry.rank)}</Typography>
          </Box>
          <Box sx={[styles.cell, { flex: 1 }]}>
            <Typography sx={styles.playerName}>
              {entry.referrer_username || truncateAddress(entry.referrer_address, 4)}
            </Typography>
          </Box>
          <Box sx={[styles.cell, { width: "60px", justifyContent: "center" }]}>
            <Typography sx={styles.statValue}>{entry.total_points}</Typography>
          </Box>
          <Box sx={[styles.cell, { width: "70px", justifyContent: "flex-end" }]}>
            <Typography sx={styles.pointsValue}>
              {entry.points.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      ))}
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    width: "100%",
  },
  scrollableList: {
    maxHeight: "200px",
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-track": {
      bgcolor: "rgba(0, 0, 0, 0.2)",
      borderRadius: "2px",
    },
    "&::-webkit-scrollbar-thumb": {
      bgcolor: "rgba(208, 201, 141, 0.3)",
      borderRadius: "2px",
      "&:hover": {
        bgcolor: "rgba(208, 201, 141, 0.5)",
      },
    },
  },
  title: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#d7c529",
    letterSpacing: 0.5,
    textAlign: "center",
    mb: 0.25,
  },
  subtitle: {
    fontSize: "0.65rem",
    fontWeight: 400,
    color: "rgba(208, 201, 141, 0.6)",
    textAlign: "center",
    mb: 1,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    pb: 0.5,
    mb: 0.5,
    borderBottom: "1px solid rgba(208, 201, 141, 0.2)",
  },
  headerCell: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "rgba(208, 201, 141, 0.6)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  row: {
    display: "flex",
    alignItems: "center",
    py: 0.5,
    borderRadius: "4px",
    transition: "background-color 0.2s",
    "&:hover": {
      bgcolor: "rgba(208, 201, 141, 0.05)",
    },
  },
  topThreeRow: {
    bgcolor: "rgba(215, 197, 41, 0.08)",
  },
  cell: {
    display: "flex",
    alignItems: "center",
  },
  rankNumber: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "rgba(208, 201, 141, 0.7)",
    width: "20px",
    textAlign: "center",
  },
  playerName: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "text.primary",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  statValue: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "rgba(208, 201, 141, 0.8)",
  },
  pointsValue: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#d7c529",
  },
  prizeValue: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "rgba(208, 201, 141, 0.9)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    py: 3,
    gap: 1,
  },
  loadingText: {
    fontSize: "0.75rem",
    color: "rgba(208, 201, 141, 0.6)",
  },
  errorContainer: {
    display: "flex",
    justifyContent: "center",
    py: 2,
  },
  errorText: {
    fontSize: "0.75rem",
    color: "#ff6b6b",
  },
  emptyContainer: {
    display: "flex",
    justifyContent: "center",
    py: 2,
  },
  emptyText: {
    fontSize: "0.8rem",
    color: "rgba(208, 201, 141, 0.6)",
    fontStyle: "italic",
  },
};
