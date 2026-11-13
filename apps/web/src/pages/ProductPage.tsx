import { buildWhatsAppReservationMessage, buildWhatsAppUrl } from '@phaway/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { SizeGuideLink } from '../components/SizeGuide';
import { ErrorNotice, Notice } from '../components/States';
import { SITE_URL } from '../config';
import { ApiError } from '../lib/api-client';
import { formatPrice, ProductView } from '../lib/product-view';
import { useProduct } from '../lib/queries';

export function ProductPage() {
  const { slug = '' } = useParams();
  const query = useProduct(slug);

  if (query.isPending) {
    return (
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2" aria-busy="true">
        <div className="aspect-[4/5] animate-pulse bg-concrete motion-reduce:animate-none" />
      </div>
    );
  }
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        {notFound ? (
          <Notice
            title="Este producto ya no está"
            action={<Link to="/catalogo" className="btn btn-solid">Ver catálogo</Link>}
          >
            Puede que se haya agotado o que el enlace esté mal escrito.
          </Notice>
        ) : (
          <ErrorNotice error={query.error} />
        )}
      </div>
    );
  }

  // key: reinicia la seleccion al cambiar de producto.
  return <ProductDetail key={query.data.id} view={new ProductView(query.data)} />;
}

function ProductDetail({ view }: { view: ProductView }) {
  const { product } = view;
  const [image, setImage] = useState(0);
  const [color, setColor] = useState<string | null>(view.colors.length === 1 ? view.colors[0] : null);
  const [size, setSize] = useState<string | null>(null);

  const variant = view.variantFor(size, color);
  const price = view.priceFor(variant);
  const canReserve = !!variant && variant.stock > 0;

  const reserveUrl = canReserve
    ? buildWhatsAppUrl(
        buildWhatsAppReservationMessage({
          productName: product.name,
          category: product.category.name,
          size: variant.size,
          color: variant.color,
          price: Number(price).toFixed(2),
          url: `${SITE_URL}/producto/${product.slug}`,
        }),
      )
    : undefined;

  const hint = !color ? 'Elige un color' : !size ? 'Elige una talla' : !canReserve ? 'Sin stock en esa combinación' : null;

  return (
    <div className="water relative mx-auto grid max-w-[90rem] gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-12">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="aspect-[4/5] overflow-hidden bg-concrete">
          <img src={view.images[image]} alt={product.name} className="size-full object-cover" />
        </div>
        {view.images.length > 1 && (
          <ul className="mt-3 grid grid-cols-5 gap-2">
            {view.images.map((src, i) => (
              <li key={src + i}>
                <button
                  type="button"
                  onClick={() => setImage(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  aria-pressed={image === i}
                  className={`block aspect-square w-full overflow-hidden border-2 ${image === i ? 'border-ink' : 'border-transparent'}`}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <nav aria-label="Ruta" className="text-sm text-graphite">
          <Link to="/catalogo" className="hover:underline">Catálogo</Link>
          {' / '}
          <Link to={`/catalogo?categoria=${product.category.slug}`} className="hover:underline">
            {product.category.name}
          </Link>
        </nav>
        <h1 className="display mt-3 text-[clamp(2.5rem,5vw,4.5rem)]">{product.name}</h1>
        <div className="mt-5 flex items-center gap-3">
          <p className="text-3xl font-bold tabular-nums">{formatPrice(price)}</p>
          {product.isOnSale && (
            <span className="bg-spark px-3 py-1 text-xs font-bold text-paper">Liquidación</span>
          )}
        </div>

        {view.isSoldOut ? (
          <p className="mt-8 border border-ink p-4 font-semibold">
            Agotado. Escríbenos y te avisamos si vuelve a entrar.
          </p>
        ) : (
          <>
            <fieldset className="mt-8">
              <legend className="font-semibold">
                Color {color && <span className="font-normal text-graphite">· {color}</span>}
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {view.colors.map((c) => (
                  <button key={c} type="button" className="chip" aria-pressed={color === c} onClick={() => setColor(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <div className="flex items-baseline justify-between">
                <legend className="font-semibold">Talla</legend>
                <SizeGuideLink className="link-spark text-sm font-semibold" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {view.sizes.map((s) => {
                  const stock = view.stockFor(s, color);
                  return (
                    <button
                      key={s}
                      type="button"
                      className="chip"
                      aria-pressed={size === s}
                      disabled={stock === 0}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <p className="mt-5 min-h-6 text-sm" aria-live="polite">
              {variant && variant.stock > 0 && (
                <span className={variant.stock <= 3 ? 'font-semibold' : 'text-graphite'}>
                  {variant.stock <= 3 ? `Quedan ${variant.stock}` : 'Disponible'}
                </span>
              )}
              {hint && <span className="text-graphite">{hint}</span>}
            </p>
          </>
        )}

        <a
          href={reserveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!canReserve}
          onClick={(e) => !canReserve && e.preventDefault()}
          className={`btn btn-whatsapp mt-4 w-full text-base ${canReserve ? '' : 'pointer-events-none opacity-40'}`}
        >
          Reservar por WhatsApp
        </a>
        <p className="mt-3 text-sm text-graphite">
          Te confirmamos disponibilidad y los pasos para pagar y recibir tu pedido.
        </p>

        {product.description && (
          <div className="mt-10 border-t border-ink pt-6">
            <h2 className="font-bold">Detalles</h2>
            <p className="mt-3 max-w-prose whitespace-pre-line leading-relaxed text-graphite">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
