#!/usr/bin/env python3
"""Importa incidencias históricas desde el CSV del analizador."""

import argparse
import csv
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from uuid import NAMESPACE_URL, uuid5

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from packages.nexova_analyzer.validators import (
    classify_row,
    validate_date,
    validate_ticket_id,
)
from packages.shared.incident_validation import validate_incident_fields
from services.api.database import get_table
from services.api.models import Incident, IncidentCategory, IncidentOrigin, IncidentStatus

DEFAULT_CSV_PATH = _REPO_ROOT / "scripts" / "incidents-nexova.csv"

STATUS_MAP = {
    "OPEN": IncidentStatus.OPEN,
    "CLOSED": IncidentStatus.RESOLVED,
    "DISCARDED": IncidentStatus.DISCARDED,
}

CATEGORY_MAP = {
    "TECHNICAL": IncidentCategory.TECHNICAL_FAILURE,
    "BILLING": IncidentCategory.PROCESS_ERROR,
    "ACCESS": IncidentCategory.TECHNICAL_FAILURE,
    "HR_QUERY": IncidentCategory.PROCESS_ERROR,
    "COMPLAINT": IncidentCategory.CLIENT_COMPLAINT,
}


def _transform_row(row: dict[str, str]) -> tuple[Incident | None, list[str]]:
    """Valida una fila CSV y la transforma al esquema Incident del gestor."""
    errors = classify_row(row)
    source_status = (row.get("status") or "").strip()
    source_category = (row.get("category") or "").strip()
    source_date = (row.get("date") or "").strip()
    source_ticket_id = (row.get("ticket_id") or "").strip()

    if source_ticket_id and not validate_ticket_id(source_ticket_id):
        errors.append("Invalid ticket_id")
    if not validate_date(source_date):
        errors.append("Invalid or missing date")
    if source_status not in STATUS_MAP:
        errors.append("Unmapped status")
    if source_category not in CATEGORY_MAP:
        errors.append("Unmapped category")

    description = row.get("description") or ""
    title = description[:120].strip()
    if not title:
        errors.append("Description does not produce a title")

    created_at: datetime | None = None
    if validate_date(source_date):
        try:
            created_at = datetime.strptime(source_date, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        except ValueError:
            errors.append("Invalid calendar date")

    if errors or created_at is None:
        return None, errors

    idempotency_key = source_ticket_id or f"{title}|{created_at.isoformat()}"
    incident_id = uuid5(NAMESPACE_URL, f"nexova-incident:{idempotency_key}")
    transformed_payload = {
        "title": title,
        "description": description,
        "category": CATEGORY_MAP[source_category].value,
        "status": STATUS_MAP[source_status].value,
        "origin": "customer",
        "branch": "central",
    }
    shared_errors = validate_incident_fields(transformed_payload)
    if shared_errors:
        return None, [f"{field}: {message}" for field, message in shared_errors.items()]

    try:
        incident = Incident(
            id=incident_id,
            title=title,
            description=description,
            category=CATEGORY_MAP[source_category],
            status=STATUS_MAP[source_status],
            origin=IncidentOrigin.CUSTOMER,
            branch="central",
            created_at=created_at,
            updated_at=created_at,
        )
    except ValueError:
        return None, ["Incident model validation failed"]

    return incident, []


def seed_incidents(
    csv_path: Path = DEFAULT_CSV_PATH,
    incidents_table: Any = None,
    report: Callable[[str], None] = print,
) -> dict[str, Any]:
    """Carga incidencias válidas una sola vez, identificadas por ticket_id.

    ``ticket_id`` participa en el UUID determinista, pero no se persiste como
    campo del modelo Incident. Para filas sin ticket_id, usa title + created_at.
    ``incidents_table`` permite ejecutar pruebas con una tabla temporal.
    """
    table = incidents_table if incidents_table is not None else get_table("incidents")
    existing_ids = {str(document.get("id")) for document in table.all()}

    inserted = 0
    duplicates = 0
    invalid_rows: list[tuple[int, list[str]]] = []
    inserted_by_status: Counter[str] = Counter()
    inserted_by_category: Counter[str] = Counter()

    with csv_path.open("r", newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        for row in reader:
            incident, errors = _transform_row(row)
            if incident is None:
                invalid_rows.append((reader.line_num, errors))
                continue

            incident_id = str(incident.id)
            if incident_id in existing_ids:
                duplicates += 1
                continue

            table.insert(incident.model_dump(mode="json"))
            existing_ids.add(incident_id)
            inserted += 1
            inserted_by_status[incident.status.value] += 1
            inserted_by_category[incident.category.value] += 1

    report(
        f"Incidencias: {inserted} insertadas, {duplicates} duplicadas omitidas, "
        f"{len(invalid_rows)} inválidas descartadas."
    )
    if inserted_by_status:
        report(f"Insertadas por estado: {dict(sorted(inserted_by_status.items()))}")
        report(
            "Insertadas por categoría: "
            f"{dict(sorted(inserted_by_category.items()))}"
        )
    if invalid_rows:
        report("Filas CSV inválidas (número de línea: motivos):")
        for line_number, reasons in invalid_rows:
            report(f"  {line_number}: {', '.join(reasons)}")

    return {
        "inserted": inserted,
        "duplicates": duplicates,
        "invalid": len(invalid_rows),
        "invalid_rows": invalid_rows,
        "by_status": dict(inserted_by_status),
        "by_category": dict(inserted_by_category),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "csv_path",
        nargs="?",
        type=Path,
        default=DEFAULT_CSV_PATH,
        help=f"CSV histórico a cargar (por defecto: {DEFAULT_CSV_PATH})",
    )
    args = parser.parse_args()

    if not args.csv_path.exists():
        print(f"Error: el archivo '{args.csv_path}' no existe.", file=sys.stderr)
        sys.exit(1)
    if not args.csv_path.is_file():
        print(f"Error: '{args.csv_path}' no es un archivo válido.", file=sys.stderr)
        sys.exit(1)

    try:
        seed_incidents(args.csv_path)
    except (FileNotFoundError, PermissionError) as exc:
        logger = logging.getLogger("nexova.api")
        logger.exception("No se pudo cargar el archivo CSV: %s", exc)
        print(f"Error al leer '{args.csv_path}': {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()