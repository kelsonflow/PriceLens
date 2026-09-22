import { Controller, Delete, Get, UnauthorizedException } from "@nestjs/common";
import { RequestUser, type RequestUser as RequestUserContext } from "../common/request-user.decorator";
import { FirebaseAuthService } from "./firebase-auth.service";
import { PriceAlertsService } from "../price-alerts/price-alerts.service";
import { UserDataService } from "../user-data/user-data.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly priceAlertsService: PriceAlertsService,
    private readonly userDataService: UserDataService
  ) {}

  @Get("session")
  session(@RequestUser() user: RequestUserContext) {
    if (user.authType !== "firebase") throw new UnauthorizedException("Authentication required");
    return { user };
  }

  @Delete("account")
  async deleteAccount(@RequestUser() user: RequestUserContext) {
    if (user.authType !== "firebase") throw new UnauthorizedException("Authentication required");
    this.priceAlertsService.removeAll(user.id);
    this.userDataService.removeAll(user.id);
    await this.firebaseAuthService.deleteUser(user.id);
    return { deleted: true };
  }
}
