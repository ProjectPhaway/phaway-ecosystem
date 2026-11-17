import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(10, { message: 'La contrasena debe tener al menos 10 caracteres' })
  @MaxLength(200)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nombre muy corto' })
  @MaxLength(80)
  name?: string;
}
