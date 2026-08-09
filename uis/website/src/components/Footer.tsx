export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--accent)",
        marginTop: "2rem",
      }}
    >
      <div
        className="container"
        style={{ padding: "1rem 0", fontSize: "0.95rem" }}
      >
        <p style={{ margin: 0 }}>
          &copy; 2025 Nexova. Todos los derechos reservados.
        </p>
        <p style={{ marginTop: "0.45rem" }}>
          <a
            href="https://linkedin.com/company/nexova"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>{" "}
          |{" "}
          <a
            href="https://instagram.com/nexova"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
        </p>
      </div>
    </footer>
  );
}
