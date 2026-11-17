import { Construction } from 'lucide-react';

interface AdminStubPageProps {
  title: string;
  description: string;
}

/**
 * Pantalla de "proximamente" para los modulos planificados que todavia
 * no tienen UI propia. Se reemplaza por el componente real cuando toque.
 */
export function AdminStubPage({ title, description }: AdminStubPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="rounded-lg border border-dashed border-line bg-paper p-8 text-center">
        <Construction className="mx-auto mb-3 size-10 text-spark" aria-hidden="true" />
        <p className="text-sm text-graphite">{description}</p>
        <p className="mt-4 text-xs text-graphite/70">
          Esta pantalla se habilitara en una proxima iteracion segun el plan.
        </p>
      </div>
    </div>
  );
}
