"""
analyzer.py — Core de análisis: carga CSV, clasifica filas y computa métricas.
==============================================================================
Expone dos modos de uso:

1. **``analyze_csv(filepath)``** — para scripts CLI que reciben una ruta.
2. **``analyze_rows(rows)``** — para servidores web (FastAPI/Flask) que ya
   tienen los datos en memoria (ej. subida de archivo con ``UploadFile``).
3. **``NexovaAnalyzer``** — clase orientada a objetos que agrupa toda la lógica.
"""

import csv
import os
from collections import Counter, OrderedDict
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

from .config import (
    VALID_CATEGORIES,
    VALID_STATUSES,
    CATEGORY_ORDER,
    STATUS_ORDER,
    SCORE_MIN,
    SCORE_MAX,
)
from .validators import classify_row, is_valid_score


# ═══════════════════════════════════════════════════════════
#  Data class — resultado del análisis
# ═══════════════════════════════════════════════════════════


@dataclass
class AnalysisResult:
    """
    Contenedor tipado con todas las métricas del análisis.

    Puedes convertir a dict con :meth:`asdict` para serializar a JSON.
    """

    filename: str = ""
    total_records: int = 0
    valid_count: int = 0
    invalid_count: int = 0
    invalid_breakdown: Counter = field(default_factory=Counter)
    category_counts: OrderedDict = field(default_factory=OrderedDict)
    status_counts: OrderedDict = field(default_factory=OrderedDict)
    score_distribution: OrderedDict = field(default_factory=OrderedDict)
    scored_closed_count: int = 0
    total_closed_count: int = 0
    avg_score: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        """Serializa el resultado a dict plano (útil para JSON)."""
        return {
            "filename": self.filename,
            "total_records": self.total_records,
            "valid_count": self.valid_count,
            "invalid_count": self.invalid_count,
            "invalid_breakdown": dict(self.invalid_breakdown),
            "category_counts": dict(self.category_counts),
            "status_counts": dict(self.status_counts),
            "score_distribution": {
                str(k): v for k, v in self.score_distribution.items()
            },
            "scored_closed_count": self.scored_closed_count,
            "total_closed_count": self.total_closed_count,
            "avg_score": self.avg_score,
        }


# ═══════════════════════════════════════════════════════════
#  Funciones de carga
# ═══════════════════════════════════════════════════════════


def load_csv(filepath: str) -> list[dict[str, str]]:
    """
    Lee un archivo CSV con cabecera y devuelve la lista de filas como
    diccionarios ``{campo: valor}``.

    Parámetros
    ----------
    filepath : str
        Ruta absoluta o relativa al archivo CSV.

    Retorna
    -------
    list[dict[str, str]]
        Lista de filas en orden de lectura.

    Lanza
    -----
    FileNotFoundError
        Si el archivo no existe.
    csv.Error
        Si el archivo está vacío o no tiene cabecera.
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"ERROR: No se encuentra el archivo '{filepath}'.")

    with open(path, mode="r", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames is None:
            raise csv.Error("El archivo CSV está vacío o no tiene cabecera.")
        return list(reader)


# ═══════════════════════════════════════════════════════════
#  Funciones de análisis
# ═══════════════════════════════════════════════════════════


def _compute_metrics(
    rows: list[dict[str, str]], source_name: str = ""
) -> AnalysisResult:
    """
    Núcleo del análisis: clasifica filas y computa todas las métricas.

    Es una función interna reutilizada por ``analyze_csv`` y ``analyze_rows``.
    """
    total = len(rows)
    valid_rows: list[dict[str, str]] = []
    invalid_breakdown: Counter = Counter()

    # ── Clasificar cada fila ──────────────────────────────
    for row in rows:
        errors = classify_row(row)
        if errors:
            for err in errors:
                invalid_breakdown[err] += 1
        else:
            valid_rows.append(row)

    valid_count = len(valid_rows)
    invalid_count = total - valid_count

    # ── Totalización por categoría ─────────────────────────
    category_counter: Counter = Counter()
    for row in valid_rows:
        cat = str(row.get("category", "")).strip()
        if cat in VALID_CATEGORIES:
            category_counter[cat] += 1

    ordered_categories: OrderedDict = OrderedDict()
    for cat in CATEGORY_ORDER:
        ordered_categories[cat] = category_counter.get(cat, 0)

    # ── Totalización por estado ────────────────────────────
    status_counter: Counter = Counter()
    for row in valid_rows:
        st = str(row.get("status", "")).strip()
        if st in VALID_STATUSES:
            status_counter[st] += 1

    ordered_statuses: OrderedDict = OrderedDict()
    for st in STATUS_ORDER:
        ordered_statuses[st] = status_counter.get(st, 0)

    # ── Índice de satisfacción ────────────────────────────
    total_closed = ordered_statuses.get("CLOSED", 0)
    scores: list[int] = []
    score_distribution: Counter = Counter()

    for row in valid_rows:
        if str(row.get("status", "")).strip() == "CLOSED":
            score_raw = str(row.get("satisfaction_score", "")).strip()
            if score_raw and is_valid_score(score_raw):
                score_val = int(score_raw)
                scores.append(score_val)
                score_distribution[score_val] += 1

    scored_closed = len(scores)
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0

    ordered_scores: OrderedDict = OrderedDict()
    for s in range(SCORE_MIN, SCORE_MAX + 1):
        ordered_scores[s] = score_distribution.get(s, 0)

    return AnalysisResult(
        filename=source_name,
        total_records=total,
        valid_count=valid_count,
        invalid_count=invalid_count,
        invalid_breakdown=invalid_breakdown,
        category_counts=ordered_categories,
        status_counts=ordered_statuses,
        score_distribution=ordered_scores,
        scored_closed_count=scored_closed,
        total_closed_count=total_closed,
        avg_score=avg_score,
    )


def analyze_csv(filepath: str) -> AnalysisResult:
    """
    Carga un CSV desde disco y ejecuta el análisis completo.

    Modo de uso recomendado para **scripts CLI**.

    Ejemplo::

        stats = analyze_csv("incidents-nexova.csv")
        print(f"Válidos: {stats.valid_count}")
    """
    rows = load_csv(filepath)
    return _compute_metrics(rows, source_name=os.path.basename(filepath))


def analyze_rows(
    rows: list[dict[str, str]], source_name: str = ""
) -> AnalysisResult:
    """
    Analiza una lista de filas ya cargadas en memoria (sin IO).

    Modo de uso recomendado para **servidores web** (FastAPI/Flask)
    que reciben el CSV como ``UploadFile`` y ya lo parsearon.

    Ejemplo::

        reader = csv.DictReader(upload_file.file)
        rows = list(reader)
        stats = analyze_rows(rows, source_name="upload.csv")
    """
    return _compute_metrics(rows, source_name=source_name)


# ═══════════════════════════════════════════════════════════
#  Clase orientada a objetos (alternativa)
# ═══════════════════════════════════════════════════════════


class NexovaAnalyzer:
    """
    Analizador orientado a objetos.

    Útil cuando necesitas mantener estado o inyectar dependencias
    (por ejemplo, diferentes configuraciones por cliente).

    Ejemplo::

        analyzer = NexovaAnalyzer()
        result = analyzer.analyze_file("incidents-nexova.csv")
        print(result.valid_count)
    """

    def __init__(self) -> None:
        self.last_result: AnalysisResult | None = None

    def analyze_file(self, filepath: str) -> AnalysisResult:
        """Carga y analiza un archivo CSV."""
        self.last_result = analyze_csv(filepath)
        return self.last_result

    def analyze_rows(
        self, rows: list[dict[str, str]], source_name: str = ""
    ) -> AnalysisResult:
        """Analiza filas ya cargadas en memoria."""
        self.last_result = analyze_rows(rows, source_name)
        return self.last_result

    @property
    def summary(self) -> dict[str, Any]:
        """Retorna el último resultado como dict, o dict vacío."""
        if self.last_result is None:
            return {}
        return self.last_result.to_dict()