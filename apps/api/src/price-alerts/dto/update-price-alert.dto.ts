import { IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class UpdatePriceAlertDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  query?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
