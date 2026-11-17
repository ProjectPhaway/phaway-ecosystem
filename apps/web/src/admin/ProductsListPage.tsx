import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ErrorNotice, Notice } from '../components/States';
import { formatPrice, ProductView } from '../lib/product-view';
import { useAdminProducts, useDeleteProduct } from '../lib/queries';

interface CategoryGroup {
  id: string;
  name: string;
  products: ReturnType<typeof useAdminProducts>['data'] extends (infer P)[] | undefined ? P[] : never;
}

export function ProductsListPage() {
  const products = useAdminProducts();
  const remove = useDeleteProduct();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const groups = useMemo<CategoryGroup[]>(() => {
    if (!products.data) return [];
    const byCat = new Map<string, CategoryGroup>();
    for (const p of products.data) {
      const key = p.category.id;
      let g = byCat.get(key);
      if (!g) {
        g = { id: key, name: p.category.name, products: [] };
        byCat.set(key, g);
      }
      g.products.push(p);
    }
    return [...byCat.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [products.data]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onDelete = (id: string, name: string) => {
    if (confirming !== id) {
      setConfirming(id);
      return;
    }
    setConfirming(null);
    remove.mutate(id, {
      onSuccess: (r) =>
        setMessage(
          r.deleted
            ? `"${name}" se eliminó.`
            : `"${name}" tiene pedidos, así que se ocultó de la tienda en lugar de eliminarse.`,
        ),
      onError: (e) => setMessage(e.message),
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          {products.data && (
            <p className="mt-1 text-graphite">
              {products.data.length} en total · {groups.length} {groups.length === 1 ? 'categoría' : 'categorías'}
            </p>
          )}
        </div>
        <Link to="/admin/productos/nuevo" className="btn btn-solid">
          Nuevo producto
        </Link>
      </div>

      {message && (
        <p role="status" className="mt-6 border-l-4 border-ink bg-concrete px-4 py-3 text-sm">
          {message}
        </p>
      )}

      <div className="mt-8">
        {products.isPending ? (
          <p className="text-graphite">Cargando productos…</p>
        ) : products.isError ? (
          <ErrorNotice error={products.error} />
        ) : products.data.length === 0 ? (
          <Notice
            title="Aún no hay productos"
            action={<Link to="/admin/productos/nuevo" className="btn btn-solid">Subir el primero</Link>}
          >
            Sube una foto, ponle precio y tallas, y aparecerá en la tienda.
          </Notice>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const isCollapsed = collapsed.has(group.id);
              const sold = group.products.reduce((s, p) => s + (new ProductView(p).isSoldOut ? 1 : 0), 0);
              return (
                <section key={group.id} className="overflow-hidden rounded-lg border border-line bg-paper">
                  <button
                    type="button"
                    onClick={() => toggle(group.id)}
                    aria-expanded={!isCollapsed}
                    aria-controls={`cat-${group.id}`}
                    className="flex w-full items-center justify-between gap-3 bg-cloud/60 px-4 py-3 text-left transition-colors hover:bg-cloud"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={`size-4 text-graphite transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                      <h2 className="text-base font-bold">{group.name}</h2>
                      <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-graphite ring-1 ring-line">
                        {group.products.length}
                      </span>
                    </div>
                    {sold > 0 && (
                      <span className="text-xs font-semibold text-alert">
                        {sold} agotado{sold === 1 ? '' : 's'}
                      </span>
                    )}
                  </button>

                  {!isCollapsed && (
                    <div id={`cat-${group.id}`} className="overflow-x-auto">
                      <table className="w-full min-w-[44rem] text-left text-sm">
                        <thead className="border-b border-line">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Producto</th>
                            <th className="px-4 py-2 text-right font-semibold">Precio</th>
                            <th className="px-4 py-2 text-right font-semibold">Stock</th>
                            <th className="px-4 py-2 font-semibold">Estado</th>
                            <th className="px-4 py-2"><span className="sr-only">Acciones</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.products.map((p) => {
                            const view = new ProductView(p);
                            return (
                              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-cloud/30">
                                <td className="px-4 py-3">
                                  <Link to={`/admin/productos/${p.id}`} className="flex items-center gap-3 hover:underline">
                                    <img src={p.mainImageUrl} alt="" className="size-12 shrink-0 rounded-md bg-concrete object-cover" />
                                    <span className="font-semibold">{p.name}</span>
                                  </Link>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatPrice(p.basePrice)}</td>
                                <td className={`px-4 py-3 text-right tabular-nums ${view.isSoldOut ? 'font-bold text-alert' : ''}`}>
                                  {view.totalStock}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {!p.isActive && <span className="rounded border border-ink px-2 py-0.5 text-xs">Oculto</span>}
                                    {p.isOnSale && <span className="rounded bg-ink px-2 py-0.5 text-xs text-paper">Liquidación</span>}
                                    {p.isActive && !p.isOnSale && <span className="text-xs text-graphite">Catálogo</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-4 whitespace-nowrap">
                                    <Link to={`/admin/productos/${p.id}`} className="font-semibold hover:underline">
                                      Editar
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => onDelete(p.id, p.name)}
                                      onBlur={() => setConfirming((c) => (c === p.id ? null : c))}
                                      disabled={remove.isPending}
                                      className={`font-semibold hover:underline ${confirming === p.id ? 'text-alert' : 'text-graphite'}`}
                                    >
                                      {confirming === p.id ? '¿Eliminar? Confirmar' : 'Eliminar'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
