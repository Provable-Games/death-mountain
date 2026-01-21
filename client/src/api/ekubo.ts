/**
 * Ekubo API - Price Chart Only
 * Swap functionality uses AVNU SDK (see avnu.ts)
 */

interface PriceDataPoint {
  time: number;
  price: number;
}

interface PriceChartResponse {
  data: PriceDataPoint[];
}

export const getPriceChart = async (token: string, otherToken: string): Promise<PriceChartResponse> => {
  const response = await fetch(`https://prod-api.ekubo.org/price/23448594291968334/${token}/${otherToken}/history?interval=7000`)

  const data = await response.json()

  return {
    data: data?.data || []
  }
}
