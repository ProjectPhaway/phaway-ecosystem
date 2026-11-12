import type { ProductDto, ProductVariantDto } from '@phaway/shared';

const PEN = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

/** "49.9" -> "S/ 49.90". El API manda dinero como string. */
export function formatPrice(amount: string | number): string {
  return PEN.format(Number(amount)).replace(/\s/g, ' ');
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/**
 * Vista de lectura de un producto: agrupa la logica de tallas, colores, stock y precio
 * para que los componentes solo pinten.
 */
export class ProductView {
  readonly product: ProductDto;

  constructor(product: ProductDto) {
    this.product = product;
  }

  get images(): string[] {
    return [this.product.mainImageUrl, ...this.product.galleryImages];
  }

  get totalStock(): number {
    return this.product.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  get isSoldOut(): boolean {
    return this.totalStock === 0;
  }

  get colors(): string[] {
    return [...new Set(this.product.variants.map((v) => v.color))];
  }

  get sizes(): string[] {
    const sizes = [...new Set(this.product.variants.map((v) => v.size))];
    return sizes.sort((a, b) => ProductView.sizeRank(a) - ProductView.sizeRank(b) || a.localeCompare(b, 'es', { numeric: true }));
  }

  variantFor(size: string | null, color: string | null): ProductVariantDto | undefined {
    if (!size || !color) return undefined;
    return this.product.variants.find((v) => v.size === size && v.color === color);
  }

  stockFor(size: string, color: string | null): number {
    if (color) return this.variantFor(size, color)?.stock ?? 0;
    return this.product.variants.filter((v) => v.size === size).reduce((s, v) => s + v.stock, 0);
  }

  priceFor(variant?: ProductVariantDto): string {
    return variant?.priceOverride ?? this.product.basePrice;
  }

  /** Precio "desde" cuando las variantes tienen precios distintos. */
  get fromPrice(): string {
    const prices = [this.product.basePrice, ...this.product.variants.map((v) => v.priceOverride).filter((p): p is string => !!p)];
    return String(Math.min(...prices.map(Number)));
  }

  private static sizeRank(size: string): number {
    const i = SIZE_ORDER.indexOf(size.toUpperCase());
    return i === -1 ? 100 : i;
  }
}
