# CLAUDE.md - Phaway Ecosystem

Contexto para Claude Code. Leer antes de tocar codigo. Lo que esta aqui ya esta decidido: no volver a preguntarlo.

## Dominio

Phaway: PYME peruana de ropa deportiva. Dos lineas de negocio:
1. **Personalizados**: uniformes a medida (diseno -> corte -> sublimado -> costura tercerizada -> acabado -> entrega). Pago 50% inicial / 50% contra entrega.
2. **Liquidación** (en el plan: "remate"): stock ya producido que hay que rotar. Ruta `/liquidacion`, campo `Product.isOnSale`. Ademas venden balones y guantes de arquero (catalogo, no liquidación).

Fase 1 (deadline lunes 2026-11-16): catalogo publico + panel admin (CRUD productos, imagenes, stock, marcar vendido) + reserva por WhatsApp.
Fuera de Fase 1: pagos online, CRM, reportes avanzados, roles granulares, dominio propio.

WhatsApp ventas: **+51 965 769 340** (`WHATSAPP_SALES_NUMBER` en `packages/shared`).
Paleta: **blanco y negro**. Referentes: Nike SB, Represent, Gymshark. Sin gradientes, sin carruseles con flechas, sin etiqueta "Popular" en todo.

## Stack

| Capa | Tecnologia |
|---|---|
| Monorepo | pnpm 11 workspaces, Node 24 |
| API (`apps/api`) | NestJS 11, Prisma **7.10.1** (fijado: `latest` en npm apunta a un RC de Prisma 8, no subir), PostgreSQL, JWT + Passport, class-validator, @nestjs/throttler |
| Web (`apps/web`) | React 19 + Vite 7, TypeScript, Tailwind CSS v4, TanStack Query, React Router 7, React Hook Form + Zod |
| Compartido (`packages/shared`) | Tipos DTO y helpers puros (mensaje WhatsApp). ESM |
| Hosting demo | Vercel (web) + Render (api) + Neon (Postgres) + Cloudflare R2 (imagenes) |

## Comandos (desde la raiz)

```bash
pnpm install          # instala todo y compila packages/shared
pnpm dev              # api (3000) + web (5173) en paralelo
pnpm dev:api | dev:web
pnpm build            # shared -> api (incluye prisma generate) -> web
pnpm lint
pnpm db:migrate       # prisma migrate dev (requiere apps/api/.env)
pnpm db:seed
pnpm db:studio
pnpm --filter @phaway/web test:e2e   # Playwright; requiere api+web+Postgres encendidos
```

Variables de entorno: copiar `apps/api/.env.example` -> `apps/api/.env` y `apps/web/.env.example` -> `apps/web/.env.local`.
BD local: PostgreSQL 18 (pgAdmin), base `phaway`. Usuarios del panel (admin/marketing) los crea el seed desde `ADMIN_*` / `MARKETING_*` del `.env`.
E2E del admin: exportar `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (mismos valores que `ADMIN_*`). Las pruebas crean y borran su propio producto.

## Prisma 7 (difiere de tutoriales viejos)

- La URL de BD esta en `apps/api/prisma.config.ts`, **no** en `schema.prisma`.
- Generator `prisma-client` con salida en `apps/api/src/generated/prisma` (gitignored). Importar desde `../generated/prisma/client`, nunca desde `@prisma/client`.
- Se usa driver adapter `@prisma/adapter-pg`. Toda la app usa `PrismaService` (global); no instanciar `PrismaClient` en otro lado (excepto `prisma/seed.ts`).
- Antes de afirmar algo de la API de Prisma/Nest/Tailwind, consultar context7.

## Arquitectura: monolito modular

Modulos en `apps/api/src/`:
- Hechos: `prisma` (global), `auth` (login JWT, `JwtAuthGuard`, limite 5/min), `catalog` (publico `/api/categories`, `/api/products`; admin `/api/admin/products`), `uploads` (`/api/admin/uploads`, valida magic bytes, disco local en `apps/api/uploads/` servido en `/uploads`; driver R2 pendiente para deploy), `orders` (admin `/api/admin/orders`: crear + cambiar estado + registrar pago; `OrderStatusPolicy` es logica pura testeable sin Prisma).
- Pendientes: catalogo masivo (CSV/PDF), reportes, Fase 3+.
- Futuro: `inventory`, `production`, `crm`.
- Deuda conocida: imagenes subidas en un formulario que luego se cancela quedan huerfanas en `uploads/` (agregar limpieza al pasar a R2).

Frontend (POO donde aporta): `ApiClient` (unico acceso HTTP), `AuthSession` (sesion observable), `ProductView` (logica de tallas/colores/stock/precio). Los componentes usan hooks de `lib/queries.ts`, nunca `fetch` directo.

### Flujo de pedidos (Fase 1)

Estados: `pending → confirmed → delivered`; cualquiera no final puede ir a `cancelled`.
- `pending → confirmed`: **descuenta stock** (updateMany condicional `stock >= qty` en transaccion; si no alcanza responde 409 y nada se aplica).
- `confirmed → cancelled`: **devuelve stock**.
- Resto: solo cambia estado/sella fecha.
- `OrderStatusPolicy` (en `orders/`) centraliza las transiciones y no importa Prisma, asi Jest la testea sin cargar el cliente generado (10 tests). La UI del admin duplica esa tabla en `apps/web/src/admin/order-helpers.ts`.
- Numero de pedido: `PH-YYMMDD-XXXX` (fecha + 4 hex), dictable por telefono.
- Dinero: siempre `string` en DTOs y props React; convertir a `Prisma.Decimal` o `Number` solo al calcular.

Convenciones por modulo:
```
src/<modulo>/
  <modulo>.module.ts
  <modulo>.controller.ts      # solo HTTP: DTOs in/out, guards. Sin logica de negocio.
  <modulo>.service.ts         # reglas de negocio
  dto/*.dto.ts                # class-validator en todo input
  <modulo>.service.spec.ts
```
- Un modulo no importa servicios internos de otro: solo lo que el otro exporte en su `@Module({ exports })`.
- Prefijo global `/api` (excepto `/health`). ValidationPipe global con `whitelist` + `forbidNonWhitelisted`.
- Dinero: `Decimal` en BD, `string` en DTOs JSON. Nunca `number` para precios.

### Regla de stock (critica)
Al pasar un `Order` a `confirmed`, en **una transaccion Prisma** se descuenta `variant.stock` por cada `OrderItem.quantity`. Si algun stock queda negativo, se revierte todo y se responde 409. Implementado con `updateMany({ where: { stock: { gte: qty } } })` para que incluso dos confirmaciones simultaneas no bajen el stock a negativo.

## Frontend

- Rutas en `apps/web/src/router.tsx`. Publicas dentro de `Layout` (header, footer, boton WhatsApp flotante). Admin bajo `AdminLayout` (`/admin/productos`, `/admin/ventas[/nuevo|/:id]`).
- Tokens de color en `apps/web/src/index.css` (`@theme`): `ink`, `paper`, `cloud`, `mist`, `concrete`, `graphite`, `line`, `spark` (azul electrico, acento), `whatsapp`, `alert`, `ok`.
- Fondos "water" / "water-dark": utilidades de gradientes suaves con blobs (`.drift`). Son el envolvente visual del sitio (plan § 9, ajuste con feedback del cliente).
- Logos: `public/brand/phaway-negro.png` (fondos claros) y `phaway-blanco.png` (fondos oscuros).
- Datos editables en `apps/web/src/config.ts`: `CONTACT` (WhatsApp, horario), `STORE` (direccion Gamarra, embed del mapa), `SOCIAL` (IG `phaway_ropadeportiva`, FB `RopaPhaway`, TikTok `phaway_sport`), `SHIPPING_PARTNERS` (Shalom, Olva, Cruz del Sur).
- Mensaje de reserva: usar `buildWhatsAppReservationMessage` + `buildWhatsAppUrl` de `@phaway/shared` (incluye link al producto).
- Formulario admin de productos: la web comprime fotos a WEBP ~1800px antes de subir (`image-compressor.ts`), hasta 30 MB de entrada; el API mantiene limite de 5 MB como proteccion.
- Pedidos: `OrdersPage`, `NewOrderPage`, `OrderDetailPage` + helpers de estados/colores en `order-helpers.ts`. "Confirmar" descuenta stock y "Cancelar confirmado" lo devuelve (ver flujo de pedidos arriba).
- Guia de tallas: componente `SizeGuide` con `<dialog>` nativo. Imagen en `public/catalog/guia-tallas.webp`. Enlace en ficha de producto y footer.
- Categorias en el inicio: `CategoryTile` muestra fotos reales y rota entre modelos al hover (inspirado en win.com.pe). Grid responsive 2/3/4 columnas.
- Diseno visual: usar la skill `frontend-design`.
- Responsive: todo revisado en escritorio (1440) y Pixel 7 con Playwright screenshots. Mantener siempre breakpoints de Tailwind (`sm`/`md`/`lg`) y evitar anchos fijos.

## Que NO hacer

- No commitear `.env`, credenciales, `src/generated/`, `apps/api/uploads/*`, ni PDFs grandes (`apps/web/public/catalog/*.pdf` esta ignorado; en deploy va a R2).
- No poner logica de negocio en controllers ni queries Prisma en el frontend.
- No usar `number` para dinero. No usar `@prisma/client` directo.
- No subir imagenes pesadas al repo: la web del admin ya comprime en el navegador. Las fotos de productos viven en `apps/api/uploads/` (local) o R2 (prod).
- No agregar dependencias sin necesidad; pnpm 11 bloquea build scripts: si una dependencia nativa lo necesita, agregarla a `allowBuilds` en `pnpm-workspace.yaml` y justificar.
- No subir commits al repo sin confirmar con el usuario (hablamos de preferencia explicita: hacer `git commit` cada vez pero esperar su OK antes del `git push`).

## Estado del trabajo (actualizar al cerrar un commit grande)

- Fase 0 y Fase 1 del plan `PHAWAY_PLAN.md` ya avanzadas: monorepo, catalogo publico + admin, uploads, pedidos con descuento de stock.
- Categorias en seed: Camisetas, Shorts, Chalecos, **Buzos** (Fase 1), Medias, Balones, Guantes de arquero.
- Datos de demo en BD local: 10+ productos reales (5 camisetas 3D, 2 guantes, 3 buzos extraidos del PDF). Precios son estimados; el admin los ajusta.
- Tests E2E (Playwright): 8 verdes cubriendo home publico, flujo admin producto completo y flujo admin pedido con descuento de stock. CI de GitHub Actions (lint + build + types) en verde.
- Pendiente mencionado por el usuario: reunion con gerente (grabada) para recoger ideas sobre el flujo de ventas; luego iterar.
- Intro scroll-triggered (estilo hannahlab.com) hecha con **GSAP 3 + ScrollTrigger** en `apps/web/src/components/ScrollIntro.tsx`. Usa la pieza grafica azul `public/brand/pieza-grafica-1.webp` (desktop) y `-m.webp` (mobile ≤640px). Pinea la escena durante 80% de 1 viewport y hace fade-out del titular + veil blanco. Respeta `prefers-reduced-motion`. **Semantica**: el H1 del home sigue siendo "Pasión por el deporte." (Hero); el "PHAWAY" grande del intro es `<p>` decorativo.

## Checklist antes de crear una tabla nueva

1. ¿Pertenece a un modulo existente? Si no, crear el modulo primero.
2. `id String @id @default(cuid())`, `createdAt`, y `updatedAt` si se edita.
3. Indices en FKs y en campos de filtro frecuente.
4. `onDelete` explicito en relaciones.
5. `pnpm db:migrate --name <descripcion>` y commitear la migracion.
6. Actualizar el DTO en `packages/shared` si el frontend lo consume.
