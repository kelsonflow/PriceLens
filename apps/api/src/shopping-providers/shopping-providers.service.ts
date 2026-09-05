import { Injectable } from "@nestjs/common";
import { rankOffers, type NormalizedOffer, type OfferFilters, type ProductSearchInput } from "@pricelens/shared";
import { MockShoppingProvider } from "./mock-shopping.provider";
import { SerpApiShoppingProvider } from "./serpapi-shopping.provider";
import type { ShoppingProvider } from "./shopping-provider.interface";

@Injectable()
export class ShoppingProvidersService {
  private readonly providers: ShoppingProvider[];

  constructor(serpApiShoppingProvider: SerpApiShoppingProvider, mockShoppingProvider: MockShoppingProvider) {
    this.providers = [serpApiShoppingProvider, mockShoppingProvider];
  }

  async search(input: ProductSearchInput, filters: OfferFilters = {}): Promise<NormalizedOffer[]> {
    const providerResults = await Promise.all(this.providers.map((provider) => provider.search(input)));
    return rankOffers(providerResults.flat(), filters);
  }
}
