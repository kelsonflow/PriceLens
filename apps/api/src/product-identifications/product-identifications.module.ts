import { Module } from "@nestjs/common";
import { GeminiIdentificationService } from "./gemini-identification.service";
import { ProductIdentificationsController } from "./product-identifications.controller";
import { ProductIdentificationsService } from "./product-identifications.service";

@Module({
  controllers: [ProductIdentificationsController],
  providers: [GeminiIdentificationService, ProductIdentificationsService],
  exports: [ProductIdentificationsService]
})
export class ProductIdentificationsModule {}
