/**
 * Logica pura de transiciones de pedido. No depende del cliente de Prisma
 * (asi Jest puede testearla sin cargar el runtime) y los strings coinciden
 * 1:1 con el enum `OrderStatus` del schema.prisma.
 */
export const ORDER_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/** Efecto sobre el inventario al pasar de un estado a otro. */
export type StockEffect = 'deduct' | 'restore' | 'none';

/**
 * Maquina de estados de un pedido.
 *
 *   pending ──► confirmed ──► delivered
 *      │            │
 *      └──► cancelled ◄┘
 *
 * - Confirmar descuenta stock. Cancelar un pedido confirmado lo devuelve.
 * - delivered y cancelled son finales.
 */
export class OrderStatusPolicy {
  private static readonly TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  static canTransition(from: OrderStatusValue, to: OrderStatusValue): boolean {
    return this.TRANSITIONS[from].includes(to);
  }

  static allowedFrom(from: OrderStatusValue): OrderStatusValue[] {
    return [...this.TRANSITIONS[from]];
  }

  static stockEffect(from: OrderStatusValue, to: OrderStatusValue): StockEffect {
    if (from === 'pending' && to === 'confirmed') return 'deduct';
    if (from === 'confirmed' && to === 'cancelled') return 'restore';
    return 'none';
  }

  /** Campos de fecha que se sellan al entrar a cada estado. */
  static timestampsFor(to: OrderStatusValue, now = new Date()) {
    if (to === 'confirmed') return { confirmedAt: now };
    if (to === 'delivered') return { deliveredAt: now };
    return {};
  }
}
