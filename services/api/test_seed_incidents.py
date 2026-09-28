from pathlib import Path

from tinydb import TinyDB

from services.api.seed_incidents import DEFAULT_CSV_PATH, _transform_row, seed_incidents


def test_seed_incidents_transforms_and_is_idempotent(tmp_path: Path) -> None:
    database = TinyDB(str(tmp_path / "incidents.json"))
    table = database.table("incidents")
    messages: list[str] = []

    first_run = seed_incidents(DEFAULT_CSV_PATH, table, messages.append)

    assert first_run["inserted"] == 96
    assert first_run["duplicates"] == 0
    assert first_run["invalid"] == 4
    assert first_run["by_status"] == {
        "discarded": 13,
        "open": 27,
        "resolved": 56,
    }
    assert first_run["by_category"] == {
        "client_complaint": 12,
        "process_error": 35,
        "technical_failure": 49,
    }

    incidents = table.all()
    assert len(incidents) == 96
    assert all("ticket_id" not in incident for incident in incidents)
    assert all(incident["origin"] == "customer" for incident in incidents)
    assert all(incident["branch"] == "central" for incident in incidents)
    assert all(incident["created_at"] == incident["updated_at"] for incident in incidents)
    assert any("inválidas descartadas" in message for message in messages)

    second_run = seed_incidents(DEFAULT_CSV_PATH, table, messages.append)

    assert second_run["inserted"] == 0
    assert second_run["duplicates"] == 96
    assert second_run["invalid"] == 4
    assert len(table.all()) == 96
    database.close()


def test_seed_uses_title_and_created_at_when_ticket_id_is_missing() -> None:
    row = {
        "ticket_id": "",
        "date": "2024-01-18",
        "client_company": "Nexova Client",
        "category": "TECHNICAL",
        "description": "  Login service unavailable for users.  ",
        "agent_id": "AGT-08",
        "status": "OPEN",
        "customer_email": "customer@example.test",
        "satisfaction_score": "",
    }

    incident, errors = _transform_row(row)
    repeated_incident, repeated_errors = _transform_row(row)

    assert errors == []
    assert repeated_errors == []
    assert incident is not None
    assert repeated_incident is not None
    assert incident.id == repeated_incident.id
    assert incident.title == "Login service unavailable for users."
    assert incident.description == row["description"]
    assert incident.created_at.isoformat() == "2024-01-18T00:00:00+00:00"