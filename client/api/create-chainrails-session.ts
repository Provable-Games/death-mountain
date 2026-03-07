import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Chainrails, crapi } from "@chainrails/sdk";

/**
 * Creates a Chainrails modal session that settles in USDC on Starknet.
 *
 * Query params:
 *   - recipient: Starknet wallet address
 *   - amount: optional human-readable amount. Use 0 to let the user choose.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.CHAINRAILS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chainrails API key not configured" });
  }

  const recipient = String(req.query.recipient || "").trim();
  const amount = String(req.query.amount || "0").trim() || "0";

  if (!recipient) {
    return res.status(400).json({ error: "recipient parameter required" });
  }

  try {
    Chainrails.config({ api_key: apiKey });

    const session = await crapi.auth.getSessionToken({
      amount,
      recipient,
      destinationChain: "STARKNET",
      token: "USDC",
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({
      sessionToken: session.sessionToken,
      amount,
    });
  } catch (error) {
    console.error("[Chainrails] Session creation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(502).json({ error: "Failed to create Chainrails session", details: message });
  }
}
