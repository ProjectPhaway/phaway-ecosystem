import type { UserRole } from '@phaway/shared';
import {
  ClipboardList,
  Home,
  Layers,
  type LucideIcon,
  Package,
  PlusCircle,
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

const ALL: readonly UserRole[] = ['admin', 'marketing'] as const;
const ADMIN_ONLY: readonly UserRole[] = ['admin'] as const;

export const moduleTree: ModuleCategory[] = [
  {
    id: 'inicio',
    title: 'Inicio',
    items: [
      { label: 'Dashboard', path: '/admin/inicio', icon: Home, roles: ALL },
    ],
  },
  {
    id: 'catalogo',
    title: 'Catalogo',
    items: [
      { label: 'Productos', path: '/admin/productos', icon: Package, roles: ALL },
      {
        label: 'Categorias',
        path: '/admin/categorias',
        icon: Layers,
        roles: ALL,
        stubNote: 'Edicion de categorias. Modulo planificado para la Fase 1 extendida.',
      },
      {
        label: 'Guia de tallas',
        path: '/admin/guia-tallas',
        icon: Ruler,
        roles: ALL,
      },
    ],
  },
  {
    id: 'ventas',
    title: 'Ventas',
    items: [
      { label: 'Pedidos', path: '/admin/ventas', icon: ClipboardList, roles: ALL },
      { label: 'Nuevo pedido', path: '/admin/ventas/nuevo', icon: PlusCircle, roles: ALL },
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
        roles: ALL,
        stubNote: 'Ficha de cliente con historial de compras y total gastado. Fase 2.',
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
