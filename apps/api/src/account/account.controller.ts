import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/jwt-payload';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, UploadsService } from '../uploads/uploads.service';
import { AccountService } from './account.service';
import { ChangePasswordDto } from './dto/change-password.dto';

/** Endpoints del propio usuario autenticado. */
@ApiTags('account')
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(
    private readonly account: AccountService,
    private readonly uploads: UploadsService,
  ) {}

  @Post('change-password')
  @HttpCode(204)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto): Promise<void> {
    const user = req.user as AuthUser;
    await this.account.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('profile-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES[file.mimetype]) cb(null, true);
        else cb(new BadRequestException('Solo imagenes JPG, PNG o WEBP'), false);
      },
    }),
  )
  async updateProfilePhoto(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    if (!file) throw new BadRequestException('Selecciona una imagen.');
    const user = req.user as AuthUser;
    const avatarUrl = await this.uploads.saveImage(file);
    await this.account.setProfilePhoto(user.id, avatarUrl);
    return { avatarUrl };
  }

  @Delete('profile-photo')
  @HttpCode(204)
  async removeProfilePhoto(@Req() req: Request): Promise<void> {
    const user = req.user as AuthUser;
    await this.account.setProfilePhoto(user.id, null);
  }
}
