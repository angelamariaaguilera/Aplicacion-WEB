"""Schemas de citas."""

from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ALLOWED_STATUSES = ("scheduled", "confirmed", "completed", "cancelled")


def _validate_status(value: str | None) -> str | None:
    """Regla de negocio 6: el estado debe pertenecer al conjunto permitido."""
    if value is not None and value not in ALLOWED_STATUSES:
        raise ValueError(f"status debe ser uno de: {', '.join(ALLOWED_STATUSES)}")
    return value


class AppointmentBase(BaseModel):
    pet_id: int = Field(gt=0)
    veterinarian_id: int = Field(gt=0)
    service_id: int = Field(gt=0)
    appointment_date: date
    appointment_time: time
    status: str = "scheduled"
    reason: str | None = None
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def check_status(cls, value: str) -> str:
        _validate_status(value)
        return value


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    pet_id: int | None = Field(default=None, gt=0)
    veterinarian_id: int | None = Field(default=None, gt=0)
    service_id: int | None = Field(default=None, gt=0)
    appointment_date: date | None = None
    appointment_time: time | None = None
    status: str | None = None
    reason: str | None = None
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def check_status(cls, value: str | None) -> str | None:
        _validate_status(value)
        return value


class AppointmentStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def check_status(cls, value: str) -> str:
        _validate_status(value)
        return value


class PetBrief(BaseModel):
    id: int
    name: str
    species: str


class OwnerBrief(BaseModel):
    id: int
    full_name: str
    phone: str | None = None


class VeterinarianBrief(BaseModel):
    id: int
    full_name: str
    specialty: str | None = None


class ServiceBrief(BaseModel):
    id: int
    name: str
    price: Decimal
    duration_minutes: int


class AppointmentResponse(BaseModel):
    """Cita enriquecida con JOIN a mascota, propietario, veterinario y servicio."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_date: date
    appointment_time: time
    status: str
    reason: str | None = None
    notes: str | None = None
    pet: PetBrief | None = None
    owner: OwnerBrief | None = None
    veterinarian: VeterinarianBrief | None = None
    service: ServiceBrief | None = None
    has_medical_record: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None