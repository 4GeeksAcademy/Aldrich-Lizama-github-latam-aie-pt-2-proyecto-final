// ────────────────────────────────────────────────────────────
//  suppliers/api.ts — Capa de comunicación con el backend
// ────────────────────────────────────────────────────────────
//  Llama a los endpoints de la API de proveedores.
//    GET    /suppliers
//    GET    /suppliers/{id}
//    POST   /suppliers
//    PATCH  /suppliers/{id}/rate
//    PATCH  /suppliers/{id}/status
//    DELETE /suppliers/{id}
// ────────────────────────────────────────────────────────────

import type {
  Supplier,
  SupplierCreatePayload,
  RateUpdatePayload,
  StatusUpdatePayload,
} from "./types";

/**
 * Determina la URL base del backend automáticamente.
 *
 * - En Codespaces (app.github.dev), deduce la URL pública del puerto 8000.
 * - En local, usa NEXT_PUBLIC_API_URL o http://localhost:8000 por defecto.
 */
function getBaseUrl(): string {
  // Si el usuario configuró explícitamente la variable, usarla
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Detectar Codespaces por el hostname
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Ejemplo: super-duper-space-tribble-xrwx94wrxvvphvwq6-3000.app.github.dev
    if (host.endsWith(".app.github.dev")) {
      // Reemplazar el puerto 3000 por 8000
      // El hostname: "{codespace-name}-{port}.app.github.dev"
      // Extraemos la parte antes del último '-' que precede al puerto
      const lastDash = host.lastIndexOf("-");
      const dotIndex = host.indexOf(".");
      if (lastDash > 0 && dotIndex > lastDash) {
        const baseName = host.slice(0, lastDash); // todo antes del puerto
        return `https://${baseName}-8000.app.github.dev`;
      }
    }
  }

  return "http://localhost:8000";
}

const BASE_URL = getBaseUrl();

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  // 204 No Content → retornar null
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const detail =
      body?.detail ??
      (typeof body === "object" ? JSON.stringify(body) : body) ??
      res.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return body as T;
}

/** Obtiene todos los proveedores, opcionalmente filtrados. */
export async function fetchSuppliers(
  country?: string,
  category?: string,
): Promise<Supplier[]> {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (category) params.set("category", category);
  const qs = params.toString();
  return request<Supplier[]>(`/suppliers${qs ? `?${qs}` : ""}`);
}

/** Obtiene un proveedor por ID. */
export async function fetchSupplier(id: string): Promise<Supplier> {
  return request<Supplier>(`/suppliers/${id}`);
}

/** Crea un nuevo proveedor. */
export async function createSupplier(
  payload: SupplierCreatePayload,
): Promise<Supplier> {
  return request<Supplier>("/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Actualiza la tarifa mensual. */
export async function updateSupplierRate(
  id: string,
  payload: RateUpdatePayload,
): Promise<Supplier> {
  return request<Supplier>(`/suppliers/${id}/rate`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** Activa o suspende un proveedor. */
export async function updateSupplierStatus(
  id: string,
  payload: StatusUpdatePayload,
): Promise<Supplier> {
  return request<Supplier>(`/suppliers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** Elimina un proveedor. */
export async function deleteSupplier(id: string): Promise<void> {
  return request<void>(`/suppliers/${id}`, { method: "DELETE" });
}