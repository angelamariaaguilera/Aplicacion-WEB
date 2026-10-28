"""Servicio de citas: aquí viven las reglas de negocio 1, 2, 3 y 7.

La consulta principal usa JOIN reales para devolver la cita con la
mascota, el propietario, el veterinario y el servicio ya anidados.
"""

from psycopg import errors as pg_errors

from app.database.helpers import raise_conflict, raise_not_found

APPOINTMENT_SELECT = """
    SELECT a.id,
           a.pet_id,
           a.veterinarian_id,
           a.service_id,
           a.appointment_date,
           a.appointment_time,
           a.status,
           a.reason,
           a.notes,
           a.created_at,
           a.updated_at,
           pet.id            AS pet_id_ref,
           pet.name          AS pet_name,
           pet.species       AS pet_species,
           o.id              AS owner_id_ref,
           o.first_name || ' ' || o.last_name AS owner_full_name,
           o.phone           AS owner_phone,
           v.id              AS vet_id_ref,
           v.first_name || ' ' || v.last_name AS vet_full_name,
           v.specialty       AS vet_specialty,
           s.id              AS service_id_ref,
           s.name            AS service_name,
           s.price           AS service_price,
           s.duration_minutes AS service_duration,
           EXISTS (SELECT 1 FROM medical_records m WHERE m.appointment_id = a.id)
               AS has_medical_record
    FROM appointments a
    JOIN pets pet           ON pet.id = a.pet_id
    JOIN owners o           ON o.id = pet.owner_id
    JOIN veterinarians v    ON v.id = a.veterinarian_id
    JOIN services s         ON s.id = a.service_id
"""


def _shape(row: dict) -> dict:
    """Convierte la fila plana del JOIN en la respuesta anidada de la API."""
    if row is None:
        return row

    return {
        "id": row["id"],
        "appointment_date": row["appointment_date"],
        "appointment_time": row["appointment_time"],
        "status": row["status"],
        "reason": row["reason"],
        "notes": row["notes"],
        "pet": {
            "id": row["pet_id_ref"],
            "name": row["pet_name"],
            "species": row["pet_species"],
        },
        "owner": {
            "id": row["owner_id_ref"],
            "full_name": row["owner_full_name"],
            "phone": row["owner_phone"],
        },
        "veterinarian": {
            "id": row["vet_id_ref"],
            "full_name": row["vet_full_name"],
            "specialty": row["vet_specialty"],
        },
        "service": {
            "id": row["service_id_ref"],
            "name": row["service_name"],
            "price": row["service_price"],
            "duration_minutes": row["service_duration"],
        },
        "has_medical_record": row["has_medical_record"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _validate_references(conn, payload: dict) -> None:
    """Reglas 1, 2 y 3: mascota, veterinario y servicio deben ser válidos."""
    with conn.cursor() as cursor:
        cursor.execute("SELECT id FROM pets WHERE id = %s", (payload["pet_id"],))
        if cursor.fetchone() is None:
            raise_conflict("La mascota indicada no existe")

        cursor.execute(
            "SELECT id, is_active FROM veterinarians WHERE id = %s",
            (payload["veterinarian_id"],),
        )
        vet = cursor.fetchone()
        if vet is None:
            raise_conflict("El veterinario indicado no existe")
        if not vet["is_active"]:
            raise_conflict("El veterinario indicado está inactivo")

        cursor.execute(
            "SELECT id, is_active FROM services WHERE id = %s",
            (payload["service_id"],),
        )
        service = cursor.fetchone()
        if service is None:
            raise_conflict("El servicio indicado no existe")
        if not service["is_active"]:
            raise_conflict("El servicio indicado está inactivo")


def _check_slot_available(
    conn,
    veterinarian_id: int,
    appointment_date,
    appointment_time,
    exclude_id: int | None = None,
) -> None:
    """Regla 7: un veterinario no puede tener dos citas activas en el mismo horario."""
    query = """
        SELECT COUNT(*) AS total
        FROM appointments
        WHERE veterinarian_id = %s
          AND appointment_date = %s
          AND appointment_time = %s
          AND status <> 'cancelled'
    """
    params: list = [veterinarian_id, appointment_date, appointment_time]

    if exclude_id is not None:
        query += " AND id <> %s"
        params.append(exclude_id)

    with conn.cursor() as cursor:
        cursor.execute(query, params)
        total = cursor.fetchone()["total"]

    if total > 0:
        raise_conflict("El veterinario ya tiene una cita agendada en esa fecha y hora")


def list_appointments(
    conn,
    date_filter=None,
    status: str | None = None,
    veterinarian_id: int | None = None,
    pet_id: int | None = None,
) -> list[dict]:
    conditions, params = [], []

    if date_filter is not None:
        conditions.append("a.appointment_date = %s")
        params.append(date_filter)

    if status:
        conditions.append("a.status = %s")
        params.append(status)

    if veterinarian_id is not None:
        conditions.append("a.veterinarian_id = %s")
        params.append(veterinarian_id)

    if pet_id is not None:
        conditions.append("a.pet_id = %s")
        params.append(pet_id)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with conn.cursor() as cursor:
        cursor.execute(
            APPOINTMENT_SELECT + where_clause + " ORDER BY a.appointment_date, a.appointment_time",
            params,
        )
        return [_shape(row) for row in cursor.fetchall()]


def get_appointment(conn, appointment_id: int) -> dict:
    with conn.cursor() as cursor:
        cursor.execute(APPOINTMENT_SELECT + " WHERE a.id = %s", (appointment_id,))
        row = cursor.fetchone()

    if row is None:
        raise_not_found("Appointment")

    return _shape(row)


def create_appointment(conn, payload: dict) -> dict:
    _validate_references(conn, payload)
    _check_slot_available(
        conn,
        payload["veterinarian_id"],
        payload["appointment_date"],
        payload["appointment_time"],
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO appointments
                    (pet_id, veterinarian_id, service_id,
                     appointment_date, appointment_time, status, reason, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    payload["pet_id"],
                    payload["veterinarian_id"],
                    payload["service_id"],
                    payload["appointment_date"],
                    payload["appointment_time"],
                    payload.get("status", "scheduled"),
                    payload.get("reason"),
                    payload.get("notes"),
                ),
            )
            new_id = cursor.fetchone()["id"]
    except pg_errors.UniqueViolation:
        # Red de seguridad por si el índice único salta entre la validación
        # y el INSERT (carrera con otra petición simultánea).
        raise_conflict("El veterinario ya tiene una cita agendada en esa fecha y hora")

    return get_appointment(conn, new_id)


def update_appointment(conn, appointment_id: int, payload: dict) -> dict:
    current = get_appointment(conn, appointment_id)

    merged = {
        "pet_id": payload.get("pet_id", current["pet"]["id"]),
        "veterinarian_id": payload.get("veterinarian_id", current["veterinarian"]["id"]),
        "service_id": payload.get("service_id", current["service"]["id"]),
        "appointment_date": payload.get("appointment_date", current["appointment_date"]),
        "appointment_time": payload.get("appointment_time", current["appointment_time"]),
        "status": payload.get("status", current["status"]),
    }

    _validate_references(conn, merged)
    _check_slot_available(
        conn,
        merged["veterinarian_id"],
        merged["appointment_date"],
        merged["appointment_time"],
        exclude_id=appointment_id,
    )

    editable = (
        "pet_id",
        "veterinarian_id",
        "service_id",
        "appointment_date",
        "appointment_time",
        "status",
        "reason",
        "notes",
    )
    fields = [f"{column} = %s" for column in editable if column in payload]
    values = [payload[column] for column in editable if column in payload]

    if fields:
        values.append(appointment_id)
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"UPDATE appointments SET {', '.join(fields)} WHERE id = %s",
                    values,
                )
        except pg_errors.UniqueViolation:
            raise_conflict("El veterinario ya tiene una cita agendada en esa fecha y hora")

    return get_appointment(conn, appointment_id)


def update_status(conn, appointment_id: int, new_status: str) -> dict:
    """PATCH /appointments/{id}/status"""
    get_appointment(conn, appointment_id)

    # Al volver a una cita activa puede haber colisión de horario.
    if new_status != "cancelled":
        current = get_appointment(conn, appointment_id)
        _check_slot_available(
            conn,
            current["veterinarian"]["id"],
            current["appointment_date"],
            current["appointment_time"],
            exclude_id=appointment_id,
        )

    with conn.cursor() as cursor:
        cursor.execute(
            "UPDATE appointments SET status = %s WHERE id = %s",
            (new_status, appointment_id),
        )

    return get_appointment(conn, appointment_id)


def delete_appointment(conn, appointment_id: int) -> None:
    get_appointment(conn, appointment_id)

    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM appointments WHERE id = %s", (appointment_id,))


def list_appointments_for_pet(conn, pet_id: int) -> list[dict]:
    """Citas de una mascota, útil en la pantalla de detalle."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, appointment_date, appointment_time, status, reason, notes
            FROM appointments
            WHERE pet_id = %s
            ORDER BY appointment_date DESC, appointment_time DESC
            """,
            (pet_id,),
        )
        return cursor.fetchall()