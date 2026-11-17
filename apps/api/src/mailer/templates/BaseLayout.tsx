import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

interface BaseLayoutProps {
  preview: string;
  children: ReactNode;
}

const styles = {
  body: {
    backgroundColor: '#f3f6fb',
    margin: 0,
    padding: '32px 16px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#0a0a0f',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    background: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #d4dae4',
  },
  header: {
    padding: '28px 32px 16px',
  },
  brand: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    fontStyle: 'italic' as const,
    color: '#0a0a0f',
  },
  content: {
    padding: '0 32px 24px',
    fontSize: '15px',
    lineHeight: '1.55',
    color: '#0a0a0f',
  },
  footer: {
    padding: '16px 32px 28px',
    fontSize: '12px',
    color: '#4e5663',
    textAlign: 'center' as const,
  },
};

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brand}>PHAWAY</Text>
          </Section>
          <Section style={styles.content}>{children}</Section>
          <Hr style={{ borderColor: '#e6ecf5', margin: 0 }} />
          <Section style={styles.footer}>
            <Text style={{ margin: '0 0 6px' }}>Galería Las Mercedes, Tienda 102H · Gamarra, La Victoria, Lima.</Text>
            <Text style={{ margin: 0 }}>Este correo se envió desde una dirección no monitoreada.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  paragraph: { margin: '0 0 12px', fontSize: '15px', lineHeight: '1.55' },
  heading: {
    margin: '0 0 12px',
    fontSize: '22px',
    fontWeight: 700,
    color: '#0a0a0f',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#0a0a0f',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 700,
    padding: '12px 22px',
    borderRadius: '8px',
    margin: '8px 0 20px',
  },
  dim: { color: '#4e5663', fontSize: '13px', lineHeight: '1.55', margin: '0 0 8px' },
  code: {
    display: 'inline-block',
    background: '#f3f6fb',
    border: '1px solid #e6ecf5',
    borderRadius: '6px',
    padding: '6px 10px',
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
    fontSize: '13px',
    color: '#0a0a0f',
    wordBreak: 'break-all' as const,
  },
};
