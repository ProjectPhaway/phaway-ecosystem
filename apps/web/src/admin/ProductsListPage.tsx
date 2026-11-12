import { useState } from 'react';
import { Link } from 'react-router';
import { ErrorNotice, Notice } from '../components/States';
import { formatPrice, ProductView } from '../lib/product-view';
import { useAdminProducts, useDeleteProduct } from '../lib/queries';

export function ProductsListPage() {
  const products = useAdminProducts();
  const remove = useDeleteProduct();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
            <p className="mt-1 text-graphite">{products.data.length} en total</p>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b-2 border-ink">
                <tr>
                  <th className="py-3 pr-4 font-semibold">Producto</th>
                  <th className="py-3 pr-4 font-semibold">Categoría</th>
                  <th className="py-3 pr-4 text-right font-semibold">Precio</th>
                  <th className="py-3 pr-4 text-right font-semibold">Stock</th>
                  <th className="py-3 pr-4 font-semibold">Estado</th>
                  <th className="py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {products.data.map((p) => {
                  const view = new ProductView(p);
                  return (
                    <tr key={p.id} className="border-b border-line">
                      <td className="py-3 pr-4">
                        <Link to={`/admin/productos/${p.id}`} className="flex items-center gap-3 hover:underline">
                          <img src={p.mainImageUrl} alt="" className="size-12 shrink-0 bg-concrete object-cover" />
                          <span className="font-semibold">{p.name}</span>
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-graphite">{p.category.name}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{formatPrice(p.basePrice)}</td>
                      <td className={`py-3 pr-4 text-right tabular-nums ${view.isSoldOut ? 'font-bold text-alert' : ''}`}>
                        {view.totalStock}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1.5">
                          {!p.isActive && <span className="border border-ink px-2 py-0.5 text-xs">Oculto</span>}
                          {p.isOnSale && <span className="bg-ink px-2 py-0.5 text-xs text-paper">Liquidación</span>}
                          {p.isActive && !p.isOnSale && <span className="text-xs text-graphite">Catálogo</span>}
                        </div>
                      </td>
                      <td className="py-3 text-right">
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
      </div>
    </>
  );
}
