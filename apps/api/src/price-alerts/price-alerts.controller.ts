import { Body, Controller, Delete, Get, Header, Param, Patch, Post } from "@nestjs/common";
import { RequestUser, type RequestUser as RequestUserContext } from "../common/request-user.decorator";
import { CreatePriceAlertDto } from "./dto/create-price-alert.dto";
import { UpdatePriceAlertDto } from "./dto/update-price-alert.dto";
import { PriceAlertsService } from "./price-alerts.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

@Controller("price-alerts")
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService, private readonly subscriptions: SubscriptionsService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  async list(@RequestUser() user: RequestUserContext) {
    return { items: await this.priceAlertsService.list(user.id) };
  }

  @Post()
  async create(@RequestUser() user: RequestUserContext, @Body() dto: CreatePriceAlertDto) {
    await this.subscriptions.assertPremium(user.id);
    return this.priceAlertsService.create(user.id, dto);
  }

  @Patch(":id")
  update(@RequestUser() user: RequestUserContext, @Param("id") id: string, @Body() dto: UpdatePriceAlertDto) {
    return this.priceAlertsService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@RequestUser() user: RequestUserContext, @Param("id") id: string) {
    return this.priceAlertsService.remove(user.id, id);
  }

  @Post("check")
  checkAll(@RequestUser() user: RequestUserContext) {
    return this.priceAlertsService.checkAll(user.id);
  }

  @Post(":id/check")
  check(@RequestUser() user: RequestUserContext, @Param("id") id: string) {
    return this.priceAlertsService.check(user.id, id);
  }

  @Get(":id/history")
  @Header("Cache-Control", "no-store")
  history(@RequestUser() user: RequestUserContext, @Param("id") id: string) {
    return this.priceAlertsService.history(user.id, id);
  }
}
