import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '../generated/prisma/client';
import type { AuthUser } from './jwt-payload';

export const ROLES_META_KEY = 'phaway:roles';

/** Lista blanca de roles permitidos para el handler/controller. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_META_KEY, roles);

/**
 * Debe usarse DESPUES de `JwtAuthGuard`. Lee los roles permitidos por metadata.
 * Si no hay metadata, pasa libre (el JwtAuthGuard ya autentico).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_META_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!allowed?.length) return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = req.user as AuthUser | undefined;
    if (!user || !allowed.includes(user.role)) {
      throw new ForbiddenException('No tenes permisos para esta accion.');
    }
    return true;
  }
}
