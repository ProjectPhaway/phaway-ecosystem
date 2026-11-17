import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, Loader2, Star, Trash2, UploadCloud } from 'lucide-react';
import { api } from '../lib/api-client';
import { ImageCompressor, imageCompressor } from '../lib/image-compressor';

const MAX_IMAGES = 11; // 1 principal + 10 de galeria (limite del API)
const MAX_BYTES = ImageCompressor.MAX_INPUT_BYTES;
const ACCEPT = ImageCompressor.ACCEPT;
const DROPZONE_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  invalid?: boolean;
}

/**
 * Subida de fotos del producto.
 * - Soporta drag & drop (react-dropzone) + click para abrir el picker.
 * - Preview inmediato de cada foto, badge "Principal" en la primera,
 *   boton para marcar como principal y boton para quitar.
 * - Las imagenes se optimizan con ImageCompressor antes de subir al API.
 */
export function ImageUploader({ images, onChange, invalid }: Props) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setError(null);
      const room = MAX_IMAGES - images.length;
      const picked = files.slice(0, room);
      const problems: string[] = [];
      if (files.length > room) problems.push(`Maximo ${MAX_IMAGES} fotos por producto.`);

      let current = images;
      for (const file of picked) {
        if (!ACCEPT.includes(file.type)) {
          problems.push(`${file.name}: solo JPG, PNG o WEBP.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          problems.push(`${file.name}: pesa mas de 30 MB.`);
          continue;
        }
        setUploading((n) => n + 1);
        try {
          const url = await api.uploadImage(await imageCompressor.compress(file));
          current = [...current, url];
          onChange(current);
        } catch (e) {
          problems.push(`${file.name}: ${e instanceof Error ? e.message : 'no se pudo subir'}.`);
        } finally {
          setUploading((n) => n - 1);
        }
      }
      if (problems.length) setError(problems.join(' '));
    },
    [images, onChange],
  );

  const { getRootProps, getInputProps, isDragActive, open: openPicker } = useDropzone({
    onDrop: (accepted) => void addFiles(accepted),
    accept: DROPZONE_ACCEPT,
    multiple: true,
    maxSize: MAX_BYTES,
    noClick: true,
    noKeyboard: true,
  });

  const canUploadMore = images.length < MAX_IMAGES;
  const makeMain = (i: number) => onChange([images[i], ...images.filter((_, j) => j !== i)]);
  const removeAt = (i: number) => onChange(images.filter((_, j) => j !== i));

  return (
    <div>
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={`mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all ${
            isDragActive
              ? 'border-spark bg-spark-100/50'
              : invalid
                ? 'border-alert bg-alert/5 text-alert'
                : 'border-line bg-cloud/40 hover:border-graphite hover:bg-cloud'
          }`}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
        >
          <input {...getInputProps()} />
          <div className={`mb-2 grid size-12 place-items-center rounded-full ${isDragActive ? 'bg-spark text-paper' : 'bg-paper text-spark shadow-sm ring-1 ring-line'}`}>
            {uploading > 0 ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
          </div>
          <p className="text-sm font-semibold">
            {isDragActive
              ? 'Suelta las fotos aqui'
              : uploading > 0
                ? `Subiendo ${uploading} ${uploading === 1 ? 'foto' : 'fotos'}...`
                : 'Arrastra las fotos o haz click para elegir'}
          </p>
          <p className="mt-1 text-xs text-graphite">JPG, PNG o WEBP, hasta 30 MB. Se optimizan solas al subir.</p>
          <p className="mt-0.5 text-xs text-graphite">{images.length} / {MAX_IMAGES} fotos</p>
        </div>
      )}

      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li
              key={src}
              className={`group relative overflow-hidden rounded-lg bg-concrete ring-1 ring-line ${i === 0 ? 'ring-2 ring-ink' : ''}`}
            >
              <img
                src={src}
                alt={i === 0 ? 'Foto principal' : `Foto ${i + 1}`}
                className="aspect-[4/5] w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-ink/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-paper">
                  <Star className="size-3 fill-current" /> Principal
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-2 bg-paper/95 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {i > 0 ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ink hover:bg-concrete"
                    onClick={() => makeMain(i)}
                  >
                    <Star className="size-3" /> Principal
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  aria-label={`Quitar foto ${i + 1}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-alert hover:bg-alert/10"
                  onClick={() => removeAt(i)}
                >
                  <Trash2 className="size-3" /> Quitar
                </button>
              </div>
            </li>
          ))}
          {canUploadMore && (
            <li>
              <button
                type="button"
                onClick={openPicker}
                disabled={uploading > 0}
                className="grid aspect-[4/5] w-full place-items-center rounded-lg border border-dashed border-line bg-cloud/40 text-xs font-semibold text-graphite hover:border-graphite hover:bg-cloud"
              >
                <span className="flex flex-col items-center gap-1">
                  <ImagePlus className="size-5" />
                  Agregar
                </span>
              </button>
            </li>
          )}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
