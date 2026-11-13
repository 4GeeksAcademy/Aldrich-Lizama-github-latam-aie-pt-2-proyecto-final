import asyncio

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

import app.api.users as users_api
from app.schemas.auth_user import RoleEnum
from app.services.db_service import create_user, get_user_by_email
from app.core.security import verify_password


def test_register_normalizes_email_and_never_returns_password_hash():
    result = asyncio.run(
        users_api.register_user(
            users_api.PublicUserCreate(
                email="  NEW.USER@EXAMPLE.COM ",
                password="12345678",
                name="New User",
            )
        )
    )

    saved = get_user_by_email("new.user@example.com")
    assert result["email"] == "new.user@example.com"
    assert result["role"] == RoleEnum.USER.value
    assert "hashed_password" not in result
    assert verify_password("12345678", saved["hashed_password"])


@pytest.mark.parametrize(
    ("email", "password"),
    [("invalid-email", "ValidPass123!"), ("valid@example.com", "")],
)
def test_register_rejects_invalid_email_or_empty_password(email, password):
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            users_api.register_user(
                users_api.PublicUserCreate(email=email, password=password)
            )
        )

    assert error.value.status_code == 422


def test_register_rejects_duplicate_email():
    create_user(email="duplicate@example.com", password="ValidPass123!")

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            users_api.register_user(
                users_api.PublicUserCreate(
                    email="duplicate@example.com", password="AnotherPass123!"
                )
            )
        )

    assert error.value.status_code == 409


def test_register_sanitizes_unexpected_storage_error(monkeypatch):
    def fail_create_user(**_kwargs):
        raise OSError("private storage path")

    monkeypatch.setattr(users_api, "create_user", fail_create_user)
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            users_api.register_user(
                users_api.PublicUserCreate(
                    email="new@example.com", password="ValidPass123!"
                )
            )
        )

    assert error.value.status_code == 500
    assert "private storage path" not in error.value.detail


def test_user_schema_rejects_password_below_minimum():
    from app.schemas.auth_user import UserCreate

    with pytest.raises(ValidationError):
        UserCreate(email="new@example.com", password="1234567")
