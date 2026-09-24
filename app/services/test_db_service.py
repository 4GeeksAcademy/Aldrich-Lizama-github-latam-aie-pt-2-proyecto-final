#!/usr/bin/env python3
"""test_db_service.py — Tests for app/services/db_service.py"""

import os
import sys

_REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from pathlib import Path

db_path = Path(_REPO_ROOT) / "app" / "services" / "tinydb_storage.json"
if db_path.exists():
    db_path.unlink()

from app.services.db_service import (
    create_user,
    get_user_by_id,
    get_user_by_email,
    get_all_users,
    update_user,
    delete_user,
    create_profile,
    get_profile_by_user_id,
    update_profile_by_user_id,
    delete_profile_by_user_id,
)
from app.schemas.auth_user import RoleEnum
from app.core.security import verify_password

# ── 1. PRUEBAS DE PERFIL (Profile) ──

profile = create_profile(
    user_id=999,
    name="Test Profile",
    phone="+34 600 000 000",
    address="Test Address",
)
assert profile["user_id"] == 999
assert profile["name"] == "Test Profile"
assert profile["phone"] == "+34 600 000 000"
assert "id" in profile
profile_id = profile["id"]
print("✅ create_profile OK")

found = get_profile_by_user_id(999)
assert found is not None
assert found["name"] == "Test Profile"
assert found["id"] == profile_id
print("✅ get_profile_by_user_id OK")

not_found = get_profile_by_user_id(-1)
assert not_found is None
print("✅ get_profile_by_user_id (not found) OK")

updated = update_profile_by_user_id(999, {"name": "Updated Profile", "address": "New Address"})
assert updated["name"] == "Updated Profile"
assert updated["address"] == "New Address"
assert updated["phone"] == "+34 600 000 000"
print("✅ update_profile_by_user_id OK")

not_updated = update_profile_by_user_id(-1, {"name": "Nope"})
assert not_updated is None
print("✅ update_profile_by_user_id (not found) OK")

assert delete_profile_by_user_id(999) is True
assert get_profile_by_user_id(999) is None
print("✅ delete_profile_by_user_id OK")

# ── 2. PRUEBAS DE USUARIO (User) ──

user = create_user(email="alice@nexova.com", password="superpass123")
assert user["email"] == "alice@nexova.com"
assert user["role"] == "user"
assert user["is_active"] is True
assert "hashed_password" in user
assert verify_password("superpass123", user["hashed_password"])
assert "created_at" in user
assert "id" in user
assert "profile" in user
assert user["profile"] is not None
assert user["profile"]["name"] == ""
print("✅ create_user (basic) OK")

user2 = create_user(
    email="bob@nexova.com",
    password="strongpass456",
    name="Bob Smith",
    phone="+1 555 1234",
    address="123 Main St",
)
assert user2["profile"] is not None
assert user2["profile"]["name"] == "Bob Smith"
assert user2["profile"]["phone"] == "+1 555 1234"
assert user2["profile"]["address"] == "123 Main St"
print("✅ create_user (with profile) OK")

user3 = create_user(email="manager@nexova.com", password="mgrpass789", role=RoleEnum.MANAGER)
assert user3["role"] == "manager"
print("✅ create_user (manager role) OK")

try:
    create_user(email="alice@nexova.com", password="otrapass")
    assert False, "Debio lanzar ValueError"
except ValueError as e:
    assert "ya está registrado" in str(e)
    print("✅ create_user (duplicate email -> ValueError) OK")

found_id = get_user_by_id(user["id"])
assert found_id is not None
assert found_id["email"] == "alice@nexova.com"
print("✅ get_user_by_id OK")

assert get_user_by_id(-1) is None
print("✅ get_user_by_id (not found) OK")

found_email = get_user_by_email("bob@nexova.com")
assert found_email is not None
assert found_email["email"] == "bob@nexova.com"
assert found_email["profile"]["name"] == "Bob Smith"
print("✅ get_user_by_email OK")

assert get_user_by_email("noexiste@nexova.com") is None
print("✅ get_user_by_email (not found) OK")

all_users = get_all_users()
assert len(all_users) == 3
emails = {u["email"] for u in all_users}
assert emails == {"alice@nexova.com", "bob@nexova.com", "manager@nexova.com"}
print("✅ get_all_users OK")

updated = update_user(user["id"], email="alice.new@nexova.com")
assert updated["email"] == "alice.new@nexova.com"
print("✅ update_user (email) OK")

updated2 = update_user(user["id"], password="newpass999")
assert verify_password("newpass999", updated2["hashed_password"])
print("✅ update_user (password) OK")

updated3 = update_user(user["id"], role=RoleEnum.ADMIN)
assert updated3["role"] == "admin"
print("✅ update_user (role) OK")

updated4 = update_user(user["id"], is_active=False)
assert updated4["is_active"] is False
print("✅ update_user (is_active) OK")

assert update_user(-1, email="nope@test.com") is None
print("✅ update_user (not found) OK")

try:
    update_user(user["id"], email="bob@nexova.com")
    assert False, "Debio lanzar ValueError"
except ValueError as e:
    assert "ya está registrado" in str(e)
    print("✅ update_user (duplicate email -> ValueError) OK")

del_result = delete_user(user2["id"])
assert del_result is True
assert get_user_by_id(user2["id"]) is None
assert get_profile_by_user_id(user2["id"]) is None
print("✅ delete_user (with profile) OK")

assert delete_user(-1) is False
print("✅ delete_user (not found) OK")

assert len(get_all_users()) == 2
print("✅ final user count = 2 OK")

# LIMPIEZA
if db_path.exists():
    db_path.unlink()

print()
print("🎯 All db_service tests passed!")