#!/usr/bin/env python3
"""
security.py — Nexova API · Autenticación y Seguridad
======================================================
Provee utilidades para:
  - Hashear y verificar contraseñas con bcrypt.
  - Crear tokens JWT firmados con HS256 (HMAC + SHA-256).

Requerimientos:
  pip install "passlib[bcrypt]" "python-jose[cryptography]"

Uso:
    from app.core.security import hash_password, verify_password, create_access_token
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import os

from dotenv import load_dotenv
from jose import jwt
from passlib.hash import bcrypt

logger = logging.getLogger("nexova.core.security")

# ── Cargar variables de entorno ─────────────────────────
load_dotenv()

SECRET_KEY: str | None = os.getenv("SECRET_KEY")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

# Variable inicializada de forma perezosa en _get_config()
_ACCESS_TOKEN_EXPIRE_MINUTES: int | None = None


def _get_access_token_expire_minutes() -> int:
    """Valida y retorna ACCESS_TOKEN_EXPIRE_MINUTES.

    Separada en una función para que el error de configuración
    ocurra en el primer uso (no al importar el módulo), permitiendo
    que el manejador global de excepciones esté instalado.
    """
    global _ACCESS_TOKEN_EXPIRE_MINUTES
    if _ACCESS_TOKEN_EXPIRE_MINUTES is not None:
        return _ACCESS_TOKEN_EXPIRE_MINUTES

    raw = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    if not raw:
        logger.error(
            "ACCESS_TOKEN_EXPIRE_MINUTES es obligatoria. "
            "Defínela en el archivo .env antes de iniciar la API."
        )
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES no está configurada.")
    try:
        value = int(raw)
    except ValueError as exc:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES debe ser un entero positivo.") from exc
    if value <= 0:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES debe ser un entero positivo.")
    _ACCESS_TOKEN_EXPIRE_MINUTES = value
    return value


# ══════════════════════════════════════════════════════════
#  Password Hashing  (bcrypt via passlib)
# ══════════════════════════════════════════════════════════


def hash_password(password: str) -> str:
    """Hashea una contraseña en texto plano usando bcrypt.

    Args:
        password: Contraseña en texto plano.

    Returns:
        Hash de la contraseña (string seguro para almacenar en BD).
    """
    return bcrypt.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash bcrypt.

    Args:
        plain_password: Contraseña en texto plano a verificar.
        hashed_password: Hash previamente generado con hash_password().

    Returns:
        True si la contraseña coincide, False en caso contrario.
    """
    return bcrypt.verify(plain_password, hashed_password)


# ══════════════════════════════════════════════════════════
#  JWT Tokens  (firmados con jose.jwt)
# ══════════════════════════════════════════════════════════


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Crea un token JWT firmado con los datos proporcionados.

    Args:
        data: Payload del token (ej: {"sub": user_id, "role": "admin"}).
        expires_delta: Tiempo de vida personalizado.
                       Si no se provee, usa ACCESS_TOKEN_EXPIRE_MINUTES.

    Returns:
        Token JWT codificado como string.

    Raises:
        RuntimeError: Si SECRET_KEY no está configurada.
    """
    if not SECRET_KEY:
        logger.error("SECRET_KEY no está configurada.")
        raise RuntimeError("SECRET_KEY no está configurada.")

    to_encode = data.copy()

    # ── Determinar expiración ──────────────────────────
    if expires_delta is not None:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=_get_access_token_expire_minutes()
        )

    to_encode.update({"exp": expire})

    # ── Firmar y codificar ─────────────────────────────
    try:
        encoded_jwt = jwt.encode(
            claims=to_encode,
            key=SECRET_KEY,
            algorithm=ALGORITHM,
        )
    except Exception:
        logger.exception("Error al firmar el token JWT")
        raise RuntimeError("Error al generar el token de acceso.")

    return encoded_jwt