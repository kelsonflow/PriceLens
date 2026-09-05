import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequestUser, type RequestUser as RequestUserContext } from "../common/request-user.decorator";
import { CreateSavedItemDto, type SavedItemType } from "./dto/create-saved-item.dto";
import { UpdateSavedItemDto } from "./dto/update-saved-item.dto";
import { UserDataService, type SavedItem } from "./user-data.service";

@Controller("user-data")
export class UserDataController {
  constructor(private readonly userDataService: UserDataService) {}

  @Get()
  list(@RequestUser() user: RequestUserContext, @Query("type") type?: SavedItemType) {
    return { items: this.userDataService.list(user.id, type) };
  }

  @Post()
  create(@RequestUser() user: RequestUserContext, @Body() body: CreateSavedItemDto) {
    return this.userDataService.create(user.id, body.type, body.title, body.payload);
  }

  @Patch(":id")
  update(@RequestUser() user: RequestUserContext, @Param("id") id: string, @Body() body: UpdateSavedItemDto) {
    return this.userDataService.update(user.id, id, body);
  }

  @Delete(":id")
  remove(@RequestUser() user: RequestUserContext, @Param("id") id: string) {
    return this.userDataService.remove(user.id, id);
  }
}
