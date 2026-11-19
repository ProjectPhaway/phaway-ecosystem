import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { CouponType } from '../../generated/prisma/client';

const MONEY = /^\d{1,8}(\.\d{1,2})?$/;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCouponDto {
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  code!: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @Matches(MONEY)
  value!: string;

  @IsOptional()
  @Matches(MONEY)
  minimumAmount?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  usageLimit?: number;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
