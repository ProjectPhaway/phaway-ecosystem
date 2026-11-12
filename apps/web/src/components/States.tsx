import type { ReactNode } from 'react';

export function LoadingGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Cargando productos"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse bg-concrete motion-reduce:animate-none" />
          <div className="mt-3 h-4 w-2/3 bg-concrete" />
        </div>
      ))}
    </div>
  );
}

export function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border border-ink px-6 py-12 text-center">
      <p className="display text-3xl">{title}</p>
      {children && <p className="mx-auto mt-3 max-w-md text-graphite">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorNotice({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  return <Notice title="No se pudo cargar">{message}</Notice>;
}
