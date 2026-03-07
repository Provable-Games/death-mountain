import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useController } from "@/contexts/controller";
import { useSwapStore } from "@/stores/swapStore";

/** How often to poll deposit balances (ms) */
const POLL_INTERVAL = 10_000;

/** Minimum deposit deltas to trigger detection */
const MIN_STRK_DEPOSIT_THRESHOLD = 1;
const MIN_USDC_DEPOSIT_THRESHOLD = 0.01;

/**
 * Global watcher: polls balances when a funded flow is pending,
 * and sets stage to "deposit_detected" when the expected token arrives.
 *
 * Does NOT execute the swap — that is triggered by user confirmation
 * via SwapConfirmationModal.
 *
 * Must be mounted inside ControllerProvider + StarknetProvider.
 */
export function useOnrampWatcher() {
  const { tokenBalances, refreshTokenBalances } = useController();
  const { address: accountAddress } = useAccount();
  const stage = useSwapStore((s) => s.stage);
  const initialStrkBalance = useSwapStore((s) => s.initialStrkBalance);
  const initialUsdcBalance = useSwapStore((s) => s.initialUsdcBalance);
  const depositSource = useSwapStore((s) => s.depositSource);
  const walletAddress = useSwapStore((s) => s.walletAddress);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Current STRK balance (human-readable number)
  const strkBalance = useMemo(() => {
    return Number(tokenBalances["STRK"] || 0);
  }, [tokenBalances]);

  // Current USDC balance (human-readable number)
  const usdcBalance = useMemo(() => {
    return Number(tokenBalances["USDC"] || 0);
  }, [tokenBalances]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // --- Main polling effect ---
  useEffect(() => {
    // Only poll when we have a pending on-ramp for the current wallet
    const shouldPoll =
      stage === "waiting_deposit" &&
      initialStrkBalance != null &&
      initialUsdcBalance != null &&
      walletAddress !== null &&
      accountAddress !== undefined &&
      walletAddress === accountAddress;

    if (!shouldPoll) {
      if (stage === "waiting_deposit") {
        console.log("[OnRamp:Watcher] Not polling:", {
          stage,
          hasInitialBalance: initialStrkBalance != null,
          hasInitialUsdcBalance: initialUsdcBalance != null,
          depositSource,
          hasWallet: walletAddress !== null,
          hasAccount: accountAddress !== undefined,
          walletMatch: walletAddress === accountAddress,
        });
      }
      stopPolling();
      return;
    }

    // Check for deposit on every balance change
    const deltaStrk = strkBalance - initialStrkBalance;
    const deltaUsdc = usdcBalance - initialUsdcBalance;
    console.log("[OnRamp:Watcher] Poll check:", {
      depositSource,
      strkBalance,
      initialStrkBalance,
      deltaStrk: deltaStrk.toFixed(4),
      usdcBalance,
      initialUsdcBalance,
      deltaUsdc: deltaUsdc.toFixed(4),
    });

    if (depositSource === "chainrails") {
      if (deltaUsdc >= MIN_USDC_DEPOSIT_THRESHOLD) {
        console.log("[OnRamp:Watcher] USDC deposit detected! Delta:", deltaUsdc.toFixed(4));
        stopPolling();
        useSwapStore.getState().depositDetected(deltaUsdc, "USDC");
        return;
      }
    } else if (deltaStrk >= MIN_STRK_DEPOSIT_THRESHOLD) {
      console.log("[OnRamp:Watcher] STRK deposit detected! Delta:", deltaStrk.toFixed(4));
      stopPolling();
      useSwapStore.getState().depositDetected(deltaStrk, "STRK");
      return;
    }

    // Start polling if not already
    if (!pollRef.current) {
      console.log("[OnRamp:Watcher] Starting balance polling (every", POLL_INTERVAL / 1000, "s)", {
        wallet: accountAddress?.slice(0, 10) + "...",
        depositSource,
        currentBalance: strkBalance.toFixed(4) + " STRK",
        currentUsdcBalance: usdcBalance.toFixed(4) + " USDC",
      });
      pollRef.current = setInterval(() => {
        console.log("[OnRamp:Watcher] Polling... refreshing token balances");
        refreshTokenBalances();
      }, POLL_INTERVAL);
    }

    return () => {
      stopPolling();
    };
  }, [
    stage,
    initialStrkBalance,
    initialUsdcBalance,
    depositSource,
    walletAddress,
    strkBalance,
    usdcBalance,
    accountAddress,
    stopPolling,
    refreshTokenBalances,
  ]);

  // Also refresh on tab visibility change (browser throttles timers in background)
  useEffect(() => {
    if (stage !== "waiting_deposit") return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[OnRamp:Watcher] Tab became visible, refreshing balances");
        refreshTokenBalances();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [stage, refreshTokenBalances]);
}
