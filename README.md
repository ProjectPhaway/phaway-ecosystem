# Phaway Ecosystem

Catalogo web, panel administrativo y (en fases futuras) gestion de pedidos personalizados para **Phaway - Ropa deportiva**.

## Requisitos

- Node 24+
- pnpm 11+
- PostgreSQL (local o una base gratuita en [Neon](https://neon.tech))

## Primeros pasos

```bash
pnpm install
cp apps/api/.env.example apps/api/.env        # completar DATABASE_URL y JWT_SECRET
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000/api (salud: http://localhost:3000/health)

## Estructura

```
apps/
  api/       NestJS + Prisma (PostgreSQL)
  web/       React + Vite + Tailwind
packages/
  shared/    Tipos y utilidades compartidas
```

Convenciones y decisiones de arquitectura: ver [CLAUDE.md](CLAUDE.md).
