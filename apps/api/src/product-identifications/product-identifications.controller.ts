import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { ConfirmIdentificationDto } from "./dto/confirm-identification.dto";
import { CreateImageIdentificationDto } from "./dto/create-image-identification.dto";
import { CreateTextIdentificationDto } from "./dto/create-text-identification.dto";
import { ProductIdentificationsService } from "./product-identifications.service";
import { RequestUser, type RequestUser as RequestUserContext } from "../common/request-user.decorator";
import { UsageService } from "../usage/usage.service";

@Controller("product-identifications")
export class ProductIdentificationsController {
  constructor(private readonly productIdentificationsService: ProductIdentificationsService, private readonly usage: UsageService) {}

  @Post("text")
  async createFromText(@RequestUser() user: RequestUserContext, @Body() dto: CreateTextIdentificationDto) {
    await this.usage.consume(user, "textIdentification");
    return this.productIdentificationsService.createFromText(dto);
  }

  @Post("image")
  async createFromImage(@RequestUser() user: RequestUserContext, @Body() dto: CreateImageIdentificationDto) {
    await this.usage.consume(user, "imageRecognition");
    return this.productIdentificationsService.createFromImage(dto);
  }

  @Patch(":id/confirm")
  confirm(@Param("id") id: string, @Body() dto: ConfirmIdentificationDto) {
    return this.productIdentificationsService.confirm(id, dto);
  }
}
