import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '../../lib/api-client';
import { useChangePassword } from '../../lib/queries';
import { FormField, TextInput } from './FormField';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const mutation = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string; form?: string }>({});

  useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setErrors({});
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!current) nextErrors.current = 'Escribe tu contrasena actual.';
    if (next.length < 10) nextErrors.next = 'Minimo 10 caracteres.';
    if (next === current) nextErrors.next = 'La nueva debe ser distinta a la actual.';
    if (confirm !== next) nextErrors.confirm = 'La confirmacion no coincide.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await mutation.mutateAsync({ current, next });
      toast.success('Contrasena actualizada', {
        description: 'Te enviamos un correo confirmando el cambio.',
      });
      onClose();
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Error desconocido.';
      setErrors({ form: msg });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cambiar contrasena"
      description="Elegi una contrasena nueva de al menos 10 caracteres. Vas a recibir un correo confirmando el cambio."
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancelar
          </button>
          <button
            type="submit"
            form="change-password-form"
            className="btn btn-solid"
            disabled={mutation.isPending}
          >
            <KeyRound className="size-4" />
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={submit} noValidate className="space-y-4">
        <FormField label="Contrasena actual" required error={errors.current}>
          <TextInput
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            invalid={!!errors.current}
            autoFocus
          />
        </FormField>
        <FormField
          label="Nueva contrasena"
          required
          error={errors.next}
          hint={errors.next ? undefined : 'Minimo 10 caracteres. Mezcla letras, numeros y simbolos.'}
        >
          <TextInput
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            invalid={!!errors.next}
          />
        </FormField>
        <FormField label="Confirmar nueva contrasena" required error={errors.confirm}>
          <TextInput
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            invalid={!!errors.confirm}
          />
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
