import { getContractByName } from "@dojoengine/core";
import { Adventurer } from "@/types/game";
import { useDojoConfig } from "@/contexts/starknet";
import { Account, CallData, ec, hash, num, RpcProvider, stark } from "starknet";

export const useStarknetApi = () => {
  const dojoConfig = useDojoConfig();

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
              entry_point_selector: "0x3d3148be1dfdfcfcd22f79afe7aee5a3147ef412bfb2ea27949e7f8c8937a7",
              calldata: [adventurerId.toString(16)],
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
        action_count: parseInt(data?.result[28], 16),
      }

      return adventurer;
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

    const account = new Account(rpcProvider, contractAddress, privateKey, "1");
    const { transaction_hash } = await account.deployAccount({
      classHash: accountClassHash,
      constructorCalldata: constructorCalldata,
      addressSalt: publicKey,
    }, {
      version: "3",
      nonce: num.toHex(0),
      maxFee: num.toHex(0),
    });

    const receipt = await account.waitForTransaction(transaction_hash, { retryInterval: 100 });

    if (receipt) {
      localStorage.setItem('burner', JSON.stringify({ address: contractAddress, privateKey }))
      localStorage.setItem('burner_version', "1")
      return account
    }
  };

  return { getAdventurer, createBurnerAccount };
};
