import { Link, Navigate, NavLink, Outlet, useNavigate } from 'react-router';
import { api } from '../lib/api-client';
import { useSession } from '../lib/queries';

/** Envuelve las pantallas del panel: exige sesion y muestra la barra admin. */
export function AdminLayout() {
  const session = useSession();
  const navigate = useNavigate();

  if (!session) return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-dvh bg-paper">
      <header className="bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/admin/productos" className="flex items-center gap-3">
              <img src="/brand/phaway-blanco.png" alt="" className="h-8 w-auto" />
              <span className="font-bold">Panel</span>
            </Link>
            <nav aria-label="Panel" className="flex gap-5 text-sm font-semibold">
              {[
                ['/admin/productos', 'Productos'],
                ['/admin/ventas', 'Ventas'],
              ].map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => (isActive ? 'underline underline-offset-8' : 'text-paper/70 hover:text-paper')}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" target="_blank" className="text-paper/70 hover:text-paper">
              Ver tienda
            </a>
            <span className="hidden text-paper/50 sm:inline">{session.user.email}</span>
            <button
              type="button"
              className="font-semibold hover:underline"
              onClick={() => {
                api.logout();
                navigate('/admin', { replace: true });
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
