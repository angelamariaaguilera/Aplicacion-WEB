"""Conexión centralizada a PostgreSQL usando psycopg 3."""

import psycopg
from psycopg.rows import dict_row

from app.core.config import settings


def get_connection() -> psycopg.Connection:
    """Abre una conexión con row_factory=dict_row para obtener diccionarios.

    Se usa como context manager: la conexión se cierra al salir del bloque.
    """
    return psycopg.connect(settings.database_url, row_factory=dict_row)


def test_connection() -> bool:
    """Verifica que la base de datos responda. Útil para diagnóstico."""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 AS ok")
            return cursor.fetchone()["ok"] == 1