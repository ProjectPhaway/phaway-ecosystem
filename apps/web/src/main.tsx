import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { initSentry } from './sentry';
import './index.css';

// Inicializar Sentry antes que cualquier render.
initSentry();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

// Fallback visible mientras Vite descarga un chunk perezoso (p. ej. el panel admin).
// Se tiñe con "cloud" para no parpadear blanco contra el fondo del sitio.
const routeFallback = (
  <div
    role="status"
    aria-label="Cargando"
    className="grid min-h-dvh place-items-center bg-cloud text-ink/60"
  >
    <span className="inline-block size-10 animate-spin rounded-full border-4 border-mist border-t-spark" />
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={routeFallback}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);
