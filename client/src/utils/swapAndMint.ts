import { generateSwapCalls, getSwapQuote } from "@/api/ekubo";
import { useSwapStore } from "@/stores/swapStore";

interface SwapAndMintParams {
  /** Amount of deposited input token (human-readable) */
  depositAmount: number;
  /** Input token address on the current network */
  inputTokenAddress: string;
  /** Input token symbol for logs/errors */
  inputTokenSymbol?: string;
  /** Input token decimals (defaults to 18) */
  inputTokenDecimals?: number;
  /** Dungeon ticket token address */
  ticketAddress: string;
  /** Ekubo router contract instance (from starknet.js) */
  routerContract: { address: string; populate: (method: string, params: any[]) => any };
  /** purchaseGames from ControllerContext */
  purchaseGames: (calls: any[], gameCount: number, onSuccess: () => void, gasTokenAddress?: string) => void;
  /** Optional gas token for paymaster execution */
  gasTokenAddress?: string;
}

const WEI = 10n ** 18n;
const MAX_GAMES_PER_BATCH = 50;

function toBufferedUnits(amount: number, decimals: number): bigint {
  const safeDecimals = Math.max(0, decimals);
  const precision = Math.min(safeDecimals, 6);
  const multiplier = 10 ** precision;
  const scaled = BigInt(Math.max(0, Math.floor(amount * multiplier)));
  const units = scaled * 10n ** BigInt(safeDecimals - precision);
  return (units * 98n) / 100n;
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
 * 1. Forward quote: how many tickets can `depositAmount` input token buy?
 * 2. Reverse quote: exact input token cost for that many tickets
 * 3. Generate swap calls via Ekubo router
 * 4. Execute purchaseGames (swap + mint in one multicall)
 *
 * Called from SwapConfirmationModal when the user confirms.
 */
export async function executeSwapAndMint({
  depositAmount,
  inputTokenAddress,
  inputTokenSymbol = "STRK",
  inputTokenDecimals = 18,
  ticketAddress,
  routerContract,
  purchaseGames,
  gasTokenAddress,
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
    inputTokenSymbol,
    inputTokenAddress: inputTokenAddress.slice(0, 10) + "...",
    ticketAddress: ticketAddress.slice(0, 10) + "...",
    gasTokenAddress: gasTokenAddress ? gasTokenAddress.slice(0, 10) + "..." : null,
  });

  try {
    if (depositAmount <= 0) {
      throw new Error(`No ${inputTokenSymbol} available for swap`);
    }

    // Use 98% of deposit to leave a small buffer for fees
    const depositUnits = toBufferedUnits(depositAmount, inputTokenDecimals);

    if (depositUnits <= 0n) {
      throw new Error(`No ${inputTokenSymbol} available for swap`);
    }

    console.log("[SwapAndMint] Getting forward quote...", {
      depositUnits: depositUnits.toString(),
      inputTokenSymbol,
    });

    const forwardQuote = await getSwapQuote(
      depositUnits,
      inputTokenAddress,
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
      throw new Error(`Not enough ${inputTokenSymbol} to purchase even 1 game. Try with a larger amount.`);
    }

    // Re-quote to capture the latest price right before execution
    const freshQuote = await getSwapQuote(depositUnits, inputTokenAddress, ticketAddress);
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
      throw new Error(`Not enough ${inputTokenSymbol} to purchase even 1 game. Try with a larger amount.`);
    }

    console.log("[SwapAndMint] Getting reverse quote for", gamesToBuy, "games...");
    const reverseAmount = -(BigInt(gamesToBuy) * WEI);
    const quote = await getSwapQuote(
      reverseAmount,
      ticketAddress,
      inputTokenAddress
    );

    store.setStage("swapping");

    const tokenSwapData = {
      tokenAddress: ticketAddress,
      minimumAmount: gamesToBuy,
      quote,
    };
    const calls = generateSwapCalls(routerContract, inputTokenAddress, tokenSwapData);

    store.setStage("minting");
    purchaseGames(calls, gamesToBuy, () => {
      console.log("[SwapAndMint] Games minted successfully:", gamesToBuy);
      useSwapStore.getState().complete(gamesToBuy);
    }, gasTokenAddress);
  } catch (error) {
    console.error("[SwapAndMint] Error:", error);
    useSwapStore.getState().setError(
      error instanceof Error ? error.message : "Swap failed — try again"
    );
  }
}

/**
 * Get the estimated number of games for a given deposited token amount.
 * Used by SwapConfirmationModal to show the user how many games they'll get.
 */
export async function estimateGamesForDeposit(
  depositAmount: number,
  inputTokenAddress: string,
  ticketAddress: string,
  inputTokenDecimals = 18
): Promise<number> {
  const depositUnits = toBufferedUnits(depositAmount, inputTokenDecimals);
  if (depositUnits <= 0n) return 0;

  const forwardQuote = await getSwapQuote(depositUnits, inputTokenAddress, ticketAddress);
  const quotedGames = Number(toAbsoluteBigInt(forwardQuote?.total) / WEI);
  return Math.min(MAX_GAMES_PER_BATCH, quotedGames);
}
