import { useStarknetApi } from "@/api/starknet";
import { BEAST_SPECIAL_NAME_LEVEL_UNLOCK, JACKPOT_BEASTS } from "@/constants/beast";
import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import { useGameEvents } from "@/dojo/useGameEvents";
import { Settings } from "@/dojo/useGameSettings";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { useMarketStore } from "@/stores/marketStore";
import { useUIStore } from "@/stores/uiStore";
import { GameAction, Item } from "@/types/game";
import { useAnalytics } from "@/utils/analytics";
import { streamIds } from "@/utils/cloudflare";
import {
  BattleEvents,
  ExplorerReplayEvents,
  GameEvent,
  getVideoId,
  processGameEvent,
} from "@/utils/events";
import { getNewItemsEquipped, incrementBeastsCollected } from "@/utils/game";
import { optimisticGameEvents } from "@/utils/translation";
import { delay, generateBattleSalt, generateSalt } from "@/utils/utils";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

export interface GameDirectorContext {
  executeGameAction: (action: GameAction) => void;
  actionFailed: number;
  videoQueue: string[];
  setVideoQueue: (videoQueue: string[]) => void;
  processEvent: (event: any, skipDelay?: boolean) => void;
  eventsProcessed: number;
  setEventQueue: (events: any) => void;
  setEventsProcessed: (eventsProcessed: number) => void;
  setSkipCombat: (skipCombat: boolean) => void;
  skipCombat: boolean;
  setShowSkipCombat: (showSkipCombat: boolean) => void;
  showSkipCombat: boolean;
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
  const dungeon = useDungeon();
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
    claimBeast,
    refreshDungeonStats,
  } = useSystemCalls();
  const { getSettingsDetails, getTokenMetadata, getGameState, unclaimedBeast } =
    useStarknetApi();
  const { getGameEvents } = useGameEvents();
  const { gameStartedEvent } = useAnalytics();

  const {
    gameId,
    beast,
    bag,
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
    setShowInventory,
    setShowOverlay,
    setCollectable,
    setMetadata,
    setClaimInProgress,
    spectating,
  } = useGameStore();
  const { setIsOpen } = useMarketStore();
  const { skipAllAnimations, skipIntroOutro, skipFirstBattle, fastBattle } = useUIStore();

  const [VRFEnabled, setVRFEnabled] = useState(VRF_ENABLED);
  const [actionFailed, setActionFailed] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventQueue, setEventQueue] = useState<any[]>([]);
  const [eventsProcessed, setEventsProcessed] = useState(0);
  const [videoQueue, setVideoQueue] = useState<string[]>([]);

  const [skipCombat, setSkipCombat] = useState(false);
  const [showSkipCombat, setShowSkipCombat] = useState(false);
  const [beastDefeated, setBeastDefeated] = useState(false);
  const [optimisticTxs, setOptimisticTxs] = useState<any[]>([]);
  const [startingEvent, setStartingEvent] = useState<GameEvent[] | null>(null);

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
        initializeGame(settings);
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
        await processEvent(event, skipCombat);
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

  useEffect(() => {
    async function checkUnclaimedBeast() {
      let collectable = JSON.parse(localStorage.getItem("collectable_beast")!);
      let isUnclaimed = await unclaimedBeast(collectable.gameId, collectable);
      if (isUnclaimed) {
        setClaimInProgress(true);
        setCollectable(collectable);
        claimBeast(collectable.gameId, collectable);
      } else {
        localStorage.removeItem("collectable_beast");
      }
    }

    if (gameId && localStorage.getItem("collectable_beast")) {
      checkUnclaimedBeast();
    }
  }, [gameId]);

  const initializeGame = async (settings: Settings) => {
    if (spectating) return;

    const gameState = await getGameState(gameId!);

    if (gameState) {
      restoreGameState(gameState);
    } else {
      executeGameAction({ type: "start_game", gameId: gameId!, settings });
      gameStartedEvent({
        adventurerId: gameId!,
        dungeon: dungeon.id,
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
      }, dungeon).beast!;
      setBeast(beast);
      setCollectable(beast.isCollectable ? beast : null);
    }

    if (gameState.adventurer.stat_upgrades_available > 0) {
      setShowInventory(true);
    }
  };

  const processEvent = async (event: any, skipDelay: boolean = false) => {
    if (event.type === "adventurer") {
      setAdventurer(event.adventurer!);
      setSkipCombat(false);
      setShowSkipCombat(false);

      if (event.adventurer!.health === 0 && !skipDelay && !skipIntroOutro) {
        setShowOverlay(false);
        setVideoQueue((prev) => [...prev, streamIds.death]);
      }

      if (
        !skipDelay &&
        event.adventurer!.item_specials_seed &&
        event.adventurer!.item_specials_seed !==
        adventurer?.item_specials_seed &&
        !skipAllAnimations
      ) {
        setShowOverlay(false);
        setVideoQueue((prev) => [...prev, streamIds.specials_unlocked]);
        setShowInventory(true);
      }

      if (event.adventurer!.stat_upgrades_available > 0) {
        setShowInventory(true);
      }

      if (
        event.adventurer!.stat_upgrades_available === 0 &&
        adventurer?.stat_upgrades_available! > 0
      ) {
        setIsOpen(true);
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
      setBeastDefeated(false);
      setCollectable(event.beast!.isCollectable ? event.beast! : null);
    }

    if (event.type === "market_items") {
      setMarketItemIds(event.items!);
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

    if (getVideoId(event) && !skipDelay && !skipAllAnimations) {
      setShowOverlay(false);
      setVideoQueue((prev) => [...prev, getVideoId(event)!]);
    }

    // Jackpot video
    if (
      event.type === "beast" &&
      event.beast!.isCollectable &&
      JACKPOT_BEASTS.includes(event.beast!.name!)
    ) {
      setShowOverlay(false);
      setVideoQueue((prev) => [
        ...prev,
        streamIds[
        `jackpot_${event.beast!.baseName!.toLowerCase()}` as keyof typeof streamIds
        ],
      ]);
    }

    if (delayTimes[event.type] && !skipDelay) {
      if (event.type === "flee" || !fastBattle) {
        await delay(delayTimes[event.type]);
      }
    }
  };

  const executeGameAction = async (action: GameAction) => {
    if (spectating) return;
    let txs: any[] = [...optimisticTxs];

    if (action.type === "start_game") {
      if (
        action.settings.game_seed === 0 &&
        action.settings.adventurer.xp !== 0
      ) {
        txs.push(
          requestRandom(
            generateSalt(action.gameId!, action.settings.adventurer.xp)
          )
        );
      }

      txs.push(startGame(action.gameId!));

      if (action.settings.adventurer.xp === 0) {
        if (VRFEnabled) {
          txs.push(requestRandom(generateBattleSalt(gameId!, 0, 1)));
        }
        txs.push(attack(gameId!, false));
      }
    }

    if (action.type === "attack" && adventurer!.xp === 0 && startingEvent) {
      setEventQueue((prev) => [...prev, ...startingEvent]);
      setStartingEvent(null);
      return;
    }

    if (VRFEnabled && action.type === "explore") {
      txs.push(requestRandom(generateSalt(gameId!, adventurer!.xp)));
    }

    if (VRFEnabled && ["attack", "flee"].includes(action.type)) {
      txs.push(
        requestRandom(
          generateBattleSalt(gameId!, adventurer!.xp, adventurer!.action_count)
        )
      );
    }

    if (
      VRFEnabled &&
      action.type === "equip" &&
      adventurer?.beast_health! > 0
    ) {
      txs.push(
        requestRandom(
          generateBattleSalt(gameId!, adventurer!.xp, adventurer!.action_count)
        )
      );
    }

    let newItemsEquipped = getNewItemsEquipped(
      adventurer?.equipment!,
      adventurerState?.equipment!
    );
    if (action.type !== "equip" && newItemsEquipped.length > 0) {
      setOptimisticTxs((prev) => [...prev, equip(gameId!, newItemsEquipped.map((item) => item.id))]);
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
    } else if (action.type === "equip") {
      txs.push(
        equip(
          gameId!,
          newItemsEquipped.map((item) => item.id)
        )
      );
    } else if (action.type === "drop") {
      txs.push(drop(gameId!, action.items!));
    } else if (action.type === "buy_items") {
      setOptimisticTxs((prev) => [...prev, buyItems(gameId!, action.potions!, action.itemPurchases!)]);
    } else if (action.type === "select_stat_upgrades") {
      setOptimisticTxs((prev) => [...prev, selectStatUpgrades(gameId!, action.statUpgrades!)]);
    }

    const hasOptimisticTx = ['select_stat_upgrades', 'buy_items'].includes(action.type)
    let events = [];
    if (hasOptimisticTx) {
      events = optimisticGameEvents(adventurer!, bag, action);
    } else {
      events = await executeAction(txs, setActionFailed, () => setOptimisticTxs([]));
    }
    if (!events) return;

    if (dungeon.id === "survivor" && events.some((event: any) => event.type === "defeated_beast")) {
      setBeastDefeated(true);

      if (dungeon.id === "survivor" && beast && beast.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK
        && !beast.isCollectable && currentNetworkConfig.beasts) {
        refreshDungeonStats(beast, 10000);
      }
    }

    if (
      events.filter((event: any) => event.type === "beast_attack").length >= 2
    ) {
      setShowSkipCombat(true);
    }

    if (action.type === "start_game" && action.settings.adventurer.xp === 0) {
      if (!skipFirstBattle) {
        setStartingEvent(events.filter((event: any) => event.action_count === 2));
        events = events.filter((event: any) => event.action_count === 1);
      } else {
        events = events.filter((event: any) => event.action_count === 2);
      }
    }

    setEventQueue((prev) => [...prev, ...events]);
  };

  return (
    <GameDirectorContext.Provider
      value={{
        executeGameAction,
        actionFailed,
        videoQueue,
        setVideoQueue,
        eventsProcessed,
        setEventsProcessed,
        processEvent,
        setEventQueue,
        setSkipCombat,
        skipCombat,
        setShowSkipCombat,
        showSkipCombat,
      }}
    >
      {children}
    </GameDirectorContext.Provider>
  );
};

export const useGameDirector = () => {
  return useContext(GameDirectorContext);
};
