import { IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateSizeGuideDto {
  /**
   * URL publica de la imagen (devuelta previamente por /admin/uploads).
   * Enviar `null` para quitar la guia actual.
   */
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  @MaxLength(1024)
  url!: string | null;
}
