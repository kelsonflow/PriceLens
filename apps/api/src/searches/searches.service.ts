import { Injectable } from "@nestjs/common";
import { ShoppingProvidersService } from "../shopping-providers/shopping-providers.service";
import { SearchOffersDto } from "./dto/search-offers.dto";

@Injectable()
export class SearchesService {
  constructor(private readonly shoppingProvidersService: ShoppingProvidersService) {}

  async searchOffers(dto: SearchOffersDto) {
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

    return {
      results: offers,
      disclaimer: "Os precos e disponibilidade podem mudar na pagina da loja. A pontuacao de confianca e apenas um indicador.",
      generatedAt: new Date().toISOString()
    };
  }
}

