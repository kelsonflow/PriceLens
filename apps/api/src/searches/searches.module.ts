import { Module } from "@nestjs/common";
import { ShoppingProvidersModule } from "../shopping-providers/shopping-providers.module";
import { SearchesController } from "./searches.controller";
import { SearchesService } from "./searches.service";

@Module({
  imports: [ShoppingProvidersModule],
  controllers: [SearchesController],
  providers: [SearchesService]
})
export class SearchesModule {}

