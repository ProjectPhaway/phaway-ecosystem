import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protege endpoints del panel admin. Fase 1: admin y marketing tienen el mismo acceso. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
