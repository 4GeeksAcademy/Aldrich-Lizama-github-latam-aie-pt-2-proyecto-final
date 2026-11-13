import asyncio
import hashlib
from urllib.parse import parse_qs, urlparse

import httpx
import pytest

import app.api.auth as auth_api
from app.schemas.auth_user import ForgotPasswordRequest
from app.services.db_service import (
    create_user,
    get_password_reset_token,
)


def test_forgot_password_persists_only_token_hash_and_sends_link(monkeypatch):
    user = create_user(email="forgot@example.com", password="ValidPass123!")
    sent = {}

    async def capture_email(email_to, reset_url):
        sent.update(email_to=email_to, reset_url=reset_url)

    monkeypatch.setattr(auth_api, "send_reset_password_email", capture_email)
    result = asyncio.run(
        auth_api.forgot_password(ForgotPasswordRequest(email="forgot@example.com"))
    )

    raw_token = parse_qs(urlparse(sent["reset_url"]).query)["token"][0]
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    record = get_password_reset_token(token_hash)
    assert sent["email_to"] == user["email"]
    assert record["user_id"] == user["id"]
    assert raw_token not in record["token_hash"]
    assert "Si la dirección está registrada" in result["message"]


def test_forgot_password_unknown_email_uses_same_public_message(monkeypatch):
    async def fail_if_called(**_kwargs):
        pytest.fail("No se debe enviar correo para una cuenta inexistente")

    monkeypatch.setattr(auth_api, "send_reset_password_email", fail_if_called)
    result = asyncio.run(
        auth_api.forgot_password(ForgotPasswordRequest(email="missing@example.com"))
    )

    assert "Si la dirección está registrada" in result["message"]


@pytest.mark.parametrize(
    "email_error",
    [
        httpx.RequestError("private host"),
        RuntimeError("private mail configuration"),
    ],
)
def test_forgot_password_swallows_expected_email_failures(monkeypatch, email_error):
    create_user(email="mail-failure@example.com", password="ValidPass123!")

    async def fail_email(**_kwargs):
        raise email_error

    monkeypatch.setattr(auth_api, "send_reset_password_email", fail_email)
    result = asyncio.run(
        auth_api.forgot_password(
            ForgotPasswordRequest(email="mail-failure@example.com")
        )
    )

    assert "Si la dirección está registrada" in result["message"]


def test_forgot_password_swallows_http_email_failure(monkeypatch):
    create_user(email="http-failure@example.com", password="ValidPass123!")
    request = httpx.Request("POST", "https://mail.example.test")
    response = httpx.Response(503, request=request)
    error = httpx.HTTPStatusError("private response", request=request, response=response)

    async def fail_email(**_kwargs):
        raise error

    monkeypatch.setattr(auth_api, "send_reset_password_email", fail_email)
    result = asyncio.run(
        auth_api.forgot_password(
            ForgotPasswordRequest(email="http-failure@example.com")
        )
    )

    assert "private response" not in result["message"]
