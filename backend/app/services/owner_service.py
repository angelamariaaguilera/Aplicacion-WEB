"""Servicio de propietarios: CRUD y búsqueda."""

from psycopg import errors as pg_errors

from app.database.helpers import raise_conflict, raise_not_found, translate_db_error

# Columnas base que devuelve el listado, con JOIN al conteo de mascotas.
OWNER_SELECT = """
    SELECT o.id,
           o.first_name,
           o.last_name,
           o.first_name || ' ' || o.last_name AS full_name,
           o.document_number,
           o.phone,
           o.email,
           o.address,
           o.created_at,
           o.updated_at,
           COALESCE(pets.pets_count, 0) AS pets_count
    FROM owners o
    LEFT JOIN (
        SELECT owner_id, COUNT(*) AS pets_count
        FROM pets
        GROUP BY owner_id
    ) pets ON pets.owner_id = o.id
"""


def list_owners(conn, search: str | None = None) -> list[dict]:
    """Lista propietarios con filtro opcional de búsqueda."""
    with conn.cursor() as cursor:
        if search:
            # Búsqueda por nombre, apellido, documento o teléfono.
            # El parámetro va en %s, nunca se concatena en la cadena SQL.
            pattern = f"%{search.strip().lower()}%"
            cursor.execute(
                OWNER_SELECT
                + """
                WHERE lower(o.first_name) LIKE %s
                   OR lower(o.last_name) LIKE %s
                   OR lower(o.document_number) LIKE %s
                   OR o.phone LIKE %s
                   OR (lower(o.first_name) || ' ' || lower(o.last_name)) LIKE %s
                ORDER BY o.last_name, o.first_name
                """,
                (pattern, pattern, pattern, pattern, pattern),
            )
        else:
            cursor.execute(OWNER_SELECT + " ORDER BY o.last_name, o.first_name")

        return cursor.fetchall()


def get_owner(conn, owner_id: int) -> dict:
    with conn.cursor() as cursor:
        cursor.execute(OWNER_SELECT + " WHERE o.id = %s", (owner_id,))
        owner = cursor.fetchone()

    if owner is None:
        raise_not_found("Owner")

    return owner


def create_owner(conn, payload: dict) -> dict:
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO owners (first_name, last_name, document_number, phone, email, address)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    payload["first_name"],
                    payload["last_name"],
                    payload.get("document_number"),
                    payload["phone"],
                    payload.get("email"),
                    payload.get("address"),
                ),
            )
            new_id = cursor.fetchone()["id"]
    except pg_errors.UniqueViolation:
        raise_conflict("Ya existe un propietario con ese número de documento")

    return get_owner(conn, new_id)


def update_owner(conn, owner_id: int, payload: dict) -> dict:
    fields, values = _build_update(payload)

    if not fields:
        return get_owner(conn, owner_id)

    values.append(owner_id)
    set_clause = ", ".join(fields)

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"UPDATE owners SET {set_clause} WHERE id = %s",  # columnas internas, no del usuario
                values,
            )
            if cursor.rowcount == 0:
                raise_not_found("Owner")
    except pg_errors.UniqueViolation:
        raise_conflict("Ya existe un propietario con ese número de documento")

    return get_owner(conn, owner_id)


def delete_owner(conn, owner_id: int) -> None:
    """Elimina un propietario sólo si no tiene mascotas asociadas.

    Regla de negocio 9: se evita perder datos de las mascotas.
    """
    get_owner(conn, owner_id)

    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS total FROM pets WHERE owner_id = %s", (owner_id,))
        pets_count = cursor.fetchone()["total"]

    if pets_count > 0:
        raise_conflict(
            "No se puede eliminar el propietario porque tiene "
            f"{pets_count} mascota(s) asociada(s). Elimina o reasigna las mascotas primero."
        )

    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM owners WHERE id = %s", (owner_id,))


def _build_update(payload: dict) -> tuple[list[str], list]:
    """Construye el SET del UPDATE con solo los campos presentes en el payload."""
    editable = (
        "first_name",
        "last_name",
        "document_number",
        "phone",
        "email",
        "address",
    )
    fields = [f"{column} = %s" for column in editable if column in payload]
    values = [payload[column] for column in editable if column in payload]
    return fields, values