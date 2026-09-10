import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AffiliatesModule } from "./affiliates/affiliates.module";
import { HealthController } from "./health.controller";
import { MatchingModule } from "./matching/matching.module";
import { ProductIdentificationsModule } from "./product-identifications/product-identifications.module";
import { PriceAlertsModule } from "./price-alerts/price-alerts.module";
import { SearchesModule } from "./searches/searches.module";
import { ShoppingProvidersModule } from "./shopping-providers/shopping-providers.module";
import { UserDataModule } from "./user-data/user-data.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AffiliatesModule,
    MatchingModule,
    ShoppingProvidersModule,
    ProductIdentificationsModule,
    PriceAlertsModule,
    SearchesModule,
    UserDataModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
