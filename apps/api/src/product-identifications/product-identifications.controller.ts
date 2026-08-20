import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { ConfirmIdentificationDto } from "./dto/confirm-identification.dto";
import { CreateImageIdentificationDto } from "./dto/create-image-identification.dto";
import { CreateTextIdentificationDto } from "./dto/create-text-identification.dto";
import { ProductIdentificationsService } from "./product-identifications.service";

@Controller("product-identifications")
export class ProductIdentificationsController {
  constructor(private readonly productIdentificationsService: ProductIdentificationsService) {}

  @Post("text")
  createFromText(@Body() dto: CreateTextIdentificationDto) {
    return this.productIdentificationsService.createFromText(dto);
  }

  @Post("image")
  createFromImage(@Body() dto: CreateImageIdentificationDto) {
    return this.productIdentificationsService.createFromImage(dto);
  }

  @Patch(":id/confirm")
  confirm(@Param("id") id: string, @Body() dto: ConfirmIdentificationDto) {
    return this.productIdentificationsService.confirm(id, dto);
  }
}
