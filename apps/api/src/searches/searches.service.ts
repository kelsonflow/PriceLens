import { Injectable } from "@nestjs/common";
import { ShoppingProvidersService } from "../shopping-providers/shopping-providers.service";
import { SearchOffersDto } from "./dto/search-offers.dto";
import { SearchCacheService } from "./search-cache.service";

@Injectable()
export class SearchesService {
  constructor(
    private readonly shoppingProvidersService: ShoppingProvidersService,
    private readonly searchCacheService: SearchCacheService
  ) {}

  async searchOffers(dto: SearchOffersDto) {
    const cached = this.searchCacheService.get(dto);
    if (cached) {
      return {
        results: cached.results,
        cached: true,
        disclaimer: "Os precos e disponibilidade podem mudar na pagina da loja. A pontuacao de confianca e apenas um indicador.",
        generatedAt: cached.createdAt
      };
    }

    const offers = await this.shoppingProvidersService.search(
      {
        query: dto.query,
        brand: dto.brand,
        model: dto.model,
        category: dto.category,
        country: dto.country ?? "PT",
        currency: dto.currency ?? "EUR"
      },
      {
        condition: dto.condition,
        maxPrice: dto.maxPrice,
        freeShippingOnly: dto.freeShippingOnly
      }
    );
    this.searchCacheService.set(dto, offers);

    return {
      results: offers,
      cached: false,
      disclaimer: "Os precos e disponibilidade podem mudar na pagina da loja. A pontuacao de confianca e apenas um indicador.",
      generatedAt: new Date().toISOString()
    };
  }
}
