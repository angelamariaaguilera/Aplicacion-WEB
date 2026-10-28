"""Servicio del dashboard: agregaciones para la pantalla de inicio."""

from datetime import date, timedelta

RECENT_ACTIVITY_LIMIT = 8
UPCOMING_LIMIT = 6


def get_dashboard_summary(conn) -> dict:
    """Devuelve tarjetas de conteo, próximas citas, actividad y distribución por estado."""
    today = date.today()

    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM pets)                        AS pets_count,
                (SELECT COUNT(*) FROM owners)                      AS owners_count,
                (SELECT COUNT(*) FROM appointments
                    WHERE appointment_date = CURRENT_DATE
                      AND status <> 'cancelled')                  AS appointments_today,
                (SELECT COUNT(*) FROM veterinarians
                    WHERE is_active = TRUE)                       AS active_veterinarians,
                (SELECT COUNT(*) FROM pets
                    WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS new_pets_this_month,
                (SELECT COUNT(*) FROM services
                    WHERE is_active = TRUE)                       AS active_services
            """
        )
        totals = cursor.fetchone()

        cursor.execute(
            """
            SELECT a.id,
                   a.appointment_date,
                   a.appointment_time,
                   a.status,
                   pet.name AS pet_name,
                   o.first_name || ' ' || o.last_name AS owner_full_name,
                   v.first_name || ' ' || v.last_name AS vet_full_name,
                   s.name AS service_name
            FROM appointments a
            JOIN pets pet        ON pet.id = a.pet_id
            JOIN owners o        ON o.id = pet.owner_id
            JOIN veterinarians v ON v.id = a.veterinarian_id
            JOIN services s      ON s.id = a.service_id
            WHERE a.appointment_date >= CURRENT_DATE
              AND a.status IN ('scheduled', 'confirmed')
            ORDER BY a.appointment_date, a.appointment_time
            LIMIT %s
            """,
            (UPCOMING_LIMIT,),
        )
        upcoming = cursor.fetchall()

        cursor.execute(
            """
            SELECT a.id,
                   a.appointment_date,
                   a.status,
                   a.created_at,
                   pet.name AS pet_name,
                   o.first_name || ' ' || o.last_name AS owner_full_name
            FROM appointments a
            JOIN pets pet ON pet.id = a.pet_id
            JOIN owners o ON o.id = pet.owner_id
            WHERE a.created_at >= %s
            ORDER BY a.created_at DESC
            LIMIT %s
            """,
            (today - timedelta(days=30), RECENT_ACTIVITY_LIMIT),
        )
        recent = cursor.fetchall()

        cursor.execute(
            """
            SELECT status, COUNT(*) AS total
            FROM appointments
            WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY status
            ORDER BY total DESC
            """
        )
        distribution = cursor.fetchall()

    counts = {row["status"]: row["total"] for row in distribution}
    ordered_distribution = [
        {"status": status, "total": counts.get(status, 0)}
        for status in ("scheduled", "confirmed", "completed", "cancelled")
    ]

    return {
        "totals": totals,
        "upcoming_appointments": upcoming,
        "recent_activity": recent,
        "appointments_by_status": ordered_distribution,
        "generated_at": today,
    }