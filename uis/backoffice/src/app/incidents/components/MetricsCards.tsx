"use client";

// ────────────────────────────────────────────────────────────
//  MetricsCards.tsx — Tarjetas de resumen: totales, válidos, inválidos
// ────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../types";

interface Props {
  data: AnalysisResult;
}

export default function MetricsCards({ data }: Props) {
  const cards = [
    {
      label: "Total de registros",
      value: data.total_records,
      color: "var(--text)",
    },
    {
      label: "Registros válidos",
      value: data.valid_count,
      color: "var(--accent)",
    },
    {
      label: "Registros inválidos",
      value: data.invalid_count,
      color: data.invalid_count > 0 ? "#f87171" : "var(--muted)",
    },
  ];

  return (
    <div className="grid" style={{ marginTop: "1.2rem" }}>
      {cards.map((card) => (
        <article key={card.label} className="card">
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
            {card.label}
          </p>
          <strong
            style={{
              fontSize: "2rem",
              color: card.color,
              lineHeight: 1.2,
            }}
          >
            {card.value}
          </strong>
          {card.label === "Registros válidos" && data.total_records > 0 && (
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", marginLeft: "0.5rem" }}>
              ({((data.valid_count / data.total_records) * 100).toFixed(1)}%)
            </span>
          )}
          {card.label === "Registros inválidos" && data.total_records > 0 && (
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", marginLeft: "0.5rem" }}>
              ({((data.invalid_count / data.total_records) * 100).toFixed(1)}%)
            </span>
          )}
        </article>
      ))}
    </div>
  );
}