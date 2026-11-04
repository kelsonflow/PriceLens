import { Body, Controller, Post } from "@nestjs/common";
import { SearchOffersDto } from "./dto/search-offers.dto";
import { SearchesService } from "./searches.service";
import { RequestUser, type RequestUser as RequestUserContext } from "../common/request-user.decorator";
import { UsageService } from "../usage/usage.service";

@Controller("searches")
export class SearchesController {
  constructor(private readonly searchesService: SearchesService, private readonly usage: UsageService) {}

  @Post("offers")
  async searchOffers(@RequestUser() user: RequestUserContext, @Body() dto: SearchOffersDto) {
    await this.usage.assertCountry(user, dto.country);
    const usage = await this.usage.consume(user, "comparison");
    try {
      return { ...(await this.searchesService.searchOffers(dto)), usage };
    } catch (error) {
      await this.usage.release(user, "comparison", usage.plan);
      throw error;
    }
  }
}
