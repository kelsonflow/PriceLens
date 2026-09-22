import { afterEach, describe, expect, it } from "vitest";
import { SearchCacheService } from "../src/searches/search-cache.service";

describe("SearchCacheService", () => {
  afterEach(() => {
    delete process.env.SEARCH_CACHE_ENABLED;
    delete process.env.SEARCH_CACHE_TTL_MS;
  });

  it("returns cached results for equivalent search input", () => {
    const cache = new SearchCacheService();
    cache.set({ query: " iPhone 15 ", country: "pt", currency: "eur", condition: "any" }, [{
      id: "offer-1",
      provider: "test",
      storeName: "Test Store",
      title: "iPhone 15",
      condition: "new",
      productUrl: "https://example.com/iphone-15",
      currency: "EUR",
      itemPrice: 799,
      shippingPrice: 0,
      totalPrice: 799,
      availability: "in_stock",
      storeTrustScore: 90,
      matchConfidence: 98,
      lastUpdatedAt: new Date().toISOString()
    }]);

    expect(cache.get({ query: "iphone 15", country: "PT", currency: "EUR", condition: "any" })).toBeDefined();
  });

  it("does not cache empty results", () => {
    const cache = new SearchCacheService();
    cache.set({ query: "unknown product" }, []);

    expect(cache.get({ query: "unknown product" })).toBeUndefined();
  });

  it("can be disabled by env var", () => {
    process.env.SEARCH_CACHE_ENABLED = "false";
    const cache = new SearchCacheService();
    cache.set({ query: "iPhone 15" }, []);

    expect(cache.get({ query: "iPhone 15" })).toBeUndefined();
  });
});
