import { Module } from "@nestjs/common";
import { AffiliateEngineService } from "./affiliate-engine.service";
import { AmazonAffiliateAdapter } from "./adapters/amazon-affiliate.adapter";
import { EbayAffiliateAdapter } from "./adapters/ebay-affiliate.adapter";
import { GenericAffiliateAdapter } from "./adapters/generic-affiliate.adapter";

@Module({
  providers: [AffiliateEngineService, EbayAffiliateAdapter, AmazonAffiliateAdapter, GenericAffiliateAdapter],
  exports: [AffiliateEngineService]
})
export class AffiliatesModule {}
