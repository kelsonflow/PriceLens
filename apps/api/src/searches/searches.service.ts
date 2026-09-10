import { Injectable } from "@nestjs/common";
import { AffiliateEngineService } from "../affiliates/affiliate-engine.service";
import { MatchingService } from "../matching/matching.service";
import { ShoppingProvidersService } from "../shopping-providers/shopping-providers.service";
import { SearchOffersDto } from "./dto/search-offers.dto";
import { groupOffersByMatch, SearchCacheService } from "./search-cache.service";

@Injectable()
export class SearchesService {
  constructor(
    private readonly shoppingProvidersService: ShoppingProvidersService,
    private readonly searchCacheService: SearchCacheService,
    private readonly matchingService: MatchingService,
    private readonly affiliateEngineService: AffiliateEngineService
  ) {}

  async searchOffers(dto: SearchOffersDto) {
    const cached = this.searchCacheService.get(dto);
    if (cached) {
      return {
        results: cached.results,
        groups: cached.groups,
        cached: true,
        disclaimer: "Os precos e disponibilidade podem mudar na pagina da loja. A pontuacao de confianca e apenas um indicador.",
        generatedAt: cached.createdAt
      };
    }

    const input = {
      query: dto.query,
      brand: dto.brand,
      model: dto.model,
      category: dto.category,
      country: dto.country ?? "PT",
      currency: dto.currency ?? "EUR"
    };
    const providerOffers = await this.shoppingProvidersService.search(
      input,
      {
        condition: dto.condition,
        maxPrice: dto.maxPrice,
        freeShippingOnly: dto.freeShippingOnly
      }
    );
    const offers = this.affiliateEngineService.enrichOffers(this.matchingService.classifyOffers(providerOffers, input));
    const groups = groupOffersByMatch(offers);
    this.searchCacheService.set(dto, offers);

    return {
      results: offers,
      groups,
      cached: false,
      disclaimer: "Os precos e disponibilidade podem mudar na pagina da loja. A pontuacao de confianca e apenas um indicador.",
      generatedAt: new Date().toISOString()
    };
  }
}
