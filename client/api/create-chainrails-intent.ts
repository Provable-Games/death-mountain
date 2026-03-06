import type { VercelRequest, VercelResponse } from "@vercel/node";

const CHAINRAILS_API_BASE = process.env.CHAINRAILS_API_BASE_URL || "https://api.chainrails.io/api/v1";
const STARKNET_STRK_MAINNET = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

type QuotePaymentOption = {
  token?: string;
  tokenAddress?: string;
  depositAmount?: string;
  depositAmountFormatted?: string;
};

type MultiSourceQuote = {
  sourceChain?: string;
  totalFee?: string;
  totalFeeFormatted?: string;
  bridge?: string | null;
  paymentOptions?: QuotePaymentOption[];
};

function extractUpstreamMessage(data: any): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.message)) return data.message.join("; ");
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.details === "string") return data.details;
  return "";
}

function toBaseUnits(amount: string, decimals: number): string {
  const trimmed = amount.trim();
  if (!trimmed) return "0";
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return "0";

  const [intPartRaw, fracPartRaw = ""] = trimmed.split(".");
  const intPart = intPartRaw || "0";
  const fracPart = fracPartRaw.slice(0, decimals).padEnd(decimals, "0");

  const base = 10n ** BigInt(decimals);
  return (BigInt(intPart) * base + BigInt(fracPart || "0")).toString();
}

function normalizeHex(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().toLowerCase();
}

function zeroAddressForChain(chain: string | undefined): string {
  if (!chain) return "0x0";
  return chain.startsWith("STARKNET") ? "0x0" : "0x0000000000000000000000000000000000000000";
}

function pickBestQuote(quotes: MultiSourceQuote[]): MultiSourceQuote | null {
  if (!Array.isArray(quotes) || quotes.length === 0) return null;

  const withPayments = quotes.filter((q) => Array.isArray(q.paymentOptions) && q.paymentOptions.length > 0);
  if (withPayments.length === 0) return null;

  const sorted = withPayments.sort((a, b) => {
    const feeA = Number(a.totalFee || "0");
    const feeB = Number(b.totalFee || "0");
    return feeA - feeB;
  });

  return sorted[0] || null;
}

async function fetchJson(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
  const response = await fetch(url, init);
  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: response.ok, status: response.status, data };
}

/**
 * Creates a Chainrails intent that is explicitly denominated in STRK on Starknet mainnet.
 *
 * Body:
 * {
 *   recipient: string,
 *   amount: string // human STRK amount, e.g. "1.5"
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.CHAINRAILS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chainrails API key not configured" });
  }

  const recipient = String(req.body?.recipient || "").trim();
  const sender = String(req.body?.sender || "").trim();
  const refundAddress = String(req.body?.refundAddress || "").trim();
  const amountHuman = String(req.body?.amount || "0").trim();

  if (!recipient) {
    return res.status(400).json({ error: "recipient is required" });
  }

  const amountFloat = Number(amountHuman);
  if (!Number.isFinite(amountFloat) || amountFloat <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const quoteUrl = new URL(`${CHAINRAILS_API_BASE}/quotes/multi-source`);
    quoteUrl.searchParams.set("destinationChain", "STARKNET_MAINNET");
    quoteUrl.searchParams.set("amount", amountHuman);
    // multi-source quotes are USDC-denominated by default; request STRK-denominated amount explicitly
    quoteUrl.searchParams.set("amountSymbol", "STRK");
    quoteUrl.searchParams.set("tokenOut", STARKNET_STRK_MAINNET);
    quoteUrl.searchParams.set("recipient", recipient);
    // Cross-chain tab should not return same-chain Starknet routes (Crypto tab already covers that)
    quoteUrl.searchParams.set("excludeChains", "STARKNET_MAINNET");

    const quotesResult = await fetchJson(quoteUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!quotesResult.ok) {
      const upstreamMessage = extractUpstreamMessage(quotesResult.data);
      return res.status(502).json({
        error: upstreamMessage ? `Failed to fetch Chainrails routes: ${upstreamMessage}` : "Failed to fetch Chainrails routes",
        upstreamStatus: quotesResult.status,
        upstreamBody: quotesResult.data,
      });
    }

    const quotes: MultiSourceQuote[] = Array.isArray(quotesResult.data?.quotes) ? quotesResult.data.quotes : [];
    const bestQuote = pickBestQuote(quotes);
    if (!bestQuote) {
      return res.status(502).json({
        error: "No supported Chainrails route found for STRK output",
        upstreamBody: quotesResult.data,
      });
    }

    const selectedOption = (bestQuote.paymentOptions || [])[0];
    if (!selectedOption?.tokenAddress || !bestQuote.sourceChain) {
      return res.status(502).json({
        error: "Invalid quote payload from Chainrails",
        quote: bestQuote,
      });
    }

    const basePayload: Record<string, any> = {
      source_chain: bestQuote.sourceChain,
      destination_chain: "STARKNET_MAINNET",
      recipient,
      metadata: {
        description: "Death Mountain cross-chain STRK intent",
        reference: "death-mountain",
      },
    };

    if (sender) {
      basePayload.sender = sender;
    }
    if (refundAddress) {
      basePayload.refund_address = refundAddress;
    }

    const preferredAmount = selectedOption.depositAmount || toBaseUnits(amountHuman, 18);
    const preferredSymbol = (selectedOption.token || "USDC").toUpperCase();
    const fallbackSender = sender || zeroAddressForChain(bestQuote.sourceChain);
    const fallbackRefund = refundAddress || fallbackSender;

    const attemptPayloads: Array<{ label: string; payload: Record<string, any> }> = [
      {
        label: "deposit-denominated-with-tokenOut",
        payload: {
          ...basePayload,
          amount: preferredAmount,
          amountSymbol: preferredSymbol,
          tokenIn: selectedOption.tokenAddress,
          tokenOut: STARKNET_STRK_MAINNET,
        },
      },
      {
        label: "deposit-denominated-no-tokenOut",
        payload: {
          ...basePayload,
          amount: preferredAmount,
          amountSymbol: preferredSymbol,
          tokenIn: selectedOption.tokenAddress,
        },
      },
      {
        label: "strk-denominated-with-tokenOut",
        payload: {
          ...basePayload,
          amount: toBaseUnits(amountHuman, 18),
          amountSymbol: "STRK",
          tokenIn: selectedOption.tokenAddress,
          tokenOut: STARKNET_STRK_MAINNET,
        },
      },
      {
        label: "strk-denominated-no-tokenOut",
        payload: {
          ...basePayload,
          amount: toBaseUnits(amountHuman, 18),
          amountSymbol: "STRK",
          tokenIn: selectedOption.tokenAddress,
        },
      },
      {
        label: "deposit-denominated-with-fallback-sender",
        payload: {
          ...basePayload,
          sender: fallbackSender,
          refund_address: fallbackRefund,
          amount: preferredAmount,
          amountSymbol: preferredSymbol,
          tokenIn: selectedOption.tokenAddress,
        },
      },
      {
        label: "strk-denominated-with-fallback-sender",
        payload: {
          ...basePayload,
          sender: fallbackSender,
          refund_address: fallbackRefund,
          amount: toBaseUnits(amountHuman, 18),
          amountSymbol: "STRK",
          tokenIn: selectedOption.tokenAddress,
        },
      },
    ];

    let intentResult: { ok: boolean; status: number; data: any } | null = null;
    let successfulAttempt: string | null = null;
    const attemptErrors: Array<{ label: string; status: number; message: string; data: any }> = [];

    for (const attempt of attemptPayloads) {
      const result = await fetchJson(`${CHAINRAILS_API_BASE}/intents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attempt.payload),
      });

      if (result.ok) {
        intentResult = result;
        successfulAttempt = attempt.label;
        break;
      }

      attemptErrors.push({
        label: attempt.label,
        status: result.status,
        message: extractUpstreamMessage(result.data),
        data: result.data,
      });
    }

    if (!intentResult) {
      const firstError = attemptErrors[0];
      const upstreamMessage = firstError?.message || "";
      const combinedAttemptSummary = attemptErrors
        .map((attempt) => `${attempt.label}: ${attempt.message || `HTTP ${attempt.status}`}`)
        .join(" | ");
      return res.status(502).json({
        error: combinedAttemptSummary || (upstreamMessage ? `Failed to create Chainrails intent: ${upstreamMessage}` : "Failed to create Chainrails intent"),
        upstreamStatus: firstError?.status || 502,
        upstreamBody: firstError?.data || {},
        selectedRoute: bestQuote,
        attemptsTried: attemptPayloads.map((a) => a.label),
        attemptErrors,
      });
    }

    const intentAddress =
      intentResult.data?.intent_address ||
      intentResult.data?.intentAddress ||
      intentResult.data?.address;

    const resolvedTokenOut =
      intentResult.data?.tokenOut ||
      intentResult.data?.token_out ||
      intentResult.data?.asset_token_address ||
      intentResult.data?.assetTokenAddress;

    if (resolvedTokenOut && normalizeHex(resolvedTokenOut) !== normalizeHex(STARKNET_STRK_MAINNET)) {
      return res.status(502).json({
        error: "Intent resolved to non-STRK output token",
        expectedTokenOut: STARKNET_STRK_MAINNET,
        resolvedTokenOut,
        intent: intentResult.data,
      });
    }

    const resolvedAssetSymbol =
      intentResult.data?.asset_token_symbol ||
      intentResult.data?.assetTokenSymbol ||
      intentResult.data?.amountSymbol;

    if (resolvedAssetSymbol && String(resolvedAssetSymbol).toUpperCase() !== "STRK") {
      return res.status(502).json({
        error: "Intent resolved to non-STRK denomination",
        expectedAmountSymbol: "STRK",
        resolvedAmountSymbol: resolvedAssetSymbol,
        intent: intentResult.data,
      });
    }

    if (!intentAddress) {
      return res.status(502).json({
        error: "Chainrails intent response missing intent address",
        upstreamBody: intentResult.data,
      });
    }

    return res.status(200).json({
      intentAddress,
      requestedAmountStrk: amountHuman,
      sourceChain: bestQuote.sourceChain,
      sourceTokenSymbol: selectedOption.token || "UNKNOWN",
      sourceTokenAddress: selectedOption.tokenAddress,
      depositAmount: selectedOption.depositAmount,
      depositAmountFormatted: selectedOption.depositAmountFormatted,
      totalFeeFormatted: bestQuote.totalFeeFormatted,
      bridge: bestQuote.bridge,
      strategy: successfulAttempt,
      intent: intentResult.data,
    });
  } catch (error) {
    console.error("[Chainrails] Intent creation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(502).json({ error: "Failed to create Chainrails intent", details: message });
  }
}
