import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAccount, useProvider } from "@starknet-react/core";
import { Contract } from "starknet";
import ROUTER_ABI from "@/abi/router-abi.json";
import { generateSwapCalls, getSwapQuote } from "@/api/ekubo";
import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import { useSwapStore } from "@/stores/swapStore";

/** How often to poll STRK balance (ms) */
const POLL_INTERVAL = 10_000;

/**
 * Global watcher: polls the STRK balance when an on-ramp flow is pending,
 * and automatically triggers swap+mint when the deposit arrives.
 *
 * Must be mounted inside ControllerProvider + StarknetProvider.
 */
export function useOnrampWatcher() {
  const { tokenBalances, refreshTokenBalances, purchaseGames } = useController();
  const { provider } = useProvider();
  const { address: accountAddress } = useAccount();
  const { currentNetworkConfig } = useDynamicConnector();
  const dungeon = useDungeon();

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const strkToken = useMemo(
    () => currentNetworkConfig.paymentTokens.find((t: any) => t.name === "STRK"),
    [currentNetworkConfig.paymentTokens]
  );

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

  // The swap+mint logic, extracted from PaymentOptionsModal
  const executeSwapAndMint = useCallback(async () => {
    const store = useSwapStore.getState();
    if (!dungeon.ticketAddress || !strkToken || !routerContract || store.isSwapping) return;

    store.setIsSwapping(true);
    store.setStage("quoting");

    console.log("[OnRamp:Watcher] executeSwapAndMint started", {
      strkBalance,
      gamesRequested: store.gamesRequested,
      strkToInvest: store.strkToInvest,
    });

    try {
      const currentStrkBalance = strkBalance;
      if (currentStrkBalance <= 0) {
        throw new Error("No STRK available for swap");
      }

      // Use 98% of balance to account for the ~1% transfer buffer
      const safeBalanceWei = Math.floor(currentStrkBalance * 0.98 * 1e18);
      console.log("[OnRamp:Watcher] Getting forward quote...", { safeBalanceWei });

      const forwardQuote = await getSwapQuote(
        safeBalanceWei,
        strkToken.address,
        dungeon.ticketAddress
      );

      let gamesToBuy = store.gamesRequested;

      if (forwardQuote && forwardQuote.total !== 0) {
        const maxAffordableGames = Math.floor(Math.abs(forwardQuote.total) / 1e18);
        console.log("[OnRamp:Watcher] Forward quote result:", { maxAffordableGames, gamesRequested: store.gamesRequested });
        if (maxAffordableGames < 1) {
          throw new Error("Insufficient STRK to purchase even 1 game. The price may have changed.");
        }
        gamesToBuy = Math.min(store.gamesRequested, maxAffordableGames);
      }

      if (gamesToBuy !== store.gamesRequested) {
        console.log(`[OnRamp:Watcher] Price changed: adjusted from ${store.gamesRequested} to ${gamesToBuy} game(s).`);
      }

      console.log("[OnRamp:Watcher] Getting reverse quote for", gamesToBuy, "games...");
      const quote = await getSwapQuote(
        -gamesToBuy * 1e18,
        dungeon.ticketAddress,
        strkToken.address
      );

      store.setStage("swapping");

      const tokenSwapData = {
        tokenAddress: dungeon.ticketAddress!,
        minimumAmount: gamesToBuy,
        quote,
      };
      const calls = generateSwapCalls(routerContract, strkToken.address, tokenSwapData);

      store.setStage("minting");
      purchaseGames(calls, gamesToBuy, () => {
        console.log("[OnRamp:Watcher] Games minted successfully:", gamesToBuy);
        useSwapStore.getState().complete(gamesToBuy);
      });
    } catch (error) {
      console.error("[OnRamp:Watcher] Error in swap+mint:", error);
      useSwapStore.getState().setError(
        error instanceof Error ? error.message : "Swap failed — try again"
      );
    }
  }, [strkBalance, dungeon.ticketAddress, strkToken, routerContract, purchaseGames]);

  // --- Main polling effect ---
  useEffect(() => {
    const store = useSwapStore.getState();
    const { stage, initialStrkBalance, strkToInvest, walletAddress, isSwapping } = store;

    // Only poll when we have a pending on-ramp for the current wallet
    const shouldPoll =
      stage === "waiting_deposit" &&
      initialStrkBalance !== null &&
      strkToInvest !== null &&
      walletAddress !== null &&
      accountAddress !== undefined &&
      walletAddress === accountAddress &&
      !isSwapping;

    if (!shouldPoll) {
      // Log why we're not polling (only when there's a flow in progress but conditions aren't met)
      if (stage !== "idle" && stage !== "done") {
        console.log("[OnRamp:Watcher] Not polling:", {
          stage,
          hasInitialBalance: initialStrkBalance !== null,
          hasStrkToInvest: strkToInvest !== null,
          hasWallet: walletAddress !== null,
          hasAccount: accountAddress !== undefined,
          walletMatch: walletAddress === accountAddress,
          isSwapping,
        });
      }
      stopPolling();
      return;
    }

    // Check immediately on mount / balance change
    const delta = strkBalance - initialStrkBalance;
    console.log("[OnRamp:Watcher] Poll check:", {
      strkBalance,
      initialStrkBalance,
      delta: delta.toFixed(4),
      needed: strkToInvest,
      threshold: (strkToInvest * 0.9).toFixed(4),
      meetsThreshold: delta >= strkToInvest * 0.9,
      network: currentNetworkConfig.chainId,
    });

    if (delta >= strkToInvest * 0.9 && !isSwapping) {
      console.log("[OnRamp:Watcher] STRK deposit detected! Delta:", delta.toFixed(4), ">=", (strkToInvest * 0.9).toFixed(4));
      console.log("[OnRamp:Watcher] Triggering swap+mint...");
      stopPolling();
      executeSwapAndMint();
      return;
    }

    // Start polling if not already
    if (!pollRef.current) {
      console.log("[OnRamp:Watcher] Starting balance polling (every", POLL_INTERVAL / 1000, "s)", {
        wallet: accountAddress?.slice(0, 10) + "...",
        waiting: strkToInvest.toFixed(2) + " STRK",
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
  }, [strkBalance, accountAddress, stopPolling, executeSwapAndMint, refreshTokenBalances, currentNetworkConfig.chainId]);

  // Also refresh on tab visibility change (browser throttles timers in background)
  useEffect(() => {
    const store = useSwapStore.getState();
    if (store.stage !== "waiting_deposit") return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[OnRamp:Watcher] Tab became visible, refreshing balances");
        refreshTokenBalances();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshTokenBalances]);
}
