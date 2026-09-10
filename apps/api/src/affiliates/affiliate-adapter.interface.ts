import type { NormalizedOffer } from "@pricelens/shared";

export interface AffiliateAdapter {
  readonly provider: string;
  supports(offer: NormalizedOffer): boolean;
  createUrl(offer: NormalizedOffer): string | undefined;
}
