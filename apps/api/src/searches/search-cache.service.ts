import { Injectable } from "@nestjs/common";
import { type NormalizedOffer } from "@pricelens/shared";
import { SearchOffersDto } from "./dto/search-offers.dto";

interface SearchCacheEntry {
  results: NormalizedOffer[];
  expiresAt: number;
  createdAt: string;
}

@Injectable()
export class SearchCacheService {
  private readonly entries = new Map<string, SearchCacheEntry>();

  get(dto: SearchOffersDto): SearchCacheEntry | undefined {
    if (process.env.SEARCH_CACHE_ENABLED === "false") return undefined;
    const key = this.key(dto);
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }

  set(dto: SearchOffersDto, results: NormalizedOffer[]) {
    if (process.env.SEARCH_CACHE_ENABLED === "false") return;
    this.entries.set(this.key(dto), {
      results,
      expiresAt: Date.now() + this.ttlMs(),
      createdAt: new Date().toISOString()
    });
  }

  clear() {
    this.entries.clear();
  }

  private key(dto: SearchOffersDto): string {
    return JSON.stringify({
      query: dto.query.trim().toLowerCase(),
      brand: dto.brand?.trim().toLowerCase(),
      model: dto.model?.trim().toLowerCase(),
      category: dto.category?.trim().toLowerCase(),
      country: (dto.country ?? "PT").toUpperCase(),
      currency: (dto.currency ?? "EUR").toUpperCase(),
      condition: dto.condition ?? "any",
      maxPrice: dto.maxPrice,
      freeShippingOnly: dto.freeShippingOnly ?? false
    });
  }

  private ttlMs(): number {
    return Number(process.env.SEARCH_CACHE_TTL_MS ?? 15 * 60 * 1000);
  }
}
