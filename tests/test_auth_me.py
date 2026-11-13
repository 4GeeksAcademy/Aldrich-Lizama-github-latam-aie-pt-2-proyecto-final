import asyncio

import pytest

from app.api.auth import get_me


def test_get_me_returns_authenticated_user_projection():
    user = {
        "id": 12,
        "email": "me@example.com",
        "role": "user",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00+00:00",
        "profile": {"name": "Test User"},
        "hashed_password": "must-not-be-returned",
    }

    result = asyncio.run(get_me(user))

    assert result == {key: value for key, value in user.items() if key != "hashed_password"}


def test_get_me_handles_missing_optional_profile():
    user = {
        "id": 12,
        "email": "me@example.com",
        "role": "user",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00+00:00",
    }

    result = asyncio.run(get_me(user))

    assert result["profile"] is None


def test_get_me_rejects_incomplete_authenticated_principal():
    with pytest.raises(KeyError):
        asyncio.run(get_me({"id": 12}))
