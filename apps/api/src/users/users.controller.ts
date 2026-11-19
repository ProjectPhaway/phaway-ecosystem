import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AdminUserDto, PendingInvitationDto } from '@phaway/shared';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/jwt-payload';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InviteUserDto, SetUserRoleDto } from './dto/invite-user.dto';
import { UsersService } from './users.service';

/** Gestion de usuarios del panel. Solo rol `admin`. */
@ApiTags('usuarios admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(): Promise<AdminUserDto[]> {
    return this.users.list();
  }

  @Get('invitations')
  listInvitations(): Promise<PendingInvitationDto[]> {
    return this.users.listPendingInvitations();
  }

  @Post('invitations')
  @HttpCode(202)
  async invite(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: InviteUserDto,
  ): Promise<{ queued: true }> {
    await this.users.invite({
      email: dto.email,
      name: dto.name,
      role: dto.role,
      invitedById: req.user.id,
    });
    return { queued: true };
  }

  @Post('invitations/:id/resend')
  @HttpCode(202)
  async resend(@Param('id') id: string): Promise<{ queued: true }> {
    await this.users.resendInvitation(id);
    return { queued: true };
  }

  @Delete('invitations/:id')
  @HttpCode(204)
  cancelInvitation(@Param('id') id: string): Promise<void> {
    return this.users.cancelInvitation(id);
  }

  @Patch(':id/status')
  setStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: { isActive: boolean },
  ): Promise<AdminUserDto> {
    return this.users.setStatus(id, req.user.id, !!dto.isActive);
  }

  @Patch(':id/role')
  setRole(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: SetUserRoleDto,
  ): Promise<AdminUserDto> {
    return this.users.setRole(id, req.user.id, dto.role);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: Request & { user: AuthUser }, @Param('id') id: string): Promise<void> {
    return this.users.remove(id, req.user.id);
  }
}

/** Publico: aceptar una invitacion con el token del correo. */
@ApiTags('usuarios publico')
@Controller('auth')
export class UsersPublicController {
  constructor(private readonly users: UsersService) {}

  @Post('accept-invitation')
  @HttpCode(204)
  async accept(@Body() dto: AcceptInvitationDto): Promise<void> {
    await this.users.accept(dto.token, dto.password, dto.name);
  }
}
