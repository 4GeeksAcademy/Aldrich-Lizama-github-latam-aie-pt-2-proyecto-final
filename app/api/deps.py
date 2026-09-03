#!/usr/bin/env python3
"""
deps.py — Nexova API · Dependencias de Autenticación Reutilizables
====================================================================
Inyección de dependencias para FastAPI que protegen endpoints
mediante autenticación JWT Bearer Token.

Uso típico:
    from app.api.deps import get_current_user

    @router.get("/profile")
    async def read_profile(current_user: dict = Depends(get_current_user)):
        return current_user

    @router.get("/admin-only")
    async def admin_endpoint(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Se requiere rol admin")
        ...
"""

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, ExpiredSignatureError, jwt

from app.core.security import ALGORITHM, SECRET_KEY
from app.services.db_service import get_user_by_id

# ══════════════════════════════════════════════════════════════
#  Esquema OAuth2
# ══════════════════════════════════════════════════════════════

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    description=(
        "Token JWT obtenido del endpoint /auth/login. "
        "Formato: Bearer <token>"
    ),
)

# ══════════════════════════════════════════════════════════════
#  Dependencia principal: get_current_user
# ══════════════════════════════════════════════════════════════


def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> dict[str, Any]:
    """Valida un token JWT y retorna el usuario autenticado.

    Flujo de validación:
    1. Decodifica el token JWT usando la clave y algoritmo configurados.
    2. Extrae el campo ``sub`` del payload, que contiene el ID del usuario
       en TinyDB.
    3. Busca el usuario en la base de datos mediante ``get_user_by_id``.
    4. Verifica que la cuenta esté activa (``is_active == True``).

    Args:
        token: Token JWT extraído automáticamente del header
               ``Authorization: Bearer <token>``.

    Returns:
        Diccionario con los datos del usuario autenticado (incluye
        los campos: ``id``, ``email``, ``role``, ``is_active``,
        ``created_at``, ``profile``).

    Raises:
        HTTPException 401:
            - Si el token es inválido o está mal formado.
            - Si el token ha expirado.
            - Si el usuario no existe en la base de datos.
            - Si la cuenta del usuario está desactivada.

        La respuesta incluye la cabecera ``WWW-Authenticate: Bearer``
        para que el cliente sepa que debe autenticarse.
    """
    # ── 1. Credenciales inválidas por defecto ──────────────
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # ── 2. Decodificar token ───────────────────────────────
    try:
        payload: dict[str, Any] = jwt.decode(
            token=token,
            key=SECRET_KEY,
            algorithms=[ALGORITHM],
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token ha expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception

    # ── 3. Extraer subject (ID del usuario) ────────────────
    user_id: Any = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Asegurar que sea entero (TinyDB usa doc_id que es int)
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception

    # ── 4. Buscar usuario en BD ────────────────────────────
    user = get_user_by_id(user_id)
    if user is None:
        raise credentials_exception

    # ── 5. Verificar cuenta activa ─────────────────────────
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta está desactivada",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── 6. Retornar usuario autenticado ────────────────────
    return user