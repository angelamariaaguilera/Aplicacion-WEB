"""Hash de contraseñas y creación/verificación de tokens JWT."""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# bcrypt no procesa contraseñas de más de 72 bytes; configuramos el contexto
# para que las rechace en lugar de truncarlas silenciosamente.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=True)


def hash_password(plain_password: str) -> str:
    """Devuelve el hash bcrypt de una contraseña en texto plano."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Comprueba si una contraseña coincide con su hash."""
    try:
        return pwd_context.verify(plain_password, password_hash)
    except ValueError:
        # Hash mal formado en base de datos: se trata como credencial inválida.
        return False


def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    """Crea un JWT con el id del usuario como subject."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict = {"sub": str(subject), "exp": expires_at}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict | None:
    """Decodifica y valida un JWT. Devuelve None si el token no es válido."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None