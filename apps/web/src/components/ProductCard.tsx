import type { ProductDto } from '@phaway/shared';
import { Link } from 'react-router';
import { formatPrice, ProductView } from '../lib/product-view';

export function ProductCard({ product }: { product: ProductDto }) {
  const view = new ProductView(product);
  const hasRange = view.fromPrice !== String(Number(product.basePrice));

  return (
    <Link to={`/producto/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-concrete">
        <img
          src={product.mainImageUrl}
          alt={product.name}
          loading="lazy"
          className={`size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${view.isSoldOut ? 'opacity-40 grayscale' : ''}`}
        />
        {product.isOnSale && !view.isSoldOut && (
          <span className="absolute bottom-0 left-0 bg-spark px-3 py-1.5 text-xs font-bold text-paper">
            Liquidación
          </span>
        )}
        {view.isSoldOut && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="display bg-paper px-4 py-2 text-2xl">Agotado</span>
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold group-hover:underline">{product.name}</h3>
          <p className="text-sm text-graphite">
            {product.category.name} · {view.colors.length} {view.colors.length === 1 ? 'color' : 'colores'}
          </p>
        </div>
        <p className="shrink-0 font-bold tabular-nums">
          {hasRange && <span className="text-sm font-normal text-graphite">desde </span>}
          {formatPrice(view.fromPrice)}
        </p>
      </div>
    </Link>
  );
}
