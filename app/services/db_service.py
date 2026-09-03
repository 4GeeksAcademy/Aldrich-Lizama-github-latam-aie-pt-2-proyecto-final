#!/usr/bin/env python3
"""
db_service.py — Nexova API · TinyDB persistence for Users, Profiles & Password Resets
=====================================================================
Servicio de persistencia para los módulos de autenticación y usuarios
utilizando exclusivamente TinyDB como base de datos embebida.

Tablas:
  - users           → Almacena usuarios con contraseña hasheada.
  - profiles        → Almacena el perfil de cada usuario (relación 1:1).
  - password_resets → Tokens de restablecimiento de contraseña.

Dependencias:
  pip install tinydb

Uso:
    from app.services.db_service import (
        create_user, get_user_by_id, get_user_by_email,
        get_all_users, update_user, delete_user,
        create_profile, get_profile_by_user_id,
        update_profile_by_user_id, delete_profile_by_user_id,
        create_password_reset_token, get_password_reset_token,
        mark_token_as_used, update_user_password,
    )

    user = create_user(email="user@nexova.com", password="secret123", name="Aldrich")
    found = get_user_by_email("user@nexova.com")
    update_user(found["id"], role="manager")
    delete_user(found["id"])

    # Restablecimiento de contraseña
    token_rec = create_password_reset_token(user["id"], "hash_del_token", expires_at)
    found_token = get_password_reset_token("hash_del_token")
    mark_token_as_used("hash_del_token")
    update_user_password(user["id"], "nuevo_hash_bcrypt")
"""

import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from tinydb import TinyDB, Query
except ImportError:
    print("TinyDB no está instalado. Ejecutá: pip3 install tinydb")
    sys.exit(1)

from app.core.security import hash_password
from app.schemas.auth_user import RoleEnum

# ══════════════════════════════════════════════════════════════
#  Configuración de TinyDB (singleton)
# ══════════════════════════════════════════════════════════════

_DB_DIR = Path(__file__).parent.resolve()
_DB_PATH = _DB_DIR / "tinydb_storage.json"

_db_instance: TinyDB | None = None


def _get_db() -> TinyDB:
    """Retorna la instancia única de TinyDB (singleton)."""
    global _db_instance
    if _db_instance is None:
        _db_instance = TinyDB(str(_DB_PATH), indent=2, sort_keys=True)
    return _db_instance


def _users_table():
    """Atajo para obtener la tabla 'users'."""
    return _get_db().table("users")


def _profiles_table():
    """Atajo para obtener la tabla 'profiles'."""
    return _get_db().table("profiles")


def _password_resets_table():
    """Atajo para obtener la tabla 'password_resets'."""
    return _get_db().table("password_resets")


def _now_iso() -> str:
    """Retorna el timestamp actual en formato ISO 8601 (UTC)."""
    return datetime.now(timezone.utc).isoformat()


# ══════════════════════════════════════════════════════════════
#  Operaciones para Profile
# ══════════════════════════════════════════════════════════════


def create_profile(
    user_id: int,
    name: str,
    phone: Optional[str] = None,
    address: Optional[str] = None,
) -> dict[str, Any]:
    """Crea un perfil asociado a un usuario.

    Args:
        user_id: ID del usuario al que pertenece el perfil.
        name:    Nombre completo del usuario.
        phone:   Teléfono de contacto (opcional).
        address: Dirección postal (opcional).

    Returns:
        Diccionario con los datos del perfil + su ``id`` interno.
    """
    profiles = _profiles_table()
    data: dict[str, Any] = {
        "user_id": user_id,
        "name": name,
        "phone": phone,
        "address": address,
    }
    doc_id = profiles.insert(data)
    return {**data, "id": doc_id}


def get_profile_by_user_id(user_id: int) -> Optional[dict[str, Any]]:
    """Obtiene el perfil de un usuario por su ID de usuario.

    Args:
        user_id: ID del usuario.

    Returns:
        Diccionario con los datos del perfil + ``id``, o ``None`` si no existe.
    """
    Profile = Query()
    doc = _profiles_table().get(Profile.user_id == user_id)
    if doc is None:
        return None
    return {**doc, "id": doc.doc_id}


def update_profile_by_user_id(
    user_id: int,
    updates: dict[str, Any],
) -> Optional[dict[str, Any]]:
    """Actualiza parcialmente el perfil de un usuario.

    Solo actualiza los campos presentes en ``updates``. Los campos
    con valor ``None`` se filtran y no se persisten.

    Args:
        user_id: ID del usuario cuyo perfil se actualizará.
        updates: Diccionario con los campos a actualizar
                 (``name``, ``phone``, ``address``).

    Returns:
        El perfil actualizado, o ``None`` si no existe.
    """
    Profile = Query()
    profiles = _profiles_table()

    # Verificar que el perfil existe
    existing = profiles.get(Profile.user_id == user_id)
    if existing is None:
        return None

    # Filtrar solo campos con valor distinto de None
    clean = {k: v for k, v in updates.items() if v is not None}
    if clean:
        profiles.update(clean, Profile.user_id == user_id)

    return get_profile_by_user_id(user_id)


def delete_profile_by_user_id(user_id: int) -> bool:
    """Elimina el perfil asociado a un usuario.

    Args:
        user_id: ID del usuario cuyo perfil se eliminará.

    Returns:
        ``True`` siempre (TinyDB ``remove`` no lanza error si no existe).
    """
    Profile = Query()
    _profiles_table().remove(Profile.user_id == user_id)
    return True


# ══════════════════════════════════════════════════════════════
#  Operaciones para User
# ══════════════════════════════════════════════════════════════


def create_user(
    email: str,
    password: str,
    role: RoleEnum = RoleEnum.USER,
    is_active: bool = True,
    name: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
) -> dict[str, Any]:
    """Crea un nuevo usuario con su perfil asociado.

    Realiza las siguientes validaciones y acciones en una misma
    transacción lógica:

    1. Verifica que el email no esté registrado previamente.
    2. Hashea la contraseña con bcrypt (nunca se almacena en texto plano).
    3. Inserta el registro en la tabla ``users``.
    4. Inserta el perfil asociado en la tabla ``profiles``.

    Args:
        email:     Correo electrónico único del usuario.
        password:  Contraseña en texto plano (se hashea antes de persistir).
        role:      Rol del usuario (por defecto ``RoleEnum.USER``).
        is_active: Indica si la cuenta está activa (por defecto ``True``).
        name:      Nombre completo (opcional, crea perfil si se provee).
        phone:     Teléfono (opcional).
        address:   Dirección (opcional).

    Returns:
        Diccionario completo del usuario creado, incluyendo el perfil anidado.

    Raises:
        ValueError: Si el email ya está registrado.
    """
    users = _users_table()
    User = Query()

    # ── 1. Validar unicidad del email ──
    if users.get(User.email == email):
        raise ValueError(f"El email '{email}' ya está registrado")

    # ── 2. Preparar datos del usuario ──
    user_data: dict[str, Any] = {
        "email": email,
        "hashed_password": hash_password(password),
        "role": role.value if isinstance(role, RoleEnum) else role,
        "is_active": is_active,
        "created_at": _now_iso(),
    }

    # ── 3. Insertar usuario ──
    user_doc_id = users.insert(user_data)

    # ── 4. Crear perfil asociado (solo si se provee name) ──
    profile: Any = None
    if name is not None:
        profile = create_profile(
            user_id=user_doc_id,
            name=name,
            phone=phone,
            address=address,
        )

    return {
        "id": user_doc_id,
        **user_data,
        "profile": profile,
    }


def get_user_by_id(user_id: int) -> Optional[dict[str, Any]]:
    """Obtiene un usuario por su ID interno (doc_id de TinyDB).

    Args:
        user_id: ID del usuario.

    Returns:
        Diccionario con los datos del usuario + ``id`` y ``profile`` anidado,
        o ``None`` si no existe.
    """
    doc = _users_table().get(doc_id=user_id)
    if doc is None:
        return None

    profile = get_profile_by_user_id(user_id)
    return {**doc, "id": doc.doc_id, "profile": profile}


def get_user_by_email(email: str) -> Optional[dict[str, Any]]:
    """Obtiene un usuario por su correo electrónico.

    Args:
        email: Correo electrónico a buscar.

    Returns:
        Diccionario con los datos del usuario + ``id`` y ``profile`` anidado,
        o ``None`` si no existe.
    """
    User = Query()
    doc = _users_table().get(User.email == email)
    if doc is None:
        return None

    profile = get_profile_by_user_id(doc.doc_id)
    return {**doc, "id": doc.doc_id, "profile": profile}


def get_all_users() -> list[dict[str, Any]]:
    """Retorna todos los usuarios registrados con su perfil asociado.

    Returns:
        Lista de diccionarios, cada uno con los datos del usuario,
        su ``id`` y ``profile`` anidado.
    """
    users = _users_table()
    results: list[dict[str, Any]] = []
    for doc in users.all():
        profile = get_profile_by_user_id(doc.doc_id)
        results.append({**doc, "id": doc.doc_id, "profile": profile})
    return results


def update_user(
    user_id: int,
    email: Optional[str] = None,
    password: Optional[str] = None,
    role: Optional[RoleEnum] = None,
    is_active: Optional[bool] = None,
) -> Optional[dict[str, Any]]:
    """Actualiza los campos de un usuario existente.

    Solo actualiza los campos que se proveen explícitamente
    (distintos de ``None``). Si se provee ``password``, se hashea
    antes de persistir.

    Args:
        user_id:  ID del usuario a actualizar.
        email:    Nuevo email (opcional).
        password: Nueva contraseña en texto plano (opcional, se hashea).
        role:     Nuevo rol (opcional).
        is_active: Nuevo estado de actividad (opcional).

    Returns:
        El usuario actualizado con su perfil, o ``None`` si no existe.

    Raises:
        ValueError: Si el nuevo email ya está en uso por otro usuario.
    """
    users = _users_table()

    # Verificar que el usuario existe
    existing = users.get(doc_id=user_id)
    if existing is None:
        return None

    # Construir diccionario de actualización
    updates: dict[str, Any] = {}

    if email is not None:
        # Validar unicidad del nuevo email (excluyendo al mismo usuario)
        # TinyDB no permite consultar por doc_id, así que iteramos manualmente.
        all_docs = users.all()
        for doc in all_docs:
            if doc.get("email") == email and doc.doc_id != user_id:
                raise ValueError(
                    f"El email '{email}' ya está registrado por otro usuario"
                )
        updates["email"] = email

    if password is not None:
        updates["hashed_password"] = hash_password(password)

    if role is not None:
        updates["role"] = role.value if isinstance(role, RoleEnum) else role

    if is_active is not None:
        updates["is_active"] = is_active

    if updates:
        users.update(updates, doc_ids=[user_id])

    return get_user_by_id(user_id)


def delete_user(user_id: int) -> bool:
    """Elimina un usuario y su perfil asociado.

    Args:
        user_id: ID del usuario a eliminar.

    Returns:
        ``True`` si el usuario existía y fue eliminado,
        ``False`` si no existía.
    """
    users = _users_table()

    # Verificar existencia
    existing = users.get(doc_id=user_id)
    if existing is None:
        return False

    # Eliminar perfil asociado
    delete_profile_by_user_id(user_id)

    # Eliminar usuario
    users.remove(doc_ids=[user_id])
    return True


# ══════════════════════════════════════════════════════════════
#  Operaciones para Password Reset
# ══════════════════════════════════════════════════════════════


def create_password_reset_token(
    user_id: int,
    token_hash: str,
    expires_at: datetime,
) -> dict[str, Any]:
    """Crea un registro de token de restablecimiento de contraseña.

    Args:
        user_id:    ID del usuario que solicita el restablecimiento.
        token_hash: Hash del token de restablecimiento.
        expires_at: Fecha y hora de expiración del token.

    Returns:
        Diccionario con los datos del token creado.
    """
    table = _password_resets_table()
    data: dict[str, Any] = {
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": _now_iso(),
    }
    doc_id = table.insert(data)
    return {**data, "id": doc_id}


def get_password_reset_token(token_hash: str) -> Optional[dict[str, Any]]:
    """Obtiene un token de restablecimiento por su hash.

    Args:
        token_hash: Hash del token a buscar.

    Returns:
        Diccionario con los datos del token, o ``None`` si no existe.
    """
    Reset = Query()
    doc = _password_resets_table().get(Reset.token_hash == token_hash)
    if doc is None:
        return None
    return {**doc, "id": doc.doc_id}


def mark_token_as_used(token_hash: str) -> bool:
    """Marca un token de restablecimiento como usado.

    Args:
        token_hash: Hash del token a marcar.

    Returns:
        ``True`` si se actualizó correctamente, ``False`` si no existe.
    """
    Reset = Query()
    table = _password_resets_table()
    doc = table.get(Reset.token_hash == token_hash)
    if doc is None:
        return False
    table.update({"used": True}, Reset.token_hash == token_hash)
    return True


def update_user_password(
    user_id: int,
    new_hashed_password: str,
) -> Optional[dict[str, Any]]:
    """Actualiza la contraseña de un usuario y registra el cambio.

    Además de actualizar ``hashed_password``, registra
    ``password_changed_at`` con la fecha/hora actual para
    poder invalidar tokens emitidos antes de ese momento.

    Args:
        user_id:             ID del usuario.
        new_hashed_password: Nueva contraseña ya hasheada.

    Returns:
        El usuario actualizado, o ``None`` si no existe.
    """
    users = _users_table()
    existing = users.get(doc_id=user_id)
    if existing is None:
        return None

    users.update(
        {
            "hashed_password": new_hashed_password,
            "password_changed_at": _now_iso(),
        },
        doc_ids=[user_id],
    )
    return get_user_by_id(user_id)