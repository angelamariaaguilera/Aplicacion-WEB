"""Configuración de la aplicación, leída desde el archivo .env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/vetcare_db"
    secret_key: str = "cambia-esta-clave-por-una-larga-y-aleatoria"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # Lista de orígenes permitidos para CORS.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()