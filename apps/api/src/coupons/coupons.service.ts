import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      throw new BadRequestException('El codigo solo puede contener letras, numeros, guiones y guiones bajos.');
    }
    const value = new Prisma.Decimal(dto.value);
    if (dto.type === 'percent' && (value.lte(0) || value.gt(100))) {
      throw new BadRequestException('El porcentaje debe estar entre 0.01 y 100.');
    }
    if (dto.type === 'fixed' && value.lte(0)) {
      throw new BadRequestException('El monto fijo debe ser mayor a cero.');
    }
    return this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value,
        minimumAmount: new Prisma.Decimal(dto.minimumAmount ?? 0),
        usageLimit: dto.usageLimit ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async setStatus(id: string, isActive: boolean) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Cupon no encontrado.');
    return this.prisma.coupon.update({ where: { id }, data: { isActive } });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Cupon no encontrado.');
    await this.prisma.coupon.delete({ where: { id } });
  }
}
