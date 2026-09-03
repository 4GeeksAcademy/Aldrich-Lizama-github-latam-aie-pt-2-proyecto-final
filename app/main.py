#!/usr/bin/env python3
"""
main.py — Nexova API · FastAPI Application
=============================================
Aplicación principal de la API de Nexova.

Integra los routers de autenticación (``/auth``), usuarios (``/users``),
perfiles (``/profiles``) y proveedores (``/suppliers``).

Uso:
    uvicorn app.main:app --reload
    python3 -m app.main
"""

import sys
import os

# ── Asegurar que el repo root está en sys.path ──────────
_REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Routers de autenticación, usuarios y perfiles ──────
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.profiles import router as profiles_router

# ── Router de proveedores (Suppliers Directory) ─────────
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
    title="Nexova API",
    description=(
        "API central de Nexova. Proporciona autenticación JWT, "
        "gestión de usuarios y perfiles, y el directorio de proveedores."
    ),
    version="1.3.0",
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

# ── Incluir routers ─────────────────────────────────────
app.include_router(auth_router)      # /auth
app.include_router(users_router)     # /users
app.include_router(profiles_router)  # /profiles
app.include_router(suppliers_router) # /suppliers


# ══════════════════════════════════════════════════════════
#  Health check
# ══════════════════════════════════════════════════════════


@app.get("/", tags=["system"])
async def root():
    """Redirige a la documentación interactiva de la API."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["system"])
async def health_check():
    """Endpoint de salud para verificar que la API responde."""
    return {
        "status": "ok",
        "version": "1.3.0",
        "endpoints": {
            "POST /auth/login": "Iniciar sesión",
            "GET /auth/me": "Usuario autenticado (protegido)",
            "POST /users": "Registro público",
            "GET /users": "Listar usuarios (protegido)",
            "GET /users/{id}": "Detalle usuario (protegido)",
            "PUT /users/{id}": "Actualizar usuario (protegido)",
            "DELETE /users/{id}": "Eliminar usuario (protegido)",
            "GET /profiles/me": "Mi perfil (protegido)",
            "PUT /profiles/me": "Actualizar perfil (protegido)",
            "GET /suppliers": "Listar proveedores (protegido)",
            "GET /suppliers/{id}": "Detalle proveedor (protegido)",
            "POST /suppliers": "Crear proveedor",
            "PATCH /suppliers/{id}/rate": "Actualizar tarifa (protegido)",
            "PATCH /suppliers/{id}/status": "Activar/suspender (protegido)",
            "DELETE /suppliers/{id}": "Eliminar proveedor (protegido)",
        },
    }


# ══════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )