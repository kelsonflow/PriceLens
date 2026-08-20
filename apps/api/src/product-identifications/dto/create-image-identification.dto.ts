import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateImageIdentificationDto {
  @IsString()
  @MinLength(20)
  imageBase64!: string;

  @IsString()
  @IsIn(["image/png", "image/jpeg", "image/jpg", "image/webp"])
  mimeType!: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

