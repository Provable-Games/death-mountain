import { create } from "zustand";
import { persist } from "zustand/middleware";

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

  /** Persisted on-ramp intent — survives page close */
  initialStrkBalance: number | null;
  strkToInvest: number | null;
  walletAddress: string | null;

  /** Guard: true while the swap+mint tx is being executed */
  isSwapping: boolean;

  // Actions
  startFlow: (games: number) => void;
  /** Register the on-ramp intent (called when fiat tab opens) */
  startOnramp: (initialBalance: number, strkNeeded: number, games: number, wallet: string) => void;
  setStage: (stage: SwapStage) => void;
  setError: (message: string) => void;
  complete: (gamesMinted: number) => void;
  dismissPopup: () => void;
  reset: () => void;
  setIsSwapping: (v: boolean) => void;

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

const INITIAL_STATE = {
  stage: "idle" as SwapStage,
  gamesRequested: 0,
  gamesMinted: 0,
  errorMessage: null,
  startedAt: null,
  popupDismissed: false,
  onrampStatus: "idle" as OnrampStatus,
  onrampTransactionId: null,
  onrampProvider: null,
  onrampPaymentMethod: null,
  initialStrkBalance: null,
  strkToInvest: null,
  walletAddress: null,
  isSwapping: false,
};

export const useSwapStore = create<SwapState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

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

      startOnramp: (initialBalance, strkNeeded, games, wallet) =>
        set({
          stage: "waiting_deposit",
          gamesRequested: games,
          gamesMinted: 0,
          errorMessage: null,
          startedAt: Date.now(),
          popupDismissed: false,
          initialStrkBalance: initialBalance,
          strkToInvest: strkNeeded,
          walletAddress: wallet,
          isSwapping: false,
          onrampStatus: "idle",
          onrampTransactionId: null,
          onrampProvider: null,
          onrampPaymentMethod: null,
        }),

      setStage: (stage: SwapStage) => set({ stage, errorMessage: null }),

      setError: (message: string) => set({ stage: "error", errorMessage: message, isSwapping: false }),

      complete: (gamesMinted: number) =>
        set({
          stage: "done",
          gamesMinted,
          errorMessage: null,
          popupDismissed: false,
          onrampStatus: "completed",
          isSwapping: false,
        }),

      dismissPopup: () => set({ popupDismissed: true }),

      reset: () => set({ ...INITIAL_STATE }),

      setIsSwapping: (v: boolean) => set({ isSwapping: v }),

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
    }),
    {
      name: "death-mountain-swap-flow",
      partialize: (state) => ({
        stage: state.stage,
        gamesRequested: state.gamesRequested,
        startedAt: state.startedAt,
        onrampStatus: state.onrampStatus,
        onrampTransactionId: state.onrampTransactionId,
        initialStrkBalance: state.initialStrkBalance,
        strkToInvest: state.strkToInvest,
        walletAddress: state.walletAddress,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<SwapState>;

        // If the persisted flow was interrupted mid-tx, fall back to waiting_deposit
        // so the watcher can re-evaluate from a clean state
        const stage = state.stage;
        const safeStage =
          stage === "quoting" || stage === "swapping" || stage === "minting"
            ? "waiting_deposit"
            : stage;

        // Don't resume canceled/failed flows
        const onrampStatus = state.onrampStatus;
        if (onrampStatus === "canceled" || onrampStatus === "failed") {
          return currentState; // discard
        }

        return {
          ...currentState,
          ...state,
          stage: safeStage ?? currentState.stage,
          // Always reset transient fields on rehydration
          isSwapping: false,
          errorMessage: null,
          popupDismissed: false,
          gamesMinted: 0,
        };
      },
    }
  )
);
