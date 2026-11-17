import { KeyRound, Mail, Shield, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '../lib/queries';
import { ChangePasswordModal } from './ui/ChangePasswordModal';

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  marketing: 'Marketing',
};

export function PerfilPage() {
  const session = useSession();
  const [open, setOpen] = useState(false);

  if (!session) return null;
  const { user } = session;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="mt-1 text-sm text-graphite">
          Tus datos de acceso al panel. Las ediciones mayores (nombre, rol, correo) las hace un
          administrador desde "Usuarios del panel".
        </p>
      </header>

      <section className="grid gap-3 rounded-lg border border-line bg-paper p-5 sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <Row icon={<UserIcon className="size-4" />} label="Nombre" value={user.name} />
        <Row icon={<Mail className="size-4" />} label="Correo" value={user.email} />
        <Row
          icon={<Shield className="size-4" />}
          label="Rol"
          value={roleLabel[user.role] ?? user.role}
        />
      </section>

      <section className="rounded-lg border border-line bg-paper p-5">
        <h2 className="text-base font-bold">Seguridad</h2>
        <p className="mt-1 text-sm text-graphite">
          Cambia tu contrasena cada tanto. Siempre te vamos a avisar por correo cuando se cambie.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-solid mt-4"
        >
          <KeyRound className="size-4" />
          Cambiar contrasena
        </button>
      </section>

      <ChangePasswordModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <>
      <dt className="flex items-center gap-2 text-sm font-semibold text-graphite sm:py-1.5">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium sm:py-1.5">{value}</dd>
    </>
  );
}
