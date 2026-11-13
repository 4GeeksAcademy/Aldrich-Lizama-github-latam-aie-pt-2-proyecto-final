import os

os.environ.setdefault("SECRET_KEY", "unit-test-secret-key-change-me-32-bytes")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

import pytest


@pytest.fixture(autouse=True)
def isolate_auth_database(tmp_path, monkeypatch):
    import app.services.db_service as db_service

    previous = db_service._db_instance
    if previous is not None:
        previous.close()
    monkeypatch.setattr(db_service, "_DB_PATH", tmp_path / "auth-tests.json")
    monkeypatch.setattr(db_service, "_db_instance", None)
    yield
    current = db_service._db_instance
    if current is not None:
        current.close()
