import { Module } from "@nestjs/common";
import { ProductIdentificationsController } from "./product-identifications.controller";
import { ProductIdentificationsService } from "./product-identifications.service";

@Module({
  controllers: [ProductIdentificationsController],
  providers: [ProductIdentificationsService],
  exports: [ProductIdentificationsService]
})
export class ProductIdentificationsModule {}

