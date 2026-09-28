"""API CRUD para el Gestor Centralizado de Incidencias Nexova."""

import json
from enum import Enum
from typing import Any, TypeVar
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator
from tinydb import Query

from packages.shared.incident_validation import (
    INCIDENT_REQUIRED_FIELDS,
    validate_incident_fields,
)
from services.api.database import get_table
from services.api.models import (
    Incident,
    IncidentBranch,
    IncidentCategory,
    IncidentOrigin,
    IncidentStatus,
)

router = APIRouter(prefix="/api/incidents", tags=["incidents"])
SchemaT = TypeVar("SchemaT", bound=BaseModel)
EnumT = TypeVar("EnumT", bound=Enum)


class IncidentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    category: IncidentCategory
    status: IncidentStatus = IncidentStatus.OPEN
    origin: IncidentOrigin
    branch: IncidentBranch

    @field_validator("title", "description")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Este campo no puede estar vacío.")
        return value


class IncidentStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: IncidentStatus


_FIELD_LABELS = {
    "title": "título",
    "description": "descripción",
    "category": "categoría",
    "status": "estado",
    "origin": "origen",
    "branch": "sede",
    "id": "identificador",
    "body": "cuerpo de la petición",
}

_ALLOWED_TRANSITIONS = {
    IncidentStatus.OPEN: {IncidentStatus.IN_PROGRESS, IncidentStatus.DISCARDED},
    IncidentStatus.IN_PROGRESS: {IncidentStatus.RESOLVED, IncidentStatus.DISCARDED},
    IncidentStatus.RESOLVED: set(),
    IncidentStatus.DISCARDED: set(),
}


def _validation_error(field: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=400,
        detail={"errors": [{"field": field, "message": message}]},
    )


def _validation_message(field: str, error_type: str) -> str:
    label = _FIELD_LABELS.get(field, field)
    if error_type == "missing":
        return f"El campo {label} es obligatorio."
    if error_type in {"enum", "literal_error"}:
        return f"El valor de {label} no está permitido."
    if error_type in {"string_too_short", "value_error"}:
        return f"El campo {label} no puede estar vacío."
    return f"El campo {label} no es válido."


async def _json_object(request: Request) -> dict[str, Any]:
    try:
        payload = await request.json()
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise _validation_error("body", "Debe ser un objeto JSON válido.")

    if not isinstance(payload, dict):
        raise _validation_error("body", "Debe ser un objeto JSON.")
    return payload


async def _parse_body(request: Request, schema: type[SchemaT]) -> SchemaT:
    payload = await _json_object(request)
    required_fields = (
        INCIDENT_REQUIRED_FIELDS
        if schema is IncidentCreate
        else ("status",)
    )
    shared_errors = validate_incident_fields(payload, required_fields)
    if shared_errors:
        raise HTTPException(
            status_code=400,
            detail={
                "errors": [
                    {"field": field, "message": message}
                    for field, message in shared_errors.items()
                ]
            },
        )
    try:
        return schema.model_validate(payload)
    except ValidationError as error:
        failures = []
        for item in error.errors(include_url=False, include_input=False):
            field = str(item["loc"][0]) if item["loc"] else "body"
            failures.append(
                {
                    "field": field,
                    "message": _validation_message(field, item["type"]),
                }
            )
        raise HTTPException(status_code=400, detail={"errors": failures})


def _parse_filter(
    value: str | None,
    enum_type: type[EnumT],
    field: str,
) -> EnumT | None:
    if value is None:
        return None
    try:
        return enum_type(value)
    except ValueError:
        allowed_values = ", ".join(member.value for member in enum_type)
        raise _validation_error(
            field,
            f"El valor de {_FIELD_LABELS[field]} no está permitido. Valores válidos: {allowed_values}.",
        )


def _parse_incident_id(value: str) -> str:
    try:
        return str(UUID(value))
    except ValueError:
        raise _validation_error("id", "Debe ser un identificador UUID válido.")


def _get_incident_or_404(incident_id: str):
    table = get_table("incidents")
    query = Query()
    document = table.get(query.id == incident_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return table, document, Incident.model_validate(dict(document))


@router.post("", status_code=201, response_model=Incident)
async def create_incident(request: Request) -> Incident:
    """Crea una incidencia; su UUID y timestamps los genera el modelo."""
    payload = await _parse_body(request, IncidentCreate)
    incident = Incident(**payload.model_dump())
    get_table("incidents").insert(incident.model_dump(mode="json"))
    return incident


@router.get("", response_model=list[Incident])
async def list_incidents(
    status: str | None = None,
    origin: str | None = None,
    branch: str | None = None,
    category: str | None = None,
) -> list[Incident]:
    """Lista incidencias con filtros opcionales de igualdad exacta."""
    filters = {
        "status": _parse_filter(status, IncidentStatus, "status"),
        "origin": _parse_filter(origin, IncidentOrigin, "origin"),
        "branch": _parse_filter(branch, IncidentBranch, "branch"),
        "category": _parse_filter(category, IncidentCategory, "category"),
    }
    incidents = [
        Incident.model_validate(dict(document))
        for document in get_table("incidents").all()
    ]
    return [
        incident
        for incident in incidents
        if all(
            expected is None or getattr(incident, field) == expected
            for field, expected in filters.items()
        )
    ]


@router.get("/summary")
async def incidents_summary() -> dict[str, Any]:
    """Agrega totales por estado, categoría, origen y sede; vacío devuelve ceros."""
    counts = {
        "by_status": {item.value: 0 for item in IncidentStatus},
        "by_category": {item.value: 0 for item in IncidentCategory},
        "by_origin": {item.value: 0 for item in IncidentOrigin},
        "by_branch": {item.value: 0 for item in IncidentBranch},
    }
    for document in get_table("incidents").all():
        incident = Incident.model_validate(dict(document))
        counts["by_status"][incident.status.value] += 1
        counts["by_category"][incident.category.value] += 1
        counts["by_origin"][incident.origin.value] += 1
        counts["by_branch"][incident.branch.value] += 1
    counts["total"] = sum(counts["by_status"].values())
    return counts


@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str) -> Incident:
    """Devuelve el detalle de una incidencia por UUID."""
    _, _, incident = _get_incident_or_404(_parse_incident_id(incident_id))
    return incident


@router.patch("/{incident_id}/status", response_model=Incident)
async def update_incident_status(incident_id: str, request: Request) -> Incident:
    """Actualiza el estado respetando las transiciones permitidas del ciclo de vida."""
    normalized_id = _parse_incident_id(incident_id)
    payload = await _parse_body(request, IncidentStatusUpdate)
    table, document, incident = _get_incident_or_404(normalized_id)
    allowed = _ALLOWED_TRANSITIONS[incident.status]
    if payload.status not in allowed:
        current = incident.status.value
        target = payload.status.value
        raise HTTPException(
            status_code=400,
            detail={
                "errors": [
                    {
                        "field": "status",
                        "message": f"No se permite cambiar de '{current}' a '{target}'.",
                    }
                ]
            },
        )

    incident.status = payload.status
    table.update(incident.model_dump(mode="json"), doc_ids=[document.doc_id])
    return incident