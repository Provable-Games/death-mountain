import { getPriceChart, getSwapQuote } from "@/api/ekubo";
import { useStarknetApi } from "@/api/starknet";
import { useGameTokens } from "@/dojo/useGameTokens";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

export interface StatisticsContext {
  gamePrice: string | null;
  gamePriceHistory: any[];

  fetchRewardTokensClaimed: () => Promise<void>;
  remainingSurvivorTokens: number | null;
  collectedBeasts: number;
}

// Create a context
const StatisticsContext = createContext<StatisticsContext>({} as StatisticsContext);

export const OPENING_TIME = 1757410824;
export const totalSurvivorTokens = 2000000;
export const totalCollectableBeasts = 93150;

const DungeonTicket = '0x0468ce7715f7aea17b1632736877c36371c3b1354eb9611e8bb9035c0563963f'
const STRK = '0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D'
const USDC = '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080'

// Create a provider component
export const StatisticsProvider = ({ children }: PropsWithChildren) => {
  const { getRewardTokensClaimed } = useStarknetApi();
  const { countBeasts } = useGameTokens();

  const [gamePrice, setGamePrice] = useState<string | null>(null);
  const [gamePriceHistory, setGamePriceHistory] = useState<any[]>([]);
  const [remainingSurvivorTokens, setRemainingSurvivorTokens] = useState<number | null>(null);
  const [collectedBeasts, setCollectedBeasts] = useState(0);

  const fetchCollectedBeasts = async () => {
    const result = await countBeasts();
    setCollectedBeasts((result - 75) || 0);
  };

  const fetchPriceHistory = async () => {
    const strkPrice = await getPriceChart(DungeonTicket, STRK);
    setGamePriceHistory(strkPrice.data);
  }

  const fetchGamePrice = async () => {
    const swap = await getSwapQuote(-1e18, DungeonTicket, USDC);
    setGamePrice((swap.total * -1 / 1e6).toFixed(2));
  }

  const fetchRewardTokensClaimed = async () => {
    const result = await getRewardTokensClaimed();
    setRemainingSurvivorTokens(result ? totalSurvivorTokens - result : null);
  };

  useEffect(() => {
    fetchPriceHistory();
    fetchGamePrice();
    fetchRewardTokensClaimed();
    fetchCollectedBeasts();
  }, []);

  return (
    <StatisticsContext.Provider value={{
      gamePrice,
      gamePriceHistory,
      fetchRewardTokensClaimed,
      remainingSurvivorTokens,
      collectedBeasts,
    }}>
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
};

