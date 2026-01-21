import { getAvnuQuote } from "@/api/avnu";
import { getPriceChart } from "@/api/ekubo";
import { useStarknetApi } from "@/api/starknet";
import { useGameTokens } from "@/dojo/useGameTokens";
import { useDungeon } from "@/dojo/useDungeon";
import { NETWORKS } from "@/utils/networkConfig";
import { delay } from "@/utils/utils";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

// Placeholder address for price quotes (not used for actual transactions)
const PRICE_QUOTE_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000001";

export interface TierData {
  tier: number;
  collected: number;
  total: number;
  remaining: number;
  tokensPerBeast: number;
  color: string;
}

export interface StatisticsContext {
  gamePrice: string | null;
  gamePriceHistory: any[];
  lordsPrice: string | null;
  strkPrice: string | null;
  survivorTokenPrice: string | null;
  fetchSurvivorTokensLeft: () => Promise<void>;
  fetchGamePrice: () => Promise<void>;
  remainingSurvivorTokens: number | null;
  collectedBeasts: number;
  beastTierData: TierData[];
}

// Create a context
const StatisticsContext = createContext<StatisticsContext>(
  {} as StatisticsContext
);

export const OPENING_TIME = 1758043800;
export const totalSurvivorTokens = 2258100;
export const totalCollectableBeasts = 93225;
export const JACKPOT_AMOUNT = 33333;

// Total beasts per tier (93,225 / 5 = 18,645 per tier, assuming equal distribution)
export const BEASTS_PER_TIER: { [tier: number]: number } = {
  1: 18645,
  2: 18645,
  3: 18645,
  4: 18645,
  5: 18645,
};

// Tokens earned per beast tier
export const TOKENS_PER_TIER: { [tier: number]: number } = {
  1: 14,
  2: 12,
  3: 10,
  4: 8,
  5: 6,
};

// Tier colors (Loot Survivor color scheme)
export const TIER_COLORS: { [tier: number]: string } = {
  1: "#FFD700", // Gold for T1 (Best)
  2: "#9370DB", // Purple for T2
  3: "#4169E1", // Royal Blue for T3
  4: "#32CD32", // Lime Green for T4
  5: "#A9A9A9", // Dark Gray for T5 (Common)
};

const STRK = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "STRK"
)?.address!;
const USDC = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "USDC"
)?.address!;
const LORDS = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "LORDS"
)?.address!;
const SURVIVOR = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "SURVIVOR"
)?.address!;

// Create a provider component
export const StatisticsProvider = ({ children }: PropsWithChildren) => {
  const dungeon = useDungeon();
  const { getSurvivorTokensLeft } = useStarknetApi();
  const { countBeasts, countBeastsByTier } = useGameTokens();

  const [gamePrice, setGamePrice] = useState<string | null>(null);
  const [lordsPrice, setLordsPrice] = useState<string | null>(null);
  const [gamePriceHistory, setGamePriceHistory] = useState<any[]>([]);

  const [remainingSurvivorTokens, setRemainingSurvivorTokens] = useState<
    number | null
  >(null);
  const [collectedBeasts, setCollectedBeasts] = useState(0);
  const [strkPrice, setStrkPrice] = useState<string | null>(null);
  const [survivorTokenPrice, setSurvivorTokenPrice] = useState<string | null>(null);
  const [beastTierData, setBeastTierData] = useState<TierData[]>([]);

  const fetchCollectedBeasts = async () => {
    const result = await countBeasts();
    setCollectedBeasts(result - 1);
  };

  const fetchBeastsByTier = async () => {
    const tierCounts = await countBeastsByTier();
    
    const tierData: TierData[] = [1, 2, 3, 4, 5].map(tier => ({
      tier,
      collected: tierCounts[tier] || 0,
      total: BEASTS_PER_TIER[tier],
      remaining: Math.max(0, BEASTS_PER_TIER[tier] - (tierCounts[tier] || 0)),
      tokensPerBeast: TOKENS_PER_TIER[tier],
      color: TIER_COLORS[tier],
    }));
    
    setBeastTierData(tierData);
  };

  const fetchPriceHistory = async () => {
    await delay(2000);
    const priceChart = await getPriceChart(dungeon.ticketAddress!, LORDS);
    setGamePriceHistory(priceChart.data);
  };

  const fetchGameLordsPrice = async () => {
    await delay(2000);
    try {
      const quoteResult = await getAvnuQuote(
        1n * 10n ** 18n, // Sell 1 ticket
        dungeon.ticketAddress!, // sellToken = ticket
        LORDS, // buyToken = LORDS
        PRICE_QUOTE_ADDRESS
      );
      setLordsPrice((Number(quoteResult.buyAmount) / 1e18).toFixed(2));
    } catch (e) {
      console.error("Failed to fetch LORDS price", e);
    }
  };

  const fetchGamePrice = async () => {
    try {
      const quoteResult = await getAvnuQuote(
        1n * 10n ** 18n, // Sell 1 ticket
        dungeon.ticketAddress!, // sellToken = ticket
        USDC, // buyToken = USDC
        PRICE_QUOTE_ADDRESS
      );
      setGamePrice((Number(quoteResult.buyAmount) / 1e6).toFixed(2));
    } catch (e) {
      console.error("Failed to fetch game price", e);
    }
  };

  const fetchStrkPrice = async () => {
    await delay(3000);
    try {
      // Get quote for selling 100 STRK to USDC (includes 3% integrator fee)
      const quoteResult = await getAvnuQuote(
        100n * 10n ** 18n, // Sell 100 STRK
        STRK,
        USDC,
        PRICE_QUOTE_ADDRESS
      );
      setStrkPrice((Number(quoteResult.buyAmount) / 1e6 / 100).toFixed(2));
    } catch (e) {
      console.error("Failed to fetch STRK price", e);
    }
  };

  const fetchSurvivorTokenPrice = async () => {
    await delay(4000);
    try {
      // Get quote for selling 100 SURVIVOR to USDC (includes 3% integrator fee)
      const quoteResult = await getAvnuQuote(
        100n * 10n ** 18n, // Sell 100 SURVIVOR
        SURVIVOR,
        USDC,
        PRICE_QUOTE_ADDRESS
      );
      setSurvivorTokenPrice((Number(quoteResult.buyAmount) / 1e6 / 100).toFixed(4));
    } catch (e) {
      console.error("Failed to fetch survivor token price", e);
    }
  };

  const fetchSurvivorTokensLeft = async () => {
    const result = await getSurvivorTokensLeft();
    setRemainingSurvivorTokens(
      result ? Math.floor(result / 1e18) : null
    );
  };

  useEffect(() => {
    if (dungeon.id === "survivor") {
      fetchGamePrice();
      fetchStrkPrice();
      fetchSurvivorTokenPrice();
      fetchPriceHistory();
      fetchGameLordsPrice();
      fetchSurvivorTokensLeft();
      fetchCollectedBeasts();
      fetchBeastsByTier();
    }
  }, [dungeon]);

  return (
    <StatisticsContext.Provider
      value={{
        gamePrice,
        gamePriceHistory,
        lordsPrice,
        strkPrice,
        survivorTokenPrice,
        fetchSurvivorTokensLeft,
        fetchGamePrice,
        remainingSurvivorTokens,
        collectedBeasts,
        beastTierData,
      }}
    >
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error("useStatistics must be used within a StatisticsProvider");
  }
  return context;
};
