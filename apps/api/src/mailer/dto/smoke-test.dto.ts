import { IsEmail, MaxLength } from 'class-validator';

export class SendSmokeTestDto {
  @IsEmail({}, { message: 'Correo invalido' })
  @MaxLength(254)
  to!: string;
}
