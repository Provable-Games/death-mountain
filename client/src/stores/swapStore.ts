import { create } from "zustand";

export type SwapStage =
  | "idle"
  | "waiting_deposit"  // Waiting for STRK to arrive from Onramper
  | "quoting"          // Fetching swap quote from Ekubo
  | "swapping"         // Executing STRK -> TICKET swap on-chain
  | "minting"          // Minting game tokens from tickets
  | "done"             // All complete — games are ready
  | "error";           // Something failed

/** Onramper transaction statuses from webhooks/postMessage */
export type OnrampStatus =
  | "idle"              // No on-ramp activity yet
  | "new"               // Transaction created, no payment yet
  | "pending"           // Transaction in progress, awaiting action
  | "paid"              // Payment made, crypto not yet delivered
  | "completed"         // Transaction complete, crypto delivered
  | "canceled"          // Canceled by user or system
  | "failed";           // Transaction failed

interface SwapState {
  stage: SwapStage;
  gamesRequested: number;
  gamesMinted: number;
  errorMessage: string | null;
  /** Timestamp (ms) when the current flow started */
  startedAt: number | null;
  /** Whether the "games ready" popup has been dismissed */
  popupDismissed: boolean;

  /** Onramper-specific transaction tracking */
  onrampStatus: OnrampStatus;
  onrampTransactionId: string | null;
  onrampProvider: string | null;
  onrampPaymentMethod: string | null;

  // Actions
  startFlow: (games: number) => void;
  setStage: (stage: SwapStage) => void;
  setError: (message: string) => void;
  complete: (gamesMinted: number) => void;
  dismissPopup: () => void;
  reset: () => void;

  // Onramp-specific actions
  setOnrampStatus: (status: OnrampStatus) => void;
  setOnrampTransaction: (data: {
    transactionId?: string;
    provider?: string;
    paymentMethod?: string;
    status?: OnrampStatus;
  }) => void;
  resetOnramp: () => void;
}

export const useSwapStore = create<SwapState>((set) => ({
  stage: "idle",
  gamesRequested: 0,
  gamesMinted: 0,
  errorMessage: null,
  startedAt: null,
  popupDismissed: false,

  onrampStatus: "idle",
  onrampTransactionId: null,
  onrampProvider: null,
  onrampPaymentMethod: null,

  startFlow: (games: number) =>
    set({
      stage: "waiting_deposit",
      gamesRequested: games,
      gamesMinted: 0,
      errorMessage: null,
      startedAt: Date.now(),
      popupDismissed: false,
      onrampStatus: "idle",
      onrampTransactionId: null,
      onrampProvider: null,
      onrampPaymentMethod: null,
    }),

  setStage: (stage: SwapStage) => set({ stage, errorMessage: null }),

  setError: (message: string) => set({ stage: "error", errorMessage: message }),

  complete: (gamesMinted: number) =>
    set({
      stage: "done",
      gamesMinted,
      errorMessage: null,
      popupDismissed: false,
      onrampStatus: "completed",
    }),

  dismissPopup: () => set({ popupDismissed: true }),

  reset: () =>
    set({
      stage: "idle",
      gamesRequested: 0,
      gamesMinted: 0,
      errorMessage: null,
      startedAt: null,
      popupDismissed: false,
      onrampStatus: "idle",
      onrampTransactionId: null,
      onrampProvider: null,
      onrampPaymentMethod: null,
    }),

  setOnrampStatus: (status: OnrampStatus) => set({ onrampStatus: status }),

  setOnrampTransaction: (data) =>
    set((state) => ({
      onrampTransactionId: data.transactionId ?? state.onrampTransactionId,
      onrampProvider: data.provider ?? state.onrampProvider,
      onrampPaymentMethod: data.paymentMethod ?? state.onrampPaymentMethod,
      onrampStatus: data.status ?? state.onrampStatus,
    })),

  resetOnramp: () =>
    set({
      onrampStatus: "idle",
      onrampTransactionId: null,
      onrampProvider: null,
      onrampPaymentMethod: null,
    }),
}));
