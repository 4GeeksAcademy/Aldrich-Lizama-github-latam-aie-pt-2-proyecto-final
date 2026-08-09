export default function Contact() {
  return (
    <section id="contacto" className="section">
      <div className="container">
        <div
          className="card"
          style={{
            background: "var(--brand)",
            color: "var(--bg)",
            padding: "1.4rem",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Contacto</h2>
          <ul style={{ color: "var(--accent)" }}>
            <li>Email: contacto@nexova.com</li>
            <li>Valencia: +34 960 123 456</li>
            <li>Miami: +1 305 555 0191</li>
          </ul>
          <a
            href="/talent"
            className="btn"
            style={{
              background: "var(--bg)",
              color: "var(--brand)",
              marginTop: "0.4rem",
            }}
          >
            Ir al formulario de talento
          </a>
        </div>
      </div>
    </section>
  );
}
