import { afterEach, describe, expect, it, vi } from "vitest";
import { SubscriptionsService } from "../src/subscriptions/subscriptions.service";

describe("SubscriptionsService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.REVENUECAT_SECRET_API_KEY;
  });

  it("rechecks a user after a negative result so a new purchase is recognized", async () => {
    process.env.REVENUECAT_SECRET_API_KEY = "secret";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(null))
      .mockResolvedValueOnce(response("2099-01-01T00:00:00Z"));
    vi.stubGlobal("fetch", fetchMock);
    const service = new SubscriptionsService();

    await expect(service.isPremium("user-1")).resolves.toBe(false);
    await expect(service.isPremium("user-1")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caches an active entitlement", async () => {
    process.env.REVENUECAT_SECRET_API_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue(response("2099-01-01T00:00:00Z"));
    vi.stubGlobal("fetch", fetchMock);
    const service = new SubscriptionsService();

    await expect(service.isPremium("user-1")).resolves.toBe(true);
    await expect(service.isPremium("user-1")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

function response(expiresDate: string | null) {
  return {
    ok: true,
    json: async () => ({
      subscriber: {
        entitlements: expiresDate ? { premium: { expires_date: expiresDate } } : {}
      }
    })
  };
}
