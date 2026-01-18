import { useDynamicConnector } from "@/contexts/starknet";
import { addAddressPadding } from "starknet";

import { NETWORKS } from "@/utils/networkConfig";
import { getShortNamespace } from "@/utils/utils";
import { gql, request } from "graphql-request";
import { GameTokenData } from "metagame-sdk";
import { Beast } from "@/types/game";
import { lookupAddressName } from "@/utils/addressNameCache";
import { hexToAscii } from "@dojoengine/utils";

export const useGameTokens = () => {
  const { currentNetworkConfig } = useDynamicConnector();

  const namespace = currentNetworkConfig.namespace;
  const NS_SHORT = getShortNamespace(namespace);
  const SQL_ENDPOINT = NETWORKS.SN_MAIN.torii;

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
          game_id: game.game_id,
          player_name: game.player_name,
          settings_id: game.settings_id,
          minted_by: game.minted_by,
          game_over: game.game_over,
          lifecycle: game.lifecycle,
          score: game.score,
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
      WHERE account_address = "${addAddressPadding(accountAddress)}" AND contract_address = "${addAddressPadding(tokenAddress)}"
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
    let beast_address = NETWORKS.SN_MAIN.beasts;
    let url = `${SQL_ENDPOINT}/sql?query=
      SELECT COUNT(*) as count FROM tokens
      WHERE contract_address = "${addAddressPadding(beast_address)}"`

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

  // Helper to determine tier from beast ID
  const getTierFromBeastId = (id: number): number => {
    // T1: IDs 1-5, 26-30, 51-55
    if ((id >= 1 && id <= 5) || (id >= 26 && id <= 30) || (id >= 51 && id <= 55)) return 1;
    // T2: IDs 6-10, 31-35, 56-60
    if ((id >= 6 && id <= 10) || (id >= 31 && id <= 35) || (id >= 56 && id <= 60)) return 2;
    // T3: IDs 11-15, 36-40, 61-65
    if ((id >= 11 && id <= 15) || (id >= 36 && id <= 40) || (id >= 61 && id <= 65)) return 3;
    // T4: IDs 16-20, 41-45, 66-70
    if ((id >= 16 && id <= 20) || (id >= 41 && id <= 45) || (id >= 66 && id <= 70)) return 4;
    // T5: IDs 21-25, 46-50, 71-75
    return 5;
  };

  const countBeastsByTier = async (): Promise<{ [tier: number]: number }> => {
    // Simple query without JOIN - 'Beast ID' trait only exists for beast tokens
    let url = `${SQL_ENDPOINT}/sql?query=
      SELECT trait_value as beast_id, COUNT(*) as count
      FROM token_attributes
      WHERE trait_name = 'Beast ID'
      GROUP BY trait_value`

    try {
      const sql = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })

      let data = await sql.json()
      
      // Aggregate counts by tier in JS
      const tierCounts: { [tier: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      for (const row of data) {
        const beastId = parseInt(row.beast_id);
        // Only count valid beast IDs (1-75)
        if (beastId >= 1 && beastId <= 75) {
          const tier = getTierFromBeastId(beastId);
          tierCounts[tier] += parseInt(row.count);
        }
      }
      
      return tierCounts;
    } catch (error) {
      console.error("Error counting beasts by tier:", error);
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
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

  const getBeastOwner = async (beast: Beast) => {
    try {
      let url = `${SQL_ENDPOINT}/sql?query=
      SELECT
        tb.token_id,
        tb.account_address AS owner_address
      FROM token_attributes a_beast
      JOIN token_attributes a_prefix
        ON a_prefix.token_id = a_beast.token_id
      JOIN token_attributes a_suffix
        ON a_suffix.token_id = a_beast.token_id
      JOIN token_balances tb
        ON tb.token_id = a_beast.token_id
      WHERE a_beast.trait_name = 'Beast ID'
        AND a_beast.trait_value = '${beast.id}'
        AND a_prefix.trait_name = 'Prefix'
        AND a_prefix.trait_value = '${beast.specialPrefix}'
        AND a_suffix.trait_name = 'Suffix'
        AND a_suffix.trait_value = '${beast.specialSuffix}'
        AND tb.contract_address = '${currentNetworkConfig.beasts}'
        AND tb.balance = '0x0000000000000000000000000000000000000000000000000000000000000001'
      LIMIT 1;
    `

      let sql = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })

      let data = await sql.json()

      if (!data || data.length === 0) {
        return null;
      }

      let owner_address = data[0].owner_address
      const name = await lookupAddressName(owner_address)

      if (name) {
        return name
      }

      // Fallback to shortened address: 0x002...549f9
      const shortened = `${owner_address.slice(0, 5)}...${owner_address.slice(-5)}`
      return shortened
    } catch (error) {
      console.error("Error getting beast owner:", error);
      return null;
    }
  }

  const getActivePlayersCount = async () => {
    try {
      let url = `${SQL_ENDPOINT}/sql?query=
        WITH recent AS (
          SELECT executed_at, keys, data
          FROM event_messages_historical INDEXED BY idx_event_messages_historical_executed_at
          WHERE executed_at >= strftime('%Y-%m-%dT%H:%M:%S+00:00', 'now', '-10 minutes')
          ORDER BY executed_at DESC
          LIMIT 5000
        ),
        ranked AS (
          SELECT
            executed_at, keys, data,
            ROW_NUMBER() OVER (PARTITION BY keys ORDER BY executed_at DESC) AS rn
          FROM recent
        )
        SELECT executed_at, keys, data
        FROM ranked
        WHERE rn = 1
        ORDER BY executed_at DESC;
      `

      const sql = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })

      let rows = await sql.json()
      // Parse the JSON string in the data field for each row
      return rows.map((row: any) => {
        try {
          return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        } catch {
          return row.data;
        }
      });
    } catch (error) {
      console.error("Error getting active players:", error);
      return null;
    }
  }

  const getPlayerNames = async (adventurerIds: number[]): Promise<Record<string, string>> => {
    if (adventurerIds.length === 0) return {};

    let url = `${SQL_ENDPOINT}/sql?query=
      SELECT id, player_name
      FROM "relayer_0_0_1-TokenPlayerNameUpdate"
      WHERE id IN (${adventurerIds.map((id) => `"0x${id.toString(16).padStart(16, '0')}"`).join(',')});
    `

    try {
      let sql = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })

      let data = await sql.json()
      // Return a map of id (hex string) -> player_name (converted from hex to ASCII)
      const namesMap: Record<string, string> = {};
      data.forEach((row: any) => {
        if (row.id && row.player_name) {
          namesMap[row.id] = hexToAscii(row.player_name);
        }
      });
      return namesMap;
    } catch (error) {
      console.error("Error getting player names:", error);
      return {};
    }
  }

  return {
    fetchAdventurerData,
    getGameTokens,
    countBeasts,
    countBeastsByTier,
    getBeastTokenId,
    getBeastOwner,
    getActivePlayersCount,
    getPlayerNames
  };
};
