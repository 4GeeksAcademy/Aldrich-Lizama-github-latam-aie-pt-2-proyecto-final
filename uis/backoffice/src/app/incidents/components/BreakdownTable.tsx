"use client";

// ────────────────────────────────────────────────────────────
//  BreakdownTable.tsx — Tabla de desglose por categoría o estado
// ────────────────────────────────────────────────────────────
//  Componente reutilizable para mostrar category_counts o status_counts
//  como una tabla con barra de progreso visual.
// ────────────────────────────────────────────────────────────

interface Props {
  /** Título de la sección */
  title: string;
  /** Diccionario { clave: valor } a renderizar */
  data: Record<string, number>;
  /** Total usado para calcular porcentajes (si no se provee, se suma de data) */
  total?: number;
  /** Color base de la barra de progreso */
  barColor?: string;
}

export default function BreakdownTable({
  title,
  data,
  total,
  barColor = "var(--accent)",
}: Props) {
  const entries = Object.entries(data);
  const denominator = total ?? entries.reduce((sum, [, v]) => sum + v, 0);

  if (entries.length === 0) {
    return (
      <section className="card">
        <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>{title}</h3>
        <p style={{ color: "var(--muted)", margin: 0 }}>Sin datos</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>{title}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
            <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Clave</th>
            <th style={{ textAlign: "right", paddingBottom: "0.5rem" }}>Cantidad</th>
            <th style={{ textAlign: "right", paddingBottom: "0.5rem" }}>%</th>
            <th style={{ paddingBottom: "0.5rem", width: "40%" }}></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, count], idx) => {
            const pct = denominator > 0 ? (count / denominator) * 100 : 0;
            return (
              <tr
                key={key}
                style={{
                  borderTop: "1px solid var(--border)",
                }}
              >
                <td
                  style={{
                    padding: "0.6rem 0.5rem 0.6rem 0",
                    fontWeight: 500,
                  }}
                >
                  {key}
                </td>
                <td style={{ textAlign: "right", padding: "0.6rem 0.5rem" }}>
                  {count}
                </td>
                <td style={{ textAlign: "right", padding: "0.6rem 0.5rem", color: "var(--muted)" }}>
                  {pct.toFixed(1)}%
                </td>
                <td style={{ padding: "0.6rem 0" }}>
                  <div
                    style={{
                      height: "8px",
                      borderRadius: "4px",
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        height: "100%",
                        borderRadius: "4px",
                        background: barColor,
                        opacity: 0.8,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}