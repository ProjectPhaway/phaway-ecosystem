import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  UploadsService,
} from './uploads.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** multipart/form-data con el campo `file`. Devuelve { url }. */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES[file.mimetype]) cb(null, true);
        else
          cb(new BadRequestException('Solo imagenes JPG, PNG o WEBP'), false);
      },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo (campo "file")');
    return { url: await this.uploads.saveImage(file) };
  }
}
