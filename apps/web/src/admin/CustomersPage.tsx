import type { CustomerSummaryDto, CustomerTier, OrderStatus } from '@phaway/shared';
import {
  Crown,
  ExternalLink,
  Package,
  Phone,
  PhoneCall,
  RotateCw,
  Search,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ErrorNotice } from '../components/States';
import { formatPrice } from '../lib/product-view';
import { useCustomerDetail, useCustomers } from '../lib/queries';
import { TextInput } from './ui/FormField';
import { Modal } from './ui/Modal';

const TIER_LABEL: Record<CustomerTier, string> = {
  vip: 'VIP',
  recurring: 'Recurrente',
  new: 'Nuevo',
};

const TIER_CLASS: Record<CustomerTier, string> = {
  vip: 'bg-spark text-paper',
  recurring: 'bg-spark-100 text-spark',
  new: 'bg-concrete text-graphite',
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-concrete text-graphite',
  confirmed: 'bg-spark-100 text-spark',
  delivered: 'bg-ok/10 text-ok',
  cancelled: 'bg-alert/10 text-alert',
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const query = useCustomers(search.trim() || undefined);

  const hasData = !query.isPending && !query.isError;
  const total = hasData ? query.data.length : 0;
  const vipCount = hasData ? query.data.filter((c) => c.tier === 'vip').length : 0;
  const recurringCount = hasData ? query.data.filter((c) => c.tier === 'recurring').length : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="mt-1 text-sm text-graphite">
          Lista derivada de los pedidos no cancelados. Aparece un cliente por cada telefono distinto
          que haya comprado. En Fase 2 pasara a una tabla propia con busqueda al registrar pedido.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={<Users className="size-5" />} label="Clientes" value={total} />
        <Stat icon={<RotateCw className="size-5" />} label="Recurrentes (2-4 pedidos)" value={recurringCount} />
        <Stat icon={<Crown className="size-5" />} label="VIP (5+ pedidos)" value={vipCount} tone="spark" />
      </div>

      <section className="rounded-lg border border-line bg-paper">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-base font-bold">Todos los clientes</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-graphite" />
            <TextInput
              className="pl-8"
              placeholder="Buscar por nombre o telefono"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {query.isPending ? (
          <p className="p-6 text-sm text-graphite">Cargando…</p>
        ) : query.isError ? (
          <div className="p-4">
            <ErrorNotice error={query.error} />
          </div>
        ) : query.data.length === 0 ? (
          <EmptyState hasSearch={!!search.trim()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-2 font-semibold">Cliente</th>
                  <th className="px-4 py-2 font-semibold">Telefono</th>
                  <th className="px-4 py-2 text-right font-semibold">Pedidos</th>
                  <th className="px-4 py-2 text-right font-semibold">Gastado</th>
                  <th className="px-4 py-2 font-semibold">Ultima compra</th>
                  <th className="px-4 py-2"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((c) => (
                  <CustomerRow key={c.phone} customer={c} onOpen={() => setSelected(c.phone)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CustomerDetailModal phone={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: 'spark';
}) {
  const bg = tone === 'spark' ? 'bg-spark-100 text-spark' : 'bg-concrete text-graphite';
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-paper p-4">
      <div className={`grid size-10 place-items-center rounded-md ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-graphite">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function CustomerRow({
  customer,
  onOpen,
}: {
  customer: CustomerSummaryDto;
  onOpen: () => void;
}) {
  return (
    <tr className="border-b border-line last:border-0 hover:bg-cloud/40">
      <td className="px-4 py-3">
        <button type="button" onClick={onOpen} className="text-left font-semibold hover:underline">
          {customer.name}
        </button>
        <span className={`ml-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_CLASS[customer.tier]}`}>
          {TIER_LABEL[customer.tier]}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-graphite">{customer.phone}</td>
      <td className="px-4 py-3 text-right tabular-nums">{customer.totalOrders}</td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPrice(customer.totalSpent)}</td>
      <td className="px-4 py-3 text-xs text-graphite">{fmtDate(customer.lastOrderAt)}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-sm font-semibold text-spark hover:underline"
        >
          Ver historial
          <ExternalLink className="size-3" />
        </button>
      </td>
    </tr>
  );
}

function CustomerDetailModal({ phone, onClose }: { phone: string | null; onClose: () => void }) {
  const query = useCustomerDetail(phone);
  const normalizedPhone = query.data ? normalizeWhatsAppPhone(query.data.phone) : '';
  const whatsappUrl = query.data && normalizedPhone
    ? `https://wa.me/${normalizeWhatsAppPhone(query.data.phone)}?text=${encodeURIComponent(
        `Hola ${query.data.name}, te escribimos de Phaway.`,
      )}`
    : undefined;

  return (
    <Modal
      open={!!phone}
      onClose={onClose}
      title="Historial del cliente"
      size="lg"
      dismissible
      footer={
        <>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-solid"
            >
              <PhoneCall className="size-4" />
              Enviar WhatsApp
            </a>
          )}
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cerrar
          </button>
        </>
      }
    >
      {query.isPending ? (
        <p className="text-sm text-graphite">Cargando…</p>
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : query.data ? (
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <InfoRow icon={<UserIcon className="size-4" />} label="Nombre" value={query.data.name} />
            <InfoRow icon={<Phone className="size-4" />} label="Telefono" value={query.data.phone} mono />
            <InfoRow icon={<Package className="size-4" />} label="Pedidos" value={String(query.data.totalOrders)} />
            <InfoRow icon={<Crown className="size-4" />} label="Total gastado" value={formatPrice(query.data.totalSpent)} />
            <InfoRow icon={<RotateCw className="size-4" />} label="Primera compra" value={fmtDate(query.data.firstOrderAt)} />
            <InfoRow icon={<RotateCw className="size-4" />} label="Ultima compra" value={fmtDate(query.data.lastOrderAt)} />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-graphite">
              Pedidos ({query.data.orders.length})
            </h3>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {query.data.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/ventas/${o.id}`}
                      onClick={onClose}
                      className="font-semibold hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <span className="ml-2 text-xs text-graphite">{fmtDate(o.createdAt)}</span>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  <span className="w-20 text-right font-semibold tabular-nums">{formatPrice(o.totalAmount)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-graphite">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-graphite">{label}</p>
        <p className={`mt-0.5 ${mono ? 'font-mono text-xs' : 'text-sm font-medium'}`}>{value}</p>
      </div>
    </div>
  );
}

function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('51') && digits.length >= 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  return digits;
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="p-10 text-center">
        <Users className="mx-auto size-10 text-graphite" />
        <p className="mt-3 text-sm font-semibold">Sin resultados</p>
        <p className="text-xs text-graphite">Probá con otro nombre o telefono.</p>
      </div>
    );
  }
  return (
    <div className="p-10 text-center">
      <Users className="mx-auto size-10 text-graphite" />
      <p className="mt-3 text-sm font-semibold">Aun no hay clientes</p>
      <p className="mt-1 text-xs text-graphite">
        Apenas registres el primer pedido con nombre y telefono, el cliente aparece aqui.
      </p>
      <Link to="/admin/ventas/nuevo" className="btn btn-solid mt-4 inline-flex">
        Registrar primer pedido
      </Link>
    </div>
  );
}
