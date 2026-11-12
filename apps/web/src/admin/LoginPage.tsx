import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';
import { api } from '../lib/api-client';
import { useSession } from '../lib/queries';

const schema = z.object({
  email: z.email('Escribe un correo válido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
});
type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  if (session) return <Navigate to="/admin/productos" replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await api.login(email, password);
      navigate('/admin/productos', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    }
  });

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="hidden items-end bg-ink p-12 text-paper md:flex">
        <div>
          <img src="/brand/phaway-blanco.png" alt="Phaway" className="h-28 w-auto" />
          <p className="display mt-10 text-6xl">Panel de tienda</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <form onSubmit={onSubmit} noValidate className="w-full max-w-sm">
          <img src="/brand/phaway-negro.png" alt="Phaway" className="mb-10 h-16 w-auto md:hidden" />
          <h1 className="text-3xl font-bold">Iniciar sesión</h1>
          <p className="mt-2 text-graphite">Acceso para el equipo de Phaway.</p>

          <label className="mt-8 block">
            <span className="text-sm font-semibold">Correo</span>
            <input
              type="email"
              autoComplete="username"
              className="field mt-1.5"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <span className="mt-1 block text-sm text-alert">{errors.email.message}</span>}
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-semibold">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              className="field mt-1.5"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && <span className="mt-1 block text-sm text-alert">{errors.password.message}</span>}
          </label>

          {error && (
            <p role="alert" className="mt-5 border-l-4 border-alert bg-alert/5 px-3 py-2 text-sm text-alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-solid mt-8 w-full">
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
