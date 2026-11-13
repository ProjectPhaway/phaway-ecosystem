/**
 * Seed: categorias + usuarios del panel (admin y marketing).
 * Ejecutar: pnpm db:seed (desde la raiz). Es idempotente.
 *
 * Las credenciales salen de apps/api/.env (ADMIN_EMAIL/ADMIN_PASSWORD, MARKETING_EMAIL/MARKETING_PASSWORD).
 * La contrasena solo se fija al CREAR el usuario; re-ejecutar el seed no la sobrescribe.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const CATEGORIES = [
  { slug: 'camisetas', name: 'Camisetas', sortOrder: 1 },
  { slug: 'shorts', name: 'Shorts', sortOrder: 2 },
  { slug: 'chalecos', name: 'Chalecos', sortOrder: 3 },
  { slug: 'buzos', name: 'Buzos', sortOrder: 4 },
  { slug: 'medias', name: 'Medias', sortOrder: 5 },
  { slug: 'balones', name: 'Balones', sortOrder: 6 },
  { slug: 'guantes-arquero', name: 'Guantes de arquero', sortOrder: 7 },
];

const USERS: { envPrefix: string; role: UserRole; name: string }[] = [
  { envPrefix: 'ADMIN', role: UserRole.admin, name: 'Administrador' },
  { envPrefix: 'MARKETING', role: UserRole.marketing, name: 'Marketing' },
];

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  console.log(`Seed: ${CATEGORIES.length} categorias`);

  for (const u of USERS) {
    const email = process.env[`${u.envPrefix}_EMAIL`]?.toLowerCase().trim();
    const password = process.env[`${u.envPrefix}_PASSWORD`];
    if (!email || !password) {
      console.warn(`Seed: falta ${u.envPrefix}_EMAIL / ${u.envPrefix}_PASSWORD en .env, se omite`);
      continue;
    }
    if (password.length < 10) throw new Error(`${u.envPrefix}_PASSWORD debe tener al menos 10 caracteres`);
    await prisma.user.upsert({
      where: { email },
      update: { role: u.role, isActive: true },
      create: {
        email,
        name: u.name,
        role: u.role,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    console.log(`Seed: usuario ${u.role} -> ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
