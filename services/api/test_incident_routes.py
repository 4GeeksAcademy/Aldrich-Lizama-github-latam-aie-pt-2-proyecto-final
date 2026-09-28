from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from tinydb import TinyDB

from services.api import database
from services.api.errors import unhandled_exception_handler
from services.api.routes import incidents


@pytest.fixture
def client(tmp_path, monkeypatch) -> Iterator[TestClient]:
    monkeypatch.setattr(database, "_DB_PATH", tmp_path / "incidents.json")
    monkeypatch.setattr(database, "_db_instance", None)
    app = FastAPI()
    app.add_exception_handler(Exception, unhandled_exception_handler)
    app.include_router(incidents.router)
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    if database._db_instance is not None:
        database._db_instance.close()
        monkeypatch.setattr(database, "_db_instance", None)


def valid_payload(**overrides):
    return {
        "title": "No se puede iniciar sesión",
        "description": "El sistema rechaza las credenciales válidas.",
        "category": "technical_failure",
        "origin": "customer",
        "branch": "central",
        **overrides,
    }


def test_empty_read_endpoints_return_empty_values(client: TestClient) -> None:
    assert client.get("/api/incidents").json() == []
    assert client.get("/api/incidents/summary").json() == {
        "by_status": {
            "open": 0,
            "in_progress": 0,
            "resolved": 0,
            "discarded": 0,
        },
        "by_category": {
            "technical_failure": 0,
            "process_error": 0,
            "client_complaint": 0,
            "candidate_issue": 0,
            "staff_issue": 0,
            "sla_breach": 0,
            "data_quality": 0,
            "other": 0,
        },
        "by_origin": {"customer": 0, "branch": 0, "internal": 0},
        "by_branch": {
            "central": 0,
            "valencia_operations": 0,
            "miami_office": 0,
            "remote": 0,
        },
        "total": 0,
    }


@pytest.mark.parametrize(
    ("payload", "invalid_field"),
    [
        ({"description": "Detalle", "category": "other", "origin": "internal", "branch": "central"}, "title"),
        ({"title": "Título", "category": "other", "origin": "internal", "branch": "central"}, "description"),
        (valid_payload(title="   "), "title"),
        (valid_payload(description="   "), "description"),
        (valid_payload(category="TECHNICAL"), "category"),
        (valid_payload(status="closed"), "status"),
        (valid_payload(origin="agent"), "origin"),
        (valid_payload(branch="headquarters"), "branch"),
    ],
)
def test_create_rejects_missing_or_invalid_fields_with_400(
    client: TestClient,
    payload: dict,
    invalid_field: str,
) -> None:
    response = client.post("/api/incidents", json=payload)

    assert response.status_code == 400
    assert any(
        item["field"] == invalid_field
        for item in response.json()["detail"]["errors"]
    )


def test_create_list_detail_filters_and_lifecycle(client: TestClient) -> None:
    created = client.post("/api/incidents", json=valid_payload())
    assert created.status_code == 201
    incident = created.json()
    incident_id = incident["id"]
    assert incident["status"] == "open"
    assert client.get(f"/api/incidents/{incident_id}").json() == incident

    filtered = client.get(
        "/api/incidents",
        params={
            "status": "open",
            "origin": "customer",
            "branch": "central",
            "category": "technical_failure",
        },
    )
    assert filtered.status_code == 200
    assert [item["id"] for item in filtered.json()] == [incident_id]
    assert client.get("/api/incidents?status=OPEN").status_code == 400

    forbidden_transition = client.patch(
        f"/api/incidents/{incident_id}/status", json={"status": "resolved"}
    )
    assert forbidden_transition.status_code == 400

    started = client.patch(
        f"/api/incidents/{incident_id}/status", json={"status": "in_progress"}
    )
    assert started.status_code == 200
    resolved = client.patch(
        f"/api/incidents/{incident_id}/status", json={"status": "resolved"}
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"
    assert (
        client.patch(
            f"/api/incidents/{incident_id}/status", json={"status": "discarded"}
        ).status_code
        == 400
    )

    open_incident = client.post(
        "/api/incidents", json=valid_payload(title="Otra incidencia")
    ).json()
    discarded = client.patch(
        f"/api/incidents/{open_incident['id']}/status", json={"status": "discarded"}
    )
    assert discarded.status_code == 200
    assert client.get("/api/incidents/not-a-uuid").status_code == 400
    assert client.get("/api/incidents/00000000-0000-0000-0000-000000000000").status_code == 404


def test_summary_counts_all_incident_dimensions(client: TestClient) -> None:
    client.post("/api/incidents", json=valid_payload())
    client.post(
        "/api/incidents",
        json=valid_payload(
            category="sla_breach",
            status="in_progress",
            origin="branch",
            branch="miami_office",
        ),
    )

    summary = client.get("/api/incidents/summary").json()
    assert summary["total"] == 2
    assert summary["by_status"] == {
        "open": 1,
        "in_progress": 1,
        "resolved": 0,
        "discarded": 0,
    }
    assert summary["by_category"]["technical_failure"] == 1
    assert summary["by_category"]["sla_breach"] == 1
    assert summary["by_origin"]["customer"] == 1
    assert summary["by_origin"]["branch"] == 1
    assert summary["by_branch"]["central"] == 1
    assert summary["by_branch"]["miami_office"] == 1


def test_unhandled_errors_return_generic_500(client: TestClient, monkeypatch) -> None:
    def fail_get_table(table_name: str):
        raise RuntimeError("secret internal traceback details")

    monkeypatch.setattr(incidents, "get_table", fail_get_table)
    response = client.get("/api/incidents")

    assert response.status_code == 500
    assert response.json() == {"detail": "Error interno del servidor."}
    assert "secret internal traceback details" not in response.text