import Link from "next/link";
import { getDashboardSummary } from "@/lib/business-summary";

export default function BackofficeHomePage() {
  const summary = getDashboardSummary();

  return (
    <main style={{ padding: "0 0 2rem" }}>
      {/* Hero de bienvenida */}
      <section
        className="card"
        style={{
          border: "1px solid rgba(126, 192, 167, 0.2)",
          background:
            "linear-gradient(135deg, rgba(126,192,167,0.08) 0%, rgba(15,27,36,1) 100%)",
        }}
      >
        <h1 style={{ fontSize: "2rem", margin: 0, color: "var(--accent)" }}>
          Panel de Operaciones
        </h1>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
          Bienvenido al sistema interno de Nexova. Gestión de talento y análisis
          de incidencias desde un único lugar.
        </p>
      </section>

      {/* Acceso rápido a módulos */}
      <section
        className="grid"
        style={{ marginTop: "1.5rem" }}
      >
        <Link
          href="/incidents"
          style={{ textDecoration: "none" }}
        >
          <article
            className="card module-card"
            style={{
              cursor: "pointer",
              height: "100%",
            }}
          >
            <h3 style={{ margin: 0, color: "var(--accent)" }}>
              Análisis de Incidencias
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Sube archivos CSV de tickets de soporte, obtén métricas de
              validación, desgloses por categoría y estado, y exporta
              resultados.
            </p>
          </article>
        </Link>

        <article className="card">
          <h3 style={{ margin: 0, color: "var(--accent)" }}>
            Pipeline de Talentos
          </h3>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Seguimiento de postulaciones, estadísticas de contratación y gestión
            de candidatos. (Próximamente)
          </p>
        </article>

        <Link
          href="/suppliers"
          style={{ textDecoration: "none" }}
        >
          <article
            className="card module-card"
            style={{
              cursor: "pointer",
              height: "100%",
            }}
          >
            <h3 style={{ margin: 0, color: "var(--accent)" }}>
              Directorio de Proveedores
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Registro oficial de proveedores externos de Nexova. Filtros por
              país y categoría, actualización de tarifas y control de estado.
            </p>
          </article>
        </Link>
      </section>

      {/* Métricas de negocio */}
      <h2 style={{ marginTop: "2rem" }}>Resumen de Talento</h2>
      <section className="grid" style={{ marginTop: "1.2rem" }}>
        <article className="card">
          <p style={{ margin: 0, color: "var(--muted)" }}>Total candidatos</p>
          <strong style={{ fontSize: "1.8rem" }}>
            {summary.totalCandidates}
          </strong>
        </article>
        <article className="card">
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Salario esperado promedio
          </p>
          <strong style={{ fontSize: "1.8rem" }}>
            ${summary.averageExpectedSalary}
          </strong>
        </article>
        <article className="card">
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Match stack core (TS + React)
          </p>
          <strong style={{ fontSize: "1.8rem" }}>
            {summary.matchedForCoreStack}
          </strong>
        </article>
      </section>

      {/* Detalle de lógica de negocio */}
      <section style={{ marginTop: "1.5rem" }} className="card">
        <h2 style={{ marginTop: 0 }}>Detalle de Candidatos</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
          }}
        >
          <div>
            <h3 style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>
              Top Skills
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0" }}>Skill</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0" }}>Conteo</th>
                </tr>
              </thead>
              <tbody>
                {summary.topSkills.map((item) => (
                  <tr key={item.skill} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem 0" }}>{item.skill}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0" }}>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>
              Estado de Candidatos
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0" }}>Estado</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0" }}>Candidatos</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.statusBreakdown).map(([status, count]) => (
                  <tr key={status} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem 0" }}>{status}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0" }}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ color: "var(--muted)", marginTop: "1rem", fontSize: "0.9rem" }}>
          Puntaje del perfil líder para la vacante objetivo:{" "}
          <strong style={{ color: "var(--accent)" }}>{summary.leadScore}/100</strong>
        </p>
      </section>
    </main>
  );
}
