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

/**
 * Tienda fisica. El Google Maps embebido usa el link de "Compartir -> Insertar un mapa"
 * (src del iframe). Reemplazar por el oficial de Phaway cuando lo tengamos.
 */
export const STORE = {
  name: 'Tienda Phaway',
  address: 'Galería Las Mercedes, Tienda 102H',
  reference: 'Gamarra - La Victoria, Lima',
  mapEmbedUrl:
    'https://www.google.com/maps?q=Galeria+Las+Mercedes+Gamarra+La+Victoria+Lima&output=embed',
  mapLink: 'https://www.google.com/maps/search/Galeria+Las+Mercedes+Gamarra+La+Victoria+Lima',
} as const;

/** Redes sociales oficiales de Phaway. */
export const SOCIAL = {
  instagram:
    import.meta.env.VITE_SOCIAL_IG ?? 'https://www.instagram.com/phaway_ropadeportiva',
  facebook:
    import.meta.env.VITE_SOCIAL_FB ?? 'https://www.facebook.com/RopaPhaway/',
  tiktok:
    import.meta.env.VITE_SOCIAL_TT ?? 'https://www.tiktok.com/@phaway_sport',
} as const;

/** Agencias con las que se despacha. */
export const SHIPPING_PARTNERS = [
  { name: 'Shalom', note: 'Agencias en todo el país' },
  { name: 'Olva Courier', note: 'Entrega a domicilio' },
  { name: 'Cruz del Sur Cargo', note: 'Rutas largas y provincias' },
] as const;
