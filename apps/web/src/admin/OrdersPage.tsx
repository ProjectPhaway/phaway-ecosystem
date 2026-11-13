import type { OrderStatus } from '@phaway/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { ErrorNotice, Notice } from '../components/States';
import { formatPrice } from '../lib/product-view';
import { useAdminOrders } from '../lib/queries';
import { balance, STATUS_LABEL, statusChipClass } from './order-helpers';

const TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
];

const DATE = new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' });

export function OrdersPage() {
  const [tab, setTab] = useState<OrderStatus | 'all'>('all');
  const orders = useAdminOrders(tab === 'all' ? undefined : tab);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ventas</h1>
          {orders.data && <p className="mt-1 text-graphite">{orders.data.length} pedidos</p>}
        </div>
        <Link to="/admin/ventas/nuevo" className="btn btn-solid">
          Nuevo pedido
        </Link>
      </div>

      <nav aria-label="Filtrar por estado" className="mt-6 -mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {TABS.map((t) => (
            <li key={t.key}>
              <button type="button" className="chip whitespace-nowrap" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8">
        {orders.isPending ? (
          <p className="text-graphite">Cargando pedidos…</p>
        ) : orders.isError ? (
          <ErrorNotice error={orders.error} />
        ) : orders.data.length === 0 ? (
          <Notice
            title="Sin pedidos aún"
            action={<Link to="/admin/ventas/nuevo" className="btn btn-solid">Registrar el primero</Link>}
          >
            Cuando un cliente reserve por WhatsApp, registra el pedido aquí para descontar el stock.
          </Notice>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b-2 border-ink">
                <tr>
                  <th className="py-3 pr-4 font-semibold">Pedido</th>
                  <th className="py-3 pr-4 font-semibold">Cliente</th>
                  <th className="py-3 pr-4 font-semibold">Fecha</th>
                  <th className="py-3 pr-4 text-right font-semibold">Total</th>
                  <th className="py-3 pr-4 text-right font-semibold">Saldo</th>
                  <th className="py-3 pr-4 font-semibold">Estado</th>
                  <th className="py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((o) => {
                  const items = o.items.length;
                  const pend = balance(o);
                  return (
                    <tr key={o.id} className="border-b border-line align-middle">
                      <td className="py-3 pr-4">
                        <Link to={`/admin/ventas/${o.id}`} className="font-bold hover:underline">
                          {o.orderNumber}
                        </Link>
                        <p className="text-xs text-graphite">{items} {items === 1 ? 'producto' : 'productos'}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold">{o.customerName}</p>
                        <p className="text-xs text-graphite">{o.customerPhone}</p>
                      </td>
                      <td className="py-3 pr-4 text-graphite">{DATE.format(new Date(o.createdAt))}</td>
                      <td className="py-3 pr-4 text-right font-bold tabular-nums">{formatPrice(o.totalAmount)}</td>
                      <td className={`py-3 pr-4 text-right tabular-nums ${pend === 0 ? 'text-ok' : 'font-semibold'}`}>
                        {pend === 0 ? 'Pagado' : formatPrice(pend)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={statusChipClass(o.status)}>{STATUS_LABEL[o.status]}</span>
                      </td>
                      <td className="py-3 text-right">
                        <Link to={`/admin/ventas/${o.id}`} className="whitespace-nowrap font-semibold hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
