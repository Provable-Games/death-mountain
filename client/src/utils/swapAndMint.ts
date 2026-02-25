import { generateSwapCalls, getSwapQuote } from "@/api/ekubo";
import { useSwapStore } from "@/stores/swapStore";

interface SwapAndMintParams {
  /** Amount of STRK deposited (human-readable, e.g. 1113.5) */
  depositAmount: number;
  /** STRK token address on the current network */
  strkTokenAddress: string;
  /** Dungeon ticket token address */
  ticketAddress: string;
  /** Ekubo router contract instance (from starknet.js) */
  routerContract: { address: string; populate: (method: string, params: any[]) => any };
  /** purchaseGames from ControllerContext */
  purchaseGames: (calls: any[], gameCount: number, onSuccess: () => void) => void;
}

/**
 * Standalone swap+mint function.
 *
 * 1. Forward quote: how many tickets can `depositAmount` STRK buy?
 * 2. Reverse quote: exact STRK cost for that many tickets
 * 3. Generate swap calls via Ekubo router
 * 4. Execute purchaseGames (swap + mint in one multicall)
 *
 * Called from SwapConfirmationModal when the user confirms.
 */
export async function executeSwapAndMint({
  depositAmount,
  strkTokenAddress,
  ticketAddress,
  routerContract,
  purchaseGames,
}: SwapAndMintParams): Promise<void> {
  const store = useSwapStore.getState();

  if (store.isSwapping) {
    console.warn("[SwapAndMint] Already swapping, ignoring duplicate call");
    return;
  }

  store.setIsSwapping(true);
  store.setStage("quoting");

  console.log("[SwapAndMint] Starting swap+mint", {
    depositAmount,
    strkTokenAddress: strkTokenAddress.slice(0, 10) + "...",
    ticketAddress: ticketAddress.slice(0, 10) + "...",
  });

  try {
    if (depositAmount <= 0) {
      throw new Error("No STRK available for swap");
    }

    // Use 98% of deposit to leave a small buffer for fees
    const depositWei = Math.floor(depositAmount * 0.98 * 1e18);

    console.log("[SwapAndMint] Getting forward quote...", { depositWei });

    const forwardQuote = await getSwapQuote(
      depositWei,
      strkTokenAddress,
      ticketAddress
    );

    let gamesToBuy = 0;

    if (forwardQuote && forwardQuote.total !== 0) {
      gamesToBuy = Math.floor(Math.abs(forwardQuote.total) / 1e18);
      console.log("[SwapAndMint] Forward quote result:", { gamesToBuy });
    }

    if (gamesToBuy < 1) {
      throw new Error("Not enough STRK to purchase even 1 game. Try with a larger amount.");
    }

    console.log("[SwapAndMint] Getting reverse quote for", gamesToBuy, "games...");
    const quote = await getSwapQuote(
      -gamesToBuy * 1e18,
      ticketAddress,
      strkTokenAddress
    );

    store.setStage("swapping");

    const tokenSwapData = {
      tokenAddress: ticketAddress,
      minimumAmount: gamesToBuy,
      quote,
    };
    const calls = generateSwapCalls(routerContract, strkTokenAddress, tokenSwapData);

    store.setStage("minting");
    purchaseGames(calls, gamesToBuy, () => {
      console.log("[SwapAndMint] Games minted successfully:", gamesToBuy);
      useSwapStore.getState().complete(gamesToBuy);
    });
  } catch (error) {
    console.error("[SwapAndMint] Error:", error);
    useSwapStore.getState().setError(
      error instanceof Error ? error.message : "Swap failed — try again"
    );
  }
}

/**
 * Get the estimated number of games for a given STRK deposit amount.
 * Used by SwapConfirmationModal to show the user how many games they'll get.
 */
export async function estimateGamesForDeposit(
  depositAmount: number,
  strkTokenAddress: string,
  ticketAddress: string
): Promise<number> {
  const depositWei = Math.floor(depositAmount * 0.98 * 1e18);
  const forwardQuote = await getSwapQuote(depositWei, strkTokenAddress, ticketAddress);

  if (forwardQuote && forwardQuote.total !== 0) {
    return Math.floor(Math.abs(forwardQuote.total) / 1e18);
  }
  return 0;
}
