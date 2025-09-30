import { getPriceChart, getSwapQuote } from "@/api/ekubo";
import { useStarknetApi } from "@/api/starknet";
import { useGameTokens } from "@/dojo/useGameTokens";
import { NETWORKS } from "@/utils/networkConfig";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

export interface StatisticsContext {
  gamePrice: string | null;
  gamePriceHistory: any[];
  strkPrice: string | null;
  fetchRewardTokensClaimed: () => Promise<void>;
  fetchGamePrice: () => Promise<void>;
  remainingSurvivorTokens: number | null;
  collectedBeasts: number;
}

// Create a context
const StatisticsContext = createContext<StatisticsContext>(
  {} as StatisticsContext
);

export const OPENING_TIME = 1758043800;
export const totalSurvivorTokens = 2258100;
export const totalCollectableBeasts = 93225;
export const JACKPOT_AMOUNT = 33333;

const DungeonTicket = NETWORKS.SN_MAIN.dungeonTicket;
const STRK = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "STRK"
)?.address!;
const USDC = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "USDC"
)?.address!;

// Create a provider component
export const StatisticsProvider = ({ children }: PropsWithChildren) => {
  const { getRewardTokensClaimed } = useStarknetApi();
  const { countBeasts } = useGameTokens();

  const [gamePrice, setGamePrice] = useState<string | null>(null);
  const [gamePriceHistory, setGamePriceHistory] = useState<any[]>([]);
  const [remainingSurvivorTokens, setRemainingSurvivorTokens] = useState<
    number | null
  >(null);
  const [collectedBeasts, setCollectedBeasts] = useState(0);
  const [strkPrice, setStrkPrice] = useState<string | null>(null);

  const fetchCollectedBeasts = async () => {
    const result = await countBeasts();
    setCollectedBeasts(result - 1);
  };

  const fetchPriceHistory = async () => {
    const strkPrice = await getPriceChart(DungeonTicket, STRK);
    setGamePriceHistory(strkPrice.data);
  };

  const fetchGamePrice = async () => {
    const swap = await getSwapQuote(-1e18, DungeonTicket, USDC);
    setGamePrice(((swap.total * -1) / 1e6).toFixed(2));
  };

  const fetchStrkPrice = async () => {
    const swap = await getSwapQuote(100e18, STRK, USDC);
    setStrkPrice((swap.total / 1e6 / 100).toFixed(2));
  };

  const fetchRewardTokensClaimed = async () => {
    const result = await getRewardTokensClaimed();
    setRemainingSurvivorTokens(
      result !== null ? totalSurvivorTokens - result : null
    );
  };

  useEffect(() => {
    fetchPriceHistory();
    fetchGamePrice();
    fetchStrkPrice();
    fetchRewardTokensClaimed();
    fetchCollectedBeasts();
  }, []);

  return (
    <StatisticsContext.Provider
      value={{
        gamePrice,
        gamePriceHistory,
        strkPrice,
        fetchRewardTokensClaimed,
        fetchGamePrice,
        remainingSurvivorTokens,
        collectedBeasts,
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
