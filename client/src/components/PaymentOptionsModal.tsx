import ROUTER_ABI from "@/abi/router-abi.json";
import { generateSwapCalls, getSwapQuote } from "@/api/ekubo";
import { useController } from "@/contexts/controller";
import { useDungeon } from "@/dojo/useDungeon";
import { OnrampStatus, useSwapStore } from "@/stores/swapStore";
import { useUIStore } from "@/stores/uiStore";
import { useDynamicConnector } from "@/contexts/starknet";
import { formatAmount } from "@/utils/utils";
import CloseIcon from "@mui/icons-material/Close";
import CreditCardIcon from "@mui/icons-material/CreditCard";

import TokenIcon from "@mui/icons-material/Token";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useAccount, useProvider } from "@starknet-react/core";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Contract } from "starknet";

// --- Constants ---

const MIN_GAMES = 1;
const MAX_GAMES = 50;
const FALLBACK_MIN_FIAT_USD = 12; // Fallback if API fetch fails (~$11.72 observed)
const ONRAMPER_TRANSITION_MASK_PX = 68;

// Onramper API key from environment variable
const ONRAMPER_API_KEY = import.meta.env.VITE_ONRAMPER_API_KEY || "";

// Dev mock mode: show debug panel instead of Onramper iframe when no API key in dev
const IS_DEV_MOCK = import.meta.env.DEV && !ONRAMPER_API_KEY;

// Use dev domain for test keys, prod domain for prod keys
const ONRAMPER_DOMAIN = ONRAMPER_API_KEY.startsWith("pk_test_")
  ? "buy.onramper.dev"
  : "buy.onramper.com";

// Onramper API domain (staging for test keys, production for prod keys)
const ONRAMPER_API_DOMAIN = ONRAMPER_API_KEY.startsWith("pk_test_")
  ? "api-stg.onramper.com"
  : "api.onramper.com";

// Fetch the lowest minimum fiat amount from Onramper quotes API
const fetchOnramperMinFiat = async (): Promise<number> => {
  if (!ONRAMPER_API_KEY) return FALLBACK_MIN_FIAT_USD;

  try {
    const res = await fetch(
      `https://${ONRAMPER_API_DOMAIN}/quotes/usd/strk_starknet?amount=30&type=buy`,
      { headers: { Authorization: ONRAMPER_API_KEY } }
    );
    if (!res.ok) return FALLBACK_MIN_FIAT_USD;

    const data = await res.json();
    if (!Array.isArray(data)) return FALLBACK_MIN_FIAT_USD;

    let lowestMin = Infinity;
    for (const quote of data) {
      for (const method of quote.availablePaymentMethods || []) {
        const min = method?.details?.limits?.aggregatedLimit?.min;
        if (typeof min === "number" && min < lowestMin) {
          lowestMin = min;
        }
      }
    }
    return lowestMin === Infinity ? FALLBACK_MIN_FIAT_USD : Math.ceil(lowestMin);
  } catch {
    return FALLBACK_MIN_FIAT_USD;
  }
};

// Onramper widget base URL with Loot Survivor theme
const ONRAMPER_BASE_URL = `https://${ONRAMPER_DOMAIN}?apiKey=${ONRAMPER_API_KEY}&mode=buy&defaultCrypto=strk_starknet&onlyCryptoNetworks=starknet&themeName=dark&containerColor=0f1f0f&primaryColor=d0c98d&secondaryColor=1a2f1a&cardColor=182818&primaryTextColor=ffffff&secondaryTextColor=FFD700&borderRadius=0.5&wgBorderRadius=1&hideTopBar=true&redirectAtCheckout=false`;

// Allowed Onramper origins for postMessage validation
const ONRAMPER_ORIGINS = [
  `https://${ONRAMPER_DOMAIN}`,
  "https://buy.onramper.com",
  "https://buy.onramper.dev",
];

// Map raw Onramper status strings to our OnrampStatus type
const ONRAMP_STATUS_MAP: Record<string, OnrampStatus> = {
  new: "new",
  pending: "pending",
  paid: "paid",
  completed: "completed",
  canceled: "canceled",
  cancelled: "canceled", // Handle alternate spelling
  failed: "failed",
};

// Human-readable labels for onramp statuses
const ONRAMP_STATUS_LABELS: Record<OnrampStatus, string> = {
  idle: "",
  new: "Transaction created",
  pending: "Payment processing...",
  paid: "Payment received, delivering crypto...",
  completed: "Crypto delivered!",
  canceled: "Transaction canceled",
  failed: "Transaction failed",
};

// Fetch HMAC-SHA256 signature for sensitive URL params (required by Onramper prod)
const fetchOnramperSignature = async (walletAddress: string): Promise<string | null> => {
  try {
    const networkWallets = `starknet:${walletAddress}`;
    const res = await fetch(`/api/sign-onramper?networkWallets=${encodeURIComponent(networkWallets)}`);
    if (!res.ok) return null;
    const { signature } = await res.json();
    return signature || null;
  } catch {
    return null;
  }
};

// Generate a unique session ID for partnerContext tracking
const generateSessionId = () =>
  `ls_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Build Onramper URL with wallet address, pre-filled fiat amount, and signature
const buildOnramperUrl = (
  walletAddress: string,
  totalUsd: number | null,
  signature: string | null,
  sessionId: string,
) => {
  let url = ONRAMPER_BASE_URL;

  // Only include networkWallets when we have a valid signature (required by Onramper).
  // Without signature, the user will enter their wallet address manually in the widget.
  if (signature) {
    url += `&networkWallets=starknet:${walletAddress}&signature=${signature}`;
  }

  // partnerContext lets us correlate this session in webhooks
  url += `&partnerContext=${sessionId}`;

  if (totalUsd && totalUsd > 0) {
    // Add ~3% buffer for provider fees + slippage, rounded up
    const amountWithBuffer = Math.ceil(totalUsd * 1.03);
    url += `&defaultFiat=usd&defaultAmount=${amountWithBuffer}`;
  }

  return url;
};

// --- Interfaces ---

interface PaymentOptionsModalProps {
  open: boolean;
  onClose: () => void;
}

// --- Sub-components ---

// Crypto tab content — 1 game at a time (swap + enter dungeon)
const CryptoTabContent = memo(({
  userTokens,
  selectedToken,
  tokenQuote,
  onTokenChange,
  buyDungeonTicket,
}: {
  userTokens: any[];
  selectedToken: string;
  tokenQuote: { amount: string; loading: boolean; error?: string };
  onTokenChange: (tokenSymbol: string) => void;
  buyDungeonTicket: () => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const selectedTokenData = userTokens.find((t: any) => t.symbol === selectedToken);

  const hasEnoughBalance = useMemo(() => {
    if (!selectedTokenData || !tokenQuote.amount) return false;
    return Number(selectedTokenData.balance) >= Number(tokenQuote.amount);
  }, [selectedTokenData, tokenQuote]);

  if (userTokens.length === 0) {
    return (
      <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
        <TokenIcon sx={{ fontSize: 40, color: "rgba(208, 201, 141, 0.3)", mb: 1 }} />
        <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          No tokens with balance found. Use the Fiat tab to buy STRK.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Typography sx={{ fontSize: 12, color: "#FFD700", opacity: 0.7, mb: 1.5, textAlign: "center", letterSpacing: 0.5 }}>
        Swap tokens from your wallet
      </Typography>

      <Button
        variant="outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        fullWidth
        sx={styles.mobileSelectButton}
      >
        <Box sx={{ fontSize: "0.6rem", color: "text.primary", marginLeft: "-5px", display: "flex", alignItems: "center" }}>
          ▼
        </Box>
        <Box sx={styles.tokenRow}>
          <Box sx={styles.tokenLeft}>
            <Typography sx={styles.tokenName}>
              {selectedTokenData ? selectedTokenData.symbol : "Select token"}
            </Typography>
          </Box>
          {selectedTokenData && (
            <Typography sx={styles.tokenBalance}>{selectedTokenData.balance}</Typography>
          )}
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5, width: "260px", maxHeight: 300,
              background: "rgba(24, 40, 24, 1)",
              border: "1px solid rgba(208, 201, 141, 0.3)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              zIndex: 9999,
            },
          },
        }}
        sx={{ zIndex: 9999 }}
      >
        {userTokens.map((token: any) => (
          <MenuItem
            key={token.symbol}
            onClick={() => { onTokenChange(token.symbol); setAnchorEl(null); }}
            sx={{
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1,
              backgroundColor: token.symbol === selectedToken ? "rgba(208, 201, 141, 0.2)" : "transparent",
              "&:hover": {
                backgroundColor: token.symbol === selectedToken ? "rgba(208, 201, 141, 0.3)" : "rgba(208, 201, 141, 0.1)",
              },
            }}
          >
            <Box sx={styles.tokenRow}>
              <Box sx={styles.tokenLeft}>
                <Typography sx={styles.tokenName}>{token.symbol}</Typography>
              </Box>
              <Typography sx={styles.tokenBalance}>{token.balance}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      <Box sx={{ px: 0, mb: 1, mt: 2, textAlign: "center" }}>
        <Typography sx={styles.costText}>
          {tokenQuote.loading
            ? "Loading quote..."
            : tokenQuote.error
              ? `Error: ${tokenQuote.error}`
              : tokenQuote.amount
                ? `Cost: ${tokenQuote.amount} ${selectedToken}`
                : "Loading..."}
        </Typography>
      </Box>

      <Button
        variant="contained"
        sx={styles.activateButton}
        onClick={buyDungeonTicket}
        fullWidth
        disabled={tokenQuote.loading || !!tokenQuote.error || !hasEnoughBalance}
      >
        <Typography sx={styles.buttonText}>
          {hasEnoughBalance ? "Enter Dungeon" : "Insufficient Balance"}
        </Typography>
      </Button>
    </Box>
  );
});
CryptoTabContent.displayName = "CryptoTabContent";

// Fiat tab — Onramper iframe. Deposit detection is handled globally by watcher.
const FiatTabContent = memo(({
  walletAddress,
  totalFiatUsd,
  minFiatGames,
  strkPerGame,
  isMinting,
  isOnrampInProgress,
  onDismissOnrampOverlay,
  strkBalance,
  strkQuoteForGames,
}: {
  walletAddress: string;
  totalFiatUsd: number | null;
  minFiatGames: number;
  strkPerGame: number | null;
  isMinting: boolean;
  isOnrampInProgress: boolean;
  onDismissOnrampOverlay: () => void;
  strkBalance?: number;
  strkQuoteForGames?: number | null;
}) => {
  const [signature, setSignature] = useState<string | null>(null);
  const sessionIdRef = useRef(generateSessionId());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onrampStatus = useSwapStore((s) => s.onrampStatus);
  const onrampProvider = useSwapStore((s) => s.onrampProvider);

  useEffect(() => {
    if (walletAddress && !IS_DEV_MOCK) {
      fetchOnramperSignature(walletAddress).then(setSignature);
    }
  }, [walletAddress]);

  // --- Listen for postMessage events from Onramper iframe ---
  useEffect(() => {
    if (IS_DEV_MOCK) return;

    const handleMessage = (event: MessageEvent) => {
      // Validate origin — only accept messages from Onramper domains
      const isOnramperOrigin = ONRAMPER_ORIGINS.some((origin) =>
        event.origin.startsWith(origin)
      );

      // Log non-Onramper messages for debugging, but skip noisy wallet detection events
      if (!isOnramperOrigin) {
        if (
          typeof event.data === "object" &&
          event.data !== null &&
          event.data?.type !== "externalDetectWallets" &&
          event.data?.methodName !== "externalDetectWallets"
        ) {
          console.log("[OnRamp] postMessage from unknown origin:", event.origin, event.data);
        }
        return;
      }

      const data = event.data;

      // Skip noisy wallet detection messages from the Onramper iframe
      if (typeof data === "object" && data !== null && data.type === "externalDetectWallets") {
        return;
      }

      console.log("[OnRamp] postMessage received:", JSON.stringify(data, null, 2));

      // Try to extract status from various possible payload shapes
      const store = useSwapStore.getState();
      let detectedStatus: OnrampStatus | null = null;

      if (typeof data === "object" && data !== null) {
        // Shape 1: { type: "...", payload: { status: "...", ... } }
        if (data.payload?.status) {
          const raw = String(data.payload.status).toLowerCase();
          detectedStatus = ONRAMP_STATUS_MAP[raw] || null;
          console.log(`[OnRamp] Detected status from payload: ${raw} -> ${detectedStatus}`);

          store.setOnrampTransaction({
            transactionId: data.payload.transactionId || data.payload.onrampTransactionId,
            provider: data.payload.onramp || data.payload.provider,
            paymentMethod: data.payload.paymentMethod,
            status: detectedStatus || undefined,
          });
        }

        // Shape 2: { status: "...", ... } (flat)
        else if (data.status && typeof data.status === "string") {
          const raw = String(data.status).toLowerCase();
          detectedStatus = ONRAMP_STATUS_MAP[raw] || null;
          console.log(`[OnRamp] Detected status (flat): ${raw} -> ${detectedStatus}`);

          store.setOnrampTransaction({
            transactionId: data.transactionId || data.onrampTransactionId,
            provider: data.onramp || data.provider,
            paymentMethod: data.paymentMethod,
            status: detectedStatus || undefined,
          });
        }

        // Shape 3: { type: "onramper-event", event: "tx_completed" } or similar
        else if (data.type && typeof data.type === "string") {
          const eventType = data.type.toLowerCase();
          console.log(`[OnRamp] Event type received: ${eventType}`);

          if (eventType.includes("complete") || eventType.includes("success")) {
            detectedStatus = "completed";
          } else if (eventType.includes("fail") || eventType.includes("error")) {
            detectedStatus = "failed";
          } else if (eventType.includes("cancel")) {
            detectedStatus = "canceled";
          } else if (eventType.includes("pending") || eventType.includes("processing")) {
            detectedStatus = "pending";
          } else if (eventType.includes("paid") || eventType.includes("payment")) {
            detectedStatus = "paid";
          } else if (eventType.includes("new") || eventType.includes("created")) {
            detectedStatus = "new";
          }

          if (detectedStatus) {
            console.log(`[OnRamp] Mapped event type "${eventType}" -> status "${detectedStatus}"`);
            store.setOnrampStatus(detectedStatus);
          }
        }

        // Log the raw event data for any shape
        if (data.type || data.event || data.status || data.payload) {
          console.log("[OnRamp] Event details:", {
            type: data.type,
            event: data.event,
            status: data.status,
            transactionId: data.transactionId || data.payload?.transactionId,
            provider: data.onramp || data.payload?.onramp,
            sessionId: sessionIdRef.current,
          });
        }
      } else if (typeof data === "string") {
        console.log("[OnRamp] String message:", data);
        // Some widgets send simple string events
        const lower = data.toLowerCase();
        if (lower.includes("complete") || lower.includes("success")) {
          store.setOnrampStatus("completed");
        } else if (lower.includes("fail")) {
          store.setOnrampStatus("failed");
        } else if (lower.includes("cancel")) {
          store.setOnrampStatus("canceled");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("[OnRamp] postMessage listener registered, session:", sessionIdRef.current);

    return () => {
      window.removeEventListener("message", handleMessage);
      console.log("[OnRamp] postMessage listener removed");
    };
  }, []);

  // Reset the iframe for retry (cancel/failed cases)
  const handleRetryOnramp = useCallback(() => {
    console.log("[OnRamp] User retrying on-ramp flow");
    const store = useSwapStore.getState();
    store.resetOnramp();
    // Generate a new session ID for the retry
    sessionIdRef.current = generateSessionId();
    // Force iframe reload by clearing and re-setting signature
    setSignature(null);
    if (walletAddress) {
      fetchOnramperSignature(walletAddress).then(setSignature);
    }
  }, [walletAddress]);

  // Determine which overlay to show
  const showOnrampOverlay = !isMinting && (
    onrampStatus === "new" ||
    onrampStatus === "pending" ||
    onrampStatus === "paid" ||
    onrampStatus === "canceled" ||
    onrampStatus === "failed"
  );
  const isOnrampTerminalError = onrampStatus === "canceled" || onrampStatus === "failed";

  // Minting overlay (shared by both dev and prod)
  const mintingOverlay = isMinting && (
    <Box sx={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "rgba(15, 31, 15, 0.95)", borderRadius: 1,
    }}>
      <CircularProgress size={40} sx={{ color: "#d0c98d", mb: 2 }} />
      <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
        Minting {minFiatGames} game{minFiatGames > 1 ? "s" : ""}...
      </Typography>
      <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
        Confirm the transaction in your wallet
      </Typography>
    </Box>
  );

  // Onramp status overlay (spinner + status for new/pending/paid, error for canceled/failed)
  const onrampOverlay = showOnrampOverlay && (
    <Box sx={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "rgba(15, 31, 15, 0.92)", borderRadius: 1,
    }}>
      {!isOnrampTerminalError ? (
        <>
          <CircularProgress size={48} sx={{ color: "#d0c98d", mb: 2.5 }} />
          <Typography sx={{
            fontSize: 16, fontWeight: 700, mb: 1, letterSpacing: 0.5,
            color: onrampStatus === "paid" ? "#80FF00" : "#d0c98d",
          }}>
            {ONRAMP_STATUS_LABELS[onrampStatus]}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", px: 3 }}>
            {onrampStatus === "new" && "Your purchase has been initiated. Please complete the payment."}
            {onrampStatus === "pending" && "Your payment is being processed. This may take a few moments."}
            {onrampStatus === "paid" && "Payment confirmed! Your STRK tokens are on their way."}
          </Typography>
          {onrampProvider && (
            <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)", mt: 2 }}>
              Provider: {onrampProvider}
            </Typography>
          )}
        </>
      ) : (
        <>
          <Box sx={{
            width: 48, height: 48, borderRadius: "50%", mb: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: onrampStatus === "canceled"
              ? "rgba(255, 165, 0, 0.15)"
              : "rgba(244, 67, 54, 0.15)",
            border: `2px solid ${onrampStatus === "canceled" ? "rgba(255, 165, 0, 0.5)" : "rgba(244, 67, 54, 0.5)"}`,
          }}>
            <Typography sx={{
              fontSize: 24, lineHeight: 1,
              color: onrampStatus === "canceled" ? "#FFA500" : "#f44336",
            }}>
              {onrampStatus === "canceled" ? "!" : "X"}
            </Typography>
          </Box>
          <Typography sx={{
            fontSize: 16, fontWeight: 700, mb: 1,
            color: onrampStatus === "canceled" ? "#FFA500" : "#f44336",
          }}>
            {ONRAMP_STATUS_LABELS[onrampStatus]}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", px: 3, mb: 2.5 }}>
            {onrampStatus === "canceled"
              ? "The purchase was canceled. You can try again below."
              : "Something went wrong with the payment. Please try again."}
          </Typography>
          <Button
            variant="contained"
            onClick={handleRetryOnramp}
            sx={{
              ...styles.activateButton,
              px: 4,
              background: onrampStatus === "canceled" ? "#FFA500" : "#f44336",
              "&:hover": {
                background: onrampStatus === "canceled" ? "#FFB733" : "#e53935",
              },
            }}
          >
            <Typography sx={{ ...styles.buttonText, color: "#fff" }}>
              Return to On-Ramp
            </Typography>
          </Button>
        </>
      )}
    </Box>
  );

  // Info banner (shared by both dev and prod)
  const infoBanner = (
    <Box sx={{
      mx: 2, mt: 1.5, mb: 1, px: 2, py: 1.5,
      background: "rgba(208, 201, 141, 0.08)",
      border: "1px solid rgba(208, 201, 141, 0.2)",
      borderRadius: 1, textAlign: "center",
    }}>
      {strkPerGame && (
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#d0c98d", letterSpacing: 0.5 }}>
          1 game = {strkPerGame.toFixed(1)} STRK
        </Typography>
      )}
      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)", mt: 0.5 }}>
        ~${totalFiatUsd ? Math.ceil(totalFiatUsd * 1.03) : "..."} = {minFiatGames} game{minFiatGames > 1 ? "s" : ""} — buy more to get extra games
      </Typography>
    </Box>
  );

  // --- DEV MOCK MODE ---
  if (IS_DEV_MOCK) {
    const hasEnoughStrk = strkBalance != null && strkQuoteForGames != null && strkBalance >= strkQuoteForGames * 0.9;

    return (
      <Box sx={{ position: "relative", width: "100%" }}>
        {mintingOverlay}
        {onrampOverlay}
        {infoBanner}
        {/* Dev mock panel */}
        <Box sx={{
          mx: 2, mt: 1, mb: 2, p: 2,
          background: "rgba(255, 165, 0, 0.08)",
          border: "2px dashed rgba(255, 165, 0, 0.4)",
          borderRadius: 1,
        }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#FFA500", mb: 1.5, textAlign: "center", letterSpacing: 1 }}>
            DEV MODE — Onramper iframe disabled
          </Typography>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)", mb: 2, textAlign: "center" }}>
            No VITE_ONRAMPER_API_KEY set. Use the button below to test the swap+mint flow directly with STRK from your wallet.
          </Typography>

          {/* Debug info */}
          <Box sx={{
            p: 1.5, mb: 2, background: "rgba(0,0,0,0.3)", borderRadius: 1,
            fontFamily: "monospace", fontSize: 11, lineHeight: 1.8,
          }}>
            <Box sx={{ color: "rgba(255,255,255,0.7)" }}>
              Wallet: {walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}` : "not connected"}
            </Box>
            <Box sx={{ color: strkBalance != null && strkBalance > 0 ? "#4caf50" : "#f44336" }}>
              STRK balance: {strkBalance?.toFixed(4) ?? "..."} STRK
            </Box>
            <Box sx={{ color: "rgba(255,255,255,0.7)" }}>
              STRK needed: {strkQuoteForGames?.toFixed(4) ?? "..."} STRK ({minFiatGames} game{minFiatGames > 1 ? "s" : ""})
            </Box>
            <Box sx={{ color: "rgba(255,255,255,0.7)" }}>
              Ticket price: ~${totalFiatUsd?.toFixed(2) ?? "..."} USD / {minFiatGames} game{minFiatGames > 1 ? "s" : ""}
            </Box>
            <Box sx={{ color: hasEnoughStrk ? "#4caf50" : "#f44336", fontWeight: 600, mt: 0.5 }}>
              {hasEnoughStrk ? "Ready to swap" : "Insufficient STRK balance"}
            </Box>
            <Box sx={{ color: "#d0c98d", mt: 0.5 }}>
              Session: {sessionIdRef.current}
            </Box>
            <Box sx={{ color: "#d0c98d" }}>
              Onramp status: {onrampStatus}
            </Box>
          </Box>

          {/* Dev: simulate onramp statuses */}
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2, justifyContent: "center" }}>
            {(["new", "pending", "paid", "completed", "canceled", "failed"] as OnrampStatus[]).map((s) => (
              <Button
                key={s}
                size="small"
                variant="outlined"
                onClick={() => useSwapStore.getState().setOnrampStatus(s)}
                sx={{
                  fontSize: 9, py: 0.25, px: 1, minWidth: 0,
                  borderColor: onrampStatus === s ? "#FFA500" : "rgba(255,165,0,0.3)",
                  color: onrampStatus === s ? "#FFA500" : "rgba(255,165,0,0.5)",
                }}
              >
                {s}
              </Button>
            ))}
          </Box>

          {/* Trigger button */}
          <Button
            variant="contained"
            fullWidth
            disabled={!hasEnoughStrk || isMinting}
            onClick={() => { /* swap is now handled by useOnrampWatcher */ }}
            sx={{
              ...styles.activateButton,
              background: hasEnoughStrk ? "#FFA500" : "rgba(255, 165, 0, 0.3)",
              "&:hover": {
                background: hasEnoughStrk ? "#FFB733" : "rgba(255, 165, 0, 0.3)",
              },
            }}
          >
            <Typography sx={{ ...styles.buttonText, color: "#1a2f1a" }}>
              {hasEnoughStrk
                ? `Swap ${strkQuoteForGames?.toFixed(2)} STRK + Mint ${minFiatGames} Game${minFiatGames > 1 ? "s" : ""}`
                : "Need more STRK in wallet"}
            </Typography>
          </Button>

          <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.35)", mt: 1.5, textAlign: "center" }}>
            This triggers the same swapStrkAndMint() flow that auto-fires after Onramper deposit in production.
            Set VITE_ONRAMPER_API_KEY in .env.local to test the real Onramper widget.
          </Typography>
        </Box>
      </Box>
    );
  }

  // --- PRODUCTION MODE ---
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {mintingOverlay}
      {onrampOverlay}
      {infoBanner}
      {/* Full overlay when checkout continues in another tab */}
      {isOnrampInProgress && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            background: "#0f1f0f",
            borderRadius: 1,
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              px: 3,
              textAlign: "center",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  position: "relative",
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={40} thickness={2.5} sx={{ color: "#d0c98d" }} />
                <CreditCardIcon sx={{ fontSize: 18, color: "#d0c98d", position: "absolute" }} />
              </Box>
              <Box sx={{ textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#d0c98d",
                    fontFamily: "Cinzel, Georgia, serif",
                    lineHeight: 1.2,
                  }}
                >
                  Payment in progress
                </Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.4, mt: 0.25 }}>
                  Finish checkout in the opened tab.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 0.75 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#d0c98d",
                    animation: "onrampPulse 1.4s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                    "@keyframes onrampPulse": {
                      "0%, 80%, 100%": { opacity: 0.2, transform: "scale(0.8)" },
                      "40%": { opacity: 1, transform: "scale(1.2)" },
                    },
                  }}
                />
              ))}
            </Box>

            <Typography sx={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)", lineHeight: 1.5, maxWidth: 320 }}>
              You can close this window now — we keep tracking your deposit and will notify you here when STRK arrives.
            </Typography>
          </Box>

          <Box sx={{ px: 3, pb: 2, textAlign: "center" }}>
            <Button
              variant="outlined"
              onClick={onDismissOnrampOverlay}
              fullWidth
              sx={{
                py: 1.2,
                color: "#d0c98d",
                borderColor: "rgba(208, 201, 141, 0.3)",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.3,
                "&:hover": {
                  borderColor: "#d0c98d",
                  background: "rgba(208, 201, 141, 0.1)",
                },
              }}
            >
              Tab didn't open? Retry here
            </Button>
          </Box>
        </Box>
      )}
      <iframe
        ref={iframeRef}
        src={buildOnramperUrl(walletAddress, totalFiatUsd, signature, sessionIdRef.current)}
        title="Onramper Widget"
        width="100%"
        scrolling="no"
        style={{
          border: "none",
          display: "block",
          height: "clamp(560px, calc(90dvh - 240px), 860px)",
        }}
        allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
      />
    </Box>
  );
});
FiatTabContent.displayName = "FiatTabContent";

// --- Main Component ---

export default function PaymentOptionsModal({
  open,
  onClose,
}: PaymentOptionsModalProps) {
  const {
    tokenBalances, goldenPassIds, enterDungeon, bulkMintGames, purchaseGames, refreshTokenBalances,
  } = useController();
  const { defaultPaymentToken } = useUIStore();

  const { provider } = useProvider();
  const { address: accountAddress } = useAccount();
  const { currentNetworkConfig } = useDynamicConnector();
  const dungeon = useDungeon();

  const routerContract = useMemo(
    () =>
      currentNetworkConfig.ekuboRouter
        ? new Contract({
            abi: ROUTER_ABI,
            address: currentNetworkConfig.ekuboRouter,
            providerOrAccount: provider,
          })
        : null,
    [provider, currentNetworkConfig.ekuboRouter]
  );

  // --- Derived data ---

  const paymentTokens = useMemo(() => currentNetworkConfig.paymentTokens || [], [currentNetworkConfig.paymentTokens]);

  const userTokens = useMemo(() => {
    return paymentTokens
      .map((token: any) => ({
        symbol: token.name,
        balance: tokenBalances[token.name] || 0,
        address: token.address,
        decimals: token.decimals || 18,
        displayDecimals: token.displayDecimals || 4,
      }))
      .filter(
        (token: any) =>
          Number(token.balance) > 0 &&
          token.address !== dungeon.ticketAddress &&
          token.name !== "USDC.e Bridged"
      );
  }, [paymentTokens, tokenBalances]);

  const dungeonTicketCount = useMemo(() => {
    const dungeonTicketToken = paymentTokens.find(
      (token: any) => token.address === dungeon.ticketAddress
    );
    return dungeonTicketToken ? Number(tokenBalances[dungeonTicketToken.name]) : 0;
  }, [paymentTokens, tokenBalances]);

  // Current STRK balance (for fiat funded phase)
  const strkBalance = useMemo(() => {
    return Number(tokenBalances["STRK"] || 0);
  }, [tokenBalances]);

  // --- State ---

  const [specialView, setSpecialView] = useState<"golden" | "dungeon" | null>(null);
  const [activeTab, setActiveTab] = useState<"crypto" | "fiat">("crypto");
  const [selectedToken, setSelectedToken] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [tokenQuote, setTokenQuote] = useState<{
    amount: string;
    loading: boolean;
    error?: string;
  }>({ amount: "", loading: false });
  const [isFiatCheckoutInProgress, setIsFiatCheckoutInProgress] = useState(false);
  const [ticketPriceUsd, setTicketPriceUsd] = useState<string | null>(null);
  const [strkQuoteForGames, setStrkQuoteForGames] = useState<number | null>(null);
  const [minFiatAmount, setMinFiatAmount] = useState(FALLBACK_MIN_FIAT_USD);

  // Minimum games for fiat tab (derived from onramp minimum and ticket price)
  const minFiatGames = useMemo(() => {
    if (!ticketPriceUsd) return MIN_GAMES;
    const pricePerGame = parseFloat(ticketPriceUsd);
    if (pricePerGame <= 0) return MIN_GAMES;
    const minGames = Math.ceil(minFiatAmount / (pricePerGame * 1.03));
    return Math.max(MIN_GAMES, Math.min(minGames, MAX_GAMES));
  }, [minFiatAmount, ticketPriceUsd]);

  // Total fiat USD for the Onramper widget (min games * price per game)
  const totalFiatUsd = useMemo(() => {
    if (!ticketPriceUsd) return null;
    return parseFloat(ticketPriceUsd) * minFiatGames;
  }, [ticketPriceUsd, minFiatGames]);

  // Refs for UI tracking
  const fiatTabWasHidden = useRef(false);
  const initialTabSet = useRef(false);
  const registeringOnrampIntent = useRef(false);

  // --- Initialize view on open ---

  useEffect(() => {
    if (!open) {
      // Reset local UI state on close
      setSpecialView(null);
      setIsMinting(false);
      setIsFiatCheckoutInProgress(false);
      fiatTabWasHidden.current = false;
      initialTabSet.current = false;
      registeringOnrampIntent.current = false;
      // Only reset swap store if no active on-ramp flow (preserve persisted state)
      const swapState = useSwapStore.getState();
      const hasActiveOnramp = swapState.stage === "waiting_deposit" &&
        swapState.initialStrkBalance !== null;
      if (!hasActiveOnramp && swapState.stage !== "done" && swapState.stage !== "idle") {
        swapState.reset();
      }
      return;
    }

    // Determine initial view
    if (goldenPassIds.length > 0) {
      setSpecialView("golden");
    } else if (dungeonTicketCount >= 1) {
      setSpecialView("dungeon");
    } else {
      setSpecialView(null);
    }
  }, [open]);

  // Set initial tab based on balance (only once per modal open)
  useEffect(() => {
    if (!initialTabSet.current && specialView === null && open) {
      const hasTokens = userTokens.length > 0 && userTokens.some((t: any) => parseFloat(t.balance) > 0);
      setActiveTab(hasTokens ? "crypto" : "fiat");
      initialTabSet.current = true;
    }
  }, [specialView, open, userTokens]);

  // --- Fetch ticket price in USD ---

  useEffect(() => {
    const fetchTicketPriceUsd = async () => {
      if (!dungeon.ticketAddress) return;
      const usdcToken = currentNetworkConfig.paymentTokens.find((t: any) => t.name === "USDC");
      if (!usdcToken) return;

      try {
        const quote = await getSwapQuote(-1e18, dungeon.ticketAddress, usdcToken.address);
        if (quote && quote.total !== 0) {
          const priceUsd = ((quote.total * -1) / 1e6).toFixed(2);
          setTicketPriceUsd(priceUsd);
        }
      } catch (error) {
        console.error("Error fetching ticket price in USD:", error);
      }
    };
    fetchTicketPriceUsd();
  }, [dungeon.ticketAddress]);

  // --- Fetch Onramper minimum fiat amount ---

  useEffect(() => {
    fetchOnramperMinFiat().then(setMinFiatAmount);
  }, []);

  // --- Fetch STRK quote for minFiatGames (how much STRK needed to buy N tickets) ---

  useEffect(() => {
    const fetchStrkQuote = async () => {
      if (!dungeon.ticketAddress || minFiatGames < 1) return;
      const strkToken = currentNetworkConfig.paymentTokens.find((t: any) => t.name === "STRK");
      if (!strkToken) return;

      try {
        const quote = await getSwapQuote(
          -minFiatGames * 1e18,
          dungeon.ticketAddress,
          strkToken.address
        );
        if (quote && quote.total !== 0) {
          const rawAmount = (quote.total * -1) / Math.pow(10, strkToken.decimals || 18);
          setStrkQuoteForGames(rawAmount);
        }
      } catch (error) {
        console.error("Error fetching STRK quote for games:", error);
      }
    };
    fetchStrkQuote();
  }, [dungeon.ticketAddress, minFiatGames]);

  // --- Default token selection ---

  useEffect(() => {
    if (userTokens.length > 0 && !selectedToken) {
      const hasDefaultToken = userTokens.some((t: any) => t.symbol === defaultPaymentToken);
      setSelectedToken(hasDefaultToken ? defaultPaymentToken : userTokens[0].symbol);
    }
  }, [userTokens, defaultPaymentToken]);

  // --- Quote fetching ---

  const fetchTokenQuote = useCallback(
    async (tokenSymbol: string, numGames: number) => {
      const selectedTokenData = userTokens.find((t: any) => t.symbol === tokenSymbol);
      if (!selectedTokenData?.address || !dungeon.ticketAddress) {
        setTokenQuote({ amount: "", loading: false, error: "Token not supported" });
        return;
      }

      setTokenQuote({ amount: "", loading: true });

      try {
        const quote = await getSwapQuote(
          -numGames * 1e18,
          dungeon.ticketAddress,
          selectedTokenData.address
        );
        if (quote) {
          const rawAmount = (quote.total * -1) / Math.pow(10, selectedTokenData.decimals || 18);
          if (rawAmount === 0) {
            setTokenQuote({ amount: "", loading: false, error: "No liquidity" });
          } else {
            setTokenQuote({ amount: formatAmount(rawAmount), loading: false });
          }
        } else {
          setTokenQuote({ amount: "", loading: false, error: "No quote available" });
        }
      } catch (error) {
        console.error("Error fetching quote:", error);
        setTokenQuote({ amount: "", loading: false, error: "Failed to get quote" });
      }
    },
    [userTokens, dungeon.ticketAddress]
  );

  // Fetch quote when token changes (crypto tab — always 1 game)
  useEffect(() => {
    if (selectedToken && specialView === null) {
      fetchTokenQuote(selectedToken, 1);
    }
  }, [selectedToken, specialView]);

  // --- Balance polling for fiat funded phase ---

  // Register on-ramp intent when fiat tab opens (persisted — survives page close)
  useEffect(() => {
    if (!(activeTab === "fiat" && specialView === null && open && !isMinting && accountAddress)) {
      return;
    }

    const swapState = useSwapStore.getState();
    if (swapState.stage !== "idle" || registeringOnrampIntent.current) {
      return;
    }

    registeringOnrampIntent.current = true;

    const registerOnrampIntent = async () => {
      let initialBalance = strkBalance;
      let source: "cached" | "refreshed" = "cached";

      try {
        const refreshedBalances = await refreshTokenBalances();
        const refreshedStrk = Number(refreshedBalances["STRK"] ?? NaN);
        if (Number.isFinite(refreshedStrk)) {
          initialBalance = refreshedStrk;
          source = "refreshed";
        }
      } catch (error) {
        console.warn("[OnRamp] Failed to refresh STRK balance before intent registration", error);
      }

      const latestSwapState = useSwapStore.getState();
      if (latestSwapState.stage !== "idle") return;

      latestSwapState.startOnramp(initialBalance, accountAddress);
      console.log("[OnRamp] On-ramp intent registered:", {
        initialStrkBalance: initialBalance,
        source,
      });
    };

    registerOnrampIntent().finally(() => {
      registeringOnrampIntent.current = false;
    });
  }, [activeTab, specialView, open, isMinting, accountAddress, strkBalance, refreshTokenBalances]);

  // Show checkout overlay after returning from the provider tab.
  // This keeps users informed while we keep tracking in the background.
  useEffect(() => {
    if (activeTab !== "fiat" || !open) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        fiatTabWasHidden.current = true;
      } else if (document.visibilityState === "visible" && fiatTabWasHidden.current) {
        setIsFiatCheckoutInProgress(true);
        fiatTabWasHidden.current = false;
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      fiatTabWasHidden.current = false;
    };
  }, [activeTab, open]);

  // --- Actions ---

  const useGoldenToken = () => {
    enterDungeon(
      {
        paymentType: "Golden Pass",
        goldenPass: {
          address: currentNetworkConfig.goldenToken,
          tokenId: goldenPassIds[0],
        },
      },
      []
    );
  };

  const useDungeonTicket = () => {
    enterDungeon({ paymentType: "Ticket" }, []);
  };

  const buyDungeonTicket = async () => {
    const selectedTokenData = userTokens.find((t: any) => t.symbol === selectedToken);
    if (!selectedTokenData || !routerContract) return;

    const quote = await getSwapQuote(
      -1e18,
      dungeon.ticketAddress!,
      selectedTokenData.address
    );

    const tokenSwapData = {
      tokenAddress: dungeon.ticketAddress!,
      minimumAmount: 1,
      quote: quote,
    };
    const calls = generateSwapCalls(routerContract, selectedTokenData.address, tokenSwapData);
    enterDungeon({ paymentType: "Ticket" }, calls);
  };

  // swapStrkAndMint logic has been moved to useOnrampWatcher (global hook).

  const handleTokenChange = useCallback(
    (tokenSymbol: string) => {
      setSelectedToken(tokenSymbol);
    },
    []
  );

  // --- Render helpers ---

  const MotionWrapper = ({
    children,
    viewKey,
  }: {
    children: React.ReactNode;
    viewKey: string;
  }) => (
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );

  const ActionButton = ({
    onClick,
    children,
    disabled,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <Box sx={{ display: "flex", justifyContent: "center", px: 2, mb: 2 }}>
      <Button
        variant="contained"
        sx={styles.activateButton}
        onClick={onClick}
        fullWidth
        disabled={disabled}
      >
        <Typography sx={styles.buttonText}>{children}</Typography>
      </Button>
    </Box>
  );

  // --- Main render ---

  return (
    <AnimatePresence>
      {open && (
        <Box sx={styles.overlay}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box sx={styles.modal}>
              <Box sx={styles.modalGlow} />
              <IconButton onClick={onClose} sx={styles.closeBtn} size="small">
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>

              <Box sx={styles.header}>
                <Box sx={styles.titleContainer}>
                  <Typography sx={styles.title}>DUNGEON ACCESS</Typography>
                  <Box sx={styles.titleUnderline} />
                </Box>
                <Typography sx={styles.subtitle}>
                  Select payment method
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0, width: "100%", mx: "auto" }}>
                <AnimatePresence mode="wait">
                  {/* Golden Token View */}
                  {specialView === "golden" && (
                    <MotionWrapper viewKey="golden">
                      <Box sx={styles.paymentCard}>
                        <Box sx={{ display: "flex", justifyContent: "center", mb: 0, mt: 2 }}>
                          <Typography sx={styles.paymentTitle}>Use Golden Token</Typography>
                        </Box>
                        <Box sx={styles.goldenTokenContainer}>
                          <img
                            src="/images/golden_token.svg"
                            alt="Golden Token"
                            style={{ width: "150px", height: "150px" }}
                          />
                        </Box>
                        <ActionButton onClick={useGoldenToken}>Enter Dungeon</ActionButton>
                      </Box>
                    </MotionWrapper>
                  )}

                  {/* Dungeon Ticket View */}
                  {specialView === "dungeon" && (
                    <MotionWrapper viewKey="dungeon">
                      <Box sx={styles.paymentCard}>
                        <Box sx={{ display: "flex", justifyContent: "center", mb: 0, mt: 2 }}>
                          <Typography sx={styles.paymentTitle}>Use Dungeon Ticket</Typography>
                        </Box>
                        <Box sx={styles.goldenTokenContainer}>
                          <img
                            src="/images/dungeon_ticket.png"
                            alt="Dungeon Ticket"
                            style={{ width: "120px", height: "120px", objectFit: "contain", display: "block" }}
                            onError={(e) => {
                              console.error("Failed to load dungeon ticket image");
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                          <Typography sx={styles.ticketCount}>
                            You have {dungeonTicketCount} ticket{dungeonTicketCount > 1 ? "s" : ""}
                          </Typography>
                        </Box>
                        <ActionButton onClick={useDungeonTicket}>Enter Dungeon</ActionButton>
                        {dungeonTicketCount > 1 && (
                          <Box onClick={() => bulkMintGames(dungeonTicketCount, onClose)} textAlign="center" mt="-10px">
                            <Typography sx={styles.mintAll}>
                              Bulk Mint {dungeonTicketCount > 50 ? "50" : "All"} Games
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </MotionWrapper>
                  )}

                  {/* Tabbed Payment View */}
                  {specialView === null && accountAddress && (
                    <motion.div
                      key="tabbed-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ width: "100%" }}
                    >
                      {/* Tab Headers */}
                      <Box sx={{ borderBottom: 1, borderColor: "rgba(208, 201, 141, 0.2)", mx: 2 }}>
                        <Tabs
                          value={activeTab}
                          onChange={(_, val) => setActiveTab(val)}
                          variant="fullWidth"
                          sx={{
                            minHeight: 40,
                            "& .MuiTabs-indicator": { backgroundColor: "#d0c98d" },
                          }}
                        >
                          <Tab
                            value="crypto"
                            label="Crypto"
                            icon={<TokenIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            sx={{
                              minHeight: 40, fontSize: 13, fontWeight: 600,
                              color: activeTab === "crypto" ? "#d0c98d" : "rgba(255,255,255,0.6)",
                              "&.Mui-selected": { color: "#d0c98d" },
                            }}
                          />
                          <Tab
                            value="fiat"
                            label="Fiat"
                            icon={<CreditCardIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            sx={{
                              minHeight: 40, fontSize: 13, fontWeight: 600,
                              color: activeTab === "fiat" ? "#d0c98d" : "rgba(255,255,255,0.6)",
                              "&.Mui-selected": { color: "#d0c98d" },
                            }}
                          />
                        </Tabs>
                      </Box>

                      {/* Tab Content */}
                      {activeTab === "crypto" && (
                        <CryptoTabContent
                          userTokens={userTokens}
                          selectedToken={selectedToken}
                          tokenQuote={tokenQuote}
                          onTokenChange={handleTokenChange}
                          buyDungeonTicket={buyDungeonTicket}
                        />
                      )}
                      {activeTab === "fiat" && (
                        <FiatTabContent
                          walletAddress={accountAddress}
                          totalFiatUsd={totalFiatUsd}
                          minFiatGames={minFiatGames}
                          strkPerGame={strkQuoteForGames && minFiatGames > 0 ? strkQuoteForGames / minFiatGames : null}
                          isMinting={isMinting}
                          isOnrampInProgress={isFiatCheckoutInProgress && !isMinting}
                          onDismissOnrampOverlay={() => setIsFiatCheckoutInProgress(false)}
                          strkBalance={strkBalance}
                          strkQuoteForGames={strkQuoteForGames}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>

              {/* Footer links */}
              <Box sx={styles.footer}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                  {/* From special views -> tabbed view */}
                  {(specialView === "golden" || specialView === "dungeon") && (
                    <Link
                      component="button"
                      onClick={() => setSpecialView(null)}
                      sx={styles.footerLink}
                    >
                      Pay with crypto or card instead
                    </Link>
                  )}

                  {/* From tabbed view -> special views */}
                  {specialView === null && goldenPassIds.length > 0 && (
                    <Link
                      component="button"
                      onClick={() => setSpecialView("golden")}
                      sx={styles.footerLink}
                    >
                      Use Golden Token
                    </Link>
                  )}
                  {specialView === null && dungeonTicketCount >= 1 && (
                    <Link
                      component="button"
                      onClick={() => setSpecialView("dungeon")}
                      sx={styles.footerLink}
                    >
                      Use Dungeon Ticket ({dungeonTicketCount})
                    </Link>
                  )}

                  {/* Golden -> Dungeon shortcut */}
                  {specialView === "golden" && dungeonTicketCount >= 1 && (
                    <Link
                      component="button"
                      onClick={() => setSpecialView("dungeon")}
                      sx={styles.footerLink}
                    >
                      Use dungeon ticket instead
                    </Link>
                  )}
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  );
}

// --- Styles ---

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    bgcolor: "rgba(0, 0, 0, 0.5)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
  },
  modal: {
    width: "500px",
    maxWidth: "95dvw",
    maxHeight: "96dvh",
    overflowY: "auto" as const,
    p: 0,
    borderRadius: 3,
    background: "linear-gradient(145deg, #1a2f1a 0%, #0f1f0f 100%)",
    border: "2px solid rgba(208, 201, 141, 0.4)",
    boxShadow:
      "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(208, 201, 141, 0.1)",
    position: "relative" as const,
  },
  modalGlow: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(45deg, transparent 30%, rgba(208, 201, 141, 0.02) 50%, transparent 70%)",
    pointerEvents: "none" as const,
  },
  closeBtn: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    color: "#d0c98d",
    background: "rgba(208, 201, 141, 0.1)",
    border: "1px solid rgba(208, 201, 141, 0.2)",
    "&:hover": {
      background: "rgba(208, 201, 141, 0.2)",
      transform: "scale(1.1)",
    },
    transition: "all 0.2s ease",
    zIndex: 10,
  },
  header: {
    textAlign: "center" as const,
    p: 3,
    pb: 2,
    borderBottom: "1px solid rgba(208, 201, 141, 0.2)",
  },
  titleContainer: {
    position: "relative" as const,
    mb: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1.5,
    textShadow: "0 2px 8px rgba(208, 201, 141, 0.3)",
  },
  titleUnderline: {
    width: 80,
    height: 2,
    background: "linear-gradient(90deg, transparent, #d0c98d, transparent)",
    mx: "auto",
    borderRadius: 1,
    mt: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFD700",
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  paymentCard: {
    height: "250px",
    m: 2,
    background: "rgba(24, 40, 24, 0.6)",
    border: "2px solid rgba(208, 201, 141, 0.3)",
    borderRadius: 2,
    overflow: "visible",
    position: "relative" as const,
    backdropFilter: "blur(4px)",
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: 0.5,
    mb: 0.5,
  },
  mobileSelectButton: {
    height: "48px",
    textTransform: "none" as const,
    fontWeight: 500,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(208, 201, 141, 0.3)",
    borderRadius: 1,
    color: "inherit",
    "&:hover": {
      borderColor: "rgba(208, 201, 141, 0.5)",
      background: "rgba(0, 0, 0, 0.5)",
    },
  },
  tokenRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginLeft: "10px",
  },
  tokenLeft: {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
  },
  tokenName: {
    fontSize: 14,
    fontWeight: 600,
  },
  tokenBalance: {
    fontSize: 11,
    color: "#FFD700",
    opacity: 0.7,
  },
  costText: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  goldenTokenContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  ticketCount: {
    fontSize: 14,
    color: "#FFD700",
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  mintAll: {
    fontFamily: "Tiems",
    fontSize: 13,
    color: "#FFD700",
    opacity: 0.9,
    textDecoration: "underline",
    cursor: "pointer",
    "&:hover": {
      color: "text.primary",
      textDecoration: "underline",
    },
  },
  activateButton: {
    background: "#d0c98d",
    color: "#1a2f1a",
    py: 1.2,
    borderRadius: 1,
    fontWeight: 700,
    letterSpacing: 0.5,
    textAlign: "center" as const,
    justifyContent: "center",
    alignItems: "center",
    "&:hover": {
      background: "#e6df9a",
      boxShadow: "0 4px 12px rgba(208, 201, 141, 0.3)",
    },
    "&:active": {
      transform: "translateY(1px)",
    },
    transition: "all 0.2s ease",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.5,
    color: "#1a2f1a",
    textAlign: "center" as const,
  },
  footer: {
    p: 2,
    textAlign: "center" as const,
    borderTop: "1px solid rgba(208, 201, 141, 0.2)",
  },
  footerLink: {
    fontSize: 13,
    color: "#FFD700",
    textDecoration: "underline",
    letterSpacing: 0.5,
    transition: "color 0.2s",
    "&:hover": {
      color: "text.primary",
      textDecoration: "underline",
    },
  },
};
