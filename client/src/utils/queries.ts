import { useDojoConfig } from "@/contexts/starknet";
import { GameQueryBuilder } from "@/types/game";
import { ClauseBuilder } from "@dojoengine/sdk";
import { addAddressPadding } from "starknet";

export const useQueries = () => {
  const dojoConfig = useDojoConfig();
  
  const gameEventsQuery = (gameId: number) => {
    return new GameQueryBuilder()
      .withClause(
        new ClauseBuilder().keys(
          [
            `${dojoConfig.namespace}-GameEvent`,
          ],
          [addAddressPadding(`0x${gameId.toString(16)}`)]
        ).build()
      )
      .withEntityModels([
        `${dojoConfig.namespace}-GameEvent`,
      ])
      .withLimit(10000)
  };

  return { gameEventsQuery };
};