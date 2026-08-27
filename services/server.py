#!/usr/bin/env python3
"""
server.py — Nexova Incidents Analysis API Server
=================================================
FastAPI server que expone los endpoints necesarios para el frontend
de "Análisis de Incidencias" en el backoffice.

Endpoints:
  POST /api/incidents/analyze        → Subir CSV, devolver AnalysisResult (JSON)
  GET  /api/incidents/results/export  → Descargar CSV de resultados

Uso:
    python services/server.py
    # Escucha en http://localhost:8000
"""

import csv
import sys
import os
from io import StringIO
from typing import Optional

# ── Asegurar que el paquete reutilizable es importable ────
_PACKAGES_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "packages")
)
if _PACKAGES_PATH not in sys.path:
    sys.path.insert(0, _PACKAGES_PATH)

# ── Intentar importar dependencias ────────────────────────
try:
    from fastapi import FastAPI, File, UploadFile, HTTPException
    from fastapi.responses import PlainTextResponse, Response
    from fastapi.middleware.cors import CORSMiddleware
except ImportError:
    print("FastAPI no está instalado. Ejecutá: pip3 install fastapi uvicorn")
    sys.exit(1)

from nexova_analyzer import analyze_rows, export_csv_string, format_report_text

# ══════════════════════════════════════════════════════════
#  App
# ══════════════════════════════════════════════════════════

app = FastAPI(
    title="Nexova Incidents Analysis API",
    description="API para analizar archivos CSV de tickets de soporte Nexova",
    version="1.0.0",
)

# ── CORS: permitir que el frontend (Next.js) se comunique ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════
#  Endpoints
# ══════════════════════════════════════════════════════════


@app.get("/")
async def root():
    """Health check / información básica."""
    return {
        "service": "Nexova Incidents Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/incidents/analyze": "Subir CSV para análisis",
            "GET /api/incidents/results/export": "Descargar resultados CSV",
        },
    }


@app.post("/api/incidents/analyze")
async def analyze_incidents(file: UploadFile = File(...)):
    """
    Recibe un archivo CSV de tickets, lo analiza y devuelve
    el resultado como JSON.
    """
    # Validar extensión
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos con extensión .csv",
        )

    # Leer contenido
    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # soporta BOM
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="El archivo no es UTF-8 válido")

    # Parsear CSV
    reader = csv.DictReader(StringIO(text))
    rows = list(reader)

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="El archivo CSV está vacío o no tiene filas de datos",
        )

    # Analizar
    try:
        stats = analyze_rows(rows, source_name=file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al analizar: {str(e)}",
        )

    return stats.to_dict()


@app.get("/api/incidents/results/export")
async def export_results():
    """
    Endpoint GET para exportar resultados.
    NOTA: Este endpoint requiere que el análisis se haya hecho antes.
    En una implementación real, se debería almacenar el último resultado
    en memoria o base de datos.

    Por ahora, se puede usar con --export en el CLI o con una sesión.
    """
    return PlainTextResponse(
        content="""# Nexova Results Export
# Usá el CLI para exportar: python scripts/analyze.py <archivo.csv> --export
# O accedé a POST /api/incidents/analyze primero.
""",
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=results.csv",
        },
    )


# ══════════════════════════════════════════════════════════
#  Main
# ══════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    print(f"🔧 Nexova API corriendo en http://localhost:{port}")
    print(f"   📥 POST /api/incidents/analyze  — Subir CSV")
    print(f"   📤 GET  /api/incidents/results/export — Descargar CSV")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)