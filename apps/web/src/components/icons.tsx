import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...p,
});

/** Iconos lineales, mismo peso de trazo, para mantener consistencia visual. */

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5Z" />
  </svg>
);

export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const IconStore = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 9 5 4h14l2 5" />
    <path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Z" />
    <path d="M3 9c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3" />
    <path d="M9 21v-5h6v5" />
  </svg>
);

export const IconMapPin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 22s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconTruck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

export const IconShield = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconSpark = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 3-1.6 5.2L5 10l5.4 1.8L12 17l1.6-5.2L19 10l-5.4-1.8L12 3Z" />
  </svg>
);

/* Redes sociales: estilo lineal (no copio los logos oficiales, solo el glifo reconocible). */
export const IconInstagram = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const IconFacebook = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 7h3V3h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V7Z" />
  </svg>
);

export const IconTiktok = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 3v10.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c.6 2.3 2.4 4 5 4.3" />
  </svg>
);

/* Iconos de agencias: no uso los logos reales (marca registrada). Glifos neutros + nombre. */
export const IconPackage = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9M8 5.25l8 4.5" />
  </svg>
);

export const IconBus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="12" rx="2" />
    <path d="M4 11h16M8 5V3m8 2V3" />
    <circle cx="8" cy="19" r="1.5" />
    <circle cx="16" cy="19" r="1.5" />
  </svg>
);
