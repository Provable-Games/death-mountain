import { ClauseBuilder, ToriiQueryBuilder } from "@dojoengine/sdk";
import { hexToAscii } from "@dojoengine/utils";
import { addAddressPadding } from "starknet";
import { useDojoConfig } from "@/contexts/starknet";

import { useGameStore } from "@/stores/gameStore";
import { useEntityModel } from "@/types/game";
import { getShortNamespace } from "@/utils/utils";
import { getContractByName } from "@dojoengine/core";
import { gql, request } from "graphql-request";
import { GameTokenData } from "metagame-sdk";

export const useGameTokens = () => {
  const dojoConfig = useDojoConfig();
  const { getEntityModel } = useEntityModel();

  const namespace = dojoConfig.namespace;
  const GAME_TOKEN_ADDRESS = getContractByName(
    dojoConfig.manifest,
    namespace,
    "game_token_systems"
  )?.address;
  const NS_SHORT = getShortNamespace(namespace);

  const fetchGameTokenIds = async (address: string) => {
    let url = `${dojoConfig.toriiUrl}/sql?query=
      SELECT token_id FROM token_balances
      WHERE account_address = "${address.replace(
        /^0x0+/,
        "0x"
      )}" AND contract_address = "${GAME_TOKEN_ADDRESS}"
      LIMIT 10000`;

    const sql = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    let data = await sql.json();
    return data.map((token: any) => parseInt(token.token_id.split(":")[1], 16));
  };

  const fetchMetadata = async (gameTokens: any, tokenId: number) => {
    const gameToken = gameTokens?.find(
      (token: any) => token.token_id === tokenId
    );
    // console.log(gameToken, gameTokens, tokenId);

    if (gameToken) {
      useGameStore.getState().setMetadata({
        player_name: gameToken.player_name,
        settings_id: gameToken.settings_id,
        minted_by: gameToken.minted_by_address,
        expires_at: parseInt(gameToken.lifecycle.end || 0, 16) * 1000,
        available_at: parseInt(gameToken.lifecycle.start || 0, 16) * 1000,
      });
      return;
    }
  };

  const fetchGameTokensData = async (tokenIds: string[]) => {
    tokenIds = tokenIds.map((tokenId) => `"${tokenId.toString()}"`);

    const document = gql`
    {
      ${NS_SHORT}TokenMetadataModels (limit:10000, where:{
        token_idIN:[${tokenIds}]}
      ){
        edges {
          node {
            token_id
            player_name
            settings_id
            minted_by
            lifecycle {
              start {
                Some
              }
              end {
                Some
              }
            }
          }
        }
      }

      ${NS_SHORT}GameEventModels (limit:10000, where:{
        adventurer_idIN:[${tokenIds}]}
      ){
        edges {
          node {
            adventurer_id
            details {
              option
              adventurer {
                health
                xp
                gold
                equipment {
                  weapon {
                    id
                  }
                  chest {
                    id
                  }
                  head {
                    id
                  }
                  waist {
                    id
                  }
                  foot {
                    id
                  }
                  hand {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }`;

    try {
      const res: any = await request(
        dojoConfig.toriiUrl + "/graphql",
        document
      );
      let tokenMetadata =
        res?.[`${NS_SHORT}TokenMetadataModels`]?.edges.map(
          (edge: any) => edge.node
        ) ?? [];
      let gameEvents =
        res?.[`${NS_SHORT}GameEventModels`]?.edges.map(
          (edge: any) => edge.node
        ) ?? [];

      let games = tokenMetadata.map((metaData: any) => {
        let adventurerData = gameEvents.find(
          (event: any) => event.adventurer_id === metaData.token_id
        );
        let adventurer = adventurerData?.details?.adventurer || {};

        let tokenId = parseInt(metaData.token_id, 16);
        let expires_at = parseInt(metaData.lifecycle.end.Some || 0, 16) * 1000;
        let available_at =
          parseInt(metaData.lifecycle.start.Some || 0, 16) * 1000;

        return {
          ...adventurer,
          adventurer_id: tokenId,
          player_name: hexToAscii(metaData.player_name),
          settings_id: metaData.settings_id,
          minted_by: metaData.minted_by,
          expires_at,
          available_at,
          expired: expires_at !== 0 && expires_at < Date.now(),
          dead: adventurer.xp !== 0 && adventurer.health === 0,
        };
      });

      return games;
    } catch (ex) {
      return [];
    }
  };

  const fetchAdventurerData = async (gamesData: GameTokenData[]) => {
    const formattedTokenIds = gamesData.map(
      (game) => `"${addAddressPadding(game.token_id.toString(16))}"`
    );
    const document = gql`
      {
        ${NS_SHORT}GameEventModels (limit:10000, where:{
          adventurer_idIN:[${formattedTokenIds}]}
        ){
          edges {
            node {
              adventurer_id
              details {
                option
                adventurer {
                  health
                  xp
                  gold
                  equipment {
                    weapon {
                      id
                    }
                    chest {
                      id
                    }
                    head {
                      id
                    }
                    waist {
                      id
                    }
                    foot {
                      id
                    }
                    hand {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }`;

    try {
      const res: any = await request(
        dojoConfig.toriiUrl + "/graphql",
        document
      );
      let gameEvents =
        res?.[`${NS_SHORT}GameEventModels`]?.edges.map(
          (edge: any) => edge.node
        ) ?? [];

      let games = gamesData.map((game: any) => {
        let adventurerData = gameEvents.find(
          (event: any) =>
            event.adventurer_id ===
            addAddressPadding(game.token_id.toString(16))
        );

        let adventurer = adventurerData?.details?.adventurer || {};

        let tokenId = parseInt(game.token_id, 16);
        let expires_at = parseInt(game.lifecycle.end || 0, 16) * 1000;
        let available_at = parseInt(game.lifecycle.start || 0, 16) * 1000;

        return {
          ...adventurer,
          adventurer_id: tokenId,
          player_name: game.player_name,
          settings_id: game.settings_id,
          minted_by: game.minted_by,
          expires_at,
          available_at,
          expired: expires_at !== 0 && expires_at < Date.now(),
          dead: adventurer.xp !== 0 && adventurer.health === 0,
        };
      });

      return games;
    } catch (ex) {
      return [];
    }
  };

  return {
    fetchGameTokenIds,
    fetchMetadata,
    fetchGameTokensData,
    fetchAdventurerData,
  };
};
