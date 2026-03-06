import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SwapStage =
  | "idle"
  | "waiting_deposit"  // Waiting for STRK to arrive
  | "deposit_detected" // STRK deposit detected
  | "quoting"          // Fetching swap quote from Ekubo
  | "swapping"         // Executing STRK -> TICKET swap
  | "minting"          // Minting game tokens
  | "done"             // All complete
  | "error";           // Something failed

export type OnrampStatus =
  | "idle" | "new" | "pending" | "paid" | "completed" | "canceled" | "failed";

/** Which provider initiated the deposit flow */
export type DepositSource = "onramper" | "chainrails";
interface SwapState {
  stage: SwapStage;
  gamesMinted: number;
  errorMessage: string | null;
  startedAt: number | null;
  popupDismissed: boolean;
  onrampStatus: OnrampStatus;
  onrampTransactionId: string | null;
  onrampProvider: string | null;
  onrampPaymentMethod: string | null;
  initialStrkBalance: number | null;
  walletAddress: string | null;
  depositAmount: number | null;
  isSwapping: boolean;
  depositSource: DepositSource | null;

  startOnramp: (initialBalance: number, wallet: string, source?: DepositSource) => void;
  depositDetected: (amount: number) => void;
  setStage: (stage: SwapStage) => void;
  setError: (message: string) => void;
  complete: (gamesMinted: number) => void;
  dismissPopup: () => void;
  reset: () => void;
  setIsSwapping: (v: boolean) => void;
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
  depositSource: null,
};

export const useSwapStore = create<SwapState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      startOnramp: (initialBalance, wallet, source) =>
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
          depositSource: source || "onramper",
        }),

      depositDetected: (amount: number) =>
        set({ stage: "deposit_detected", depositAmount: amount }),

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
        depositSource: state.depositSource,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<SwapState>;
        const stage = state.stage;
        const isInterrupted = stage === "quoting" || stage === "swapping" || stage === "minting";
        const safeStage = isInterrupted
          ? (state.depositAmount && state.depositAmount > 0 ? "deposit_detected" : "waiting_deposit")
          : stage;

        const onrampStatus = state.onrampStatus;
        if (onrampStatus === "canceled" || onrampStatus === "failed") {
          return currentState;
        }

        return {
          ...currentState,
          ...state,
          stage: safeStage ?? currentState.stage,
          isSwapping: false,
          errorMessage: null,
          popupDismissed: false,
          gamesMinted: 0,
        };
      },
    }
  )
);
