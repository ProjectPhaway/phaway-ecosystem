/**
 * Sentry para la API. DEBE importarse como PRIMER modulo en main.ts, antes
 * que cualquier otra cosa, para que los decoradores de Nest se instrumenten.
 *
 * Si `SENTRY_DSN` no esta configurada, no hace nada (silencio total en dev).
 * En produccion se activa automaticamente con la variable.
 */
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // 10% de los requests en produccion para perf; 100% en dev si se activa.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filtrar campos sensibles que puedan colarse en errores.
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, unknown>;
        for (const key of ['password', 'currentPassword', 'newPassword', 'token', 'tokenHash']) {
          if (key in data) data[key] = '[REDACTED]';
        }
      }
      return event;
    },
  });
}
