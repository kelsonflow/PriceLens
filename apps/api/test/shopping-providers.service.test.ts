import { describe, expect, it } from "vitest";
import { MockShoppingProvider } from "../src/shopping-providers/mock-shopping.provider";
import { ShoppingProvidersService } from "../src/shopping-providers/shopping-providers.service";

describe("ShoppingProvidersService", () => {
  it("returns normalized and ranked mock offers", async () => {
    const service = new ShoppingProvidersService(new MockShoppingProvider());
    const offers = await service.search({
      query: "iPhone 15",
      country: "PT",
      currency: "EUR"
    });

    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0].totalPrice).toBeLessThanOrEqual(offers[offers.length - 1].totalPrice);
    expect(offers.every((offer) => offer.productUrl.startsWith("https://"))).toBe(true);
  });
});

