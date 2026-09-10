import { describe, expect, it } from "vitest";
import { MatchingService } from "../src/matching/matching.service";
import type { NormalizedOffer, ProductSearchInput } from "@pricelens/shared";

const input: ProductSearchInput = {
  query: "Nike Air Max 270 Black White",
  brand: "Nike",
  model: "Air Max 270",
  country: "PT",
  currency: "EUR"
};

const baseOffer: NormalizedOffer = {
  id: "offer",
  provider: "test",
  storeName: "Store",
  title: "Nike Air Max 270 Black/White",
  brand: "Nike",
  model: "Air Max 270",
  condition: "new",
  productUrl: "https://example.com",
  currency: "EUR",
  itemPrice: 72,
  shippingPrice: 0,
  totalPrice: 72,
  availability: "in_stock",
  storeTrustScore: 90,
  matchConfidence: 98,
  lastUpdatedAt: "2026-09-10T00:00:00.000Z"
};

describe("MatchingService", () => {
  it("marks the same product as exact", () => {
    const service = new MatchingService();

    const [offer] = service.classifyOffers([baseOffer], input);

    expect(offer.matchType).toBe("exact");
    expect(offer.matchReason).toContain("exatamente");
  });

  it("marks related products as similar", () => {
    const service = new MatchingService();

    const [offer] = service.classifyOffers([{ ...baseOffer, title: "Nike Air Max Excee", model: "Air Max Excee", matchConfidence: 87 }], input);

    expect(offer.matchType).toBe("similar");
    expect(offer.matchReason).toContain("visualmente semelhante");
  });
});
