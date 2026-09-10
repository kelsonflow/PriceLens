import { Injectable } from "@nestjs/common";
import { type NormalizedOffer, type OfferMatchType, type ProductSearchInput } from "@pricelens/shared";

@Injectable()
export class MatchingService {
  classifyOffers(offers: NormalizedOffer[], input: ProductSearchInput): NormalizedOffer[] {
    return offers.map((offer) => this.classifyOffer(offer, input));
  }

  classifyOffer(offer: NormalizedOffer, input: ProductSearchInput): NormalizedOffer {
    const queryTokens = importantTokens([input.query, input.brand, input.model].filter(Boolean).join(" "));
    const titleTokens = importantTokens([offer.title, offer.brand, offer.model, offer.variant].filter(Boolean).join(" "));
    const matchedTokens = queryTokens.filter((token) => titleTokens.includes(token));
    const tokenCoverage = queryTokens.length === 0 ? 0 : matchedTokens.length / queryTokens.length;
    const brandMatches = tokensMatch(input.brand, titleTokens);
    const modelMatches = tokensMatch(input.model, titleTokens);
    const confidence = Math.max(offer.matchConfidence, Math.round(tokenCoverage * 100));
    const matchType: OfferMatchType = confidence >= exactThreshold() && tokenCoverage >= 0.72 && brandMatches && modelMatches ? "exact" : "similar";

    return {
      ...offer,
      matchConfidence: Math.min(99, Math.max(45, confidence)),
      matchType,
      matchReason: matchType === "exact"
        ? "Encontrámos exatamente o produto da fotografia."
        : "Não é exatamente o mesmo produto, mas é visualmente semelhante."
    };
  }
}

function exactThreshold() {
  return Number(process.env.EXACT_MATCH_THRESHOLD ?? 92);
}

function importantTokens(value: string): string[] {
  const stopWords = new Set(["de", "da", "do", "das", "dos", "the", "and", "with", "para", "com", "produto", "preto", "black"]);
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function tokensMatch(value: string | undefined, titleTokens: string[]): boolean {
  const tokens = value ? importantTokens(value) : [];
  return tokens.length === 0 || tokens.every((token) => titleTokens.includes(token));
}
