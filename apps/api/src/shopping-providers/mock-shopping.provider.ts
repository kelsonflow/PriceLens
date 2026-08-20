import { Injectable } from "@nestjs/common";
import { mockOffers, type NormalizedOffer, type ProductSearchInput } from "@pricelens/shared";
import type { ShoppingProvider } from "./shopping-provider.interface";

@Injectable()
export class MockShoppingProvider implements ShoppingProvider {
  readonly provider = "mock";

  async search(input: ProductSearchInput): Promise<NormalizedOffer[]> {
    const normalizedQuery = input.query.toLowerCase();

    return mockOffers
      .filter((offer) => {
        const searchable = `${offer.title} ${offer.brand ?? ""} ${offer.model ?? ""}`.toLowerCase();
        return normalizedQuery.length < 3 || searchable.includes(normalizedQuery.split(" ")[0]);
      })
      .map((offer) => ({
        ...offer,
        lastUpdatedAt: new Date().toISOString()
      }));
  }
}

