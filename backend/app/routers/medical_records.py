"""Endpoints de historias clínicas."""

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user, get_db
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordResponse,
    MedicalRecordUpdate,
)
from app.services import medical_record_service

router = APIRouter(
    prefix="/medical-records",
    tags=["Medical Records"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[MedicalRecordResponse], summary="Listar historias clínicas")
def list_medical_records(
    pet_id: int | None = Query(default=None),
    veterinarian_id: int | None = Query(default=None),
    conn=Depends(get_db),
):
    return medical_record_service.list_records(
        conn, pet_id=pet_id, veterinarian_id=veterinarian_id
    )


@router.get("/{record_id}", response_model=MedicalRecordResponse, summary="Ver una historia clínica")
def get_medical_record(record_id: int, conn=Depends(get_db)):
    return medical_record_service.get_record(conn, record_id)


@router.post(
    "",
    response_model=MedicalRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar historia clínica",
    description="Si se vincula a una cita, la cita queda automáticamente en estado 'completed'.",
)
def create_medical_record(payload: MedicalRecordCreate, conn=Depends(get_db)):
    return medical_record_service.create_record(conn, payload.model_dump())


@router.put("/{record_id}", response_model=MedicalRecordResponse, summary="Actualizar historia clínica")
def update_medical_record(record_id: int, payload: MedicalRecordUpdate, conn=Depends(get_db)):
    return medical_record_service.update_record(
        conn, record_id, payload.model_dump(exclude_unset=True)
    )