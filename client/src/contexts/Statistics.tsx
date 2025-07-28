import { getPriceChart, getSwapQuote } from "@/api/ekubo";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

export interface StatisticsContext {
  gamePrice: string | null;
  gamePriceHistory: any[];
}

// Create a context
const StatisticsContext = createContext<StatisticsContext>({} as StatisticsContext);

const DungeonTicket = '0x0468ce7715f7aea17b1632736877c36371c3b1354eb9611e8bb9035c0563963f'
const STRK = '0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D'
const USDC = '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080'

// Create a provider component
export const StatisticsProvider = ({ children }: PropsWithChildren) => {
  const [gamePrice, setGamePrice] = useState<string | null>(null);
  const [gamePriceHistory, setGamePriceHistory] = useState<any[]>([]);

  const fetchPriceHistory = async () => {
    const strkPrice = await getPriceChart(DungeonTicket, STRK);
    setGamePriceHistory(strkPrice.data);
  }

  const fetchGamePrice = async () => {
    const swap = await getSwapQuote(-1e18, DungeonTicket, USDC);
    setGamePrice((swap.total * -1 / 1e6).toFixed(2));
  }

  useEffect(() => {
    fetchPriceHistory();
    fetchGamePrice();
  }, []);

  return (
    <StatisticsContext.Provider value={{
      gamePrice,
      gamePriceHistory
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

