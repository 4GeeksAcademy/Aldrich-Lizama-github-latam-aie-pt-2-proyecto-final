export default function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        backdropFilter: "blur(8px)",
        background: "rgba(225, 226, 222, 0.9)",
        zIndex: 20,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
        }}
      >
        <strong style={{ fontSize: "1.2rem" }}>Nexova</strong>
        <nav
          aria-label="Navegacion principal"
          style={{ display: "flex", gap: "1rem", fontWeight: 600 }}
        >
          <a href="#inicio">Inicio</a>
          <a href="#servicios">Servicios</a>
          <a href="#talento">Talento</a>
          <a href="#contacto">Contacto</a>
        </nav>
      </div>
    </header>
  );
}
