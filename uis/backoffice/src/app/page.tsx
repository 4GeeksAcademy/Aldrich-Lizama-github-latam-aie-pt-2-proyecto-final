import { getDashboardSummary } from "@/lib/business-summary";

export default function BackofficeHomePage() {
  const summary = getDashboardSummary();

  return (
    <main className="wrapper" style={{ padding: "1.5rem 0 2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
        Dashboard Inicial
      </h1>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        Vista de bienvenida conectada a la logica TypeScript existente del
        monorepo (Hito 2).
      </p>

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

      <section style={{ marginTop: "1rem" }} className="card">
        <h2 style={{ marginTop: 0 }}>
          Resultado del script de logica de negocio
        </h2>
        <p style={{ color: "var(--muted)" }}>
          Puntaje del perfil lider para la vacante objetivo: {summary.leadScore}
          /100
        </p>
        <h3>Top skills detectadas</h3>
        <ul>
          {summary.topSkills.map((item) => (
            <li key={item.skill}>
              {item.skill}: {item.count}
            </li>
          ))}
        </ul>
        <h3>Estado de candidatos</h3>
        <ul>
          {Object.entries(summary.statusBreakdown).map(([status, count]) => (
            <li key={status}>
              {status}: {count}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
