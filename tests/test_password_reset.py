import asyncio
import hashlib
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

import app.api.auth as auth_api
from app.core.security import verify_password
from app.schemas.auth_user import ResetPasswordRequest
from app.services.db_service import (
    create_password_reset_token,
    create_user,
    get_password_reset_token,
    get_user_by_id,
)


def _store_reset_token(user_id, raw_token, expires_at, used=False):
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    record = create_password_reset_token(user_id, token_hash, expires_at)
    if used:
        from app.services.db_service import mark_token_as_used

        mark_token_as_used(token_hash)
    return token_hash, record


def test_reset_password_updates_hash_and_consumes_valid_token():
    user = create_user(email="reset@example.com", password="InitialPass123!")
    raw_token = "single-use-reset-token"
    token_hash, _ = _store_reset_token(
        user["id"], raw_token, datetime.now(timezone.utc) + timedelta(minutes=30)
    )

    result = asyncio.run(
        auth_api.reset_password(
            ResetPasswordRequest(token=raw_token, new_password="ChangedPass123!")
        )
    )

    updated = get_user_by_id(user["id"])
    assert result["message"] == "Contraseña actualizada correctamente."
    assert verify_password("ChangedPass123!", updated["hashed_password"])
    assert get_password_reset_token(token_hash)["used"] is True


@pytest.mark.parametrize("used, expired", [(True, False), (False, True)])
def test_reset_password_rejects_reused_or_expired_token(used, expired):
    user = create_user(email=f"reset-{used}-{expired}@example.com", password="InitialPass123!")
    raw_token = f"token-{used}-{expired}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    if expired:
        expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    _store_reset_token(user["id"], raw_token, expires_at, used=used)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            auth_api.reset_password(
                ResetPasswordRequest(token=raw_token, new_password="ChangedPass123!")
            )
        )

    assert error.value.status_code == 400


def test_reset_password_rejects_unknown_token():
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            auth_api.reset_password(
                ResetPasswordRequest(token="unknown-token", new_password="ChangedPass123!")
            )
        )

    assert error.value.status_code == 400


def test_reset_password_schema_rejects_empty_token_or_short_password():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="", new_password="ChangedPass123!")
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="valid-token", new_password="short")
