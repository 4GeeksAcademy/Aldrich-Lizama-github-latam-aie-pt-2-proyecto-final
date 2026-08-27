"""
validators.py — Validación individual de campos y clasificación de errores.
==========================================================================
Todas las funciones son puras: reciben un valor y devuelven bool o list[str].
No dependen de IO ni de estado global mutable.
"""

from .config import (
    TICKET_ID_PATTERN,
    AGENT_ID_PATTERN,
    DATE_PATTERN,
    VALID_CATEGORIES,
    VALID_STATUSES,
    SCORE_MIN,
    SCORE_MAX,
)


def validate_ticket_id(value: str) -> bool:
    """Valida que *ticket_id* cumpla el formato ``NXV-XXXXXX``."""
    return bool(TICKET_ID_PATTERN.match(str(value).strip()))


def validate_agent_id(value: str) -> bool:
    """Valida que *agent_id* cumpla el formato ``AGT-XX``."""
    return bool(AGENT_ID_PATTERN.match(str(value).strip()))


def validate_email(value: str) -> bool:
    """
    Validación mínima de email: no vacío y contiene ``@``.

    ⚠️ **NUNCA** se imprime ni exporta la dirección real.
    """
    val = str(value).strip()
    return bool(val) and "@" in val


def validate_date(value: str) -> bool:
    """Valida formato ``YYYY-MM-DD`` básico (sin validar fecha real)."""
    return bool(DATE_PATTERN.match(str(value).strip()))


def is_valid_score(value: str) -> bool:
    """
    Verifica si el valor es un entero dentro del rango ``SCORE_MIN..SCORE_MAX``.
    """
    try:
        score = int(str(value).strip())
        return SCORE_MIN <= score <= SCORE_MAX
    except (ValueError, TypeError):
        return False


# ──────────────────────────────────────────────────────────
#  Clasificador de errores por fila
# ──────────────────────────────────────────────────────────


def classify_row(row: dict[str, str]) -> list[str]:
    """
    Analiza una fila del CSV y devuelve **todas** las reglas de invalidación
    que se activan para ese registro.

    Retorna una lista **vacía** si el registro es **válido**.

    .. important::
       NUNCA se incluye el valor real de ``customer_email`` en los errores.
       Los registros con email inválido se marcan como ``"Invalid or missing email"``
       sin revelar la dirección.
    """
    errors: list[str] = []

    # ── client_company vacío ──────────────────────────────
    if not str(row.get("client_company", "")).strip():
        errors.append("Missing client_company")

    # ── category faltante o inválida ──────────────────────
    cat = str(row.get("category", "")).strip()
    if not cat or cat not in VALID_CATEGORIES:
        errors.append("Invalid or missing category")

    # ── description vacía o < 5 caracteres ────────────────
    desc = str(row.get("description", "")).strip()
    if not desc or len(desc) < 5:
        errors.append("Missing or too short description")

    # ── agent_id faltante o inválido ──────────────────────
    agt = str(row.get("agent_id", "")).strip()
    if not agt or not validate_agent_id(agt):
        errors.append("Invalid or missing agent_id")

    # ── customer_email faltante o inválido ────────────────
    if not validate_email(row.get("customer_email", "")):
        errors.append("Invalid or missing email")

    # ── status y satisfaction_score ───────────────────────
    status = str(row.get("status", "")).strip()
    score_raw = str(row.get("satisfaction_score", "")).strip()

    # CLOSED sin puntuación
    if status == "CLOSED" and (not score_raw or not is_valid_score(score_raw)):
        errors.append("Closed ticket, no score")

    # satisfaction_score fuera de rango (en cualquier estado)
    if score_raw and not is_valid_score(score_raw):
        errors.append("Satisfaction score out of range")

    return errors