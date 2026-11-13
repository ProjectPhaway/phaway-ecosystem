import { zodResolver } from '@hookform/resolvers/zod';
import type { ProductDto, ProductInput } from '@phaway/shared';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { ErrorNotice } from '../components/States';
import { useAdminProduct, useCategories, useSaveProduct } from '../lib/queries';
import { ImageUploader } from './ImageUploader';

const MONEY = /^\d{1,8}(\.\d{1,2})?$/;
const QUICK_SIZES = ['S', 'M', 'L', 'XL'];

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre').max(120, 'Máximo 120 caracteres'),
  categoryId: z.string().min(1, 'Elige una categoría'),
  basePrice: z.string().trim().regex(MONEY, 'Escribe un precio como 49.90'),
  description: z.string().max(2000, 'Máximo 2000 caracteres'),
  isOnSale: z.boolean(),
  isActive: z.boolean(),
  images: z.array(z.string()).min(1, 'Sube al menos una foto'),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.string().trim().min(1, 'Talla'),
        color: z.string().trim().min(1, 'Color'),
        stock: z.string().trim().regex(/^\d+$/, 'Número'),
        priceOverride: z.string().trim().regex(MONEY, 'Ej. 59.90').or(z.literal('')),
      }),
    )
    .min(1, 'Agrega al menos una talla con su color y stock'),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: '',
  categoryId: '',
  basePrice: '',
  description: '',
  isOnSale: false,
  isActive: true,
  images: [],
  variants: [],
};

function toForm(p: ProductDto): FormValues {
  return {
    name: p.name,
    categoryId: p.category.id,
    basePrice: Number(p.basePrice).toFixed(2),
    description: p.description ?? '',
    isOnSale: p.isOnSale,
    isActive: p.isActive,
    images: [p.mainImageUrl, ...p.galleryImages],
    variants: p.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: String(v.stock),
      priceOverride: v.priceOverride ? Number(v.priceOverride).toFixed(2) : '',
    })),
  };
}

function toInput(v: FormValues): ProductInput {
  return {
    name: v.name,
    description: v.description.trim() || undefined,
    basePrice: v.basePrice,
    categoryId: v.categoryId,
    isOnSale: v.isOnSale,
    isActive: v.isActive,
    mainImageUrl: v.images[0],
    galleryImages: v.images.slice(1),
    variants: v.variants.map((x) => ({
      ...(x.id && { id: x.id }),
      size: x.size,
      color: x.color,
      stock: Number(x.stock),
      priceOverride: x.priceOverride || null,
    })),
  };
}

/** `/admin/productos/nuevo` y `/admin/productos/:id`. */
export function ProductFormPage() {
  const { id } = useParams();
  const existing = useAdminProduct(id);

  if (id && existing.isPending) return <p className="text-graphite">Cargando producto…</p>;
  if (id && existing.isError) return <ErrorNotice error={existing.error} />;

  return <ProductForm key={id ?? 'new'} id={id} initial={existing.data ? toForm(existing.data) : EMPTY} slug={existing.data?.slug} />;
}

function ProductForm({ id, initial, slug }: { id?: string; initial: FormValues; slug?: string }) {
  const navigate = useNavigate();
  const categories = useCategories();
  const save = useSaveProduct(id);
  const [quickColor, setQuickColor] = useState('');

  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial });
  const variants = useFieldArray({ control, name: 'variants' });

  const addQuickSizes = () => {
    const color = quickColor.trim();
    if (!color) return;
    const existing = new Set(getValues('variants').map((v) => `${v.size.toUpperCase()}|${v.color.toLowerCase()}`));
    QUICK_SIZES.filter((s) => !existing.has(`${s}|${color.toLowerCase()}`)).forEach((size) =>
      variants.append({ size, color, stock: '0', priceOverride: '' }),
    );
    setQuickColor('');
  };

  const onSubmit = handleSubmit((values) =>
    save.mutate(toInput(values), {
      onSuccess: () => navigate('/admin/productos'),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin/productos" className="text-sm text-graphite hover:underline">
            Productos
          </Link>
          <h1 className="mt-1 text-3xl font-bold">{id ? 'Editar producto' : 'Nuevo producto'}</h1>
        </div>
        {slug && (
          <a href={`/producto/${slug}`} target="_blank" className="text-sm font-semibold hover:underline">
            Ver en la tienda
          </a>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        {/* Fotos */}
        <section aria-labelledby="photos-title">
          <h2 id="photos-title" className="text-lg font-bold">Fotos</h2>
          <div className="mt-4">
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageUploader images={field.value} onChange={field.onChange} invalid={!!errors.images} />
              )}
            />
            {errors.images && <p className="mt-2 text-sm text-alert">{errors.images.message}</p>}
          </div>
        </section>

        {/* Datos */}
        <section aria-labelledby="data-title" className="space-y-5">
          <h2 id="data-title" className="text-lg font-bold">Datos</h2>

          <Field label="Nombre" error={errors.name?.message}>
            <input className="field" aria-invalid={!!errors.name} placeholder="Camiseta Koala verde" {...register('name')} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Categoría" error={errors.categoryId?.message}>
              <select className="field" aria-invalid={!!errors.categoryId} {...register('categoryId')}>
                <option value="">Elige…</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Precio (S/)" error={errors.basePrice?.message}>
              <input className="field tabular-nums" inputMode="decimal" placeholder="49.90" aria-invalid={!!errors.basePrice} {...register('basePrice')} />
            </Field>
          </div>

          <Field label="Descripción" hint="Opcional. Tela, uso, cuidados." error={errors.description?.message}>
            <textarea className="field min-h-28" {...register('description')} />
          </Field>

          <fieldset className="space-y-3 border-t border-line pt-5">
            <legend className="sr-only">Visibilidad</legend>
            <Check label="Mostrar en la tienda" hint="Si lo desmarcas, el producto queda oculto pero no se borra." {...register('isActive')} />
            <Check label="Poner en Liquidación" hint="Aparece en la sección Liquidación y en el inicio." {...register('isOnSale')} />
          </fieldset>
        </section>
      </div>

      {/* Variantes */}
      <section aria-labelledby="variants-title" className="mt-12 border-t-2 border-ink pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="variants-title" className="text-lg font-bold">Tallas, colores y stock</h2>
            <p className="mt-1 text-sm text-graphite">
              Una fila por cada combinación. El precio especial es opcional: si lo dejas vacío se usa el precio del producto.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
            <label className="flex-1 sm:flex-none">
              <span className="mb-1.5 block text-sm font-semibold">Color</span>
              <input
                className="field w-full sm:w-36"
                value={quickColor}
                onChange={(e) => setQuickColor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addQuickSizes();
                  }
                }}
                placeholder="Negro"
              />
            </label>
            <button type="button" className="btn btn-outline" onClick={addQuickSizes} disabled={!quickColor.trim()}>
              Agregar S, M, L, XL
            </button>
          </div>
        </div>

        {variants.fields.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr className="border-b border-ink text-left">
                  <th className="pb-2 pr-3 font-semibold">Talla</th>
                  <th className="pb-2 pr-3 font-semibold">Color</th>
                  <th className="pb-2 pr-3 font-semibold">Stock</th>
                  <th className="pb-2 pr-3 font-semibold">Precio especial</th>
                  <th className="pb-2"><span className="sr-only">Quitar</span></th>
                </tr>
              </thead>
              <tbody>
                {variants.fields.map((f, i) => {
                  const e = errors.variants?.[i];
                  return (
                    <tr key={f.id} className="border-b border-line align-top">
                      <td className="py-2 pr-3">
                        <input className="field w-20 uppercase" aria-label={`Talla fila ${i + 1}`} aria-invalid={!!e?.size} {...register(`variants.${i}.size`)} />
                      </td>
                      <td className="py-2 pr-3">
                        <input className="field" aria-label={`Color fila ${i + 1}`} aria-invalid={!!e?.color} {...register(`variants.${i}.color`)} />
                      </td>
                      <td className="py-2 pr-3">
                        <input className="field w-24 tabular-nums" inputMode="numeric" aria-label={`Stock fila ${i + 1}`} aria-invalid={!!e?.stock} {...register(`variants.${i}.stock`)} />
                        {e?.stock && <span className="text-xs text-alert">{e.stock.message}</span>}
                      </td>
                      <td className="py-2 pr-3">
                        <input className="field w-28 tabular-nums" inputMode="decimal" placeholder="—" aria-label={`Precio especial fila ${i + 1}`} aria-invalid={!!e?.priceOverride} {...register(`variants.${i}.priceOverride`)} />
                        {e?.priceOverride && <span className="text-xs text-alert">{e.priceOverride.message}</span>}
                      </td>
                      <td className="py-2 text-right">
                        <button type="button" className="min-h-11 px-2 font-semibold text-alert hover:underline" onClick={() => variants.remove(i)}>
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          className="mt-4 text-sm font-semibold underline underline-offset-4"
          onClick={() => variants.append({ size: '', color: '', stock: '0', priceOverride: '' })}
        >
          Agregar una fila
        </button>
        {errors.variants?.root?.message || errors.variants?.message ? (
          <p className="mt-2 text-sm text-alert">{errors.variants?.root?.message ?? errors.variants?.message}</p>
        ) : null}
      </section>

      {/* Acciones */}
      <div className="sticky bottom-0 mt-12 flex flex-wrap items-center justify-end gap-3 border-t border-ink bg-paper py-4">
        {save.isError && (
          <p role="alert" className="mr-auto text-sm text-alert">{save.error.message}</p>
        )}
        <Link to="/admin/productos" className="btn btn-outline">
          Cancelar
        </Link>
        <button type="submit" className="btn btn-solid" disabled={save.isPending || (!!id && !isDirty)}>
          {save.isPending ? 'Guardando…' : id ? 'Guardar cambios' : 'Publicar producto'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint && <span className="ml-2 text-sm text-graphite">{hint}</span>}
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-sm text-alert">{error}</span>}
    </label>
  );
}

const Check = ({ label, hint, ...props }: { label: string; hint: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="flex cursor-pointer gap-3">
    <input type="checkbox" className="mt-1 size-5 accent-ink" {...props} />
    <span>
      <span className="font-semibold">{label}</span>
      <span className="block text-sm text-graphite">{hint}</span>
    </span>
  </label>
);
