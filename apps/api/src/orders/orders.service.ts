import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { OrderStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  OrderItemInputDto,
  OrderQueryDto,
} from './dto/order.dto';
import { OrderStatusPolicy } from './order-status.policy';

type Tx = Prisma.TransactionClient;

const ORDER_INCLUDE = {
  items: {
    include: {
      variant: {
        select: {
          id: true,
          size: true,
          color: true,
          sku: true,
          product: {
            select: { id: true, name: true, slug: true, mainImageUrl: true },
          },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

/**
 * Ventas (Fase 1: pedidos tomados por WhatsApp y registrados en el panel).
 * Regla critica: confirmar descuenta stock en UNA transaccion; si una sola
 * variante no alcanza, no se descuenta nada (409).
 */
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: OrderQueryDto) {
    return this.prisma.order.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async create(dto: CreateOrderDto) {
    const items = this.mergeItems(dto.items);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
      include: { product: { select: { name: true, basePrice: true } } },
    });
    if (variants.length !== items.length) {
      throw new BadRequestException('Alguna variante no existe');
    }
    const byId = new Map(variants.map((v) => [v.id, v]));

    const lines = items.map((i) => {
      const v = byId.get(i.variantId)!;
      const unitPrice = v.priceOverride ?? v.product.basePrice;
      return {
        variantId: v.id,
        quantity: i.quantity,
        unitPrice,
        snapshotName: `${v.product.name} - ${v.size} / ${v.color}`,
      };
    });
    const total = lines.reduce(
      (sum, l) => sum.add(new Prisma.Decimal(l.unitPrice).mul(l.quantity)),
      new Prisma.Decimal(0),
    );
    const paid = new Prisma.Decimal(dto.paidAmount ?? 0);
    this.assertPaid(paid, total);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: this.newOrderNumber(),
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          notes: dto.notes?.trim() || null,
          totalAmount: total,
          paidAmount: paid,
          items: { create: lines },
        },
      });
      if (dto.confirm) {
        await this.applyStock(tx, lines, 'deduct');
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.confirmed,
            ...OrderStatusPolicy.timestampsFor(OrderStatus.confirmed),
          },
        });
      }
      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: ORDER_INCLUDE,
      });
    });
  }

  async changeStatus(id: string, to: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (!OrderStatusPolicy.canTransition(order.status, to)) {
        throw new ConflictException(
          `No se puede pasar de "${order.status}" a "${to}"`,
        );
      }

      const effect = OrderStatusPolicy.stockEffect(order.status, to);
      if (effect !== 'none') await this.applyStock(tx, order.items, effect);

      // Guarda optimista: si otro usuario cambio el estado en paralelo, no se aplica dos veces.
      const updated = await tx.order.updateMany({
        where: { id, status: order.status },
        data: { status: to, ...OrderStatusPolicy.timestampsFor(to) },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'El pedido cambio mientras se actualizaba. Recarga la pagina.',
        );
      }
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: ORDER_INCLUDE,
      });
    });
  }

  async updatePayment(id: string, paidAmount: string) {
    const order = await this.get(id);
    if (order.status === OrderStatus.cancelled) {
      throw new ConflictException(
        'No se registran pagos en un pedido cancelado',
      );
    }
    const paid = new Prisma.Decimal(paidAmount);
    this.assertPaid(paid, order.totalAmount);
    return this.prisma.order.update({
      where: { id },
      data: { paidAmount: paid },
      include: ORDER_INCLUDE,
    });
  }

  // ---------- Helpers ----------

  /**
   * Descuento condicional (`stock >= qty`) a nivel de base de datos: evita
   * stock negativo aun con dos confirmaciones simultaneas.
   */
  private async applyStock(
    tx: Tx,
    lines: { variantId: string; quantity: number; snapshotName: string }[],
    effect: 'deduct' | 'restore',
  ) {
    for (const l of lines) {
      if (effect === 'restore') {
        await tx.productVariant.update({
          where: { id: l.variantId },
          data: { stock: { increment: l.quantity } },
        });
        continue;
      }
      const res = await tx.productVariant.updateMany({
        where: { id: l.variantId, stock: { gte: l.quantity } },
        data: { stock: { decrement: l.quantity } },
      });
      if (res.count !== 1) {
        const v = await tx.productVariant.findUnique({
          where: { id: l.variantId },
          select: { stock: true },
        });
        throw new ConflictException(
          `Stock insuficiente para ${l.snapshotName}: pedido ${l.quantity}, disponible ${v?.stock ?? 0}`,
        );
      }
    }
  }

  /** Une lineas repetidas de la misma variante. */
  private mergeItems(items: OrderItemInputDto[]): OrderItemInputDto[] {
    const map = new Map<string, number>();
    for (const i of items)
      map.set(i.variantId, (map.get(i.variantId) ?? 0) + i.quantity);
    return [...map].map(([variantId, quantity]) => ({ variantId, quantity }));
  }

  private assertPaid(paid: Prisma.Decimal, total: Prisma.Decimal) {
    if (paid.gt(total)) {
      throw new BadRequestException(
        'El monto pagado no puede superar el total',
      );
    }
  }

  /** PH-261113-4F2A: fecha + sufijo aleatorio, legible para dictar por telefono. */
  private newOrderNumber(now = new Date()): string {
    const d = now.toISOString().slice(2, 10).replace(/-/g, '');
    return `PH-${d}-${randomBytes(2).toString('hex').toUpperCase()}`;
  }
}
