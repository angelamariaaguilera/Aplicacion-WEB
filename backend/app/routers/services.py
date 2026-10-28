"""Endpoints de servicios de la clínica."""

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user, get_db
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate
from app.services import service_service

router = APIRouter(
    prefix="/services",
    tags=["Services"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[ServiceResponse], summary="Listar servicios")
def list_services(
    only_active: bool = Query(default=False),
    search: str | None = Query(default=None),
    conn=Depends(get_db),
):
    return service_service.list_services(conn, only_active=only_active, search=search)


@router.get("/{service_id}", response_model=ServiceResponse, summary="Ver un servicio")
def get_service(service_id: int, conn=Depends(get_db)):
    return service_service.get_service(conn, service_id)


@router.post(
    "",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear servicio",
)
def create_service(payload: ServiceCreate, conn=Depends(get_db)):
    return service_service.create_service(conn, payload.model_dump())


@router.put("/{service_id}", response_model=ServiceResponse, summary="Actualizar servicio")
def update_service(service_id: int, payload: ServiceUpdate, conn=Depends(get_db)):
    return service_service.update_service(conn, service_id, payload.model_dump(exclude_unset=True))