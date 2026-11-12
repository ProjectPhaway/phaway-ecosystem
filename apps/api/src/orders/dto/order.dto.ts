import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../../generated/prisma/client';

const MONEY = /^\d{1,8}(\.\d{1,2})?$/;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class OrderItemInputDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}

export class CreateOrderDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName!: string;

  @Transform(trim)
  @Matches(/^\+?[\d\s-]{6,20}$/, { message: 'Telefono no valido' })
  customerPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un producto' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @IsOptional()
  @Matches(MONEY, { message: 'paidAmount debe ser un monto como 49.90' })
  paidAmount?: string;

  /** true: se registra y confirma en un paso (descuenta stock). */
  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class UpdatePaymentDto {
  @Matches(MONEY, { message: 'paidAmount debe ser un monto como 49.90' })
  paidAmount!: string;
}

export class OrderQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
