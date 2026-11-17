import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Correo invalido' })
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(10, { message: 'La contrasena debe tener al menos 10 caracteres' })
  @MaxLength(200)
  newPassword!: string;
}
