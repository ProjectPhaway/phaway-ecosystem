import type { SessionUser } from '@phaway/shared';

type Listener = () => void;

/**
 * Sesion del panel admin (token JWT + usuario) persistida en localStorage.
 * Observable: los componentes se suscriben con useSession().
 */
export class AuthSession {
  private static readonly KEY = 'phaway.session';
  private listeners = new Set<Listener>();
  private state: { token: string; user: SessionUser } | null;

  constructor() {
    this.state = AuthSession.read();
  }

  get token(): string | null {
    return this.state?.token ?? null;
  }

  get user(): SessionUser | null {
    return this.state?.user ?? null;
  }

  get isAuthenticated(): boolean {
    return this.state !== null;
  }

  save(token: string, user: SessionUser) {
    this.state = { token, user };
    try {
      localStorage.setItem(AuthSession.KEY, JSON.stringify(this.state));
    } catch {
      /* almacenamiento bloqueado: la sesion vive solo en memoria */
    }
    this.emit();
  }

  clear() {
    if (!this.state) return;
    this.state = null;
    try {
      localStorage.removeItem(AuthSession.KEY);
    } catch {
      /* ignorar */
    }
    this.emit();
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private static read(): { token: string; user: SessionUser } | null {
    try {
      const raw = localStorage.getItem(AuthSession.KEY);
      return raw ? (JSON.parse(raw) as { token: string; user: SessionUser }) : null;
    } catch {
      return null;
    }
  }
}

export const authSession = new AuthSession();
