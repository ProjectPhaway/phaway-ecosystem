import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import {
  WHATSAPP_SALES_NUMBER,
  buildWhatsAppUrl,
} from '@phaway/shared';
import { PasswordChanged, type PasswordChangedProps } from './templates/PasswordChanged';
import { PasswordReset, type PasswordResetProps } from './templates/PasswordReset';
import { UserInvitation, type UserInvitationProps } from './templates/UserInvitation';

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Centraliza el envio de correos transaccionales via Resend.
 *
 * - Los controllers NO envian correos directo: siempre pasan por este servicio.
 * - Si `RESEND_API_KEY` no esta configurada, los correos se loguean en la
 *   consola en vez de enviarse. Util en dev y en pruebas automatizadas.
 * - Los errores de Resend se capturan y loguean, pero no revientan el request
 *   que disparo el envio (la logica de negocio ya se cumplio).
 */
@Injectable()
export class MailerService {
  private readonly log = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly webOrigin: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('RESEND_API_KEY');
    this.resend = key ? new Resend(key) : null;
    this.from = this.config.get<string>(
      'RESEND_FROM',
      'Phaway <onboarding@resend.dev>',
    );
    this.webOrigin = this.config
      .get<string>('WEB_ORIGIN', 'http://localhost:5173')
      .split(',')[0]
      .replace(/\/$/, '');

    if (!key) {
      this.log.warn(
        'RESEND_API_KEY no configurada. Los correos se van a loguear en consola en vez de enviarse.',
      );
    }
  }

  /** URL absoluta al front, util para links en templates. */
  url(path: string): string {
    return `${this.webOrigin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async sendPasswordChanged(args: { to: string; name: string }): Promise<void> {
    const changedAt = new Date().toLocaleString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const supportUrl = buildWhatsAppUrl(
      `Hola, soy ${args.name}. Alguien cambio la contrasena de mi cuenta en el panel de Phaway y no fui yo.`,
      WHATSAPP_SALES_NUMBER,
    );
    const html = await render(
      PasswordChanged({ name: args.name, changedAt, supportUrl } satisfies PasswordChangedProps),
    );
    await this.send({ to: args.to, subject: 'Tu contrasena fue actualizada', html });
  }

  async sendPasswordReset(args: {
    to: string;
    name: string;
    token: string;
    expiresMinutes: number;
  }): Promise<void> {
    const resetUrl = this.url(`/admin/reset-password?token=${encodeURIComponent(args.token)}`);
    const html = await render(
      PasswordReset({
        name: args.name,
        resetUrl,
        expiresMinutes: args.expiresMinutes,
      } satisfies PasswordResetProps),
    );
    await this.send({
      to: args.to,
      subject: 'Recuperar tu contrasena del panel Phaway',
      html,
    });
  }

  async sendUserInvitation(args: {
    to: string;
    invitedBy: string;
    invitedByEmail: string;
    role: UserInvitationProps['role'];
    token: string;
    expiresDays: number;
  }): Promise<void> {
    const inviteUrl = this.url(`/admin/activar?token=${encodeURIComponent(args.token)}`);
    const html = await render(
      UserInvitation({
        invitedBy: args.invitedBy,
        invitedByEmail: args.invitedByEmail,
        role: args.role,
        inviteUrl,
        expiresDays: args.expiresDays,
      } satisfies UserInvitationProps),
    );
    await this.send({
      to: args.to,
      subject: `Te invitaron al panel de Phaway`,
      html,
    });
  }

  /** Util para verificar la integracion con Resend desde Swagger. */
  async sendSmokeTest(to: string): Promise<void> {
    const html = `<p>Hola! Este es un correo de prueba enviado desde el modulo mailer de Phaway en ${new Date().toISOString()}.</p>`;
    await this.send({ to, subject: 'Prueba de correo · Phaway', html });
  }

  private async send({ to, subject, html }: SendArgs): Promise<void> {
    if (!this.resend) {
      this.log.log(
        `[DEV MAIL] to=${to} from=${this.from} subject="${subject}" html.length=${html.length}`,
      );
      return;
    }
    try {
      const res = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (res.error) {
        this.log.error(`Resend respondio error enviando a ${to}: ${res.error.message}`);
      } else {
        this.log.log(`Correo enviado a ${to} (id=${res.data?.id ?? 'n/a'})`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.error(`Fallo el envio a ${to}: ${msg}`);
    }
  }
}
