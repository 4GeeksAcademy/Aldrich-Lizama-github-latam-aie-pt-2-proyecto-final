#!/usr/bin/env python3
"""
database.py — Nexova Suppliers Directory · TinyDB configuration
===============================================================
Configura TinyDB con persistencia en un archivo JSON local.
Exporta una función get_table() para acceder a la tabla 'suppliers'.
"""

import os
import sys
from pathlib import Path

# ── Asegurar que TinyDB es importable ─────────────────────
try:
    from tinydb import TinyDB, Query
except ImportError:
    print("TinyDB no está instalado. Ejecutá: pip3 install tinydb")
    sys.exit(1)

# ── Ruta del archivo JSON de persistencia ─────────────────
_DB_DIR = Path(__file__).parent.resolve()
_DB_PATH = _DB_DIR / "db.json"

_db_instance: TinyDB | None = None


def _get_db() -> TinyDB:
    """Retorna la instancia única de TinyDB (singleton)."""
    global _db_instance
    if _db_instance is None:
        _db_instance = TinyDB(str(_DB_PATH), indent=2, sort_keys=True)
    return _db_instance


def get_table(table_name: str = "suppliers"):
    """Retorna la tabla indicada de TinyDB.

    Por defecto devuelve la tabla 'suppliers' del directorio.
    """
    db = _get_db()
    return db.table(table_name)


def get_suppliers_table():
    """Atajo: devuelve directamente la tabla 'suppliers'."""
    return get_table("suppliers")


def reset_db():
    """Elimina todos los registros de la tabla 'suppliers' (útil para tests)."""
    table = get_suppliers_table()
    table.truncate()


# ── Export útil (Query ya está importado desde tinydb arriba) ──