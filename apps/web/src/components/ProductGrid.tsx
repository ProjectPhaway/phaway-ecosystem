import type { ProductDto } from '@phaway/shared';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: ProductDto[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
