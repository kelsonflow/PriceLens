import { afterEach, describe, expect, it, vi } from "vitest";
import { SerpApiShoppingProvider } from "../src/shopping-providers/serpapi-shopping.provider";

describe("SerpApiShoppingProvider", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    delete process.env.SERPAPI_API_KEY;
    delete process.env.SERPAPI_MAX_RESULTS;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns no offers when the API key is not configured", async () => {
    const provider = new SerpApiShoppingProvider();

    await expect(provider.search({ query: "iPhone 15", country: "PT", currency: "EUR" })).resolves.toEqual([]);
  });

  it("maps Google Shopping results to normalized offers", async () => {
    process.env.SERPAPI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        shopping_results: [
          {
            position: 1,
            title: "Apple iPhone 15 128GB Preto",
            source: "Loja Exemplo",
            link: "https://example.com/iphone-15",
            thumbnail: "https://example.com/iphone-15.jpg",
            price: "799,00 €",
            extracted_price: 799,
            rating: 4.7,
            delivery: "Envio grátis"
          }
        ]
      })
    } as Response);

    const provider = new SerpApiShoppingProvider();
    const offers = await provider.search({ query: "iPhone 15", model: "128GB", country: "PT", currency: "EUR" });

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      provider: "serpapi",
      storeName: "Loja Exemplo",
      title: "Apple iPhone 15 128GB Preto",
      productUrl: "https://example.com/iphone-15",
      currency: "EUR",
      itemPrice: 799,
      shippingPrice: 0,
      totalPrice: 799,
      condition: "new"
    });
    expect(offers[0].matchConfidence).toBeGreaterThanOrEqual(80);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("engine=google_shopping"));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("google_domain=google.pt"));
  });
});
