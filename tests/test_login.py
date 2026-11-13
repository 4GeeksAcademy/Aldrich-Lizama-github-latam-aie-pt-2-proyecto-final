import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from jose import jwt

import app.api.auth as auth_api
from app.core import security
from app.core.security import hash_password
from app.services.db_service import create_user


def test_login_returns_signed_token_for_valid_credentials():
    user = create_user(
        email="login@example.com",
        password="ValidPass123!",
        role="manager",
    )

    result = asyncio.run(
        auth_api.login(
            SimpleNamespace(username="login@example.com", password="ValidPass123!")
        )
    )
    claims = jwt.decode(
        result["access_token"], security.SECRET_KEY, algorithms=[security.ALGORITHM]
    )

    assert result["token_type"] == "bearer"
    assert claims["sub"] == str(user["id"])
    assert claims["role"] == "manager"


def test_login_accepts_active_user_when_flag_is_omitted(monkeypatch):
    monkeypatch.setattr(
        auth_api,
        "get_user_by_email",
        lambda _email: {
            "id": 9,
            "email": "login@example.com",
            "role": "user",
            "hashed_password": hash_password("ValidPass123!"),
        },
    )

    result = asyncio.run(
        auth_api.login(
            SimpleNamespace(username="login@example.com", password="ValidPass123!")
        )
    )

    assert result["access_token"]


@pytest.mark.parametrize(
    ("user", "password"),
    [
        (None, "ValidPass123!"),
        (
            {
                "id": 4,
                "email": "login@example.com",
                "role": "user",
                "is_active": True,
                "hashed_password": hash_password("ValidPass123!"),
            },
            "WrongPass123!",
        ),
        (
            {
                "id": 5,
                "email": "login@example.com",
                "role": "user",
                "is_active": False,
                "hashed_password": hash_password("ValidPass123!"),
            },
            "ValidPass123!",
        ),
    ],
)
def test_login_rejects_unknown_wrong_or_disabled_account(monkeypatch, user, password):
    monkeypatch.setattr(auth_api, "get_user_by_email", lambda _email: user)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            auth_api.login(
                SimpleNamespace(username="login@example.com", password=password)
            )
        )

    assert error.value.status_code == 401
    assert error.value.headers == {"WWW-Authenticate": "Bearer"}
