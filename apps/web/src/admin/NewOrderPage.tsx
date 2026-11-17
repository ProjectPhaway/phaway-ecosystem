import type { OrderInput, ProductDto, ProductVariantDto } from '@phaway/shared';
import { UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { formatPrice } from '../lib/product-view';
import { useAdminProducts, useCreateOrder } from '../lib/queries';
import { CustomerModal, type CustomerDraft } from './ui/CustomerModal';
import { FormField, TextArea, TextInput } from './ui/FormField';

interface Line {
  variant: ProductVariantDto;
  product: ProductDto;
  quantity: number;
}

const MONEY = /^\d{1,8}(\.\d{1,2})?$/;

export function NewOrderPage() {
  const navigate = useNavigate();
  const products = useAdminProducts();
  const create = useCreateOrder();

  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [confirm, setConfirm] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);

  const onSaveCustomer = (c: CustomerDraft) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    // Las notas del cliente se agregan a las del pedido sin pisar lo ya escrito.
    const extras = [c.dni && `DNI: ${c.dni}`, c.address && `Direccion: ${c.address}`, c.notes]
      .filter(Boolean)
      .join(' · ');
    if (extras) setNotes((prev) => (prev ? `${prev}\n${extras}` : extras));
  };

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!products.data) return [];
    const list = products.data.filter((p) => p.isActive && p.variants.some((v) => v.stock > 0));
    if (!q) return list.slice(0, 6);
    return list.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 10);
  }, [products.data, search]);

  const total = lines.reduce(
    (s, l) => s + Number(l.variant.priceOverride ?? l.product.basePrice) * l.quantity,
    0,
  );

  const addVariant = (product: ProductDto, variant: ProductVariantDto) => {
    if (variant.stock === 0) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.variant.id === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock) return prev;
        return prev.map((l) => (l.variant.id === variant.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { variant, product, quantity: 1 }];
    });
    setSearch('');
  };

  const changeQty = (id: string, qty: number) =>
    setLines((prev) => prev.map((l) => (l.variant.id === id ? { ...l, quantity: Math.max(1, Math.min(qty, l.variant.stock)) } : l)));
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.variant.id !== id));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!lines.length) return setError('Agrega al menos un producto al pedido.');
    if (paidAmount && !MONEY.test(paidAmount.trim())) return setError('El monto pagado debe ser un número como 49.90.');
    const paid = Number(paidAmount || 0);
    if (paid > total) return setError('El monto pagado no puede superar el total.');

    const input: OrderInput = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      notes: notes.trim() || undefined,
      items: lines.map((l) => ({ variantId: l.variant.id, quantity: l.quantity })),
      paidAmount: paidAmount.trim() || undefined,
      confirm,
    };
    try {
      const order = await create.mutateAsync(input);
      navigate(`/admin/ventas/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el pedido.');
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin/ventas" className="text-sm text-graphite hover:underline">Ventas</Link>
          <h1 className="mt-1 text-3xl font-bold">Nuevo pedido</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Productos */}
        <section aria-labelledby="prods-title">
          <h2 id="prods-title" className="text-lg font-bold">1. Productos</h2>
          <label className="mt-4 block">
            <span className="sr-only">Buscar producto</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribe para buscar un producto…"
              className="field"
            />
          </label>

          {results.length > 0 && (
            <ul className="mt-2 divide-y divide-line border border-line bg-paper">
              {results.map((p) => (
                <li key={p.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.mainImageUrl} alt="" className="size-12 shrink-0 bg-concrete object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-xs text-graphite">{p.category.name} · {formatPrice(p.basePrice)}</p>
                    </div>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {p.variants.map((v) => {
                      const stock = v.stock;
                      const added = lines.find((l) => l.variant.id === v.id)?.quantity ?? 0;
                      return (
                        <li key={v.id}>
                          <button
                            type="button"
                            className="chip"
                            disabled={stock === 0 || added >= stock}
                            onClick={() => addVariant(p, v)}
                          >
                            {v.size} / {v.color} · {stock > 0 ? `${stock} disp` : 'agotado'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-8 text-base font-bold">Carrito</h3>
          {lines.length === 0 ? (
            <p className="mt-3 border border-dashed border-line p-6 text-center text-sm text-graphite">
              Aún no agregas productos.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line border border-line">
              {lines.map((l) => {
                const price = Number(l.variant.priceOverride ?? l.product.basePrice);
                return (
                  <li key={l.variant.id} className="flex flex-wrap items-center gap-3 p-3">
                    <img src={l.product.mainImageUrl} alt="" className="size-12 shrink-0 bg-concrete object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{l.product.name}</p>
                      <p className="text-xs text-graphite">
                        {l.variant.size} · {l.variant.color} · {formatPrice(price)} c/u
                      </p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={l.variant.stock}
                      value={l.quantity}
                      onChange={(e) => changeQty(l.variant.id, Number(e.target.value))}
                      className="field w-20 tabular-nums"
                      aria-label={`Cantidad de ${l.product.name}`}
                    />
                    <p className="w-24 text-right font-bold tabular-nums">{formatPrice(price * l.quantity)}</p>
                    <button type="button" className="text-sm font-semibold text-alert hover:underline" onClick={() => removeLine(l.variant.id)}>
                      Quitar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Cliente + pago */}
        <section aria-labelledby="customer-title" className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="customer-title" className="text-lg font-bold">2. Cliente y pago</h2>
            <button
              type="button"
              onClick={() => setCustomerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink hover:border-spark hover:text-spark"
            >
              <UserPlus className="size-4" />
              Nuevo cliente
            </button>
          </div>

          <FormField label="Nombre del cliente" required>
            <TextInput
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej: Maria Perez"
              required
            />
          </FormField>
          <FormField label="Teléfono" required>
            <TextInput
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+51 9XX XXX XXX"
              inputMode="tel"
              required
            />
          </FormField>
          <FormField label="Notas" hint="Opcional">
            <TextArea
              className="min-h-24"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Datos extra que te interesa recordar del pedido."
            />
          </FormField>

          <div className="space-y-3 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-2xl font-bold tabular-nums">{formatPrice(total || 0)}</span>
            </div>
            <FormField label="Adelanto recibido · S/ (vacío = 0)">
              <TextInput
                className="tabular-nums"
                inputMode="decimal"
                placeholder={total ? (total / 2).toFixed(2) : '0.00'}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </FormField>
            <label className="flex cursor-pointer gap-3">
              <input type="checkbox" className="mt-1 size-5 accent-ink" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              <span>
                <span className="font-semibold">Confirmar ahora</span>
                <span className="block text-sm text-graphite">Descuenta el stock automáticamente. Desmarca si todavía quieres validar algo.</span>
              </span>
            </label>
          </div>

          {error && <p role="alert" className="border-l-4 border-alert bg-alert/5 px-3 py-2 text-sm text-alert">{error}</p>}

          <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-ink bg-paper px-4 py-4 sm:mx-0 sm:px-0">
            <Link to="/admin/ventas" className="btn btn-outline flex-1 sm:flex-none">Cancelar</Link>
            <button type="submit" className="btn btn-solid flex-1 sm:flex-none" disabled={create.isPending || lines.length === 0}>
              {create.isPending ? 'Guardando…' : confirm ? 'Registrar y confirmar' : 'Registrar pedido'}
            </button>
          </div>
        </section>
      </div>

      <CustomerModal
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        initial={{ name: customerName, phone: customerPhone }}
        onSaved={onSaveCustomer}
      />
    </form>
  );
}
