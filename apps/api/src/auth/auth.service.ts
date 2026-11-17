import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './jwt-payload';

export const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const RESET_TOKEN_TTL_MIN = RESET_TOKEN_TTL_MS / 60_000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    // Mismo mensaje para usuario inexistente o clave incorrecta (no revelar cuentas).
    const ok =
      user?.isActive && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !ok) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (!user?.isActive) throw new UnauthorizedException();
    return user;
  }

  /**
   * Flujo "olvide mi contrasena".
   * - Si el correo existe, invalida tokens previos y genera uno nuevo de 1h.
   * - Si no existe, responde igual (no revelar cuentas).
   * - El token plano SOLO viaja al correo. En BD guardamos `sha256(token)`.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user?.isActive) {
      this.log.log(`forgot-password: email no existe o inactivo, se ignora silencioso: ${normalized}`);
      return;
    }

    // Invalidar tokens vigentes (solo puede haber uno activo a la vez).
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
    });

    await this.mailer.sendPasswordReset({
      to: user.email,
      name: user.name,
      token,
      expiresMinutes: RESET_TOKEN_TTL_MIN,
    });
  }

  /** Aplica la nueva contrasena consumiendo el token. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) {
      throw new BadRequestException('Este enlace ya no es valido. Vuelve a pedir uno nuevo.');
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidar cualquier otro token pendiente del mismo usuario.
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    void this.mailer
      .sendPasswordChanged({ to: record.user.email, name: record.user.name })
      .catch((e) =>
        this.log.error(`No se pudo notificar reset de contrasena a ${record.user.email}: ${e}`),
      );
  }
}
