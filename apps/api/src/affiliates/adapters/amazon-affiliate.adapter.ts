import { Injectable } from "@nestjs/common";
import type { NormalizedOffer } from "@pricelens/shared";
import type { AffiliateAdapter } from "../affiliate-adapter.interface";

@Injectable()
export class AmazonAffiliateAdapter implements AffiliateAdapter {
  readonly provider = "amazon";

  supports(offer: NormalizedOffer): boolean {
    return Boolean(process.env.AMAZON_ASSOCIATE_TAG && hostIncludes(offer.productUrl, "amazon."));
  }

  createUrl(offer: NormalizedOffer): string | undefined {
    const tag = process.env.AMAZON_ASSOCIATE_TAG;
    if (!tag) return undefined;

    const url = safeUrl(offer.productUrl);
    if (!url) return undefined;
    url.searchParams.set("tag", tag);
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
