import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import type { UserRole } from '../../generated/prisma/client';

export class InviteUserDto {
  @IsEmail({}, { message: 'Correo invalido' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(2, { message: 'Nombre muy corto' })
  @MaxLength(80)
  name!: string;

  @IsIn(['admin', 'marketing', 'vendedor', 'taller'], { message: 'Rol invalido' })
  role!: UserRole;
}

export class SetUserRoleDto {
  @IsIn(['admin', 'marketing', 'vendedor', 'taller'], { message: 'Rol invalido' })
  role!: UserRole;
}
