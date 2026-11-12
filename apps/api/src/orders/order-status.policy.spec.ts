import { OrderStatusPolicy } from './order-status.policy';

// El spec no importa el cliente de Prisma generado (Jest no lo resuelve).
// Usamos las strings del enum directamente; Prisma genera estos mismos valores.
const pending = 'pending' as const;
const confirmed = 'confirmed' as const;
const delivered = 'delivered' as const;
const cancelled = 'cancelled' as const;

describe('OrderStatusPolicy', () => {
  it.each([
    [pending, confirmed, true],
    [pending, cancelled, true],
    [pending, delivered, false],
    [confirmed, delivered, true],
    [confirmed, cancelled, true],
    [confirmed, pending, false],
    [delivered, cancelled, false],
    [cancelled, confirmed, false],
  ])('%s -> %s permitido: %s', (from, to, expected) => {
    expect(OrderStatusPolicy.canTransition(from, to)).toBe(expected);
  });

  it('confirmar descuenta stock y cancelar un confirmado lo devuelve', () => {
    expect(OrderStatusPolicy.stockEffect(pending, confirmed)).toBe('deduct');
    expect(OrderStatusPolicy.stockEffect(confirmed, cancelled)).toBe('restore');
    expect(OrderStatusPolicy.stockEffect(pending, cancelled)).toBe('none');
    expect(OrderStatusPolicy.stockEffect(confirmed, delivered)).toBe('none');
  });

  it('sella la fecha del estado', () => {
    const now = new Date('2026-11-13T10:00:00Z');
    expect(OrderStatusPolicy.timestampsFor(confirmed, now)).toEqual({ confirmedAt: now });
    expect(OrderStatusPolicy.timestampsFor(delivered, now)).toEqual({ deliveredAt: now });
    expect(OrderStatusPolicy.timestampsFor(cancelled, now)).toEqual({});
  });
});
