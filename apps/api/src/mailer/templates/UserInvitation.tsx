import { Button, Section, Text } from '@react-email/components';
import { BaseLayout, emailStyles } from './BaseLayout';

export interface UserInvitationProps {
  invitedBy: string; // nombre del admin que invita
  invitedByEmail: string;
  role: 'admin' | 'marketing' | 'vendedor' | 'taller';
  inviteUrl: string;
  expiresDays: number;
}

const roleLabel: Record<UserInvitationProps['role'], string> = {
  admin: 'Administrador',
  marketing: 'Marketing',
  vendedor: 'Vendedor',
  taller: 'Taller',
};

export function UserInvitation({
  invitedBy,
  invitedByEmail,
  role,
  inviteUrl,
  expiresDays,
}: UserInvitationProps) {
  return (
    <BaseLayout preview="Te invitaron al panel de Phaway.">
      <Text style={emailStyles.heading}>Bienvenido al panel de Phaway</Text>
      <Text style={emailStyles.paragraph}>
        <strong>{invitedBy}</strong> ({invitedByEmail}) te invitó a sumarte al panel de
        administración de Phaway con el rol de <strong>{roleLabel[role]}</strong>.
      </Text>
      <Text style={emailStyles.paragraph}>
        Hacé clic en el botón para crear tu contraseña y activar tu cuenta.
      </Text>
      <Section style={{ textAlign: 'center' }}>
        <Button href={inviteUrl} style={emailStyles.button}>
          Activar mi cuenta
        </Button>
      </Section>
      <Text style={emailStyles.dim}>
        La invitación vence en <strong>{expiresDays} días</strong>. Si no la aceptás antes, pedile
        a {invitedBy} que te envíe una nueva.
      </Text>
      <Text style={emailStyles.dim}>Si el botón no funciona, copia y pega esta dirección:</Text>
      <Text style={emailStyles.code}>{inviteUrl}</Text>
    </BaseLayout>
  );
}
