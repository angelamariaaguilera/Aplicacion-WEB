"""Endpoints de veterinarios."""

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user, get_db
from app.schemas.veterinarian import (
    VeterinarianCreate,
    VeterinarianResponse,
    VeterinarianUpdate,
)
from app.services import veterinarian_service

router = APIRouter(
    prefix="/veterinarians",
    tags=["Veterinarians"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[VeterinarianResponse], summary="Listar veterinarios")
def list_veterinarians(
    only_active: bool = Query(default=False),
    search: str | None = Query(default=None),
    conn=Depends(get_db),
):
    return veterinarian_service.list_veterinarians(conn, only_active=only_active, search=search)


@router.get("/{vet_id}", response_model=VeterinarianResponse, summary="Ver un veterinario")
def get_veterinarian(vet_id: int, conn=Depends(get_db)):
    return veterinarian_service.get_veterinarian(conn, vet_id)


@router.post(
    "",
    response_model=VeterinarianResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear veterinario",
)
def create_veterinarian(payload: VeterinarianCreate, conn=Depends(get_db)):
    return veterinarian_service.create_veterinarian(conn, payload.model_dump())


@router.put("/{vet_id}", response_model=VeterinarianResponse, summary="Actualizar veterinario")
def update_veterinarian(vet_id: int, payload: VeterinarianUpdate, conn=Depends(get_db)):
    return veterinarian_service.update_veterinarian(
        conn, vet_id, payload.model_dump(exclude_unset=True)
    )


@router.delete(
    "/{vet_id}",
    response_model=VeterinarianResponse,
    summary="Desactivar veterinario",
    description="No se borra físicamente: se marca is_active = FALSE para no perder el historial clínico.",
)
def deactivate_veterinarian(vet_id: int, conn=Depends(get_db)):
    return veterinarian_service.deactivate_veterinarian(conn, vet_id)