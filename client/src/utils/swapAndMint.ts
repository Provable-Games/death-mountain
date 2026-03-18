import { generateSwapCalls, getSwapQuote } from "@/api/ekubo";
import { useSwapStore } from "@/stores/swapStore";

const STRK_RESERVE_USDC = 0.10;

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
  /** Optional reserve output token address (used for a small STRK buffer on cross-chain USDC flows) */
  reserveTokenAddress?: string;
  reserveTokenSymbol?: string;
  reserveInputAmount?: number;
  /** Ekubo router contract instance (from starknet.js) */
  routerContract: { address: string; populate: (method: string, params: any[]) => any };
  /** purchaseGames from ControllerContext */
  purchaseGames: (calls: any[], gameCount: number, onSuccess: () => void, gasTokenAddress?: string) => void;
}

const WEI = 10n ** 18n;
const MAX_GAMES_PER_BATCH = 50;

function toUnits(amount: number, decimals: number): bigint {
  const safeDecimals = Math.max(0, decimals);
  const precision = Math.min(safeDecimals, 6);
  const multiplier = 10 ** precision;
  const scaled = BigInt(Math.max(0, Math.floor(amount * multiplier)));
  return scaled * 10n ** BigInt(safeDecimals - precision);
}

function toBufferedUnits(amount: number, decimals: number): bigint {
  const units = toUnits(amount, decimals);
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

interface TicketPurchasePlan {
  gamesToBuy: number;
  reverseQuote: any;
  inputAmount: number;
}

interface SwapPreview {
  gamesToBuy: number;
  reserveEnabled: boolean;
}

async function planTicketPurchase(
  inputAmount: number,
  inputTokenAddress: string,
  ticketAddress: string,
  inputTokenDecimals: number
): Promise<TicketPurchasePlan> {
  const depositUnits = toBufferedUnits(inputAmount, inputTokenDecimals);

  if (depositUnits <= 0n) {
    return { gamesToBuy: 0, reverseQuote: null, inputAmount };
  }

  const forwardQuote = await getSwapQuote(depositUnits, inputTokenAddress, ticketAddress);
  const quotedGames = Number(toAbsoluteBigInt(forwardQuote?.total) / WEI);
  let gamesToBuy = Math.min(MAX_GAMES_PER_BATCH, quotedGames);

  if (gamesToBuy < 1) {
    return { gamesToBuy: 0, reverseQuote: null, inputAmount };
  }

  const freshQuote = await getSwapQuote(depositUnits, inputTokenAddress, ticketAddress);
  const freshGames = Number(toAbsoluteBigInt(freshQuote?.total) / WEI);

  if (freshGames < gamesToBuy) {
    gamesToBuy = freshGames;
  }

  if (gamesToBuy > 1) {
    gamesToBuy -= 1;
  }

  if (gamesToBuy < 1) {
    return { gamesToBuy: 0, reverseQuote: null, inputAmount };
  }

  const reverseAmount = -(BigInt(gamesToBuy) * WEI);
  const reverseQuote = await getSwapQuote(reverseAmount, ticketAddress, inputTokenAddress);

  return { gamesToBuy, reverseQuote, inputAmount };
}

async function buildSwapPreview(
  depositAmount: number,
  inputTokenAddress: string,
  ticketAddress: string,
  inputTokenDecimals: number,
  reserveInputAmount = 0
): Promise<SwapPreview> {
  if (reserveInputAmount > 0 && depositAmount > reserveInputAmount) {
    const reservedPlan = await planTicketPurchase(
      depositAmount - reserveInputAmount,
      inputTokenAddress,
      ticketAddress,
      inputTokenDecimals
    );

    if (reservedPlan.gamesToBuy >= 1) {
      return { gamesToBuy: reservedPlan.gamesToBuy, reserveEnabled: true };
    }
  }

  const fullPlan = await planTicketPurchase(
    depositAmount,
    inputTokenAddress,
    ticketAddress,
    inputTokenDecimals
  );

  return { gamesToBuy: fullPlan.gamesToBuy, reserveEnabled: false };
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
  reserveTokenAddress,
  reserveTokenSymbol = "STRK",
  reserveInputAmount = 0,
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
    inputTokenSymbol,
    inputTokenAddress: inputTokenAddress.slice(0, 10) + "...",
    ticketAddress: ticketAddress.slice(0, 10) + "...",
    reserveTokenAddress: reserveTokenAddress ? reserveTokenAddress.slice(0, 10) + "..." : null,
    reserveInputAmount,
  });

  try {
    if (depositAmount <= 0) {
      throw new Error(`No ${inputTokenSymbol} available for swap`);
    }

    const preview = await buildSwapPreview(
      depositAmount,
      inputTokenAddress,
      ticketAddress,
      inputTokenDecimals,
      reserveTokenAddress && reserveInputAmount > 0 ? reserveInputAmount : 0
    );

    const reserveEnabled = preview.reserveEnabled;
    const ticketInputAmount = reserveEnabled ? depositAmount - reserveInputAmount : depositAmount;

    const ticketPlan = await planTicketPurchase(
      ticketInputAmount,
      inputTokenAddress,
      ticketAddress,
      inputTokenDecimals
    );

    const gamesToBuy = ticketPlan.gamesToBuy;

    console.log("[SwapAndMint] Ticket purchase plan:", {
      reserveEnabled,
      ticketInputAmount,
      reserveInputAmount: reserveEnabled ? reserveInputAmount : 0,
      gamesToBuy,
    });

    if (gamesToBuy < 1 || !ticketPlan.reverseQuote) {
      throw new Error(`Not enough ${inputTokenSymbol} to purchase even 1 game. Try with a larger amount.`);
    }

    store.setStage("swapping");

    const ticketSwapData = {
      tokenAddress: ticketAddress,
      minimumAmount: gamesToBuy,
      quote: ticketPlan.reverseQuote,
    };
    const calls: any[] = [];

    if (reserveEnabled && reserveTokenAddress) {
      const reserveInputUnits = toUnits(reserveInputAmount, inputTokenDecimals);
      const reserveForwardQuote = await getSwapQuote(
        reserveInputUnits,
        inputTokenAddress,
        reserveTokenAddress
      );
      const reserveOutputUnits = toAbsoluteBigInt(reserveForwardQuote?.total);
      const reserveTargetOutput = (reserveOutputUnits * 98n) / 100n;

      if (reserveTargetOutput > 0n) {
        const reserveReverseQuote = await getSwapQuote(
          -reserveTargetOutput,
          reserveTokenAddress,
          inputTokenAddress
        );

        calls.push(
          ...generateSwapCalls(routerContract, inputTokenAddress, {
            tokenAddress: reserveTokenAddress,
            minimumAmount: 0,
            quote: reserveReverseQuote,
          })
        );

        console.log("[SwapAndMint] STRK reserve enabled", {
          reserveInputAmount,
          reserveTokenSymbol,
          reserveTargetOutput: reserveTargetOutput.toString(),
        });
      }
    }

    calls.push(...generateSwapCalls(routerContract, inputTokenAddress, ticketSwapData));

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
 * Get the estimated number of games for a given deposited token amount.
 * Used by SwapConfirmationModal to show the user how many games they'll get.
 */
export async function estimateGamesForDeposit(
  depositAmount: number,
  inputTokenAddress: string,
  ticketAddress: string,
  inputTokenDecimals = 18,
  reserveInputAmount = 0
): Promise<number> {
  const preview = await buildSwapPreview(
    depositAmount,
    inputTokenAddress,
    ticketAddress,
    inputTokenDecimals,
    reserveInputAmount
  );

  return preview.gamesToBuy;
}

export async function estimateSwapPreview(
  depositAmount: number,
  inputTokenAddress: string,
  ticketAddress: string,
  inputTokenDecimals = 18,
  reserveInputAmount = 0
): Promise<SwapPreview> {
  return buildSwapPreview(
    depositAmount,
    inputTokenAddress,
    ticketAddress,
    inputTokenDecimals,
    reserveInputAmount
  );
}

export { STRK_RESERVE_USDC };
