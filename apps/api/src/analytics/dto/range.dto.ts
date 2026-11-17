import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RangeQueryDto {
  /** Dias hacia atras incluyendo hoy. Default 30. Maximo 365. */
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  /** Para top-products: cuantos. Default 5, max 20. */
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  /** Para low-stock: umbral. Default 3, max 100. */
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  @IsInt()
  @Min(0)
  @Max(100)
  threshold?: number;
}
