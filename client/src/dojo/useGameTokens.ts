import { useDynamicConnector } from "@/contexts/starknet";
import { addAddressPadding } from "starknet";

import { NETWORKS } from "@/utils/networkConfig";
import { getShortNamespace } from "@/utils/utils";
import { gql, request } from "graphql-request";
import { GameTokenData } from "metagame-sdk";
import { Beast } from "@/types/game";

export const useGameTokens = () => {
  const { currentNetworkConfig } = useDynamicConnector();

  const namespace = currentNetworkConfig.namespace;
  const NS_SHORT = getShortNamespace(namespace);
  const SQL_ENDPOINT = NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS].torii;

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
        currentNetworkConfig.toriiUrl + "/graphql",
        document
      );
      let gameEvents =
        res?.[`${NS_SHORT}GameEventModels`]?.edges.map(
          (edge: any) => edge.node
        ) ?? [];

      let games = gamesData.map((game: any) => {
        let adventurerData = gameEvents.find(
          (event: any) =>
            parseInt(event.adventurer_id, 16) === game.token_id
        );

        let adventurer = adventurerData?.details?.adventurer || {};
        let tokenId = game.token_id;
        let expires_at = (game.lifecycle.end || 0) * 1000;
        let available_at = (game.lifecycle.start || 0) * 1000;

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

  const getGameTokens = async (accountAddress: string, tokenAddress: string) => {
    let url = `${SQL_ENDPOINT}/sql?query=
      SELECT token_id FROM token_balances
      WHERE account_address = "${accountAddress.replace(/^0x0+/, "0x")}" AND contract_address = "${tokenAddress.replace(/^0x0+/, "0x")}"
      LIMIT 10000`

    const sql = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    let data = await sql.json()
    return data.map((token: any) => parseInt(token.token_id.split(":")[1], 16))
  }

  const countBeasts = async () => {
    let beast_address = NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS].beasts;
    let url = `${SQL_ENDPOINT}/sql?query=
      SELECT COUNT(*) as count FROM tokens
      WHERE contract_address = "${beast_address.replace(/^0x0+/, "0x")}"`

    try {
      const sql = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })

      let data = await sql.json()
      return data[0].count
    } catch (error) {
      console.error("Error counting beasts:", error);
      return 0;
    }
  }

  const getBeastTokenId = async (beast: Beast) => {
    let url = `${SQL_ENDPOINT}/sql?query=
      SELECT token_id
      FROM token_attributes
      WHERE trait_name = 'Beast ID' AND trait_value = ${beast.id}
      INTERSECT
      SELECT token_id
      FROM token_attributes
      WHERE trait_name = 'Prefix' AND trait_value = "${beast.specialPrefix}"
      INTERSECT
      SELECT token_id
      FROM token_attributes
      WHERE trait_name = 'Suffix' AND trait_value = "${beast.specialSuffix}"
      LIMIT 1;
    `

    try {
      let sql = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })

      let data = await sql.json()
      return parseInt(data[0].token_id.split(":")[1], 16)
    } catch (error) {
      console.error("Error getting beast token id:", error);
      return null;
    }
  }

  return {
    fetchAdventurerData,
    getGameTokens,
    countBeasts,
    getBeastTokenId
  };
};
