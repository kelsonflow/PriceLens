import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { UserDataService, type SavedItem } from "./user-data.service";

@Controller("user-data")
export class UserDataController {
  constructor(private readonly userDataService: UserDataService) {}

  @Get()
  list(@Query("type") type?: SavedItem["type"]) {
    return { items: this.userDataService.list(type) };
  }

  @Post()
  create(@Body() body: { type: SavedItem["type"]; title: string; payload: unknown }) {
    return this.userDataService.create(body.type, body.title, body.payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.userDataService.remove(id);
  }
}

