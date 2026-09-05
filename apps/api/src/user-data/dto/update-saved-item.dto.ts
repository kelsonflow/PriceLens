import { IsOptional, IsString } from "class-validator";

export class UpdateSavedItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  payload?: unknown;
}
