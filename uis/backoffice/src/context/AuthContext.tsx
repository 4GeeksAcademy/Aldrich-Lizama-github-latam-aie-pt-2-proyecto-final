"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const AUTH_TOKEN_KEY = "nexova_access_token";
const AUTH_CHANGED_EVENT = "nexova:auth-changed";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profile: {
    id: number;
    user_id: number;
    name: string;
    phone: string | null;
    address: string | null;
  } | null;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getAuthApiBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_AUTH_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  const match = window.location.hostname.match(/^(.*)-\d+\.app\.github\.dev$/);
  if (match) return `https://${match[1]}-8000.app.github.dev`;

  return "http://localhost:8000";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const syncSession = useCallback(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    setToken(storedToken);
    setUser(null);
    setIsLoading(Boolean(storedToken));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const initialSync = window.setTimeout(syncSession, 0);
    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_CHANGED_EVENT, syncSession);

    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncSession);
    };
  }, [syncSession]);

  useEffect(() => {
    if (!isHydrated || !token) return;

    let cancelled = false;
    const loadUser = async () => {
      try {
        const response = await fetch(`${getAuthApiBaseUrl()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          if (
            !cancelled &&
            response.status === 401 &&
            window.localStorage.getItem(AUTH_TOKEN_KEY) === token
          ) {
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
            setToken(null);
            setIsLoading(false);
          }
          throw new Error("No se pudo validar la sesión.");
        }

        const currentUser = (await response.json()) as AuthUser;
        if (!cancelled) setUser(currentUser);
      } catch {
        if (
          !cancelled &&
          window.localStorage.getItem(AUTH_TOKEN_KEY) === token
        ) {
          setUser(null);
        }
      } finally {
        if (
          !cancelled &&
          window.localStorage.getItem(AUTH_TOKEN_KEY) === token
        ) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, token]);

  const login = useCallback((newToken: string) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(null);
    setIsLoading(true);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIsLoading(false);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    window.location.assign("/login");
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider.");
  }
  return context;
}
