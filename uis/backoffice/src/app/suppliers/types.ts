// ────────────────────────────────────────────────────────────
//  suppliers/types.ts — Tipos del Directorio de Proveedores
// ────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  country: "Spain" | "USA";
  categories: string[];
  monthly_rate: number;
  currency: "EUR" | "USD";
  status: "active" | "suspended";
  updated_at: string;
  contract_renewal_date?: string | null;
  contact_email?: string | null;
  notes?: string | null;
}

export interface SupplierCreatePayload {
  name: string;
  country: string;
  categories: string[];
  monthly_rate: number;
  currency: string;
  status: string;
  contract_renewal_date?: string | null;
  contact_email?: string | null;
  notes?: string | null;
}

export interface RateUpdatePayload {
  monthly_rate: number;
}

export interface StatusUpdatePayload {
  status: "active" | "suspended";
}

export const VALID_CATEGORIES = [
  "job_boards",
  "ats_software",
  "assessment_tools",
  "training_platforms",
  "payroll_and_hr_software",
  "video_interview",
  "background_check",
  "office_and_facilities",
  "it_and_software_licenses",
] as const;

export const VALID_COUNTRIES = ["Spain", "USA"] as const;