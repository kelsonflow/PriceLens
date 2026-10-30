import { forwardRef, Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { SearchesModule } from "../searches/searches.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { PriceAlertsController } from "./price-alerts.controller";
import { PriceAlertsService } from "./price-alerts.service";

@Module({
  imports: [SearchesModule, SubscriptionsModule, forwardRef(() => NotificationsModule)],
  controllers: [PriceAlertsController],
  providers: [PriceAlertsService],
  exports: [PriceAlertsService]
})
export class PriceAlertsModule {}
