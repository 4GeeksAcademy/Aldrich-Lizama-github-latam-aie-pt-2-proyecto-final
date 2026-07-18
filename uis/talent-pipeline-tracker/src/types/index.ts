// ============================================================
// Nexova — Talent Pipeline Tracker · TypeScript types
// Matching the Talent Tracker API spec
// ============================================================

// ─── API Response types ─────────────────────────────────────

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export interface RecordOut {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: StatusValue;
  stage: StageValue;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

export interface RecordCreate {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  experience_years: number;
  linkedin_url?: string | null;
  cv_url?: string | null;
}

export interface RecordPatch {
  status?: StatusValue | null;
  stage?: StageValue | null;
}

export interface NoteOut {
  id: string;
  record_id?: string;
  content: string;
  created_at: string;
}

export interface NotesResponse {
  data: NoteOut[];
  meta: { total: number };
}

export interface NoteCreate {
  content: string;
}

// ─── Status & Stage types ───────────────────────────────────

export type StatusValue =
  | "received"
  | "in_progress"
  | "selected"
  | "discarded";

export type StageValue =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

// ─── Display labels ─────────────────────────────────────────

export const STATUS_LABELS: Record<StatusValue, string> = {
  received: "Recibida",
  in_progress: "En proceso",
  selected: "Seleccionada",
  discarded: "Descartada",
};

export const STAGE_LABELS: Record<StageValue, string> = {
  pending: "Pendiente de revisión",
  review: "En revisión",
  personal_interview: "Entrevista personal",
  technical_interview: "Entrevista técnica",
  offer_presented: "Oferta presentada",
};

export const STATUS_OPTIONS: StatusValue[] = [
  "received",
  "in_progress",
  "selected",
  "discarded",
];

export const STAGE_OPTIONS: StageValue[] = [
  "pending",
  "review",
  "personal_interview",
  "technical_interview",
  "offer_presented",
];

// ─── Color helpers ──────────────────────────────────────────

export const STATUS_COLORS: Record<StatusValue, string> = {
  received: "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  selected: "bg-green-100 text-green-800 border-green-300",
  discarded: "bg-gray-100 text-gray-600 border-gray-300",
};

export const STAGE_COLORS: Record<StageValue, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-300",
  review: "bg-indigo-100 text-indigo-700 border-indigo-300",
  personal_interview: "bg-purple-100 text-purple-700 border-purple-300",
  technical_interview: "bg-violet-100 text-violet-700 border-violet-300",
  offer_presented: "bg-emerald-100 text-emerald-700 border-emerald-300",
};