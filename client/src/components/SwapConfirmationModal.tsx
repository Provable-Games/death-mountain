import ROUTER_ABI from "@/abi/router-abi.json";
import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import { useSwapStore } from "@/stores/swapStore";
import { executeSwapAndMint, estimateGamesForDeposit } from "@/utils/swapAndMint";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import { useAccount, useProvider } from "@starknet-react/core";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Contract } from "starknet";

/**
 * Confirmation modal shown when a supported deposit is detected.
 * Displays how much token arrived and estimated games, lets user
 * confirm the swap or dismiss.
 *
 * Style: centered card, Loot Survivor design (dark green, gold accents).
 */
export default function SwapConfirmationModal() {
  const { stage, depositAmount, depositTokenSymbol, walletAddress, isSwapping, reset } = useSwapStore();
  const { purchaseGames } = useController();
  const { provider } = useProvider();
  const { address: accountAddress } = useAccount();
  const { currentNetworkConfig } = useDynamicConnector();
  const dungeon = useDungeon();

  const [estimatedGames, setEstimatedGames] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const routerContract = useMemo(
    () =>
      currentNetworkConfig.ekuboRouter
        ? new Contract({
            abi: ROUTER_ABI,
            address: currentNetworkConfig.ekuboRouter,
            providerOrAccount: provider,
          })
        : null,
    [provider, currentNetworkConfig.ekuboRouter]
  );

  const depositToken = useMemo(
    () => currentNetworkConfig.paymentTokens.find((t: any) => t.name === (depositTokenSymbol || "STRK")),
    [currentNetworkConfig.paymentTokens, depositTokenSymbol]
  );

  const show =
    stage === "deposit_detected" &&
    depositAmount !== null &&
    depositAmount > 0 &&
    walletAddress !== null &&
    accountAddress !== undefined &&
    walletAddress === accountAddress;

  // Fetch estimated games when modal becomes visible
  useEffect(() => {
    if (!show || !depositToken || !dungeon.ticketAddress || !depositAmount) return;

    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);
    setEstimatedGames(null);

    estimateGamesForDeposit(
      depositAmount,
      depositToken.address,
      dungeon.ticketAddress,
      depositToken.decimals || 18
    )
      .then((games) => {
        if (!cancelled) {
          setEstimatedGames(games);
          setQuoteLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[SwapConfirmation] Quote error:", err);
          setQuoteError("Could not estimate games");
          setQuoteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [show, depositAmount, depositToken, dungeon.ticketAddress]);

  const handleConfirm = useCallback(() => {
    if (!depositAmount || !depositToken || !dungeon.ticketAddress || !routerContract) return;

    const gasTokenAddress = depositToken.name === "USDC" ? depositToken.address : undefined;

    executeSwapAndMint({
      depositAmount,
      inputTokenAddress: depositToken.address,
      inputTokenSymbol: depositToken.name || depositTokenSymbol || "STRK",
      inputTokenDecimals: depositToken.decimals || 18,
      ticketAddress: dungeon.ticketAddress,
      routerContract,
      purchaseGames,
      gasTokenAddress,
    });
  }, [depositAmount, depositToken, depositTokenSymbol, dungeon.ticketAddress, routerContract, purchaseGames]);

  const handleDismiss = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <AnimatePresence>
      {show && (
        <Box sx={styles.overlay}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Box sx={styles.card}>
              <Box sx={styles.cardGlow} />

              <IconButton onClick={handleDismiss} sx={styles.closeBtn} size="small">
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>

              {/* Title */}
              <Box sx={styles.titleContainer}>
                <Typography sx={styles.title}>{depositTokenSymbol || "STRK"} RECEIVED</Typography>
                <Box sx={styles.titleUnderline} />
              </Box>

              <Typography sx={styles.subtitle}>
                Your tokens have arrived
              </Typography>

              {/* Deposit info */}
              <Box sx={styles.infoCard}>
                <Typography sx={styles.depositAmount}>
                  +{depositAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {depositTokenSymbol || "STRK"}
                </Typography>

                {quoteLoading && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <CircularProgress size={14} sx={{ color: "#d0c98d" }} />
                    <Typography sx={styles.estimateText}>
                      Estimating games...
                    </Typography>
                  </Box>
                )}

                {!quoteLoading && estimatedGames !== null && estimatedGames > 0 && (
                  <Typography sx={styles.estimateText}>
                    Enough for ~{estimatedGames} game{estimatedGames > 1 ? "s" : ""}
                  </Typography>
                )}

                {!quoteLoading && estimatedGames === 0 && (
                  <Typography sx={{ ...styles.estimateText, color: "#f44336" }}>
                    Not enough for a game
                  </Typography>
                )}

                {quoteError && (
                  <Typography sx={{ ...styles.estimateText, color: "rgba(255,255,255,0.4)" }}>
                    {quoteError}
                  </Typography>
                )}
              </Box>

              {/* Confirm button */}
              <Button
                fullWidth
                variant="contained"
                onClick={handleConfirm}
                disabled={isSwapping || quoteLoading || estimatedGames === 0}
                sx={styles.confirmButton}
              >
                <Typography sx={styles.buttonText}>
                  {isSwapping ? "Swapping..." : "Swap & Play"}
                </Typography>
              </Button>

              {/* Dismiss link */}
              {!isSwapping && (
                <Typography onClick={handleDismiss} sx={styles.dismissLink}>
                  Not now
                </Typography>
              )}

              {/* Bottom glow bar */}
              <Box sx={styles.glowBar} />
            </Box>
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2400,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
  },
  card: {
    width: 360,
    maxWidth: "90dvw",
    p: 3,
    pt: 2.5,
    boxSizing: "border-box" as const,
    borderRadius: "12px",
    background: "linear-gradient(145deg, #1a2f1a 0%, #0f1f0f 100%)",
    border: "2px solid rgba(208, 201, 141, 0.35)",
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.8), 0 0 32px rgba(208, 201, 141, 0.08)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    position: "relative" as const,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute" as const,
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: "13px",
    background: "linear-gradient(135deg, rgba(208, 201, 141, 0.1) 0%, transparent 50%, rgba(128, 255, 0, 0.05) 100%)",
    pointerEvents: "none" as const,
    zIndex: 0,
  },
  closeBtn: {
    position: "absolute" as const,
    top: 10,
    right: 10,
    color: "#d0c98d",
    background: "rgba(208, 201, 141, 0.08)",
    border: "1px solid rgba(208, 201, 141, 0.15)",
    padding: "4px",
    "&:hover": {
      background: "rgba(208, 201, 141, 0.18)",
    },
    zIndex: 2,
  },
  titleContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    mb: 0.5,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#d0c98d",
    fontFamily: "Cinzel, Georgia, serif",
    textShadow: "0 2px 8px rgba(208, 201, 141, 0.3)",
  },
  titleUnderline: {
    width: 40,
    height: 2,
    mt: 0.5,
    background: "linear-gradient(90deg, transparent, #d0c98d, transparent)",
    borderRadius: 1,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(208, 201, 141, 0.7)",
    letterSpacing: 0.5,
    mb: 2,
    zIndex: 1,
  },
  infoCard: {
    width: "100%",
    px: 2.5,
    py: 2,
    mb: 2.5,
    background: "rgba(208, 201, 141, 0.06)",
    border: "1px solid rgba(208, 201, 141, 0.18)",
    borderRadius: "8px",
    textAlign: "center" as const,
    zIndex: 1,
  },
  depositAmount: {
    fontSize: 24,
    fontWeight: 700,
    color: "#80FF00",
    letterSpacing: 0.5,
    textShadow: "0 1px 8px rgba(128, 255, 0, 0.3)",
  },
  estimateText: {
    fontSize: 13,
    color: "rgba(208, 201, 141, 0.8)",
    mt: 0.5,
    letterSpacing: 0.3,
  },
  confirmButton: {
    py: 1.5,
    mb: 1,
    borderRadius: "8px",
    background: "linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 100%)",
    border: "1px solid rgba(208, 201, 141, 0.35)",
    textTransform: "none" as const,
    zIndex: 1,
    "&:hover": {
      background: "linear-gradient(135deg, #3a5a3a 0%, #2a4a2a 100%)",
      borderColor: "rgba(208, 201, 141, 0.5)",
    },
    "&:disabled": {
      background: "rgba(208, 201, 141, 0.08)",
      borderColor: "rgba(208, 201, 141, 0.1)",
    },
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#d0c98d",
    fontFamily: "Cinzel, Georgia, serif",
  },
  dismissLink: {
    fontSize: 12,
    color: "rgba(208, 201, 141, 0.5)",
    cursor: "pointer",
    letterSpacing: 0.3,
    zIndex: 1,
    "&:hover": {
      color: "#d0c98d",
      textDecoration: "underline",
    },
  },
  glowBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    background: "linear-gradient(90deg, transparent 0%, rgba(128, 255, 0, 0.4) 50%, transparent 100%)",
    zIndex: 1,
  },
};
