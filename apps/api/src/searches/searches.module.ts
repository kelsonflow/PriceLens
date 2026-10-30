import { Module } from "@nestjs/common";
import { AffiliatesModule } from "../affiliates/affiliates.module";
import { MatchingModule } from "../matching/matching.module";
import { ShoppingProvidersModule } from "../shopping-providers/shopping-providers.module";
import { SearchesController } from "./searches.controller";
import { SearchCacheService } from "./search-cache.service";
import { SearchesService } from "./searches.service";
import { UsageModule } from "../usage/usage.module";

@Module({
  imports: [ShoppingProvidersModule, MatchingModule, AffiliatesModule, UsageModule],
  controllers: [SearchesController],
  providers: [SearchesService, SearchCacheService],
  exports: [SearchesService]
})
export class SearchesModule {}
