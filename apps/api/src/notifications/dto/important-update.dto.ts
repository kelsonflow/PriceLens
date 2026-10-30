import { IsOptional, IsString, IsUrl, MinLength } from "class-validator";

export class ImportantUpdateDto {
  @IsString() @MinLength(2) title!: string;
  @IsString() @MinLength(2) body!: string;
  @IsOptional() @IsUrl() url?: string;
}
