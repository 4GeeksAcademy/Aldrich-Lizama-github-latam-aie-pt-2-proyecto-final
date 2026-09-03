#!/usr/bin/env python3
"""
profiles.py — Nexova API · Endpoints de Perfil
================================================
APIRouter con los endpoints de gestión del perfil de usuario.

Endpoints:
  GET  /profiles/me   → Obtener perfil del usuario autenticado
  PUT  /profiles/me   → Actualizar perfil del usuario autenticado

Uso:
    from app.api.profiles import router as profiles_router
    app.include_router(profiles_router)
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.services.db_service import (
    get_profile_by_user_id,
    update_profile_by_user_id,
    create_profile,
)

router = APIRouter(prefix="/profiles", tags=["profiles"])


# ══════════════════════════════════════════════════════════════
#  Schemas internos
# ══════════════════════════════════════════════════════════════


class UpdateProfilePayload(BaseModel):
    """Payload para actualizar el perfil del usuario autenticado.

    Todos los campos son opcionales: solo se actualizan los que
    se envían explícitamente.
    """
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=120,
        description="Nombre completo del usuario",
    )
    phone: Optional[str] = Field(
        None,
        max_length=30,
        description="Teléfono de contacto",
    )
    address: Optional[str] = Field(
        None,
        max_length=250,
        description="Dirección postal",
    )


# ══════════════════════════════════════════════════════════════
#  GET /profiles/me  — Obtener perfil propio
# ══════════════════════════════════════════════════════════════


@router.get("/me")
async def get_my_profile(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Retorna el perfil del usuario autenticado.

    Endpoint protegido: requiere token JWT.

    Args:
        current_user: Usuario autenticado (inyectado por
                      dependencia).

    Returns:
        Perfil del usuario (``id``, ``user_id``, ``name``,
        ``phone``, ``address``) si existe.

    Raises:
        HTTPException 404: Si el usuario no tiene perfil.
    """
    user_id = current_user["id"]
    profile = get_profile_by_user_id(user_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene un perfil asociado",
        )

    return profile


# ══════════════════════════════════════════════════════════════
#  PUT /profiles/me  — Actualizar perfil propio
# ══════════════════════════════════════════════════════════════


@router.put("/me")
async def update_my_profile(
    payload: UpdateProfilePayload,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Actualiza el perfil del usuario autenticado.

    Endpoint protegido: requiere token JWT.

    Si el usuario no tiene perfil, se crea automáticamente
    con los datos proporcionados. Si ya tiene perfil, solo
    se actualizan los campos enviados (actualización parcial).

    Args:
        payload: Campos a actualizar (name, phone, address).
        current_user: Usuario autenticado.

    Returns:
        Perfil actualizado (``id``, ``user_id``, ``name``,
        ``phone``, ``address``).
    """
    user_id = current_user["id"]

    # ── Si no tiene perfil, lo creamos ───────────────────
    existing = get_profile_by_user_id(user_id)
    if existing is None:
        # Requerir al menos name para crear
        if payload.name is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="El campo 'name' es obligatorio para crear un perfil",
            )
        profile = create_profile(
            user_id=user_id,
            name=payload.name,
            phone=payload.phone,
            address=payload.address,
        )
        return profile

    # ── Actualizar perfil existente ──────────────────────
    updates = {
        k: v
        for k, v in payload.model_dump(exclude_none=True).items()
    }
    if not updates:
        # Sin cambios, devolver el perfil actual
        return existing

    updated = update_profile_by_user_id(user_id, updates)
    return updated  # type: ignore[return-value]  # sabemos que existe