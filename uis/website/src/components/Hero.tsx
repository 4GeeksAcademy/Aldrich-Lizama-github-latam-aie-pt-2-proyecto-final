export default function Hero() {
  return (
    <section id="inicio" className="section">
      <div
        className="container"
        style={{
          display: "grid",
          gap: "1.2rem",
          gridTemplateColumns: "1.2fr 1fr",
        }}
      >
        <div>
          <p
            style={{
              display: "inline-block",
              background: "var(--accent)",
              borderRadius: "999px",
              padding: "0.25rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            Desde 2011
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 6vw, 3.2rem)",
              lineHeight: 1.1,
              margin: "0.8rem 0",
            }}
          >
            Construimos equipos excepcionales para empresas en crecimiento
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem" }}>
            Consultora de recursos humanos y adquisicion de talento con mas de
            10 anos ayudando a empresas de tecnologia, retail y servicios
            financieros a encontrar y desarrollar el mejor talento.
          </p>
          <a
            href="/talent"
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
          >
            Unete a nuestro banco de talento
          </a>
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
            alt="Equipo de talento en reunion"
            style={{
              width: "100%",
              borderRadius: "0.8rem",
              minHeight: "280px",
              objectFit: "cover",
            }}
          />
          <p style={{ marginTop: "0.6rem", color: "var(--muted)" }}>
            Talento estrategico para escalar operaciones con confianza.
          </p>
        </div>
      </div>
    </section>
  );
}
