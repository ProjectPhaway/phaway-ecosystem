/**
 * Tipos y constantes compartidos entre @phaway/api y @phaway/web.
 * Solo tipos y utilidades puras: nada de dependencias de Node ni del navegador.
 */

export const WHATSAPP_SALES_NUMBER = '51965769340';

export const ORDER_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItemInput {
  variantId: string;
  quantity: number;
}

export interface OrderInput {
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: OrderItemInput[];
  paidAmount?: string;
  confirm?: boolean;
}

export interface OrderItemDto {
  id: string;
  quantity: number;
  unitPrice: string;
  snapshotName: string;
  variant: {
    id: string;
    size: string;
    color: string;
    sku: string;
    product: { id: string; name: string; slug: string; mainImageUrl: string };
  };
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  totalAmount: string;
  paidAmount: string;
  notes: string | null;
  items: OrderItemDto[];
  createdAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
}
export type UserRole = 'admin' | 'marketing';

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
}

export interface ProductVariantDto {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceOverride: string | null;
}

export interface ProductDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  basePrice: string;
  isOnSale: boolean;
  isActive: boolean;
  mainImageUrl: string;
  galleryImages: string[];
  category: CategoryDto;
  variants: ProductVariantDto[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

/** Payload de creacion/edicion de producto (admin). */
export interface ProductInput {
  name: string;
  description?: string;
  basePrice: string;
  categoryId: string;
  isOnSale: boolean;
  isActive: boolean;
  mainImageUrl: string;
  galleryImages: string[];
  variants: {
    id?: string;
    size: string;
    color: string;
    stock: number;
    priceOverride?: string | null;
  }[];
}

export interface WhatsAppReservation {
  productName: string;
  category: string;
  size: string;
  color: string;
  price: string;
  url: string;
}

/** Mensaje prellenado de "Reservar por WhatsApp" (plan, seccion 11). */
export function buildWhatsAppReservationMessage(r: WhatsAppReservation): string {
  return [
    'Hola Phaway, quiero reservar este producto:',
    '',
    `Producto: ${r.productName}`,
    `Categoria: ${r.category}`,
    `Talla: ${r.size}`,
    `Color: ${r.color}`,
    `Precio: S/ ${r.price}`,
    `Link: ${r.url}`,
    '',
    'Me confirman disponibilidad y los pasos para la compra. Gracias.',
  ].join('\n');
}

export function buildWhatsAppUrl(message: string, phone = WHATSAPP_SALES_NUMBER): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
