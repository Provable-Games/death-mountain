import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { Metadata } from "@/types/game";
import { NETWORKS } from "@/utils/networkConfig";
import { decodeHexByteArray, parseBalances } from "@/utils/utils";
import { getContractByName } from "@dojoengine/core";
import { useAccount } from "@starknet-react/core";
import { Account, CallData, ec, hash, num, RpcProvider, stark } from "starknet";

export const useStarknetApi = () => {
  const { currentNetworkConfig } = useDynamicConnector();
  const { address } = useAccount();

  const getTokenBalances = async (tokens: any[]): Promise<Record<string, string>> => {
    const calls = tokens.map((token, i) => ({
      id: i + 1,
      jsonrpc: "2.0",
      method: "starknet_call",
      params: [
        {
          contract_address: token.address,
          entry_point_selector: "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e",
          calldata: [address]
        },
        "pending"
      ]
    }));

    const response = await fetch(NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS].rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(calls),
    });

    const data = await response.json();
    return parseBalances(data || [], tokens);
  }

  const goldenPassReady = async (goldenPassAddress: string, tokenIds: number[]): Promise<number[]> => {
    try {
      const calls = tokenIds.map((tokenId, i) => ({
        id: i + 1,
        jsonrpc: "2.0",
        method: "starknet_call",
        params: [
          {
            contract_address: currentNetworkConfig.dungeon,
            entry_point_selector: "0x02f6ca94ed3ceec9e8b907a11317d8d624f94cf62d9c8112c658fd4d9f02b2d8",
            calldata: [goldenPassAddress, num.toHex(tokenId)]
          },
          "pending"
        ]
      }));

      const response = await fetch(currentNetworkConfig.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calls),
      });

      const data = await response.json();

      // Filter token IDs where the response is true (0x1)
      return tokenIds.filter((_, index) => data[index]?.result?.[0] === "0x1");
    } catch (error) {
      console.error('Error in goldenPassReady:', error);
      return [];
    }
  }

  const getGameState = async (adventurerId: number) => {
    try {
      const response = await fetch(currentNetworkConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [
            {
              contract_address: getContractByName(currentNetworkConfig.manifest, currentNetworkConfig.namespace, "game_systems")?.address,
              entry_point_selector: "0x2305fda54e31f8525bf15eaf4f22b11a7d1d2a03f1b4d0602b9ead3c29533e",
              calldata: [num.toHex(adventurerId)],
            },
            "pending",
          ],
          id: 0,
        }),
      });

      const data = await response.json();
      if (!data?.result || data?.result.length < 10) return null;

      let gameState = {
        adventurer: {
          health: parseInt(data?.result[0], 16),
          xp: parseInt(data?.result[1], 16),
          gold: parseInt(data?.result[2], 16),
          beast_health: parseInt(data?.result[3], 16),
          stat_upgrades_available: parseInt(data?.result[4], 16),
          stats: {
            strength: parseInt(data?.result[5], 16),
            dexterity: parseInt(data?.result[6], 16),
            vitality: parseInt(data?.result[7], 16),
            intelligence: parseInt(data?.result[8], 16),
            wisdom: parseInt(data?.result[9], 16),
            charisma: parseInt(data?.result[10], 16),
            luck: parseInt(data?.result[11], 16),
          },
          equipment: {
            weapon: {
              id: parseInt(data?.result[12], 16),
              xp: parseInt(data?.result[13], 16),
            },
            chest: {
              id: parseInt(data?.result[14], 16),
              xp: parseInt(data?.result[15], 16),
            },
            head: {
              id: parseInt(data?.result[16], 16),
              xp: parseInt(data?.result[17], 16),
            },
            waist: {
              id: parseInt(data?.result[18], 16),
              xp: parseInt(data?.result[19], 16),
            },
            foot: {
              id: parseInt(data?.result[20], 16),
              xp: parseInt(data?.result[21], 16),
            },
            hand: {
              id: parseInt(data?.result[22], 16),
              xp: parseInt(data?.result[23], 16),
            },
            neck: {
              id: parseInt(data?.result[24], 16),
              xp: parseInt(data?.result[25], 16),
            },
            ring: {
              id: parseInt(data?.result[26], 16),
              xp: parseInt(data?.result[27], 16),
            },
          },
          item_specials_seed: parseInt(data?.result[28], 16),
          action_count: parseInt(data?.result[29], 16),
        },
        bag: {
          item_1: {
            id: parseInt(data?.result[30], 16),
            xp: parseInt(data?.result[31], 16),
          },
          item_2: {
            id: parseInt(data?.result[32], 16),
            xp: parseInt(data?.result[33], 16),
          },
          item_3: {
            id: parseInt(data?.result[34], 16),
            xp: parseInt(data?.result[35], 16),
          },
          item_4: {
            id: parseInt(data?.result[36], 16),
            xp: parseInt(data?.result[37], 16),
          },
          item_5: {
            id: parseInt(data?.result[38], 16),
            xp: parseInt(data?.result[39], 16),
          },
          item_6: {
            id: parseInt(data?.result[40], 16),
            xp: parseInt(data?.result[41], 16),
          },
          item_7: {
            id: parseInt(data?.result[42], 16),
            xp: parseInt(data?.result[43], 16),
          },
          item_8: {
            id: parseInt(data?.result[44], 16),
            xp: parseInt(data?.result[45], 16),
          },
          item_9: {
            id: parseInt(data?.result[46], 16),
            xp: parseInt(data?.result[47], 16),
          },
          item_10: {
            id: parseInt(data?.result[48], 16),
            xp: parseInt(data?.result[49], 16),
          },
          item_11: {
            id: parseInt(data?.result[50], 16),
            xp: parseInt(data?.result[51], 16),
          },
          item_12: {
            id: parseInt(data?.result[52], 16),
            xp: parseInt(data?.result[53], 16),
          },
          item_13: {
            id: parseInt(data?.result[54], 16),
            xp: parseInt(data?.result[55], 16),
          },
          item_14: {
            id: parseInt(data?.result[56], 16),
            xp: parseInt(data?.result[57], 16),
          },
          item_15: {
            id: parseInt(data?.result[58], 16),
            xp: parseInt(data?.result[59], 16),
          },
          mutated: parseInt(data?.result[60], 16) === 1,
        },
        beast: {
          id: parseInt(data?.result[61], 16),
          seed: parseInt(data?.result[62], 16),
          health: parseInt(data?.result[63], 16),
          level: parseInt(data?.result[64], 16),
          specials: {
            special1: parseInt(data?.result[65], 16),
            special2: parseInt(data?.result[66], 16),
            special3: parseInt(data?.result[67], 16),
          },
          is_collectable: parseInt(data?.result[68], 16) === 1,
        },
        market: data?.result.slice(70).map((item: any) => parseInt(item, 16)),
      }

      return gameState;
    } catch (error) {
      console.log('error', error)
    }

    return null;
  };

  const getBeastTokenURI = async (beastId: number): Promise<string | null> => {
    try {
      const response = await fetch(currentNetworkConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [
            {
              contract_address: currentNetworkConfig.beasts,
              entry_point_selector: "0x226ad7e84c1fe08eb4c525ed93cccadf9517670341304571e66f7c4f95cbe54",
              calldata: [num.toHex(beastId), "0x0"],
            },
            "pending",
          ],
          id: 0,
        }),
      });

      const data = await response.json();

      if (data?.result && Array.isArray(data.result)) {
        const decodedString = decodeHexByteArray(data.result);
        return decodedString;
      }

      return data?.result;
    } catch (error) {
      console.log('error', error)
    }

    return null;
  };

  const getSettingsDetails = async (settingsId: number) => {
    try {
      const response = await fetch(currentNetworkConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [
            {
              contract_address: getContractByName(currentNetworkConfig.manifest, currentNetworkConfig.namespace, "settings_systems")?.address,
              entry_point_selector: "0x212a142d787b7ccdf7549cce575f25c05823490271d294b08eceda21119475",
              calldata: [num.toHex(settingsId)],
            },
            "pending",
          ],
          id: 0,
        }),
      });

      const data = await response.json();
      if (!data?.result) return null;

      let settings: any = {
        adventurer: {
          health: parseInt(data.result[2]),
          xp: parseInt(data.result[3]),
        },
        game_seed: parseInt(data.result[63]),
        game_seed_until_xp: parseInt(data.result[64]),
        in_battle: parseInt(data.result[65]),
        stats_mode: parseInt(data.result[66]) === 0 ? "Dodge" : "Reduction",
        base_damage_reduction: parseInt(data.result[67]),
        market_size: parseInt(data.result[68]),
      }

      return settings;
    } catch (error) {
      console.log('error', error)
    }

    return null;
  }

  const getTokenMetadata = async (tokenId: number) => {
    try {
      const response = await fetch(currentNetworkConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [
            {
              contract_address: currentNetworkConfig.denshokan,
              entry_point_selector: "0x20d82cc6889093dce20d92fc9daeda4498c9b99ae798fc2a6f4757e38fb1729",
              calldata: [num.toHex(tokenId)],
            },
            "pending",
          ],
          id: 0,
        }),
      });

      const data = await response.json();
      if (!data?.result) return null;

      let tokenMetadata: Metadata = {
        player_name: '',
        settings_id: parseInt(data.result[2]),
        expires_at: parseInt(data.result[3], 16) * 1000,
        available_at: parseInt(data.result[4], 16) * 1000,
        minted_by: data.result[5],
      }

      return tokenMetadata;
    } catch (error) {
      console.log('error', error)
    }

    return null;
  }

  const createBurnerAccount = async (rpcProvider: RpcProvider) => {
    const privateKey = stark.randomAddress();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    const accountClassHash = "0x07dc7899aa655b0aae51eadff6d801a58e97dd99cf4666ee59e704249e51adf2"
    // Calculate future address of the account
    const constructorCalldata = CallData.compile({ publicKey });
    const contractAddress = hash.calculateContractAddressFromHash(
      publicKey,
      accountClassHash,
      constructorCalldata,
      0
    );

    const account = new Account(rpcProvider, contractAddress, privateKey);
    const { transaction_hash } = await account.deployAccount({
      classHash: accountClassHash,
      constructorCalldata: constructorCalldata,
      addressSalt: publicKey,
    }, {
      maxFee: num.toHex(0),
    });

    const receipt = await account.waitForTransaction(transaction_hash, { retryInterval: 100 });

    if (receipt) {
      localStorage.setItem('burner', JSON.stringify({ address: contractAddress, privateKey }))
      localStorage.setItem('burner_version', "5")
      return account
    }
  };

  return { getGameState, getBeastTokenURI, createBurnerAccount, getTokenBalances, goldenPassReady, getSettingsDetails, getTokenMetadata };
};
