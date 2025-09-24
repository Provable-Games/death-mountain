import { useStarknetApi } from "@/api/starknet";
import { useDynamicConnector } from "@/contexts/starknet";
import { useGameEvents } from "@/dojo/useGameEvents";
import { Settings } from "@/dojo/useGameSettings";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { GameAction, Item } from "@/types/game";
import {
  BattleEvents,
  ExplorerReplayEvents,
  GameEvent,
  processGameEvent,
} from "@/utils/events";
import { getNewItemsEquipped, incrementBeastsCollected } from "@/utils/game";
import { delay, generateBattleSalt, generateSalt } from "@/utils/utils";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useAnalytics } from "@/utils/analytics";

export interface GameDirectorContext {
  executeGameAction: (action: GameAction) => void;
  actionFailed: number;
  setSpectating: (spectating: boolean) => void;
  spectating: boolean;
  processEvent: (event: any, skipDelay?: boolean) => void;
  eventsProcessed: number;
  setEventQueue: (events: any) => void;
  setEventsProcessed: (eventsProcessed: number) => void;
}

const GameDirectorContext = createContext<GameDirectorContext>(
  {} as GameDirectorContext
);

/**
 * Wait times for events in milliseconds
 */
const delayTimes: any = {
  level_up: 1000,
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
    claimBeast,
  } = useSystemCalls();
  const { currentNetworkConfig } = useDynamicConnector();
  const { getGameState, getSettingsDetails, getTokenMetadata } =
    useStarknetApi();
  const { getGameEvents } = useGameEvents();
  const { gameStartedEvent } = useAnalytics();

  const {
    gameId,
    adventurer,
    adventurerState,
    collectable,
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
    setCollectable,
    setMetadata,
    setClaimInProgress,
  } = useGameStore();

  const [spectating, setSpectating] = useState(false);
  const [VRFEnabled, setVRFEnabled] = useState(VRF_ENABLED);

  const [isProcessing, setIsProcessing] = useState(false);
  const [eventQueue, setEventQueue] = useState<any[]>([]);
  const [eventsProcessed, setEventsProcessed] = useState(0);
  const [actionFailed, setActionFailed] = useReducer((x) => x + 1, 0);

  const [beastDefeated, setBeastDefeated] = useState(false);

  useEffect(() => {
    if (gameId && !metadata) {
      getTokenMetadata(gameId).then((metadata) => {
        setMetadata(metadata);
      });
    }
  }, [gameId, metadata]);

  useEffect(() => {
    if (gameId && metadata && !gameSettings) {
      getSettingsDetails(metadata.settings_id).then((settings) => {
        setGameSettings(settings);
        setVRFEnabled(currentNetworkConfig.vrf && settings.game_seed === 0);
        initializeGame(settings, currentNetworkConfig.name);
      });
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
        await processEvent(event);
        setEventQueue((prev) => prev.slice(1));
        setIsProcessing(false);
        setEventsProcessed((prev) => prev + 1);
      }
    };

    processNextEvent();
  }, [eventQueue, isProcessing]);

  useEffect(() => {
    if (beastDefeated && collectable && currentNetworkConfig.beasts) {
      incrementBeastsCollected(gameId!);
      setClaimInProgress(true);
      claimBeast(gameId!, collectable);
    }
  }, [beastDefeated]);

  const initializeGame = async (settings: Settings, mode: string) => {
    if (spectating) return;

    const gameState = await getGameState(gameId!);

    if (gameState) {
      restoreGameState(gameState);
    } else {
      executeGameAction({ type: "start_game", gameId: gameId!, settings });
      gameStartedEvent({
        adventurerId: gameId!,
        dungeon: mode,
        settingsId: settings.settings_id,
      });
    }
  };

  const restoreGameState = async (gameState: any) => {
    const gameEvents = await getGameEvents(gameId!);

    gameEvents.forEach((event: GameEvent) => {
      if (ExplorerLogEvents.includes(event.type)) {
        setExploreLog(event);
      }
    });

    setAdventurer(gameState.adventurer);
    setBag(
      Object.values(gameState.bag).filter(
        (item: any) => typeof item === "object" && item.id !== 0
      ) as Item[]
    );
    setMarketItemIds(gameState.market);

    if (gameState.adventurer.beast_health > 0) {
      let beast = processGameEvent({
        action_count: 0,
        details: { beast: gameState.beast },
      }).beast!;
      setBeast(beast);
      setCollectable(beast.isCollectable ? beast : null);
    }
  };

  const processEvent = async (event: GameEvent, skipDelay: boolean = false) => {
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
      setBeastDefeated(false);
      setCollectable(event.beast!.isCollectable ? event.beast! : null);
    }

    if (event.type === "market_items") {
      setMarketItemIds(event.items!);
    }

    if (event.type === "stat_upgrade") {
      setNewMarket(true);
    }

    if (!spectating && ExplorerLogEvents.includes(event.type)) {
      if (event.type === "discovery") {
        if (event.discovery?.type === "Loot") {
          setNewInventoryItems([...newInventoryItems, event.discovery.amount!]);
        }
      }

      setExploreLog(event);
    }

    if (spectating && ExplorerReplayEvents.includes(event.type)) {
      setExploreLog(event);
    }

    if (BattleEvents.includes(event.type)) {
      setBattleEvent(event);
    }

    if (
      !skipDelay &&
      (delayTimes[event.type] || replayDelayTimes[event.type])
    ) {
      await delay(
        spectating ? replayDelayTimes[event.type] : delayTimes[event.type]
      );
    }
  };

  const executeGameAction = async (action: GameAction) => {
    if (spectating) return;

    let txs: any[] = [];

    if (action.type === "start_game") {
      if (
        action.settings.game_seed === 0 &&
        action.settings.adventurer.xp !== 0
      ) {
        txs.push(requestRandom(generateSalt(action.gameId!, action.settings.adventurer.xp)));
      }
      txs.push(startGame(action.gameId!));
    }

    if (VRFEnabled && action.type === "explore") {
      txs.push(requestRandom(generateSalt(gameId!, adventurer!.xp)));
    }

    if (VRFEnabled && ["attack", "flee"].includes(action.type)) {
      txs.push(requestRandom(generateBattleSalt(gameId!, adventurer!.xp, adventurer!.action_count)));
    }

    if (
      VRFEnabled &&
      action.type === "equip" &&
      adventurer?.beast_health! > 0
    ) {
      txs.push(requestRandom(generateBattleSalt(gameId!, adventurer!.xp, adventurer!.action_count)));
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

    const events = await executeAction(txs, setActionFailed);

    if (events.some((event: any) => event.type === "defeated_beast")) {
      setBeastDefeated(true);
    }

    setEventQueue((prev) => [...prev, ...events]);
  };

  return (
    <GameDirectorContext.Provider
      value={{
        executeGameAction,
        actionFailed,
        eventsProcessed,
        setEventsProcessed,
        processEvent,
        setEventQueue,
        setSpectating,
        spectating,
      }}
    >
      {children}
    </GameDirectorContext.Provider>
  );
};

export const useGameDirector = () => {
  return useContext(GameDirectorContext);
};
