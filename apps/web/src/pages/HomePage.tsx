import type { ProductDto } from '@phaway/shared';
import { buildWhatsAppUrl } from '@phaway/shared';
import { Link } from 'react-router';
import {
  IconBus,
  IconClock,
  IconFacebook,
  IconInstagram,
  IconMapPin,
  IconPackage,
  IconShield,
  IconSpark,
  IconStore,
  IconTiktok,
  IconTruck,
} from '../components/icons';
import { CategoryTile } from '../components/CategoryTile';
import { ProductCard } from '../components/ProductCard';
import { ScrollIntro } from '../components/ScrollIntro';
import { CONTACT, SHIPPING_PARTNERS, SOCIAL, STORE } from '../config';
import { useCategories, useProducts } from '../lib/queries';

const QUOTE_MESSAGE = 'Hola Phaway, quiero cotizar uniformes personalizados para mi equipo.';

export function HomePage() {
  return (
    <>
      <ScrollIntro />
      <Hero />
      <SaleStrip />
      <Categories />
      <CustomTeaser />
      <StoreSection />
      <ShippingSection />
      <Reasons />
    </>
  );
}

/** Ala del logo a gran escala, recortada sin el wordmark. */
function Wing({ className = '' }: { className?: string }) {
  return (
    <div className={`aspect-[2364/1530] overflow-hidden ${className}`} aria-hidden="true">
      <img src="/brand/phaway-negro.png" alt="" className="wing-in block w-full" />
    </div>
  );
}

function Hero() {
  return (
    <section className="water relative overflow-hidden border-b border-line">
      {/* Blobs de agua al fondo */}
      <div aria-hidden="true" className="drift pointer-events-none absolute -left-32 top-24 size-[32rem] rounded-full bg-spark-300/50 blur-3xl" />
      <div aria-hidden="true" className="drift pointer-events-none absolute right-10 bottom-0 size-80 rounded-full bg-mist blur-3xl" />

      <Wing className="pointer-events-none absolute -right-[20%] top-10 w-[100%] opacity-[0.08] lg:-right-[5%] lg:top-1/2 lg:w-[46%] lg:-translate-y-1/2 lg:opacity-100" />

      <div className="relative mx-auto max-w-[90rem] px-4 pb-14 pt-16 sm:px-8 md:pb-24 md:pt-24">
        <span className="inline-flex items-center gap-2 border border-spark/40 bg-paper/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-spark">
          <IconSpark className="size-3.5" />
          Sublimado premium · Hecho en Perú
        </span>
        <h1 className="display mt-6 text-[clamp(3.6rem,13vw,9rem)]">
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
          <a href={buildWhatsAppUrl(QUOTE_MESSAGE)} target="_blank" rel="noopener noreferrer" className="btn btn-outline bg-paper">
            Cotiza tu uniforme
          </a>
        </div>

        <ul className="mt-10 flex items-center gap-4" aria-label="Síguenos">
          <li className="text-xs font-semibold uppercase tracking-wider text-graphite">Síguenos</li>
          {[
            { href: SOCIAL.instagram, Icon: IconInstagram, label: 'Instagram' },
            { href: SOCIAL.facebook, Icon: IconFacebook, label: 'Facebook' },
            { href: SOCIAL.tiktok, Icon: IconTiktok, label: 'TikTok' },
          ].map(({ href, Icon, label }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid size-10 place-items-center rounded-full border border-ink/80 text-ink transition-colors hover:border-spark hover:bg-spark hover:text-paper"
              >
                <Icon className="size-4.5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SaleStrip() {
  const { data } = useProducts({ onSale: true });
  if (!data?.length) return null;

  return (
    <section className="water-dark relative overflow-hidden py-16" aria-labelledby="sale-title">
      <div aria-hidden="true" className="drift pointer-events-none absolute left-1/3 top-10 size-96 rounded-full bg-spark/40 blur-3xl" />
      <div className="relative mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 border border-spark/50 bg-paper/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <IconSpark className="size-3.5" />
              Oferta activa
            </span>
            <h2 id="sale-title" className="display mt-3 text-5xl md:text-7xl">
              Liquidación
            </h2>
            <p className="mt-3 text-paper/70">Stock limitado. Precios que no vuelven.</p>
          </div>
          <Link to="/liquidacion" className="btn btn-spark">
            Ver toda la liquidación
          </Link>
        </div>
      </div>

      <ul className="relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-8 [scrollbar-width:thin]">
        {data.slice(0, 8).map((p) => (
          <li
            key={p.id}
            className="w-[70%] shrink-0 snap-start sm:w-[42%] lg:w-[23%] [&_.text-graphite]:text-paper/70"
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
  const { data: products } = useProducts({});
  if (!categories?.length) return null;

  const byCategory = new Map<string, ProductDto[]>();
  for (const p of products ?? []) {
    const list = byCategory.get(p.category.slug) ?? [];
    list.push(p);
    byCategory.set(p.category.slug, list);
  }

  return (
    <section className="water relative mx-auto max-w-[90rem] px-4 py-16 sm:px-8 md:py-20" aria-labelledby="cat-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="cat-title" className="display text-4xl md:text-5xl">Compra por tipo</h2>
        <Link to="/catalogo" className="link-spark text-sm font-semibold">
          Ver todo el catálogo
        </Link>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {categories.map((c) => (
          <li key={c.id}>
            <CategoryTile category={c} products={byCategory.get(c.slug) ?? []} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CustomTeaser() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-cloud" aria-labelledby="custom-title">
      <div aria-hidden="true" className="drift pointer-events-none absolute -right-20 top-10 size-96 rounded-full bg-spark-300/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-[90rem] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2">
        <div className="relative mx-auto grid w-full max-w-xl grid-cols-[1fr_0.8fr] gap-4">
          <img src="/personalizados/koala.jpg" alt="Diseño personalizado verde con mascota de koala" loading="lazy" className="row-span-2 h-full w-full object-cover shadow-xl shadow-spark/10" />
          <img src="/personalizados/fuego.jpg" alt="Diseño personalizado rojo con llamas blancas" loading="lazy" className="w-full object-cover shadow-xl shadow-spark/10" />
          <img src="/personalizados/morado.jpg" alt="Diseño personalizado negro y morado con escudo de colegio" loading="lazy" className="w-full object-cover shadow-xl shadow-spark/10" />
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
                <span className="display w-10 text-3xl text-spark tabular-nums">{i + 1}</span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-graphite">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={buildWhatsAppUrl(QUOTE_MESSAGE)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
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

function StoreSection() {
  return (
    <section className="water mx-auto max-w-[90rem] px-4 py-20 sm:px-8" aria-labelledby="store-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
        <div>
          <span className="inline-flex items-center gap-2 border border-spark/40 bg-paper px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-spark">
            <IconStore className="size-3.5" />
            Tienda física
          </span>
          <h2 id="store-title" className="display mt-4 text-5xl md:text-6xl">
            Visítanos.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-graphite">
            Prueba la calidad de las telas, revisa los acabados y arma tu uniforme con nosotros en tienda.
          </p>

          <dl className="mt-8 space-y-5 text-sm">
            <Row icon={IconMapPin} title="Dirección">
              {STORE.address}
              {STORE.reference && <span className="block text-graphite">{STORE.reference}</span>}
            </Row>
            <Row icon={IconClock} title="Horario">
              {CONTACT.hours}
            </Row>
            <Row icon={IconStore} title="También nos encuentras">
              <span className="text-graphite">Facebook: {CONTACT.facebookName}</span>
            </Row>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={STORE.mapLink} target="_blank" rel="noopener noreferrer" className="btn btn-spark">
              Cómo llegar
            </a>
            <a href={buildWhatsAppUrl('Hola Phaway, quiero coordinar una visita a la tienda.')} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              Agendar visita
            </a>
          </div>
        </div>

        <div className="relative aspect-video w-full overflow-hidden border border-line bg-concrete shadow-xl shadow-spark/10 lg:aspect-auto">
          <iframe
            title={`Mapa: ${STORE.name}`}
            src={STORE.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function ShippingSection() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-ink py-16 text-paper" aria-labelledby="ship-title">
      <div aria-hidden="true" className="drift pointer-events-none absolute left-10 top-10 size-72 rounded-full bg-spark/30 blur-3xl" />
      <div className="relative mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 border border-paper/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
              <IconTruck className="size-3.5" />
              Envíos
            </span>
            <h2 id="ship-title" className="display mt-4 text-5xl md:text-6xl">
              A todo el Perú.
            </h2>
            <p className="mt-4 max-w-lg text-paper/70">
              Despachamos por las principales agencias del país. Elige la que tengas más cerca
              y te damos el código de rastreo apenas sale tu pedido.
            </p>
          </div>
          <a href={buildWhatsAppUrl('Hola Phaway, quiero coordinar un envío a provincia.')} target="_blank" rel="noopener noreferrer" className="btn btn-spark">
            Coordinar envío
          </a>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-3">
          {SHIPPING_PARTNERS.map((agency, i) => {
            const Icon = i === 2 ? IconBus : i === 0 ? IconPackage : IconTruck;
            return (
              <li key={agency.name} className="group relative border border-paper/15 bg-paper/5 p-6 transition-colors hover:border-spark/60 hover:bg-paper/10">
                <div className="flex items-center gap-4">
                  <span className="grid size-14 place-items-center rounded-full border border-paper/20 bg-spark/10 text-spark">
                    <Icon className="size-7" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-paper/60">Agencia</p>
                    <p className="text-xl font-bold">{agency.name}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-paper/70">{agency.note}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Reasons() {
  const items = [
    { Icon: IconTruck, title: 'Envíos a todo el Perú', text: 'Despachamos por agencia a tu ciudad, con seguimiento del pedido.' },
    { Icon: IconShield, title: 'Pago 50/50', text: 'En uniformes a medida pagas la mitad al iniciar y la otra mitad al recibir.' },
    { Icon: IconSpark, title: 'Sublimado que dura', text: 'El color va dentro de la tela: no se cuartea ni se despega con el lavado.' },
  ];
  return (
    <section className="water mx-auto max-w-[90rem] px-4 py-20 sm:px-8" aria-label="Por qué Phaway">
      <ul className="grid gap-10 md:grid-cols-3">
        {items.map(({ Icon, title, text }) => (
          <li key={title} className="border-t-2 border-spark pt-5">
            <Icon className="size-8 text-spark" />
            <h3 className="mt-3 text-xl font-bold">{title}</h3>
            <p className="mt-2 max-w-sm text-graphite">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Row({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-spark/40 bg-spark-100 text-spark">
        <Icon className="size-5" />
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wider text-graphite">{title}</dt>
        <dd className="mt-0.5 text-base font-semibold">{children}</dd>
      </div>
    </div>
  );
}
