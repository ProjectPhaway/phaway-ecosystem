import type { OrderStatus } from '@phaway/shared';
import {
  AlertTriangle,
  ClipboardList,
  Clock,
  DollarSign,
  Package,
  PackagePlus,
  PlusCircle,
  Receipt,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  useDailySales,
  useDashboardKpis,
  useLowStock,
  useOrdersByStatus,
  useRevenueByCategory,
  useSession,
  useTopProducts,
} from '../lib/queries';

type RangeOption = 7 | 30 | 90 | 365;
const RANGE_OPTIONS: Array<{ value: RangeOption; label: string }> = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
  { value: 365, label: 'Año' },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#4e5663',
  confirmed: '#1d4ed8',
  delivered: '#087443',
  cancelled: '#b42318',
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendientes',
  confirmed: 'Confirmados',
  delivered: 'Entregados',
  cancelled: 'Cancelados',
};

function formatS(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return 'S/ 0';
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00-05:00`);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export function InicioPage() {
  const session = useSession();
  const [range, setRange] = useState<RangeOption>(30);

  const firstName = session?.user.name.split(' ')[0] ?? '';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-graphite">Bienvenido{firstName ? `, ${firstName}` : ''}</p>
          <h1 className="mt-1 text-2xl font-bold">Inicio</h1>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </header>

      <Kpis />

      <section className="grid gap-5 lg:grid-cols-6">
        <DailySalesCard range={range} />
        <OrdersByStatusCard />
      </section>

      <section className="grid gap-5 lg:grid-cols-6">
        <TopProductsCard range={range} />
        <RevenueByCategoryCard range={range} />
      </section>

      <LowStockCard />

      <section aria-label="Accesos rapidos">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-graphite">
          Accesos rapidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/admin/productos/nuevo" icon={PackagePlus} title="Nuevo producto" />
          <QuickLink to="/admin/productos" icon={Package} title="Ver productos" />
          <QuickLink to="/admin/ventas/nuevo" icon={PlusCircle} title="Nuevo pedido" />
          <QuickLink to="/admin/ventas" icon={ClipboardList} title="Pedidos" />
        </div>
      </section>
    </div>
  );
}

function RangePicker({ value, onChange }: { value: RangeOption; onChange: (v: RangeOption) => void }) {
  return (
    <div role="radiogroup" aria-label="Rango de tiempo" className="flex overflow-hidden rounded-lg border border-line bg-paper">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === opt.value ? 'bg-ink text-paper' : 'text-graphite hover:bg-concrete'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Kpis() {
  const kpis = useDashboardKpis(3);
  const data = kpis.data;
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={<Receipt className="size-5" />}
        label="Pedidos hoy"
        value={kpis.isPending ? '—' : String(data?.ordersToday ?? 0)}
        tone="spark"
      />
      <KpiCard
        icon={<DollarSign className="size-5" />}
        label="Ingresos del mes"
        value={kpis.isPending ? '—' : formatS(data?.revenueThisMonth ?? '0')}
        tone="ok"
      />
      <KpiCard
        icon={<Clock className="size-5" />}
        label="Pedidos pendientes"
        value={kpis.isPending ? '—' : String(data?.pendingOrders ?? 0)}
        tone="muted"
      />
      <KpiCard
        icon={<AlertTriangle className="size-5" />}
        label="Variantes bajo stock"
        value={kpis.isPending ? '—' : String(data?.lowStockCount ?? 0)}
        tone={data && data.lowStockCount > 0 ? 'alert' : 'muted'}
      />
    </section>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'spark' | 'ok' | 'muted' | 'alert';
}) {
  const badge = {
    spark: 'bg-spark-100 text-spark',
    ok: 'bg-ok/10 text-ok',
    muted: 'bg-concrete text-graphite',
    alert: 'bg-alert/10 text-alert',
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-paper p-4">
      <div className={`grid size-10 place-items-center rounded-md ${badge}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-graphite">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function DailySalesCard({ range }: { range: RangeOption }) {
  const query = useDailySales(range);
  const data = useMemo(
    () => (query.data ?? []).map((p) => ({ ...p, revenueNum: Number(p.revenue) })),
    [query.data],
  );
  const totalOrders = data.reduce((s, p) => s + p.orders, 0);
  const totalRevenue = data.reduce((s, p) => s + p.revenueNum, 0);

  return (
    <ChartCard
      className="lg:col-span-4"
      title="Ventas en el tiempo"
      subtitle={
        query.isPending
          ? 'Cargando…'
          : `${totalOrders} pedido${totalOrders === 1 ? '' : 's'} · ${formatS(totalRevenue)}`
      }
    >
      {query.isPending ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={{ fontSize: 11, fill: '#4e5663' }}
              interval={range > 30 ? Math.ceil(range / 10) : 'preserveStartEnd'}
            />
            <YAxis
              yAxisId="left"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#4e5663' }}
              width={28}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#4e5663' }}
              tickFormatter={(v) => `S/${v.toLocaleString('es-PE')}`}
              width={60}
            />
            <Tooltip
              labelFormatter={(l) => formatDay(l as string)}
              formatter={(value, key) =>
                key === 'revenueNum' ? [formatS(value as number), 'Ingresos'] : [value, 'Pedidos']
              }
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              name="Pedidos"
              stroke="#0a0a0f"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenueNum"
              name="Ingresos"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function OrdersByStatusCard() {
  const query = useOrdersByStatus();
  const data = useMemo(
    () => (query.data ?? []).map((r) => ({ name: STATUS_LABEL[r.status], value: r.count, status: r.status })),
    [query.data],
  );
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      className="lg:col-span-2"
      title="Pedidos por estado"
      subtitle={query.isPending ? 'Cargando…' : `${total} pedido${total === 1 ? '' : 's'} en total`}
    >
      {query.isPending ? (
        <ChartSkeleton />
      ) : total === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={82}
              paddingAngle={2}
            >
              {data.map((row) => (
                <Cell key={row.status} fill={STATUS_COLORS[row.status]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [v, 'Pedidos']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function TopProductsCard({ range }: { range: RangeOption }) {
  const query = useTopProducts(range, 5);
  const data = useMemo(
    () => (query.data ?? []).map((r) => ({ ...r, revenueNum: Number(r.revenue) })),
    [query.data],
  );
  return (
    <ChartCard
      className="lg:col-span-3"
      title="Top productos"
      subtitle={query.isPending ? 'Cargando…' : `5 mas vendidos del periodo`}
    >
      {query.isPending ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `S/${v.toLocaleString('es-PE')}`}
              tick={{ fontSize: 11, fill: '#4e5663' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: '#0a0a0f' }}
            />
            <Tooltip
              formatter={(_v, _k, entry) => [
                `${formatS(entry.payload.revenueNum)} · ${entry.payload.unitsSold} und`,
                'Ingresos',
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="revenueNum" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function RevenueByCategoryCard({ range }: { range: RangeOption }) {
  const query = useRevenueByCategory(range);
  const data = useMemo(
    () => (query.data ?? []).map((r) => ({ ...r, revenueNum: Number(r.revenue) })),
    [query.data],
  );
  const total = data.reduce((s, r) => s + r.revenueNum, 0);
  return (
    <ChartCard
      className="lg:col-span-3"
      title="Ingresos por categoria"
      subtitle={query.isPending ? 'Cargando…' : `${formatS(total)} en el periodo`}
    >
      {query.isPending ? (
        <ChartSkeleton />
      ) : total === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#4e5663' }}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={(v) => `S/${v.toLocaleString('es-PE')}`}
              tick={{ fontSize: 11, fill: '#4e5663' }}
              width={60}
            />
            <Tooltip
              formatter={(v) => [formatS(v as number), 'Ingresos']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="revenueNum" fill="#2a68ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function LowStockCard() {
  const query = useLowStock(3);
  const data = query.data ?? [];
  return (
    <section className="rounded-lg border border-line bg-paper">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="text-base font-bold">Stock bajo</h2>
          <p className="text-xs text-graphite">Variantes activas con 3 o menos unidades.</p>
        </div>
        <Link to="/admin/productos" className="text-xs font-semibold text-spark hover:underline">
          Ir al catálogo →
        </Link>
      </header>
      {query.isPending ? (
        <p className="p-6 text-sm text-graphite">Cargando…</p>
      ) : data.length === 0 ? (
        <p className="p-6 text-sm text-graphite">
          Todo en orden: ninguna variante tiene stock bajo 3 unidades.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {data.map((v) => (
            <li key={v.variantId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/admin/productos/${v.productId}`}
                  className="font-semibold hover:underline"
                >
                  {v.productName}
                </Link>
                <span className="text-xs text-graphite">
                  {' · '}
                  {v.size} / {v.color}
                </span>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
                  v.stock === 0 ? 'bg-alert text-paper' : 'bg-alert/10 text-alert'
                }`}
              >
                {v.stock === 0 ? 'Agotado' : `${v.stock} disp`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ChartCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-line bg-paper p-4 ${className ?? ''}`}>
      <header className="mb-3">
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-graphite">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function ChartSkeleton() {
  return <div className="h-60 animate-pulse rounded-md bg-concrete" />;
}

function EmptyChart() {
  return (
    <div className="grid h-60 place-items-center rounded-md bg-cloud/40 text-xs text-graphite">
      Aun no hay datos para el periodo.
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-line bg-paper p-3 transition-colors hover:border-spark hover:bg-spark-100/40"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-spark-100 text-spark transition-colors group-hover:bg-spark group-hover:text-paper">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
    </Link>
  );
}
