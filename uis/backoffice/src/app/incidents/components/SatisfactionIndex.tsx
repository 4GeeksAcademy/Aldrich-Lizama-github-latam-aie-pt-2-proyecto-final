"use client";

// ────────────────────────────────────────────────────────────
//  SatisfactionIndex.tsx — Índice de satisfacción media + distribución
// ────────────────────────────────────────────────────────────

import type { AnalysisResult } from "../types";

interface Props {
  data: AnalysisResult;
}

const SCORE_LABELS: Record<number, string> = {
  1: "Very dissatisfied",
  2: "Dissatisfied",
  3: "Neutral",
  4: "Satisfied",
  5: "Very satisfied",
};

const SCORE_COLORS: Record<number, string> = {
  1: "#f87171",
  2: "#fb923c",
  3: "#facc15",
  4: "#7ec0a7",
  5: "#4ade80",
};

export default function SatisfactionIndex({ data }: Props) {
  const { avg_score, scored_closed_count, total_closed_count, score_distribution } = data;

  return (
    <section className="card">
      <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
        Índice de satisfacción
      </h3>

      {/* Score medio */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <span style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--accent)" }}>
          {avg_score.toFixed(2)}
        </span>
        <span style={{ fontSize: "1.2rem", color: "var(--muted)" }}>/ 5.00</span>
      </div>

      <p style={{ margin: "0 0 1rem", color: "var(--muted)", fontSize: "0.85rem" }}>
        {scored_closed_count} de {total_closed_count} tickets cerrados con puntuación
      </p>

      {/* Distribución de puntuaciones */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {[1, 2, 3, 4, 5].map((score) => {
          const count = score_distribution[String(score)] ?? 0;
          const pct =
            scored_closed_count > 0
              ? (count / scored_closed_count) * 100
              : 0;

          return (
            <div key={score} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {/* Puntaje */}
              <span
                style={{
                  minWidth: "1.5rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: SCORE_COLORS[score],
                }}
              >
                {score}
              </span>

              {/* Barra de progreso */}
              <div
                style={{
                  flex: 1,
                  height: "10px",
                  borderRadius: "5px",
                  background: "var(--border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "5px",
                    background: SCORE_COLORS[score],
                    transformOrigin: "left",
                    transform: `scaleX(${Math.min(pct, 100) / 100})`,
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                  }}
                />
              </div>

              {/* Etiqueta + count */}
              <span
                style={{
                  minWidth: "5rem",
                  textAlign: "right",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                }}
              >
                {SCORE_LABELS[score]} — {count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}