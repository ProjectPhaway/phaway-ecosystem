import { KeyRound, Mail, Shield, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '../lib/queries';
import { ChangePasswordModal } from './ui/ChangePasswordModal';
import { ProfilePhotoModal } from './ui/ProfilePhotoModal';

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  marketing: 'Marketing',
  vendedor: 'Vendedor',
  taller: 'Taller',
};

export function PerfilPage() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

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

      <section className="flex items-center gap-4 rounded-lg border border-line bg-paper p-5">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-concrete">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
          ) : (
            <UserIcon className="size-7 text-graphite" />
          )}
        </div>
        <div>
          <h2 className="text-base font-bold">Foto de perfil</h2>
          <p className="mt-1 text-sm text-graphite">Personaliza tu cuenta del panel.</p>
          <button type="button" onClick={() => setPhotoOpen(true)} className="btn btn-outline mt-3">
            Cambiar foto
          </button>
        </div>
      </section>

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
      <ProfilePhotoModal
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        currentUrl={user.avatarUrl}
        name={user.name}
      />
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
