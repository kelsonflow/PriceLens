import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { ProductIdentificationsModule } from "./product-identifications/product-identifications.module";
import { SearchesModule } from "./searches/searches.module";
import { ShoppingProvidersModule } from "./shopping-providers/shopping-providers.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ShoppingProvidersModule,
    ProductIdentificationsModule,
    SearchesModule
  ],
  controllers: [HealthController]
})
export class AppModule {}

