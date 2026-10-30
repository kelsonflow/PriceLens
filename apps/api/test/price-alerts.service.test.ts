import { describe, expect, it } from "vitest";
import { PriceAlertsService } from "../src/price-alerts/price-alerts.service";
import type { SearchesService } from "../src/searches/searches.service";
import type { FirebaseAdminService } from "../src/firebase-admin/firebase-admin.service";
import type { NotificationsService } from "../src/notifications/notifications.service";

describe("PriceAlertsService", () => {
  it("creates and checks a matching price alert", async () => {
    const searchesService = {
      searchOffers: async () => ({ results: [
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
      ] })
    } as unknown as SearchesService;
    const records = new Map<string, unknown>();
    const firebase = {
      firestore: {
        collection: () => ({
          doc: (requestedId?: string) => {
            const id = requestedId ?? "alert_1";
            return { id, set: async (value: unknown) => { records.set(id, value); }, get: async () => ({ data: () => records.get(id) }), delete: async () => { records.delete(id); } };
          },
          where: (_field: string, _operator: string, value: unknown) => ({ get: async () => ({ docs: [...records.values()].filter((item) => (item as { userId?: string }).userId === value).map((item) => ({ data: () => item })) }) })
        }),
        batch: () => ({ delete: () => undefined, commit: async () => undefined })
      }
    } as unknown as FirebaseAdminService;
    const notifications = { sendPriceAlert: async () => ({ sent: 1, failed: 0 }) } as unknown as NotificationsService;
    const service = new PriceAlertsService(searchesService, firebase, notifications);
    const alert = await service.create("user-a", { query: "iPhone 15", targetPrice: 700 });

    const result = await service.check("user-a", alert.id);

    expect(result.matched).toBe(true);
    expect(result.bestOffer?.totalPrice).toBe(699);
    expect((await service.list("user-a"))[0].lastMatchedAt).toBeDefined();
  });
});
