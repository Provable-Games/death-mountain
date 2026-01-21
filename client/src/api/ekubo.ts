import { num } from "starknet"

interface SwapQuote {
  impact: number;
  total: number;
  splits: SwapSplit[];
}

interface SwapSplit {
  amount_specified: string;
  route: RouteNode[];
}

interface RouteNode {
  pool_key: {
    token0: string;
    token1: string;
    fee: string;
    tick_spacing: string;
    extension: string;
  };
  sqrt_ratio_limit: string;
  skip_ahead: string;
}

interface TokenQuote {
  tokenAddress: string;
  minimumAmount: number;
  quote?: SwapQuote;
}

interface RouterContract {
  address: string;
  populate: (method: string, params: any[]) => any;
}

interface SwapCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export const getPriceChart = async (token: string, otherToken: string) => {
  const response = await fetch(`https://prod-api.ekubo.org/price/23448594291968334/${token}/${otherToken}/history?interval=7000`)

  const data = await response.json()

  return {
    data: data?.data || []
  }
}

export const getSwapQuote = async (amount: number, token: string, otherToken: string): Promise<SwapQuote> => {
  const response = await fetch(`https://prod-api-quoter.ekubo.org/23448594291968334/${amount}/${token}/${otherToken}`)

  const data = await response.json()

  return {
    impact: data?.price_impact || 0,
    total: data?.total_calculated || 0,
    splits: data?.splits || [],
  }
}

export const generateSwapCalls = (ROUTER_CONTRACT: RouterContract, purchaseToken: string, tokenQuote: TokenQuote): SwapCall[] => {
  let totalQuoteSum = 0n;

  if (tokenQuote.quote && tokenQuote.quote.splits.length > 0) {
    const total = BigInt(tokenQuote.quote.total);
    totalQuoteSum = total < 0n ? -total : total;
  }

  const totalWithBuffer = totalQuoteSum * 100n / 99n;

  const transferCall: SwapCall = {
    contractAddress: purchaseToken,
    entrypoint: "transfer",
    calldata: [ROUTER_CONTRACT.address, num.toHex(totalWithBuffer), "0x0"],
  };

  const clearCall: SwapCall = {
    contractAddress: ROUTER_CONTRACT.address,
    entrypoint: "clear",
    calldata: [purchaseToken],
  };

  let { tokenAddress, minimumAmount, quote } = tokenQuote;

  if (!quote || quote.splits.length === 0) {
    return [transferCall, clearCall];
  }

  let { splits } = quote;

  const clearProfitsCall = ROUTER_CONTRACT.populate("clear_minimum", [
    { contract_address: tokenAddress },
    minimumAmount * 1e18,
  ]);

  let swapCalls: SwapCall[];

  if (splits.length === 1) {
    const split = splits[0];

    swapCalls = [
      {
        contractAddress: ROUTER_CONTRACT.address,
        entrypoint: "multihop_swap",
        calldata: [
          num.toHex(split.route.length),
          ...split.route.reduce((memo: { token: string; encoded: string[] }, routeNode: RouteNode) => {
            const isToken1 = BigInt(memo.token) === BigInt(routeNode.pool_key.token1);

            return {
              token: isToken1 ? routeNode.pool_key.token0 : routeNode.pool_key.token1,
              encoded: memo.encoded.concat([
                routeNode.pool_key.token0,
                routeNode.pool_key.token1,
                routeNode.pool_key.fee,
                num.toHex(routeNode.pool_key.tick_spacing),
                routeNode.pool_key.extension,
                num.toHex(BigInt(routeNode.sqrt_ratio_limit) % 2n ** 128n),
                num.toHex(BigInt(routeNode.sqrt_ratio_limit) >> 128n),
                routeNode.skip_ahead,
              ]),
            };
          }, {
            token: tokenAddress,
            encoded: [],
          }).encoded,
          tokenAddress,
          num.toHex(BigInt(split.amount_specified) < 0n ? -BigInt(split.amount_specified) : BigInt(split.amount_specified)),
          "0x1",
        ],
      },
      clearProfitsCall,
    ];
  } else {
    swapCalls = [
      {
        contractAddress: ROUTER_CONTRACT.address,
        entrypoint: "multi_multihop_swap",
        calldata: [
          num.toHex(splits.length),
          ...splits.reduce((memo: string[], split: SwapSplit) => {
            return memo.concat([
              num.toHex(split.route.length),
              ...split.route.reduce((memo: { token: string; encoded: string[] }, routeNode: RouteNode) => {
                const isToken1 = BigInt(memo.token) === BigInt(routeNode.pool_key.token1);

                return {
                  token: isToken1 ? routeNode.pool_key.token0 : routeNode.pool_key.token1,
                  encoded: memo.encoded.concat([
                    routeNode.pool_key.token0,
                    routeNode.pool_key.token1,
                    routeNode.pool_key.fee,
                    num.toHex(routeNode.pool_key.tick_spacing),
                    routeNode.pool_key.extension,
                    num.toHex(BigInt(routeNode.sqrt_ratio_limit) % 2n ** 128n),
                    num.toHex(BigInt(routeNode.sqrt_ratio_limit) >> 128n),
                    routeNode.skip_ahead,
                  ]),
                };
              },
                {
                  token: tokenAddress,
                  encoded: [],
                }
              ).encoded,
              tokenAddress,
              num.toHex(BigInt(split.amount_specified) < 0n ? -BigInt(split.amount_specified) : BigInt(split.amount_specified)),
              "0x1",
            ]);
          }, []),
        ],
      },
      clearProfitsCall
    ];
  }

  return [
    transferCall,
    ...swapCalls,
    clearCall
  ];
}
