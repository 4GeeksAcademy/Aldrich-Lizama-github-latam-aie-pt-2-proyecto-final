"use client";

// ────────────────────────────────────────────────────────────
//  InvalidRecordsAlert.tsx — Panel de alerta de registros inválidos
// ────────────────────────────────────────────────────────────

import type { AnalysisResult, InvalidRuleEntry } from "../types";

interface Props {
  data: AnalysisResult;
}

/** Mapa de reglas → mensajes descriptivos en español */
const RULE_LABELS: Record<string, string> = {
  "Missing client_company": "Falta empresa cliente (client_company)",
  "Invalid or missing category": "Categoría faltante o inválida",
  "Missing or too short description": "Descripción vacía o demasiado corta",
  "Invalid or missing agent_id": "Agent ID faltante o inválido",
  "Invalid or missing email": "Email de cliente faltante o inválido",
  "Closed ticket, no score": "Ticket cerrado sin puntuación",
  "Satisfaction score out of range": "Puntuación fuera de rango (1–5)",
};

function getRuleLabel(rule: string): string {
  return RULE_LABELS[rule] ?? rule;
}

export default function InvalidRecordsAlert({ data }: Props) {
  if (data.invalid_count === 0) return null;

  const entries: InvalidRuleEntry[] = Object.entries(data.invalid_breakdown).map(
    ([rule, count]) => ({ rule, count }),
  );

  return (
    <section
      className="card"
      style={{
        borderColor: "#f87171",
        background: "rgba(248, 113, 113, 0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {/* Icono de alerta */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f87171"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h3 style={{ margin: 0, color: "#f87171" }}>
          Registros inválidos detectados
        </h3>
      </div>

      <p style={{ margin: "0 0 0.75rem", color: "var(--muted)", fontSize: "0.85rem" }}>
        Se encontraron <strong style={{ color: "#f87171" }}>{data.invalid_count}</strong> registros
        que no cumplen con las reglas de validación. Desglose por tipo de fallo:
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
            <th style={{ textAlign: "left", paddingBottom: "0.4rem" }}>Regla incumplida</th>
            <th style={{ textAlign: "right", paddingBottom: "0.4rem" }}>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.rule}
              style={{
                borderTop: "1px solid rgba(248, 113, 113, 0.2)",
              }}
            >
              <td
                style={{
                  padding: "0.5rem 0.5rem 0.5rem 0",
                  fontSize: "0.85rem",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#f87171",
                    marginRight: "0.5rem",
                    verticalAlign: "middle",
                  }}
                />
                {getRuleLabel(entry.rule)}
              </td>
              <td style={{ textAlign: "right", padding: "0.5rem 0", fontWeight: 600, color: "#f87171" }}>
                {entry.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}