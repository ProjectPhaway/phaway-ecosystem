import { Button, Section, Text } from '@react-email/components';
import { BaseLayout, emailStyles } from './BaseLayout';

export interface PasswordResetProps {
  name: string;
  resetUrl: string;
  expiresMinutes: number;
}

export function PasswordReset({ name, resetUrl, expiresMinutes }: PasswordResetProps) {
  const firstName = name.split(' ')[0] || name;
  return (
    <BaseLayout preview="Elige una contraseña nueva para tu cuenta del panel de Phaway.">
      <Text style={emailStyles.heading}>Recuperar tu contraseña</Text>
      <Text style={emailStyles.paragraph}>
        Hola {firstName}, recibimos un pedido para restablecer la contraseña de tu cuenta en el
        panel de Phaway. Hacé clic en el botón para elegir una nueva.
      </Text>
      <Section style={{ textAlign: 'center' }}>
        <Button href={resetUrl} style={emailStyles.button}>
          Elegir nueva contraseña
        </Button>
      </Section>
      <Text style={emailStyles.dim}>
        El enlace vence en <strong>{expiresMinutes} minutos</strong>. Si no pediste el cambio,
        podés ignorar este correo: tu contraseña actual sigue funcionando.
      </Text>
      <Text style={emailStyles.dim}>Si el botón no funciona, copia y pega esta dirección:</Text>
      <Text style={emailStyles.code}>{resetUrl}</Text>
    </BaseLayout>
  );
}
