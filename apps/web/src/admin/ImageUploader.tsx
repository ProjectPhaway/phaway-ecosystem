import { useRef, useState } from 'react';
import { api } from '../lib/api-client';
import { ImageCompressor, imageCompressor } from '../lib/image-compressor';

const MAX_IMAGES = 11; // 1 principal + 10 de galeria (limite del API)
const MAX_BYTES = ImageCompressor.MAX_INPUT_BYTES;
const ACCEPT = ImageCompressor.ACCEPT;

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  invalid?: boolean;
}

/** Sube fotos al API apenas se eligen. La primera de la lista es la foto principal. */
export function ImageUploader({ images, onChange, invalid }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = MAX_IMAGES - images.length;
    const picked = [...files].slice(0, room);
    const problems: string[] = [];
    if (files.length > room) problems.push(`Máximo ${MAX_IMAGES} fotos por producto.`);

    let current = images;
    for (const file of picked) {
      if (!ACCEPT.includes(file.type)) {
        problems.push(`${file.name}: solo JPG, PNG o WEBP.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        problems.push(`${file.name}: pesa más de 30 MB.`);
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
    if (input.current) input.current.value = '';
  };

  const makeMain = (i: number) => onChange([images[i], ...images.filter((_, j) => j !== i)]);
  const removeAt = (i: number) => onChange(images.filter((_, j) => j !== i));

  return (
    <div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <li key={src} className="group relative">
            <img
              src={src}
              alt={i === 0 ? 'Foto principal' : `Foto ${i + 1}`}
              className={`aspect-[4/5] w-full bg-concrete object-cover ${i === 0 ? 'outline-2 outline-offset-2 outline-ink' : ''}`}
            />
            {i === 0 && (
              <span className="absolute left-0 top-0 bg-ink px-2 py-1 text-xs font-bold text-paper">Principal</span>
            )}
            <div className="mt-1.5 flex justify-between gap-2 text-xs font-semibold">
              {i > 0 ? (
                <button type="button" className="hover:underline" onClick={() => makeMain(i)}>
                  Hacer principal
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="text-alert hover:underline" onClick={() => removeAt(i)}>
                Quitar
              </button>
            </div>
          </li>
        ))}

        {images.length < MAX_IMAGES && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={uploading > 0}
              className={`grid aspect-[4/5] w-full place-items-center border-2 border-dashed p-3 text-center text-sm font-semibold hover:bg-concrete ${invalid ? 'border-alert text-alert' : 'border-graphite'}`}
            >
              {uploading > 0 ? 'Subiendo…' : images.length ? 'Agregar fotos' : 'Subir fotos'}
            </button>
          </li>
        )}
      </ul>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(',')}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void addFiles(e.target.files)}
      />
      <p className="mt-2 text-sm text-graphite">
        JPG, PNG o WEBP, hasta 30 MB: se optimizan solas al subir. La primera foto es la que se ve en el catálogo.
      </p>
      {error && <p role="alert" className="mt-2 text-sm text-alert">{error}</p>}
    </div>
  );
}
