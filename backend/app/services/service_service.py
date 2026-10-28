"""Servicio de servicios de la clínica."""

from psycopg import errors as pg_errors

from app.database.helpers import raise_conflict, raise_not_found

SERVICE_SELECT = """
    SELECT s.id,
           s.name,
           s.description,
           s.price,
           s.duration_minutes,
           s.is_active,
           s.created_at,
           s.updated_at,
           (SELECT COUNT(*) FROM appointments a WHERE a.service_id = s.id) AS appointments_count
    FROM services s
"""


def list_services(conn, only_active: bool = False, search: str | None = None) -> list[dict]:
    conditions, params = [], []

    if only_active:
        conditions.append("s.is_active = TRUE")

    if search:
        pattern = f"%{search.strip().lower()}%"
        conditions.append("(lower(s.name) LIKE %s OR lower(s.description) LIKE %s)")
        params.extend([pattern, pattern])

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with conn.cursor() as cursor:
        cursor.execute(SERVICE_SELECT + where_clause + " ORDER BY s.name")
        return cursor.fetchall()


def get_service(conn, service_id: int) -> dict:
    with conn.cursor() as cursor:
        cursor.execute(SERVICE_SELECT + " WHERE s.id = %s", (service_id,))
        service = cursor.fetchone()

    if service is None:
        raise_not_found("Service")

    return service


def create_service(conn, payload: dict) -> dict:
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO services (name, description, price, duration_minutes, is_active)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    payload["name"],
                    payload.get("description"),
                    payload["price"],
                    payload.get("duration_minutes", 30),
                    payload.get("is_active", True),
                ),
            )
            new_id = cursor.fetchone()["id"]
    except pg_errors.UniqueViolation:
        raise_conflict("Ya existe un servicio con ese nombre")

    return get_service(conn, new_id)


def update_service(conn, service_id: int, payload: dict) -> dict:
    get_service(conn, service_id)

    editable = ("name", "description", "price", "duration_minutes", "is_active")
    fields = [f"{column} = %s" for column in editable if column in payload]
    values = [payload[column] for column in editable if column in payload]

    if fields:
        values.append(service_id)
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"UPDATE services SET {', '.join(fields)} WHERE id = %s",
                    values,
                )
        except pg_errors.UniqueViolation:
            raise_conflict("Ya existe un servicio con ese nombre")

    return get_service(conn, service_id)