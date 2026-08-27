"use client";

// ────────────────────────────────────────────────────────────
//  CsvUploader.tsx — Componente de carga Drag & Drop + selector
// ────────────────────────────────────────────────────────────

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";

interface Props {
  /** Se dispara cuando el usuario selecciona/suelta un archivo CSV */
  onFileSelected: (file: File) => void;
  /** Deshabilita la interacción mientras se está subiendo/analizando */
  disabled?: boolean;
}

export default function CsvUploader({ onFileSelected, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Solo se permiten archivos CSV.");
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  const onDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setDragging(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset para permitir re-seleccionar el mismo archivo
      e.target.value = "";
    },
    [handleFile],
  );

  const openFilePicker = () => inputRef.current?.click();

  const borderColor = dragging
    ? "var(--accent)"
    : disabled
      ? "var(--border)"
      : "var(--border)";

  const bgColor = dragging
    ? "rgba(126, 192, 167, 0.08)"
    : disabled
      ? "rgba(20, 39, 53, 0.4)"
      : "rgba(20, 39, 53, 0.8)";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Subir archivo CSV de incidencias"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openFilePicker();
      }}
      onClick={openFilePicker}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{
        border: `2px dashed ${borderColor}`,
        borderRadius: "0.9rem",
        background: bgColor,
        padding: "2.5rem 1.5rem",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color 0.2s, background 0.2s",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={onInputChange}
        disabled={disabled}
      />

      {/* Icono SVG de upload */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke={dragging ? "var(--accent)" : "var(--muted)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: "0.75rem" }}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>

      <p style={{ margin: "0 0 0.25rem", color: "var(--text)", fontWeight: 600 }}>
        {dragging
          ? "Suelta el archivo aquí"
          : "Arrastra un archivo CSV o haz clic para seleccionar"}
      </p>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
        Solo archivos <strong>.csv</strong> con formato incidents-COMPANY.csv
      </p>
    </div>
  );
}