"""Endpoints de autenticación."""

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user, get_db
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Iniciar sesión",
    description="Recibe email y contraseña, y devuelve un token JWT junto con los datos del usuario.",
)
def login(payload: LoginRequest, conn=Depends(get_db)):
    return auth_service.authenticate(conn, payload.email, payload.password)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Perfil del usuario autenticado",
)
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user