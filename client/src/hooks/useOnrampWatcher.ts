import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useController } from "@/contexts/controller";
import { useSwapStore } from "@/stores/swapStore";

/** How often to poll STRK balance (ms) */
const POLL_INTERVAL = 10_000;

/** Minimum STRK deposit to trigger detection */
const MIN_DEPOSIT_THRESHOLD = 1;

/**
 * Global watcher: polls the STRK balance when an on-ramp flow is pending,
 * and sets stage to "deposit_detected" when STRK arrives.
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
  const walletAddress = useSwapStore((s) => s.walletAddress);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Current STRK balance (human-readable number)
  const strkBalance = useMemo(() => {
    return Number(tokenBalances["STRK"] || 0);
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
      initialStrkBalance !== null &&
      walletAddress !== null &&
      accountAddress !== undefined &&
      walletAddress === accountAddress;

    if (!shouldPoll) {
      if (stage === "waiting_deposit") {
        console.log("[OnRamp:Watcher] Not polling:", {
          stage,
          hasInitialBalance: initialStrkBalance !== null,
          hasWallet: walletAddress !== null,
          hasAccount: accountAddress !== undefined,
          walletMatch: walletAddress === accountAddress,
        });
      }
      stopPolling();
      return;
    }

    // Check for deposit on every balance change
    const delta = strkBalance - initialStrkBalance;
    console.log("[OnRamp:Watcher] Poll check:", {
      strkBalance,
      initialStrkBalance,
      delta: delta.toFixed(4),
      threshold: MIN_DEPOSIT_THRESHOLD,
      meetsThreshold: delta >= MIN_DEPOSIT_THRESHOLD,
    });

    if (delta >= MIN_DEPOSIT_THRESHOLD) {
      console.log("[OnRamp:Watcher] STRK deposit detected! Delta:", delta.toFixed(4));
      stopPolling();
      useSwapStore.getState().depositDetected(delta);
      return;
    }

    // Start polling if not already
    if (!pollRef.current) {
      console.log("[OnRamp:Watcher] Starting balance polling (every", POLL_INTERVAL / 1000, "s)", {
        wallet: accountAddress?.slice(0, 10) + "...",
        currentBalance: strkBalance.toFixed(4) + " STRK",
      });
      pollRef.current = setInterval(() => {
        console.log("[OnRamp:Watcher] Polling... refreshing token balances");
        refreshTokenBalances();
      }, POLL_INTERVAL);
    }

    return () => {
      stopPolling();
    };
  }, [stage, initialStrkBalance, walletAddress, strkBalance, accountAddress, stopPolling, refreshTokenBalances]);

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
