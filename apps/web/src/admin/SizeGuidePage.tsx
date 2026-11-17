import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageOff, Loader2, Ruler, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api-client';
import { imageCompressor } from '../lib/image-compressor';
import { useSizeGuide, useUpdateSizeGuide } from '../lib/queries';

const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB antes de compresion

function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

/**
 * Admin para subir la guia de tallas global. Solo una imagen activa a la vez:
 * subir una nueva reemplaza la anterior en la vista publica.
 */
export function SizeGuidePage() {
  const guide = useSizeGuide();
  const update = useUpdateSizeGuide();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);
      try {
        const compressed = await imageCompressor.compress(files[0]);
        const url = await api.uploadImage(compressed);
        await update.mutateAsync(url);
        toast.success('Guía de tallas actualizada', {
          description: 'Ya aparece en todas las fichas de producto.',
        });
      } catch (e) {
        toast.error('No se pudo subir la imagen', {
          description: e instanceof Error ? e.message : undefined,
        });
      } finally {
        setUploading(false);
      }
    },
    [update],
  );

  const { getRootProps, getInputProps, isDragActive, open: openPicker } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: false,
    maxSize: MAX_BYTES,
    noClick: true,
    noKeyboard: true,
  });

  const remove = async () => {
    if (!confirm('¿Quitar la guía de tallas? Dejará de aparecer en la ficha de producto.')) return;
    try {
      await update.mutateAsync(null);
      toast.success('Guía de tallas quitada');
    } catch (e) {
      toast.error('No se pudo quitar', { description: e instanceof Error ? e.message : undefined });
    }
  };

  const currentUrl = guide.data?.url ?? null;
  const updatedLabel = formatUpdatedAt(guide.data?.updatedAt ?? null);

  return (
    <div className="space-y-6">
      <header>
        <p className="inline-flex items-center gap-2 text-sm text-graphite">
          <Ruler className="size-4" />
          Catálogo
        </p>
        <h1 className="mt-1 text-2xl font-bold">Guía de tallas</h1>
        <p className="mt-1 text-sm text-graphite">
          Una sola imagen global que aparece en la ficha de todos los productos. Subí una tabla clara
          con las medidas en centímetros por talla.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div
          {...getRootProps()}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all ${
            isDragActive
              ? 'border-spark bg-spark-100/50'
              : 'border-line bg-cloud/40 hover:border-graphite hover:bg-cloud'
          }`}
        >
          <input {...getInputProps()} />
          <div className={`mb-3 grid size-14 place-items-center rounded-full ${isDragActive ? 'bg-spark text-paper' : 'bg-paper text-spark shadow-sm ring-1 ring-line'}`}>
            {uploading ? <Loader2 className="size-7 animate-spin" /> : <UploadCloud className="size-7" />}
          </div>
          <p className="text-sm font-semibold">
            {isDragActive
              ? 'Suelta la imagen aquí'
              : uploading
                ? 'Subiendo imagen…'
                : currentUrl
                  ? 'Arrastra una imagen para reemplazar la actual'
                  : 'Arrastra la guía o haz clic para elegir'}
          </p>
          <p className="mt-1 text-xs text-graphite">JPG, PNG o WEBP, hasta 10 MB. Se optimiza sola.</p>
        </div>

        <aside className="rounded-lg border border-line bg-paper p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-graphite">Vista previa</h2>
          {guide.isPending ? (
            <p className="mt-6 text-sm text-graphite">Cargando…</p>
          ) : currentUrl ? (
            <>
              <div className="mt-4 overflow-hidden rounded-md border border-line bg-cloud">
                <img
                  src={currentUrl}
                  alt="Guía de tallas actual"
                  className="mx-auto block max-h-80 w-auto object-contain"
                />
              </div>
              {updatedLabel && (
                <p className="mt-3 text-xs text-graphite">Actualizada el {updatedLabel}</p>
              )}
              <div className="mt-4 flex gap-2">
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink hover:border-spark hover:text-spark"
                >
                  Abrir en pestaña nueva
                </a>
                <button
                  type="button"
                  onClick={remove}
                  disabled={update.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-alert/40 bg-alert/5 px-3 py-1.5 text-sm font-semibold text-alert hover:bg-alert/10 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  Quitar guía
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
              <ImageOff className="size-10 text-graphite" />
              <p className="text-sm font-semibold">Aún no hay guía</p>
              <p className="text-xs text-graphite">
                El botón "Guía de tallas" no aparecerá en la ficha de producto hasta que subas una
                imagen.
              </p>
            </div>
          )}
        </aside>
      </section>

      <section className="rounded-lg border border-dashed border-line bg-paper p-5 text-sm text-graphite">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">Consejos</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Imagen horizontal o cuadrada, mínimo 800 px de ancho para que se lea en el modal.</li>
          <li>Mostrar las medidas en centímetros (ancho, largo, manga, etc.) por talla S, M, L, XL.</li>
          <li>Fondo claro y texto oscuro: así se lee bien en celulares con brillo bajo.</li>
          <li>Si tus prendas usan tallas distintas por tipo (camisetas vs pantalones), separá bloques
            dentro de la misma imagen hasta que agreguemos guías por categoría en Fase 2.</li>
        </ul>
      </section>
    </div>
  );
}
