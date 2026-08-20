import { Body, Controller, Post } from "@nestjs/common";
import { SearchOffersDto } from "./dto/search-offers.dto";
import { SearchesService } from "./searches.service";

@Controller("searches")
export class SearchesController {
  constructor(private readonly searchesService: SearchesService) {}

  @Post("offers")
  searchOffers(@Body() dto: SearchOffersDto) {
    return this.searchesService.searchOffers(dto);
  }
}

