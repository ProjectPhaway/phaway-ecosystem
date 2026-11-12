import { buildWhatsAppUrl } from '@phaway/shared';
import { CONTACT } from '../config';

export function ContactPage() {
  return (
    <div className="mx-auto max-w-[90rem] px-4 pb-20 pt-14 sm:px-8 md:pt-20">
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
    </div>
  );
}
