import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDeviceDto {
  @IsString() @MinLength(20) token!: string;
  @IsIn(["android", "ios"]) platform!: "android" | "ios";
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
}
