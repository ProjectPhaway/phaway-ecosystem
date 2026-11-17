import { CheckCircle2, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ApiError, api } from '../lib/api-client';
import { FormField, TextInput } from './ui/FormField';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError('Escribe tu correo.');
    setError(null);
    setPending(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo enviar. Intenta de nuevo.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="hidden items-end bg-ink p-12 text-paper md:flex">
        <div>
          <img src="/brand/phaway-blanco.png" alt="Phaway" className="h-28 w-auto" />
          <p className="display mt-10 text-6xl">Recuperar acceso</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        {sent ? (
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-ok/10 text-ok">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Revisa tu correo</h1>
            <p className="mt-2 text-sm text-graphite">
              Si <strong>{email}</strong> tiene una cuenta activa en el panel, en los próximos
              minutos te va a llegar un correo con un enlace para elegir una nueva contraseña. El
              enlace vence en 1 hora.
            </p>
            <p className="mt-4 text-xs text-graphite">
              ¿No llegó? Revisá spam. Si sigue sin aparecer, pedile al administrador del panel que
              reenvíe la invitación.
            </p>
            <Link to="/admin" className="btn btn-outline mt-8 w-full">
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="w-full max-w-sm">
            <img src="/brand/phaway-negro.png" alt="Phaway" className="mb-10 h-16 w-auto md:hidden" />
            <h1 className="text-3xl font-bold">Recuperar contraseña</h1>
            <p className="mt-2 text-sm text-graphite">
              Escribí el correo con el que entras al panel y te mandamos un enlace para resetearla.
            </p>

            <div className="mt-8">
              <FormField label="Correo" required>
                <TextInput
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@phaway.com"
                  autoFocus
                />
              </FormField>
            </div>

            {error && (
              <p role="alert" className="mt-5 border-l-4 border-alert bg-alert/5 px-3 py-2 text-sm text-alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-solid mt-8 w-full">
              <Mail className="size-4" />
              {pending ? 'Enviando…' : 'Enviar enlace'}
            </button>

            <p className="mt-6 text-center text-sm">
              <Link to="/admin" className="text-graphite hover:text-ink hover:underline">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
