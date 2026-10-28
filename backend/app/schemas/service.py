"""Schemas de servicios."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def validate_price(value: Decimal) -> Decimal:
    """Regla de negocio 5: el precio no puede ser negativo."""
    if value < 0:
        raise ValueError("El precio no puede ser negativo")
    return value


class ServiceBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    duration_minutes: int = Field(default=30, gt=0, le=1440)
    is_active: bool = True

    _check_price = field_validator("price")(validate_price)


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    duration_minutes: int | None = Field(default=None, gt=0, le=1440)
    is_active: bool | None = None

    _check_price = field_validator("price")(lambda v: v if v is None else validate_price(v))


class ServiceResponse(ServiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointments_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None