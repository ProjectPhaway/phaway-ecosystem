import { Injectable, NotFoundException } from '@nestjs/common';
import type { CustomerDetailDto, CustomerSummaryDto, CustomerTier } from '@phaway/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function tierOf(totalOrders: number): CustomerTier {
  if (totalOrders >= 5) return 'vip';
  if (totalOrders >= 2) return 'recurring';
  return 'new';
}

/**
 * Clientes derivados de pedidos. Fase 1 no tiene tabla `Customer`: cada pedido
 * guarda `customerName` + `customerPhone` inline y aqui los agrupamos por
 * telefono para obtener la vista de cliente. Se excluyen pedidos cancelados.
 *
 * Cuando se promueva a Fase 2 (tabla Customer propia), el contrato de salida
 * no cambia: solo se cambia la fuente.
 */
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search?: string): Promise<CustomerSummaryDto[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        phone: string;
        name: string;
        totalOrders: bigint;
        totalSpent: Prisma.Decimal | null;
        firstOrderAt: Date;
        lastOrderAt: Date;
      }>
    >(Prisma.sql`
      WITH latest AS (
        SELECT DISTINCT ON ("customerPhone")
          "customerPhone" AS phone,
          "customerName"  AS name
        FROM "Order"
        WHERE status != 'cancelled'
        ORDER BY "customerPhone", "createdAt" DESC
      )
      SELECT
        l.phone AS phone,
        l.name  AS name,
        COUNT(o.id)::bigint AS "totalOrders",
        COALESCE(SUM(CASE WHEN o.status IN ('confirmed','delivered') THEN o."totalAmount" END), 0)::numeric AS "totalSpent",
        MIN(o."createdAt") AS "firstOrderAt",
        MAX(o."createdAt") AS "lastOrderAt"
      FROM latest l
      JOIN "Order" o ON o."customerPhone" = l.phone AND o.status != 'cancelled'
      GROUP BY l.phone, l.name
      ORDER BY MAX(o."createdAt") DESC
    `);

    const filtered = search
      ? rows.filter((r) => {
          const q = search.toLowerCase();
          return r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q);
        })
      : rows;

    return filtered.map((r) => {
      const totalOrders = Number(r.totalOrders);
      return {
        phone: r.phone,
        name: r.name,
        totalOrders,
        totalSpent: (r.totalSpent ?? new Prisma.Decimal(0)).toString(),
        firstOrderAt: r.firstOrderAt.toISOString(),
        lastOrderAt: r.lastOrderAt.toISOString(),
        tier: tierOf(totalOrders),
      };
    });
  }

  async detail(phone: string): Promise<CustomerDetailDto> {
    // Los telefonos no son keys estables (pueden tener espacios, +, etc.),
    // asi que los comparamos exactos como vienen guardados en Order.
    const orders = await this.prisma.order.findMany({
      where: { customerPhone: phone, status: { not: 'cancelled' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
        createdAt: true,
      },
    });
    if (orders.length === 0) throw new NotFoundException('Cliente no encontrado.');

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter((o) => o.status === 'confirmed' || o.status === 'delivered')
      .reduce((sum, o) => sum.add(o.totalAmount), new Prisma.Decimal(0));

    return {
      phone,
      name: orders[0].customerName,
      totalOrders,
      totalSpent: totalSpent.toString(),
      firstOrderAt: orders[orders.length - 1].createdAt.toISOString(),
      lastOrderAt: orders[0].createdAt.toISOString(),
      tier: tierOf(totalOrders),
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount.toString(),
        paidAmount: o.paidAmount.toString(),
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }
}
