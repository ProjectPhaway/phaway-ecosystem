import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../auth/auth.service';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  private readonly log = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /**
   * Cambia la contrasena del usuario autenticado.
   * - Valida la actual contra el hash. Mensaje generico si falla (no revela).
   * - Rechaza si la nueva es igual a la actual.
   * - Rehashea con `bcrypt` 12 rondas (misma politica que login).
   * - Dispara correo de confirmacion asincrono (no bloquea el request).
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (currentPassword === newPassword) {
      throw new BadRequestException('La nueva contrasena debe ser distinta a la actual.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) throw new UnauthorizedException();

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw new BadRequestException('La contrasena actual no coincide.');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Correo de confirmacion: no bloquea el request ni rompe si Resend falla.
    void this.mailer
      .sendPasswordChanged({ to: user.email, name: user.name })
      .catch((e) =>
        this.log.error(`No se pudo notificar cambio de contrasena a ${user.email}: ${e}`),
      );
  }
}
