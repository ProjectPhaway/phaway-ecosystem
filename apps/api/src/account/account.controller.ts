import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/jwt-payload';
import { AccountService } from './account.service';
import { ChangePasswordDto } from './dto/change-password.dto';

/** Endpoints del propio usuario autenticado. */
@ApiTags('account')
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Post('change-password')
  @HttpCode(204)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto): Promise<void> {
    const user = req.user as AuthUser;
    await this.account.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}
