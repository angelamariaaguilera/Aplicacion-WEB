"""Schemas de mascotas."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

PetSex = str | None  # "male" | "female"


def validate_weight(value: Decimal | None) -> Decimal | None:
    """Regla de negocio 4: el peso debe ser mayor que cero."""
    if value is not None and value <= 0:
        raise ValueError("El peso debe ser mayor que 0")
    return value


class PetBase(BaseModel):
    owner_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=80)
    species: str = Field(min_length=1, max_length=50)
    breed: str | None = Field(default=None, max_length=80)
    sex: str | None = Field(default=None, pattern="^(male|female)$")
    birth_date: date | None = None
    weight: Decimal | None = Field(default=None, gt=0, decimal_places=2, max_digits=6)
    color: str | None = Field(default=None, max_length=50)
    notes: str | None = None

    _check_weight = field_validator("weight")(validate_weight)


class PetCreate(PetBase):
    pass


class PetUpdate(BaseModel):
    owner_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=80)
    species: str | None = Field(default=None, min_length=1, max_length=50)
    breed: str | None = Field(default=None, max_length=80)
    sex: str | None = Field(default=None, pattern="^(male|female)$")
    birth_date: date | None = None
    weight: Decimal | None = Field(default=None, gt=0, decimal_places=2, max_digits=6)
    color: str | None = Field(default=None, max_length=50)
    notes: str | None = None

    _check_weight = field_validator("weight")(validate_weight)


class OwnerBrief(BaseModel):
    id: int
    full_name: str
    phone: str
    email: str | None = None


class PetResponse(PetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    age_months: int | None = None
    owner: OwnerBrief | None = None
    appointments_count: int = 0
    medical_records_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None