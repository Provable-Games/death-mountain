import { create } from 'zustand';
import { MarketItem } from '@/utils/market';
import { Tier } from '@/utils/loot';

interface MarketState {
  isOpen: boolean;
  cart: {
    potions: number;
    items: MarketItem[];
  };
  slotFilter: string | null;
  typeFilter: string | null;
  tierFilter: Tier | null;
  showFilters: boolean;

  setIsOpen: (isOpen: boolean) => void;
  setSlotFilter: (filter: string | null) => void;
  setTypeFilter: (filter: string | null) => void;
  setTierFilter: (filter: Tier | null) => void;
  addToCart: (item: MarketItem) => void;
  removeFromCart: (item: MarketItem) => void;
  setPotions: (count: number) => void;
  clearCart: () => void;
  setShowFilters: (show: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  isOpen: false,
  cart: {
    potions: 0,
    items: [],
  },
  slotFilter: null,
  typeFilter: null,
  tierFilter: null,
  showFilters: false,

  setIsOpen: (isOpen) => set({ isOpen }),
  setSlotFilter: (filter) => set({ slotFilter: filter }),
  setTypeFilter: (filter) => set({ typeFilter: filter }),
  setTierFilter: (filter) => set({ tierFilter: filter }),
  addToCart: (item) => set((state) => ({
    cart: {
      ...state.cart,
      items: [...state.cart.items, item],
    },
  })),
  removeFromCart: (item) => set((state) => ({
    cart: {
      ...state.cart,
      items: state.cart.items.filter((i) => i.id !== item.id),
    },
  })),
  setPotions: (count) => set((state) => ({
    cart: {
      ...state.cart,
      potions: count,
    },
  })),
  clearCart: () => set({
    cart: {
      potions: 0,
      items: [],
    },
    slotFilter: null,
    typeFilter: null,
    tierFilter: null,
  }),
  setShowFilters: (show) => set({ showFilters: show }),
})); 