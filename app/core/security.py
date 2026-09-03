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

from datetime import datetime, timedelta, timezone
from typing import Optional

import os

from dotenv import load_dotenv
from jose import jwt
from passlib.hash import bcrypt

# ── Cargar variables de entorno ─────────────────────────
load_dotenv()

SECRET_KEY: str = os.getenv("SECRET_KEY", "changeme-default-insecure-key")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


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
    """
    to_encode = data.copy()

    # ── Determinar expiración ──────────────────────────
    if expires_delta is not None:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    # ── Firmar y codificar ─────────────────────────────
    encoded_jwt = jwt.encode(
        claims=to_encode,
        key=SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt