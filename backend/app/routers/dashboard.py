"""Endpoints del dashboard."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_db
from app.services import dashboard_service

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "",
    summary="Resumen para la pantalla de inicio",
    description="Devuelve los contadores, las próximas citas, la actividad reciente "
    "y la distribución de citas por estado.",
)
def get_dashboard(conn=Depends(get_db)):
    return dashboard_service.get_dashboard_summary(conn)