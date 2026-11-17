import { CheckCircle2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ApiError, api } from '../lib/api-client';
import { FormField, TextInput } from './ui/FormField';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ next?: string; confirm?: string; form?: string }>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Enlace invalido</h1>
        <p className="mt-2 text-sm text-graphite">
          Este enlace no tiene un token valido. Vuelve a pedir uno nuevo.
        </p>
        <Link to="/admin/forgot-password" className="btn btn-solid mt-6 inline-flex">
          Pedir nuevo enlace
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (next.length < 10) nextErrors.next = 'Minimo 10 caracteres.';
    if (confirm !== next) nextErrors.confirm = 'La confirmacion no coincide.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      await api.resetPassword(token, next);
      setDone(true);
      toast.success('Contrasena actualizada', {
        description: 'Ya podes iniciar sesion con la nueva clave.',
      });
      setTimeout(() => navigate('/admin', { replace: true }), 1500);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Error desconocido.';
      setErrors({ form: msg });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="hidden items-end bg-ink p-12 text-paper md:flex">
        <div>
          <img src="/brand/phaway-blanco.png" alt="Phaway" className="h-28 w-auto" />
          <p className="display mt-10 text-6xl">Elegí tu nueva contraseña</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        {done ? (
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-ok/10 text-ok">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Listo</h1>
            <p className="mt-2 text-sm text-graphite">
              Tu contrasena quedo guardada. Redirigiendo al login…
            </p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="w-full max-w-sm">
            <img src="/brand/phaway-negro.png" alt="Phaway" className="mb-10 h-16 w-auto md:hidden" />
            <h1 className="text-3xl font-bold">Nueva contraseña</h1>
            <p className="mt-2 text-sm text-graphite">
              Elegí una contraseña de al menos 10 caracteres. Vas a usarla para entrar al panel.
            </p>

            <div className="mt-8 space-y-4">
              <FormField label="Nueva contraseña" required error={errors.next}>
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  invalid={!!errors.next}
                  autoFocus
                />
              </FormField>
              <FormField label="Confirmar contraseña" required error={errors.confirm}>
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  invalid={!!errors.confirm}
                />
              </FormField>
            </div>

            {errors.form && (
              <p role="alert" className="mt-5 border-l-4 border-alert bg-alert/5 px-3 py-2 text-sm text-alert">
                {errors.form}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-solid mt-8 w-full">
              <KeyRound className="size-4" />
              {pending ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
