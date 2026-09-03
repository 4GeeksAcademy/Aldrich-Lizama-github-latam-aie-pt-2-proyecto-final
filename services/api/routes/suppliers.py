#!/usr/bin/env python3
"""
routes/suppliers.py — Nexova Suppliers Directory · Endpoints
=============================================================
APIRouter con los endpoints del directorio de proveedores.

Endpoints:
  POST   /suppliers          → Crear proveedor (201)
  GET    /suppliers          → Listar (filtros opcionales: country, category)
  GET    /suppliers/{id}     → Obtener detalle por ID (404 si no existe)
  PATCH  /suppliers/{id}/rate    → Actualizar tarifa mensual
  PATCH  /suppliers/{id}/status  → Activar / suspender
  DELETE /suppliers/{id}     → Eliminar proveedor (404 si no existe)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user
from services.api.database import get_suppliers_table
from services.api.models import (
    SupplierCreate,
    SupplierResponse,
    SupplierRateUpdate,
    SupplierStatusUpdate,
    now_iso,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


# ══════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════


def _doc_to_response(doc_id: int, doc: dict) -> SupplierResponse:
    """Convierte un documento TinyDB a SupplierResponse con id string."""
    doc["id"] = str(doc_id)
    return SupplierResponse(**doc)


def _get_supplier_or_404(supplier_id: int) -> tuple[int, dict]:
    """Obtiene un documento por doc_id o lanza HTTP 404.

    También retorna 404 si el proveedor fue deshabilitado (soft-delete).
    """
    table = get_suppliers_table()
    doc = table.get(doc_id=supplier_id)
    if doc is None or doc.get("deleted_at") is not None:
        raise HTTPException(
            status_code=404,
            detail=f"Proveedor con id '{supplier_id}' no encontrado",
        )
    return supplier_id, doc


# ══════════════════════════════════════════════════════════
#  POST /suppliers — Crear nuevo proveedor
# ══════════════════════════════════════════════════════════


@router.post("", response_model=SupplierResponse, status_code=201)
async def create_supplier(payload: SupplierCreate):
    """Registra un nuevo proveedor en el directorio.

    Valida los datos con el modelo Pydantic (devuelve 422 si falla la validación).
    Asigna updated_at automáticamente antes de insertar.
    Retorna la entidad creada con su id.
    """
    table = get_suppliers_table()
    doc = payload.model_dump()
    doc["updated_at"] = now_iso()
    doc_id = table.insert(doc)
    return _doc_to_response(doc_id, doc)


# ══════════════════════════════════════════════════════════
#  GET /suppliers — Listar (con filtros opcionales)
# ══════════════════════════════════════════════════════════


@router.get("", response_model=list[SupplierResponse], dependencies=[Depends(get_current_user)])
async def list_suppliers(
    country: Optional[str] = Query(None, description="Filtrar por país: Spain / USA"),
    category: Optional[str] = Query(
        None, description="Filtrar por categoría (ej: job_boards, ats_software)"
    ),
):
    """Retorna el listado de proveedores activos (no eliminados).

    Soporta parámetros opcionales de query `country` y `category`
    para filtrar los registros sin romper el retorno si no hay filtros.
    Los filtros son combinables: ?country=Spain&category=job_boards
    Los proveedores deshabilitados (soft-delete) se excluyen automáticamente.
    """
    table = get_suppliers_table()
    docs = table.all()
    suppliers = []

    for doc in docs:
        doc_id = doc.doc_id

        # Excluir proveedores eliminados (soft-delete)
        if doc.get("deleted_at") is not None:
            continue

        # Filtro por país
        if country and doc.get("country") != country:
            continue

        # Filtro por categoría (el proveedor puede tener varias)
        if category:
            cats = doc.get("categories", [])
            if category not in cats:
                continue

        doc["id"] = str(doc_id)
        suppliers.append(SupplierResponse(**doc))

    return suppliers


# ══════════════════════════════════════════════════════════
#  GET /suppliers/{id} — Detalle por ID
# ══════════════════════════════════════════════════════════


@router.get("/{supplier_id}", response_model=SupplierResponse, dependencies=[Depends(get_current_user)])
async def get_supplier(supplier_id: int):
    """Retorna el detalle del proveedor por ID.

    Los proveedores deshabilitados (soft-delete) retornan 404.
    Retorna 404 con mensaje si el ID no existe.
    """
    doc_id, doc = _get_supplier_or_404(supplier_id)
    return _doc_to_response(doc_id, doc)


# ══════════════════════════════════════════════════════════
#  PATCH /suppliers/{id}/rate — Actualizar tarifa
# ══════════════════════════════════════════════════════════


@router.patch("/{supplier_id}/rate", response_model=SupplierResponse, dependencies=[Depends(get_current_user)])
async def update_supplier_rate(supplier_id: int, payload: SupplierRateUpdate):
    """Actualiza la tarifa mensual de un proveedor.

    Genera y actualiza automáticamente el timestamp updated_at.
    Rechaza tarifas <= 0 (validado por el modelo Pydantic → 422).
    """
    doc_id, doc = _get_supplier_or_404(supplier_id)
    table = get_suppliers_table()

    doc["monthly_rate"] = payload.monthly_rate
    doc["updated_at"] = now_iso()

    table.update(doc, doc_ids=[doc_id])
    return _doc_to_response(doc_id, doc)


# ══════════════════════════════════════════════════════════
#  PATCH /suppliers/{id}/status — Activar / suspender
# ══════════════════════════════════════════════════════════


@router.patch("/{supplier_id}/status", response_model=SupplierResponse, dependencies=[Depends(get_current_user)])
async def update_supplier_status(supplier_id: int, payload: SupplierStatusUpdate):
    """Activa o suspende un proveedor.

    Solo acepta 'active' o 'suspended' (validado por Pydantic → 422 si es inválido).
    """
    doc_id, doc = _get_supplier_or_404(supplier_id)
    table = get_suppliers_table()

    doc["status"] = payload.status
    table.update(doc, doc_ids=[doc_id])
    return _doc_to_response(doc_id, doc)


# ══════════════════════════════════════════════════════════
#  DELETE /suppliers/{id} — Eliminar proveedor
# ══════════════════════════════════════════════════════════


@router.delete("/{supplier_id}", response_model=SupplierResponse, dependencies=[Depends(get_current_user)])
async def delete_supplier(supplier_id: int):
    """Deshabilita un proveedor (soft-delete).

    En lugar de eliminar el registro, lo marca con un timestamp `deleted_at`
    para que no aparezca en el listado pero se conserve en la base de datos.
    Retorna el proveedor con los datos actualizados.
    Retorna 404 si el registro no existe.
    """
    doc_id, doc = _get_supplier_or_404(supplier_id)
    table = get_suppliers_table()

    # Si ya está eliminado, retornar error
    if doc.get("deleted_at") is not None:
        raise HTTPException(
            status_code=404,
            detail=f"Proveedor con id '{supplier_id}' no encontrado",
        )

    doc["deleted_at"] = now_iso()
    doc["status"] = "suspended"  # Suspender automáticamente al deshabilitar
    table.update(doc, doc_ids=[doc_id])
    return _doc_to_response(doc_id, doc)