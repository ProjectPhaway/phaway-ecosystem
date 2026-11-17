import { Button, Section, Text } from '@react-email/components';
import { BaseLayout, emailStyles } from './BaseLayout';

export interface PasswordChangedProps {
  name: string;
  changedAt: string; // texto legible, ej: "15 de noviembre, 2026 a las 19:34"
  supportUrl: string; // WhatsApp o enlace para reportar si no fue el usuario
}

export function PasswordChanged({ name, changedAt, supportUrl }: PasswordChangedProps) {
  const firstName = name.split(' ')[0] || name;
  return (
    <BaseLayout preview="Tu contraseña del panel de Phaway fue actualizada.">
      <Text style={emailStyles.heading}>Tu contraseña fue actualizada</Text>
      <Text style={emailStyles.paragraph}>
        Hola {firstName}, confirmamos que la contraseña de tu cuenta en el panel de Phaway se cambió
        el <strong>{changedAt}</strong>.
      </Text>
      <Text style={emailStyles.paragraph}>
        Si fuiste tú, no necesitas hacer nada. Si no reconoces este cambio, contactá al
        administrador del panel <strong>ahora mismo</strong>.
      </Text>
      <Section style={{ textAlign: 'center' }}>
        <Button href={supportUrl} style={emailStyles.button}>
          Reportar actividad sospechosa
        </Button>
      </Section>
      <Text style={emailStyles.dim}>
        Por seguridad, nunca compartas tu contraseña con nadie, incluso si dice ser del equipo de
        Phaway.
      </Text>
    </BaseLayout>
  );
}
