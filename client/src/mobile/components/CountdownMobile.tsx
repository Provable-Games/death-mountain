import { OPENING_TIME } from "@/contexts/Statistics";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface CountdownMobileProps {
  onComplete?: () => void;
}

export default function CountdownMobile({ onComplete }: CountdownMobileProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = OPENING_TIME - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        onComplete?.();
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (!timeRemaining) return null;

  return (
    <Box sx={styles.container}>
      <Typography sx={styles.title}>DUNGEON OPENS IN</Typography>
      <Box sx={styles.timeContainer}>
        <Box sx={styles.timeBlock}>
          <Typography sx={styles.timeNumber}>
            {String(timeRemaining.days).padStart(2, "0")}
          </Typography>
          <Typography sx={styles.timeLabel}>DAYS</Typography>
        </Box>
        <Typography sx={styles.separator}>:</Typography>
        <Box sx={styles.timeBlock}>
          <Typography sx={styles.timeNumber}>
            {String(timeRemaining.hours).padStart(2, "0")}
          </Typography>
          <Typography sx={styles.timeLabel}>HRS</Typography>
        </Box>
        <Typography sx={styles.separator}>:</Typography>
        <Box sx={styles.timeBlock}>
          <Typography sx={styles.timeNumber}>
            {String(timeRemaining.minutes).padStart(2, "0")}
          </Typography>
          <Typography sx={styles.timeLabel}>MIN</Typography>
        </Box>
        <Typography sx={styles.separator}>:</Typography>
        <Box sx={styles.timeBlock}>
          <Typography sx={styles.timeNumber}>
            {String(timeRemaining.seconds).padStart(2, "0")}
          </Typography>
          <Typography sx={styles.timeLabel}>SEC</Typography>
        </Box>
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    width: "100%",
    bgcolor: "rgba(0, 0, 0, 0.8)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box",
    px: 2,
    py: 1.5,
    mb: 2,
  },
  title: {
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: 1.2,
    mb: 1,
  },
  timeContainer: {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
  },
  timeBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "45px",
  },
  timeNumber: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1,
    fontFamily: "monospace",
    textShadow: "0 0 8px rgba(208, 201, 141, 0.3)",
  },
  timeLabel: {
    fontSize: "0.6rem",
    letterSpacing: 0.8,
    mt: 0.3,
  },
  separator: {
    fontSize: "1.5rem",
    fontWeight: 700,
    opacity: 0.6,
    animation: "pulse 2s ease-in-out infinite",
    "@keyframes pulse": {
      "0%": { opacity: 0.6 },
      "50%": { opacity: 0.3 },
      "100%": { opacity: 0.6 },
    },
  },
};