"""
nexova_analyzer — Módulo reutilizable de análisis de tickets de soporte Nexova.
================================================================================

Uso desde CLI:
    from nexova_analyzer import analyze_csv, print_report, export_csv

Uso desde Web (FastAPI/Flask):
    from nexova_analyzer import analyze_rows, NexovaAnalyzer

Ejemplo:
    stats = analyze_csv("incidents-nexova.csv")
    print_report(stats)
    export_csv(stats)
"""

from .config import (
    REQUIRED_FIELDS,
    VALID_CATEGORIES,
    VALID_STATUSES,
    TICKET_ID_PATTERN,
    AGENT_ID_PATTERN,
    SCORE_MIN,
    SCORE_MAX,
    EXPORT_FILENAME,
    SCORE_LABELS,
    CATEGORY_ORDER,
    STATUS_ORDER,
)

from .validators import (
    validate_ticket_id,
    validate_agent_id,
    validate_email,
    validate_date,
    is_valid_score,
    classify_row,
)

from .analyzer import (
    load_csv,
    analyze_csv,
    analyze_rows,
    NexovaAnalyzer,
    AnalysisResult,
)

from .reporters import (
    print_report,
    export_csv,
    export_csv_string,
    format_report_text,
    build_export_rows,
)

__all__ = [
    # config
    "REQUIRED_FIELDS",
    "VALID_CATEGORIES",
    "VALID_STATUSES",
    "TICKET_ID_PATTERN",
    "AGENT_ID_PATTERN",
    "SCORE_MIN",
    "SCORE_MAX",
    "EXPORT_FILENAME",
    "SCORE_LABELS",
    "CATEGORY_ORDER",
    "STATUS_ORDER",
    # validators
    "validate_ticket_id",
    "validate_agent_id",
    "validate_email",
    "validate_date",
    "is_valid_score",
    "classify_row",
    # analyzer
    "load_csv",
    "analyze_csv",
    "analyze_rows",
    "NexovaAnalyzer",
    "AnalysisResult",
    # reporters
    "print_report",
    "export_csv",
    "export_csv_string",
    "format_report_text",
    "build_export_rows",
]