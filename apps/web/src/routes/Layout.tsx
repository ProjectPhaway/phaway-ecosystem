import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CONTACT } from '../config';
import { buildWhatsAppUrl } from '@phaway/shared';

const NAV = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/liquidacion', label: 'Liquidación' },
  { to: '/personalizados', label: 'Personalizados' },
  { to: '/contacto', label: 'Contacto' },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-ink bg-paper">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-6 px-4 py-2 sm:px-8">
          <Link to="/" aria-label="Phaway, ir al inicio" className="shrink-0">
            <img src="/brand/phaway-negro.png" alt="Phaway" className="h-11 w-auto" />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex gap-8 text-[0.95rem] font-semibold">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    className={({ isActive }) =>
                      `py-2 underline-offset-[10px] decoration-2 ${isActive ? 'underline' : 'hover:underline'}`
                    }
                  >
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="md:hidden btn btn-outline min-h-10 px-4"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Cerrar' : 'Menú'}
          </button>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Principal" className="border-t border-ink md:hidden">
            <ul>
              {NAV.map((n) => (
                <li key={n.to} className="border-b border-line">
                  <NavLink to={n.to} className="display block px-4 py-5 text-3xl">
                    {n.label}
                  </NavLink>
                </li>
              ))}
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

function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <img src="/brand/phaway-blanco.png" alt="Phaway" className="h-20 w-auto" />
          <p className="mt-5 max-w-xs text-sm text-paper/70">
            Uniformes deportivos sublimados a medida y prendas listas para entrenar. Hecho en Perú.
          </p>
        </div>

        <FooterCol title="Tienda">
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/liquidacion">Liquidación</Link>
          <Link to="/personalizados">Uniformes a medida</Link>
        </FooterCol>

        <FooterCol title="Contacto">
          <a href={buildWhatsAppUrl('Hola Phaway')} target="_blank" rel="noopener noreferrer">
            WhatsApp {CONTACT.whatsappDisplay}
          </a>
          <span>{CONTACT.facebookName}</span>
          <span>{CONTACT.hours}</span>
        </FooterCol>

        <FooterCol title="Ayuda">
          <Link to="/contacto">Envíos y pagos</Link>
          <Link to="/contacto#reclamaciones">Libro de Reclamaciones</Link>
        </FooterCol>
      </div>
      <div className="border-t border-paper/20">
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
