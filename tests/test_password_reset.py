#!/usr/bin/env python3
"""
test_password_reset.py — Tests de AUTH-03 · Flujo de recuperación y
cambio de contraseña (pytest + FastAPI TestClient)
====================================================================
Valida los endpoints de autenticación implementados en el ticket
AUTH-03:

  POST /auth/forgot-password  → Siempre responde 200 (anti enumeración)
  POST /auth/reset-password   → Cambia la contraseña con token de un
                                solo uso (token no reutilizable)
  POST /auth/change-password  → Cambio de contraseña autenticado
                                (requiere JWT + contraseña actual)

Casos cubiertos:
  1. test_forgot_password_always_returns_200
  2. test_reset_password_success_flow
  3. test_reset_password_token_reuse_fails
  4. test_change_password_validations
  5. test_unauthorized_access

Uso:
    pip install pytest httpx
    pytest tests/test_password_reset.py -v
"""

import hashlib
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

# ── Asegurar que el repo root está en sys.path ──────────────
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# ══════════════════════════════════════════════════════════════
#  Aislamiento de la base de datos TinyDB
# ══════════════════════════════════════════════════════════════
#  Los tests NO deben tocar la BD de desarrollo
#  (app/services/tinydb_storage.json). Apuntamos el singleton de
#  TinyDB a un archivo temporal generado por sesión antes de que
#  se importe la app, de modo que todas las operaciones de los
#  tests queden contenidas en un almacén limpio y descartable.
# ══════════════════════════════════════════════════════════════

import app.services.db_service as _db_service_module  # noqa: E402

_TMP_DB_DIR = Path(tempfile.mkdtemp(prefix="nexova_auth03_tests_"))
_db_service_module._DB_PATH = _TMP_DB_DIR / "tinydb_test.json"
_db_service_module._db_instance = None


# ══════════════════════════════════════════════════════════════
#  Fixture de aislamiento de la tabla password_resets
# ══════════════════════════════════════════════════════════════
#  Cada test parte con la tabla de tokens vacía, de modo que los
#  tokens generados en un test no "contaminan" al siguiente.
#  (La tabla users se mantiene, y los usuarios de prueba se crean
#  y se eliminan dentro de cada test de forma explícita.)
# ══════════════════════════════════════════════════════════════


@pytest.fixture(autouse=True)
def _clean_password_resets():
    """Vacía la tabla password_resets antes y después de cada test."""
    from app.services import db_service

    db = db_service._get_db()
    db.drop_table("password_resets")
    yield
    db.drop_table("password_resets")


# ══════════════════════════════════════════════════════════════
#  Constantes compartidas
# ══════════════════════════════════════════════════════════════

TEST_EMAIL = "auth03_test@nexova.com"
TEST_INITIAL_PASSWORD = "InitialPass123!"
TEST_NEW_PASSWORD = "NewPass456!"
TEST_CHANGE_PASSWORD = "ChangedPass789!"


# ══════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════


def _create_test_user() -> dict:
    """Crea (o reutiliza) el usuario de prueba y devuelve su dict."""
    from app.services.db_service import create_user, get_user_by_email

    existing = get_user_by_email(TEST_EMAIL)
    if existing is not None:
        return existing

    return create_user(
        email=TEST_EMAIL,
        password=TEST_INITIAL_PASSWORD,
        name="AUTH03 Test",
    )


def _delete_test_user() -> None:
    """Elimina el usuario de prueba si existe (limpieza)."""
    from app.services.db_service import delete_user, get_user_by_email

    user = get_user_by_email(TEST_EMAIL)
    if user is not None:
        delete_user(user["id"])


def _login(client, email: str, password: str):
    """Intenta hacer login (OAuth2 form-urlencoded) y devuelve la respuesta."""
    return client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )


def _register_token_for(
    user_id: int,
    raw_token: str,
    *,
    minutes: int = 30,
) -> dict:
    """Persiste un token de reset para el usuario en la DB."""
    from app.services.db_service import create_password_reset_token

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return create_password_reset_token(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )


# ══════════════════════════════════════════════════════════════
#  1. forgot-password → siempre 200
# ══════════════════════════════════════════════════════════════


def test_forgot_password_always_returns_200(client):
    """Enviar un email (existente o no) a /auth/forgot-password
    debe responder siempre 200 OK (evita enumeración de emails)."""
    # Email inexistente → 200
    res_missing = client.post(
        "/auth/forgot-password",
        json={"email": "no_existe_123@nexova.com"},
    )
    assert res_missing.status_code == 200
    assert "message" in res_missing.json()

    # Email existente → también 200 (aunque el email falle en dev,
    # el contrato público siempre es 200)
    user = _create_test_user()
    res_existing = client.post(
        "/auth/forgot-password",
        json={"email": TEST_EMAIL},
    )
    assert res_existing.status_code == 200
    assert "message" in res_existing.json()
    assert user["id"] > 0


# ══════════════════════════════════════════════════════════════
#  2. reset-password → flujo completo exitoso
# ══════════════════════════════════════════════════════════════


def test_reset_password_success_flow(client):
    """Crea un usuario, genera un token válido, consume
    /auth/reset-password con una nueva contraseña y confirma que
    el login funciona con las nuevas credenciales."""
    user = _create_test_user()

    # ── Generar token en la DB ─────────────────────────────
    raw_token = "reset-token-e2e-unico-987654"
    _register_token_for(user["id"], raw_token)

    # ── Consumir reset-password ────────────────────────────
    res = client.post(
        "/auth/reset-password",
        json={"token": raw_token, "new_password": TEST_NEW_PASSWORD},
    )
    assert res.status_code == 200
    assert res.json()["message"] == "Contraseña actualizada correctamente."

    # ── Login con la NUEVA contraseña → 200 ────────────────
    login_new = _login(client, TEST_EMAIL, TEST_NEW_PASSWORD)
    assert login_new.status_code == 200
    assert "access_token" in login_new.json()

    # ── Login con la contraseña ANTERIOR → 401 ─────────────
    login_old = _login(client, TEST_EMAIL, TEST_INITIAL_PASSWORD)
    assert login_old.status_code == 401


# ══════════════════════════════════════════════════════════════
#  3. reset-password → reutilización del token falla
# ══════════════════════════════════════════════════════════════


def test_reset_password_token_reuse_fails(client):
    """Un token de reset es de un solo uso: intentar consumirlo por
    segunda vez debe devolver HTTP 400."""
    user = _create_test_user()

    raw_token = "reset-token-reuso-123456"
    _register_token_for(user["id"], raw_token)

    # ── Primer uso → 200 ───────────────────────────────────
    first = client.post(
        "/auth/reset-password",
        json={"token": raw_token, "new_password": TEST_NEW_PASSWORD},
    )
    assert first.status_code == 200

    # ── Segundo uso (el mismo token) → 400 ─────────────────
    second = client.post(
        "/auth/reset-password",
        json={"token": raw_token, "new_password": "AnotherPass999!"},
    )
    assert second.status_code == 400
    assert "utilizado" in second.json()["detail"]

    # El usuario sigue autenticable con la contraseña del primer uso
    login_ok = _login(client, TEST_EMAIL, TEST_NEW_PASSWORD)
    assert login_ok.status_code == 200


# ══════════════════════════════════════════════════════════════
#  4. change-password → validaciones
# ══════════════════════════════════════════════════════════════


def test_change_password_validations(client):
    """/auth/change-password requiere token JWT y verifica la
    contraseña actual:
      - Contraseña actual incorrecta → 400
      - Contraseña actual correcta   → 200 y el login funciona
        con la nueva contraseña."""
    user = _create_test_user()

    # ── Obtener token JWT (login con contraseña actual) ────
    login_res = _login(client, TEST_EMAIL, TEST_INITIAL_PASSWORD)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # ── current_password incorrecta → 400 ──────────────────
    res_wrong = client.post(
        "/auth/change-password",
        headers=headers,
        json={
            "current_password": "WrongCurrentPass!",
            "new_password": TEST_CHANGE_PASSWORD,
        },
    )
    assert res_wrong.status_code == 400
    assert "correcta" in res_wrong.json()["detail"]

    # ── current_password correcta → 200 ────────────────────
    res_ok = client.post(
        "/auth/change-password",
        headers=headers,
        json={
            "current_password": TEST_INITIAL_PASSWORD,
            "new_password": TEST_CHANGE_PASSWORD,
        },
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["message"] == "Contraseña actualizada correctamente."

    # ── Confirmación: login con la NUEVA contraseña → 200 ──
    login_new = _login(client, TEST_EMAIL, TEST_CHANGE_PASSWORD)
    assert login_new.status_code == 200
    assert "access_token" in login_new.json()

    # ── Confirmación: la contraseña ANTERIOR ya no sirve → 401 ──
    login_old = _login(client, TEST_EMAIL, TEST_INITIAL_PASSWORD)
    assert login_old.status_code == 401

    # La contraseña quedó cambiada; restauramos la inicial para
    # que otros tests sigan funcionando.
    client.post(
        "/auth/change-password",
        headers={"Authorization": f"Bearer {login_new.json()['access_token']}"},
        json={
            "current_password": TEST_CHANGE_PASSWORD,
            "new_password": TEST_INITIAL_PASSWORD,
        },
    )
    assert user["id"] > 0


# ══════════════════════════════════════════════════════════════
#  5. change-password → acceso no autorizado
# ══════════════════════════════════════════════════════════════


def test_unauthorized_access(client):
    """/auth/change-password sin header Authorization debe devolver
    HTTP 401."""
    res = client.post(
        "/auth/change-password",
        json={
            "current_password": "whatever123",
            "new_password": TEST_NEW_PASSWORD,
        },
    )
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers
    assert res.headers["WWW-Authenticate"] == "Bearer"


# ══════════════════════════════════════════════════════════════
#  Fixture principal: TestClient con la app FastAPI
# ══════════════════════════════════════════════════════════════


@pytest.fixture()
def client():
    """TestClient contra la app FastAPI con limpieza al terminar.

    NOTA: no usamos el context manager (``with``) para evitar que
    el lifespan (seed de proveedores) se ejecute y escriba en la DB
    productiva de suppliers.
    """
    from fastapi.testclient import TestClient
    from app.main import app

    c = TestClient(app)
    yield c
    # Limpieza: eliminar usuario de prueba y dejar BD normalizada
    _delete_test_user()