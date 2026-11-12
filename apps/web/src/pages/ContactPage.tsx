import { buildWhatsAppUrl } from '@phaway/shared';
import { IconClock, IconFacebook, IconInstagram, IconMapPin, IconStore, IconTiktok } from '../components/icons';
import { CONTACT, SOCIAL, STORE } from '../config';

export function ContactPage() {
  return (
    <div className="water relative overflow-hidden">
      <div aria-hidden="true" className="drift pointer-events-none absolute -right-10 top-0 size-96 rounded-full bg-spark-300/50 blur-3xl" />
      <div className="relative mx-auto max-w-[90rem] px-4 pb-20 pt-14 sm:px-8 md:pt-20">
      <h1 className="display text-[clamp(3rem,10vw,8rem)]">Contacto</h1>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold">Escríbenos</h2>
          <p className="mt-3 max-w-md text-graphite">
            La forma más rápida de cotizar o reservar es por WhatsApp. Te responde directamente el
            área de ventas.
          </p>
          <a
            href={buildWhatsAppUrl('Hola Phaway, tengo una consulta.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp mt-6"
          >
            WhatsApp {CONTACT.whatsappDisplay}
          </a>
          <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
            <dt className="font-semibold">Facebook</dt>
            <dd className="text-graphite">{CONTACT.facebookName}</dd>
            <dt className="font-semibold">Horario</dt>
            <dd className="text-graphite">{CONTACT.hours}</dd>
          </dl>
        </section>

        <section>
          <h2 className="text-xl font-bold">Envíos y pagos</h2>
          <ul className="mt-3 max-w-md space-y-3 text-graphite">
            <li>Enviamos a todo el Perú por agencia. El costo del envío depende del destino.</li>
            <li>Uniformes a medida: 50% de adelanto para iniciar y 50% al momento de la entrega.</li>
            <li>Productos de catálogo y liquidación: se reservan por WhatsApp y se confirman con el pago.</li>
          </ul>

          <h2 id="reclamaciones" className="mt-12 scroll-mt-24 text-xl font-bold">
            Libro de Reclamaciones
          </h2>
          <p className="mt-3 max-w-md text-graphite">
            Conforme al Código de Protección y Defensa del Consumidor, puedes registrar tu queja o
            reclamo escribiéndonos por WhatsApp. El formulario virtual estará disponible pronto.
          </p>
        </section>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.4fr]" aria-labelledby="visit-title">
        <div>
          <span className="inline-flex items-center gap-2 border border-spark/40 bg-paper px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-spark">
            <IconStore className="size-3.5" />
            Tienda física
          </span>
          <h2 id="visit-title" className="display mt-4 text-5xl md:text-6xl">
            Visítanos.
          </h2>
          <dl className="mt-6 space-y-4 text-sm">
            <Row icon={IconMapPin} title="Dirección">
              {STORE.address}
              <span className="block text-graphite">{STORE.reference}</span>
            </Row>
            <Row icon={IconClock} title="Horario">{CONTACT.hours}</Row>
          </dl>
          <ul className="mt-6 flex gap-3" aria-label="Redes sociales">
            {[
              { href: SOCIAL.instagram, Icon: IconInstagram, label: 'Instagram' },
              { href: SOCIAL.facebook, Icon: IconFacebook, label: 'Facebook' },
              { href: SOCIAL.tiktok, Icon: IconTiktok, label: 'TikTok' },
            ].map(({ href, Icon, label }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full border border-ink/80 transition-colors hover:border-spark hover:bg-spark hover:text-paper">
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="aspect-video w-full overflow-hidden border border-line shadow-xl shadow-spark/10">
          <iframe title={`Mapa: ${STORE.name}`} src={STORE.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="size-full" allowFullScreen />
        </div>
      </section>
      </div>
    </div>
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
