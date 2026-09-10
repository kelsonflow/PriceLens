import { Injectable } from "@nestjs/common";
import { type NormalizedOffer } from "@pricelens/shared";
import { AmazonAffiliateAdapter } from "./adapters/amazon-affiliate.adapter";
import { EbayAffiliateAdapter } from "./adapters/ebay-affiliate.adapter";
import { GenericAffiliateAdapter } from "./adapters/generic-affiliate.adapter";
import type { AffiliateAdapter } from "./affiliate-adapter.interface";

@Injectable()
export class AffiliateEngineService {
  private readonly adapters: AffiliateAdapter[];

  constructor(
    ebayAffiliateAdapter: EbayAffiliateAdapter,
    amazonAffiliateAdapter: AmazonAffiliateAdapter,
    genericAffiliateAdapter: GenericAffiliateAdapter
  ) {
    this.adapters = [ebayAffiliateAdapter, amazonAffiliateAdapter, genericAffiliateAdapter];
  }

  enrichOffers(offers: NormalizedOffer[]): NormalizedOffer[] {
    return offers.map((offer) => this.enrichOffer(offer));
  }

  enrichOffer(offer: NormalizedOffer): NormalizedOffer {
    const adapter = this.adapters.find((candidate) => candidate.supports(offer));
    const affiliateUrl = adapter?.createUrl(offer);
    if (!adapter || !affiliateUrl) return offer;

    return {
      ...offer,
      affiliateUrl,
      affiliateProvider: adapter.provider,
      affiliateDisclosure: "Podemos receber comissão se comprares através deste link, sem custo adicional para ti."
    };
  }
}
