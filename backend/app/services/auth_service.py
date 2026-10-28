"""Servicio de autenticación: verifica credenciales y emite el token."""

from fastapi import HTTPException, status

from app.core.security import create_access_token, verify_password
from app.schemas.auth import LoginResponse, UserResponse


def authenticate(conn, email: str, password: str) -> LoginResponse:
    """Valida email/contraseña y devuelve token + datos del usuario."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, full_name, email, password_hash, role, is_active
            FROM users
            WHERE email = lower(%s)
            """,
            (email,),
        )
        user = cursor.fetchone()

    # Mismo mensaje para usuario inexistente y contraseña incorrecta:
    # no revela qué emails están registrados.
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Correo o contraseña incorrectos",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if user is None or not verify_password(password, user["password_hash"]):
        raise invalid

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está inactivo. Contacta al administrador.",
        )

    token = create_access_token(subject=user["id"], extra_claims={"role": user["role"]})

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            full_name=user["full_name"],
            email=user["email"],
            role=user["role"],
            is_active=user["is_active"],
        ),
    )


def get_user_profile(conn, user_id: int) -> UserResponse:
    """Devuelve el perfil del usuario autenticado."""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, full_name, email, role, is_active
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        )
        user = cursor.fetchone()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse(**user)