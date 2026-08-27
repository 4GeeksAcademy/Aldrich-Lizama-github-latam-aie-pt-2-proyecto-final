"use client";

// ────────────────────────────────────────────────────────────
//  page.tsx — Página de Análisis de Incidencias
// ────────────────────────────────────────────────────────────
//  Orquesta la carga del CSV, llama al backend y renderiza
//  todos los componentes de visualización.
// ────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import type { AnalysisResult, AnalysisStatus, UploadedFileInfo } from "./types";
import { uploadAndAnalyze } from "./api";
import CsvUploader from "./components/CsvUploader";
import MetricsCards from "./components/MetricsCards";
import BreakdownTable from "./components/BreakdownTable";
import SatisfactionIndex from "./components/SatisfactionIndex";
import InvalidRecordsAlert from "./components/InvalidRecordsAlert";
import ExportButton from "./components/ExportButton";

export default function IncidentsPage() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<UploadedFileInfo | null>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    setFileInfo({ name: file.name, size: file.size });
    setError(null);
    setResult(null);
    setStatus("uploading");

    try {
      setStatus("analyzing");
      const data = await uploadAndAnalyze(file);
      setResult(data);
      setStatus("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setFileInfo(null);
  }, []);

  const isLoading = status === "uploading" || status === "analyzing";

  return (
    <main className="wrapper" style={{ padding: "1.5rem 0 2rem" }}>
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", margin: 0 }}>Análisis de Incidencias</h1>
          <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
            Subí un archivo CSV con tickets de soporte para obtener métricas, validaciones y
            reportes.
          </p>
        </div>

        {result && <ExportButton />}
      </div>

      {/* Uploader */}
      <CsvUploader onFileSelected={handleFileSelected} disabled={isLoading} />

      {/* Info del archivo */}
      {fileInfo && (
        <p
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.8rem",
            color: "var(--muted)",
          }}
        >
          Archivo: <strong>{fileInfo.name}</strong> ({(fileInfo.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            textAlign: "center",
            color: "var(--accent)",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 0.5rem",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          {status === "uploading"
            ? "Subiendo archivo…"
            : "Analizando incidencias…"}
        </div>
      )}

      {/* Error */}
      {status === "error" && error && (
        <div
          className="card"
          style={{
            marginTop: "1.5rem",
            borderColor: "#f87171",
            background: "rgba(248, 113, 113, 0.06)",
          }}
        >
          <p style={{ margin: 0, color: "#f87171", fontWeight: 600 }}>
            Error al analizar el archivo
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
            {error}
          </p>
          <button
            onClick={handleReset}
            style={{
              marginTop: "0.75rem",
              padding: "0.4rem 1rem",
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <>
          {/* Métricas principales */}
          <MetricsCards data={result} />

          {/* Panel de alertas */}
          {result.invalid_count > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <InvalidRecordsAlert data={result} />
            </div>
          )}

          {/* Desgloses: categoría y estado */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            <BreakdownTable
              title="Desglose por categoría"
              data={result.category_counts}
              barColor="var(--accent)"
            />
            <BreakdownTable
              title="Desglose por estado"
              data={result.status_counts}
              barColor="#4ade80"
            />
          </div>

          {/* Índice de satisfacción */}
          <div style={{ marginTop: "1.5rem" }}>
            <SatisfactionIndex data={result} />
          </div>
        </>
      )}
    </main>
  );
}