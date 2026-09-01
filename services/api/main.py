#!/usr/bin/env python3
"""
main.py — Nexova Suppliers Directory · FastAPI application
============================================================
App principal del Directorio de Proveedores.

Configura FastAPI con CORS para el frontend (backoffice Next.js),
incluye las rutas de suppliers y permite ejecutarse con uvicorn.

Uso:
    uvicorn services.api.main:app --reload
    python3 -m services.api.main
"""

import sys
import os

# ── Asegurar que el repo root está en sys.path ──────────
_REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.routes.suppliers import router as suppliers_router
from services.api.seed import seed_suppliers


# ══════════════════════════════════════════════════════════
#  Lifespan handler (startup seed)
# ══════════════════════════════════════════════════════════


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Carga los datos semilla al arrancar la aplicación."""
    seed_suppliers()
    yield


# ══════════════════════════════════════════════════════════
#  App
# ══════════════════════════════════════════════════════════

app = FastAPI(
    title="Nexova API — Directorio de Proveedores",
    description=(
        "API REST para el Directorio de Proveedores de Nexova. "
        "Permite gestionar el registro oficial de proveedores externos "
        "(plataformas de empleo, ATS, formación, software, etc.) "
        "que Patricia Solís necesita para reemplazar la hoja de cálculo compartida."
    ),
    version="1.1.0",
    lifespan=lifespan,
)

# ── CORS: permitir que el frontend (Next.js backoffice) se comunique ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Incluir rutas de suppliers ──────────────────────────
app.include_router(suppliers_router)


# ══════════════════════════════════════════════════════════
#  Health check
# ══════════════════════════════════════════════════════════


@app.get("/health", tags=["system"])
async def health_check():
    """Endpoint de salud para verificar que la API responde."""
    return {"status": "ok", "version": "1.1.0", "service": "suppliers-directory"}


# ══════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "services.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )