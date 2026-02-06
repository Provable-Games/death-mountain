import ROUTER_ABI from "@/abi/router-abi.json";
import { generateSwapCalls, getSwapQuote } from "@/api/ekubo";
import { useController } from "@/contexts/controller";
import { useDungeon } from "@/dojo/useDungeon";
import { useUIStore } from "@/stores/uiStore";
import { NETWORKS } from "@/utils/networkConfig";
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
const BALANCE_POLL_INTERVAL = 10_000; // 10 seconds
const BALANCE_POLL_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Onramper API key from environment variable
const ONRAMPER_API_KEY = import.meta.env.VITE_ONRAMPER_API_KEY || "";

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
const ONRAMPER_BASE_URL = `https://${ONRAMPER_DOMAIN}?apiKey=${ONRAMPER_API_KEY}&mode=buy&defaultCrypto=strk_starknet&onlyCryptoNetworks=starknet&themeName=dark&containerColor=0f1f0f&primaryColor=d0c98d&secondaryColor=1a2f1a&cardColor=182818&primaryTextColor=ffffff&secondaryTextColor=FFD700&borderRadius=0.5&wgBorderRadius=1&redirectAtCheckout=true&hideTopBar=true`;

// Build Onramper URL with wallet address and pre-filled fiat amount
const buildOnramperUrl = (walletAddress: string, totalUsd: number | null) => {
  let url = `${ONRAMPER_BASE_URL}&networkWallets=starknet:${walletAddress}`;

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

// Fiat tab — Onramper iframe with automatic STRK detection + auto-mint
const FiatTabContent = memo(({
  walletAddress,
  totalFiatUsd,
  minFiatGames,
  strkPerGame,
  isMinting,
}: {
  walletAddress: string;
  totalFiatUsd: number | null;
  minFiatGames: number;
  strkPerGame: number | null;
  isMinting: boolean;
}) => {
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {/* Minting overlay */}
      {isMinting && (
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
      )}
      {/* Info banner */}
      <Box sx={{
        mx: 2, mt: 1.5, mb: 1, px: 2, py: 1.5,
        background: "rgba(208, 201, 141, 0.08)",
        border: "1px solid rgba(208, 201, 141, 0.2)",
        borderRadius: 1, textAlign: "center",
      }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#d0c98d", letterSpacing: 0.5 }}>
          ~${totalFiatUsd ? Math.ceil(totalFiatUsd * 1.03) : "..."} = {minFiatGames} game{minFiatGames > 1 ? "s" : ""}
        </Typography>
        {strkPerGame && (
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)", mt: 0.5 }}>
            1 game = {strkPerGame.toFixed(1)} STRK — buy more to get extra games
          </Typography>
        )}
      </Box>
      <iframe
        src={buildOnramperUrl(walletAddress, totalFiatUsd)}
        title="Onramper Widget"
        height="560px"
        width="100%"
        style={{ border: "none" }}
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
  const dungeon = useDungeon();

  const routerContract = useMemo(
    () =>
      new Contract({
        abi: ROUTER_ABI,
        address: NETWORKS.SN_MAIN.ekuboRouter,
        providerOrAccount: provider,
      }),
    [provider]
  );

  // --- Derived data ---

  const paymentTokens = useMemo(() => NETWORKS.SN_MAIN.paymentTokens || [], []);

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

  // Refs for polling cleanup and auto-mint tracking
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialTabSet = useRef(false);
  const initialStrkBalance = useRef<number | null>(null);
  const autoMintTriggered = useRef(false);

  // --- Initialize view on open ---

  useEffect(() => {
    if (!open) {
      // Reset state on close
      setSpecialView(null);
      setIsMinting(false);
      initialTabSet.current = false;
      initialStrkBalance.current = null;
      autoMintTriggered.current = false;
      stopPolling();
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
      const usdcToken = NETWORKS.SN_MAIN.paymentTokens.find((t: any) => t.name === "USDC");
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
      const strkToken = NETWORKS.SN_MAIN.paymentTokens.find((t: any) => t.name === "STRK");
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

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  // Start polling automatically when fiat tab is shown
  useEffect(() => {
    if (activeTab === "fiat" && specialView === null && open && !isMinting) {
      // Record initial STRK balance
      if (initialStrkBalance.current === null) {
        initialStrkBalance.current = strkBalance;
      }

      pollIntervalRef.current = setInterval(() => {
        refreshTokenBalances();
      }, BALANCE_POLL_INTERVAL);

      pollTimeoutRef.current = setTimeout(() => {
        stopPolling();
      }, BALANCE_POLL_TIMEOUT);

      return () => stopPolling();
    } else {
      stopPolling();
    }
  }, [activeTab, specialView, open, isMinting]);

  // Auto-trigger mint when STRK balance increases enough
  useEffect(() => {
    if (
      activeTab === "fiat" &&
      !isMinting &&
      !autoMintTriggered.current &&
      initialStrkBalance.current !== null &&
      strkQuoteForGames !== null &&
      strkBalance > initialStrkBalance.current &&
      (strkBalance - initialStrkBalance.current) >= strkQuoteForGames * 0.9 // 90% threshold for slippage
    ) {
      autoMintTriggered.current = true;
      swapStrkAndMint();
    }
  }, [strkBalance, activeTab, isMinting, strkQuoteForGames]);

  // --- Actions ---

  const useGoldenToken = () => {
    enterDungeon(
      {
        paymentType: "Golden Pass",
        goldenPass: {
          address: NETWORKS.SN_MAIN.goldenToken,
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
    if (!selectedTokenData) return;

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

  const swapStrkAndMint = async () => {
    if (!dungeon.ticketAddress) return;
    const strkToken = NETWORKS.SN_MAIN.paymentTokens.find((t: any) => t.name === "STRK");
    if (!strkToken) return;

    setIsMinting(true);
    stopPolling();
    try {
      const quote = await getSwapQuote(
        -minFiatGames * 1e18,
        dungeon.ticketAddress,
        strkToken.address
      );

      const tokenSwapData = {
        tokenAddress: dungeon.ticketAddress!,
        minimumAmount: minFiatGames,
        quote: quote,
      };
      const calls = generateSwapCalls(routerContract, strkToken.address, tokenSwapData);
      purchaseGames(calls, minFiatGames, () => {
        setIsMinting(false);
        onClose();
      });
    } catch (error) {
      console.error("Error swapping STRK:", error);
      setIsMinting(false);
      autoMintTriggered.current = false; // Allow retry
    }
  };

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
    maxHeight: "90dvh",
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
