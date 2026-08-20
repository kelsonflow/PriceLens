import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class SearchOffersDto {
  @IsString()
  @MinLength(2)
  query!: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn(["new", "used", "refurbished", "any"])
  condition?: "new" | "used" | "refurbished" | "any";

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsBoolean()
  freeShippingOnly?: boolean;
}

