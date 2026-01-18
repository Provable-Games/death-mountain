import { useDynamicConnector } from "@/contexts/starknet";
import { HistoricalToriiQueryBuilder } from "@dojoengine/sdk";

export const useQueries = () => {
  const { currentNetworkConfig } = useDynamicConnector();

  const gameEventsQuery = (gameId: number) => {
    return new HistoricalToriiQueryBuilder()
      .addEntityModel(`${currentNetworkConfig.namespace}-GameEvent`)
      .withLimit(1)
      .includeHashedKeys();
  };

  return { gameEventsQuery };
};