import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Typography } from "@mui/material";
import { useAccount } from "@starknet-react/core";
import { AnimatePresence, motion } from "framer-motion";
import { OnrampStatus, SwapStage, useSwapStore } from "@/stores/swapStore";

/** Ordered stages for the progress display (excludes idle) */
const STAGES: { key: SwapStage; label: string }[] = [
  { key: "waiting_deposit", label: "Deposit" },
  { key: "deposit_detected", label: "Confirm" },
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

function stageMessage(stage: SwapStage, gamesMinted: number): string {
  switch (stage) {
    case "waiting_deposit":
      return "Waiting for STRK deposit...";
    case "deposit_detected":
      return "STRK received — confirm swap";
    case "quoting":
      return "Getting swap quote...";
    case "swapping":
      return "Swapping STRK for tickets...";
    case "minting":
      return "Minting games...";
    case "done":
      return `${gamesMinted} game${gamesMinted > 1 ? "s" : ""} ready!`;
    case "error":
      return "Something went wrong";
    default:
      return "";
  }
}

export default function SwapProgressTracker() {
  const { stage, gamesMinted, errorMessage, onrampStatus, onrampProvider, walletAddress, depositSource, reset } = useSwapStore();
  const { address: accountAddress } = useAccount();

  // Only show when a flow is active AND the connected wallet matches the persisted flow
  const isActive = stage !== "idle" && !!accountAddress && walletAddress === accountAddress;
  const currentIdx = stageIndex(stage);
  const isError = stage === "error";
  const isDone = stage === "done";

  // Allow full-stop dismiss during early stages (before on-chain tx starts)
  const canDismiss =
    stage === "waiting_deposit" ||
    stage === "deposit_detected" ||
    isDone ||
    isError;

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
            {/* Header row: title + dismiss */}
            <Box sx={styles.headerRow}>
              <Typography sx={styles.headerTitle}>
                {isDone ? "Complete" : isError ? "Error" : depositSource === "chainrails" ? "Cross-chain" : "On-ramp"}
              </Typography>
              {canDismiss && (
                <IconButton onClick={reset} sx={styles.dismissBtn} size="small">
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              )}
            </Box>

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
                            : "rgba(208, 201, 141, 0.4)",
                        fontWeight: isCurrent ? 700 : 500,
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
                    : stageMessage(stage, gamesMinted)}
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
    py: 1,
    background: "rgba(24, 40, 24, 0.85)",
    border: "1px solid rgba(208, 201, 141, 0.25)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 0.75,
  },
  headerRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 1,
    color: "rgba(208, 201, 141, 0.5)",
    textTransform: "uppercase" as const,
  },
  dismissBtn: {
    padding: "2px",
    color: "rgba(208, 201, 141, 0.4)",
    "&:hover": {
      color: "#d0c98d",
      background: "rgba(208, 201, 141, 0.1)",
    },
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
    top: 11,
    right: "50%",
    width: "100%",
    height: 2,
    zIndex: 0,
    transition: "background 0.3s ease",
  },
  dot: {
    width: 20,
    height: 20,
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
    border: "2px solid rgba(208, 201, 141, 0.25)",
  },
  dotError: {
    background: "rgba(244, 67, 54, 0.15)",
    border: "2px solid rgba(244, 67, 54, 0.5)",
  },
  checkmark: {
    fontSize: 11,
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
};
