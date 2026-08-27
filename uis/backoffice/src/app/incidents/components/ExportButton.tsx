"use client";

// ────────────────────────────────────────────────────────────
//  ExportButton.tsx — Botón para descargar reporte CSV
// ────────────────────────────────────────────────────────────

import { downloadExport } from "../api";

interface Props {
  disabled?: boolean;
}

export default function ExportButton({ disabled = false }: Props) {
  return (
    <button
      onClick={downloadExport}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.65rem 1.5rem",
        background: "var(--accent)",
        color: "#0f1b24",
        border: "none",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "0.9rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Icono de descarga SVG */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Exportar CSV
    </button>
  );
}