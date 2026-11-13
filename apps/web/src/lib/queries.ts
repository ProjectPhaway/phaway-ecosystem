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
