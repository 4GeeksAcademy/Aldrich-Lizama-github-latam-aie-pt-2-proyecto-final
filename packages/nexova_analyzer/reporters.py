"""
reporters.py — Funciones de presentación: consola y exportación CSV.
====================================================================
Todas reciben un ``AnalysisResult`` y lo transforman en output legible.
"""

import csv
from io import StringIO
from typing import Any

from .config import SCORE_MAX, SCORE_LABELS, EXPORT_FILENAME
from .analyzer import AnalysisResult


# ═══════════════════════════════════════════════════════════
#  Consola
# ═══════════════════════════════════════════════════════════


def format_report_text(stats: AnalysisResult) -> str:
    """
    Genera el reporte como string (sin imprimirlo).

    Útil para devolver texto plano desde un endpoint web
    (FastAPI/Flask) sin imprimir en consola.
    """
    lines: list[str] = []
    sep = "=" * 60

    # Cabecera
    lines.append(sep)
    lines.append("  NEXOVA — SUPPORT TICKET ANALYSIS")
    lines.append(f"  Source file: {stats.filename}")
    lines.append(sep)

    # Totales
    lines.append("")
    lines.append(f"TOTAL RECORDS IN FILE .......... {stats.total_records}")
    lines.append(f"  ├─ Valid records ................ {stats.valid_count}")
    lines.append(f"  └─ Invalid / incomplete .......... {stats.invalid_count}")

    # Desglose de inválidos
    lines.append("")
    lines.append("INVALID RECORDS BREAKDOWN")
    ib = stats.invalid_breakdown
    if ib:
        items = list(ib.items())
        for i, (rule, count) in enumerate(items):
            prefix = "  └─" if i == len(items) - 1 else "  ├─"
            dots = "." * max(1, 41 - len(rule))
            lines.append(f" {prefix} {rule} {dots} {count}")
    else:
        lines.append("  └─ (none)")

    # Desglose por categoría
    lines.append("")
    lines.append("BREAKDOWN BY CATEGORY (valid records)")
    valid = stats.valid_count
    cat_items = list(stats.category_counts.items())
    for i, (cat, count) in enumerate(cat_items):
        pct = (count / valid * 100) if valid > 0 else 0.0
        prefix = "  └─" if i == len(cat_items) - 1 else "  ├─"
        lines.append(f" {prefix} {cat:<22} {count:>3}  ({pct:.1f}%)")

    # Desglose por estado
    lines.append("")
    lines.append("BREAKDOWN BY STATUS (valid records)")
    status_items = list(stats.status_counts.items())
    for i, (st, count) in enumerate(status_items):
        pct = (count / valid * 100) if valid > 0 else 0.0
        prefix = "  └─" if i == len(status_items) - 1 else "  ├─"
        lines.append(f" {prefix} {st:<12} {count:>3}  ({pct:.1f}%)")

    # Satisfacción
    lines.append("")
    lines.append("SATISFACTION INDEX (closed tickets)")
    lines.append(f"  Scored tickets: {stats.scored_closed_count} of {stats.total_closed_count}")
    lines.append(f"  Average score: {stats.avg_score:.2f} / {SCORE_MAX}.00")

    sd = stats.score_distribution
    score_items = list(sd.items())
    for i, (score, count) in enumerate(score_items):
        label = SCORE_LABELS.get(score, "")
        prefix = "  └─" if i == len(score_items) - 1 else "  ├─"
        lines.append(f" {prefix} Score {score} ({label:<20}) {count:>3}")

    lines.append("")
    lines.append(sep)

    return "\n".join(lines)


def print_report(stats: AnalysisResult) -> None:
    """Imprime el reporte formateado en consola."""
    print(format_report_text(stats))


# ═══════════════════════════════════════════════════════════
#  Exportación CSV
# ═══════════════════════════════════════════════════════════


def build_export_rows(stats: AnalysisResult) -> list[tuple[str, str]]:
    """
    Construye las filas del CSV de exportación con una métrica por fila.

    Retorna una lista de pares ``(nombre_metrica, valor)`` lista para
    escribir con ``csv.writer``.
    """
    rows: list[tuple[str, str]] = [("metric", "value")]

    rows.append(("total_records", str(stats.total_records)))
    rows.append(("valid_records", str(stats.valid_count)))
    rows.append(("invalid_records", str(stats.invalid_count)))

    # Inválidos
    for rule, count in stats.invalid_breakdown.items():
        key = "invalid_" + rule.lower().replace(" ", "_").replace(",", "")
        rows.append((key, str(count)))

    # Categorías
    for cat, count in stats.category_counts.items():
        rows.append((f"category_{cat}", str(count)))

    # Estados
    for st, count in stats.status_counts.items():
        rows.append((f"status_{st}", str(count)))

    # Satisfacción
    rows.append(("scored_closed_tickets", str(stats.scored_closed_count)))
    rows.append(("total_closed_tickets", str(stats.total_closed_count)))
    rows.append(("average_satisfaction_score", str(stats.avg_score)))
    for score, count in stats.score_distribution.items():
        rows.append((f"score_{score}_count", str(count)))

    return rows


def export_csv(
    stats: AnalysisResult,
    filename: str = EXPORT_FILENAME,
) -> str:
    """
    Exporta el resumen a un archivo CSV con una métrica por fila.

    Parámetros
    ----------
    stats : AnalysisResult
        Resultado del análisis.
    filename : str
        Ruta del archivo de salida (por defecto ``results.csv``).

    Retorna
    -------
    str
        La ruta del archivo exportado.
    """
    rows = build_export_rows(stats)

    with open(filename, mode="w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerows(rows)

    return filename


def export_csv_string(stats: AnalysisResult) -> str:
    """
    Exporta el resumen a una string CSV (sin escribir a disco).

    Útil para servidores web que devuelven el CSV como
    ``Response(content=csv_string, media_type="text/csv")``.
    """
    rows = build_export_rows(stats)
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerows(rows)
    return buf.getvalue()