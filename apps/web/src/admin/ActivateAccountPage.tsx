import { CheckCircle2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ApiError, api } from '../lib/api-client';
import { FormField, TextInput } from './ui/FormField';

export function ActivateAccountPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ name?: string; password?: string; confirm?: string; form?: string }>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Enlace invalido</h1>
        <p className="mt-2 text-sm text-graphite">
          Este enlace de invitacion no tiene un token valido. Pedile al administrador que te
          reenvie la invitacion.
        </p>
        <Link to="/admin" className="btn btn-outline mt-6 inline-flex">
          Ir al login
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (password.length < 10) nextErrors.password = 'Minimo 10 caracteres.';
    if (confirm !== password) nextErrors.confirm = 'La confirmacion no coincide.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      await api.acceptInvitation(token, password, name.trim() || undefined);
      setDone(true);
      toast.success('Cuenta activada', {
        description: 'Ya podes iniciar sesion.',
      });
      setTimeout(() => navigate('/admin', { replace: true }), 1500);
    } catch (e) {
      setErrors({ form: e instanceof ApiError ? e.message : 'Error desconocido.' });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="hidden items-end bg-ink p-12 text-paper md:flex">
        <div>
          <img src="/brand/phaway-blanco.png" alt="Phaway" className="h-28 w-auto" />
          <p className="display mt-10 text-6xl">Bienvenido al panel</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        {done ? (
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-ok/10 text-ok">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Cuenta activada</h1>
            <p className="mt-2 text-sm text-graphite">Redirigiendo al login…</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="w-full max-w-sm">
            <img src="/brand/phaway-negro.png" alt="Phaway" className="mb-10 h-16 w-auto md:hidden" />
            <h1 className="text-3xl font-bold">Activar mi cuenta</h1>
            <p className="mt-2 text-sm text-graphite">
              Elegi tu contrasena para entrar al panel. Minimo 10 caracteres, mezcla letras,
              numeros y simbolos.
            </p>

            <div className="mt-8 space-y-4">
              <FormField label="Tu nombre" hint="Opcional, si queres cambiar el que puso quien te invito">
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </FormField>
              <FormField label="Contrasena" required error={errors.password}>
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  invalid={!!errors.password}
                  autoFocus
                />
              </FormField>
              <FormField label="Confirmar contrasena" required error={errors.confirm}>
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
              {pending ? 'Activando…' : 'Activar cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
