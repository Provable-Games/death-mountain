import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { OnrampStatus, SwapStage, useSwapStore } from "@/stores/swapStore";

/** Ordered stages for the progress display (excludes idle) */
const STAGES: { key: SwapStage; label: string }[] = [
  { key: "waiting_deposit", label: "Deposit" },
  { key: "quoting", label: "Quote" },
  { key: "swapping", label: "Swap" },
  { key: "minting", label: "Mint" },
  { key: "done", label: "Ready" },
];

function stageIndex(stage: SwapStage): number {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx === -1 ? -1 : idx;
}

/** Onramp sub-status messages shown under "Waiting for deposit" */
function onrampSubMessage(onrampStatus: OnrampStatus): string | null {
  switch (onrampStatus) {
    case "new":
      return "Purchase initiated...";
    case "pending":
      return "Payment processing...";
    case "paid":
      return "Payment received, delivering STRK...";
    case "completed":
      return "STRK delivered!";
    case "canceled":
      return "Purchase was canceled";
    case "failed":
      return "Purchase failed";
    default:
      return null;
  }
}

function stageMessage(stage: SwapStage, gamesRequested: number): string {
  switch (stage) {
    case "waiting_deposit":
      return "Waiting for STRK deposit...";
    case "quoting":
      return "Getting swap quote...";
    case "swapping":
      return "Swapping STRK for tickets...";
    case "minting":
      return `Minting ${gamesRequested} game${gamesRequested > 1 ? "s" : ""}...`;
    case "done":
      return `${gamesRequested} game${gamesRequested > 1 ? "s" : ""} ready!`;
    case "error":
      return "Something went wrong";
    default:
      return "";
  }
}

export default function SwapProgressTracker() {
  const { stage, gamesRequested, errorMessage, onrampStatus, onrampProvider, reset } = useSwapStore();

  const isActive = stage !== "idle";
  const currentIdx = stageIndex(stage);
  const isError = stage === "error";
  const isDone = stage === "done";

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{ overflow: "hidden", width: "100%" }}
        >
          <Box sx={styles.container}>
            {/* Stage dots */}
            <Box sx={styles.dotsRow}>
              {STAGES.map((s, i) => {
                const isCompleted = !isError && currentIdx > i;
                const isCurrent = !isError && currentIdx === i;
                const isPending = !isError && currentIdx < i;

                return (
                  <Box key={s.key} sx={styles.dotGroup}>
                    {/* Connector line (before each dot except first) */}
                    {i > 0 && (
                      <Box
                        sx={{
                          ...styles.connector,
                          background: isCompleted
                            ? "rgba(128, 255, 0, 0.6)"
                            : isError
                              ? "rgba(244, 67, 54, 0.3)"
                              : "rgba(208, 201, 141, 0.15)",
                        }}
                      />
                    )}
                    {/* Dot */}
                    <Box
                      sx={{
                        ...styles.dot,
                        ...(isCompleted && styles.dotCompleted),
                        ...(isCurrent && styles.dotCurrent),
                        ...(isPending && styles.dotPending),
                        ...(isError && styles.dotError),
                      }}
                    >
                      {isCompleted && (
                        <Typography sx={styles.checkmark}>&#10003;</Typography>
                      )}
                      {isCurrent && !isDone && (
                        <Box sx={styles.pulse} />
                      )}
                      {isDone && isCurrent && (
                        <Typography sx={styles.checkmark}>&#10003;</Typography>
                      )}
                    </Box>
                    {/* Label */}
                    <Typography
                      sx={{
                        ...styles.dotLabel,
                        color: isCompleted || isCurrent
                          ? "#d0c98d"
                          : isError
                            ? "rgba(244, 67, 54, 0.7)"
                            : "rgba(208, 201, 141, 0.35)",
                        fontWeight: isCurrent ? 700 : 400,
                      }}
                    >
                      {s.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Status message */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${stage}-${onrampStatus}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <Typography
                  sx={{
                    ...styles.statusMessage,
                    color: isError ? "#f44336" : isDone ? "#80FF00" : "#d0c98d",
                  }}
                >
                  {isError && errorMessage
                    ? errorMessage
                    : stageMessage(stage, gamesRequested)}
                </Typography>

                {/* Onramp sub-status: shown during the deposit phase */}
                {stage === "waiting_deposit" && onrampStatus !== "idle" && (
                  <Typography
                    sx={{
                      fontSize: 9,
                      letterSpacing: 0.3,
                      textAlign: "center",
                      mt: 0.5,
                      color: onrampStatus === "paid" || onrampStatus === "completed"
                        ? "#80FF00"
                        : onrampStatus === "canceled" || onrampStatus === "failed"
                          ? "#f44336"
                          : "rgba(208, 201, 141, 0.6)",
                    }}
                  >
                    {onrampSubMessage(onrampStatus)}
                    {onrampProvider && (
                      <span style={{ opacity: 0.5 }}> via {onrampProvider}</span>
                    )}
                  </Typography>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Dismiss / retry for done and error states */}
            {(isDone || isError) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Typography
                  onClick={reset}
                  sx={styles.dismissLink}
                >
                  {isError ? "Dismiss" : "Close"}
                </Typography>
              </motion.div>
            )}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  container: {
    width: "100%",
    boxSizing: "border-box" as const,
    px: 1.5,
    py: 1.5,
    background: "rgba(24, 40, 24, 0.8)",
    border: "1px solid rgba(208, 201, 141, 0.25)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 1,
  },
  dotsRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    gap: 0,
  },
  dotGroup: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    position: "relative" as const,
    flex: 1,
  },
  connector: {
    position: "absolute" as const,
    top: 8,
    right: "50%",
    width: "100%",
    height: 2,
    zIndex: 0,
    transition: "background 0.3s ease",
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
    zIndex: 1,
    transition: "all 0.3s ease",
  },
  dotCompleted: {
    background: "rgba(128, 255, 0, 0.2)",
    border: "2px solid #80FF00",
  },
  dotCurrent: {
    background: "rgba(208, 201, 141, 0.2)",
    border: "2px solid #d0c98d",
    boxShadow: "0 0 8px rgba(208, 201, 141, 0.4)",
  },
  dotPending: {
    background: "rgba(208, 201, 141, 0.05)",
    border: "2px solid rgba(208, 201, 141, 0.2)",
  },
  dotError: {
    background: "rgba(244, 67, 54, 0.15)",
    border: "2px solid rgba(244, 67, 54, 0.5)",
  },
  checkmark: {
    fontSize: 10,
    lineHeight: 1,
    color: "#80FF00",
    fontWeight: 700,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#d0c98d",
    animation: "swapPulse 1.5s ease-in-out infinite",
    "@keyframes swapPulse": {
      "0%, 100%": { opacity: 0.4, transform: "scale(0.8)" },
      "50%": { opacity: 1, transform: "scale(1.2)" },
    },
  },
  dotLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
    mt: 0.5,
    fontFamily: "Cinzel, Georgia, serif",
    textAlign: "center" as const,
    transition: "color 0.3s ease",
  },
  statusMessage: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.5,
    textAlign: "center" as const,
    fontFamily: "Cinzel, Georgia, serif",
  },
  dismissLink: {
    fontSize: 10,
    color: "rgba(208, 201, 141, 0.6)",
    cursor: "pointer",
    textDecoration: "underline",
    letterSpacing: 0.3,
    "&:hover": {
      color: "#d0c98d",
    },
  },
};
