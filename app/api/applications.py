#!/usr/bin/env python3
"""
applications.py — Nexova API · Endpoints de Postulaciones y Fichas
====================================================================
APIRouter con los endpoints para gestionar las postulaciones del
usuario autenticado y su ficha de auto-llenado.

Tablas:
  - applications       → Postulaciones del usuario
  - application_cards  → Fichas de auto-llenado del usuario

Endpoints:
  GET    /applications         → Listar postulaciones del usuario autenticado
  POST   /applications         → Crear una nueva postulación
  PUT    /applications/{id}    → Actualizar una postulación
  DELETE /applications/{id}    → Eliminar una postulación

  GET    /applications/card    → Obtener la ficha del usuario autenticado
  PUT    /applications/card    → Crear o actualizar la ficha
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])


# ══════════════════════════════════════════════════════════════
#  Schemas
# ══════════════════════════════════════════════════════════════


class ApplicationCreate(BaseModel):
    job_title: str = Field(..., min_length=1, max_length=200)
    company_name: str = Field(..., min_length=1, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    status: str = Field(default="pending", pattern=r"^(pending|reviewing|accepted|rejected)$")
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    job_title: Optional[str] = Field(None, min_length=1, max_length=200)
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(None, pattern=r"^(pending|reviewing|accepted|rejected)$")
    notes: Optional[str] = None


class ApplicationCardCreate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=30)
    address: Optional[str] = Field(None, max_length=250)
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    linkedin: Optional[str] = Field(None, max_length=300)
    portfolio: Optional[str] = Field(None, max_length=300)
    availability: Optional[str] = Field(None, max_length=100)


# ══════════════════════════════════════════════════════════════
#  GET /applications — Listar postulaciones
# ══════════════════════════════════════════════════════════════


@router.get("/")
async def list_applications(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Retorna todas las postulaciones del usuario autenticado."""
    user_id = current_user["id"]
    from app.services.db_service import _get_db

    db = _get_db()
    table = db.table("applications")
    Application = type("Query", (), {})()
    # Simulamos query por user_id con TinyDB
    results = []
    for doc in table.all():
        if doc.get("user_id") == user_id:
            results.append({**doc, "id": doc.doc_id})
    return results


# ══════════════════════════════════════════════════════════════
#  POST /applications — Crear postulación
# ══════════════════════════════════════════════════════════════


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Registra una nueva postulación para el usuario autenticado."""
    from datetime import datetime, timezone
    from app.services.db_service import _get_db

    db = _get_db()
    table = db.table("applications")
    doc_id = table.insert({
        "user_id": current_user["id"],
        "job_title": payload.job_title,
        "company_name": payload.company_name,
        "location": payload.location,
        "status": payload.status,
        "notes": payload.notes,
        "applied_at": datetime.now(timezone.utc).isoformat(),
    })
    doc = table.get(doc_id=doc_id)
    return {**doc, "id": doc_id}


# ══════════════════════════════════════════════════════════════
#  GET /applications/card — Obtener ficha del usuario
#  (Debe estar ANTES de /{app_id} para evitar conflicto de ruta)
# ══════════════════════════════════════════════════════════════


@router.get("/card")
async def get_my_card(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Retorna la ficha de auto-llenado del usuario autenticado.

    Si no existe, retorna un objeto vacío (el frontend puede
    detectar ausencia de ``id``).
    """
    from app.services.db_service import _get_db

    db = _get_db()
    table = db.table("application_cards")
    for doc in table.all():
        if doc.get("user_id") == current_user["id"]:
            return {**doc, "id": doc.doc_id}
    return {}


# ══════════════════════════════════════════════════════════════
#  PUT /applications/card — Crear o actualizar ficha
#  (Debe estar ANTES de /{app_id} para evitar conflicto de ruta)
# ══════════════════════════════════════════════════════════════


@router.put("/card")
async def upsert_my_card(
    payload: ApplicationCardCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Crea o actualiza la ficha de auto-llenado del usuario autenticado.

    - Si ya existe una ficha para el usuario, la actualiza.
    - Si no existe, la crea.
    """
    from app.services.db_service import _get_db

    db = _get_db()
    table = db.table("application_cards")
    user_id = current_user["id"]

    # Buscar ficha existente
    existing_id = None
    for doc in table.all():
        if doc.get("user_id") == user_id:
            existing_id = doc.doc_id
            break

    update_data = payload.model_dump(exclude_none=True)

    if existing_id is not None:
        table.update(update_data, doc_ids=[existing_id])
        updated = table.get(doc_id=existing_id)
        return {**updated, "id": existing_id}
    else:
        update_data["user_id"] = user_id
        doc_id = table.insert(update_data)
        doc = table.get(doc_id=doc_id)
        return {**doc, "id": doc_id}


# ══════════════════════════════════════════════════════════════
#  PUT /applications/{app_id} — Actualizar postulación
# ══════════════════════════════════════════════════════════════


@router.put("/{app_id}")
async def update_application(
    app_id: int,
    payload: ApplicationUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Actualiza los campos de una postulación (solo del usuario autenticado)."""
    from app.services.db_service import _get_db

    db = _get_db()
    table = db.table("applications")
    doc = table.get(doc_id=app_id)
    if doc is None or doc.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulación no encontrada",
        )

    clean = {k: v for k, v in payload.model_dump(exclude_none=True).items() if v is not None}
    if clean:
        table.update(clean, doc_ids=[app_id])

    updated = table.get(doc_id=app_id)
    return {**updated, "id": app_id}


# ══════════════════════════════════════════════════════════════
#  DELETE /applications/{app_id} — Eliminar postulación
# ══════════════════════════════════════════════════════════════


@router.delete("/{app_id}")
async def delete_application(
    app_id: int,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    """Elimina una postulación (solo del usuario autenticado)."""
    from app.services.db_service import _get_db

    db = _get_db()
    table = db.table("applications")
    doc = table.get(doc_id=app_id)
    if doc is None or doc.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulación no encontrada",
        )

    table.remove(doc_ids=[app_id])
    return {"message": "Postulación eliminada correctamente."}
#  PUT /applications/card — Crear o actualizar ficha
# ══════════════════════════════════════════════════════════════


@router.put("/card")
async def upsert_my_card(
    payload: ApplicationCardCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Crea o actualiza la ficha de auto-llenado del usuario."""
    from datetime import datetime, timezone
    from app.services.db_service import _get_db

    db = _get_db()
    table = db.table("application_cards")
    user_id = current_user["id"]

    # Buscar si ya existe
    existing_id = None
    for doc in table.all():
        if doc.get("user_id") == user_id:
            existing_id = doc.doc_id
            break

    data = payload.model_dump(exclude_none=True)
    data["user_id"] = user_id
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    if existing_id is not None:
        data.pop("user_id", None)
        table.update(data, doc_ids=[existing_id])
        doc = table.get(doc_id=existing_id)
        return {**doc, "id": existing_id}
    else:
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        new_id = table.insert(data)
        doc = table.get(doc_id=new_id)
        return {**doc, "id": new_id}