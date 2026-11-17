import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SizeGuide } from '@phaway/shared';
import { UPLOADS_DIR } from '../uploads/uploads.service';

const SIZE_GUIDE_FILE = join(UPLOADS_DIR, 'size-guide.json');
const EMPTY: SizeGuide = { url: null, updatedAt: null };

/**
 * Ajustes globales de la tienda. Hoy guarda un unico valor: la guia de tallas.
 * Persistencia simple en JSON sobre disco para evitar una migracion de Prisma
 * mientras sea el unico setting. Cuando aparezcan mas (p.ej. direccion de
 * recojo, numero de WhatsApp, umbrales), se migra a tabla `Setting`.
 */
@Injectable()
export class SettingsService {
  async getSizeGuide(): Promise<SizeGuide> {
    try {
      const raw = await readFile(SIZE_GUIDE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<SizeGuide>;
      return {
        url: typeof parsed.url === 'string' ? parsed.url : null,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
      };
    } catch {
      return EMPTY;
    }
  }

  async setSizeGuide(url: string | null): Promise<SizeGuide> {
    const next: SizeGuide = { url: url || null, updatedAt: new Date().toISOString() };
    await mkdir(dirname(SIZE_GUIDE_FILE), { recursive: true });
    await writeFile(SIZE_GUIDE_FILE, JSON.stringify(next, null, 2), 'utf8');
    return next;
  }
}
