import { afterEach, describe, expect, it } from "vitest";
import { AffiliateEngineService } from "../src/affiliates/affiliate-engine.service";
import { AmazonAffiliateAdapter } from "../src/affiliates/adapters/amazon-affiliate.adapter";
import { EbayAffiliateAdapter } from "../src/affiliates/adapters/ebay-affiliate.adapter";
import { GenericAffiliateAdapter } from "../src/affiliates/adapters/generic-affiliate.adapter";
import type { NormalizedOffer } from "@pricelens/shared";

const baseOffer: NormalizedOffer = {
  id: "offer",
  provider: "serpapi",
  storeName: "eBay",
  title: "Nike Air Max 270",
  condition: "new",
  productUrl: "https://www.ebay.pt/itm/123",
  currency: "EUR",
  itemPrice: 72,
  shippingPrice: 0,
  totalPrice: 72,
  availability: "in_stock",
  storeTrustScore: 90,
  matchConfidence: 98,
  lastUpdatedAt: "2026-09-10T00:00:00.000Z"
};

describe("AffiliateEngineService", () => {
  afterEach(() => {
    delete process.env.EBAY_AFFILIATE_CAMPAIGN_ID;
    delete process.env.AMAZON_ASSOCIATE_TAG;
    delete process.env.AFFILIATE_DOMAIN_RULES;
  });

  it("adds eBay affiliate parameters when configured", () => {
    process.env.EBAY_AFFILIATE_CAMPAIGN_ID = "campaign-123";
    const service = new AffiliateEngineService(new EbayAffiliateAdapter(), new AmazonAffiliateAdapter(), new GenericAffiliateAdapter());

    const offer = service.enrichOffer(baseOffer);

    expect(offer.affiliateProvider).toBe("ebay");
    expect(offer.affiliateUrl).toContain("campid=campaign-123");
    expect(offer.affiliateDisclosure).toContain("comissão");
  });

  it("leaves links unchanged when no adapter is configured", () => {
    const service = new AffiliateEngineService(new EbayAffiliateAdapter(), new AmazonAffiliateAdapter(), new GenericAffiliateAdapter());

    const offer = service.enrichOffer(baseOffer);

    expect(offer.affiliateUrl).toBeUndefined();
  });
});
