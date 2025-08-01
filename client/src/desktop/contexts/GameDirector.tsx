import { useDynamicConnector } from "@/contexts/starknet";
import { Settings, useGameSettings } from "@/dojo/useGameSettings";
import { useGameTokens } from "@/dojo/useGameTokens";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { GameAction, useEntityModel } from "@/types/game";
import { streamIds } from "@/utils/cloudflare";
import {
  BattleEvents,
  ExplorerReplayEvents,
  getVideoId,
  useEvents,
} from "@/utils/events";
import { getNewItemsEquipped } from "@/utils/game";
import { useQueries } from "@/utils/queries";
import { delay } from "@/utils/utils";
import { useDojoSDK } from "@dojoengine/sdk/react";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { useSubscribeGameTokens } from "metagame-sdk";
import { getContractByName } from "@dojoengine/core";
import { useDojoConfig } from "@/contexts/starknet";
import { addAddressPadding } from "starknet";

export interface GameDirectorContext {
  executeGameAction: (action: GameAction) => void;
  actionFailed: number;
  subscription: any;
  videoQueue: string[];
  setVideoQueue: (videoQueue: string[]) => void;
}

const GameDirectorContext = createContext<GameDirectorContext>(
  {} as GameDirectorContext
);

const VRF_ENABLED = true;

/**
 * Wait times for events in milliseconds
 */
const delayTimes: any = {
  attack: 2000,
  beast_attack: 2000,
  flee: 1000,
  level_up: 2000,
};

const ExplorerLogEvents = [
  "discovery",
  "obstacle",
  "defeated_beast",
  "fled_beast",
  "stat_upgrade",
  "buy_items",
];

export const GameDirector = ({ children }: PropsWithChildren) => {
  const { sdk } = useDojoSDK();
  const { currentNetworkConfig } = useDynamicConnector();
  const {
    startGame,
    executeAction,
    requestRandom,
    explore,
    attack,
    flee,
    buyItems,
    selectStatUpgrades,
    equip,
    drop,
  } = useSystemCalls();
  const { getSettingsList } = useGameSettings();
  const { fetchMetadata } = useGameTokens();
  const dojoConfig = useDojoConfig();

  const namespace = dojoConfig.namespace;
  const GAME_TOKEN_ADDRESS = getContractByName(
    dojoConfig.manifest,
    namespace,
    "game_token_systems"
  )?.address;
  const { getEntityModel } = useEntityModel();
  const { processGameEvent } = useEvents();
  const { gameEventsQuery } = useQueries();

  const {
    gameId,
    adventurer,
    adventurerState,
    setAdventurer,
    setBag,
    setBeast,
    setExploreLog,
    setBattleEvent,
    newInventoryItems,
    setMarketItemIds,
    setNewMarket,
    setNewInventoryItems,
    metadata,
    gameSettings,
    setGameSettings,
    setShowInventory,
    setShowOverlay,
  } = useGameStore();

  const { games: gameTokens } = useSubscribeGameTokens({
    gameAddresses: [
      addAddressPadding(GAME_TOKEN_ADDRESS), // adding pad address to sdk
    ],
    tokenIds: [gameId ? gameId.toString() : "0"],
  });

  const [VRFEnabled, setVRFEnabled] = useState(VRF_ENABLED);
  const [spectating, setSpectating] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [actionFailed, setActionFailed] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventQueue, setEventQueue] = useState<any[]>([]);
  const [videoQueue, setVideoQueue] = useState<string[]>([]);

  const gameTokensKey = useMemo(() => {
    return gameTokens.map((token) => token.token_id).join(",");
  }, [gameTokens]);

  useEffect(() => {
    if (gameId && gameTokens && gameTokens.length > 0) {
      fetchMetadata(gameTokens, gameId);
    }
  }, [gameId, gameTokensKey]);

  useEffect(() => {
    if (gameId && metadata && !gameSettings) {
      getSettingsList(null, [metadata.settings_id]).then(
        (settings: Settings[]) => {
          setGameSettings(settings[0]);
          setVRFEnabled(
            currentNetworkConfig.vrf && settings[0].game_seed === 0
          );
          subscribeEvents(gameId!, settings[0]);
        }
      );
    }
  }, [metadata, gameId]);

  useEffect(() => {
    if (!gameSettings || !adventurer || VRFEnabled) return;

    if (
      currentNetworkConfig.vrf &&
      gameSettings.game_seed_until_xp !== 0 &&
      adventurer.xp >= gameSettings.game_seed_until_xp
    ) {
      setVRFEnabled(true);
    }
  }, [gameSettings, adventurer]);

  useEffect(() => {
    const processNextEvent = async () => {
      if (eventQueue.length > 0 && !isProcessing) {
        setIsProcessing(true);
        const event = eventQueue[0];
        await processEvent(event, false);
        setEventQueue((prev) => prev.slice(1));
        setIsProcessing(false);
      }
    };

    processNextEvent();
  }, [eventQueue, isProcessing]);

  const subscribeEvents = async (gameId: number, settings: Settings) => {
    if (subscription) {
      try {
        subscription.cancel();
      } catch (error) {}
    }

    const [initialData, sub] = await sdk.subscribeEventQuery({
      query: gameEventsQuery(gameId),
      callback: ({ data, error }: { data?: any[]; error?: Error }) => {
        if (data && data.length > 0) {
          let events = data
            .filter((entity: any) =>
              Boolean(getEntityModel(entity, "GameEvent"))
            )
            .map((entity: any) => processGameEvent(entity));

          setEventQueue((prev) => [...prev, ...events]);
        }
      },
    });

    let events = (initialData?.getItems() || [])
      .filter((entity: any) => Boolean(getEntityModel(entity, "GameEvent")))
      .map((entity: any) => processGameEvent(entity))
      .sort((a, b) => a.action_count - b.action_count);

    if (!events || events.length === 0) {
      startGame(
        gameId,
        settings.game_seed === 0 && settings.adventurer.xp !== 0
      );
    } else {
      reconnectGameEvents(events);
    }

    setSubscription(sub);
  };

  const reconnectGameEvents = async (events: any[]) => {
    events.forEach((event) => {
      processEvent(event, true);
    });
  };

  const processEvent = async (event: any, skipVideo: boolean) => {
    if (event.type === "adventurer") {
      setAdventurer(event.adventurer!);

      if (event.adventurer!.health === 0) {
        setShowOverlay(false);
        setVideoQueue((prev) => [...prev, streamIds.death]);
      }

      if (
        !skipVideo &&
        event.adventurer!.item_specials_seed &&
        event.adventurer!.item_specials_seed !== adventurer?.item_specials_seed
      ) {
        setShowOverlay(false);
        setVideoQueue((prev) => [...prev, streamIds.specials_unlocked]);
        setShowInventory(true);
      }

      if (!skipVideo && event.adventurer!.stat_upgrades_available > 0) {
        setShowInventory(true);
      }

      if (
        !skipVideo &&
        event.adventurer!.stat_upgrades_available === 0 &&
        adventurer?.stat_upgrades_available! > 0
      ) {
        setShowInventory(false);
      }
    }

    if (event.type === "bag") {
      setBag(
        event.bag!.filter(
          (item: any) => typeof item === "object" && item.id !== 0
        )
      );
    }

    if (event.type === "beast") {
      setBeast(event.beast!);
    }

    if (event.type === "market_items") {
      setMarketItemIds(event.items!);
      setNewMarket(true);
    }

    if (!spectating && ExplorerLogEvents.includes(event.type)) {
      if (!skipVideo && event.type === "discovery") {
        if (event.discovery?.type === "Loot") {
          setNewInventoryItems([...newInventoryItems, event.discovery.amount!]);
        }
      }

      setExploreLog(event);
    }

    if (spectating && ExplorerReplayEvents.includes(event.type)) {
      setExploreLog(event);
    }

    if (!skipVideo && BattleEvents.includes(event.type)) {
      setBattleEvent(event);
    }

    if (!skipVideo && getVideoId(event)) {
      setShowOverlay(false);
      setVideoQueue((prev) => [...prev, getVideoId(event)!]);
    }

    if (!skipVideo && delayTimes[event.type]) {
      await delay(delayTimes[event.type]);
    }
  };

  const executeGameAction = (action: GameAction) => {
    let txs: any[] = [];

    if (VRFEnabled && ["explore", "attack", "flee"].includes(action.type)) {
      txs.push(requestRandom());
    }

    if (
      VRFEnabled &&
      action.type === "equip" &&
      adventurer?.beast_health! > 0
    ) {
      txs.push(requestRandom());
    }

    let newItemsEquipped = getNewItemsEquipped(
      adventurer?.equipment!,
      adventurerState?.equipment!
    );
    if (action.type !== "equip" && newItemsEquipped.length > 0) {
      txs.push(
        equip(
          gameId!,
          newItemsEquipped.map((item) => item.id)
        )
      );
    }

    if (action.type === "explore") {
      txs.push(explore(gameId!, action.untilBeast!));
    } else if (action.type === "attack") {
      txs.push(attack(gameId!, action.untilDeath!));
    } else if (action.type === "flee") {
      txs.push(flee(gameId!, action.untilDeath!));
    } else if (action.type === "buy_items") {
      txs.push(buyItems(gameId!, action.potions!, action.itemPurchases!));
    } else if (action.type === "select_stat_upgrades") {
      txs.push(selectStatUpgrades(gameId!, action.statUpgrades!));
    } else if (action.type === "equip") {
      txs.push(
        equip(
          gameId!,
          newItemsEquipped.map((item) => item.id)
        )
      );
    } else if (action.type === "drop") {
      txs.push(drop(gameId!, action.items!));
    }

    executeAction(txs, setActionFailed);
  };

  return (
    <GameDirectorContext.Provider
      value={{
        executeGameAction,
        actionFailed,
        subscription,
        videoQueue,
        setVideoQueue,
      }}
    >
      {children}
    </GameDirectorContext.Provider>
  );
};

export const useGameDirector = () => {
  return useContext(GameDirectorContext);
};
