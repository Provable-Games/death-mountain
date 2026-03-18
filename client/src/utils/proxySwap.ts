/**
 * Builds the multicall for the USDC Game Proxy contract.
 *
 * Flow: USDC.approve -> proxy.buy_game_with_usdc
 * The proxy handles: USDC->STRK reserve swap + USDC->ticket swap + buy_game
 */
import { getSwapQuote } from "@/api/ekubo";
import { useSwapStore } from "@/stores/swapStore";
import { num } from "starknet";
import { stringToFelt } from "@/utils/utils";

const USDC_DECIMALS = 6;
const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

/** Reserve ~$0.20 USDC for STRK gas buffer */
const RESERVE_USDC_HUMAN = 0.20;
const RESERVE_USDC_UNITS = BigInt(Math.floor(RESERVE_USDC_HUMAN * 10 ** USDC_DECIMALS));

const WEI = 10n ** 18n;
const MAX_GAMES_PER_BATCH = 50;

// --- Ekubo calldata encoding (mirrors ekubo.ts but outputs raw felt252[]) ---

interface RouteNode {
  pool_key: {
    token0: string;
    token1: string;
    fee: string;
    tick_spacing: string;
    extension: string;
  };
  sqrt_ratio_limit: string;
  skip_ahead: string;
}

interface SwapSplit {
  amount_specified: string;
  route: RouteNode[];
}

function encodeSplitCalldata(split: SwapSplit, outputToken: string): string[] {
  return [
    num.toHex(split.route.length),
    ...split.route.reduce(
      (memo: { token: string; encoded: string[] }, routeNode: RouteNode) => {
        const isToken1 = BigInt(memo.token) === BigInt(routeNode.pool_key.token1);
        return {
          token: isToken1 ? routeNode.pool_key.token0 : routeNode.pool_key.token1,
          encoded: memo.encoded.concat([
            routeNode.pool_key.token0,
            routeNode.pool_key.token1,
            routeNode.pool_key.fee,
            num.toHex(routeNode.pool_key.tick_spacing),
            routeNode.pool_key.extension,
            num.toHex(BigInt(routeNode.sqrt_ratio_limit) % 2n ** 128n),
            num.toHex(BigInt(routeNode.sqrt_ratio_limit) >> 128n),
            routeNode.skip_ahead,
          ]),
        };
      },
      { token: outputToken, encoded: [] }
    ).encoded,
    outputToken,
    num.toHex(
      BigInt(split.amount_specified) < 0n
        ? -BigInt(split.amount_specified)
        : BigInt(split.amount_specified)
    ),
    "0x1",
  ];
}

function encodeSwapCalldata(
  quote: { splits: SwapSplit[] },
  outputToken: string
): { kind: number; calldata: string[] } {
  if (quote.splits.length === 1) {
    return { kind: 0, calldata: encodeSplitCalldata(quote.splits[0], outputToken) };
  }
  return {
    kind: 1,
    calldata: [
      num.toHex(quote.splits.length),
      ...quote.splits.flatMap((split) => encodeSplitCalldata(split, outputToken)),
    ],
  };
}

function toAbsBigInt(value: unknown): bigint {
  try {
    const parsed = BigInt(value as any);
    return parsed < 0n ? -parsed : parsed;
  } catch {
    return 0n;
  }
}

// --- Public API ---

export interface ProxySwapParams {
  /** Human-readable USDC amount deposited */
  depositAmount: number;
  /** USDC token address */
  usdcAddress: string;
  /** Dungeon ticket token address */
  ticketAddress: string;
  /** Proxy contract address */
  proxyAddress: string;
  /** Player name for buy_game */
  playerName: string;
  /** Recipient address for the minted game */
  recipientAddress: string;
  /** Account to execute the multicall */
  account: { address: string; execute: (calls: any[]) => Promise<{ transaction_hash: string }> };
  /** Callback on success */
  onSuccess: (gamesMinted: number) => void;
}

/**
 * Execute the full proxy swap+mint flow:
 * 1. Quote USDC->ticket (how many games?)
 * 2. Quote USDC->STRK reserve (~$0.20)
 * 3. Build multicall: USDC.approve + proxy.buy_game_with_usdc
 * 4. Execute
 */
export async function executeProxySwapAndMint(params: ProxySwapParams): Promise<void> {
  const {
    depositAmount,
    usdcAddress,
    ticketAddress,
    proxyAddress,
    playerName,
    recipientAddress,
    account,
    onSuccess,
  } = params;

  const store = useSwapStore.getState();

  if (store.isSwapping) {
    console.warn("[ProxySwap] Already swapping, ignoring");
    return;
  }

  store.setIsSwapping(true);
  store.setStage("quoting");

  try {
    if (depositAmount <= 0) {
      throw new Error("No USDC available for swap");
    }

    const maxUsdcUnits = BigInt(Math.floor(depositAmount * 10 ** USDC_DECIMALS));

    // 1. STRK reserve quote first (to know how much USDC is left for tickets)
    let reserveSwapKind = 0;
    let reserveSwapCalldata: string[] = [];
    let reserveUsdcIn = 0n;
    let reserveStrkMinOut = 0n;

    const reserveForwardQuote = await getSwapQuote(RESERVE_USDC_UNITS, usdcAddress, STRK_ADDRESS);
    const reserveStrkOutput = reserveForwardQuote?.total
      ? (toAbsBigInt(reserveForwardQuote.total) * 95n) / 100n
      : 0n;

    if (reserveStrkOutput > 0n && reserveForwardQuote?.splits?.length) {
      const reserveReverseQuote = await getSwapQuote(-reserveStrkOutput, STRK_ADDRESS, usdcAddress);

      if (reserveReverseQuote?.splits?.length) {
        const encoded = encodeSwapCalldata(reserveReverseQuote, STRK_ADDRESS);
        reserveSwapKind = encoded.kind;
        reserveSwapCalldata = encoded.calldata;
        reserveUsdcIn = (toAbsBigInt(reserveReverseQuote.total) * 102n) / 100n;
        reserveStrkMinOut = (reserveStrkOutput * 95n) / 100n;
      }
    }

    // 2. Quote tickets on remaining USDC after reserve
    const ticketBudget = maxUsdcUnits - reserveUsdcIn;
    const ticketBudgetBuffered = (ticketBudget * 90n) / 100n; // 10% buffer for slippage

    if (ticketBudgetBuffered <= 0n) {
      throw new Error("Not enough USDC after STRK reserve");
    }

    const forwardQuote = await getSwapQuote(ticketBudgetBuffered, usdcAddress, ticketAddress);
    let gamesToBuy = Math.min(MAX_GAMES_PER_BATCH, Number(toAbsBigInt(forwardQuote?.total) / WEI));

    if (gamesToBuy > 1) gamesToBuy -= 1; // safety margin
    if (gamesToBuy < 1) throw new Error("Not enough USDC to buy even 1 game");

    // 3. Reverse quote for exact ticket count
    const ticketReverseQuote = await getSwapQuote(
      -(BigInt(gamesToBuy) * WEI),
      ticketAddress,
      usdcAddress
    );

    if (!ticketReverseQuote?.splits?.length) {
      throw new Error("No ticket swap route found");
    }

    // 4. Encode ticket swap
    const ticketEncoded = encodeSwapCalldata(ticketReverseQuote, ticketAddress);

    store.setStage("swapping");

    console.log("[ProxySwap] Building tx:", {
      depositAmount,
      gamesToBuy,
      maxUsdcUnits: maxUsdcUnits.toString(),
      maxUsdcHuman: Number(maxUsdcUnits) / 1e6,
      reserveUsdcIn: reserveUsdcIn.toString(),
      reserveUsdcHuman: Number(reserveUsdcIn) / 1e6,
      reserveStrkMinOut: reserveStrkMinOut.toString(),
      ticketSwapKind: ticketEncoded.kind,
      ticketSwapCalldataLen: ticketEncoded.calldata.length,
      reserveSwapCalldataLen: reserveSwapCalldata.length,
    });

    // 5. Build multicall
    const playerNameFelt = stringToFelt(playerName);
    const calls = [
      {
        contractAddress: usdcAddress,
        entrypoint: "approve",
        calldata: [proxyAddress, num.toHex(maxUsdcUnits), "0x0"],
      },
      {
        contractAddress: proxyAddress,
        entrypoint: "buy_game_with_usdc",
        calldata: [
          num.toHex(maxUsdcUnits), "0x0",
          num.toHex(reserveUsdcIn), "0x0",
          num.toHex(reserveStrkMinOut), "0x0",
          num.toHex(reserveSwapKind),
          num.toHex(reserveSwapCalldata.length),
          ...reserveSwapCalldata,
          num.toHex(gamesToBuy),
          "0x0", playerNameFelt,
          recipientAddress,
          num.toHex(ticketEncoded.kind),
          num.toHex(ticketEncoded.calldata.length),
          ...ticketEncoded.calldata,
        ],
      },
    ];

    console.log("[ProxySwap] Full calls:", JSON.stringify(calls, null, 2));

    store.setStage("minting");
    const tx = await account.execute(calls);
    console.log("[ProxySwap] TX hash:", tx.transaction_hash);

    onSuccess(gamesToBuy);
  } catch (error) {
    console.error("[ProxySwap] Error:", error);
    useSwapStore.getState().setError(
      error instanceof Error ? error.message : "Proxy swap failed"
    );
  }
}
