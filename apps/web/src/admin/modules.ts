import type { UserRole } from '@phaway/shared';
import {
  ClipboardList,
  Home,
  Layers,
  type LucideIcon,
  Package,
  PlusCircle,
  Percent,
  Ruler,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react';

/**
 * Catalogo de modulos del panel.
 *
 * Fuente unica de verdad para el sidebar y para los filtros por rol.
 * Para agregar un modulo nuevo: agregar su entry aqui y su ruta en router.tsx.
 */

export interface ModuleItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: readonly UserRole[];
  /** Mensaje opcional para pantallas todavia no construidas. */
  stubNote?: string;
}

export interface ModuleCategory {
  id: string;
  title: string;
  items: ModuleItem[];
}

const ALL: readonly UserRole[] = ['admin', 'marketing', 'vendedor', 'taller'] as const;
const ADMIN_ONLY: readonly UserRole[] = ['admin'] as const;
const CATALOG: readonly UserRole[] = ['admin', 'marketing'] as const;
const SALES: readonly UserRole[] = ['admin', 'marketing', 'vendedor'] as const;
const COUPONS: readonly UserRole[] = ['admin', 'marketing'] as const;

export const moduleTree: ModuleCategory[] = [
  {
    id: 'inicio',
    title: 'Inicio',
    items: [
      { label: 'Dashboard', path: '/admin/inicio', icon: Home, roles: SALES },
    ],
  },
  {
    id: 'catalogo',
    title: 'Catalogo',
    items: [
      { label: 'Productos', path: '/admin/productos', icon: Package, roles: CATALOG },
      {
        label: 'Categorias',
        path: '/admin/categorias',
        icon: Layers,
        roles: CATALOG,
        stubNote: 'Edicion de categorias. Modulo planificado para la Fase 1 extendida.',
      },
      {
        label: 'Guia de tallas',
        path: '/admin/guia-tallas',
        icon: Ruler,
        roles: CATALOG,
      },
    ],
  },
  {
    id: 'ventas',
    title: 'Ventas',
    items: [
      { label: 'Ventas', path: '/admin/ventas', icon: ClipboardList, roles: SALES },
      { label: 'Nuevo pedido', path: '/admin/ventas/nuevo', icon: PlusCircle, roles: SALES },
      { label: 'Cupones', path: '/admin/cupones', icon: Percent, roles: COUPONS },
    ],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    items: [
      {
        label: 'Clientes',
        path: '/admin/clientes',
        icon: Users,
        roles: SALES,
      },
    ],
  },
  {
    id: 'administracion',
    title: 'Administracion',
    items: [
      {
        label: 'Usuarios del panel',
        path: '/admin/usuarios',
        icon: Shield,
        roles: ADMIN_ONLY,
        stubNote: 'Invitar nuevos usuarios, cambiar roles y suspender accesos.',
      },
      {
        label: 'Mi perfil',
        path: '/admin/perfil',
        icon: UserCircle,
        roles: ALL,
        stubNote: 'Datos de la cuenta, cambio de contrasena y foto de perfil.',
      },
    ],
  },
];

/** Filtra el arbol dejando solo las categorias/items permitidos para el rol dado. */
export function filterTreeByRole(role: UserRole): ModuleCategory[] {
  return moduleTree
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((cat) => cat.items.length > 0);
}
