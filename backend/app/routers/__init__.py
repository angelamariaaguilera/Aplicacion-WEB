"""Routers de la API VetCare."""

from app.routers import (
    appointments,
    auth,
    dashboard,
    medical_records,
    owners,
    pets,
    services,
    veterinarians,
)

# Lista central de routers que se registran en main.py.
all_routers = [
    auth.router,
    owners.router,
    pets.router,
    veterinarians.router,
    services.router,
    appointments.router,
    medical_records.router,
    dashboard.router,
]