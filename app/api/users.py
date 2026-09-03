#!/usr/bin/env python3
"""
users.py — Nexova API · Endpoints de Usuarios
===============================================
APIRouter con los endpoints CRUD de usuarios.

Endpoints:
  POST   /users          → Registro público de usuario
  GET    /users          → Listar todos los usuarios (protegido)
  GET    /users/{id}     → Obtener usuario por ID (protegido)
  PUT    /users/{id}     → Actualizar credenciales (protegido)
  DELETE /users/{id}     → Eliminar usuario + perfil (protegido)

Uso:
    from app.api.users import router as users_router
    app.include_router(users_router)
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api.deps import get_current_user
from app.schemas.auth_user import RoleEnum
from app.services.db_service import (
    create_user,
    get_user_by_id,
    get_all_users,
    update_user,
    delete_user,
)

router = APIRouter(prefix="/users", tags=["users"])


# ══════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════


def _serialize_user(user: dict[str, Any]) -> dict[str, Any]:
    """Serializa un usuario eliminando el campo hashed_password."""
    result = {k: v for k, v in user.items() if k != "hashed_password"}
    return result


# ══════════════════════════════════════════════════════════════
#  POST /users  — Registro público
# ══════════════════════════════════════════════════════════════


class PublicUserCreate(BaseModel):
    """Schema para registro público de usuario.

    A diferencia de UserCreate del módulo schemas, este modelo
    no requiere EmailStr para evitar dependencias estrictas de
    validación en el endpoint. Se valida el email manualmente.
    """
    email: str
    password: str
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: PublicUserCreate,
) -> dict[str, Any]:
    """Registra un nuevo usuario.

    Endpoint público. Asigna el rol ``user`` por defecto.
    Hashea la contraseña antes de persistir.

    Args:
        payload: Datos del usuario a registrar (email, password,
                 name opcional, phone opcional, address opcional).

    Returns:
        Usuario creado (sin ``hashed_password``).

    Raises:
        HTTPException 409: Si el email ya está registrado.
        HTTPException 422: Si el email no es válido o la
                           contraseña es muy corta (menos de 8
                           caracteres).
    """
    # Validaciones manuales
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El formato del email no es válido",
        )
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La contraseña debe tener al menos 8 caracteres",
        )

    try:
        user = create_user(
            email=email,
            password=payload.password,
            role=RoleEnum.USER,
            name=payload.name,
            phone=payload.phone,
            address=payload.address,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )

    return _serialize_user(user)


# ══════════════════════════════════════════════════════════════
#  GET /users  — Listar todos (protegido)
# ══════════════════════════════════════════════════════════════


@router.get("/")
async def list_users(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Lista todos los usuarios registrados.

    Endpoint protegido: requiere token JWT.

    Args:
        current_user: Usuario autenticado (inyectado por
                      dependencia).

    Returns:
        Lista de usuarios (sin ``hashed_password``).
    """
    users = get_all_users()
    return [_serialize_user(u) for u in users]


# ══════════════════════════════════════════════════════════════
#  GET /users/{id}  — Obtener por ID (protegido)
# ══════════════════════════════════════════════════════════════


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Retorna un usuario por su ID.

    Endpoint protegido: requiere token JWT.

    Args:
        user_id: ID del usuario a consultar.
        current_user: Usuario autenticado.

    Returns:
        Usuario encontrado (sin ``hashed_password``).

    Raises:
        HTTPException 404: Si el usuario no existe.
    """
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return _serialize_user(user)


# ══════════════════════════════════════════════════════════════
#  PUT /users/{id}  — Actualizar (protegido)
# ══════════════════════════════════════════════════════════════


class UpdateUserPayload(BaseModel):
    """Payload para actualizar un usuario.

    Todos los campos son opcionales. Solo los admins pueden
    modificar el campo ``role``.
    """
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[RoleEnum] = None


@router.put("/{user_id}")
async def update_user_endpoint(
    user_id: int,
    payload: UpdateUserPayload,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Actualiza las credenciales de un usuario.

    Endpoint protegido: requiere token JWT.

    Reglas de autorización:
    - Cualquier usuario autenticado puede modificar su propio
      email y contraseña.
    - Solo usuarios con rol ``admin`` pueden modificar el campo
      ``role`` de cualquier usuario.
    - Si un usuario no-admin intenta modificar datos de otro
      usuario, se rechaza con 403.

    Args:
        user_id: ID del usuario a actualizar.
        payload: Campos a actualizar (email, password, role).
        current_user: Usuario autenticado.

    Returns:
        Usuario actualizado (sin ``hashed_password``).

    Raises:
        HTTPException 403: Si no tiene permisos.
        HTTPException 404: Si el usuario no existe.
        HTTPException 409: Si el email ya está en uso.
    """
    # ── Verificar permisos ───────────────────────────────
    is_owner = current_user["id"] == user_id
    is_admin = current_user["role"] == "admin"

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para modificar este usuario",
        )

    # ── Solo admins pueden cambiar el rol ────────────────
    if payload.role is not None and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden cambiar el rol",
        )

    # ── Validar contraseña si se provee ──────────────────
    if payload.password is not None and len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La contraseña debe tener al menos 8 caracteres",
        )

    # ── Ejecutar actualización ───────────────────────────
    try:
        updated = update_user(
            user_id=user_id,
            email=payload.email,
            password=payload.password,
            role=payload.role,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return _serialize_user(updated)


# ══════════════════════════════════════════════════════════════
#  DELETE /users/{id}  — Eliminar (protegido)
# ══════════════════════════════════════════════════════════════


@router.delete("/{user_id}")
async def delete_user_endpoint(
    user_id: int,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Elimina un usuario y su perfil asociado.

    Endpoint protegido: requiere token JWT.

    Reglas de autorización:
    - Un usuario puede eliminarse a sí mismo.
    - Un admin puede eliminar cualquier usuario.
    - Cualquier otro caso se rechaza con 403.

    Args:
        user_id: ID del usuario a eliminar.
        current_user: Usuario autenticado.

    Returns:
        Mensaje de confirmación.

    Raises:
        HTTPException 403: Si no tiene permisos.
        HTTPException 404: Si el usuario no existe.
    """
    # ── Verificar permisos ───────────────────────────────
    is_owner = current_user["id"] == user_id
    is_admin = current_user["role"] == "admin"

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este usuario",
        )

    # ── Ejecutar eliminación ─────────────────────────────
    deleted = delete_user(user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return {
        "message": "Usuario eliminado correctamente",
        "user_id": user_id,
    }