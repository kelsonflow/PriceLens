import { describe, expect, it } from "vitest";
import { analysePurchase } from "./purchase-analysis";

const points = (prices: number[]) => prices.map((price, index) => ({ price, observedAt: `2026-11-${String(index + 1).padStart(2, "0")}` }));

describe("analysePurchase", () => {
  it("marks a price near the historical minimum as good", () => expect(analysePurchase(points([120, 110, 100, 92]))?.rating).toBe("good"));
  it("marks a price materially above the median as high", () => expect(analysePurchase(points([80, 82, 85, 110]))?.rating).toBe("high"));
  it("marks a price around the median as normal", () => expect(analysePurchase(points([90, 100, 110, 102]))?.rating).toBe("normal"));
  it("does not claim a deal from one observation", () => expect(analysePurchase(points([99]))?.rating).toBe("insufficient"));
});
