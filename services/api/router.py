#!/usr/bin/env python3
"""
router.py — Nexova Suppliers Directory · FastAPI CRUD router
===============================================================
APIRouter con prefijo /api/suppliers.

Endpoints:
  GET    /api/suppliers           → Listar (filtros: country, category)
  GET    /api/suppliers/{id}      → Obtener uno
  POST   /api/suppliers           → Registrar nuevo
  PUT    /api/suppliers/{id}/rate → Actualizar tarifa
  PUT    /api/suppliers/{id}/status → Activar / suspender
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from services.api.database import get_suppliers_table
from services.api.models import (
    SupplierCreate,
    SupplierResponse,
    SupplierRateUpdate,
    SupplierStatusUpdate,
    now_iso,
)

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


# ══════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════


def _doc_to_response(doc_id: int, doc: dict) -> SupplierResponse:
    """Convierte un documento de TinyDB a SupplierResponse."""
    doc["id"] = str(doc_id)
    return SupplierResponse(**doc)


def _get_doc_or_404(doc_id: int):
    """Obtiene un documento por doc_id o lanza HTTP 404."""
    table = get_suppliers_table()
    doc = table.get(doc_id=doc_id)
    if doc is None:
        raise HTTPException(
            status_code=404,
            detail=f"Proveedor con id '{doc_id}' no encontrado",
        )
    return doc_id, doc


# ══════════════════════════════════════════════════════════
#  Endpoints
# ══════════════════════════════════════════════════════════


@router.get("", response_model=list[SupplierResponse])
async def list_suppliers(
    country: Optional[str] = Query(None, description="Filtrar por país: Spain / USA"),
    category: Optional[str] = Query(
        None, description="Filtrar por categoría (ej: job_boards, ats_software)"
    ),
):
    """Lista todos los proveedores, opcionalmente filtrados por país y/o categoría.

    Filtros combinables: ?country=Spain&category=job_boards
    """
    table = get_suppliers_table()
    # TinyDB 4+ Document es un dict con atributo .doc_id
    docs = table.all()
    suppliers = []

    for doc in docs:
        doc_id = doc.doc_id

        # Filtro por país
        if country and doc.get("country") != country:
            continue

        # Filtro por categoría (el supplier puede tener varias)
        if category:
            cats = doc.get("categories", [])
            if category not in cats:
                continue

        doc["id"] = str(doc_id)
        suppliers.append(SupplierResponse(**doc))

    return suppliers


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int):
    """Obtiene un proveedor por su id numérico (doc_id de TinyDB)."""
    doc_id, doc = _get_doc_or_404(supplier_id)
    return _doc_to_response(doc_id, doc)


@router.post(
    "",
    response_model=SupplierResponse,
    status_code=201,
)
async def create_supplier(payload: SupplierCreate):
    """Registra un nuevo proveedor en el directorio."""
    table = get_suppliers_table()
    doc = payload.model_dump()
    doc["updated_at"] = now_iso()
    doc_id = table.insert(doc)
    return _doc_to_response(doc_id, doc)


@router.put("/{supplier_id}/rate", response_model=SupplierResponse)
async def update_supplier_rate(supplier_id: int, payload: SupplierRateUpdate):
    """Actualiza la tarifa mensual de un proveedor. Registra updated_at automáticamente."""
    doc_id, doc = _get_doc_or_404(supplier_id)
    table = get_suppliers_table()

    doc["monthly_rate"] = payload.monthly_rate
    doc["updated_at"] = now_iso()

    table.update(doc, doc_ids=[doc_id])
    return _doc_to_response(doc_id, doc)


@router.put("/{supplier_id}/status", response_model=SupplierResponse)
async def update_supplier_status(supplier_id: int, payload: SupplierStatusUpdate):
    """Activa o suspende un proveedor sin eliminarlo."""
    doc_id, doc = _get_doc_or_404(supplier_id)
    table = get_suppliers_table()

    doc["status"] = payload.status

    table.update(doc, doc_ids=[doc_id])
    return _doc_to_response(doc_id, doc)