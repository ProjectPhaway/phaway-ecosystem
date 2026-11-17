import { Injectable } from '@nestjs/common';
import type {
  DailySalesPoint,
  DashboardKpis,
  LowStockRow,
  OrdersByStatusRow,
  RevenueByCategoryRow,
  TopProductRow,
} from '@phaway/shared';
import { ORDER_STATUSES } from '@phaway/shared';
import { Prisma, type OrderStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Estados que suman ingreso (pedido pagado o pendiente de entrega). */
const REVENUE_STATUSES: OrderStatus[] = ['confirmed', 'delivered'];

function startOfTodayLima(): Date {
  // Peru no tiene horario de verano: UTC-5 fijo. Convertimos ahora a Lima,
  // cortamos a dia, y volvemos a UTC.
  const now = new Date();
  const lima = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  lima.setUTCHours(0, 0, 0, 0);
  return new Date(lima.getTime() + 5 * 60 * 60 * 1000);
}

function startOfMonthLima(): Date {
  const now = new Date();
  const lima = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const start = new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), 1, 0, 0, 0, 0));
  return new Date(start.getTime() + 5 * 60 * 60 * 1000);
}

function daysAgoLima(days: number): Date {
  const start = startOfTodayLima();
  return new Date(start.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis(lowStockThreshold = 3): Promise<DashboardKpis> {
    const todayStart = startOfTodayLima();
    const monthStart = startOfMonthLima();

    const [ordersToday, revenueAgg, pendingOrders, lowStockCount] = await Promise.all([
      this.prisma.order.count({
        where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: todayStart } },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: monthStart } },
      }),
      this.prisma.order.count({ where: { status: 'pending' } }),
      this.prisma.productVariant.count({
        where: { stock: { lte: lowStockThreshold }, product: { isActive: true } },
      }),
    ]);

    return {
      ordersToday,
      revenueThisMonth: (revenueAgg._sum.totalAmount ?? new Prisma.Decimal(0)).toFixed(2),
      pendingOrders,
      lowStockCount,
    };
  }

  /**
   * Ventas por dia en los ultimos `days` dias (incluyendo hoy).
   * Solo cuenta pedidos `confirmed` o `delivered`. Rellena dias sin ventas con cero.
   */
  async dailySales(days = 30): Promise<DailySalesPoint[]> {
    const from = daysAgoLima(days);
    // Group by date (Peru local) via raw: $queryRaw devuelve filas tipadas.
    // Postgres: DATE(orders.created_at AT TIME ZONE 'America/Lima')
    const rows = await this.prisma.$queryRaw<
      Array<{ date: Date; orders: bigint; revenue: Prisma.Decimal | null }>
    >(Prisma.sql`
      SELECT
        DATE("createdAt" AT TIME ZONE 'America/Lima') AS date,
        COUNT(*)::bigint AS orders,
        COALESCE(SUM("totalAmount"), 0)::numeric AS revenue
      FROM "Order"
      WHERE "status" IN ('confirmed', 'delivered')
        AND "createdAt" >= ${from}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    // Mapa YYYY-MM-DD -> {orders, revenue}
    const map = new Map<string, { orders: number; revenue: string }>();
    for (const r of rows) {
      const key = r.date.toISOString().slice(0, 10);
      map.set(key, {
        orders: Number(r.orders),
        revenue: (r.revenue ?? new Prisma.Decimal(0)).toString(),
      });
    }

    const out: DailySalesPoint[] = [];
    const start = daysAgoLima(days);
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = new Date(d.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const found = map.get(key);
      out.push({ date: key, orders: found?.orders ?? 0, revenue: found?.revenue ?? '0.00' });
    }
    return out;
  }

  async topProducts(days = 30, limit = 5): Promise<TopProductRow[]> {
    const from = daysAgoLima(days);
    const rows = await this.prisma.$queryRaw<
      Array<{
        productId: string;
        name: string;
        slug: string;
        unitsSold: bigint;
        revenue: Prisma.Decimal | null;
      }>
    >(Prisma.sql`
      SELECT
        p.id AS "productId",
        p.name AS name,
        p.slug AS slug,
        COALESCE(SUM(oi.quantity), 0)::bigint AS "unitsSold",
        COALESCE(SUM(oi.quantity * oi."unitPrice"), 0)::numeric AS revenue
      FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      JOIN "ProductVariant" v ON v.id = oi."variantId"
      JOIN "Product" p ON p.id = v."productId"
      WHERE o.status IN ('confirmed', 'delivered')
        AND o."createdAt" >= ${from}
      GROUP BY p.id, p.name, p.slug
      ORDER BY revenue DESC
      LIMIT ${limit}
    `);
    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      slug: r.slug,
      unitsSold: Number(r.unitsSold),
      revenue: (r.revenue ?? new Prisma.Decimal(0)).toString(),
    }));
  }

  async ordersByStatus(): Promise<OrdersByStatusRow[]> {
    const grouped = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const map = new Map<OrderStatus, number>();
    for (const g of grouped) map.set(g.status, g._count._all);
    // Devolver siempre los 4 estados (para graficos con slices estables).
    return ORDER_STATUSES.map((status) => ({ status, count: map.get(status) ?? 0 }));
  }

  async revenueByCategory(days = 30): Promise<RevenueByCategoryRow[]> {
    const from = daysAgoLima(days);
    const rows = await this.prisma.$queryRaw<
      Array<{ categoryId: string; name: string; revenue: Prisma.Decimal | null }>
    >(Prisma.sql`
      SELECT
        c.id AS "categoryId",
        c.name AS name,
        COALESCE(SUM(oi.quantity * oi."unitPrice"), 0)::numeric AS revenue
      FROM "Category" c
      LEFT JOIN "Product" p ON p."categoryId" = c.id
      LEFT JOIN "ProductVariant" v ON v."productId" = p.id
      LEFT JOIN "OrderItem" oi ON oi."variantId" = v.id
      LEFT JOIN "Order" o ON o.id = oi."orderId"
        AND o.status IN ('confirmed', 'delivered')
        AND o."createdAt" >= ${from}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `);
    return rows.map((r) => ({
      categoryId: r.categoryId,
      name: r.name,
      revenue: (r.revenue ?? new Prisma.Decimal(0)).toString(),
    }));
  }

  async lowStock(threshold = 3): Promise<LowStockRow[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { stock: { lte: threshold }, product: { isActive: true } },
      orderBy: [{ stock: 'asc' }, { product: { name: 'asc' } }],
      take: 50,
      include: { product: { select: { id: true, name: true, slug: true } } },
    });
    return variants.map((v) => ({
      productId: v.product.id,
      productName: v.product.name,
      slug: v.product.slug,
      variantId: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock,
    }));
  }
}
