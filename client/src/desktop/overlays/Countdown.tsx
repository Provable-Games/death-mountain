import { OPENING_TIME } from "@/contexts/Statistics";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface CountdownProps {
  onComplete?: () => void;
}

export default function Countdown({ onComplete }: CountdownProps) {
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
          <Typography sx={styles.timeLabel}>HOURS</Typography>
        </Box>
        <Typography sx={styles.separator}>:</Typography>
        <Box sx={styles.timeBlock}>
          <Typography sx={styles.timeNumber}>
            {String(timeRemaining.minutes).padStart(2, "0")}
          </Typography>
          <Typography sx={styles.timeLabel}>MINS</Typography>
        </Box>
        <Typography sx={styles.separator}>:</Typography>
        <Box sx={styles.timeBlock}>
          <Typography sx={styles.timeNumber}>
            {String(timeRemaining.seconds).padStart(2, "0")}
          </Typography>
          <Typography sx={styles.timeLabel}>SECS</Typography>
        </Box>
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    position: "absolute",
    top: 32,
    left: "50%",
    transform: "translateX(-50%)",
    bgcolor: "rgba(24, 40, 24, 0.55)",
    border: "2px solid #083e22",
    borderRadius: "12px",
    backdropFilter: "blur(8px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    px: 3,
    py: 2,
    zIndex: 10,
    minWidth: 320,
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    letterSpacing: 1.5,
    color: "#d0c98d",
    mb: 1.5,
  },
  timeContainer: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  timeBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  timeNumber: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1,
    fontFamily: "monospace",
    textShadow: "0 0 10px rgba(208, 201, 141, 0.3)",
  },
  timeLabel: {
    fontSize: "0.7rem",
    color: "#d0c98d",
    letterSpacing: 1,
    mt: 0.5,
  },
  separator: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#d0c98d",
    opacity: 0.6,
    animation: "pulse 2s ease-in-out infinite",
    "@keyframes pulse": {
      "0%": { opacity: 0.6 },
      "50%": { opacity: 0.3 },
      "100%": { opacity: 0.6 },
    },
  },
};