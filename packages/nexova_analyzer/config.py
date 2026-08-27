"""
config.py — Constantes configurables del análisis de tickets Nexova.
=====================================================================
Ajusta estos valores según el CONTEXT-nexova.es.md de tu proyecto.
"""

import re

# ── Campos esperados del CSV ──────────────────────────────
REQUIRED_FIELDS = [
    "ticket_id",
    "date",
    "client_company",
    "category",
    "description",
    "agent_id",
    "status",
    "customer_email",
    "satisfaction_score",
]

# ── Categorías válidas ────────────────────────────────────
VALID_CATEGORIES: set[str] = {"TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT"}

CATEGORY_ORDER: list[str] = ["TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT"]

# ── Estados permitidos ───────────────────────────────────
VALID_STATUSES: set[str] = {"OPEN", "CLOSED", "DISCARDED"}

STATUS_ORDER: list[str] = ["OPEN", "CLOSED", "DISCARDED"]

# ── Patrones de formato ──────────────────────────────────
TICKET_ID_PATTERN: re.Pattern = re.compile(r"^NXV-\d{6}$")
AGENT_ID_PATTERN: re.Pattern = re.compile(r"^AGT-\d{2}$")
DATE_PATTERN: re.Pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# ── Rango de puntuación de satisfacción ──────────────────
SCORE_MIN: int = 1
SCORE_MAX: int = 5

SCORE_LABELS: dict[int, str] = {
    1: "Very dissatisfied",
    2: "Dissatisfied",
    3: "Neutral",
    4: "Satisfied",
    5: "Very satisfied",
}

# ── Exportación ──────────────────────────────────────────
EXPORT_FILENAME: str = "results.csv"