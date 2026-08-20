import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateTextIdentificationDto {
  @IsString()
  @MinLength(2)
  query!: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

