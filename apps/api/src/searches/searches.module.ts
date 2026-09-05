import { Module } from "@nestjs/common";
import { ShoppingProvidersModule } from "../shopping-providers/shopping-providers.module";
import { SearchesController } from "./searches.controller";
import { SearchCacheService } from "./search-cache.service";
import { SearchesService } from "./searches.service";

@Module({
  imports: [ShoppingProvidersModule],
  controllers: [SearchesController],
  providers: [SearchesService, SearchCacheService]
})
export class SearchesModule {}
