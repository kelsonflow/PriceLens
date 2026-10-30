import { Injectable } from "@nestjs/common";
import { type NormalizedOffer } from "@pricelens/shared";
import { createHash } from "node:crypto";
import { FirebaseAdminService } from "../firebase-admin/firebase-admin.service";
import { SearchOffersDto } from "./dto/search-offers.dto";

interface SearchCacheEntry {
  results: NormalizedOffer[];
  groups: OfferMatchGroups;
  expiresAt: number;
  createdAt: string;
}

export interface OfferMatchGroups {
  exact: NormalizedOffer[];
  similar: NormalizedOffer[];
}

@Injectable()
export class SearchCacheService {
  private readonly entries = new Map<string, SearchCacheEntry>();

  constructor(private readonly firebase?: FirebaseAdminService) {}

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
    if (process.env.SEARCH_CACHE_ENABLED === "false" || results.length === 0) return;
    this.entries.set(this.key(dto), {
      results,
      groups: groupOffersByMatch(results),
      expiresAt: Date.now() + this.ttlMs(),
      createdAt: new Date().toISOString()
    });
  }

  async getShared(dto: SearchOffersDto): Promise<SearchCacheEntry | undefined> {
    const local = this.get(dto);
    if (local || !this.firebase || process.env.SEARCH_CACHE_ENABLED === "false") return local;
    try {
      const snapshot = await this.firebase.firestore.collection("searchCache").doc(this.documentId(dto)).get();
      const entry = snapshot.data() as SearchCacheEntry | undefined;
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        await snapshot.ref.delete();
        return undefined;
      }
      this.entries.set(this.key(dto), entry);
      return entry;
    } catch {
      return undefined;
    }
  }

  async setShared(dto: SearchOffersDto, results: NormalizedOffer[]) {
    this.set(dto, results);
    if (!this.firebase || process.env.SEARCH_CACHE_ENABLED === "false" || results.length === 0) return;
    const entry = this.entries.get(this.key(dto));
    if (!entry) return;
    try {
      await this.firebase.firestore.collection("searchCache").doc(this.documentId(dto)).set(entry);
    } catch {
      // The in-memory cache remains available if the shared cache is temporarily unavailable.
    }
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

  private documentId(dto: SearchOffersDto): string {
    return createHash("sha256").update(this.key(dto)).digest("hex");
  }

  private ttlMs(): number {
    return Number(process.env.SEARCH_CACHE_TTL_MS ?? 15 * 60 * 1000);
  }
}

export function groupOffersByMatch(offers: NormalizedOffer[]): OfferMatchGroups {
  return {
    exact: offers.filter((offer) => offer.matchType === "exact"),
    similar: offers.filter((offer) => offer.matchType !== "exact")
  };
}
