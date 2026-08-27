#!/usr/bin/env python3
"""
analyze.py — Nexova Support Ticket CSV Analyzer (CLI)
======================================================
CLI delgado que delega toda la lógica al paquete reutilizable
``nexova_analyzer`` (ubicado en ``packages/nexova_analyzer/``).

Uso:
    python scripts/analyze.py incidents-nexova.csv
    python scripts/analyze.py --help

Flags adicionales:
    --as-json         Imprime el resultado como JSON (sin reporte formateado)
    --export [FILE]   Exporta a CSV sin preguntar
    --no-interactive  No pregunta por exportación al finalizar
"""

import argparse
import csv
import sys
import os

# ── Asegurar que el paquete reutilizable es importable ────
#    (tanto si se ejecuta desde la raíz del repo como desde scripts/)
_PACKAGES_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "packages")
)
if _PACKAGES_PATH not in sys.path:
    sys.path.insert(0, _PACKAGES_PATH)

from nexova_analyzer import (
    print_report,
    export_csv,
    NexovaAnalyzer,
    EXPORT_FILENAME,
)


# ══════════════════════════════════════════════════════════
#  CLI
# ══════════════════════════════════════════════════════════


def parse_args() -> argparse.Namespace:
    """Procesa argumentos de línea de comandos."""
    parser = argparse.ArgumentParser(
        description="Nexova — Support Ticket CSV Analyzer",
        epilog="Ejemplo: python analyze.py incidents-nexova.csv",
    )
    parser.add_argument(
        "csv_file",
        type=str,
        help="Ruta al archivo CSV de incidentes (ej. incidents-nexova.csv)",
    )
    parser.add_argument(
        "--as-json",
        action="store_true",
        help="En lugar del reporte formateado, imprime el resultado como JSON",
    )
    parser.add_argument(
        "--export",
        type=str,
        nargs="?",
        const=EXPORT_FILENAME,
        default=None,
        metavar="FILE",
        help="Exporta el resumen a CSV sin preguntar (opcional: nombre de archivo)",
    )
    parser.add_argument(
        "--no-interactive",
        action="store_true",
        help="No pregunta por exportación al finalizar",
    )
    return parser.parse_args()


def main() -> None:
    """Punto de entrada principal."""
    args = parse_args()

    # ── Análisis usando la clase orientada a objetos ──────
    try:
        analyzer = NexovaAnalyzer()
        stats = analyzer.analyze_file(args.csv_file)
    except (FileNotFoundError, csv.Error) as exc:
        print(f"\n{exc}", file=sys.stderr)
        sys.exit(1)

    # ── Salida ────────────────────────────────────────────
    if args.as_json:
        import json

        print(json.dumps(stats.to_dict(), indent=2, ensure_ascii=False))
        return

    # Reporte formateado en consola
    print_report(stats)

    # ── Exportación (según flags o interactiva) ───────────
    if args.export:
        path = export_csv(stats, filename=args.export)
        print(f"\n  ✓ Results exported to '{path}'")
        return

    if args.no_interactive:
        return

    try:
        respuesta = input("Export results to CSV? [y / n]: ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        respuesta = "n"
        print()

    if respuesta in ("y", "yes"):
        export_csv(stats)
    else:
        print("\n  (export skipped)")


if __name__ == "__main__":
    main()