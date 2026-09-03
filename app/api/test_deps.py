#!/usr/bin/env python3
"""test_deps.py — Tests for app/api/deps.py"""

import os
import sys
from datetime import timedelta

_REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from pathlib import Path

db_path = Path(_REPO_ROOT) / "app" / "services" / "tinydb_storage.json"
if db_path.exists():
    db_path.unlink()

from fastapi import HTTPException
from jose import jwt as jose_jwt

from app.core.security import create_access_token, SECRET_KEY, ALGORITHM
from app.services.db_service import create_user, update_user, delete_user
from app.api.deps import get_current_user


# ══════════════════════════════════════════════════
#  1. Crear usuario de prueba
# ══════════════════════════════════════════════════

user = create_user(
    email="testuser@nexova.com",
    password="securepass123",
    name="Test User",
    role="user",
)
assert user is not None
assert user["is_active"] is True
user_id = user["id"]
print(f"✅ Test user created (id={user_id})")

# ══════════════════════════════════════════════════
#  2. Token válido -> get_current_user OK
# ══════════════════════════════════════════════════

valid_token = create_access_token(
    data={"sub": str(user_id), "role": "user"},
)
result = get_current_user(token=valid_token)
assert result["id"] == user_id
assert result["email"] == "testuser@nexova.com"
assert result["is_active"] is True
print("✅ Token válido -> get_current_user OK")

# ══════════════════════════════════════════════════
#  3. Token expirado -> 401
# ══════════════════════════════════════════════════

expired_token = create_access_token(
    data={"sub": str(user_id)},
    expires_delta=timedelta(seconds=-1),
)
try:
    get_current_user(token=expired_token)
    assert False, "Debio lanzar HTTPException"
except HTTPException as e:
    assert e.status_code == 401
    assert "expirado" in e.detail
    assert e.headers == {"WWW-Authenticate": "Bearer"}
    print("✅ Token expirado -> HTTPException 401 OK")

# ══════════════════════════════════════════════════
#  4. Token inválido (firmado con otra key) -> 401
# ══════════════════════════════════════════════════

bogus_token = jose_jwt.encode(
    claims={"sub": str(user_id)},
    key="clave-inventada",
    algorithm="HS256",
)
try:
    get_current_user(token=bogus_token)
    assert False, "Debio lanzar HTTPException"
except HTTPException as e:
    assert e.status_code == 401
    print("✅ Token firma inválida -> HTTPException 401 OK")

# ══════════════════════════════════════════════════
#  5. Token sin sub -> 401
# ══════════════════════════════════════════════════

token_no_sub = create_access_token(data={"role": "admin"})
try:
    get_current_user(token=token_no_sub)
    assert False, "Debio lanzar HTTPException"
except HTTPException as e:
    assert e.status_code == 401
    print("✅ Token sin sub -> HTTPException 401 OK")

# ══════════════════════════════════════════════════
#  6. Token con sub no numérico -> 401
# ══════════════════════════════════════════════════

token_bad_sub = create_access_token(data={"sub": "not-a-number"})
try:
    get_current_user(token=token_bad_sub)
    assert False, "Debio lanzar HTTPException"
except HTTPException as e:
    assert e.status_code == 401
    print("✅ Token sub no numérico -> HTTPException 401 OK")

# ══════════════════════════════════════════════════
#  7. Token con usuario inexistente -> 401
# ══════════════════════════════════════════════════

fake_token = create_access_token(data={"sub": "99999"})
try:
    get_current_user(token=fake_token)
    assert False, "Debio lanzar HTTPException"
except HTTPException as e:
    assert e.status_code == 401
    print("✅ Usuario inexistente -> HTTPException 401 OK")

# ══════════════════════════════════════════════════
#  8. Usuario desactivado -> 401
# ══════════════════════════════════════════════════

update_user(user_id, is_active=False)
inactive_token = create_access_token(data={"sub": str(user_id)})
try:
    get_current_user(token=inactive_token)
    assert False, "Debio lanzar HTTPException"
except HTTPException as e:
    assert e.status_code == 401
    assert "desactivada" in e.detail
    assert e.headers == {"WWW-Authenticate": "Bearer"}
    print("✅ Usuario inactivo -> HTTPException 401 OK")

# ══════════════════════════════════════════════════
#  9. Token malformado -> 401
# ══════════════════════════════════════════════════

try:
    get_current_user(token="not-a-valid.jwt.token.here")
    assert False, "Debio lanzar HTTPException"
except HTTPException as e:
    assert e.status_code == 401
    print("✅ Token malformado -> HTTPException 401 OK")

# ══════════════════════════════════════════════════
#  LIMPIEZA
# ══════════════════════════════════════════════════

delete_user(user_id)
if db_path.exists():
    db_path.unlink()

print()
print("🎯 All deps.py tests passed!")