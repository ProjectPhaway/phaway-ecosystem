import { buildWhatsAppUrl } from '@phaway/shared';

const QUOTE_MESSAGE = 'Hola Phaway, quiero cotizar uniformes personalizados para mi equipo.';

const WORKS = [
  { src: '/personalizados/koala.jpg', alt: 'Camiseta verde y blanca con mascota de koala, para Koala Corporativo' },
  { src: '/personalizados/fuego.jpg', alt: 'Camiseta roja con llamas blancas y número 10' },
  { src: '/personalizados/morado.jpg', alt: 'Camiseta negra y morada con escudo de colegio y auspiciador' },
];

const STEPS = [
  ['Cuéntanos tu idea', 'Envíanos por WhatsApp tu escudo, colores, auspiciadores y cuántas prendas necesitas por talla, para dama y varón.'],
  ['Diseñamos tu propuesta', 'Nuestro equipo de diseño arma el uniforme y te lo enviamos para que lo apruebes o pidas cambios.'],
  ['Separas con el 50%', 'Con el diseño aprobado y el adelanto, pasamos a producción.'],
  ['Producimos', 'Cortamos, sublimamos, cosemos y revisamos cada prenda: talla, nombre y número.'],
  ['Pagas el 50% y lo recibes', 'Enviamos por agencia a cualquier ciudad del Perú.'],
];

export function CustomPage() {
  return (
    <>
      <section className="water relative overflow-hidden border-b border-line">
        <div aria-hidden="true" className="drift pointer-events-none absolute -right-10 top-0 size-96 rounded-full bg-spark-300/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-[90rem] gap-10 px-4 pb-14 pt-14 sm:px-8 md:pt-20 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h1 className="display text-[clamp(3rem,10vw,8.5rem)]">
            Uniformes
            <br />a medida.
          </h1>
          <div>
            <p className="max-w-md text-lg leading-relaxed text-graphite">
              Camisetas, shorts y chalecos sublimados con tu escudo, tus colores y el nombre y
              número de cada jugador. Para clubes, colegios, empresas y campeonatos.
            </p>
            <a href={buildWhatsAppUrl(QUOTE_MESSAGE)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8" aria-labelledby="works-title">
        <h2 id="works-title" className="display text-4xl md:text-5xl">Trabajos recientes</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKS.map((w) => (
            <li key={w.src} className="bg-concrete">
              <img src={w.src} alt={w.alt} loading="lazy" className="w-full" />
            </li>
          ))}
        </ul>
      </section>

      <section className="water-dark relative overflow-hidden" aria-labelledby="process-title">
        <div aria-hidden="true" className="drift pointer-events-none absolute left-0 top-10 size-96 rounded-full bg-spark/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-[90rem] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2">
          <div>
            <h2 id="process-title" className="display text-5xl md:text-6xl">Así trabajamos</h2>
            <ol className="mt-10 divide-y divide-paper/25 border-y border-paper/25">
              {STEPS.map(([title, text], i) => (
                <li key={title} className="flex gap-6 py-5">
                  <span className="display w-8 shrink-0 text-3xl tabular-nums">{i + 1}</span>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-sm text-paper/70">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <figure className="self-center">
            <video
              className="w-full bg-paper/10"
              src="/media/proceso.mp4"
              poster="/personalizados/fuego.jpg"
              controls
              muted
              playsInline
              preload="none"
            >
              Tu navegador no puede reproducir este video.
            </video>
            <figcaption className="mt-3 text-sm text-paper/60">Del diseño a la prenda terminada.</figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
