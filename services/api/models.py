#!/usr/bin/env python3
"""
models.py — Nexova API · Pydantic models
========================================
Define los modelos de datos para incidencias y proveedores:
- Incident
  - SupplierCreate (registro nuevo)
  - SupplierRateUpdate (actualización de tarifa)
  - SupplierStatusUpdate (activar/suspender)
  - SupplierResponse (respuesta completa con id e ISO timestamp)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class IncidentStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class IncidentOrigin(str, Enum):
    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


class IncidentCategory(str, Enum):
    TECHNICAL_FAILURE = "technical_failure"
    PROCESS_ERROR = "process_error"
    CLIENT_COMPLAINT = "client_complaint"
    CANDIDATE_ISSUE = "candidate_issue"
    STAFF_ISSUE = "staff_issue"
    SLA_BREACH = "sla_breach"
    DATA_QUALITY = "data_quality"
    OTHER = "other"


class IncidentBranch(str, Enum):
    CENTRAL = "central"
    VALENCIA_OPERATIONS = "valencia_operations"
    MIAMI_OFFICE = "miami_office"
    REMOTE = "remote"


class Incident(BaseModel):
    """Incidencia gestionada por el equipo de soporte de Nexova."""

    model_config = ConfigDict(validate_assignment=True)

    id: UUID = Field(default_factory=uuid4, description="Identificador único")
    title: str = Field(..., min_length=1, description="Título breve de la incidencia")
    description: str = Field(..., min_length=1, description="Descripción detallada")
    category: IncidentCategory
    status: IncidentStatus = IncidentStatus.OPEN
    origin: IncidentOrigin
    branch: IncidentBranch = Field(
        ...,
        description=(
            "Sede: central, valencia_operations, miami_office o remote. "
            "Usar central si no aplica una sede específica."
        ),
    )
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El título no puede estar vacío")
        return normalized

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("La descripción no puede estar vacía")
        return value

    def __setattr__(self, name: str, value: object) -> None:
        super().__setattr__(name, value)
        if (
            name in type(self).model_fields
            and name not in {"id", "created_at", "updated_at"}
            and "updated_at" in self.__dict__
        ):
            super().__setattr__("updated_at", _utc_now())

# ══════════════════════════════════════════════════════════
#  Constantes del dominio
# ══════════════════════════════════════════════════════════

VALID_CATEGORIES = [
    "job_boards",
    "ats_software",
    "assessment_tools",
    "training_platforms",
    "payroll_and_hr_software",
    "video_interview",
    "background_check",
    "office_and_facilities",
    "it_and_software_licenses",
]

VALID_STATUSES = ["active", "suspended"]

VALID_COUNTRIES = ["Spain", "USA"]

CURRENCY_MAP = {
    "Spain": "EUR",
    "USA": "USD",
}


# ══════════════════════════════════════════════════════════
#  Modelo base (campos comunes)
# ══════════════════════════════════════════════════════════


class SupplierBase(BaseModel):
    """Campos compartidos por los modelos de proveedor."""

    name: str = Field(..., min_length=1, description="Nombre comercial del proveedor")
    country: str = Field(
        ...,
        description="País del contrato activo: 'Spain' o 'USA'",
    )
    categories: list[str] = Field(
        ...,
        min_length=1,
        description="Lista de categorías de servicio (mínimo 1)",
    )
    monthly_rate: float = Field(
        ...,
        gt=0,
        description="Coste mensual vigente en la moneda del contrato",
    )
    currency: str = Field(
        ...,
        description="'EUR' para Spain, 'USD' para USA",
    )
    status: str = Field(
        ...,
        description="'active' o 'suspended'",
    )
    contract_renewal_date: Optional[str] = Field(
        None,
        description="Fecha de renovación del contrato (YYYY-MM-DD)",
    )
    contact_email: Optional[str] = Field(
        None,
        description="Email del account manager del proveedor",
    )
    notes: Optional[str] = Field(
        None,
        description="Observaciones internas",
    )
    deleted_at: Optional[str] = Field(
        None,
        description="Timestamp ISO de cuándo se deshabilitó el proveedor (soft-delete)",
    )

    # ── Validadores ──────────────────────────────────────

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        if v not in VALID_COUNTRIES:
            raise ValueError(
                f"País no válido: '{v}'. Debe ser uno de: {', '.join(VALID_COUNTRIES)}"
            )
        return v

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, v: list[str]) -> list[str]:
        for cat in v:
            if cat not in VALID_CATEGORIES:
                raise ValueError(
                    f"Categoría no válida: '{cat}'. "
                    f"Válidas: {', '.join(VALID_CATEGORIES)}"
                )
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(
                f"Estado no válido: '{v}'. Debe ser 'active' o 'suspended'"
            )
        return v

    @field_validator("contract_renewal_date")
    @classmethod
    def validate_date_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if v == "":
                return None
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError(
                    f"Formato de fecha inválido: '{v}'. Debe ser YYYY-MM-DD"
                )
        return v

    @field_validator("contact_email", "notes")
    @classmethod
    def normalize_empty_strings(cls, v: Optional[str]) -> Optional[str]:
        """Convertir strings vacíos a None para evitar errores de validación."""
        if v is not None and v == "":
            return None
        return v

    @model_validator(mode="after")
    def validate_currency_country_consistency(self) -> "SupplierBase":
        """Rechazar combinaciones inconsistentes de país y moneda."""
        expected_currency = CURRENCY_MAP.get(self.country)
        if expected_currency and self.currency != expected_currency:
            raise ValueError(
                f"Moneda inconsistente: país '{self.country}' requiere "
                f"'{expected_currency}', pero se recibió '{self.currency}'."
            )
        return self


# ══════════════════════════════════════════════════════════
#  Modelo de creación
# ══════════════════════════════════════════════════════════


class SupplierCreate(SupplierBase):
    """Esquema para registrar un nuevo proveedor."""

    pass


# ══════════════════════════════════════════════════════════
#  Modelos de actualización parcial
# ══════════════════════════════════════════════════════════


class SupplierRateUpdate(BaseModel):
    """Esquema para actualizar solo la tarifa mensual."""

    monthly_rate: float = Field(
        ...,
        gt=0,
        description="Nuevo coste mensual vigente",
    )


class SupplierStatusUpdate(BaseModel):
    """Esquema para activar o suspender un proveedor."""

    status: str = Field(
        ...,
        description="'active' o 'suspended'",
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(
                f"Estado no válido: '{v}'. Debe ser 'active' o 'suspended'"
            )
        return v


# ══════════════════════════════════════════════════════════
#  Modelo de respuesta (con id e ISO timestamp)
# ══════════════════════════════════════════════════════════


class SupplierResponse(SupplierBase):
    """Esquema de respuesta que incluye id y updated_at."""

    id: str = Field(..., description="Identificador asignado por TinyDB")
    updated_at: str = Field(
        ...,
        description="Timestamp ISO de la última actualización de tarifa",
    )


# ══════════════════════════════════════════════════════════
#  Utilidad para generar updated_at ISO
# ══════════════════════════════════════════════════════════


def now_iso() -> str:
    """Retorna el timestamp actual en formato ISO 8601."""
    return datetime.now(timezone.utc).isoformat()