import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Carpeta local de imagenes (desarrollo). Servida en /uploads por main.ts. */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

/**
 * Guarda imagenes y devuelve su URL publica.
 * Fase 1 local: disco. Al desplegar se agrega el driver Cloudflare R2 (R2_* en .env)
 * sin cambiar el contrato `saveImage(file) -> url`.
 */
@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  async saveImage(file: Express.Multer.File): Promise<string> {
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!ext || !this.hasImageSignature(file.buffer, ext)) {
      throw new BadRequestException('El archivo no es una imagen valida');
    }
    const name = `${randomUUID()}.${ext}`;
    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(join(UPLOADS_DIR, name), file.buffer);

    const base = this.config.get<string>(
      'PUBLIC_API_URL',
      `http://localhost:${this.config.get('PORT', 3000)}`,
    );
    return `${base.replace(/\/$/, '')}/uploads/${name}`;
  }

  /** Verifica los "magic bytes": no confiar solo en el mimetype que manda el navegador. */
  private hasImageSignature(buf: Buffer, ext: string): boolean {
    if (buf.length < 12) return false;
    if (ext === 'jpg')
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (ext === 'png')
      return buf
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (ext === 'webp')
      return (
        buf.toString('ascii', 0, 4) === 'RIFF' &&
        buf.toString('ascii', 8, 12) === 'WEBP'
      );
    return false;
  }
}
