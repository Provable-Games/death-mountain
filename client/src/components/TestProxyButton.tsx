/**
 * Temporary test button for the USDC Game Proxy contract.
 * Remove once the proxy is integrated into the real payment flow.
 */
import { getSwapQuote } from "@/api/ekubo";
import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import Button from "@mui/material/Button";
import { useAccount } from "@starknet-react/core";
import { useState } from "react";
import { num } from "starknet";

const USDC_DECIMALS = 6;
const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const USDC_ADDRESS = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";

// Reserve ~$0.20 USDC for STRK gas buffer
const RESERVE_USDC_HUMAN = 0.20;
const RESERVE_USDC_UNITS = BigInt(Math.floor(RESERVE_USDC_HUMAN * 10 ** USDC_DECIMALS));

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

/**
 * Encode a single split's route into the felt252[] format that the proxy contract expects.
 * This is the same encoding as ekubo.ts generateSwapCalls but without the transfer/clear wrapper.
 */
function encodeSplitCalldata(split: SwapSplit, outputToken: string): string[] {
  const startToken = outputToken; // reverse quote: output of quote is input of swap
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
      { token: startToken, encoded: [] }
    ).encoded,
    outputToken,
    num.toHex(
      BigInt(split.amount_specified) < 0n
        ? -BigInt(split.amount_specified)
        : BigInt(split.amount_specified)
    ),
    "0x1", // is_exact_in flag
  ];
}

function encodeSwapCalldata(
  quote: { splits: SwapSplit[] },
  outputToken: string
): { kind: number; calldata: string[] } {
  if (quote.splits.length === 1) {
    return {
      kind: 0, // Multihop
      calldata: encodeSplitCalldata(quote.splits[0], outputToken),
    };
  }
  // MultiMultihop
  return {
    kind: 1,
    calldata: [
      num.toHex(quote.splits.length),
      ...quote.splits.flatMap((split) => encodeSplitCalldata(split, outputToken)),
    ],
  };
}

export default function TestProxyButton() {
  const { account } = useAccount();
  const { account: controllerAccount } = useController();
  const { currentNetworkConfig } = useDynamicConnector();
  const dungeon = useDungeon();
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const proxyAddress = currentNetworkConfig.gameProxy;
  const ticketAddress = dungeon.ticketAddress;

  if (!proxyAddress || !account || !ticketAddress) return null;

  const handleTestProxy = async () => {
    const execAccount = controllerAccount || account;
    if (!execAccount) return;

    setLoading(true);
    setStatus("Fetching quotes...");

    try {
      // 1. Figure out how much USDC we have
      const gameCount = 1;
      const maxUsdcHuman = 2.0; // $2 max for test
      const maxUsdcUnits = BigInt(Math.floor(maxUsdcHuman * 10 ** USDC_DECIMALS));

      // 2. Get ticket reverse quote: we want exactly 1 ticket
      const ticketReverseQuote = await getSwapQuote(
        -(BigInt(gameCount) * 10n ** 18n),
        ticketAddress,
        USDC_ADDRESS
      );

      if (!ticketReverseQuote?.splits?.length) {
        throw new Error("No ticket swap route found");
      }

      // 3. Get STRK reserve quote (USDC -> STRK)
      const reserveForwardQuote = await getSwapQuote(
        RESERVE_USDC_UNITS,
        USDC_ADDRESS,
        STRK_ADDRESS
      );

      const reserveStrkOutput = reserveForwardQuote?.total
        ? (BigInt(Math.abs(reserveForwardQuote.total)) * 95n) / 100n
        : 0n;

      let reserveSwapKind = 0;
      let reserveSwapCalldata: string[] = [];
      let reserveUsdcIn = 0n;
      let reserveStrkMinOut = 0n;

      if (reserveStrkOutput > 0n && reserveForwardQuote?.splits?.length) {
        // Get a reverse quote for the STRK amount we want
        const reserveReverseQuote = await getSwapQuote(
          -reserveStrkOutput,
          STRK_ADDRESS,
          USDC_ADDRESS
        );

        if (reserveReverseQuote?.splits?.length) {
          const encoded = encodeSwapCalldata(reserveReverseQuote, STRK_ADDRESS);
          reserveSwapKind = encoded.kind;
          reserveSwapCalldata = encoded.calldata;
          // How much USDC the reverse quote needs
          const reverseInputNeeded = BigInt(Math.abs(reserveReverseQuote.total));
          reserveUsdcIn = (reverseInputNeeded * 102n) / 100n; // 2% buffer
          reserveStrkMinOut = (reserveStrkOutput * 95n) / 100n; // 5% slippage
        }
      }

      // 4. Encode the ticket swap calldata
      const ticketEncoded = encodeSwapCalldata(ticketReverseQuote, ticketAddress);

      setStatus("Building transaction...");

      // 5. Build the multicall: approve + buy_game_with_usdc
      const calls = [
        // USDC.approve(proxy, max_usdc_in)
        {
          contractAddress: USDC_ADDRESS,
          entrypoint: "approve",
          calldata: [proxyAddress, num.toHex(maxUsdcUnits), "0x0"],
        },
        // proxy.buy_game_with_usdc(...)
        {
          contractAddress: proxyAddress,
          entrypoint: "buy_game_with_usdc",
          calldata: [
            // max_usdc_in: u256
            num.toHex(maxUsdcUnits),
            "0x0",
            // reserve_usdc_in: u256
            num.toHex(reserveUsdcIn),
            "0x0",
            // reserve_strk_min_out: u256
            num.toHex(reserveStrkMinOut),
            "0x0",
            // reserve_swap_kind: enum (0=Multihop, 1=MultiMultihop)
            num.toHex(reserveSwapKind),
            // reserve_swap_calldata: Span<felt252>
            num.toHex(reserveSwapCalldata.length),
            ...reserveSwapCalldata,
            // game_count: u32
            num.toHex(gameCount),
            // player_name: Option<felt252> (Some("test"))
            "0x0", // Some variant
            "0x74657374", // "test" as felt252
            // recipient: ContractAddress
            execAccount.address,
            // ticket_swap_kind: enum
            num.toHex(ticketEncoded.kind),
            // ticket_swap_calldata: Span<felt252>
            num.toHex(ticketEncoded.calldata.length),
            ...ticketEncoded.calldata,
          ],
        },
      ];

      setStatus("Sending transaction...");
      console.log("[TestProxy] Calls:", JSON.stringify(calls, null, 2));

      const tx = await execAccount.execute(calls);
      setStatus(`TX sent: ${tx.transaction_hash.slice(0, 20)}...`);
      console.log("[TestProxy] TX hash:", tx.transaction_hash);
    } catch (err: any) {
      console.error("[TestProxy] Error:", err);
      setStatus(`Error: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      fullWidth
      size="small"
      onClick={handleTestProxy}
      disabled={loading}
      sx={{
        height: "32px",
        borderColor: "#ff6b35",
        color: "#ff6b35",
        "&:hover": { borderColor: "#ff8c5a", backgroundColor: "rgba(255,107,53,0.1)" },
        fontSize: "0.75rem",
      }}
    >
      {loading ? status : "Test Proxy (buy 1 game with USDC)"}
    </Button>
  );
}
