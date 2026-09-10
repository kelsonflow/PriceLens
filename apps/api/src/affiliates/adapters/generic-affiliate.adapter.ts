import { Injectable, Logger } from "@nestjs/common";
import type { NormalizedOffer } from "@pricelens/shared";
import type { AffiliateAdapter } from "../affiliate-adapter.interface";

interface GenericAffiliateRule {
  host: string;
  params?: Record<string, string>;
}

@Injectable()
export class GenericAffiliateAdapter implements AffiliateAdapter {
  readonly provider = "generic";
  private readonly logger = new Logger(GenericAffiliateAdapter.name);

  supports(offer: NormalizedOffer): boolean {
    return Boolean(this.matchRule(offer.productUrl));
  }

  createUrl(offer: NormalizedOffer): string | undefined {
    const rule = this.matchRule(offer.productUrl);
    const url = safeUrl(offer.productUrl);
    if (!rule || !url) return undefined;

    for (const [key, value] of Object.entries(rule.params ?? {})) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private matchRule(value: string): GenericAffiliateRule | undefined {
    const url = safeUrl(value);
    if (!url) return undefined;
    return this.rules().find((rule) => url.hostname.toLowerCase().includes(rule.host.toLowerCase()));
  }

  private rules(): GenericAffiliateRule[] {
    const raw = process.env.AFFILIATE_DOMAIN_RULES;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as GenericAffiliateRule[];
      return Array.isArray(parsed) ? parsed.filter((rule) => rule.host) : [];
    } catch (error) {
      this.logger.warn(`Invalid AFFILIATE_DOMAIN_RULES JSON: ${String(error)}`);
      return [];
    }
  }
}

function safeUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}
