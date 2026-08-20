import { describe, expect, it } from "vitest";
import { calculateTotalPrice, dedupeOffers, filterValidOffers, rankOffers } from "../src/offers";
import type { NormalizedOffer } from "../src/types";

const baseOffer: NormalizedOffer = {
  id: "base",
  provider: "test",
  storeName: "Store",
  title: "Apple iPhone 15 128GB Black",
  brand: "Apple",
  model: "iPhone 15",
  variant: "128GB Black",
  condition: "new",
  productUrl: "https://example.com/item",
  currency: "EUR",
  itemPrice: 700,
  shippingPrice: 10,
  totalPrice: 710,
  availability: "in_stock",
  storeTrustScore: 80,
  matchConfidence: 90,
  lastUpdatedAt: "2026-08-20T12:00:00.000Z"
};

describe("offer utilities", () => {
  it("calculates total price with shipping and estimated tax", () => {
    expect(calculateTotalPrice({ itemPrice: 100, shippingPrice: 4.99, estimatedTax: 10 })).toBe(114.99);
  });

  it("filters invalid URLs and out of stock offers", () => {
    const offers = [
      baseOffer,
      { ...baseOffer, id: "bad-url", productUrl: "not-a-url" },
      { ...baseOffer, id: "out", availability: "out_of_stock" as const }
    ];

    expect(filterValidOffers(offers).map((offer) => offer.id)).toEqual(["base"]);
  });

  it("deduplicates same seller and variant by keeping the cheaper offer", () => {
    const offers = [
      baseOffer,
      { ...baseOffer, id: "cheaper", itemPrice: 680, shippingPrice: 5, totalPrice: 685 }
    ];

    expect(dedupeOffers(offers)).toHaveLength(1);
    expect(dedupeOffers(offers)[0].id).toBe("cheaper");
  });

  it("ranks offers by total price and limits to ten", () => {
    const offers = Array.from({ length: 12 }, (_, index) => ({
      ...baseOffer,
      id: `offer-${index}`,
      productUrl: `https://example.com/item-${index}`,
      itemPrice: 100 + index,
      shippingPrice: 0,
      totalPrice: 100 + index,
      variant: `${index}`
    }));

    const ranked = rankOffers(offers);

    expect(ranked).toHaveLength(10);
    expect(ranked[0].id).toBe("offer-0");
    expect(ranked[9].id).toBe("offer-9");
  });
});

