import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AdminUserDto, PendingInvitationDto } from '@phaway/shared';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { BCRYPT_ROUNDS } from '../auth/auth.service';
import type { UserRole } from '../generated/prisma/client';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_TTL_DAYS = 7;
const INVITE_TTL_MS = INVITE_TTL_DAYS * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async list(): Promise<AdminUserDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
  }

  async listPendingInvitations(): Promise<PendingInvitationDto[]> {
    const now = new Date();
    const invites = await this.prisma.userInvitation.findMany({
      where: { consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      include: { invitedBy: { select: { id: true, name: true, email: true } } },
    });
    return invites.map((i) => ({
      id: i.id,
      email: i.email,
      name: i.name,
      role: i.role,
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
      invitedBy: i.invitedBy,
    }));
  }

  async invite(input: { email: string; name: string; role: UserRole; invitedById: string }): Promise<void> {
    const email = input.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese correo.');

    // Invalidar invitaciones anteriores al mismo correo.
    await this.prisma.userInvitation.updateMany({
      where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });

    const inviter = await this.prisma.user.findUnique({
      where: { id: input.invitedById },
      select: { name: true, email: true },
    });
    if (!inviter) throw new NotFoundException('Invitador no encontrado.');

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await this.prisma.userInvitation.create({
      data: {
        email,
        name: input.name.trim(),
        role: input.role,
        tokenHash: hashToken(token),
        expiresAt,
        invitedById: input.invitedById,
      },
    });

    await this.mailer.sendUserInvitation({
      to: email,
      invitedBy: inviter.name,
      invitedByEmail: inviter.email,
      role: input.role,
      token,
      expiresDays: INVITE_TTL_DAYS,
    });
  }

  async resendInvitation(invitationId: string): Promise<void> {
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { id: invitationId },
      include: { invitedBy: { select: { name: true, email: true } } },
    });
    if (!invitation || invitation.consumedAt) {
      throw new NotFoundException('Invitacion no encontrada.');
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await this.prisma.userInvitation.update({
      where: { id: invitationId },
      data: { tokenHash: hashToken(token), expiresAt },
    });
    await this.mailer.sendUserInvitation({
      to: invitation.email,
      invitedBy: invitation.invitedBy.name,
      invitedByEmail: invitation.invitedBy.email,
      role: invitation.role,
      token,
      expiresDays: INVITE_TTL_DAYS,
    });
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    const res = await this.prisma.userInvitation.updateMany({
      where: { id: invitationId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (res.count === 0) throw new NotFoundException('Invitacion no encontrada.');
  }

  async accept(token: string, password: string, name: string | undefined): Promise<void> {
    const tokenHash = hashToken(token);
    const invitation = await this.prisma.userInvitation.findUnique({ where: { tokenHash } });
    if (!invitation || invitation.consumedAt || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Este enlace de invitacion ya no es valido.');
    }
    const email = invitation.email;
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new ConflictException('Ya existe un usuario activo con ese correo.');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          email,
          name: (name?.trim() || invitation.name).slice(0, 80),
          role: invitation.role,
          passwordHash,
          isActive: true,
        },
      }),
      this.prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { consumedAt: new Date() },
      }),
    ]);
  }

  async setStatus(targetId: string, requesterId: string, isActive: boolean): Promise<AdminUserDto> {
    if (targetId === requesterId && !isActive) {
      throw new ForbiddenException('No podes suspenderte a vos mismo.');
    }
    const user = await this.prisma.user.update({
      where: { id: targetId },
      data: { isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    return { ...user, createdAt: user.createdAt.toISOString() };
  }

  async remove(targetId: string, requesterId: string): Promise<void> {
    if (targetId === requesterId) {
      throw new ForbiddenException('No podes eliminar tu propia cuenta.');
    }
    const existing = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!existing) throw new NotFoundException('Usuario no encontrado.');
    await this.prisma.user.delete({ where: { id: targetId } });
  }
}
