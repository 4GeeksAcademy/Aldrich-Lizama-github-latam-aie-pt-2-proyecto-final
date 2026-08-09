import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexova | Consultora de Recursos Humanos y Talento",
  description:
    "Consultora de recursos humanos y adquisicion de talento con mas de 10 anos ayudando a empresas de tecnologia, retail y servicios financieros.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
