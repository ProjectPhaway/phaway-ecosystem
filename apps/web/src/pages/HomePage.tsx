import { buildWhatsAppUrl } from '@phaway/shared';
import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { useCategories, useProducts } from '../lib/queries';

const QUOTE_MESSAGE = 'Hola Phaway, quiero cotizar uniformes personalizados para mi equipo.';

export function HomePage() {
  return (
    <>
      <Hero />
      <SaleStrip />
      <Categories />
      <CustomTeaser />
      <Reasons />
    </>
  );
}

/** El ala del logo a gran escala, recortada sin el wordmark. */
function Wing({ className = '' }: { className?: string }) {
  // La opacidad va en el contenedor y la animacion en la imagen: si no, la animacion la pisa.
  return (
    <div className={`aspect-[2364/1530] overflow-hidden ${className}`} aria-hidden="true">
      <img src="/brand/phaway-negro.png" alt="" className="wing-in block w-full" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink">
      {/* Celular/tablet: marca de agua tenue. Escritorio: ala completa a la derecha, sin tocar el titular. */}
      <Wing className="pointer-events-none absolute -right-[20%] top-10 w-[100%] opacity-[0.06] lg:-right-[5%] lg:top-1/2 lg:w-[46%] lg:-translate-y-1/2 lg:opacity-100" />

      <div className="relative mx-auto max-w-[90rem] px-4 pb-14 pt-16 sm:px-8 md:pb-24 md:pt-24">
        <h1 className="display text-[clamp(3.6rem,13vw,9rem)]">
          Pasión
          <br />
          por el
          <br />
          deporte.
        </h1>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-graphite">
          Uniformes sublimados con el nombre y número de cada jugador, y prendas listas para
          entrenar. Envíos a todo el Perú.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/catalogo" className="btn btn-solid">
            Ver catálogo
          </Link>
          <a
            href={buildWhatsAppUrl(QUOTE_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline bg-paper"
          >
            Cotiza tu uniforme
          </a>
        </div>
      </div>
    </section>
  );
}

function SaleStrip() {
  const { data } = useProducts({ onSale: true });
  if (!data?.length) return null;

  return (
    <section className="bg-ink py-16 text-paper" aria-labelledby="sale-title">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="sale-title" className="display text-5xl md:text-7xl">
              Liquidación
            </h2>
            <p className="mt-3 text-paper/70">Stock limitado. Precios que no vuelven.</p>
          </div>
          <Link
            to="/liquidacion"
            className="btn border-paper text-paper hover:bg-paper hover:text-ink"
          >
            Ver toda la liquidación
          </Link>
        </div>
      </div>

      <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-8 [scrollbar-width:thin]">
        {data.slice(0, 8).map((p) => (
          <li
            key={p.id}
            className="w-[70%] shrink-0 snap-start sm:w-[42%] lg:w-[23%] [&_.text-graphite]:text-paper/60"
          >
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Categories() {
  const { data: categories } = useCategories();
  if (!categories?.length) return null;

  return (
    <section className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8" aria-labelledby="cat-title">
      <h2 id="cat-title" className="display text-5xl md:text-6xl">
        Compra por tipo
      </h2>
      <ul className="mt-10 grid grid-cols-2 border-l border-t border-ink md:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id} className="border-b border-r border-ink">
            <Link
              to={`/catalogo?categoria=${c.slug}`}
              className="group flex aspect-[3/2] items-end p-4 md:aspect-[2/1] transition-colors hover:bg-ink hover:text-paper sm:p-6"
            >
              <span className="display text-[clamp(1.6rem,4.2vw,3.4rem)]">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CustomTeaser() {
  return (
    <section className="border-y border-ink bg-concrete" aria-labelledby="custom-title">
      <div className="mx-auto grid max-w-[90rem] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2">
        <div className="relative mx-auto grid w-full max-w-xl grid-cols-[1fr_0.8fr] gap-4">
          <img
            src="/personalizados/koala.jpg"
            alt="Diseño personalizado de camiseta verde con mascota de koala"
            loading="lazy"
            className="row-span-2 h-full w-full object-cover"
          />
          <img
            src="/personalizados/fuego.jpg"
            alt="Diseño personalizado de camiseta roja con llamas blancas"
            loading="lazy"
            className="w-full object-cover"
          />
          <img
            src="/personalizados/morado.jpg"
            alt="Diseño personalizado de camiseta negra y morada para colegio"
            loading="lazy"
            className="w-full object-cover"
          />
        </div>

        <div>
          <h2 id="custom-title" className="display text-5xl md:text-7xl">
            Tu equipo,
            <br />
            tu diseño.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-graphite">
            Diseñamos con tu escudo, tus colores y los auspiciadores del equipo. Cada camiseta
            sale con el nombre y número de su jugador.
          </p>
          <ol className="mt-8 max-w-lg divide-y divide-ink border-y border-ink">
            {[
              ['Cuéntanos tu idea', 'Colores, escudo, cantidades y tallas por dama y varón.'],
              ['Aprueba el diseño', 'Te enviamos la propuesta y ajustamos hasta que quede.'],
              ['Recíbelo en casa', 'Pagas 50% al iniciar y 50% al recibir. Enviamos por agencia.'],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-5 py-4">
                <span className="display text-3xl tabular-nums">{i + 1}</span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-graphite">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={buildWhatsAppUrl(QUOTE_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              Cotizar por WhatsApp
            </a>
            <Link to="/personalizados" className="btn btn-outline">
              Ver trabajos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reasons() {
  const items = [
    ['Envíos a todo el Perú', 'Despachamos por agencia a tu ciudad, con seguimiento del pedido.'],
    ['Pago 50/50', 'En uniformes a medida pagas la mitad al iniciar y la otra mitad al recibir.'],
    ['Sublimado que dura', 'El color va dentro de la tela: no se cuartea ni se despega con el lavado.'],
  ];
  return (
    <section className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8" aria-label="Por qué Phaway">
      <ul className="grid gap-10 md:grid-cols-3">
        {items.map(([title, text]) => (
          <li key={title} className="border-t-2 border-ink pt-5">
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 max-w-sm text-graphite">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
