import type { Metadata } from "next";
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
          }}
        >
          <div
            className="wrapper"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 0",
            }}
          >
            <strong style={{ color: "var(--accent)" }}>
              Nexova Backoffice
            </strong>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Operaciones de Seleccion
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
