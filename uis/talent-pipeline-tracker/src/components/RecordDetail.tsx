"use client";

import { useState } from "react";
import type { RecordOut, NoteOut } from "@/types";
import { STATUS_LABELS, STAGE_LABELS, STATUS_COLORS, STAGE_COLORS, STATUS_OPTIONS, STAGE_OPTIONS } from "@/types";
import Badge from "./Badge";

interface RecordDetailProps {
  record: RecordOut;
  notes: NoteOut[];
  onClose: () => void;
  onEdit: () => void;
  onUpdateStatus: (status: string) => Promise<void>;
  onUpdateStage: (stage: string) => Promise<void>;
  onAddNote: (content: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
}

export default function RecordDetail({
  record,
  notes,
  onClose,
  onEdit,
  onUpdateStatus,
  onUpdateStage,
  onAddNote,
  onDeleteNote,
}: RecordDetailProps) {
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    await onAddNote(newNote.trim());
    setNewNote("");
    setSaving(false);
  };

  const handleStatusChange = async (status: string) => {
    setUpdating("status");
    await onUpdateStatus(status);
    setUpdating(null);
  };

  const handleStageChange = async (stage: string) => {
    setUpdating("stage");
    await onUpdateStage(stage);
    setUpdating(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    await onDeleteNote(noteId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-nexova-border bg-nexova-bg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-nexova-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-xl font-bold">{record.full_name}</h2>
              <p className="text-sm text-nexova-muted">{record.position}</p>
            </div>
            <span className="flex items-center gap-1 self-start mt-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En vivo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="rounded-md bg-nexova-text px-3 py-1.5 text-sm font-semibold text-nexova-bg hover:bg-nexova-hover transition-colors"
            >
              ✏️ Editar
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-nexova-border px-3 py-1.5 text-sm font-semibold hover:bg-nexova-accent transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Info general */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-xs font-semibold text-nexova-muted">Email</span>
              <span>{record.email}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-nexova-muted">Teléfono</span>
              <span>{record.phone}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-nexova-muted">Experiencia</span>
              <span>{record.experience_years} años</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-nexova-muted">Aplicó el</span>
              <span>{new Date(record.applied_at).toLocaleDateString("es-ES")}</span>
            </div>
            {record.linkedin_url && (
              <div className="col-span-2">
                <span className="block text-xs font-semibold text-nexova-muted">LinkedIn</span>
                <a
                  href={record.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nexova-hover underline"
                >
                  {record.linkedin_url}
                </a>
              </div>
            )}
            {record.cv_url && (
              <div className="col-span-2">
                <span className="block text-xs font-semibold text-nexova-muted">CV</span>
                <a
                  href={record.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nexova-hover underline"
                >
                  {record.cv_url}
                </a>
              </div>
            )}
          </div>

          {/* Estado y Etapa actuales */}
          <div className="flex gap-4">
            <div>
              <span className="block text-xs font-semibold text-nexova-muted mb-1">Estado actual</span>
              <Badge
                label={STATUS_LABELS[record.status as keyof typeof STATUS_LABELS] || record.status}
                className={STATUS_COLORS[record.status as keyof typeof STATUS_COLORS] || ""}
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-nexova-muted mb-1">Etapa actual</span>
              <Badge
                label={STAGE_LABELS[record.stage as keyof typeof STAGE_LABELS] || record.stage}
                className={STAGE_COLORS[record.stage as keyof typeof STAGE_COLORS] || ""}
              />
            </div>
          </div>

          {/* Actualizar estado */}
          <div>
            <label htmlFor="detail-status" className="block text-xs font-semibold text-nexova-muted mb-1">
              Actualizar estado
            </label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={updating === "status"}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    record.status === s
                      ? `${STATUS_COLORS[s]} border-current`
                      : "border-nexova-border hover:bg-nexova-accent"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Actualizar etapa */}
          <div>
            <label htmlFor="detail-stage" className="block text-xs font-semibold text-nexova-muted mb-1">
              Actualizar etapa
            </label>
            <div className="flex gap-2 flex-wrap">
              {STAGE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStageChange(s)}
                  disabled={updating === "stage"}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    record.stage === s
                      ? `${STAGE_COLORS[s]} border-current`
                      : "border-nexova-border hover:bg-nexova-accent"
                  }`}
                >
                  {STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Notas internas */}
          <div>
            <h3 className="text-sm font-bold mb-2">Notas internas</h3>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Añadir nota después de llamada o entrevista..."
                className="flex-1 rounded-md border border-nexova-border bg-white/60 px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNote();
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
                className="rounded-md bg-nexova-text px-4 py-2 text-sm font-semibold text-nexova-bg hover:bg-nexova-hover disabled:opacity-50 transition-colors"
              >
                {saving ? "..." : "Añadir"}
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="text-xs text-nexova-muted italic">No hay notas internas aún.</p>
            ) : (
              <ul className="space-y-2">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-nexova-border bg-white/60 p-3 text-sm"
                  >
                    <div className="flex-1">
                      <p>{note.content}</p>
                      <p className="text-xs text-nexova-muted mt-1">
                        {new Date(note.created_at).toLocaleString("es-ES")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="shrink-0 rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar nota"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}