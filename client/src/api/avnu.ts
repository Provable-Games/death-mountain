import { getQuotes, quoteToCalls, Quote } from '@avnu/avnu-sdk';
import { PaymasterRpc, Call } from 'starknet';

// Integrator configuration for zkorp
// 3% fee = 300 basis points
export const INTEGRATOR_CONFIG = {
  integratorFees: 300n,
  integratorFeeRecipient: '0x066bE88C48b0D71d1Bded275e211C2dDe1EF1c078Fd57ece1313f130Bbc5b859',
  integratorName: 'zkorp',
};

// Paymaster provider for gasless transactions
// Users pay gas in their sell token instead of STRK
export const paymasterProvider = new PaymasterRpc({
  nodeUrl: 'https://starknet.paymaster.avnu.fi',
});

export interface AvnuQuoteResult {
  quote: Quote;
  buyAmount: bigint;
  buyAmountInUsd: number;
  sellAmount: bigint;
  sellAmountInUsd: number;
  priceImpact: number;
  gasFees: bigint;
  gasFeesInUsd: number;
}

/**
 * Get a swap quote from AVNU with integrator fees
 * @param sellAmount - Amount to sell (in token decimals)
 * @param sellToken - Address of token to sell
 * @param buyToken - Address of token to buy
 * @param takerAddress - Address of the user making the swap
 * @returns Quote with routing and fee information
 */
export const getAvnuQuote = async (
  sellAmount: bigint,
  sellToken: string,
  buyToken: string,
  takerAddress: string
): Promise<AvnuQuoteResult> => {
  const quotes = await getQuotes({
    sellTokenAddress: sellToken,
    buyTokenAddress: buyToken,
    sellAmount,
    takerAddress,
    ...INTEGRATOR_CONFIG,
  });

  if (!quotes || quotes.length === 0) {
    throw new Error('No quotes available');
  }

  const quote = quotes[0];

  return {
    quote,
    buyAmount: BigInt(quote.buyAmount),
    buyAmountInUsd: quote.buyAmountInUsd,
    sellAmount: BigInt(quote.sellAmount),
    sellAmountInUsd: quote.sellAmountInUsd,
    priceImpact: quote.priceImpact,
    gasFees: BigInt(quote.gasFees),
    gasFeesInUsd: quote.gasFeesInUsd ?? 0,
  };
};

/**
 * Get a swap quote for buying an exact amount (similar to old getSwapQuote with negative amount)
 * @param buyAmount - Amount to buy (in token decimals, positive)
 * @param buyToken - Address of token to buy
 * @param sellToken - Address of token to sell
 * @param takerAddress - Address of the user making the swap
 * @returns Quote result with amounts
 */
export const getAvnuQuoteForExactOutput = async (
  buyAmount: bigint,
  buyToken: string,
  sellToken: string,
  takerAddress: string
): Promise<AvnuQuoteResult> => {
  const quotes = await getQuotes({
    sellTokenAddress: sellToken,
    buyTokenAddress: buyToken,
    buyAmount,
    takerAddress,
    ...INTEGRATOR_CONFIG,
  });

  if (!quotes || quotes.length === 0) {
    throw new Error('No quotes available');
  }

  const quote = quotes[0];

  return {
    quote,
    buyAmount: BigInt(quote.buyAmount),
    buyAmountInUsd: quote.buyAmountInUsd,
    sellAmount: BigInt(quote.sellAmount),
    sellAmountInUsd: quote.sellAmountInUsd,
    priceImpact: quote.priceImpact,
    gasFees: BigInt(quote.gasFees),
    gasFeesInUsd: quote.gasFeesInUsd ?? 0,
  };
};

/**
 * Generate swap calls from a quote for composing with other transactions
 * @param quote - Quote from getAvnuQuote
 * @param slippage - Slippage tolerance as decimal (e.g., 0.01 for 1%)
 * @param takerAddress - Address of the user making the swap
 * @returns Array of calls to execute
 */
export const generateAvnuSwapCalls = async (
  quote: Quote,
  slippage: number,
  takerAddress: string
): Promise<Call[]> => {
  // AVNU SDK expects slippage as decimal (0-1), e.g., 0.01 for 1%
  const result = await quoteToCalls({
    quoteId: quote.quoteId,
    slippage,
    takerAddress,
  });
  return result.calls;
};

/**
 * Get paymaster parameters for gasless execution
 * User pays gas in their sell token instead of STRK
 * @param gasTokenAddress - Address of token to pay gas with
 * @returns Paymaster configuration object
 */
export const getGaslessPaymasterParams = (gasTokenAddress: string) => {
  return {
    active: true,
    provider: paymasterProvider,
    params: {
      version: '0x1',
      feeMode: {
        mode: 'default' as const,
        gasToken: gasTokenAddress,
      },
    },
  };
};

export type { Quote };
