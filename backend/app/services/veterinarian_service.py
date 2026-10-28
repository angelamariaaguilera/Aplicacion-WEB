"""Servicio de veterinarios.

No se borran físicamente: se desactivan con is_active para conservar
el historial de citas e historias clínicas.
"""

from psycopg import errors as pg_errors

from app.database.helpers import raise_conflict, raise_not_found

VET_SELECT = """
    SELECT v.id,
           v.first_name,
           v.last_name,
           v.first_name || ' ' || v.last_name AS full_name,
           v.license_number,
           v.specialty,
           v.phone,
           v.email,
           v.is_active,
           v.created_at,
           v.updated_at,
           (SELECT COUNT(*) FROM appointments a WHERE a.veterinarian_id = v.id) AS appointments_count
    FROM veterinarians v
"""


def list_veterinarians(conn, only_active: bool = False, search: str | None = None) -> list[dict]:
    conditions, params = [], []

    if only_active:
        conditions.append("v.is_active = TRUE")

    if search:
        pattern = f"%{search.strip().lower()}%"
        conditions.append(
            "(lower(v.first_name) LIKE %s OR lower(v.last_name) LIKE %s "
            "OR lower(v.license_number) LIKE %s OR lower(v.specialty) LIKE %s)"
        )
        params.extend([pattern] * 4)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with conn.cursor() as cursor:
        cursor.execute(VET_SELECT + where_clause + " ORDER BY v.last_name, v.first_name")
        return cursor.fetchall()


def get_veterinarian(conn, vet_id: int) -> dict:
    with conn.cursor() as cursor:
        cursor.execute(VET_SELECT + " WHERE v.id = %s", (vet_id,))
        vet = cursor.fetchone()

    if vet is None:
        raise_not_found("Veterinarian")

    return vet


def create_veterinarian(conn, payload: dict) -> dict:
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO veterinarians
                    (first_name, last_name, license_number, specialty, phone, email, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    payload["first_name"],
                    payload["last_name"],
                    payload["license_number"],
                    payload.get("specialty"),
                    payload.get("phone"),
                    payload.get("email"),
                    payload.get("is_active", True),
                ),
            )
            new_id = cursor.fetchone()["id"]
    except pg_errors.UniqueViolation:
        raise_conflict("Ya existe un veterinario con esa matrícula o ese correo")

    return get_veterinarian(conn, new_id)


def update_veterinarian(conn, vet_id: int, payload: dict) -> dict:
    get_veterinarian(conn, vet_id)

    editable = ("first_name", "last_name", "license_number", "specialty", "phone", "email", "is_active")
    fields = [f"{column} = %s" for column in editable if column in payload]
    values = [payload[column] for column in editable if column in payload]

    if fields:
        values.append(vet_id)
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"UPDATE veterinarians SET {', '.join(fields)} WHERE id = %s",
                    values,
                )
        except pg_errors.UniqueViolation:
            raise_conflict("Ya existe un veterinario con esa matrícula o ese correo")

    return get_veterinarian(conn, vet_id)


def deactivate_veterinarian(conn, vet_id: int) -> dict:
    """Alternativa al borrado físico: marca al veterinario como inactivo."""
    get_veterinarian(conn, vet_id)

    with conn.cursor() as cursor:
        cursor.execute("UPDATE veterinarians SET is_active = FALSE WHERE id = %s", (vet_id,))

    return get_veterinarian(conn, vet_id)