import type { VercelRequest, VercelResponse } from "@vercel/node";

const CHAINRAILS_API_BASE = process.env.CHAINRAILS_API_BASE_URL || "https://api.chainrails.io/api/v1";
const STRK_MAINNET_ADDRESS = "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";

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

    // Short cache: same wallet + amount = same session for 60s
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({
      sessionToken: data.sessionToken,
      amount,
    });
  } catch (error) {
    console.error("[Chainrails] Session creation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(502).json({ error: "Failed to create Chainrails session", details: message });
  }
}
