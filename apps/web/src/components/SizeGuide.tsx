import { useEffect, useId, useRef, useState } from 'react';
import { useSizeGuide } from '../lib/queries';

/**
 * Enlace que abre la guia de tallas en un dialogo. Usa <dialog> nativo:
 * cierra con Esc, atrapa el foco y se muestra sobre todo lo demas.
 * La URL de la imagen viene de /settings/size-guide (editable desde el panel).
 */
export function SizeGuideLink({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const guide = useSizeGuide();
  if (!guide.data?.url) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Guía de tallas
      </button>
      <SizeGuideDialog open={open} onClose={() => setOpen(false)} src={guide.data.url} />
    </>
  );
}

function SizeGuideDialog({ open, onClose, src }: { open: boolean; onClose: () => void; src: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="w-[min(92vw,56rem)] max-w-full bg-paper p-0 backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
    >
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id={titleId} className="text-xl font-bold">Guía de tallas</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="grid size-10 place-items-center text-2xl font-bold text-graphite hover:text-ink"
        >
          ×
        </button>
      </header>
      <div className="max-h-[70vh] overflow-auto bg-cloud p-4">
        <img
          src={src}
          alt="Tabla de medidas de prendas Phaway en centímetros por talla."
          className="mx-auto block w-full max-w-xl"
        />
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-graphite">
        <p>Medidas en centímetros. ¿Dudas? Escríbenos por WhatsApp.</p>
        <a href={src} target="_blank" rel="noopener noreferrer" className="link-spark font-semibold">
          Abrir en otra pestaña
        </a>
      </footer>
    </dialog>
  );
}
