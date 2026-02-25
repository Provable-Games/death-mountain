import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

/**
 * Vercel serverless function to sign Onramper widget URLs.
 *
 * Onramper requires HMAC-SHA256 signatures for URLs containing sensitive
 * parameters (networkWallets, wallets, walletAddressTags).
 * The secret key must stay server-side.
 *
 * Query params:
 *   - networkWallets: e.g. "starknet:0xabc..."
 *
 * Returns: { signature: string }
 */

function arrangeStringAlphabetically(inputString: string): string {
  const inputObject: Record<string, Record<string, string>> = {};

  inputString.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    const nestedPairs = value.split(",");
    inputObject[key] = {};
    nestedPairs.forEach((nestedPair) => {
      const [nestedKey, ...rest] = nestedPair.split(":");
      inputObject[key][nestedKey] = rest.join(":");
    });
  });

  for (const key in inputObject) {
    inputObject[key] = Object.fromEntries(
      Object.entries(inputObject[key]).sort()
    );
  }

  const sortedKeys = Object.keys(inputObject).sort();
  const parts: string[] = [];

  for (const key of sortedKeys) {
    const nested = Object.entries(inputObject[key])
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    parts.push(`${key}=${nested}`);
  }

  return parts.join("&");
}

function generateSignature(secretKey: string, data: string): string {
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(data);
  return hmac.digest("hex");
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.ONRAMPER_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Server signing key not configured" });
  }

  const networkWallets = req.query.networkWallets as string;
  if (!networkWallets) {
    return res.status(400).json({ error: "networkWallets parameter required" });
  }

  // Build the signContent with only the sensitive parameters
  const signContent = arrangeStringAlphabetically(
    `networkWallets=${networkWallets}`
  );

  const signature = generateSignature(secretKey, signContent);

  // Cache for 5 minutes (same wallet address = same signature)
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json({ signature });
}
