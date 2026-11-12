import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ProductGrid } from '../components/ProductGrid';
import { ErrorNotice, LoadingGrid, Notice } from '../components/States';
import { useCategories, useProducts } from '../lib/queries';

/** Catalogo general (`/catalogo`) y Liquidación (`/liquidacion`, onSale). */
export function CatalogPage({ onSale = false }: { onSale?: boolean }) {
  const [params, setParams] = useSearchParams();
  const category = params.get('categoria') ?? undefined;
  const q = params.get('q') ?? undefined;
  const [search, setSearch] = useState(q ?? '');

  // Busqueda con espera corta para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search.trim()) next.set('q', search.trim());
      else next.delete('q');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [search, params, setParams]);

  const { data: categories } = useCategories();
  const products = useProducts({ category, q, onSale: onSale || undefined });
  const base = onSale ? '/liquidacion' : '/catalogo';
  const withCategory = (slug?: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('categoria', slug);
    else next.delete('categoria');
    const s = next.toString();
    return `${base}${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <section className={onSale ? 'bg-ink text-paper' : 'border-b border-ink'}>
        <div className="mx-auto max-w-[90rem] px-4 pb-10 pt-14 sm:px-8 md:pt-20">
          <h1 className="display text-[clamp(3rem,10vw,8rem)]">
            {onSale ? 'Liquidación' : 'Catálogo'}
          </h1>
          <p className={`mt-4 max-w-lg text-lg ${onSale ? 'text-paper/70' : 'text-graphite'}`}>
            {onSale
              ? 'Prendas ya producidas a precio de salida. Cuando se acaba una talla, no vuelve.'
              : 'Camisetas, shorts, chalecos, medias, balones y guantes de arquero.'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Filtrar por categoría" className="-mx-4 overflow-x-auto px-4">
            <ul className="flex gap-2">
              <li>
                <Link to={withCategory()} className="chip inline-flex items-center" aria-current={!category ? 'page' : undefined}>
                  Todo
                </Link>
              </li>
              {categories?.map((c) => (
                <li key={c.id}>
                  <Link
                    to={withCategory(c.slug)}
                    className="chip inline-flex items-center whitespace-nowrap"
                    aria-current={category === c.slug ? 'page' : undefined}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <label className="md:w-72">
            <span className="sr-only">Buscar productos</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre"
              className="field"
            />
          </label>
        </div>

        <div className="mt-10">
          {products.isPending ? (
            <LoadingGrid />
          ) : products.isError ? (
            <ErrorNotice error={products.error} />
          ) : products.data.length === 0 ? (
            <Notice
              title={q || category ? 'Sin resultados' : onSale ? 'Sin liquidación por ahora' : 'Pronto más productos'}
              action={
                (q || category) && (
                  <Link to={base} className="btn btn-outline" onClick={() => setSearch('')}>
                    Quitar filtros
                  </Link>
                )
              }
            >
              {q || category
                ? 'No hay productos con esos filtros.'
                : 'Escríbenos por WhatsApp y te contamos qué hay disponible.'}
            </Notice>
          ) : (
            <>
              <p className="mb-6 text-sm text-graphite" aria-live="polite">
                {products.data.length} {products.data.length === 1 ? 'producto' : 'productos'}
              </p>
              <ProductGrid products={products.data} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
