import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as loginRequest } from '../services/authService';
import { registerAuthToken, registerUnauthorizedHandler } from '../services/api';
import type { AuthUser, LoginRequest } from '../types/auth';

const STORAGE_KEY = 'anpr_auth_session';

interface StoredSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
  /** Patches the cached session user (e.g. full_name) after the logged-in
   * account edits its own profile — without this, the navbar keeps showing
   * whatever was true at login until the next login, since `user` is only
   * ever set there. */
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.expiresAt || Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => {
    const restored = loadSession();
    registerAuthToken(restored?.token ?? null);
    return restored;
  });

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await loginRequest(payload);
    const next: StoredSession = {
      token: res.access_token,
      user: res.user,
      expiresAt: Date.now() + res.expires_in_minutes * 60 * 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    registerAuthToken(next.token);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    registerAuthToken(null);
    setSession(null);
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: StoredSession = { ...prev, user: { ...prev.user, ...patch } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
    return () => registerUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: !!session,
      login,
      logout,
      updateUser,
    }),
    [session, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
