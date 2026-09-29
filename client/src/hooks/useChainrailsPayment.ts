import { useMemo } from "react";
import { usePaymentSession } from "@chainrails/react";

interface UseChainrailsPaymentParams {
  controllerAddress: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UseChainrailsPaymentResult {
  paymentSession: ReturnType<typeof usePaymentSession>;
}

/**
 * Hook to manage Chainrails payment session.
 * Constructs the session URL and initializes the payment session.
 * 
 * @param controllerAddress - The recipient address for the payment
 * @param onSuccess - Optional callback when payment succeeds
 * @param onCancel - Optional callback when payment is cancelled
 * @returns Object containing the payment session from usePaymentSession
 */
export const useChainrailsPayment = ({
  controllerAddress,
  onSuccess,
  onCancel,
}: UseChainrailsPaymentParams): UseChainrailsPaymentResult => {
  
  const sessionUrl = useMemo(
    () =>
      `https://death-mountain.vercel.app/create-session?recipient=${controllerAddress}&destinationChain=STARKNET&token=USDC`,
    [controllerAddress]
  );

  const paymentSession = usePaymentSession({
    session_url: sessionUrl,
    onSuccess,
    onCancel,
  });

  return { paymentSession };
};

export default useChainrailsPayment;

