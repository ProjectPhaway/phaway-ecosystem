import type { UserRole } from '../generated/prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/** Lo que queda en `req.user` tras validar el token. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
