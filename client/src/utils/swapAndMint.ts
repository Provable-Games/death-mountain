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

const WEI = 10n ** 18n;
const MAX_GAMES_PER_BATCH = 50;

function toBufferedWeiFromStrk(amount: number): bigint {
  // Keep 4 decimals of STRK precision, then apply 98% buffer with integer math.
  const scaled = BigInt(Math.max(0, Math.floor(amount * 10_000)));
  return (scaled * 98n * WEI) / 1_000_000n;
}

function toAbsoluteBigInt(value: unknown): bigint {
  try {
    const parsed = BigInt(value as any);
    return parsed < 0n ? -parsed : parsed;
  } catch {
    return 0n;
  }
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
    const depositWei = toBufferedWeiFromStrk(depositAmount);

    if (depositWei <= 0n) {
      throw new Error("No STRK available for swap");
    }

    console.log("[SwapAndMint] Getting forward quote...", { depositWei: depositWei.toString() });

    const forwardQuote = await getSwapQuote(
      depositWei,
      strkTokenAddress,
      ticketAddress
    );

    const quotedGames = Number(toAbsoluteBigInt(forwardQuote?.total) / WEI);
    let gamesToBuy = Math.min(MAX_GAMES_PER_BATCH, quotedGames);

    console.log("[SwapAndMint] Forward quote result:", {
      quotedGames,
      gamesToBuy,
      maxPerBatch: MAX_GAMES_PER_BATCH,
    });

    if (gamesToBuy < 1) {
      throw new Error("Not enough STRK to purchase even 1 game. Try with a larger amount.");
    }

    // Re-quote to capture the latest price right before execution
    const freshQuote = await getSwapQuote(depositWei, strkTokenAddress, ticketAddress);
    const freshGames = Number(toAbsoluteBigInt(freshQuote?.total) / WEI);

    if (freshGames < gamesToBuy) {
      console.warn("[SwapAndMint] Slippage detected: quote dropped from", gamesToBuy, "to", freshGames);
      gamesToBuy = freshGames;
    }

    // Safety margin: buy 1 less game to absorb residual slippage between quote and on-chain execution
    if (gamesToBuy > 1) {
      gamesToBuy -= 1;
      console.log("[SwapAndMint] Applied safety margin, buying", gamesToBuy, "games");
    }

    if (gamesToBuy < 1) {
      throw new Error("Not enough STRK to purchase even 1 game. Try with a larger amount.");
    }

    console.log("[SwapAndMint] Getting reverse quote for", gamesToBuy, "games...");
    const reverseAmount = -(BigInt(gamesToBuy) * WEI);
    const quote = await getSwapQuote(
      reverseAmount,
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
  const depositWei = toBufferedWeiFromStrk(depositAmount);
  if (depositWei <= 0n) return 0;

  const forwardQuote = await getSwapQuote(depositWei, strkTokenAddress, ticketAddress);
  const quotedGames = Number(toAbsoluteBigInt(forwardQuote?.total) / WEI);
  return Math.min(MAX_GAMES_PER_BATCH, quotedGames);
}
