import { WHATSAPP_SALES_NUMBER } from '@phaway/shared';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? window.location.origin;

/** Datos de contacto visibles en la web. */
export const CONTACT = {
  whatsappDisplay: '+51 965 769 340',
  whatsappNumber: WHATSAPP_SALES_NUMBER,
  facebookName: 'Phaway - Ropa Deportiva',
  hours: 'Lunes a sábado, 9:00 a 19:00',
} as const;
