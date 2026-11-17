import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Toaster } from 'sonner';
import { api } from '../lib/api-client';
import { useSession } from '../lib/queries';
import { filterTreeByRole } from './modules';

/**
 * Shell del panel: topbar + sidebar colapsable izquierdo + outlet.
 *
 * - Desktop (>= lg): sidebar siempre visible, con 2 estados (ancho 256px / 64px).
 * - Mobile: sidebar es drawer; al navegar se cierra solo.
 * - Filtra los modulos visibles por rol del usuario.
 * - Monta el <Toaster /> global de sonner para todo el panel.
 */

const LG_BREAKPOINT = 1024;

function initialSidebarOpen() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= LG_BREAKPOINT;
}

export function AdminShell() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // En mobile, al navegar entre rutas cerramos el drawer para liberar el main.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < LG_BREAKPOINT) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Memoizamos el arbol filtrado por rol para evitar recalcularlo en cada render.
  const visibleTree = useMemo(
    () => (session ? filterTreeByRole(session.user.role) : []),
    [session],
  );

  if (!session) return <Navigate to="/admin" replace />;

  const toggleCategory = (id: string) =>
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleLogout = () => {
    api.logout();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="flex h-dvh flex-col bg-cloud text-ink">
      {/* Topbar */}
      <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-line bg-paper px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Cerrar menu' : 'Abrir menu'}
            className="grid size-10 place-items-center rounded-md transition-colors hover:bg-mist"
          >
            <Menu className="size-5" />
          </button>
          <Link to="/admin/inicio" className="flex items-center gap-2">
            <img src="/brand/phaway-negro.png" alt="Phaway" className="h-8 w-auto" />
            <span className="text-sm font-bold text-graphite">Panel</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-graphite hover:text-ink sm:inline"
          >
            Ver tienda
          </a>
          <span className="hidden text-xs text-graphite md:inline">{session.user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Body = sidebar + main */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Backdrop mobile (solo cuando el drawer esta abierto) */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Cerrar menu"
            className="fixed inset-x-0 bottom-0 top-14 z-30 cursor-default bg-ink/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            'flex flex-col border-r border-line bg-paper transition-[width,transform] duration-300',
            // Mobile: drawer fijo bajo la topbar
            'fixed bottom-0 left-0 top-14 z-40 w-64',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            // Desktop: entra al flujo flex, ancho variable
            'lg:relative lg:top-auto lg:z-auto lg:translate-x-0',
            sidebarOpen ? 'lg:w-64' : 'lg:w-16',
          ].join(' ')}
        >
          <nav aria-label="Modulos" className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
            {visibleTree.map((cat) => {
              const isUserCollapsed = collapsedCats.has(cat.id);
              const singleItem = cat.items.length === 1;
              const showHeader = sidebarOpen && !singleItem;
              const showItems = !showHeader || !isUserCollapsed;
              return (
                <div key={cat.id}>
                  {showHeader && (
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="flex w-full items-center justify-between rounded px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-graphite hover:text-ink"
                    >
                      <span>{cat.title}</span>
                      <ChevronDown
                        className={`size-3.5 transition-transform ${isUserCollapsed ? '-rotate-90' : ''}`}
                      />
                    </button>
                  )}
                  {showItems && (
                    <ul className="mt-1 space-y-0.5">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isDashboard = item.path === '/admin/inicio';
                        return (
                          <li key={item.path}>
                            <NavLink
                              to={item.path}
                              end={isDashboard}
                              title={!sidebarOpen ? item.label : undefined}
                              className={({ isActive }) =>
                                [
                                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                  isActive
                                    ? 'bg-spark text-paper'
                                    : 'text-ink hover:bg-mist',
                                  !sidebarOpen && 'lg:justify-center lg:px-0',
                                ]
                                  .filter(Boolean)
                                  .join(' ')
                              }
                            >
                              <Icon className="size-4 shrink-0" />
                              <span className={!sidebarOpen ? 'lg:hidden' : ''}>
                                {item.label}
                              </span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toasts globales del panel */}
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
