import { useStarknetApi } from "@/api/starknet";
import { useDynamicConnector } from "@/contexts/starknet";
import { Settings, useGameSettings } from "@/dojo/useGameSettings";
import { useGameTokens } from "@/dojo/useGameTokens";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { GameAction, useEntityModel } from "@/types/game";
import { BattleEvents, ExplorerReplayEvents, useEvents } from "@/utils/events";
import { getNewItemsEquipped } from "@/utils/game";
import { useQueries } from "@/utils/queries";
import { delay } from "@/utils/utils";
import { useDojoSDK } from "@dojoengine/sdk/react";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useState,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useSubscribeGameTokens } from "metagame-sdk";
import { getContractByName } from "@dojoengine/core";
import { useDojoConfig } from "@/contexts/starknet";
import { addAddressPadding } from "starknet";

export interface GameDirectorContext {
  executeGameAction: (action: GameAction) => void;
  actionFailed: number;
  subscription: any;
  watch: {
    setSpectating: (spectating: boolean) => void;
    spectating: boolean;
    replayEvents: any[];
    processEvent: (event: any, skipAnimation: boolean) => void;
    setEventQueue: (events: any[]) => void;
    eventsProcessed: number;
    setEventsProcessed: (eventsProcessed: number) => void;
  };
}

const GameDirectorContext = createContext<GameDirectorContext>(
  {} as GameDirectorContext
);

/**
 * Wait times for events in milliseconds
 */
const delayTimes: any = {
  level_up: 1000,
  discovery: 1000,
  obstacle: 1000,
  attack: 2000,
  beast_attack: 2000,
  flee: 1000,
};

const replayDelayTimes: any = {
  discovery: 2000,
  obstacle: 2000,
  attack: 2000,
  beast_attack: 2000,
  beast: 2000,
  flee: 2000,
  fled_beast: 2000,
  defeated_beast: 1000,
  buy_items: 2000,
  equip: 2000,
  drop: 2000,
};

const ExplorerLogEvents = [
  "discovery",
  "obstacle",
  "defeated_beast",
  "fled_beast",
  "stat_upgrade",
  "buy_items",
  "level_up",
];

const VRF_ENABLED = true;

export const GameDirector = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const { sdk } = useDojoSDK();
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
  const { currentNetworkConfig } = useDynamicConnector();
  const { getAdventurer } = useStarknetApi();
  const { getSettingsList } = useGameSettings();
  const { fetchMetadata } = useGameTokens();
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
  } = useGameStore();

  const [spectating, setSpectating] = useState(false);
  const [replayEvents, setReplayEvents] = useState<any[]>([]);
  const [VRFEnabled, setVRFEnabled] = useState(VRF_ENABLED);

  const [subscription, setSubscription] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventQueue, setEventQueue] = useState<any[]>([]);
  const [eventsProcessed, setEventsProcessed] = useState(0);
  const [actionFailed, setActionFailed] = useReducer((x) => x + 1, 0);

  const dojoConfig = useDojoConfig();
  const namespace = dojoConfig.namespace;
  const GAME_TOKEN_ADDRESS = getContractByName(
    dojoConfig.manifest,
    namespace,
    "game_token_systems"
  )?.address;

  const { games: gameTokens } = useSubscribeGameTokens({
    gameAddresses: [
      addAddressPadding(GAME_TOKEN_ADDRESS), // adding pad address to sdk
    ],
  });

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
        setEventsProcessed((prev) => prev + 1);
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

    if (spectating) {
      handleSpectating(events);
    } else if (!events || events.length === 0) {
      startGame(
        gameId,
        settings.game_seed === 0 && settings.adventurer.xp !== 0
      );
    } else {
      reconnectGameEvents(events);
    }

    setSubscription(sub);
  };

  const handleSpectating = async (events: any[]) => {
    if (events.length === 0) {
      return navigate("/survivor");
    }

    // Fetch adventurer state
    const adventurer = await getAdventurer(gameId!);
    if (!adventurer) {
      return navigate("/survivor");
    }

    if (adventurer.health > 0) {
      reconnectGameEvents(events);
    } else {
      setReplayEvents(events);
    }
  };

  const reconnectGameEvents = async (events: any[]) => {
    events.forEach((event) => {
      processEvent(event, true);
    });
  };

  const processEvent = async (event: any, skipAnimation: boolean) => {
    if (event.type === "adventurer") {
      setAdventurer(event.adventurer!);
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
      if (!skipAnimation && event.type === "discovery") {
        if (event.discovery?.type === "Loot") {
          setNewInventoryItems([...newInventoryItems, event.discovery.amount!]);
        }
      }

      setExploreLog(event);
    }

    if (spectating && ExplorerReplayEvents.includes(event.type)) {
      setExploreLog(event);
    }

    if (!skipAnimation && BattleEvents.includes(event.type)) {
      setBattleEvent(event);
    }

    if (
      !skipAnimation &&
      (delayTimes[event.type] || replayDelayTimes[event.type])
    ) {
      await delay(
        spectating ? replayDelayTimes[event.type] : delayTimes[event.type]
      );
    }
  };

  const executeGameAction = (action: GameAction) => {
    if (spectating) return;

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

        watch: {
          setSpectating,
          spectating,
          replayEvents,
          processEvent,
          setEventQueue,
          eventsProcessed,
          setEventsProcessed,
        },
      }}
    >
      {children}
    </GameDirectorContext.Provider>
  );
};

export const useGameDirector = () => {
  return useContext(GameDirectorContext);
};
