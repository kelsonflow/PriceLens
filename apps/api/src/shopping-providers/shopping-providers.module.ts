import { Module } from "@nestjs/common";
import { MockShoppingProvider } from "./mock-shopping.provider";
import { SerpApiShoppingProvider } from "./serpapi-shopping.provider";
import { ShoppingProvidersService } from "./shopping-providers.service";

@Module({
  providers: [MockShoppingProvider, SerpApiShoppingProvider, ShoppingProvidersService],
  exports: [ShoppingProvidersService]
})
export class ShoppingProvidersModule {}
