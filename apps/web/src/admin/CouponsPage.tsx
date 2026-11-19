import type { CouponDto } from '@phaway/shared';
import { Percent, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '../lib/api-client';
import { useCoupons, useCreateCoupon, useDeleteCoupon, useSetCouponStatus } from '../lib/queries';
import { FormField, SelectInput, TextInput } from './ui/FormField';
import { Modal } from './ui/Modal';

export function CouponsPage() {
  const coupons = useCoupons();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cupones</h1>
          <p className="mt-1 text-sm text-graphite">Crea descuentos porcentuales o de monto fijo para pedidos.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn btn-solid">
          <Plus className="size-4" />
          Nuevo cupon
        </button>
      </header>

      <section className="overflow-hidden rounded-lg border border-line bg-paper">
        {coupons.isPending ? (
          <p className="p-6 text-sm text-graphite">Cargando…</p>
        ) : coupons.isError ? (
          <p className="p-6 text-sm text-alert">No se pudieron cargar los cupones.</p>
        ) : coupons.data.length === 0 ? (
          <p className="p-10 text-center text-sm text-graphite">Aun no hay cupones creados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-2 font-semibold">Codigo</th>
                  <th className="px-4 py-2 font-semibold">Descuento</th>
                  <th className="px-4 py-2 font-semibold">Usos</th>
                  <th className="px-4 py-2 font-semibold">Estado</th>
                  <th className="px-4 py-2"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {coupons.data.map((coupon) => (
                  <CouponRow key={coupon.id} coupon={coupon} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <CouponModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function CouponRow({ coupon }: { coupon: CouponDto }) {
  const setStatus = useSetCouponStatus();
  const remove = useDeleteCoupon();

  const toggle = async () => {
    await setStatus.mutateAsync({ id: coupon.id, isActive: !coupon.isActive });
  };
  const del = async () => {
    if (!window.confirm(`Eliminar el cupon ${coupon.code}?`)) return;
    try {
      await remove.mutateAsync(coupon.id);
      toast.success('Cupon eliminado');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo eliminar');
    }
  };

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3 font-mono font-bold">{coupon.code}</td>
      <td className="px-4 py-3">{coupon.type === 'percent' ? `${coupon.value}%` : `S/ ${coupon.value}`}</td>
      <td className="px-4 py-3 tabular-nums">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</td>
      <td className="px-4 py-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${coupon.isActive ? 'bg-ok/10 text-ok' : 'bg-concrete text-graphite'}`}>
          {coupon.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3 text-sm font-semibold">
          <button type="button" onClick={() => void toggle()} disabled={setStatus.isPending} className="inline-flex items-center gap-1 hover:underline">
            <Power className="size-3" />
            {coupon.isActive ? 'Desactivar' : 'Activar'}
          </button>
          <button type="button" onClick={() => void del()} disabled={remove.isPending} className="inline-flex items-center gap-1 text-alert hover:underline">
            <Trash2 className="size-3" />
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function CouponModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateCoupon();
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [minimum, setMinimum] = useState('0');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await create.mutateAsync({
        code: code.trim().toUpperCase(),
        type,
        value,
        minimumAmount: minimum || '0',
        usageLimit: limit ? Number(limit) : undefined,
      });
      toast.success('Cupon creado');
      setCode('');
      setValue('');
      setMinimum('0');
      setLimit('');
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el cupon.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo cupon"
      dismissible
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline">Cancelar</button>
          <button type="submit" form="coupon-form" disabled={create.isPending} className="btn btn-solid">
            <Percent className="size-4" />
            Crear
          </button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={(e) => void submit(e)} className="space-y-4">
        <FormField label="Codigo" required>
          <TextInput value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BIENVENIDO10" />
        </FormField>
        <FormField label="Tipo" required>
          <SelectInput value={type} onChange={(e) => setType(e.target.value as 'percent' | 'fixed')}>
            <option value="percent">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </SelectInput>
        </FormField>
        <FormField label={type === 'percent' ? 'Porcentaje (%)' : 'Monto (S/)'} required>
          <TextInput inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'percent' ? '10' : '20.00'} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Compra minima (S/)">
            <TextInput inputMode="decimal" value={minimum} onChange={(e) => setMinimum(e.target.value)} />
          </FormField>
          <FormField label="Limite de usos">
            <TextInput inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Sin limite" />
          </FormField>
        </div>
        {error && <p role="alert" className="text-sm text-alert">{error}</p>}
      </form>
    </Modal>
  );
}
