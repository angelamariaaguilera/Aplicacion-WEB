"""Servicio de mascotas: CRUD, edad y filtro por propietario."""

from datetime import date

from app.database.helpers import ensure_exists, raise_not_found

PET_SELECT = """
    SELECT p.id,
           p.owner_id,
           p.name,
           p.species,
           p.breed,
           p.sex,
           p.birth_date,
           p.weight,
           p.color,
           p.notes,
           p.created_at,
           p.updated_at,
           o.id AS owner_id_ref,
           o.first_name || ' ' || o.last_name AS owner_full_name,
           o.phone AS owner_phone,
           o.email AS owner_email,
           (SELECT COUNT(*) FROM appointments a WHERE a.pet_id = p.id) AS appointments_count,
           (SELECT COUNT(*) FROM medical_records m WHERE m.pet_id = p.id) AS medical_records_count
    FROM pets p
    JOIN owners o ON o.id = p.owner_id
"""


def _shape(row: dict) -> dict:
    """Transforma la fila plana del JOIN en la estructura anidada de la respuesta."""
    if row is None:
        return row

    birth_date = row.get("birth_date")
    owner = {
        "id": row["owner_id"],
        "full_name": row["owner_full_name"],
        "phone": row["owner_phone"],
        "email": row["owner_email"],
    }

    return {
        "id": row["id"],
        "owner_id": row["owner_id"],
        "name": row["name"],
        "species": row["species"],
        "breed": row["breed"],
        "sex": row["sex"],
        "birth_date": birth_date,
        "weight": row["weight"],
        "color": row["color"],
        "notes": row["notes"],
        "age_months": calculate_age_months(birth_date),
        "owner": owner,
        "appointments_count": row["appointments_count"],
        "medical_records_count": row["medical_records_count"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def calculate_age_months(birth_date: date | None) -> int | None:
    """Devuelve la edad aproximada en meses a partir de la fecha de nacimiento."""
    if birth_date is None:
        return None

    today = date.today()
    months = (today.year - birth_date.year) * 12 + (today.month - birth_date.month)
    if today.day < birth_date.day:
        months -= 1

    return max(months, 0)


def list_pets(conn, owner_id: int | None = None, search: str | None = None) -> list[dict]:
    conditions, params = [], []

    if owner_id is not None:
        conditions.append("p.owner_id = %s")
        params.append(owner_id)

    if search:
        pattern = f"%{search.strip().lower()}%"
        conditions.append(
            "(lower(p.name) LIKE %s OR lower(p.species) LIKE %s "
            "OR lower(p.breed) LIKE %s OR lower(o.first_name) LIKE %s "
            "OR lower(o.last_name) LIKE %s)"
        )
        params.extend([pattern] * 5)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with conn.cursor() as cursor:
        cursor.execute(PET_SELECT + where_clause + " ORDER BY p.name", params)
        return [_shape(row) for row in cursor.fetchall()]


def get_pet(conn, pet_id: int) -> dict:
    with conn.cursor() as cursor:
        cursor.execute(PET_SELECT + " WHERE p.id = %s", (pet_id,))
        row = cursor.fetchone()

    if row is None:
        raise_not_found("Pet")

    return _shape(row)


def create_pet(conn, payload: dict) -> dict:
    # Regla de negocio: la mascota debe pertenecer a un propietario existente.
    ensure_exists(conn, "owners", payload["owner_id"], "Owner")

    with conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO pets (owner_id, name, species, breed, sex, birth_date, weight, color, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                payload["owner_id"],
                payload["name"],
                payload["species"],
                payload.get("breed"),
                payload.get("sex"),
                payload.get("birth_date"),
                payload.get("weight"),
                payload.get("color"),
                payload.get("notes"),
            ),
        )
        new_id = cursor.fetchone()["id"]

    return get_pet(conn, new_id)


def update_pet(conn, pet_id: int, payload: dict) -> dict:
    get_pet(conn, pet_id)

    if "owner_id" in payload:
        ensure_exists(conn, "owners", payload["owner_id"], "Owner")

    editable = ("owner_id", "name", "species", "breed", "sex", "birth_date", "weight", "color", "notes")
    fields = [f"{column} = %s" for column in editable if column in payload]
    values = [payload[column] for column in editable if column in payload]

    if fields:
        values.append(pet_id)
        with conn.cursor() as cursor:
            cursor.execute(
                f"UPDATE pets SET {', '.join(fields)} WHERE id = %s",
                values,
            )

    return get_pet(conn, pet_id)


def delete_pet(conn, pet_id: int) -> None:
    """Elimina la mascota. Las citas e historias se borran en cascada (FK)."""
    get_pet(conn, pet_id)

    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM pets WHERE id = %s", (pet_id,))