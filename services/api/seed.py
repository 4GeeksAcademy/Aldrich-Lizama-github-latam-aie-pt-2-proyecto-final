#!/usr/bin/env python3
"""
seed.py — Nexova Suppliers Directory · Seed data loader
=========================================================
Script de carga de datos iniciales para el directorio de proveedores.

Idempotente: verifica por nombre si el proveedor ya existe antes de insertar.
Ejecutable directamente: `python3 services/api/seed.py`

Uso:
    python3 services/api/seed.py            # Carga si no hay duplicados
    python3 services/api/seed.py --force     # Vacía y recarga todo
"""

import sys
import os

# ── Asegurar que el repo root está en sys.path ──────────
_REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.api.database import get_suppliers_table
from services.api.models import SupplierCreate, now_iso

# ══════════════════════════════════════════════════════════
#  Datos semilla (extraídos textualmente del CONTEXT)
# ══════════════════════════════════════════════════════════

SUPPLIERS_SEED = [
    {
        "name": "LinkedIn Talent Solutions",
        "country": "Spain",
        "categories": ["job_boards"],
        "monthly_rate": 1200.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-03-31",
        "contact_email": "account@linkedin.com",
        "notes": "Licencia corporativa para publicación de ofertas y búsqueda de candidatos.",
    },
    {
        "name": "InfoJobs Premium",
        "country": "Spain",
        "categories": ["job_boards"],
        "monthly_rate": 490.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-06-30",
        "contact_email": "empresas@infojobs.net",
    },
    {
        "name": "Indeed Sponsored",
        "country": "USA",
        "categories": ["job_boards"],
        "monthly_rate": 850.0,
        "currency": "USD",
        "status": "active",
        "contact_email": "sales@indeed.com",
        "notes": "Campañas de pago por clic para perfiles de customer support en Miami.",
    },
    {
        "name": "Workable",
        "country": "Spain",
        "categories": ["ats_software"],
        "monthly_rate": 299.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-09-15",
        "contact_email": "support@workable.com",
        "notes": "ATS principal para el equipo de selección de Valencia.",
    },
    {
        "name": "Greenhouse",
        "country": "USA",
        "categories": ["ats_software"],
        "monthly_rate": 620.0,
        "currency": "USD",
        "status": "suspended",
        "contact_email": "accounts@greenhouse.io",
        "notes": "Suspendido tras no renovar. Sergio está evaluando si migrar todo a Workable.",
    },
    {
        "name": "Thomas International",
        "country": "Spain",
        "categories": ["assessment_tools"],
        "monthly_rate": 380.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-12-01",
        "contact_email": "clientes@thomas.es",
        "notes": "Tests de personalidad y aptitud para procesos de mandos intermedios.",
    },
    {
        "name": "HireVue",
        "country": "USA",
        "categories": ["video_interview"],
        "monthly_rate": 540.0,
        "currency": "USD",
        "status": "active",
        "contract_renewal_date": "2025-08-31",
        "contact_email": "support@hirevue.com",
    },
    {
        "name": "Udemy Business",
        "country": "Spain",
        "categories": ["training_platforms"],
        "monthly_rate": 420.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2026-01-15",
        "contact_email": "business@udemy.com",
        "notes": "Licencias para el equipo interno. Gestionado por Elena Vargas.",
    },
    {
        "name": "Coursera for Teams",
        "country": "USA",
        "categories": ["training_platforms"],
        "monthly_rate": 399.0,
        "currency": "USD",
        "status": "suspended",
        "contact_email": "teams@coursera.com",
        "notes": "Suspendido por bajo uso. Revisar antes de Q4.",
    },
    {
        "name": "Sage HR",
        "country": "Spain",
        "categories": ["payroll_and_hr_software"],
        "monthly_rate": 310.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-10-01",
        "contact_email": "soporte@sage.com",
        "notes": "Software de nóminas y gestión de personal para la sede de Valencia.",
    },
    {
        "name": "Gusto",
        "country": "USA",
        "categories": ["payroll_and_hr_software"],
        "monthly_rate": 280.0,
        "currency": "USD",
        "status": "active",
        "contact_email": "support@gusto.com",
        "notes": "Gestión de nóminas para los empleados de la oficina de Miami.",
    },
    {
        "name": "Checkr",
        "country": "USA",
        "categories": ["background_check"],
        "monthly_rate": 195.0,
        "currency": "USD",
        "status": "active",
        "contract_renewal_date": "2025-11-30",
        "contact_email": "sales@checkr.com",
    },
    {
        "name": "Microsoft 365 Business",
        "country": "Spain",
        "categories": ["it_and_software_licenses"],
        "monthly_rate": 760.0,
        "currency": "EUR",
        "status": "active",
        "contact_email": "enterprise@microsoft.com",
        "notes": "Licencias para toda la plantilla de Valencia y Miami.",
    },
    {
        "name": "Regus Valencia",
        "country": "Spain",
        "categories": ["office_and_facilities"],
        "monthly_rate": 2400.0,
        "currency": "EUR",
        "status": "active",
        "contract_renewal_date": "2025-07-01",
        "contact_email": "valencia@regus.com",
        "notes": "Alquiler de la oficina principal en Valencia. Incluye sala de reuniones.",
    },
    {
        "name": "WeWork Miami",
        "country": "USA",
        "categories": ["office_and_facilities"],
        "monthly_rate": 3100.0,
        "currency": "USD",
        "status": "active",
        "contract_renewal_date": "2025-09-30",
        "contact_email": "miami@wework.com",
    },
]


# ══════════════════════════════════════════════════════════
#  Función principal
# ══════════════════════════════════════════════════════════


def seed_suppliers(force: bool = False) -> int:
    """Carga los proveedores semilla en TinyDB, saltando los que ya existen.

    Estrategia de idempotencia:
    - Obtiene todos los nombres ya almacenados en la tabla 'suppliers'.
    - Para cada semilla, si su `name` ya existe, se omite.
    - Si `force=True`, vacía la tabla y recarga todo.

    Args:
        force: Si True, truncate y recarga completa.

    Returns:
        Número de proveedores insertados (no duplicados).
    """
    table = get_suppliers_table()

    if force:
        table.truncate()
        existing_names: set[str] = set()
    else:
        # ── Obtener nombres existentes para idempotencia ──
        existing_names = {doc.get("name", "") for doc in table.all()}

    ts = now_iso()
    count = 0
    skipped = 0

    for supplier_data in SUPPLIERS_SEED:
        name = supplier_data["name"]

        # ── Idempotencia: si ya existe por nombre, skip ────
        if name in existing_names:
            skipped += 1
            continue

        # ── Validar con Pydantic y asignar updated_at ──────
        supplier = SupplierCreate(**supplier_data)
        doc = supplier.model_dump()
        doc["updated_at"] = ts
        table.insert(doc)
        count += 1

    # ── Reporte en consola ─────────────────────────────────
    if count > 0:
        print(f"✅ Seed completado: {count} proveedores insertados.")
    else:
        print(f"ℹ️  Seed omitido: los {skipped} proveedores ya existían en la base de datos.")

    if skipped > 0 and not force:
        print(f"   ({skipped} proveedores existentes omitidos — idempotencia activa)")

    return count


# ══════════════════════════════════════════════════════════
#  Entry point (ejecución directa)
# ══════════════════════════════════════════════════════════


def main():
    """Entry point para `python3 services/api/seed.py` y `uv run seed`."""
    force = "--force" in sys.argv or "-f" in sys.argv
    seed_suppliers(force=force)


if __name__ == "__main__":
    main()