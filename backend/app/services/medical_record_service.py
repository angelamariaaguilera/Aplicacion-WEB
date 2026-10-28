"""Servicio de historias clínicas.

Regla de negocio 8: al crear una historia clínica vinculada a una cita,
la cita se marca automáticamente como 'completed'.
"""

from app.database.helpers import raise_bad_request, raise_conflict, raise_not_found
from app.services import appointment_service

RECORD_SELECT = """
    SELECT m.id,
           m.pet_id,
           m.veterinarian_id,
           m.appointment_id,
           m.consultation_date,
           m.symptoms,
           m.diagnosis,
           m.treatment,
           m.observations,
           m.weight,
           m.created_at,
           m.updated_at,
           pet.id      AS pet_id_ref,
           pet.name    AS pet_name,
           pet.species AS pet_species,
           pet.breed   AS pet_breed,
           v.id        AS vet_id_ref,
           v.first_name || ' ' || v.last_name AS vet_full_name,
           v.specialty AS vet_specialty,
           a.id        AS appointment_id_ref,
           a.appointment_date AS appointment_date,
           a.appointment_time AS appointment_time,
           a.status    AS appointment_status
    FROM medical_records m
    JOIN pets pet          ON pet.id = m.pet_id
    JOIN veterinarians v   ON v.id = m.veterinarian_id
    LEFT JOIN appointments a ON a.id = m.appointment_id
"""


def _shape(row: dict) -> dict:
    """Convierte la fila plana del JOIN en la respuesta anidada."""
    if row is None:
        return row

    appointment = None
    if row.get("appointment_id_ref") is not None:
        appointment = {
            "id": row["appointment_id_ref"],
            "appointment_date": row["appointment_date"],
            "appointment_time": row["appointment_time"],
            "status": row["appointment_status"],
        }

    return {
        "id": row["id"],
        "consultation_date": row["consultation_date"],
        "symptoms": row["symptoms"],
        "diagnosis": row["diagnosis"],
        "treatment": row["treatment"],
        "observations": row["observations"],
        "weight": row["weight"],
        "pet": {
            "id": row["pet_id_ref"],
            "name": row["pet_name"],
            "species": row["pet_species"],
            "breed": row["pet_breed"],
        },
        "veterinarian": {
            "id": row["vet_id_ref"],
            "full_name": row["vet_full_name"],
            "specialty": row["vet_specialty"],
        },
        "appointment": appointment,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _validate_references(conn, payload: dict) -> None:
    """Verifica mascota, veterinario y (si viene) cita."""
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

        appointment_id = payload.get("appointment_id")
        if appointment_id is not None:
            cursor.execute(
                "SELECT id, pet_id FROM appointments WHERE id = %s",
                (appointment_id,),
            )
            appointment = cursor.fetchone()
            if appointment is None:
                raise_conflict("La cita indicada no existe")
            if appointment["pet_id"] != payload["pet_id"]:
                raise_bad_request("La cita indicada pertenece a otra mascota")


def list_records(conn, pet_id: int | None = None, veterinarian_id: int | None = None) -> list[dict]:
    conditions, params = [], []

    if pet_id is not None:
        conditions.append("m.pet_id = %s")
        params.append(pet_id)

    if veterinarian_id is not None:
        conditions.append("m.veterinarian_id = %s")
        params.append(veterinarian_id)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with conn.cursor() as cursor:
        cursor.execute(
            RECORD_SELECT + where_clause + " ORDER BY m.consultation_date DESC",
            params,
        )
        return [_shape(row) for row in cursor.fetchall()]


def get_record(conn, record_id: int) -> dict:
    with conn.cursor() as cursor:
        cursor.execute(RECORD_SELECT + " WHERE m.id = %s", (record_id,))
        row = cursor.fetchone()

    if row is None:
        raise_not_found("Medical record")

    return _shape(row)


def create_record(conn, payload: dict) -> dict:
    _validate_references(conn, payload)

    with conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO medical_records
                (pet_id, veterinarian_id, appointment_id, consultation_date,
                 symptoms, diagnosis, treatment, observations, weight)
            VALUES (%s, %s, %s, COALESCE(%s, CURRENT_TIMESTAMP), %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                payload["pet_id"],
                payload["veterinarian_id"],
                payload.get("appointment_id"),
                payload.get("consultation_date"),
                payload.get("symptoms"),
                payload.get("diagnosis"),
                payload.get("treatment"),
                payload.get("observations"),
                payload.get("weight"),
            ),
        )
        new_id = cursor.fetchone()["id"]

    # Regla de negocio 8: la cita atendida queda completada.
    if payload.get("appointment_id"):
        appointment_service.update_status(conn, payload["appointment_id"], "completed")

    return get_record(conn, new_id)


def update_record(conn, record_id: int, payload: dict) -> dict:
    get_record(conn, record_id)

    if "veterinarian_id" in payload:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, is_active FROM veterinarians WHERE id = %s",
                (payload["veterinarian_id"],),
            )
            vet = cursor.fetchone()
            if vet is None:
                raise_conflict("El veterinario indicado no existe")
            if not vet["is_active"]:
                raise_conflict("El veterinario indicado está inactivo")

    editable = (
        "veterinarian_id",
        "appointment_id",
        "consultation_date",
        "symptoms",
        "diagnosis",
        "treatment",
        "observations",
        "weight",
    )
    fields = [f"{column} = %s" for column in editable if column in payload]
    values = [payload[column] for column in editable if column in payload]

    if fields:
        values.append(record_id)
        with conn.cursor() as cursor:
            cursor.execute(
                f"UPDATE medical_records SET {', '.join(fields)} WHERE id = %s",
                values,
            )

    return get_record(conn, record_id)