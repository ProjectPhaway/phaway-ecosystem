import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { Modal } from './Modal';
import { FormField, TextInput, TextArea } from './FormField';

export interface CustomerDraft {
  name: string;
  phone: string;
  dni?: string;
  address?: string;
  notes?: string;
}

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<CustomerDraft>;
  /** Se invoca al guardar; el padre decide si los copia al pedido o los persiste. */
  onSaved: (customer: CustomerDraft) => void;
}

const PHONE_HINT = '+51 9XX XXX XXX';

/**
 * Modal de alta/edicion rapida de cliente. No persiste nada por si solo:
 * delega en `onSaved` (en Fase 1 copia los datos al pedido en curso; en Fase 2
 * se conectara al modulo de customers cuando exista en la API).
 */
export function CustomerModal({ open, onClose, initial, onSaved }: CustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setPhone(initial?.phone ?? '');
    setDni(initial?.dni ?? '');
    setAddress(initial?.address ?? '');
    setNotes(initial?.notes ?? '');
    setErrors({});
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'El nombre es obligatorio.';
    if (!phone.trim()) next.phone = 'El telefono es obligatorio.';
    else if (phone.trim().length < 7) next.phone = 'Telefono muy corto.';
    if (dni && !/^\d{8}$/.test(dni.trim())) next.dni = 'El DNI debe tener 8 digitos.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const customer: CustomerDraft = {
      name: name.trim(),
      phone: phone.trim(),
      dni: dni.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    onSaved(customer);
    toast.success('Datos del cliente agregados', {
      description: `${customer.name} queda cargado en este pedido. Al confirmarlo aparece en Clientes.`,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Datos del cliente"
      description="Completa los datos. Se copian al pedido actual y, al confirmarlo, el cliente aparece en el modulo Clientes con su historial."
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancelar
          </button>
          <button type="submit" form="customer-form" className="btn btn-solid">
            <UserPlus className="size-4" />
            Guardar cliente
          </button>
        </>
      }
    >
      <form id="customer-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nombre completo" required error={errors.name} className="sm:col-span-2">
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Maria Perez"
            invalid={!!errors.name}
          />
        </FormField>

        <FormField label="Telefono" required error={errors.phone} hint="Formato internacional">
          <TextInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={PHONE_HINT}
            inputMode="tel"
            invalid={!!errors.phone}
          />
        </FormField>

        <FormField label="DNI" error={errors.dni} hint="8 digitos, opcional">
          <TextInput
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="12345678"
            inputMode="numeric"
            invalid={!!errors.dni}
          />
        </FormField>

        <FormField label="Direccion" hint="Opcional, ayuda a planificar entregas" className="sm:col-span-2">
          <TextInput
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. Ejemplo 123, San Juan de Lurigancho"
          />
        </FormField>

        <FormField label="Notas del cliente" hint="Opcional" className="sm:col-span-2">
          <TextArea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Preferencias, horarios de entrega, etc."
          />
        </FormField>
      </form>
    </Modal>
  );
}
