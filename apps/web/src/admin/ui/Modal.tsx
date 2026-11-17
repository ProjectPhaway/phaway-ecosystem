import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  /** Si true, click en el backdrop o Escape cierran el modal. Default: false (como BDApp2). */
  dismissible?: boolean;
  children: React.ReactNode;
  /** Pie opcional con botones (ej: <button>Cancelar</button><button>Guardar</button>). */
  footer?: React.ReactNode;
}

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Modal con backdrop + portal + focus trap minimo. Patron copiado de BDApp2
 * (ModalContainer + ModalHeader) adaptado a los tokens Phaway y sin dependencia
 * externa. La tecla Escape cierra solo si `dismissible`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  dismissible = false,
  children,
  footer,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${sizeClass[size]} rounded-xl bg-paper shadow-2xl ring-1 ring-line outline-none`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-ink lg:text-lg">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-graphite">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-md p-1.5 text-graphite transition-colors hover:bg-concrete hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-line bg-cloud/50 px-6 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
