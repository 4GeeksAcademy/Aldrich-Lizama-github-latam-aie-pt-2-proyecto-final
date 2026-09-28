"""Validación compartida del dominio Incident.

Este módulo no depende de FastAPI, TinyDB ni IO para que puedan reutilizarlo
el router HTTP y el seed histórico.
"""

from collections.abc import Mapping, Sequence
from typing import Any

INCIDENT_STATUSES = ("open", "in_progress", "resolved", "discarded")
INCIDENT_ORIGINS = ("customer", "branch", "internal")
INCIDENT_CATEGORIES = (
    "technical_failure",
    "process_error",
    "client_complaint",
    "candidate_issue",
    "staff_issue",
    "sla_breach",
    "data_quality",
    "other",
)
INCIDENT_BRANCHES = ("central", "valencia_operations", "miami_office", "remote")
INCIDENT_REQUIRED_FIELDS = ("title", "description", "category", "origin", "branch")


def validate_incident_fields(
    payload: Mapping[str, Any],
    required_fields: Sequence[str] = INCIDENT_REQUIRED_FIELDS,
) -> dict[str, str]:
    """Devuelve errores legibles por campo; un resultado vacío significa válido."""
    errors: dict[str, str] = {}
    for field in required_fields:
        value = payload.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            errors[field] = "Este campo es obligatorio y no puede estar vacío."

    allowed_values = {
        "status": INCIDENT_STATUSES,
        "origin": INCIDENT_ORIGINS,
        "category": INCIDENT_CATEGORIES,
        "branch": INCIDENT_BRANCHES,
    }
    for field, allowed in allowed_values.items():
        value = payload.get(field)
        if value is not None and value not in allowed:
            errors[field] = f"Valor no permitido. Valores válidos: {', '.join(allowed)}."
    return errors
