import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { SizeGuide } from '@phaway/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateSizeGuideDto } from './dto/size-guide.dto';
import { SettingsService } from './settings.service';

/** Lectura publica de la guia de tallas (la ficha de producto la consume). */
@ApiTags('ajustes publicos')
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('size-guide')
  getSizeGuide(): Promise<SizeGuide> {
    return this.settings.getSizeGuide();
  }
}

/** Escritura de ajustes: solo el panel. */
@ApiTags('ajustes admin')
@UseGuards(JwtAuthGuard)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Put('size-guide')
  updateSizeGuide(@Body() dto: UpdateSizeGuideDto): Promise<SizeGuide> {
    return this.settings.setSizeGuide(dto.url);
  }
}
