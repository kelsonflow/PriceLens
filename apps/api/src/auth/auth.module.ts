import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { FirebaseAuthService } from "./firebase-auth.service";
import { PriceAlertsModule } from "../price-alerts/price-alerts.module";
import { UserDataModule } from "../user-data/user-data.module";

@Module({
  imports: [PriceAlertsModule, UserDataModule],
  controllers: [AuthController],
  providers: [FirebaseAuthService],
  exports: [FirebaseAuthService]
})
export class AuthModule {}
