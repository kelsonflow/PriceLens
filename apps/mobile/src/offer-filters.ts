import type { NormalizedOffer } from "@pricelens/shared";

export interface OfferFilterState {
  newOnly: boolean;
  freeShippingOnly: boolean;
}

export function filterOffers(offers: NormalizedOffer[], filters: OfferFilterState) {
  return offers.filter((offer) => {
    if (filters.newOnly && offer.condition !== "new") return false;
    if (filters.freeShippingOnly && offer.shippingPrice !== 0) return false;
    return true;
  });
}
