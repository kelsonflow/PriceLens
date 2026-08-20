import { IsOptional, IsString } from "class-validator";

export class ConfirmIdentificationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

