#!/usr/bin/env python3
"""
models.py — Nexova Suppliers Directory · Pydantic schemas
==========================================================
Define los modelos de datos para el directorio de proveedores:
  - SupplierCreate (registro nuevo)
  - SupplierRateUpdate (actualización de tarifa)
  - SupplierStatusUpdate (activar/suspender)
  - SupplierResponse (respuesta completa con id e ISO timestamp)
"""

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

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