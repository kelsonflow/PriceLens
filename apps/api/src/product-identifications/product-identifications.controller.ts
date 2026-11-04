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
    const usage = await this.usage.consume(user, "textIdentification");
    try {
      return await this.productIdentificationsService.createFromText(dto);
    } catch (error) {
      await this.usage.release(user, "textIdentification", usage.plan);
      throw error;
    }
  }

  @Post("image")
  async createFromImage(@RequestUser() user: RequestUserContext, @Body() dto: CreateImageIdentificationDto) {
    const usage = await this.usage.consume(user, "imageRecognition");
    try {
      return await this.productIdentificationsService.createFromImage(dto);
    } catch (error) {
      await this.usage.release(user, "imageRecognition", usage.plan);
      throw error;
    }
  }

  @Patch(":id/confirm")
  confirm(@Param("id") id: string, @Body() dto: ConfirmIdentificationDto) {
    return this.productIdentificationsService.confirm(id, dto);
  }
}
