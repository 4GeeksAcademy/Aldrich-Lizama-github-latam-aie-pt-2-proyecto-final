#!/usr/bin/env python3
"""
auth.py — Nexova API · Endpoints de Autenticación
===================================================
APIRouter con los endpoints de autenticación de usuarios.

Endpoints:
  POST  /auth/login           → Iniciar sesión, devuelve JWT
  GET   /auth/me              → Obtener credenciales del usuario autenticado
  POST  /auth/forgot-password → Solicitar restablecimiento de contraseña
  POST  /auth/reset-password  → Ejecutar restablecimiento con token
  POST  /auth/change-password → Cambiar contraseña estando autenticado

Uso:
    from app.api.auth import router as auth_router
    app.include_router(auth_router)
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import get_current_user
from app.core.email import FRONTEND_URL, send_reset_password_email
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth_user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.db_service import (
    create_password_reset_token,
    get_password_reset_token,
    get_user_by_email,
    mark_token_as_used,
    update_user_password,
)

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


# ══════════════════════════════════════════════════════════════
#  POST /auth/forgot-password
# ══════════════════════════════════════════════════════════════


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
) -> dict[str, str]:
    """Solicita un enlace de restablecimiento de contraseña.

    **Siempre retorna 200** para evitar enumeración de correos.
    Si el email existe, envía un enlace de restablecimiento
    con un token de un solo uso (expira en 30 minutos).

    Args:
        body: Objeto con el campo ``email``.

    Returns:
        Mensaje informativo indicando que si el correo está
        registrado, se enviará el enlace.
    """
    user = get_user_by_email(body.email)

    if user is not None:
        # ── Generar token seguro ──────────────────────────
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

        # ── Persistir token ───────────────────────────────
        create_password_reset_token(
            user_id=user["id"],
            token_hash=token_hash,
            expires_at=expires_at,
        )

        # ── Construir enlace y enviar email ───────────────
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        try:
            await send_reset_password_email(
                email_to=user["email"],
                reset_url=reset_url,
            )
        except Exception as exc:  # noqa: BLE001 - el email es best-effort
            # En modo desarrollo (sin EMAIL_SERVICE_API_KEY) o si el
            # proveedor falla, no rompemos el flujo: el token ya quedó
            # registrado en la BD y puede usarse igualmente.
            import logging

            logging.getLogger("nexova.auth").warning(
                "No se pudo enviar el correo de reset: %s", exc
            )

    return {
        "message": (
            "Si la dirección está registrada, recibirás un "
            "enlace de restablecimiento en tu correo electrónico."
        ),
    }


# ══════════════════════════════════════════════════════════════
#  POST /auth/reset-password
# ══════════════════════════════════════════════════════════════


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
) -> dict[str, str]:
    """Ejecuta el restablecimiento de contraseña con un token.

    Valida que el token exista, no haya sido usado y no esté
    vencido. Si todo es correcto, actualiza la contraseña y
    marca el token como usado.

    Args:
        body: Objeto con ``token`` y ``new_password``.

    Returns:
        Mensaje de confirmación de contraseña actualizada.

    Raises:
        HTTPException 400:
            - Token inválido, ya usado o expirado.
    """
    # ── Buscar token por hash ─────────────────────────────
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    record = get_password_reset_token(token_hash)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de restablecimiento no es válido.",
        )

    # ── Verificar si ya fue usado ─────────────────────────
    if record.get("used", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este enlace de restablecimiento ya ha sido utilizado.",
        )

    # ── Verificar expiración ──────────────────────────────
    expires_at = datetime.fromisoformat(record["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de restablecimiento ha expirado.",
        )

    # ── Actualizar contraseña y marcar token usado ────────
    hashed = hash_password(body.new_password)
    update_user_password(user_id=record["user_id"], new_hashed_password=hashed)
    mark_token_as_used(token_hash)

    return {
        "message": "Contraseña actualizada correctamente.",
    }


# ══════════════════════════════════════════════════════════════
#  POST /auth/change-password
# ══════════════════════════════════════════════════════════════


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    """Cambia la contraseña del usuario autenticado.

    Requiere token JWT válido. Verifica la contraseña actual
    antes de actualizar.

    Args:
        body: Objeto con ``current_password`` y ``new_password``.
        current_user: Usuario autenticado (inyectado por
                      ``get_current_user``).

    Returns:
        Mensaje de confirmación de contraseña actualizada.

    Raises:
        HTTPException 400:
            - Si la contraseña actual no coincide.
    """
    # ── Verificar contraseña actual ───────────────────────
    if not verify_password(
        body.current_password, current_user["hashed_password"]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta.",
        )

    # ── Actualizar contraseña ─────────────────────────────
    hashed = hash_password(body.new_password)
    update_user_password(
        user_id=current_user["id"],
        new_hashed_password=hashed,
    )

    return {
        "message": "Contraseña actualizada correctamente.",
    }