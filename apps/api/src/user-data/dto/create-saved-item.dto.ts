import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export type SavedItemType = "favorite" | "alert" | "history" | "store-review";

export class CreateSavedItemDto {
  @IsIn(["favorite", "alert", "history", "store-review"])
  type!: SavedItemType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  payload?: unknown;
}
