import { useStarknetApi } from "@/api/starknet";
import { BEAST_NAME_PREFIXES, BEAST_NAME_SUFFIXES } from "@/constants/beast";
import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { useGameStore } from "@/stores/gameStore";
import {
  Beast,
  GameSettingsData,
  ItemPurchase,
  Payment,
  Stats,
} from "@/types/game";
import { translateGameEvent } from "@/utils/translation";
import { getContractByName } from "@dojoengine/core";
import { delay, stringToFelt } from "@/utils/utils";
import { CairoOption, CairoOptionVariant, CallData, byteArray } from "starknet";
import { useAnalytics } from "@/utils/analytics";
import { useSnackbar } from "notistack";

export const useSystemCalls = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { getBeastTokenURI, getAdventurerState } = useStarknetApi();
  const { setCollectableTokenURI, gameId, adventurer } = useGameStore();
  const { account } = useController();
  const { currentNetworkConfig } = useDynamicConnector();
  const { txRevertedEvent } = useAnalytics();

  const namespace = currentNetworkConfig.namespace;
  const VRF_PROVIDER_ADDRESS = import.meta.env.VITE_PUBLIC_VRF_PROVIDER_ADDRESS;
  const DUNGEON_ADDRESS = currentNetworkConfig.dungeon;
  const DUNGEON_TICKET = currentNetworkConfig.dungeonTicket;
  const GAME_ADDRESS = getContractByName(
    currentNetworkConfig.manifest,
    namespace,
    "game_systems"
  )?.address;
  const GAME_TOKEN_ADDRESS = getContractByName(
    currentNetworkConfig.manifest,
    namespace,
    "game_token_systems"
  )?.address;
  const SETTINGS_ADDRESS = getContractByName(
    currentNetworkConfig.manifest,
    namespace,
    "settings_systems"
  )?.address;

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
      if (adventurer) {
        await waitForGlobalState();
      }

      let tx = await account!.execute(calls);
      let receipt: any = await waitForPreConfirmedTransaction(tx.transaction_hash, 0);

      if (receipt.execution_status === "REVERTED") {
        forceResetAction();
        txRevertedEvent({
          txHash: tx.transaction_hash,
        });
        enqueueSnackbar('Action failed', { variant: 'warning', anchorOrigin: { vertical: 'top', horizontal: 'center' } });
        return;
      }

      const translatedEvents = receipt.events.map((event: any) =>
        translateGameEvent(event, currentNetworkConfig.manifest, gameId)
      );

      if (translatedEvents.includes('Fatal Error')) {
        await delay(3000);
        window.location.reload();
        return;
      }

      return translatedEvents.filter(Boolean);
    } catch (error) {
      console.error("Error executing action:", error);
      forceResetAction();
      throw error;
    }
  };

  const waitForPreConfirmedTransaction = async (txHash: string, retries: number) => {
    if (retries > 5) {
      throw new Error("Transaction failed");
    }

    try {
      const receipt: any = await account!.waitForTransaction(
        txHash,
        { retryInterval: 275, successStates: ["PRE_CONFIRMED", "ACCEPTED_ON_L2", "ACCEPTED_ON_L1"] }
      );

      return receipt;
    } catch (error) {
      console.error("Error waiting for pre confirmed transaction:", error);
      await delay(500);
      return waitForPreConfirmedTransaction(txHash, retries + 1);
    }
  }

  const waitForTransaction = async (txHash: string, retries: number, _account?: any) => {
    if (retries > 9) {
      throw new Error("Transaction failed");
    }

    try {
      const receipt: any = await (_account || account!).waitForTransaction(
        txHash,
        { retryInterval: 350 }
      );

      return receipt;
    } catch (error) {
      console.error("Error waiting for transaction :", error);
      await delay(500);
      return waitForTransaction(txHash, retries + 1, _account);
    }
  }

  const waitForGlobalState = async (retries: number = 0): Promise<boolean> => {
    let adventurerState = await getAdventurerState(gameId!);

    if (adventurerState?.action_count === adventurer!.action_count || retries > 9) {
      return true;
    }

    await delay(500);
    return waitForGlobalState(retries + 1);
  };

  /**
   * Mints a new game token.
   * @param account The Starknet account
   * @param name The name of the game
   * @param settingsId The settings ID for the game
   */
  const buyGame = async (
    account: any,
    payment: Payment,
    name: string,
    preCalls: any[],
    callback: () => void
  ) => {
    let paymentData =
      payment.paymentType === "Ticket"
        ? [0]
        : [1, payment.goldenPass!.address, payment.goldenPass!.tokenId];

    if (payment.paymentType === "Ticket") {
      preCalls.push({
        contractAddress: DUNGEON_TICKET,
        entrypoint: "approve",
        calldata: CallData.compile([DUNGEON_ADDRESS, 1e18, "0"]),
      });
    }

    try {
      let tx = await account!.execute(
        [
          ...preCalls,
          {
            contractAddress: DUNGEON_ADDRESS,
            entrypoint: "buy_game",
            calldata: CallData.compile([
              ...paymentData,
              new CairoOption(CairoOptionVariant.Some, stringToFelt(name)),
              account!.address, // send game to this address
              false, // soulbound
            ]),
          },
        ]
      );

      callback();

      const receipt: any = await waitForTransaction(tx.transaction_hash, 0, account!);

      const tokenMetadataEvent = receipt.events.find(
        (event: any) => event.data.length === 14
      );

      return parseInt(tokenMetadataEvent.data[1], 16);
    } catch (error) {
      console.error("Error buying game:", error);
      throw error;
    }
  };

  /**
   * Mints a new game token.
   * @param account The Starknet account
   * @param name The name of the game
   * @param settingsId The settings ID for the game
   */
  const mintGame = async (name: string, settingsId = 0) => {
    try {
      let tx = await account!.execute(
        [
          {
            contractAddress: GAME_TOKEN_ADDRESS,
            entrypoint: "mint_game",
            calldata: CallData.compile([
              new CairoOption(CairoOptionVariant.Some, stringToFelt(name)),
              new CairoOption(CairoOptionVariant.Some, settingsId),
              1, // start
              1, // end
              1, // objective_ids
              1, // context
              1, // client_url
              1, // renderer_address
              account!.address,
              false, // soulbound
            ]),
          },
        ],
      );

      const receipt: any = await waitForTransaction(tx.transaction_hash, 0);

      const tokenMetadataEvent = receipt.events.find(
        (event: any) => event.data.length === 14
      );

      return parseInt(tokenMetadataEvent.data[1], 16);
    } catch (error) {
      console.error("Error minting game:", error);
      throw error;
    }
  };

  /**
   * Starts a new game with a random weapon.
   * @param gameId The ID of the game to start
   * @returns {Promise<void>}
   */
  const startGame = (gameId: number) => {
    let starterWeapons = [12, 16, 46, 76];
    let weapon =
      starterWeapons[Math.floor(Math.random() * starterWeapons.length)];

    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: "start_game",
      calldata: [gameId, weapon],
    };
  };

  /**
   * Requests randomness from the VRF provider.
   */
  const requestRandom = (salt: bigint) => {
    return {
      contractAddress: VRF_PROVIDER_ADDRESS,
      entrypoint: "request_random",
      calldata: CallData.compile({
        caller: GAME_ADDRESS,
        source: { type: 1, salt },
      }),
    };
  };

  /**
   * Explores the world, optionally until encountering a beast.
   * @param gameId The ID of the game
   * @param tillBeast Whether to explore until encountering a beast
   */
  const explore = (gameId: number, tillBeast: boolean) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: "explore",
      calldata: [gameId, tillBeast],
    };
  };

  /**
   * Attacks a beast, optionally fighting to the death.
   * @param gameId The ID of the game
   * @param toTheDeath Whether to fight until death
   */
  const attack = (gameId: number, toTheDeath: boolean) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: "attack",
      calldata: [gameId, toTheDeath],
    };
  };

  /**
   * Flees from a beast, optionally fleeing until death.
   * @param gameId The ID of the game
   * @param toTheDeath Whether to flee until death
   */
  const flee = (gameId: number, toTheDeath: boolean) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: "flee",
      calldata: [gameId, toTheDeath],
    };
  };

  /**
   * Equips items from the adventurer's bag.
   * @param gameId The ID of the game
   * @param items Array of item IDs to equip
   */
  const equip = (gameId: number, items: number[]) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: "equip",
      calldata: [gameId, items],
    };
  };

  /**
   * Drops items from the adventurer's equipment or bag.
   * @param gameId The ID of the game
   * @param items Array of item IDs to drop
   */
  const drop = (gameId: number, items: number[]) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: "drop",
      calldata: [gameId, items],
    };
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
      entrypoint: "buy_items",
      calldata: [gameId, potions, items],
    };
  };

  const selectStatUpgrades = (gameId: number, statUpgrades: Stats) => {
    return {
      contractAddress: GAME_ADDRESS,
      entrypoint: "select_stat_upgrades",
      calldata: [gameId, statUpgrades],
    };
  };

  const waitForClaimBeast = async (retries: number = 0): Promise<boolean> => {
    let adventurerState = await getAdventurerState(gameId!);

    if (adventurerState?.beast_health === 0 || retries > 19) {
      return true;
    }

    await delay(1000);
    return waitForClaimBeast(retries + 1);
  };

  const fetchTokenURI = async (tokenId: number, retries: number = 0) => {
    const tokenURI = await getBeastTokenURI(tokenId);

    if (tokenURI || retries > 9) {
      return tokenURI;
    }

    await delay(1000);
    return fetchTokenURI(tokenId, retries + 1);
  };


  const claimBeast = async (gameId: number, beast: Beast, retries: number = 0) => {
    if (retries > 2) {
      return;
    }

    let prefix =
      Object.keys(BEAST_NAME_PREFIXES).find(
        (key: any) => BEAST_NAME_PREFIXES[key] === beast.specialPrefix
      ) || 0;
    let suffix =
      Object.keys(BEAST_NAME_SUFFIXES).find(
        (key: any) => BEAST_NAME_SUFFIXES[key] === beast.specialSuffix
      ) || 0;

    try {
      await waitForClaimBeast();
      await delay(1000);

      let tx = await account!.execute(
        [
          {
            contractAddress: DUNGEON_ADDRESS,
            entrypoint: "claim_beast",
            calldata: [gameId, beast.id, prefix, suffix],
          },
        ],
      );

      const receipt: any = await waitForTransaction(tx.transaction_hash, 0);
      const tokenId = parseInt(receipt.events[receipt.events.length - 2].data[2], 16);

      const tokenURI = await fetchTokenURI(tokenId);

      setCollectableTokenURI(tokenURI);

      if ((beast.id === 29 && prefix === 18 && suffix === 6) ||
        (beast.id === 1 && prefix === 47 && suffix === 11) ||
        (beast.id === 53 && prefix === 61 && suffix === 1)) {
        await claimJackpot(tokenId);
      }

      localStorage.removeItem('collectable_beast');
      return tokenId;
    } catch (error) {
      console.error("Error claiming beast:", error);
      await delay(3000);
      return claimBeast(gameId, beast, retries + 1);
    }
  };

  const claimSurvivorTokens = async (gameId: number) => {
    await executeAction([{
      contractAddress: DUNGEON_ADDRESS,
      entrypoint: "claim_reward_token",
      calldata: [gameId],
    }], () => { });
  };

  const claimJackpot = async (tokenId: number) => {
    await executeAction([{
      contractAddress: DUNGEON_ADDRESS,
      entrypoint: "claim_jackpot",
      calldata: [tokenId],
    }], () => { });
  };

  const createSettings = async (settings: GameSettingsData) => {
    let bag = {
      item_1: settings.bag[0]
        ? { id: settings.bag[0].id, xp: settings.bag[0].xp }
        : { id: 0, xp: 0 },
      item_2: settings.bag[1]
        ? { id: settings.bag[1].id, xp: settings.bag[1].xp }
        : { id: 0, xp: 0 },
      item_3: settings.bag[2]
        ? { id: settings.bag[2].id, xp: settings.bag[2].xp }
        : { id: 0, xp: 0 },
      item_4: settings.bag[3]
        ? { id: settings.bag[3].id, xp: settings.bag[3].xp }
        : { id: 0, xp: 0 },
      item_5: settings.bag[4]
        ? { id: settings.bag[4].id, xp: settings.bag[4].xp }
        : { id: 0, xp: 0 },
      item_6: settings.bag[5]
        ? { id: settings.bag[5].id, xp: settings.bag[5].xp }
        : { id: 0, xp: 0 },
      item_7: settings.bag[6]
        ? { id: settings.bag[6].id, xp: settings.bag[6].xp }
        : { id: 0, xp: 0 },
      item_8: settings.bag[7]
        ? { id: settings.bag[7].id, xp: settings.bag[7].xp }
        : { id: 0, xp: 0 },
      item_9: settings.bag[8]
        ? { id: settings.bag[8].id, xp: settings.bag[8].xp }
        : { id: 0, xp: 0 },
      item_10: settings.bag[9]
        ? { id: settings.bag[9].id, xp: settings.bag[9].xp }
        : { id: 0, xp: 0 },
      item_11: settings.bag[10]
        ? { id: settings.bag[10].id, xp: settings.bag[10].xp }
        : { id: 0, xp: 0 },
      item_12: settings.bag[11]
        ? { id: settings.bag[11].id, xp: settings.bag[11].xp }
        : { id: 0, xp: 0 },
      item_13: settings.bag[12]
        ? { id: settings.bag[12].id, xp: settings.bag[12].xp }
        : { id: 0, xp: 0 },
      item_14: settings.bag[13]
        ? { id: settings.bag[13].id, xp: settings.bag[13].xp }
        : { id: 0, xp: 0 },
      item_15: settings.bag[14]
        ? { id: settings.bag[14].id, xp: settings.bag[14].xp }
        : { id: 0, xp: 0 },
      mutated: false,
    };

    return await executeAction(
      [
        {
          contractAddress: SETTINGS_ADDRESS,
          entrypoint: "add_settings",
          calldata: [
            settings.vrf_address,
            settings.name,
            byteArray.byteArrayFromString(`${settings.name} settings`),
            settings.adventurer,
            bag,
            settings.game_seed,
            settings.game_seed_until_xp,
            settings.in_battle,
            settings.stats_mode === "Dodge" ? 0 : 1,
            settings.base_damage_reduction,
            settings.market_size,
          ],
        },
      ],
      () => { }
    );
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
    claimBeast,
    claimJackpot,
    createSettings,
    buyGame,
    mintGame,
    requestRandom,
    executeAction,
    claimSurvivorTokens,
  };
};
