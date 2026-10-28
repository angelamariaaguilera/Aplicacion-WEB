"""Utilidades reutilizables para la capa de base de datos.

Aquí viven los patrones que se repiten en los services: envolver errores
de PostgreSQL en HTTPException y traducir tipos de Python a psycopg.
"""

from psycopg import errors as pg_errors

from fastapi import HTTPException, status

# Errores de PostgreSQL que queremos traducir a respuestas claras en la API.
# Nunca se devuelve el error crudo de PostgreSQL al frontend.
UNIQUE_VIOLATION = pg_errors.UniqueViolation
FOREIGN_KEY_VIOLATION = pg_errors.ForeignKeyViolation
CHECK_VIOLATION = pg_errors.CheckViolation


def raise_not_found(entity: str) -> None:
    """Lanza 404 con un mensaje legible."""
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{entity} not found")


def raise_conflict(detail: str) -> None:
    """Lanza 409 para conflictos de estado de negocio."""
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def raise_bad_request(detail: str) -> None:
    """Lanza 400 para errores de validación de negocio."""
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def ensure_exists(conn, table: str, entity_id: int, entity_name: str) -> dict:
    """Busca una fila por id y devuelve 404 si no existe.

    `table` y `entity_name` son constantes internas del código, nunca
    provienen del usuario, por lo que no hay riesgo de inyección.
    """
    with conn.cursor() as cursor:
        cursor.execute(f"SELECT * FROM {table} WHERE id = %s", (entity_id,))
        row = cursor.fetchone()

    if row is None:
        raise_not_found(entity_name)
    return row


def translate_db_error(exc: Exception) -> None:
    """Convierte errores de integridad de PostgreSQL en HTTP comprensibles."""
    if isinstance(exc, UNIQUE_VIOLATION):
        raise_conflict("Ya existe un registro con ese valor único")
    if isinstance(exc, FOREIGN_KEY_VIOLATION):
        raise_bad_request("La referencia indicada no existe o está en uso por otros registros")
    if isinstance(exc, CHECK_VIOLATION):
        raise_bad_request("El registro no cumple las restricciones de la base de datos")
    raise exc