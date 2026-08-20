import { Module } from "@nestjs/common";
import { GeminiIdentificationService } from "./gemini-identification.service";
import { GoogleVisionService } from "./google-vision.service";
import { ProductIdentificationsController } from "./product-identifications.controller";
import { ProductIdentificationsService } from "./product-identifications.service";

@Module({
  controllers: [ProductIdentificationsController],
  providers: [GeminiIdentificationService, GoogleVisionService, ProductIdentificationsService],
  exports: [ProductIdentificationsService]
})
export class ProductIdentificationsModule {}
