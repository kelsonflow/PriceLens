import { Body, Controller, Delete, ForbiddenException, forwardRef, Headers, Inject, Post, UnauthorizedException } from "@nestjs/common";
import { RequestUser, type RequestUser as RequestUserContext } from "../common/request-user.decorator";
import { PriceAlertsService } from "../price-alerts/price-alerts.service";
import { ImportantUpdateDto } from "./dto/important-update.dto";
import { RegisterDeviceDto } from "./dto/register-device.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService, @Inject(forwardRef(() => PriceAlertsService)) private readonly alerts: PriceAlertsService) {}

  @Post("devices")
  register(@RequestUser() user: RequestUserContext, @Body() dto: RegisterDeviceDto) {
    if (user.authType !== "firebase") throw new UnauthorizedException("Authentication required");
    return this.notifications.register(user.id, dto);
  }

  @Delete("devices")
  unregister(@RequestUser() user: RequestUserContext, @Body("token") token: string) {
    if (user.authType !== "firebase") throw new UnauthorizedException("Authentication required");
    return this.notifications.unregister(user.id, token);
  }

  @Post("internal/check-price-alerts")
  checkAlerts(@Headers("x-scheduler-secret") secret?: string) {
    this.assertInternal(secret);
    return this.alerts.checkAllUsers();
  }

  @Post("internal/important-update")
  importantUpdate(@Headers("x-scheduler-secret") secret: string | undefined, @Body() dto: ImportantUpdateDto) {
    this.assertInternal(secret);
    return this.notifications.sendImportantUpdate(dto);
  }

  private assertInternal(secret?: string) {
    const expected = process.env.SCHEDULER_SECRET;
    if (!expected || secret !== expected) throw new ForbiddenException("Invalid scheduler secret");
  }
}
