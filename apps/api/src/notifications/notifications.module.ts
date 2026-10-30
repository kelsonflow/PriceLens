import { forwardRef, Module } from "@nestjs/common";
import { PriceAlertsModule } from "../price-alerts/price-alerts.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({ imports: [forwardRef(() => PriceAlertsModule)], controllers: [NotificationsController], providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
