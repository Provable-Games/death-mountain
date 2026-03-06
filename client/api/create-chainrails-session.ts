import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Chainrails, crapi } from "@chainrails/sdk";

/**
 * Vercel serverless function to create a Chainrails payment session.
 *
 * Chainrails requires a server-side session token to protect the API key.
 * The frontend calls this endpoint before opening the PaymentModal.
 *
 * Query params:
 *   - recipient: Starknet wallet address to receive STRK
 *   - amount:    (optional) Amount in STRK. If omitted or "0", user picks amount in the modal.
 *
 * Returns: the session object from Chainrails SDK (includes sessionToken).
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
    Chainrails.config({ api_key: apiKey });

    const session = await crapi.auth.getSessionToken({
      amount,
      recipient,
      destinationChain: "STARKNET_MAINNET",
      token: "STRK",
    });

    // Short cache: same wallet + amount = same session for 60s
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(session);
  } catch (error) {
    console.error("[Chainrails] Session creation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(502).json({ error: "Failed to create Chainrails session", details: message });
  }
}
