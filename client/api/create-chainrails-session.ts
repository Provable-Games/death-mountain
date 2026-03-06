import type { VercelRequest, VercelResponse } from "@vercel/node";

const CHAINRAILS_API_BASE = process.env.CHAINRAILS_API_BASE_URL || "https://api.chainrails.io/api/v1";
const STRK_MAINNET_ADDRESS = "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";

function normalizeHex(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().toLowerCase();
}

function findValueDeep(obj: any, keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  for (const key of keys) {
    const direct = obj[key];
    if (typeof direct === "string") return direct;
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const nested = findValueDeep(value, keys);
      if (nested) return nested;
    }
  }

  return undefined;
}

/**
 * Vercel serverless function to create a Chainrails payment session.
 *
 * Chainrails requires a server-side session token to protect the API key.
 * The frontend passes this URL as session_url to usePaymentSession.
 *
 * Query params:
 *   - recipient: Starknet wallet address to receive STRK
 *   - amount:    (optional) Amount in STRK. If omitted or "0", user picks amount in the modal.
 *
 * Returns: { sessionToken, amount } compatible with usePaymentSession.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.CHAINRAILS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chainrails API key not configured" });
  }

  const recipient = req.query.recipient as string;
  if (!recipient) {
    return res.status(400).json({ error: "recipient parameter required" });
  }

  const amount = (req.query.amount as string) || "0";
  const debug = req.query.debug === "1";
  const strict = req.query.strict !== "0";

  try {
    // Explicit low-level session payload to force STRK output on Starknet.
    // This avoids any SDK-side fallback to USDC when token mapping fails.
    const payload = {
      amount,
      recipient,
      destinationChain: "STARKNET_MAINNET",
      tokenOut: STRK_MAINNET_ADDRESS,
    };

    const response = await fetch(`${CHAINRAILS_API_BASE}/modal/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const bodyText = await response.text();
    let data: any = {};
    try {
      data = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      data = { raw: bodyText };
    }

    if (!response.ok) {
      return res.status(502).json({
        error: "Failed to create Chainrails session",
        upstreamStatus: response.status,
        upstreamBody: data,
      });
    }

    if (!data?.sessionToken) {
      return res.status(502).json({
        error: "Chainrails session response missing sessionToken",
        upstreamBody: data,
      });
    }

    let sessionClient: any = null;
    if (strict || debug) {
      const sessionClientRes = await fetch(`${CHAINRAILS_API_BASE}/modal/sessions/client`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data.sessionToken}`,
          "Content-Type": "application/json",
        },
      });

      const sessionClientText = await sessionClientRes.text();
      try {
        sessionClient = sessionClientText ? JSON.parse(sessionClientText) : {};
      } catch {
        sessionClient = { raw: sessionClientText };
      }

      if (!sessionClientRes.ok && strict) {
        return res.status(502).json({
          error: "Failed to inspect Chainrails session",
          upstreamStatus: sessionClientRes.status,
          upstreamBody: sessionClient,
        });
      }
    }

    if (strict && sessionClient) {
      const resolvedTokenOut =
        findValueDeep(sessionClient, ["tokenOut", "token_out", "assetTokenAddress", "asset_token_address"]) ||
        findValueDeep(data, ["tokenOut", "token_out", "assetTokenAddress", "asset_token_address"]);

      const resolvedDestinationChain =
        findValueDeep(sessionClient, ["destinationChain", "destination_chain"]) ||
        findValueDeep(data, ["destinationChain", "destination_chain"]);

      if (resolvedTokenOut && normalizeHex(resolvedTokenOut) !== normalizeHex(STRK_MAINNET_ADDRESS)) {
        return res.status(502).json({
          error: "Chainrails session resolved to a non-STRK output token",
          expectedTokenOut: STRK_MAINNET_ADDRESS,
          resolvedTokenOut,
          resolvedDestinationChain,
          note: "This usually means your Chainrails account/session is configured for USDC settlement.",
          debug: debug ? { requestedPayload: payload, upstream: data, sessionClient } : undefined,
        });
      }
    }

    // Short cache: same wallet + amount = same session for 60s
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    const responseBody = {
      sessionToken: data.sessionToken,
      amount,
    } as any;

    if (debug) {
      responseBody.debug = {
        requestedPayload: payload,
        upstream: data,
        sessionClient,
      };
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error("[Chainrails] Session creation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(502).json({ error: "Failed to create Chainrails session", details: message });
  }
}
