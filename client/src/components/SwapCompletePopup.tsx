import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useSwapStore } from "@/stores/swapStore";
import { useEffect, useState } from "react";

/**
 * A small notification popup that appears in the bottom-right of the screen
 * when games are minted and ready to play. Auto-dismisses after 8 seconds.
 * Styled in the Loot Survivor design language.
 */
export default function SwapCompletePopup() {
  const { stage, gamesMinted, popupDismissed, dismissPopup } = useSwapStore();
  const [visible, setVisible] = useState(false);

  const show = stage === "done" && gamesMinted > 0 && !popupDismissed;

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        dismissPopup();
        setVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, dismissPopup]);

  const handleClose = () => {
    dismissPopup();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <Box sx={styles.positioner}>
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Paper elevation={16} sx={styles.card}>
              <IconButton
                onClick={handleClose}
                sx={styles.closeBtn}
                aria-label="Close"
                size="small"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>

              {/* Icon */}
              <Box sx={styles.iconContainer}>
                <Box
                  component="img"
                  src="/images/dungeon_ticket.png"
                  alt="Game Ready"
                  sx={styles.ticketIcon}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </Box>

              {/* Title */}
              <Typography sx={styles.title}>
                {gamesMinted > 1 ? "Games Ready!" : "Game Ready!"}
              </Typography>

              {/* Description */}
              <Typography sx={styles.description}>
                {gamesMinted} game{gamesMinted > 1 ? "s have" : " has"} been
                minted and {gamesMinted > 1 ? "are" : "is"} ready to play.
              </Typography>

              {/* Glow bar at bottom */}
              <Box sx={styles.glowBar} />
            </Paper>
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  );
}

const styles = {
  positioner: {
    position: "fixed" as const,
    bottom: 24,
    right: 24,
    zIndex: 2500,
    pointerEvents: "auto" as const,
  },
  card: {
    width: 280,
    maxWidth: "90dvw",
    p: 2.5,
    pt: 2,
    boxSizing: "border-box" as const,
    borderRadius: 3,
    background:
      "linear-gradient(145deg, #1a2f1a 0%, #0f1f0f 100%)",
    border: "2px solid rgba(128, 255, 0, 0.35)",
    boxShadow:
      "0 12px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(128, 255, 0, 0.1)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    position: "relative" as const,
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    color: "#d0c98d",
    background: "rgba(208, 201, 141, 0.08)",
    border: "1px solid rgba(208, 201, 141, 0.15)",
    padding: "3px",
    "&:hover": {
      background: "rgba(208, 201, 141, 0.18)",
    },
    zIndex: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    mb: 1,
    background: "rgba(128, 255, 0, 0.08)",
    borderRadius: "50%",
    border: "1px solid rgba(128, 255, 0, 0.2)",
  },
  ticketIcon: {
    width: 28,
    height: 28,
    objectFit: "contain" as const,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#80FF00",
    textShadow: "0 1px 6px rgba(128, 255, 0, 0.3)",
    fontFamily: "Cinzel, Georgia, serif",
    textAlign: "center" as const,
    mb: 0.5,
  },
  description: {
    fontSize: 12,
    color: "rgba(208, 201, 141, 0.8)",
    textAlign: "center" as const,
    letterSpacing: 0.3,
    lineHeight: 1.4,
  },
  glowBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    background:
      "linear-gradient(90deg, transparent 0%, rgba(128, 255, 0, 0.5) 50%, transparent 100%)",
  },
};
