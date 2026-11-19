import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { SendSmokeTestDto } from './dto/smoke-test.dto';
import { MailerService } from './mailer.service';

/**
 * Endpoint de diagnostico para verificar que Resend esta bien configurado.
 * No se usa desde la UI del panel: existe para probar desde Swagger.
 */
@ApiTags('mailer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/mailer')
export class MailerController {
  constructor(private readonly mailer: MailerService) {}

  @Post('smoke-test')
  @HttpCode(202)
  async smokeTest(@Body() dto: SendSmokeTestDto): Promise<{ queued: true; to: string }> {
    await this.mailer.sendSmokeTest(dto.to);
    return { queued: true, to: dto.to };
  }
}
