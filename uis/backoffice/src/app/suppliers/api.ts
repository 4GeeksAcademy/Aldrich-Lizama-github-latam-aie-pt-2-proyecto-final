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
import { apiClient } from "@/lib/apiClient";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiClient(path, {
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
    // Sanitizar: los mensajes internos nunca llegan al usuario
    const sanitized = typeof detail === "string"
      ? detail
      : JSON.stringify(detail);
    throw new Error(sanitized || "Error al comunicarse con el servidor");
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
