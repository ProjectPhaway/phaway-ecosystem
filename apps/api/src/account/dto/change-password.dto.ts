import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Escribe tu contrasena actual' })
  @MaxLength(200)
  currentPassword!: string;

  @IsString()
  @MinLength(10, { message: 'La nueva contrasena debe tener al menos 10 caracteres' })
  @MaxLength(200)
  newPassword!: string;
}
