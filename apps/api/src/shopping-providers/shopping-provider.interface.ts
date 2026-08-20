import type { NormalizedOffer, ProductSearchInput } from "@pricelens/shared";

export interface ShoppingProvider {
  readonly provider: string;
  search(input: ProductSearchInput): Promise<NormalizedOffer[]>;
}

