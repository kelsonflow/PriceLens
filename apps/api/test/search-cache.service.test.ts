import { afterEach, describe, expect, it } from "vitest";
import { SearchCacheService } from "../src/searches/search-cache.service";

describe("SearchCacheService", () => {
  afterEach(() => {
    delete process.env.SEARCH_CACHE_ENABLED;
    delete process.env.SEARCH_CACHE_TTL_MS;
  });

  it("returns cached results for equivalent search input", () => {
    const cache = new SearchCacheService();
    cache.set({ query: " iPhone 15 ", country: "pt", currency: "eur", condition: "any" }, []);

    expect(cache.get({ query: "iphone 15", country: "PT", currency: "EUR", condition: "any" })).toBeDefined();
  });

  it("can be disabled by env var", () => {
    process.env.SEARCH_CACHE_ENABLED = "false";
    const cache = new SearchCacheService();
    cache.set({ query: "iPhone 15" }, []);

    expect(cache.get({ query: "iPhone 15" })).toBeUndefined();
  });
});
