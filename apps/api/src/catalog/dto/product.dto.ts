import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Dinero como string "123.45" (nunca number). */
const MONEY = /^\d{1,8}(\.\d{1,2})?$/;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class VariantInputDto {
  /** Si viene, se actualiza esa variante; si no, se crea. */
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  size!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  color!: string;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @Matches(MONEY, { message: 'priceOverride debe ser un monto como 49.90' })
  priceOverride?: string | null;
}

export class CreateProductDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Matches(MONEY, { message: 'basePrice debe ser un monto como 49.90' })
  basePrice!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsUrl({ require_tld: false })
  mainImageUrl!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ require_tld: false }, { each: true })
  galleryImages?: string[];

  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => VariantInputDto)
  variants!: VariantInputDto[];
}

export class UpdateProductDto extends CreateProductDto {}

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onSale?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;
}
