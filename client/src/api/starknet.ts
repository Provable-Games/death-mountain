import { useDojoConfig } from "@/contexts/starknet";
import { Adventurer } from "@/types/game";
import { decodeHexByteArray, parseBalances } from "@/utils/utils";
import { getContractByName } from "@dojoengine/core";
import { useAccount } from "@starknet-react/core";
import { Account, CallData, ec, hash, num, RpcProvider, stark } from "starknet";

export const useStarknetApi = () => {
  const dojoConfig = useDojoConfig();
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

    const response = await fetch(dojoConfig.rpcUrl, {
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
            contract_address: import.meta.env.VITE_PUBLIC_DUNGEON_ADDRESS,
            entry_point_selector: "0x02f6ca94ed3ceec9e8b907a11317d8d624f94cf62d9c8112c658fd4d9f02b2d8",
            calldata: [goldenPassAddress, num.toHex(tokenId)]
          },
          "pending"
        ]
      }));

      const response = await fetch(dojoConfig.rpcUrl, {
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

  const getAdventurer = async (adventurerId: number): Promise<Adventurer | null> => {
    try {
      const response = await fetch(dojoConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [
            {
              contract_address: getContractByName(dojoConfig.manifest, dojoConfig.namespace, "adventurer_systems")?.address,
              entry_point_selector: "0x26f44ef7459c56b4f89ce027528afd605332b95a2875631deb3d1be2cbafea5",
              calldata: [num.toHex(adventurerId)],
            },
            "pending",
          ],
          id: 0,
        }),
      });

      const data = await response.json();
      if (!data?.result || data?.result.length < 10) return null;

      let adventurer: Adventurer = {
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
      }

      return adventurer;
    } catch (error) {
      console.log('error', error)
    }

    return null;
  };

  const getBeastTokenURI = async (beastId: number): Promise<string | null> => {
    try {
      const response = await fetch(dojoConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "starknet_call",
          params: [
            {
              contract_address: import.meta.env.VITE_PUBLIC_BEASTS_ADDRESS,
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
      localStorage.setItem('burner_version', "3")
      return account
    }
  };

  return { getAdventurer, getBeastTokenURI, createBurnerAccount, getTokenBalances, goldenPassReady };
};
