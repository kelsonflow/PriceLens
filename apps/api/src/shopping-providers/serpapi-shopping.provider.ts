import { Injectable, Logger } from "@nestjs/common";
import { type NormalizedOffer, type OfferCondition, type ProductSearchInput } from "@pricelens/shared";
import type { ShoppingProvider } from "./shopping-provider.interface";

interface SerpApiShoppingResult {
  position?: number;
  title?: string;
  source?: string;
  seller?: string;
  link?: string;
  product_link?: string;
  serpapi_product_api?: string;
  thumbnail?: string;
  price?: string;
  extracted_price?: number;
  rating?: number;
  reviews?: number;
  delivery?: string;
  extensions?: string[];
  tag?: string;
}

interface SerpApiShoppingResponse {
  shopping_results?: SerpApiShoppingResult[];
  error?: string;
}

@Injectable()
export class SerpApiShoppingProvider implements ShoppingProvider {
  readonly provider = "serpapi";
  private readonly logger = new Logger(SerpApiShoppingProvider.name);

  async search(input: ProductSearchInput): Promise<NormalizedOffer[]> {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return [];
    }

    const query = buildSearchQuery(input);
    const params = new URLSearchParams({
      engine: "google_shopping",
      api_key: apiKey,
      q: query,
      gl: (input.country || "PT").toLowerCase(),
      hl: "pt",
      google_domain: googleDomainForCountry(input.country),
      num: String(Number(process.env.SERPAPI_MAX_RESULTS ?? 20))
    });

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    if (!response.ok) {
      this.logger.warn(`SerpApi request failed with status ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SerpApiShoppingResponse;
    if (data.error) {
      this.logger.warn(`SerpApi returned an error: ${data.error}`);
      return [];
    }

    return (data.shopping_results ?? [])
      .map((result, index) => this.toOffer(result, input, index))
      .filter((offer): offer is NormalizedOffer => Boolean(offer));
  }

  private toOffer(result: SerpApiShoppingResult, input: ProductSearchInput, index: number): NormalizedOffer | undefined {
    const title = result.title?.trim();
    const productUrl = result.link || result.product_link || result.serpapi_product_api;
    const itemPrice = typeof result.extracted_price === "number" ? result.extracted_price : parsePrice(result.price);

    if (!title || !productUrl || itemPrice === undefined) {
      return undefined;
    }

    const shippingPrice = parseShipping(result.delivery);
    const storeName = result.source?.trim() || result.seller?.trim() || "Loja";
    const condition = inferCondition([title, ...(result.extensions ?? [])].join(" "));

    return {
      id: `serpapi_${result.position ?? index + 1}_${hashId(productUrl)}`,
      provider: this.provider,
      storeName,
      sellerName: result.seller?.trim() || undefined,
      title,
      brand: input.brand,
      model: input.model,
      condition,
      productUrl,
      imageUrl: result.thumbnail,
      currency: normalizeCurrency(input.currency),
      itemPrice,
      shippingPrice,
      totalPrice: itemPrice + shippingPrice,
      availability: "unknown",
      estimatedDelivery: result.delivery?.trim() || undefined,
      sellerRating: result.rating,
      storeTrustScore: trustScore(result.rating),
      matchConfidence: matchConfidence(title, input),
      isSponsored: isSponsored(result),
      sponsoredDisclosure: isSponsored(result) ? "Resultado patrocinado indicado pela fonte." : undefined,
      lastUpdatedAt: new Date().toISOString()
    };
  }
}

function buildSearchQuery(input: ProductSearchInput): string {
  return [input.query, input.brand, input.model, input.category].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function googleDomainForCountry(country?: string): string {
  return country?.toUpperCase() === "PT" ? "google.pt" : "google.com";
}

function normalizeCurrency(currency?: string): string {
  return (currency || "EUR").toUpperCase().slice(0, 3);
}

function parsePrice(value?: string): number | undefined {
  if (!value) return undefined;
  const numeric = value.replace(/[^\d,.]/g, "");
  if (!numeric) return undefined;

  const comma = numeric.lastIndexOf(",");
  const dot = numeric.lastIndexOf(".");
  const decimalSeparator = comma > dot ? "," : ".";
  const normalized = numeric
    .replace(decimalSeparator === "," ? /\./g : /,/g, "")
    .replace(decimalSeparator, ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : undefined;
}

function parseShipping(value?: string): number {
  if (!value) return 0;
  const lower = value.toLowerCase();
  if (lower.includes("free") || lower.includes("gratis") || lower.includes("grátis")) return 0;
  return parsePrice(value) ?? 0;
}

function inferCondition(value: string): OfferCondition {
  const lower = value.toLowerCase();
  if (lower.includes("refurb") || lower.includes("recondicionado")) return "refurbished";
  if (lower.includes("used") || lower.includes("usado") || lower.includes("segunda mão")) return "used";
  return "new";
}

function trustScore(rating?: number): number {
  if (typeof rating !== "number" || !Number.isFinite(rating)) return 72;
  return Math.min(100, Math.max(45, Math.round((rating / 5) * 100)));
}

function matchConfidence(title: string, input: ProductSearchInput): number {
  const titleTokens = tokenize(title);
  const queryTokens = [...tokenize(buildSearchQuery(input))];
  if (queryTokens.length === 0) return 60;
  const matches = queryTokens.filter((token) => titleTokens.has(token)).length;
  return Math.min(98, Math.max(55, Math.round((matches / queryTokens.length) * 100)));
}

function tokenize(value: string): Set<string> {
  return new Set(value.toLowerCase().replace(/[^a-z0-9çáàãâéêíóôõúüñ]+/gi, " ").split(/\s+/).filter((token) => token.length > 1));
}

function isSponsored(result: SerpApiShoppingResult): boolean {
  const values = [result.tag, ...(result.extensions ?? [])].join(" ").toLowerCase();
  return values.includes("sponsored") || values.includes("patrocin");
}

function hashId(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}
