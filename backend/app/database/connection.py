"""Conexión centralizada a PostgreSQL usando psycopg 3."""

import psycopg
from psycopg.rows import dict_row

from app.core.config import settings


def get_connection() -> psycopg.Connection:
    """Abre una conexión con row_factory=dict_row para obtener diccionarios.

    Se usa como context manager: la conexión se cierra al salir del bloque.

    prepare_threshold=None desactiva los prepared statements del servidor,
    lo que permite usar también el Transaction pooler de Supabase (pgbouncer).
    """
    options = {"row_factory": dict_row, "prepare_threshold": None}
    if settings.database_sslmode:
        options["sslmode"] = settings.database_sslmode
    return psycopg.connect(settings.database_url, **options)


def test_connection() -> bool:
    """Verifica que la base de datos responda. Útil para diagnóstico."""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 AS ok")
            return cursor.fetchone()["ok"] == 1