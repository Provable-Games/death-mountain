import { useController } from "@/contexts/controller";
import { useDojoConfig } from "@/contexts/starknet";
import { GameSettingsData, ItemPurchase, Stats } from "@/types/game";
import { getContractByName } from "@dojoengine/core";
import { CallData } from 'starknet';

export const useSystemCalls = () => {
  const { account } = useController();
  const dojoConfig = useDojoConfig();

  const namespace = dojoConfig.namespace;
  const VRF_PROVIDER_ADDRESS = import.meta.env.VITE_PUBLIC_VRF_PROVIDER_ADDRESS;
  const GAME_ADDRESS = getContractByName(dojoConfig.manifest, namespace, "game_systems")?.address
  const GAME_TOKEN_ADDRESS = getContractByName(dojoConfig.manifest, namespace, "game_token_systems")?.address
  const SETTINGS_ADDRESS = getContractByName(dojoConfig.manifest, namespace, "settings_systems")?.address

  /**
   * Custom hook to handle system calls and state management in the Dojo application.
   * Provides functionality for game actions and managing optimistic updates.
   *
   * @returns An object containing system call functions:
   *   - mintAndStartGame: Function to mint a new game
   *   - startGame: Function to start a new game with a weapon
   *   - explore: Function to explore the world
   *   - attack: Function to attack a beast
   *   - flee: Function to flee from a beast
   *   - equip: Function to equip items
   *   - drop: Function to drop items
   *   - levelUp: Function to level up and purchase items
   */
  const executeAction = async (calls: any[], forceResetAction: () => void) => {
    try {
      let tx = await account!.execute(calls, { version: 3 });
      let receipt: any = await account!.waitForTransaction(tx.transaction_hash, { retryInterval: 500 })

      if (receipt.execution_status === "REVERTED") {
        forceResetAction();
      }

      return true
    } catch (error) {
      console.error("Error executing action:", error);
      forceResetAction();
      throw error;
    }
  };

  /**
   * Mints a new game token.
   * @param account The Starknet account
   * @param name The name of the game
   * @param settingsId The settings ID for the game
   */
  const mintGame = async (account: any, name: string, settingsId = 0) => {
    try {
      let tx = await account!.execute([
        {
          contractAddress: GAME_TOKEN_ADDRESS,
          entrypoint: 'mint',
          calldata: [
            '0x' + name.split('').map((char: any) => char.charCodeAt(0).toString(16)).join(''),
            settingsId,
            1,
            1,
            account!.address
          ]
        }
      ], { version: 3 });

      const receipt: any = await account!.waitForTransaction(tx.transaction_hash, { retryInterval: 500 })

      let gameId = 0;
      if (receipt.events[0].data.length > 0) {
        gameId = parseInt(receipt.events[0].data[receipt.events[0].data.length - 1], 16)
      } else {
        gameId = parseInt(receipt.events[1].data[receipt.events[1].data.length - 1], 16)
      }

      return gameId;
    } catch (error) {
      console.error("Error minting game:", error);
      throw error;
    }
  }

  /**
   * Starts a new game with a random weapon.
   * @param gameId The ID of the game to start
   * @returns {Promise<void>}
   */
  const startGame = async (gameId: number, use_vrf: boolean) => {
    let starterWeapons = [12, 16, 46, 76]
    let weapon = starterWeapons[Math.floor(Math.random() * starterWeapons.length)]

    let calls: any[] = [
      {
        contractAddress: GAME_ADDRESS,
        entrypoint: 'start_game',
        calldata: [gameId, weapon]
      }
    ]

    if (use_vrf) {
      calls.unshift(requestRandom());
    }

    await executeAction(calls, () => { });
  };

  /**
   * Requests randomness from the VRF provider.
   */
  const requestRandom = () => {
    return {
      contractAddress: VRF_PROVIDER_ADDRESS,
      entrypoint: 'request_random',
      calldata: CallData.compile({
        caller: GAME_ADDRESS,
        source: { type: 0, address: account!.address }
      })
    }
  }

  /**
   * Explores the world, optionally until encountering a beast.
   * @param gameId The ID of the game
   * @param tillBeast Whether to explore until encountering a beast
   */
  const explore = (gameId: number, tillBeast: boolean) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: 'explore',
      calldata: [gameId, tillBeast]
    }
  };

  /**
   * Attacks a beast, optionally fighting to the death.
   * @param gameId The ID of the game
   * @param toTheDeath Whether to fight until death
   */
  const attack = (gameId: number, toTheDeath: boolean) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: 'attack',
      calldata: [gameId, toTheDeath]
    }
  };

  /**
   * Flees from a beast, optionally fleeing until death.
   * @param gameId The ID of the game
   * @param toTheDeath Whether to flee until death
   */
  const flee = (gameId: number, toTheDeath: boolean) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: 'flee',
      calldata: [gameId, toTheDeath]
    }
  };

  /**
   * Equips items from the adventurer's bag.
   * @param gameId The ID of the game
   * @param items Array of item IDs to equip
   */
  const equip = (gameId: number, items: number[]) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: 'equip',
      calldata: [gameId, items]
    }
  };

  /**
   * Drops items from the adventurer's equipment or bag.
   * @param gameId The ID of the game
   * @param items Array of item IDs to drop
   */
  const drop = (gameId: number, items: number[]) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: 'drop',
      calldata: [gameId, items]
    }
  };

  /**
   * Levels up the adventurer and optionally purchases items.
   * @param gameId The ID of the game
   * @param potions Number of potions to purchase
   * @param statUpgrades Object containing stat upgrades
   * @param items Array of items to purchase
   */
  const buyItems = (gameId: number, potions: number, items: ItemPurchase[]) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: 'buy_items',
      calldata: [gameId, potions, items]
    }
  };

  const selectStatUpgrades = (gameId: number, statUpgrades: Stats) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: 'select_stat_upgrades',
      calldata: [gameId, statUpgrades]
    }
  };

  const createSettings = async (settings: GameSettingsData) => {
    let bag = {
      item_1: settings.bag[0] ? { id: settings.bag[0].id, xp: settings.bag[0].xp } : { id: 0, xp: 0 },
      item_2: settings.bag[1] ? { id: settings.bag[1].id, xp: settings.bag[1].xp } : { id: 0, xp: 0 },
      item_3: settings.bag[2] ? { id: settings.bag[2].id, xp: settings.bag[2].xp } : { id: 0, xp: 0 },
      item_4: settings.bag[3] ? { id: settings.bag[3].id, xp: settings.bag[3].xp } : { id: 0, xp: 0 },
      item_5: settings.bag[4] ? { id: settings.bag[4].id, xp: settings.bag[4].xp } : { id: 0, xp: 0 },
      item_6: settings.bag[5] ? { id: settings.bag[5].id, xp: settings.bag[5].xp } : { id: 0, xp: 0 },
      item_7: settings.bag[6] ? { id: settings.bag[6].id, xp: settings.bag[6].xp } : { id: 0, xp: 0 },
      item_8: settings.bag[7] ? { id: settings.bag[7].id, xp: settings.bag[7].xp } : { id: 0, xp: 0 },
      item_9: settings.bag[8] ? { id: settings.bag[8].id, xp: settings.bag[8].xp } : { id: 0, xp: 0 },
      item_10: settings.bag[9] ? { id: settings.bag[9].id, xp: settings.bag[9].xp } : { id: 0, xp: 0 },
      item_11: settings.bag[10] ? { id: settings.bag[10].id, xp: settings.bag[10].xp } : { id: 0, xp: 0 },
      item_12: settings.bag[11] ? { id: settings.bag[11].id, xp: settings.bag[11].xp } : { id: 0, xp: 0 },
      item_13: settings.bag[12] ? { id: settings.bag[12].id, xp: settings.bag[12].xp } : { id: 0, xp: 0 },
      item_14: settings.bag[13] ? { id: settings.bag[13].id, xp: settings.bag[13].xp } : { id: 0, xp: 0 },
      item_15: settings.bag[14] ? { id: settings.bag[14].id, xp: settings.bag[14].xp } : { id: 0, xp: 0 },
      mutated: false
    }

    return await executeAction([
      {
        contractAddress: SETTINGS_ADDRESS,
        entrypoint: 'add_settings',
        calldata: [
          settings.vrf_address,
          settings.name,
          settings.adventurer,
          bag,
          settings.game_seed,
          settings.game_seed_until_xp,
          settings.in_battle,
          settings.stats_mode === 'Dodge' ? 0 : 1,
          settings.base_damage_reduction
        ]
      }
    ], () => { });
  };

  return {
    startGame,
    explore,
    attack,
    flee,
    equip,
    drop,
    buyItems,
    selectStatUpgrades,
    createSettings,
    mintGame,
    requestRandom,
    executeAction,
  };
};
