/**
 * Reduce fotos en el navegador antes de subirlas: las fotos de celular/camara (10-30 MB)
 * quedan en ~300-700 KB sin perdida visible. Asi el API mantiene un limite bajo (5 MB)
 * y la tienda carga rapido en datos moviles.
 */
export class ImageCompressor {
  /** Lado mayor maximo en px: suficiente para la ficha de producto en pantallas retina. */
  static readonly MAX_SIDE = 2000;
  /** Limite de lo que acepta el selector (antes de comprimir). */
  static readonly MAX_INPUT_BYTES = 30 * 1024 * 1024;
  static readonly ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

  private readonly quality: number;

  constructor(quality = 0.85) {
    this.quality = quality;
  }

  async compress(file: File): Promise<File> {
    const bitmap = await this.decode(file);
    try {
      const scale = Math.min(1, ImageCompressor.MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('El navegador no permite procesar imágenes');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, width, height);

      const blob = await this.encode(canvas);
      // Si la original ya era pequena y no hubo que reducirla, no empeorarla.
      if (scale === 1 && blob.size >= file.size && ImageCompressor.ACCEPT.includes(file.type)) {
        return file;
      }
      const name = file.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/webp' ? '.webp' : '.jpg');
      return new File([blob], name, { type: blob.type });
    } finally {
      bitmap.close();
    }
  }

  private async decode(file: File): Promise<ImageBitmap> {
    try {
      // Respeta la orientacion EXIF (fotos de celular giradas).
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      throw new Error('no se pudo leer la imagen (si es HEIC de iPhone, cámbiala a JPG)');
    }
  }

  private encode(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (webp) => {
          if (webp && webp.type === 'image/webp') return resolve(webp);
          // Navegadores sin WEBP: JPEG.
          canvas.toBlob((jpg) => (jpg ? resolve(jpg) : reject(new Error('no se pudo comprimir'))), 'image/jpeg', this.quality);
        },
        'image/webp',
        this.quality,
      );
    });
  }
}

export const imageCompressor = new ImageCompressor();
