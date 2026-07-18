"use client";

import { useState } from "react";
import type { RecordOut } from "@/types";

interface RecordFormProps {
  /** Si se proporciona, el formulario está en modo edición */
  record?: RecordOut;
  onSubmit: (data: {
    full_name: string;
    email: string;
    phone: string;
    position: string;
    experience_years: number;
    linkedin_url?: string | null;
    cv_url?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function RecordForm({ record, onSubmit, onCancel }: RecordFormProps) {
  const isEditing = !!record;
  const [form, setForm] = useState({
    full_name: record?.full_name ?? "",
    email: record?.email ?? "",
    phone: record?.phone ?? "",
    position: record?.position ?? "",
    experience_years: record?.experience_years ?? 0,
    linkedin_url: record?.linkedin_url ?? "",
    cv_url: record?.cv_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "El nombre es obligatorio";
    if (!form.email.trim()) errs.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email no válido";
    if (!form.phone.trim()) errs.phone = "El teléfono es obligatorio";
    if (!form.position.trim()) errs.position = "El puesto es obligatorio";
    if (form.experience_years < 0 || form.experience_years > 50)
      errs.experience_years = "Debe estar entre 0 y 50";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    await onSubmit({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      position: form.position.trim(),
      experience_years: form.experience_years,
      linkedin_url: form.linkedin_url.trim() || null,
      cv_url: form.cv_url.trim() || null,
    });
    setSaving(false);
  };

  const set = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-nexova-border bg-nexova-bg shadow-xl">
        <div className="flex items-center justify-between border-b border-nexova-border px-6 py-4">
          <h2 className="text-xl font-bold">{isEditing ? "Editar candidato" : "Nuevo candidato"}</h2>
          <button
            onClick={onCancel}
            className="rounded-md border border-nexova-border px-3 py-1.5 text-sm font-semibold hover:bg-nexova-accent transition-colors"
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="ff-name" className="block text-sm font-medium">
              Nombre completo *
            </label>
            <input
              id="ff-name"
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className={`mt-1 w-full rounded-md border ${
                errors.full_name ? "border-red-400" : "border-nexova-border"
              } bg-white/60 px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent`}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ff-email" className="block text-sm font-medium">
                Email *
              </label>
              <input
                id="ff-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={`mt-1 w-full rounded-md border ${
                  errors.email ? "border-red-400" : "border-nexova-border"
                } bg-white/60 px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="ff-phone" className="block text-sm font-medium">
                Teléfono *
              </label>
              <input
                id="ff-phone"
                type="text"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={`mt-1 w-full rounded-md border ${
                  errors.phone ? "border-red-400" : "border-nexova-border"
                } bg-white/60 px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ff-position" className="block text-sm font-medium">
                Puesto *
              </label>
              <input
                id="ff-position"
                type="text"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                className={`mt-1 w-full rounded-md border ${
                  errors.position ? "border-red-400" : "border-nexova-border"
                } bg-white/60 px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent`}
              />
              {errors.position && (
                <p className="mt-1 text-xs text-red-600">{errors.position}</p>
              )}
            </div>
            <div>
              <label htmlFor="ff-experience" className="block text-sm font-medium">
                Años de experiencia *
              </label>
              <input
                id="ff-experience"
                type="number"
                min={0}
                max={50}
                value={form.experience_years}
                onChange={(e) => set("experience_years", Number(e.target.value))}
                className={`mt-1 w-full rounded-md border ${
                  errors.experience_years ? "border-red-400" : "border-nexova-border"
                } bg-white/60 px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent`}
              />
              {errors.experience_years && (
                <p className="mt-1 text-xs text-red-600">{errors.experience_years}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="ff-linkedin" className="block text-sm font-medium">
              LinkedIn (URL)
            </label>
            <input
              id="ff-linkedin"
              type="url"
              value={form.linkedin_url}
              onChange={(e) => set("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="mt-1 w-full rounded-md border border-nexova-border bg-white/60 px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent"
            />
          </div>

          <div>
            <label htmlFor="ff-cv" className="block text-sm font-medium">
              CV (URL)
            </label>
            <input
              id="ff-cv"
              type="url"
              value={form.cv_url}
              onChange={(e) => set("cv_url", e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-md border border-nexova-border bg-white/60 px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-nexova-border px-4 py-2 text-sm font-semibold hover:bg-nexova-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-nexova-text px-5 py-2 text-sm font-semibold text-nexova-bg hover:bg-nexova-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando..." : isEditing ? "Actualizar candidato" : "Guardar candidato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}