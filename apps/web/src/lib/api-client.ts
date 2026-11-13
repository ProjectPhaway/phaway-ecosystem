import type {
  CategoryDto,
  LoginResponse,
  OrderDto,
  OrderInput,
  OrderStatus,
  ProductDto,
  ProductInput,
  SessionUser,
} from '@phaway/shared';
import { API_URL } from '../config';
import { authSession, type AuthSession } from './auth-session';

/** Error HTTP con el mensaje que devuelve NestJS (string o lista de validaciones). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let message = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join('. ');
      else if (body.message) message = body.message;
    } catch {
      /* respuesta sin JSON */
    }
    return new ApiError(res.status, message);
  }
}

export interface ProductFilters {
  category?: string;
  onSale?: boolean;
  q?: string;
}

/**
 * Unico punto de acceso HTTP al API. Los componentes nunca llaman a fetch directo:
 * usan esta clase (via los hooks de queries.ts).
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly session: AuthSession;

  constructor(baseUrl: string, session: AuthSession) {
    this.baseUrl = `${baseUrl.replace(/\/$/, '')}/api`;
    this.session = session;
  }

  // ---------- Publico ----------

  getCategories() {
    return this.request<CategoryDto[]>('GET', '/categories');
  }

  getProducts(filters: ProductFilters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.onSale !== undefined) params.set('onSale', String(filters.onSale));
    if (filters.q) params.set('q', filters.q);
    const qs = params.toString();
    return this.request<ProductDto[]>('GET', `/products${qs ? `?${qs}` : ''}`);
  }

  getProduct(slug: string) {
    return this.request<ProductDto>('GET', `/products/${encodeURIComponent(slug)}`);
  }

  // ---------- Auth ----------

  async login(email: string, password: string): Promise<SessionUser> {
    const res = await this.request<LoginResponse>('POST', '/auth/login', { email, password });
    this.session.save(res.accessToken, res.user);
    return res.user;
  }

  logout() {
    this.session.clear();
  }

  // ---------- Admin ----------

  adminListProducts() {
    return this.request<ProductDto[]>('GET', '/admin/products');
  }

  adminGetProduct(id: string) {
    return this.request<ProductDto>('GET', `/admin/products/${id}`);
  }

  adminCreateProduct(input: ProductInput) {
    return this.request<ProductDto>('POST', '/admin/products', input);
  }

  adminUpdateProduct(id: string, input: ProductInput) {
    return this.request<ProductDto>('PATCH', `/admin/products/${id}`, input);
  }

  adminDeleteProduct(id: string) {
    return this.request<{ deleted: boolean; deactivated: boolean }>(
      'DELETE',
      `/admin/products/${id}`,
    );
  }

  // ---------- Pedidos (admin) ----------

  adminListOrders(status?: OrderStatus) {
    return this.request<OrderDto[]>(
      'GET',
      `/admin/orders${status ? `?status=${status}` : ''}`,
    );
  }

  adminCreateOrder(input: OrderInput) {
    return this.request<OrderDto>('POST', '/admin/orders', input);
  }

  adminChangeOrderStatus(id: string, status: OrderStatus) {
    return this.request<OrderDto>('PATCH', `/admin/orders/${id}/status`, { status });
  }

  adminUpdateOrderPayment(id: string, paidAmount: string) {
    return this.request<OrderDto>('PATCH', `/admin/orders/${id}/payment`, { paidAmount });
  }

  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const { url } = await this.request<{ url: string }>('POST', '/admin/uploads', form);
    return url;
  }

  // ---------- Base ----------

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    const token = this.session.token;
    if (token) headers.Authorization = `Bearer ${token}`;

    let payload: BodyInit | undefined;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, { method, headers, body: payload });
    } catch {
      throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa que el API este encendido.');
    }

    if (res.status === 401 && token) {
      // Token vencido o invalido: cerrar sesion para forzar nuevo login.
      this.session.clear();
    }
    if (!res.ok) throw await ApiError.fromResponse(res);
    return (await res.json()) as T;
  }
}

export const api = new ApiClient(API_URL, authSession);
