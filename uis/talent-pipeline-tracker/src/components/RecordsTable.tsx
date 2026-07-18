"use client";

import type { RecordOut } from "@/types";
import { STATUS_LABELS, STAGE_LABELS, STATUS_COLORS, STAGE_COLORS } from "@/types";
import Badge from "./Badge";

interface RecordsTableProps {
  records: RecordOut[];
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RecordsTable({ records, loading, onSelect, onDelete }: RecordsTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-nexova-border bg-nexova-bg p-8 text-center text-nexova-muted">
        Cargando candidatos...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-nexova-border bg-nexova-bg p-8 text-center text-nexova-muted">
        No se encontraron candidatos. {!loading && "Crea uno nuevo o ajusta los filtros."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-nexova-border shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-nexova-accent/50 text-left text-nexova-text">
            <th className="py-3 px-4 font-semibold">Nombre</th>
            <th className="py-3 px-4 font-semibold">Email</th>
            <th className="py-3 px-4 font-semibold">Puesto</th>
            <th className="py-3 px-4 font-semibold">Estado</th>
            <th className="py-3 px-4 font-semibold">Etapa</th>
            <th className="py-3 px-4 font-semibold">Experiencia</th>
            <th className="py-3 px-4 font-semibold">Notas</th>
            <th className="py-3 px-4 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-t border-nexova-border/50 hover:bg-nexova-accent/20 cursor-pointer transition-colors"
              onClick={() => onSelect(record.id)}
            >
              <td className="py-3 px-4 font-medium">{record.full_name}</td>
              <td className="py-3 px-4 text-nexova-muted">{record.email}</td>
              <td className="py-3 px-4">{record.position}</td>
              <td className="py-3 px-4">
                <Badge label={STATUS_LABELS[record.status as keyof typeof STATUS_LABELS] || record.status} className={STATUS_COLORS[record.status as keyof typeof STATUS_COLORS] || ""} />
              </td>
              <td className="py-3 px-4">
                <Badge label={STAGE_LABELS[record.stage as keyof typeof STAGE_LABELS] || record.stage} className={STAGE_COLORS[record.stage as keyof typeof STAGE_COLORS] || ""} />
              </td>
              <td className="py-3 px-4">{record.experience_years} años</td>
              <td className="py-3 px-4 text-nexova-muted">{record.notes_count}</td>
              <td className="py-3 px-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(record.id);
                  }}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  title="Eliminar candidato"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}