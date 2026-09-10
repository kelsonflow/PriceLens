import type { NormalizedOffer, OfferFilters } from "./types";

export function calculateTotalPrice(offer: Pick<NormalizedOffer, "itemPrice" | "shippingPrice" | "estimatedTax">): number {
  return roundMoney(offer.itemPrice + offer.shippingPrice + (offer.estimatedTax ?? 0));
}

export function normalizeOffer(offer: NormalizedOffer): NormalizedOffer {
  return {
    ...offer,
    productUrl: offer.productUrl.trim(),
    totalPrice: calculateTotalPrice(offer),
    storeTrustScore: clampScore(offer.storeTrustScore),
    matchConfidence: clampScore(offer.matchConfidence),
    lastUpdatedAt: offer.lastUpdatedAt || new Date().toISOString()
  };
}

export function filterValidOffers(offers: NormalizedOffer[]): NormalizedOffer[] {
  return offers
    .map(normalizeOffer)
    .filter((offer) => isValidHttpUrl(offer.productUrl))
    .filter((offer) => offer.availability !== "out_of_stock")
    .filter((offer) => offer.itemPrice >= 0 && offer.shippingPrice >= 0)
    .filter((offer) => offer.currency.length === 3);
}

export function dedupeOffers(offers: NormalizedOffer[]): NormalizedOffer[] {
  const winners = new Map<string, NormalizedOffer>();

  for (const offer of offers) {
    const key = [
      offer.storeName,
      offer.sellerName ?? "",
      offer.brand ?? "",
      offer.model ?? "",
      offer.variant ?? "",
      offer.condition,
      simplifyTitle(offer.title)
    ].join("|");

    const current = winners.get(key);
    if (!current || offer.totalPrice < current.totalPrice || offer.matchConfidence > current.matchConfidence) {
      winners.set(key, offer);
    }
  }

  return [...winners.values()];
}

export function rankOffers(offers: NormalizedOffer[], filters: OfferFilters = {}, limit = 10): NormalizedOffer[] {
  return dedupeOffers(filterValidOffers(offers))
    .filter((offer) => matchesFilters(offer, filters))
    .sort((a, b) => {
      if (a.totalPrice !== b.totalPrice) return a.totalPrice - b.totalPrice;
      if (b.matchConfidence !== a.matchConfidence) return b.matchConfidence - a.matchConfidence;
      return b.storeTrustScore - a.storeTrustScore;
    })
    .slice(0, limit);
}

export function groupOffersByMatch(offers: NormalizedOffer[]) {
  return {
    exact: offers.filter((offer) => offer.matchType === "exact"),
    similar: offers.filter((offer) => offer.matchType !== "exact")
  };
}

export function getOfferBadge(offer: NormalizedOffer, offers: NormalizedOffer[]): "Melhor preco" | "Entrega mais rapida" | "Loja mais confiavel" | undefined {
  const validOffers = rankOffers(offers, {}, offers.length);
  if (validOffers[0]?.id === offer.id) return "Melhor preco";

  const deliverySorted = [...validOffers]
    .filter((item) => item.estimatedDelivery)
    .sort((a, b) => String(a.estimatedDelivery).localeCompare(String(b.estimatedDelivery)));
  if (deliverySorted[0]?.id === offer.id) return "Entrega mais rapida";

  const trustSorted = [...validOffers].sort((a, b) => b.storeTrustScore - a.storeTrustScore);
  if (trustSorted[0]?.id === offer.id) return "Loja mais confiavel";

  return undefined;
}

function matchesFilters(offer: NormalizedOffer, filters: OfferFilters): boolean {
  if (filters.minPrice !== undefined && offer.totalPrice < filters.minPrice) return false;
  if (filters.maxPrice !== undefined && offer.totalPrice > filters.maxPrice) return false;
  if (filters.condition && filters.condition !== "any" && offer.condition !== filters.condition) return false;
  if (filters.freeShippingOnly && offer.shippingPrice > 0) return false;
  if (filters.minRating !== undefined && (offer.sellerRating ?? 0) < filters.minRating) return false;
  if (filters.brand && offer.brand?.toLowerCase() !== filters.brand.toLowerCase()) return false;
  if (filters.store && offer.storeName.toLowerCase() !== filters.store.toLowerCase()) return false;
  return true;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function simplifyTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
