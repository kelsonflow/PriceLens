import { describe, expect, it } from "vitest";
import { activeAlertCount, isEligibleAlertOffer, PriceAlertsService, type PriceAlert } from "../src/price-alerts/price-alerts.service";
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
          matchType: "exact",
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

  it("rejects similar, uncertain, and unavailable offers for notifications", () => {
    const offer = {
      id: "offer_1", provider: "test", storeName: "Store", title: "Product", condition: "new" as const,
      productUrl: "https://example.com", currency: "EUR", itemPrice: 1.23, shippingPrice: 0,
      totalPrice: 1.23, availability: "in_stock" as const, storeTrustScore: 90, matchConfidence: 95,
      matchType: "exact" as const, lastUpdatedAt: new Date().toISOString()
    };

    expect(isEligibleAlertOffer(offer)).toBe(true);
    expect(isEligibleAlertOffer({ ...offer, matchType: "similar" })).toBe(false);
    expect(isEligibleAlertOffer({ ...offer, matchConfidence: 60 })).toBe(false);
    expect(isEligibleAlertOffer({ ...offer, availability: "out_of_stock" })).toBe(false);
  });

  it("counts only enabled alerts against the Premium limit", () => {
    const alert = { enabled: true } as PriceAlert;
    expect(activeAlertCount([alert, { ...alert, enabled: false }])).toBe(1);
  });
});
