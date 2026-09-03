#!/usr/bin/env python3
"""
auth.py — Nexova API · Endpoints de Autenticación
===================================================
APIRouter con los endpoints de autenticación de usuarios.

Endpoints:
  POST  /auth/login   → Iniciar sesión, devuelve JWT
  GET   /auth/me      → Obtener credenciales del usuario autenticado

Uso:
    from app.api.auth import router as auth_router
    app.include_router(auth_router)
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.services.db_service import get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


# ══════════════════════════════════════════════════════════════
#  POST /auth/login
# ══════════════════════════════════════════════════════════════


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> dict[str, Any]:
    """Autentica un usuario y retorna un token JWT.

    Recibe credenciales vía ``application/x-www-form-urlencoded``
    (estándar OAuth2). El campo ``username`` se usa como correo
    electrónico.

    Args:
        form_data: Formulario OAuth2 con ``username`` (email) y
                   ``password``.

    Returns:
        Diccionario con ``access_token`` (JWT) y ``token_type``
        (siempre ``bearer``).

    Raises:
        HTTPException 401:
            - Si el email no está registrado.
            - Si la contraseña no coincide.
            - Si la cuenta está desactivada.
            Incluye cabecera ``WWW-Authenticate: Bearer``.
    """
    # ── Buscar usuario por email ─────────────────────────
    email = form_data.username
    user = get_user_by_email(email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── Verificar contraseña ─────────────────────────────
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── Verificar cuenta activa ──────────────────────────
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta está desactivada",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── Generar token JWT ────────────────────────────────
    access_token = create_access_token(
        data={
            "sub": str(user["id"]),
            "email": user["email"],
            "role": user["role"],
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ══════════════════════════════════════════════════════════════
#  GET /auth/me
# ══════════════════════════════════════════════════════════════


@router.get("/me")
async def get_me(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Retorna las credenciales del usuario autenticado.

    Endpoint protegido: requiere token JWT válido en el header
    ``Authorization: Bearer <token>``.

    Args:
        current_user: Usuario autenticado (inyectado por
                      ``get_current_user``).

    Returns:
        Diccionario con ``id``, ``email``, ``role``,
        ``is_active``, ``created_at`` y ``profile`` del usuario.
    """
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"],
        "is_active": current_user["is_active"],
        "created_at": current_user["created_at"],
        "profile": current_user.get("profile"),
    }