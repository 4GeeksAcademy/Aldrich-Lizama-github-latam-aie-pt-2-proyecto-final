// ────────────────────────────────────────────────────────────
//  types.ts — Tipos del análisis de incidencias Nexova
// ────────────────────────────────────────────────────────────

/** Resultado completo del análisis devuelto por POST /api/incidents/analyze */
export interface AnalysisResult {
  filename: string;
  total_records: number;
  valid_count: number;
  invalid_count: number;
  invalid_breakdown: Record<string, number>;
  category_counts: Record<string, number>;
  status_counts: Record<string, number>;
  score_distribution: Record<string, number>;
  scored_closed_count: number;
  total_closed_count: number;
  avg_score: number;
}

/** Estado del análisis en el frontend */
export type AnalysisStatus = "idle" | "uploading" | "analyzing" | "done" | "error";

/** Representación de una fila de error para el panel de alertas */
export interface InvalidRuleEntry {
  rule: string;
  count: number;
}

/** Metadatos del archivo subido */
export interface UploadedFileInfo {
  name: string;
  size: number;
}