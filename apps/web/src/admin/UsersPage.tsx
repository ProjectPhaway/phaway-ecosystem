import type { AdminUserDto, PendingInvitationDto, UserRole } from '@phaway/shared';
import { Clock, Mail, PowerOff, RefreshCw, Shield, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorNotice } from '../components/States';
import { ApiError } from '../lib/api-client';
import {
  useAdminInvitations,
  useAdminUsers,
  useCancelInvitation,
  useDeleteUser,
  useResendInvitation,
  useSession,
  useSetUserStatus,
} from '../lib/queries';
import { InviteUserModal } from './ui/InviteUserModal';

const roleLabel: Record<UserRole, string> = {
  admin: 'Administrador',
  marketing: 'Marketing',
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function UsersPage() {
  const session = useSession();
  const users = useAdminUsers();
  const invites = useAdminInvitations();
  const [open, setOpen] = useState(false);

  const hasData = !users.isPending && !users.isError;
  const totalActive = hasData ? users.data.filter((u) => u.isActive).length : 0;
  const totalSuspended = hasData ? users.data.filter((u) => !u.isActive).length : 0;
  const totalPending = invites.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios del panel</h1>
          <p className="mt-1 text-sm text-graphite">
            Invita, suspende o elimina acceso al panel. Solo administradores pueden ver esta pantalla.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn btn-solid">
          <UserPlus className="size-4" />
          Invitar usuario
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={<ShieldCheck className="size-5" />} label="Activos" value={totalActive} tone="ok" />
        <Stat icon={<PowerOff className="size-5" />} label="Suspendidos" value={totalSuspended} tone="muted" />
        <Stat icon={<Clock className="size-5" />} label="Invitaciones pendientes" value={totalPending} tone="spark" />
      </div>

      <section className="rounded-lg border border-line bg-paper">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-base font-bold">Usuarios</h2>
          {hasData && <p className="text-xs text-graphite">{users.data.length} en total</p>}
        </header>
        {users.isPending ? (
          <p className="p-6 text-sm text-graphite">Cargando…</p>
        ) : users.isError ? (
          <div className="p-4">
            <ErrorNotice error={users.error} />
          </div>
        ) : users.data.length === 0 ? (
          <p className="p-6 text-sm text-graphite">Aun no hay usuarios activos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-2 font-semibold">Usuario</th>
                  <th className="px-4 py-2 font-semibold">Rol</th>
                  <th className="px-4 py-2 font-semibold">Estado</th>
                  <th className="px-4 py-2 font-semibold">Alta</th>
                  <th className="px-4 py-2"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((u) => (
                  <UserRow key={u.id} user={u} meId={session?.user.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-line bg-paper">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-base font-bold">Invitaciones pendientes</h2>
          {invites.data && <p className="text-xs text-graphite">{invites.data.length} en espera</p>}
        </header>
        {invites.isPending ? (
          <p className="p-6 text-sm text-graphite">Cargando…</p>
        ) : invites.isError ? (
          <div className="p-4">
            <ErrorNotice error={invites.error} />
          </div>
        ) : invites.data.length === 0 ? (
          <p className="p-6 text-sm text-graphite">No hay invitaciones pendientes.</p>
        ) : (
          <ul className="divide-y divide-line">
            {invites.data.map((i) => (
              <InvitationRow key={i.id} invitation={i} />
            ))}
          </ul>
        )}
      </section>

      <InviteUserModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'ok' | 'spark' | 'muted';
}) {
  const bg = tone === 'ok' ? 'bg-ok/10 text-ok' : tone === 'spark' ? 'bg-spark-100 text-spark' : 'bg-concrete text-graphite';
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-paper p-4">
      <div className={`grid size-10 place-items-center rounded-md ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-graphite">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function UserRow({ user, meId }: { user: AdminUserDto; meId: string | undefined }) {
  const setStatus = useSetUserStatus();
  const remove = useDeleteUser();
  const [confirmDel, setConfirmDel] = useState(false);
  const isMe = user.id === meId;

  const toggle = async () => {
    try {
      await setStatus.mutateAsync({ id: user.id, isActive: !user.isActive });
      toast.success(user.isActive ? 'Usuario suspendido' : 'Usuario reactivado');
    } catch (e) {
      toast.error('Error', { description: e instanceof ApiError ? e.message : undefined });
    }
  };

  const del = async () => {
    if (!confirmDel) {
      setConfirmDel(true);
      return;
    }
    try {
      await remove.mutateAsync(user.id);
      toast.success('Usuario eliminado');
    } catch (e) {
      toast.error('No se pudo eliminar', { description: e instanceof ApiError ? e.message : undefined });
    } finally {
      setConfirmDel(false);
    }
  };

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3">
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-graphite">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-md bg-concrete px-2 py-0.5 text-xs font-semibold text-ink">
          <Shield className="size-3" />
          {roleLabel[user.role]}
        </span>
      </td>
      <td className="px-4 py-3">
        {user.isActive ? (
          <span className="rounded-md bg-ok/10 px-2 py-0.5 text-xs font-semibold text-ok">Activo</span>
        ) : (
          <span className="rounded-md bg-alert/10 px-2 py-0.5 text-xs font-semibold text-alert">Suspendido</span>
        )}
        {isMe && <span className="ml-2 text-xs text-graphite">· tu cuenta</span>}
      </td>
      <td className="px-4 py-3 text-xs text-graphite">{fmtDate(user.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3 whitespace-nowrap text-sm font-semibold">
          <button
            type="button"
            onClick={toggle}
            disabled={isMe || setStatus.isPending}
            className="hover:underline disabled:cursor-not-allowed disabled:text-graphite disabled:no-underline"
            title={isMe ? 'No podes suspenderte a vos mismo' : undefined}
          >
            {user.isActive ? 'Suspender' : 'Reactivar'}
          </button>
          <button
            type="button"
            onClick={del}
            onBlur={() => setConfirmDel(false)}
            disabled={isMe || remove.isPending}
            className={`hover:underline disabled:cursor-not-allowed disabled:text-graphite disabled:no-underline ${confirmDel ? 'text-alert' : 'text-graphite'}`}
            title={isMe ? 'No podes eliminarte a vos mismo' : undefined}
          >
            {confirmDel ? '¿Eliminar? Confirmar' : 'Eliminar'}
          </button>
        </div>
      </td>
    </tr>
  );
}

function InvitationRow({ invitation }: { invitation: PendingInvitationDto }) {
  const resend = useResendInvitation();
  const cancel = useCancelInvitation();

  const doResend = async () => {
    try {
      await resend.mutateAsync(invitation.id);
      toast.success('Invitacion reenviada');
    } catch (e) {
      toast.error('Error', { description: e instanceof ApiError ? e.message : undefined });
    }
  };

  const doCancel = async () => {
    if (!confirm('¿Cancelar esta invitacion?')) return;
    try {
      await cancel.mutateAsync(invitation.id);
      toast.success('Invitacion cancelada');
    } catch (e) {
      toast.error('Error', { description: e instanceof ApiError ? e.message : undefined });
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {invitation.name} <span className="font-normal text-graphite">· {invitation.email}</span>
        </p>
        <p className="text-xs text-graphite">
          <Mail className="mr-1 inline size-3 -translate-y-px" />
          {roleLabel[invitation.role]} · invita {invitation.invitedBy.name} · vence el {fmtDate(invitation.expiresAt)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={doResend}
          disabled={resend.isPending}
          className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-spark hover:text-spark disabled:opacity-50"
        >
          <RefreshCw className="size-3" />
          Reenviar
        </button>
        <button
          type="button"
          onClick={doCancel}
          disabled={cancel.isPending}
          className="inline-flex items-center gap-1 rounded-md border border-alert/40 bg-alert/5 px-3 py-1.5 text-xs font-semibold text-alert hover:bg-alert/10 disabled:opacity-50"
        >
          <X className="size-3" />
          Cancelar
        </button>
      </div>
    </li>
  );
}

