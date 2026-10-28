"""Endpoints de citas."""

from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.dependencies import get_current_user, get_db
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    AppointmentUpdate,
)
from app.services import appointment_service

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[AppointmentResponse], summary="Listar citas")
def list_appointments(
    date_: date | None = Query(default=None, alias="date", description="Filtra por fecha (YYYY-MM-DD)"),
    status_: str | None = Query(default=None, alias="status"),
    veterinarian_id: int | None = Query(default=None),
    pet_id: int | None = Query(default=None),
    conn=Depends(get_db),
):
    return appointment_service.list_appointments(
        conn,
        date_filter=date_,
        status=status_,
        veterinarian_id=veterinarian_id,
        pet_id=pet_id,
    )


@router.get("/{appointment_id}", response_model=AppointmentResponse, summary="Ver una cita")
def get_appointment(appointment_id: int, conn=Depends(get_db)):
    return appointment_service.get_appointment(conn, appointment_id)


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agendar cita",
    description="Valida que la mascota, el veterinario y el servicio existan y estén activos, "
    "y que el veterinario no tenga otra cita en ese horario.",
)
def create_appointment(payload: AppointmentCreate, conn=Depends(get_db)):
    return appointment_service.create_appointment(conn, payload.model_dump())


@router.put("/{appointment_id}", response_model=AppointmentResponse, summary="Actualizar cita")
def update_appointment(appointment_id: int, payload: AppointmentUpdate, conn=Depends(get_db)):
    return appointment_service.update_appointment(
        conn, appointment_id, payload.model_dump(exclude_unset=True)
    )


@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
    summary="Cambiar el estado de una cita",
)
def update_appointment_status(
    appointment_id: int, payload: AppointmentStatusUpdate, conn=Depends(get_db)
):
    return appointment_service.update_status(conn, appointment_id, payload.status)


@router.delete(
    "/{appointment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar cita",
)
def delete_appointment(appointment_id: int, conn=Depends(get_db)):
    appointment_service.delete_appointment(conn, appointment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)