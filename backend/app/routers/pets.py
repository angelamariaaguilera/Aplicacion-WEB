"""Endpoints de mascotas."""

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.dependencies import get_current_user, get_db
from app.schemas.medical_record import MedicalRecordResponse
from app.schemas.pet import PetCreate, PetResponse, PetUpdate
from app.services import medical_record_service, pet_service

router = APIRouter(
    prefix="/pets",
    tags=["Pets"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[PetResponse], summary="Listar mascotas")
def list_pets(
    owner_id: int | None = Query(default=None, description="Filtra por propietario"),
    search: str | None = Query(default=None, description="Busca por nombre, especie, raza o propietario"),
    conn=Depends(get_db),
):
    return pet_service.list_pets(conn, owner_id=owner_id, search=search)


@router.get(
    "/{pet_id}/medical-records",
    response_model=list[MedicalRecordResponse],
    summary="Historial médico de una mascota",
)
def list_pet_medical_records(pet_id: int, conn=Depends(get_db)):
    # 404 si la mascota no existe.
    pet_service.get_pet(conn, pet_id)
    return medical_record_service.list_records(conn, pet_id=pet_id)


@router.get("/{pet_id}", response_model=PetResponse, summary="Ver una mascota")
def get_pet(pet_id: int, conn=Depends(get_db)):
    return pet_service.get_pet(conn, pet_id)


@router.post(
    "",
    response_model=PetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear mascota",
)
def create_pet(payload: PetCreate, conn=Depends(get_db)):
    return pet_service.create_pet(conn, payload.model_dump())


@router.put("/{pet_id}", response_model=PetResponse, summary="Actualizar mascota")
def update_pet(pet_id: int, payload: PetUpdate, conn=Depends(get_db)):
    return pet_service.update_pet(conn, pet_id, payload.model_dump(exclude_unset=True))


@router.delete(
    "/{pet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar mascota",
)
def delete_pet(pet_id: int, conn=Depends(get_db)):
    pet_service.delete_pet(conn, pet_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)