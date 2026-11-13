import type { OrderDto, OrderStatus } from '@phaway/shared';

/**
 * Lógica pura para la UI de pedidos. Igual que `OrderStatusPolicy` del backend:
 * se repite aquí porque el frontend no importa código Node del API.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

/** Color de chip. Acento spark para activo; graphite neutro para finales. */
export function statusChipClass(s: OrderStatus): string {
  const base = 'inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-bold uppercase tracking-wider';
  if (s === 'pending') return `${base} border-ink text-ink`;
  if (s === 'confirmed') return `${base} border-spark bg-spark text-paper`;
  if (s === 'delivered') return `${base} border-ok bg-ok text-paper`;
  return `${base} border-graphite text-graphite`;
}

export function nextStatuses(s: OrderStatus): OrderStatus[] {
  return [...TRANSITIONS[s]];
}

export function balance(order: OrderDto): number {
  return Math.max(0, Number(order.totalAmount) - Number(order.paidAmount));
}
