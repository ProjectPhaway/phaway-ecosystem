import type { OrderInput, OrderStatus, ProductInput } from '@phaway/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { api, type ProductFilters } from './api-client';
import { authSession } from './auth-session';

/** Claves de cache centralizadas para invalidar de forma consistente. */
export const queryKeys = {
  categories: ['categories'] as const,
  products: (f: ProductFilters) => ['products', f] as const,
  product: (slug: string) => ['product', slug] as const,
  adminProducts: ['admin', 'products'] as const,
  adminProduct: (id: string) => ['admin', 'product', id] as const,
  adminOrders: (status?: OrderStatus) => ['admin', 'orders', status ?? 'all'] as const,
};

export function useSession() {
  return useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.getCategories(),
    staleTime: 10 * 60_000,
  });
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => api.getProducts(filters),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => api.getProduct(slug),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: () => api.adminListProducts(),
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminProduct(id ?? ''),
    queryFn: () => api.adminGetProduct(id!),
    enabled: !!id,
  });
}

export function useSaveProduct(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      id ? api.adminUpdateProduct(id, input) : api.adminCreateProduct(input),
    onSuccess: () => {
      // Lo publico y lo admin cambian a la vez.
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product'] });
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.adminDeleteProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

/** --- Pedidos (admin) --- */
export function useAdminOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: queryKeys.adminOrders(status),
    queryFn: () => api.adminListOrders(status),
    refetchOnWindowFocus: true,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderInput) => api.adminCreateOrder(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      // Al crear confirmado baja el stock => catálogo público también cambia.
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useChangeOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.adminChangeOrderStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useUpdateOrderPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paidAmount }: { id: string; paidAmount: string }) =>
      api.adminUpdateOrderPayment(id, paidAmount),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

/** Ajustes publicos: la guia de tallas que ve el cliente en la ficha. */
export function useSizeGuide() {
  return useQuery({
    queryKey: ['settings', 'size-guide'] as const,
    queryFn: () => api.getSizeGuide(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSizeGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string | null) => api.setSizeGuide(url),
    onSuccess: (data) => qc.setQueryData(['settings', 'size-guide'], data),
  });
}

/** Cambia la contrasena del usuario autenticado. */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      api.changePassword(current, next),
  });
}

// ---------- Usuarios del panel (admin) ----------

export const usersKeys = {
  list: ['admin', 'users'] as const,
  invitations: ['admin', 'users', 'invitations'] as const,
};

export function useAdminUsers() {
  return useQuery({ queryKey: usersKeys.list, queryFn: () => api.listUsers() });
}

export function useAdminInvitations() {
  return useQuery({ queryKey: usersKeys.invitations, queryFn: () => api.listInvitations() });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { email: string; name: string; role: 'admin' | 'marketing' }) =>
      api.inviteUser(v.email, v.name, v.role),
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.invitations }),
  });
}

export function useResendInvitation() {
  return useMutation({ mutationFn: (id: string) => api.resendInvitation(id) });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelInvitation(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.invitations }),
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.setUserStatus(id, isActive),
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.list }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.list }),
  });
}

// ---------- Analytics ----------

export const analyticsKeys = {
  kpis: (threshold?: number) => ['analytics', 'kpis', threshold ?? null] as const,
  dailySales: (days: number) => ['analytics', 'daily-sales', days] as const,
  topProducts: (days: number, limit: number) => ['analytics', 'top-products', days, limit] as const,
  ordersByStatus: ['analytics', 'orders-by-status'] as const,
  revenueByCategory: (days: number) => ['analytics', 'revenue-by-category', days] as const,
  lowStock: (threshold: number) => ['analytics', 'low-stock', threshold] as const,
};

const ANALYTICS_STALE_MS = 60_000;

export function useDashboardKpis(threshold?: number) {
  return useQuery({
    queryKey: analyticsKeys.kpis(threshold),
    queryFn: () => api.dashboardKpis(threshold),
    staleTime: ANALYTICS_STALE_MS,
  });
}

export function useDailySales(days: number) {
  return useQuery({
    queryKey: analyticsKeys.dailySales(days),
    queryFn: () => api.dailySales(days),
    staleTime: ANALYTICS_STALE_MS,
  });
}

export function useTopProducts(days: number, limit = 5) {
  return useQuery({
    queryKey: analyticsKeys.topProducts(days, limit),
    queryFn: () => api.topProducts(days, limit),
    staleTime: ANALYTICS_STALE_MS,
  });
}

export function useOrdersByStatus() {
  return useQuery({
    queryKey: analyticsKeys.ordersByStatus,
    queryFn: () => api.ordersByStatus(),
    staleTime: ANALYTICS_STALE_MS,
  });
}

export function useRevenueByCategory(days: number) {
  return useQuery({
    queryKey: analyticsKeys.revenueByCategory(days),
    queryFn: () => api.revenueByCategory(days),
    staleTime: ANALYTICS_STALE_MS,
  });
}

export function useLowStock(threshold = 3) {
  return useQuery({
    queryKey: analyticsKeys.lowStock(threshold),
    queryFn: () => api.lowStock(threshold),
    staleTime: ANALYTICS_STALE_MS,
  });
}

// ---------- Clientes (derivados) ----------

export const customersKeys = {
  list: (q?: string) => ['admin', 'customers', q ?? ''] as const,
  detail: (phone: string) => ['admin', 'customers', 'detail', phone] as const,
};

export function useCustomers(q?: string) {
  return useQuery({
    queryKey: customersKeys.list(q),
    queryFn: () => api.listCustomers(q),
    staleTime: 60_000,
  });
}

export function useCustomerDetail(phone: string | null) {
  return useQuery({
    queryKey: customersKeys.detail(phone ?? ''),
    queryFn: () => api.customerDetail(phone as string),
    enabled: !!phone,
    staleTime: 60_000,
  });
}
