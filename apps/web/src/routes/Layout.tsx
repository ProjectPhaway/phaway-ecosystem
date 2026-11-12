import { buildWhatsAppUrl } from '@phaway/shared';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import {
  IconFacebook,
  IconHome,
  IconInstagram,
  IconMapPin,
  IconTiktok,
  IconUser,
} from '../components/icons';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CONTACT, SOCIAL, STORE } from '../config';
import { useSession } from '../lib/queries';

const NAV = [
  { to: '/', label: 'Inicio', icon: IconHome, end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/liquidacion', label: 'Liquidación' },
  { to: '/personalizados', label: 'Personalizados' },
  { to: '/contacto', label: 'Contacto' },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const session = useSession();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <AnnouncementBar />

      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-6 px-4 py-2 sm:px-8">
          <Link to="/" aria-label="Phaway, ir al inicio" className="shrink-0">
            <img src="/brand/phaway-negro.png" alt="Phaway" className="h-11 w-auto" />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-7 text-[0.95rem] font-semibold">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className="link-spark inline-flex items-center gap-1.5 py-2">
                    {Icon && <Icon className="size-4" />}
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={session ? '/admin/productos' : '/admin'}
              className="hidden items-center gap-2 border border-ink px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper sm:inline-flex"
            >
              <IconUser className="size-4" />
              {session ? 'Panel' : 'Ingresar'}
            </Link>
            <button
              type="button"
              className="btn btn-outline min-h-10 px-4 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? 'Cerrar' : 'Menú'}
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Principal" className="border-t border-line md:hidden">
            <ul>
              {NAV.map(({ to, label, end }) => (
                <li key={to} className="border-b border-line">
                  <NavLink to={to} end={end} className="display block px-4 py-5 text-3xl">
                    {label}
                  </NavLink>
                </li>
              ))}
              <li className="border-b border-line">
                <Link to={session ? '/admin/productos' : '/admin'} className="display block px-4 py-5 text-3xl">
                  {session ? 'Panel' : 'Ingresar'}
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function AnnouncementBar() {
  return (
    <div className="bg-ink text-paper">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-2 px-4 py-2 text-[0.8rem] sm:px-8">
        <p className="flex items-center gap-2">
          <IconMapPin className="size-4" />
          <span>{STORE.address} · Tienda física abierta</span>
        </p>
        <p className="hidden sm:block">
          Envíos a todo el Perú · WhatsApp {CONTACT.whatsappDisplay}
        </p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="water-dark relative overflow-hidden">
      <div
        aria-hidden="true"
        className="drift pointer-events-none absolute -right-20 top-10 size-96 rounded-full bg-spark/30 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-[90rem] gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <img src="/brand/phaway-blanco.png" alt="Phaway" className="h-20 w-auto" />
          <p className="mt-5 max-w-xs text-sm text-paper/70">
            Uniformes deportivos sublimados a medida y prendas listas para entrenar.
            Hecho en Perú.
          </p>
          <ul className="mt-6 flex gap-3" aria-label="Redes sociales">
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
                  className="grid size-11 place-items-center rounded-full border border-paper/30 transition-colors hover:border-paper hover:bg-paper hover:text-ink"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <FooterCol title="Tienda">
          <Link to="/">Inicio</Link>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/liquidacion">Liquidación</Link>
          <Link to="/personalizados">Uniformes a medida</Link>
        </FooterCol>

        <FooterCol title="Contacto">
          <a href={buildWhatsAppUrl('Hola Phaway')} target="_blank" rel="noopener noreferrer">
            WhatsApp {CONTACT.whatsappDisplay}
          </a>
          <a href={STORE.mapLink} target="_blank" rel="noopener noreferrer">
            {STORE.address}
          </a>
          <span>{CONTACT.hours}</span>
        </FooterCol>

        <FooterCol title="Ayuda">
          <Link to="/contacto">Envíos y pagos</Link>
          <Link to="/contacto#reclamaciones">Libro de Reclamaciones</Link>
          <Link to="/admin" className="link-spark inline-flex items-center gap-1.5">
            <IconUser className="size-4" />
            Ingreso administrador
          </Link>
        </FooterCol>
      </div>
      <div className="relative border-t border-paper/20">
        <p className="mx-auto max-w-[90rem] px-4 py-5 text-xs text-paper/60 sm:px-8">
          © {new Date().getFullYear()} Phaway. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="mt-4 flex flex-col gap-2.5 text-sm text-paper/75 [&_a:hover]:text-paper [&_a:hover]:underline">
        {children}
      </div>
    </div>
  );
}
