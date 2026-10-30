import { Controller, Get } from "@nestjs/common";
import { RequestUser, type RequestUser as RequestUserContext } from "../common/request-user.decorator";
import { UsageService } from "./usage.service";

@Controller("usage")
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get()
  summary(@RequestUser() user: RequestUserContext) {
    return this.usage.summary(user);
  }
}
