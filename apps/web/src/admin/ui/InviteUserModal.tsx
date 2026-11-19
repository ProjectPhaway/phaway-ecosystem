import type { UserRole } from '@phaway/shared';
import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '../../lib/api-client';
import { useInviteUser } from '../../lib/queries';
import { FormField, SelectInput, TextInput } from './FormField';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteUserModal({ open, onClose }: Props) {
  const mutation = useInviteUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('marketing');
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({});

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setRole('marketing');
      setErrors({});
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) nextErrors.name = 'Nombre muy corto.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Correo invalido.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await mutation.mutateAsync({ name: name.trim(), email: email.trim().toLowerCase(), role });
      toast.success('Invitacion enviada', { description: `Le llego un correo a ${email}.` });
      onClose();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Error desconocido.';
      setErrors({ form: msg });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invitar usuario al panel"
      description="Le llega un correo con un enlace para que elija su contrasena. La invitacion vence en 7 dias."
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancelar
          </button>
          <button
            type="submit"
            form="invite-user-form"
            className="btn btn-solid"
            disabled={mutation.isPending}
          >
            <Send className="size-4" />
            {mutation.isPending ? 'Enviando…' : 'Enviar invitacion'}
          </button>
        </>
      }
    >
      <form id="invite-user-form" onSubmit={submit} noValidate className="space-y-4">
        <FormField label="Nombre completo" required error={errors.name}>
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Ana Ramirez"
            invalid={!!errors.name}
          />
        </FormField>
        <FormField label="Correo" required error={errors.email}>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@phaway.com"
            invalid={!!errors.email}
          />
        </FormField>
        <FormField
          label="Rol"
          required
          hint="Admin gestiona todo; marketing trabaja catalogo y ventas; vendedor solo ventas; taller tiene acceso limitado."
        >
          <SelectInput value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="marketing">Marketing</option>
            <option value="vendedor">Vendedor</option>
            <option value="taller">Taller</option>
            <option value="admin">Administrador</option>
          </SelectInput>
        </FormField>
        {errors.form && (
          <p role="alert" className="rounded-md border border-alert/30 bg-alert/5 px-3 py-2 text-sm text-alert">
            {errors.form}
          </p>
        )}
      </form>
    </Modal>
  );
}
