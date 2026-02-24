import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SwapStage =
  | "idle"
  | "waiting_deposit"  // Waiting for STRK to arrive from Onramper
  | "deposit_detected" // STRK deposit detected — waiting for user confirmation
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
  walletAddress: string | null;

  /** Amount of STRK deposited (detected by watcher) */
  depositAmount: number | null;

  /** Guard: true while the swap+mint tx is being executed */
  isSwapping: boolean;

  // Actions
  /** Register the on-ramp intent (called when fiat tab opens) */
  startOnramp: (initialBalance: number, wallet: string) => void;
  /** Called by watcher when STRK deposit is detected */
  depositDetected: (amount: number) => void;
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
  gamesMinted: 0,
  errorMessage: null,
  startedAt: null,
  popupDismissed: false,
  onrampStatus: "idle" as OnrampStatus,
  onrampTransactionId: null,
  onrampProvider: null,
  onrampPaymentMethod: null,
  initialStrkBalance: null,
  walletAddress: null,
  depositAmount: null,
  isSwapping: false,
};

export const useSwapStore = create<SwapState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      startOnramp: (initialBalance, wallet) =>
        set({
          stage: "waiting_deposit",
          gamesMinted: 0,
          errorMessage: null,
          startedAt: Date.now(),
          popupDismissed: false,
          initialStrkBalance: initialBalance,
          walletAddress: wallet,
          depositAmount: null,
          isSwapping: false,
          onrampStatus: "idle",
          onrampTransactionId: null,
          onrampProvider: null,
          onrampPaymentMethod: null,
        }),

      depositDetected: (amount: number) =>
        set({
          stage: "deposit_detected",
          depositAmount: amount,
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
        startedAt: state.startedAt,
        onrampStatus: state.onrampStatus,
        onrampTransactionId: state.onrampTransactionId,
        initialStrkBalance: state.initialStrkBalance,
        walletAddress: state.walletAddress,
        depositAmount: state.depositAmount,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<SwapState>;

        // If the persisted flow was interrupted mid-tx, fall back to a safe stage.
        // Prefer deposit_detected when we have a known deposit amount; otherwise
        // resume waiting_deposit so the watcher can detect the next balance change.
        const stage = state.stage;
        const isInterrupted = stage === "quoting" || stage === "swapping" || stage === "minting";
        const safeStage = isInterrupted
          ? (state.depositAmount && state.depositAmount > 0 ? "deposit_detected" : "waiting_deposit")
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
