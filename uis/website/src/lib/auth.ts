// ────────────────────────────────────────────────────────────
//  lib/auth.ts — Gestión del token JWT en el cliente
// ────────────────────────────────────────────────────────────
//  Utilidades para persistir, leer y eliminar el token de acceso
//  JWT en el navegador, y para construir el header de
//  autorización de las peticiones autenticadas.
// ────────────────────────────────────────────────────────────

const TOKEN_KEY = "nexova_access_token";

/** Evento que notifica cambios locales de autenticación. */
export const AUTH_CHANGED_EVENT = "nexova:auth-changed";

function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

/** Guarda el token JWT en localStorage. */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  notifyAuthChanged();
}

/** Devuelve el token JWT guardado, o null si no existe. */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

/** Elimina el token JWT guardado (cierre de sesión local). */
export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  notifyAuthChanged();
}

/** Indica si existe un token guardado en el navegador. */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Construye las cabeceras de una petición autenticada.
 *
 * Si existe un token, añade `Authorization: Bearer <token>`.
 */
export function authHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}