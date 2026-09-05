import { Module } from "@nestjs/common";
import { ShoppingProvidersModule } from "../shopping-providers/shopping-providers.module";
import { PriceAlertsController } from "./price-alerts.controller";
import { PriceAlertsService } from "./price-alerts.service";

@Module({
  imports: [ShoppingProvidersModule],
  controllers: [PriceAlertsController],
  providers: [PriceAlertsService],
  exports: [PriceAlertsService]
})
export class PriceAlertsModule {}
