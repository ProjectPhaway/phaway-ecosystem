# Phaway Ecosystem

Catálogo web, panel administrativo y (en fases futuras) gestión de pedidos personalizados para **Phaway - Ropa deportiva**.

## Requisitos

- Node 24+
- pnpm 11+
- PostgreSQL 18 (local vía pgAdmin, o una base gratuita en [Neon](https://neon.tech))

## Primeros pasos (sólo la primera vez)

```bash
pnpm install
cp apps/api/.env.example apps/api/.env        # completar DATABASE_URL y JWT_SECRET
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate
pnpm db:seed
```

## Levantar en desarrollo

**Opción A — todo en una sola terminal (API + Web en paralelo):**

```bash
pnpm dev
```

**Opción B — API y Web en terminales separadas (recomendado para ver logs limpios):**

```bash
# Terminal 1 — API en http://localhost:3000
pnpm dev:api

# Terminal 2 — Web en http://localhost:5173
pnpm dev:web
```

Endpoints:

- Web pública: http://localhost:5173
- Panel admin: http://localhost:5173/admin (credenciales del `.env`: `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- API: http://localhost:3000/api (salud: http://localhost:3000/health)
- API docs (Swagger): http://localhost:3000/docs — lista todos los endpoints con "Try it out". Se apaga en producción con `SWAGGER=off`.

Para detener cualquiera de los procesos: `Ctrl+C` en su terminal.

## Base de datos

```bash
pnpm db:migrate     # aplica migraciones pendientes (modo dev)
pnpm db:seed        # categorías + usuarios admin/marketing (idempotente)
pnpm db:studio      # abre Prisma Studio en el navegador
```

## Otros comandos útiles

```bash
pnpm build          # compila shared → api → web
pnpm lint           # eslint en todos los paquetes
pnpm --filter @phaway/web test:e2e   # Playwright (requiere api+web+Postgres encendidos)
```

Variables de entorno para Playwright: exportar `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (los mismos del `.env` del API).

## Estructura

```
apps/
  api/       NestJS + Prisma (PostgreSQL)
  web/       React + Vite + Tailwind
packages/
  shared/    Tipos y utilidades compartidas
```

## Licencia

Código propietario de Phaway. Todos los derechos reservados.
