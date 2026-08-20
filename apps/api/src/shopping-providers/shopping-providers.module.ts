import { Module } from "@nestjs/common";
import { MockShoppingProvider } from "./mock-shopping.provider";
import { ShoppingProvidersService } from "./shopping-providers.service";

@Module({
  providers: [MockShoppingProvider, ShoppingProvidersService],
  exports: [ShoppingProvidersService]
})
export class ShoppingProvidersModule {}

