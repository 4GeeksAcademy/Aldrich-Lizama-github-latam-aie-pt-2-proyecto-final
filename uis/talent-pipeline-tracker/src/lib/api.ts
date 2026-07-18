// ============================================================
// Nexova — Talent Pipeline Tracker · API Service
// ============================================================

import type { RecordOut, RecordCreate, RecordPatch, NoteOut, NoteCreate, PaginatedResponse, NotesResponse } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://playground.4geeks.com/tracker/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Records ────────────────────────────────────────────────

export async function getRecords(params?: {
  status?: string;
  stage?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<RecordOut[]> {
  const searchParams = new URLSearchParams();
  // Usamos un limit alto por defecto para obtener todos los registros
  searchParams.set("limit", String(params?.limit ?? 200));
  if (params?.status) searchParams.set("status", params.status);
  if (params?.stage) searchParams.set("stage", params.stage);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));

  const qs = searchParams.toString();
  const res = await request<PaginatedResponse<RecordOut>>(`/records${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function getRecordById(id: string): Promise<RecordOut> {
  return request<RecordOut>(`/records/${id}`);
}

export async function createRecord(data: RecordCreate): Promise<RecordOut> {
  return request<RecordOut>("/records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRecord(id: string, data: RecordPatch): Promise<RecordOut> {
  return request<RecordOut>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function replaceRecord(id: string, data: RecordCreate): Promise<RecordOut> {
  return request<RecordOut>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Actualiza todos los campos editables de un candidato vía PUT.
 * Es el equivalente a replaceRecord pero con nombre más descriptivo.
 */
export async function updateRecordData(id: string, data: RecordCreate): Promise<RecordOut> {
  return replaceRecord(id, data);
}

export async function deleteRecord(id: string): Promise<void> {
  return request<void>(`/records/${id}`, { method: "DELETE" });
}

// ─── Notes ──────────────────────────────────────────────────

export async function getNotes(recordId: string): Promise<NoteOut[]> {
  const res = await request<NotesResponse>(`/records/${recordId}/notes`);
  return res.data;
}

export async function addNote(recordId: string, data: NoteCreate): Promise<NoteOut> {
  return request<NoteOut>(`/records/${recordId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(recordId: string, noteId: string): Promise<void> {
  return request<void>(`/records/${recordId}/notes/${noteId}`, {
    method: "DELETE",
  });
}