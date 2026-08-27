import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexova Backoffice",
  description: "Panel interno para operaciones de talento en Nexova.",
};

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <header
          style={{
            borderBottom: "1px solid var(--border)",
            backdropFilter: "blur(8px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            className="wrapper"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem 0",
            }}
          >
            <Link
              href="/"
              style={{
                textDecoration: "none",
                color: "var(--accent)",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              Nexova Backoffice
            </Link>

            <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <Link
                href="/"
                style={{
                  color: "var(--muted)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/incidents"
                style={{
                  color: "var(--muted)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
              >
                Análisis de Incidencias
              </Link>
            </nav>

            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Operaciones Internas
            </span>
          </div>
        </header>
        <div className="wrapper" style={{ padding: "1.5rem 0 3rem" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
