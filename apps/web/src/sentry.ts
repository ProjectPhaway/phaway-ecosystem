import * as Sentry from '@sentry/react';

/**
 * Sentry para la web. Se activa solo si VITE_SENTRY_DSN esta definida en el
 * build (por defecto nulo en dev). Captura excepciones JS y errores de render
 * de React. En produccion muestrea 10% de las transacciones de performance.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Filtrar payloads sensibles antes de enviar al backend de Sentry.
    beforeSend(event) {
      const data = event.request?.data;
      if (data && typeof data === 'object') {
        const scrub = data as Record<string, unknown>;
        for (const key of ['password', 'currentPassword', 'newPassword', 'token']) {
          if (key in scrub) scrub[key] = '[REDACTED]';
        }
      }
      return event;
    },
  });
}
