// ────────────────────────────────────────────────────────────
//  api.ts — Capa de comunicación con el backend de análisis
// ────────────────────────────────────────────────────────────
//  Llama a los endpoints que expone el servidor Python/FastAPI:
//    POST /api/incidents/analyze   → subir CSV, recibir AnalysisResult
//    GET  /api/incidents/results/export → descargar CSV de resultados
// ────────────────────────────────────────────────────────────

import type { AnalysisResult } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Sube un archivo CSV al backend y devuelve el resultado del análisis.
 *
 * @param file - Archivo CSV seleccionado por el usuario.
 * @returns Promesa con el resultado del análisis.
 */
export async function uploadAndAnalyze(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/incidents/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Error ${res.status} al analizar el archivo: ${body || res.statusText}`,
    );
  }

  return res.json() as Promise<AnalysisResult>;
}

/**
 * Obtiene la URL de descarga del CSV de resultados exportados.
 * El cliente puede usar directamente esta URL en un <a> o window.open.
 */
export function getExportUrl(): string {
  return `${BASE_URL}/api/incidents/results/export`;
}

/**
 * Dispara la descarga del CSV de resultados.
 * Abre la URL en una nueva pestaña / descarga directa.
 */
export function downloadExport(): void {
  window.open(getExportUrl(), "_blank");
}