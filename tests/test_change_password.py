import asyncio

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

import app.api.auth as auth_api
from app.core.security import verify_password
from app.schemas.auth_user import ChangePasswordRequest
from app.services.db_service import create_user, get_user_by_id


def test_change_password_updates_hash_for_authenticated_user():
    user = create_user(email="change@example.com", password="InitialPass123!")

    result = asyncio.run(
        auth_api.change_password(
            ChangePasswordRequest(
                current_password="InitialPass123!",
                new_password="ChangedPass123!",
            ),
            user,
        )
    )

    updated = get_user_by_id(user["id"])
    assert result["message"] == "Contraseña actualizada correctamente."
    assert verify_password("ChangedPass123!", updated["hashed_password"])
    assert not verify_password("InitialPass123!", updated["hashed_password"])


def test_change_password_rejects_wrong_current_password():
    user = create_user(email="wrong-current@example.com", password="InitialPass123!")

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            auth_api.change_password(
                ChangePasswordRequest(
                    current_password="WrongPass123!",
                    new_password="ChangedPass123!",
                ),
                user,
            )
        )

    assert error.value.status_code == 400


@pytest.mark.parametrize(
    "payload",
    [
        {"current_password": "", "new_password": "ChangedPass123!"},
        {"current_password": "InitialPass123!", "new_password": "short"},
    ],
)
def test_change_password_schema_rejects_empty_or_short_password(payload):
    with pytest.raises(ValidationError):
        ChangePasswordRequest(**payload)
