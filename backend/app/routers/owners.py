"""Endpoints de propietarios."""

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.dependencies import get_current_user, get_db
from app.schemas.owner import OwnerCreate, OwnerResponse, OwnerUpdate
from app.services import owner_service

router = APIRouter(
    prefix="/owners",
    tags=["Owners"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[OwnerResponse], summary="Listar propietarios")
def list_owners(
    search: str | None = Query(default=None, description="Busca por nombre, apellido, documento o teléfono"),
    conn=Depends(get_db),
):
    return owner_service.list_owners(conn, search=search)


@router.get("/{owner_id}", response_model=OwnerResponse, summary="Ver un propietario")
def get_owner(owner_id: int, conn=Depends(get_db)):
    return owner_service.get_owner(conn, owner_id)


@router.post(
    "",
    response_model=OwnerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear propietario",
)
def create_owner(payload: OwnerCreate, conn=Depends(get_db)):
    return owner_service.create_owner(conn, payload.model_dump())


@router.put("/{owner_id}", response_model=OwnerResponse, summary="Actualizar propietario")
def update_owner(owner_id: int, payload: OwnerUpdate, conn=Depends(get_db)):
    return owner_service.update_owner(conn, owner_id, payload.model_dump(exclude_unset=True))


@router.delete(
    "/{owner_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar propietario",
    description="Devuelve 409 si el propietario tiene mascotas asociadas.",
)
def delete_owner(owner_id: int, conn=Depends(get_db)):
    owner_service.delete_owner(conn, owner_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)