import { create } from 'zustand';
import { Adventurer, Beast, Item, Metadata, Quest, Stats } from '@/types/game';
import { GameEvent } from '@/utils/events';
import { ItemUtils } from '@/utils/loot';
import { getNewItemsEquipped } from '@/utils/game';
import { Settings } from '@/dojo/useGameSettings';

interface GameState {
  gameId: number | null;
  gameSettings: Settings | null;
  adventurer: Adventurer | null;
  adventurerState: Adventurer | null;
  bag: Item[];
  beast: Beast | null;
  showBeastRewards: boolean;
  newMarket: boolean;
  marketItemIds: number[];
  newInventoryItems: number[];
  metadata: Metadata | null;
  exploreLog: GameEvent[];
  battleEvent: GameEvent | null;
  quest: Quest | null;
  showInventory: boolean;
  showOverlay: boolean;
  showSettings: boolean;
  collectable: Beast | null;
  collectableTokenURI: string | null;
  claimInProgress: boolean;
  selectedStats: Stats;
  spectating: boolean;

  setGameId: (gameId: number) => void;
  exitGame: () => void;
  setGameSettings: (data: Settings | null) => void;
  setAdventurer: (data: Adventurer | null) => void;
  setAdventurerState: (data: Adventurer | null) => void;
  setBag: (data: Item[]) => void;
  setBeast: (data: Beast | null) => void;
  setShowBeastRewards: (data: boolean) => void;
  setMarketItemIds: (data: number[]) => void;
  setNewMarket: (data: boolean) => void;
  setNewInventoryItems: (data: number[]) => void;
  setMetadata: (data: Metadata | null) => void;
  setExploreLog: (data: GameEvent) => void;
  popExploreLog: () => void;
  setBattleEvent: (data: GameEvent | null) => void;
  setQuest: (data: Quest | null) => void;
  equipItem: (data: Item) => void;
  undoEquipment: () => void;
  setShowInventory: (show: boolean) => void;
  setShowOverlay: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setCollectable: (data: Beast | null) => void;
  setCollectableTokenURI: (tokenURI: string | null) => void;
  setClaimInProgress: (data: boolean) => void;
  setSelectedStats: (data: Stats) => void;
  setSpectating: (data: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  gameId: null,
  gameSettings: null,
  metadata: null,
  adventurer: null,
  adventurerState: null,
  bag: [],
  beast: null,
  showBeastRewards: false,
  newMarket: false,
  marketItemIds: [],
  newInventoryItems: [],
  exploreLog: [],
  battleEvent: null,
  quest: null,
  showInventory: false,
  showOverlay: true,
  showSettings: false,
  collectable: null,
  collectableTokenURI: null,
  claimInProgress: false,
  selectedStats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0 },
  spectating: false,
  setGameId: (gameId: number) => {
    set({ gameId });
  },
  exitGame: () => {
    set({
      gameId: null,
      gameSettings: null,
      adventurer: null,
      adventurerState: null,
      bag: [],
      beast: null,
      showBeastRewards: false,
      newMarket: false,
      marketItemIds: [],
      newInventoryItems: [],
      metadata: null,
      exploreLog: [],
      battleEvent: null,
      quest: null,
      showInventory: false,
      showOverlay: true,
      showSettings: false,
      collectable: null,
      collectableTokenURI: null,
      selectedStats: { strength: 0, dexterity: 0, vitality: 0, intelligence: 0, wisdom: 0, charisma: 0, luck: 0 },
      claimInProgress: false,
      spectating: false,
    });
  },

  setGameSettings: (data: Settings | null) => set({ gameSettings: data }),

  setAdventurer: (data: Adventurer | null) => set((state) => {
    if (!data || !state.adventurer) {
      return { adventurer: data, adventurerState: data };
    }

    if (data.beast_health === 0) {
      return {
        adventurer: data,
        adventurerState: data,
        beast: null,
        battleEvent: null
      };
    }

    return { adventurer: data, adventurerState: data };
  }),
  setAdventurerState: (data: Adventurer | null) => set({ adventurerState: data }),
  setBag: (data: Item[]) => set({ bag: data }),
  setBeast: (data: Beast | null) => set({ beast: data }),
  setShowBeastRewards: (data: boolean) => set({ showBeastRewards: data }),
  setMarketItemIds: (data: number[]) => set({ marketItemIds: Array.from(new Set(data)) }),
  setNewMarket: (data: boolean) => set({ newMarket: data }),
  setMetadata: (data: Metadata | null) => set({ metadata: data }),
  setNewInventoryItems: (data: number[]) => set({ newInventoryItems: data }),
  setExploreLog: (data: GameEvent) => set((state) => ({ exploreLog: [data, ...state.exploreLog] })),
  popExploreLog: () => set((state) => ({ exploreLog: state.exploreLog.slice(1) })),
  setBattleEvent: (data: GameEvent | null) => set({ battleEvent: data }),
  setQuest: (data: Quest | null) => set({ quest: data }),

  equipItem: (data: Item) => {
    let itemSlot = ItemUtils.getItemSlot(data.id).toLowerCase() as keyof Adventurer['equipment'];
    set((state) => {
      if (!state.adventurer) {
        return state;
      }
      // Get the currently equipped item in this slot (if any)
      const currentEquippedItem = state.adventurer.equipment[itemSlot];

      // Remove the new item from the bag
      const updatedBag = state.bag.filter(item => item.id !== data.id);

      // If there was an item equipped in this slot, add it back to the bag
      if (currentEquippedItem && currentEquippedItem.id !== 0) {
        updatedBag.push(currentEquippedItem);
      }

      let updatedStats = { ...state.adventurer.stats };
      if (currentEquippedItem) {
        updatedStats = ItemUtils.removeItemBoosts(currentEquippedItem, state.adventurer.item_specials_seed, updatedStats);
      }
      updatedStats = ItemUtils.addItemBoosts(data, state.adventurer.item_specials_seed, updatedStats);

      return {
        adventurer: {
          ...state.adventurer,
          equipment: {
            ...state.adventurer.equipment,
            [itemSlot]: data
          },
          stats: updatedStats,
        },
        bag: updatedBag,
      };
    });
  },

  undoEquipment: () => {
    set((state) => {
      if (!state.adventurer || !state.adventurerState) {
        return state;
      }

      // Get the currently equipped item in this slot (if any)
      const newItemsEquipped = getNewItemsEquipped(state.adventurer?.equipment!, state.adventurerState?.equipment!);

      // restore the bag
      const updatedBag = [
        ...state.bag.filter(item => !Object.values(state.adventurerState?.equipment!).find(newItem => newItem.id === item.id)),
        ...newItemsEquipped,
      ];

      return {
        adventurer: {
          ...state.adventurer,
          equipment: state.adventurerState?.equipment,
        },
        stats: state.adventurerState?.stats,
        bag: updatedBag,
      };
    });
  },

  setShowInventory: (show: boolean) => set({ showInventory: show }),
  setShowOverlay: (show: boolean) => set({ showOverlay: show }),
  setShowSettings: (show: boolean) => set({ showSettings: show }),
  setCollectable: (data: Beast | null) => set({ collectable: data, collectableTokenURI: null }),
  setCollectableTokenURI: (tokenURI: string | null) => set({ collectableTokenURI: tokenURI, claimInProgress: false }),
  setSelectedStats: (data: Stats) => set({ selectedStats: data }),
  setClaimInProgress: (data: boolean) => set({ claimInProgress: data }),
  setSpectating: (data: boolean) => set({ spectating: data }),
}));
