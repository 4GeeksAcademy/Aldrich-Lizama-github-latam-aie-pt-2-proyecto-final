from datetime import timedelta

import pytest
from fastapi import HTTPException
from jose import jwt

import app.api.deps as auth_deps
import app.core.security as security
from app.services.db_service import create_user, update_user


def test_create_access_token_encodes_subject_role_and_expiration():
    token = security.create_access_token(
        {"sub": "17", "role": "manager"}, expires_delta=timedelta(minutes=5)
    )
    claims = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])

    assert claims["sub"] == "17"
    assert claims["role"] == "manager"
    assert "exp" in claims


def test_create_access_token_requires_secret_key(monkeypatch):
    monkeypatch.setattr(security, "SECRET_KEY", None)

    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        security.create_access_token({"sub": "1"})


def test_get_current_user_accepts_valid_token():
    user = create_user(email="token@example.com", password="ValidPass123!")
    token = security.create_access_token({"sub": str(user["id"])})

    assert auth_deps.get_current_user(token)["id"] == user["id"]


@pytest.mark.parametrize(
    "token_factory",
    [
        lambda _user_id: "not-a-jwt",
        lambda _user_id: security.create_access_token(
            {"sub": "1"}, expires_delta=timedelta(seconds=-10)
        ),
        lambda _user_id: security.create_access_token({"role": "user"}),
        lambda _user_id: security.create_access_token({"sub": "not-an-id"}),
        lambda _user_id: security.create_access_token({"sub": "999999"}),
    ],
)
def test_get_current_user_rejects_invalid_or_unresolvable_tokens(token_factory):
    user = create_user(email="invalid-token@example.com", password="ValidPass123!")

    with pytest.raises(HTTPException) as error:
        auth_deps.get_current_user(token_factory(user["id"]))

    assert error.value.status_code == 401
    assert error.value.headers == {"WWW-Authenticate": "Bearer"}


def test_get_current_user_rejects_disabled_account():
    user = create_user(email="disabled@example.com", password="ValidPass123!")
    update_user(user["id"], is_active=False)
    token = security.create_access_token({"sub": str(user["id"])})

    with pytest.raises(HTTPException) as error:
        auth_deps.get_current_user(token)

    assert error.value.status_code == 401
    assert "desactivada" in error.value.detail
