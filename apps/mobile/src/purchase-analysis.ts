export type PricePoint = { price: number; observedAt: string };
export type PriceRating = "good" | "normal" | "high" | "insufficient";

export interface PurchaseAnalysis {
  rating: PriceRating;
  current: number;
  minimum: number;
  maximum: number;
  median: number;
  changeFromMedian: number;
}

export function analysePurchase(points: PricePoint[]): PurchaseAnalysis | null {
  const valid = points.filter((point) => Number.isFinite(point.price) && point.price > 0);
  if (!valid.length) return null;
  const prices = valid.map((point) => point.price).sort((a, b) => a - b);
  const current = valid.at(-1)!.price;
  const middle = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[middle] : (prices[middle - 1] + prices[middle]) / 2;
  const minimum = prices[0];
  const maximum = prices.at(-1)!;
  const changeFromMedian = median ? (current - median) / median : 0;
  const rating: PriceRating = valid.length < 2 ? "insufficient"
    : current <= minimum * 1.05 || changeFromMedian <= -0.1 ? "good"
      : changeFromMedian >= 0.1 ? "high" : "normal";
  return { rating, current, minimum, maximum, median, changeFromMedian };
}
