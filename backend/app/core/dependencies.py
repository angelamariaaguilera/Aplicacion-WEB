"""Dependencias de FastAPI: conexión a DB, usuario autenticado y roles."""

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database.connection import get_connection
from app.core.security import decode_access_token

# auto_error=False para manejar nosotros mismos el token ausente.
bearer_scheme = HTTPBearer(auto_error=False)


def get_db():
    """Entrega una conexión psycopg y garantiza commit/rollback/cierre."""
    with get_connection() as conn:
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    conn=Depends(get_db),
) -> dict:
    """Devuelve el usuario autenticado a partir del token JWT."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise unauthorized

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise unauthorized

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

    if user is None or not user["is_active"]:
        raise unauthorized

    return user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Restringe el endpoint a usuarios con rol admin."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador para esta operación",
        )
    return current_user