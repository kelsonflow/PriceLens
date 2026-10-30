import { Module } from "@nestjs/common";
import { GeminiIdentificationService } from "./gemini-identification.service";
import { GoogleVisionService } from "./google-vision.service";
import { ProductIdentificationsController } from "./product-identifications.controller";
import { ProductIdentificationsService } from "./product-identifications.service";
import { UsageModule } from "../usage/usage.module";

@Module({
  imports: [UsageModule],
  controllers: [ProductIdentificationsController],
  providers: [GeminiIdentificationService, GoogleVisionService, ProductIdentificationsService],
  exports: [ProductIdentificationsService]
})
export class ProductIdentificationsModule {}
