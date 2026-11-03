import { describe, expect, it } from "vitest";
import type { NormalizedOffer } from "@pricelens/shared";
import { filterOffers } from "./offer-filters";

const base = {
  provider: "test", storeName: "Store", title: "Product", productUrl: "https://example.com",
  currency: "EUR", itemPrice: 10, estimatedTax: 0, totalPrice: 10, availability: "in_stock",
  storeTrustScore: 90, matchConfidence: 99, lastUpdatedAt: "2026-10-31T00:00:00Z"
} satisfies Partial<NormalizedOffer>;

const offers = [
  { ...base, id: "new-free", condition: "new", shippingPrice: 0 },
  { ...base, id: "new-paid", condition: "new", shippingPrice: 5, totalPrice: 15 },
  { ...base, id: "used-free", condition: "used", shippingPrice: 0 }
] as NormalizedOffer[];

describe("filterOffers", () => {
  it("filters new and free-shipping offers independently", () => {
    expect(filterOffers(offers, { newOnly: true, freeShippingOnly: false }).map(x=>x.id)).toEqual(["new-free","new-paid"]);
    expect(filterOffers(offers, { newOnly: false, freeShippingOnly: true }).map(x=>x.id)).toEqual(["new-free","used-free"]);
  });

  it("combines filters", () => {
    expect(filterOffers(offers, { newOnly: true, freeShippingOnly: true }).map(x=>x.id)).toEqual(["new-free"]);
  });
});
