import { describe, expect, it } from "vitest";
import { PriceAlertsService } from "../src/price-alerts/price-alerts.service";
import type { ShoppingProvidersService } from "../src/shopping-providers/shopping-providers.service";

describe("PriceAlertsService", () => {
  it("creates and checks a matching price alert", async () => {
    const shoppingProvidersService = {
      search: async () => [
        {
          id: "offer_1",
          provider: "test",
          storeName: "Store",
          title: "iPhone 15",
          condition: "new",
          productUrl: "https://example.com",
          currency: "EUR",
          itemPrice: 699,
          shippingPrice: 0,
          totalPrice: 699,
          availability: "in_stock",
          storeTrustScore: 90,
          matchConfidence: 95,
          lastUpdatedAt: new Date().toISOString()
        }
      ]
    } as unknown as ShoppingProvidersService;
    const service = new PriceAlertsService(shoppingProvidersService);
    const alert = service.create("user-a", { query: "iPhone 15", targetPrice: 700 });

    const result = await service.check("user-a", alert.id);

    expect(result.matched).toBe(true);
    expect(result.bestOffer?.totalPrice).toBe(699);
    expect(service.list("user-a")[0].lastMatchedAt).toBeDefined();
  });
});
