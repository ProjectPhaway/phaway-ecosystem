import { buildWhatsAppUrl, type OrderDto, type OrderStatus } from '@phaway/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorNotice, Notice } from '../components/States';
import { formatPrice } from '../lib/product-view';
import {
  useAdminOrders,
  useChangeOrderStatus,
  useUpdateOrderPayment,
} from '../lib/queries';
import { balance, nextStatuses, STATUS_LABEL, statusChipClass } from './order-helpers';

const DATE = new Intl.DateTimeFormat('es-PE', { dateStyle: 'full', timeStyle: 'short' });
const MONEY = /^\d{1,8}(\.\d{1,2})?$/;

export function OrderDetailPage() {
  const { id = '' } = useParams();
  // Reutilizamos la lista: evita una segunda query y queda en caché.
  const list = useAdminOrders();
  const order = list.data?.find((o) => o.id === id);

  if (list.isPending) return <p className="text-graphite">Cargando pedido…</p>;
  if (list.isError) return <ErrorNotice error={list.error} />;
  if (!order) {
    return (
      <Notice title="Pedido no encontrado" action={<Link to="/admin/ventas" className="btn btn-solid">Volver</Link>}>
        Puede que haya sido borrado o que la URL esté mal.
      </Notice>
    );
  }
  return <Detail order={order} />;
}

function Detail({ order }: { order: OrderDto }) {
  const changeStatus = useChangeOrderStatus();
  const updatePayment = useUpdateOrderPayment();
  const [confirming, setConfirming] = useState<OrderStatus | null>(null);
  const [payment, setPayment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pending = balance(order);
  const transitions = nextStatuses(order.status);

  const clickStatus = (s: OrderStatus) => {
    setError(null);
    if (s !== 'cancelled' && confirming !== s) return setConfirming(s);
    setConfirming(null);
    changeStatus.mutate(
      { id: order.id, status: s },
      { onError: (e) => setError(e.message) },
    );
  };

  const savePayment = () => {
    setError(null);
    if (!MONEY.test(payment.trim())) return setError('Monto inválido.');
    if (Number(payment) > Number(order.totalAmount)) return setError('No puedes pagar más del total.');
    updatePayment.mutate(
      { id: order.id, paidAmount: payment.trim() },
      {
        onSuccess: () => setPayment(''),
        onError: (e) => setError(e.message),
      },
    );
  };

  const waLink = buildWhatsAppUrl(
    `Hola ${order.customerName}, sobre tu pedido ${order.orderNumber}:`,
    order.customerPhone.replace(/\D/g, ''),
  );

  return (
    <>
      <div>
        <Link to="/admin/ventas" className="text-sm text-graphite hover:underline">Ventas</Link>
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <span className={statusChipClass(order.status)}>{STATUS_LABEL[order.status]}</span>
        </div>
        <p className="mt-1 text-graphite">{DATE.format(new Date(order.createdAt))}</p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Items */}
        <section aria-labelledby="items-title">
          <h2 id="items-title" className="text-lg font-bold">Productos</h2>
          <ul className="mt-4 divide-y divide-line border border-line">
            {order.items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-3 p-3">
                <img src={it.variant.product.mainImageUrl} alt="" className="size-14 shrink-0 bg-concrete object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/producto/${it.variant.product.slug}`} target="_blank" className="font-semibold hover:underline">
                    {it.variant.product.name}
                  </Link>
                  <p className="text-sm text-graphite">
                    {it.variant.size} · {it.variant.color} · SKU {it.variant.sku}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-graphite">{it.quantity} × {formatPrice(it.unitPrice)}</p>
                  <p className="font-bold tabular-nums">{formatPrice(Number(it.unitPrice) * it.quantity)}</p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 grid gap-2 border border-ink p-4 text-sm">
            <Row label="Total">{formatPrice(order.totalAmount)}</Row>
            <Row label="Pagado">{formatPrice(order.paidAmount)}</Row>
            <Row label="Saldo" highlight>{pending === 0 ? 'Pagado' : formatPrice(pending)}</Row>
          </dl>
        </section>

        {/* Lateral */}
        <aside className="space-y-8">
          <section aria-labelledby="customer-title">
            <h2 id="customer-title" className="text-lg font-bold">Cliente</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Line label="Nombre">{order.customerName}</Line>
              <Line label="Teléfono">
                <a href={`tel:${order.customerPhone}`} className="link-spark">{order.customerPhone}</a>
              </Line>
              {order.notes && <Line label="Notas"><span className="whitespace-pre-line">{order.notes}</span></Line>}
            </dl>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-4 w-full">
              Escribir por WhatsApp
            </a>
          </section>

          <section aria-labelledby="status-title">
            <h2 id="status-title" className="text-lg font-bold">Estado</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Line label="Creado">{DATE.format(new Date(order.createdAt))}</Line>
              {order.confirmedAt && <Line label="Confirmado">{DATE.format(new Date(order.confirmedAt))}</Line>}
              {order.deliveredAt && <Line label="Entregado">{DATE.format(new Date(order.deliveredAt))}</Line>}
            </dl>

            {transitions.length > 0 ? (
              <div className="mt-4 space-y-2">
                {transitions.map((s) => {
                  const isDanger = s === 'cancelled';
                  const label =
                    s === 'confirmed' ? 'Confirmar (descuenta stock)' :
                    s === 'delivered' ? 'Marcar entregado' :
                    'Cancelar pedido';
                  const pending = confirming === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => clickStatus(s)}
                      onBlur={() => setConfirming((c) => (c === s ? null : c))}
                      disabled={changeStatus.isPending}
                      className={`btn w-full ${isDanger ? 'border-alert text-alert hover:bg-alert hover:text-paper' : pending ? 'btn-spark' : 'btn-outline'}`}
                    >
                      {pending ? 'Confirma de nuevo' : label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-graphite">Este estado es final.</p>
            )}
          </section>

          {order.status !== 'cancelled' && pending > 0 && (
            <section aria-labelledby="payment-title">
              <h2 id="payment-title" className="text-lg font-bold">Registrar pago</h2>
              <p className="mt-1 text-sm text-graphite">Saldo pendiente: {formatPrice(pending)}</p>
              <div className="mt-3 flex gap-2">
                <input
                  className="field tabular-nums"
                  inputMode="decimal"
                  placeholder={pending.toFixed(2)}
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  aria-label="Nuevo monto pagado total"
                />
                <button type="button" className="btn btn-solid" onClick={savePayment} disabled={updatePayment.isPending || !payment.trim()}>
                  Guardar
                </button>
              </div>
              <p className="mt-2 text-xs text-graphite">
                Escribe el <strong>total pagado</strong> (no el abono): reemplaza el valor anterior.
              </p>
            </section>
          )}

          {error && <p role="alert" className="border-l-4 border-alert bg-alert/5 px-3 py-2 text-sm text-alert">{error}</p>}
        </aside>
      </div>
    </>
  );
}

function Row({ label, highlight, children }: { label: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex justify-between ${highlight ? 'border-t border-ink pt-2 text-base font-bold' : ''}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-graphite">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
