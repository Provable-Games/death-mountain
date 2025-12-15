import { getPriceChart, getSwapQuote } from "@/api/ekubo";
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

export interface StatisticsContext {
  gamePrice: string | null;
  gamePriceHistory: any[];
  lordsPrice: string | null;
  strkPrice: string | null;
  fetchSurvivorTokensLeft: () => Promise<void>;
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

const STRK = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "STRK"
)?.address!;
const USDC = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "USDC"
)?.address!;
const LORDS = NETWORKS.SN_MAIN.paymentTokens.find(
  (token) => token.name === "LORDS"
)?.address!;

// Create a provider component
export const StatisticsProvider = ({ children }: PropsWithChildren) => {
  const dungeon = useDungeon();
  const { getSurvivorTokensLeft } = useStarknetApi();
  const { countBeasts } = useGameTokens();

  const [gamePrice, setGamePrice] = useState<string | null>(null);
  const [lordsPrice, setLordsPrice] = useState<string | null>(null);
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
    await delay(2000);
    const priceChart = await getPriceChart(dungeon.ticketAddress!, LORDS);
    setGamePriceHistory(priceChart.data);
  };

  const fetchGameLordsPrice = async () => {
    await delay(2000);
    const lordsPrice = await getSwapQuote(-1e18, dungeon.ticketAddress!, LORDS);
    setLordsPrice(((lordsPrice.total * -1) / 1e18).toFixed(2));
  };

  const fetchGamePrice = async () => {
    const swap = await getSwapQuote(-1e18, dungeon.ticketAddress!, USDC);
    setGamePrice(((swap.total * -1) / 1e6).toFixed(2));
  };

  const fetchStrkPrice = async () => {
    await delay(3000)
    const swap = await getSwapQuote(100e18, STRK, USDC);
    setStrkPrice((swap.total / 1e6 / 100).toFixed(2));
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
      fetchPriceHistory();
      fetchGameLordsPrice();
      fetchSurvivorTokensLeft();
      fetchCollectedBeasts();
    }
  }, [dungeon]);

  return (
    <StatisticsContext.Provider
      value={{
        gamePrice,
        gamePriceHistory,
        lordsPrice,
        strkPrice,
        fetchSurvivorTokensLeft,
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
