import { Injectable } from "@nestjs/common";
import type { NormalizedOffer } from "@pricelens/shared";
import type { AffiliateAdapter } from "../affiliate-adapter.interface";

@Injectable()
export class EbayAffiliateAdapter implements AffiliateAdapter {
  readonly provider = "ebay";

  supports(offer: NormalizedOffer): boolean {
    return Boolean(process.env.EBAY_AFFILIATE_CAMPAIGN_ID && hostIncludes(offer.productUrl, "ebay."));
  }

  createUrl(offer: NormalizedOffer): string | undefined {
    const campaignId = process.env.EBAY_AFFILIATE_CAMPAIGN_ID;
    if (!campaignId) return undefined;

    const url = safeUrl(offer.productUrl);
    if (!url) return undefined;
    url.searchParams.set("mkevt", "1");
    url.searchParams.set("mkcid", "1");
    url.searchParams.set("mkrid", process.env.EBAY_AFFILIATE_MKRID ?? "711-53200-19255-0");
    url.searchParams.set("campid", campaignId);
    url.searchParams.set("toolid", process.env.EBAY_AFFILIATE_TOOL_ID ?? "10001");
    const customId = process.env.EBAY_AFFILIATE_CUSTOM_ID;
    if (customId) url.searchParams.set("customid", customId);
    return url.toString();
  }
}

function hostIncludes(value: string, needle: string): boolean {
  return safeUrl(value)?.hostname.toLowerCase().includes(needle) ?? false;
}

function safeUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}
